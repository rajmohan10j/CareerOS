"""
CareerOS LinkedIn Bridge Runner
Executed inside the C:\\Users\\Raj\\tools\\linkedin-mcp-server environment.
Provides JSON-RPC CLI interface for all LinkedIn capabilities.
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path


def get_status():
    profile_dir = Path.home() / ".linkedin-mcp" / "profile"
    cookies_path = Path.home() / ".linkedin-mcp" / "cookies.json"
    source_state_path = Path.home() / ".linkedin-mcp" / "source-state.json"

    available = profile_dir.exists() and cookies_path.exists()
    logged_in = False
    details = "Session initialized"

    if cookies_path.exists():
        try:
            with open(cookies_path, "r", encoding="utf-8") as f:
                cookies = json.load(f)
                cookie_names = [c.get("name") for c in cookies if isinstance(c, dict)]
                if "li_at" in cookie_names or "JSESSIONID" in cookie_names:
                    logged_in = True
                    details = "Authenticated session active"
                else:
                    details = "Cookies present but missing li_at/JSESSIONID"
        except Exception as e:
            details = f"Error reading cookies: {e}"
    else:
        details = "No cookies.json found in .linkedin-mcp"

    return {
        "available": available,
        "logged_in": logged_in,
        "profile_path": str(profile_dir),
        "cookies_path": str(cookies_path),
        "message": details,
    }


async def run_search_jobs(args):
    from linkedin_mcp_server.dependencies import get_ready_extractor
    from linkedin_mcp_server.drivers.browser import close_browser

    try:
        extractor = await get_ready_extractor(None, tool_name="search_jobs")
        result = await extractor.search_jobs(
            keywords=args.keywords,
            location=args.location,
            max_pages=args.max_pages,
            date_posted=args.date_posted,
            job_type=args.job_type,
            experience_level=args.experience_level,
            work_type=args.work_type,
            easy_apply=args.easy_apply,
            sort_by=args.sort_by,
        )

        job_ids = result.get("job_ids", [])
        sections = result.get("sections", {})
        raw_text = sections.get("search_results", "")

        jobs_list = []
        for jid in job_ids:
            try:
                job_res = await asyncio.wait_for(extractor.read_job(jid), timeout=8.0)
                raw_job = job_res.get("sections", {}).get("job_posting", "")
                lines = [line.strip() for line in raw_job.split("\n") if line.strip()]
                company = lines[0] if len(lines) > 0 else "Unknown Company"
                title = lines[1] if len(lines) > 1 else "Job Opportunity"
                location = lines[2] if len(lines) > 2 else (args.location or "Unspecified")

                apply_type = "external"
                apply_url = f"https://www.linkedin.com/jobs/view/{jid}/"
                try:
                    apply_info = await asyncio.wait_for(extractor.get_job_apply_url(jid), timeout=4.0)
                    apply_data = apply_info.get("apply", {})
                    apply_type = apply_data.get("type", "external")
                    apply_url = apply_data.get("url", apply_url)
                except Exception:
                    pass

                jobs_list.append({
                    "job_id": str(jid),
                    "title": title,
                    "company": company,
                    "location": location,
                    "url": f"https://www.linkedin.com/jobs/view/{jid}/",
                    "apply_type": apply_type,
                    "apply_url": apply_url,
                    "snippet": raw_job[:500] if raw_job else "",
                })
            except Exception as e:
                jobs_list.append({
                    "job_id": str(jid),
                    "title": f"LinkedIn Job #{jid}",
                    "company": "LinkedIn Company",
                    "location": args.location or "Remote",
                    "url": f"https://www.linkedin.com/jobs/view/{jid}/",
                    "apply_type": "external",
                    "apply_url": f"https://www.linkedin.com/jobs/view/{jid}/",
                    "snippet": "",
                })

        return {
            "keywords": args.keywords,
            "location": args.location,
            "total_found": len(jobs_list),
            "jobs": jobs_list,
            "errors": [str(e) for e in result.get("section_errors", {}).values()] if "section_errors" in result else [],
        }
    finally:
        await close_browser()


async def run_get_job_details(args):
    from linkedin_mcp_server.dependencies import get_ready_extractor
    from linkedin_mcp_server.drivers.browser import close_browser

    try:
        extractor = await get_ready_extractor(None, tool_name="get_job_details")
        job_res = await extractor.read_job(args.job_id)
        raw_text = job_res.get("sections", {}).get("job_posting", "")
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]

        company = lines[0] if len(lines) > 0 else "Unknown Company"
        title = lines[1] if len(lines) > 1 else "Executive / Tech Role"
        location = lines[2] if len(lines) > 2 else "Unspecified"

        apply_type = "external"
        apply_url = f"https://www.linkedin.com/jobs/view/{args.job_id}/"
        try:
            apply_info = await extractor.get_job_apply_url(args.job_id)
            apply_data = apply_info.get("apply", {})
            apply_type = apply_data.get("type", "external")
            apply_url = apply_data.get("url", apply_url)
        except Exception:
            pass

        return {
            "job_id": str(args.job_id),
            "title": title,
            "company": company,
            "location": location,
            "url": f"https://www.linkedin.com/jobs/view/{args.job_id}/",
            "apply_type": apply_type,
            "apply_url": apply_url,
            "full_text": raw_text,
        }
    finally:
        await close_browser()


async def run_get_saved_jobs(args):
    from linkedin_mcp_server.dependencies import get_ready_extractor
    from linkedin_mcp_server.drivers.browser import close_browser

    try:
        extractor = await get_ready_extractor(None, tool_name="get_saved_jobs")
        result = await extractor.get_saved_jobs(max_pages=args.max_pages, stage=args.stage)
        job_ids = result.get("job_ids", [])
        saved_list = []
        for jid in job_ids:
            saved_list.append({
                "job_id": str(jid),
                "url": f"https://www.linkedin.com/jobs/view/{jid}/",
                "stage": args.stage,
            })
        return {
            "stage": args.stage,
            "total_found": len(saved_list),
            "jobs": saved_list,
        }
    finally:
        await close_browser()


def main():
    parser = argparse.ArgumentParser(description="LinkedIn Bridge Runner")
    parser.add_argument("--action", required=True, choices=["status", "search_jobs", "job_details", "saved_jobs"])
    parser.add_argument("--keywords", default="")
    parser.add_argument("--location", default=None)
    parser.add_argument("--max_pages", type=int, default=1)
    parser.add_argument("--date_posted", default=None)
    parser.add_argument("--job_type", default=None)
    parser.add_argument("--experience_level", default=None)
    parser.add_argument("--work_type", default=None)
    parser.add_argument("--easy_apply", action="store_true")
    parser.add_argument("--sort_by", default="date")
    parser.add_argument("--job_id", default="")
    parser.add_argument("--stage", default="saved")

    args = parser.parse_args()

    if args.action == "status":
        print(json.dumps(get_status(), ensure_ascii=False))
        return

    if args.action == "search_jobs":
        res = asyncio.run(run_search_jobs(args))
        print(json.dumps(res, ensure_ascii=False))
        return

    if args.action == "job_details":
        res = asyncio.run(run_get_job_details(args))
        print(json.dumps(res, ensure_ascii=False))
        return

    if args.action == "saved_jobs":
        res = asyncio.run(run_get_saved_jobs(args))
        print(json.dumps(res, ensure_ascii=False))
        return


if __name__ == "__main__":
    main()
