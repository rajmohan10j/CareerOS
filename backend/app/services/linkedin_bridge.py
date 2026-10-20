"""
CareerOS LinkedIn Bridge Service
Provides an asynchronous interface to the LinkedIn MCP runner subprocess,
using threadpool execution to guarantee Windows asyncio compatibility.
"""

import asyncio
import json
import logging
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

from app.schemas.linkedin import (
    LinkedInJobDetailResponse,
    LinkedInSearchRequest,
    LinkedInSearchResponse,
    LinkedInStatusResponse,
)

logger = logging.getLogger(__name__)

RUNNER_SCRIPT = Path(__file__).resolve().parent / "linkedin_bridge_runner.py"

# Path to the dedicated Python environment with patchright & linkedin-mcp-server
MCP_VENV_PYTHON = Path(r"C:\Users\Raj\tools\linkedin-mcp-server\.venv\Scripts\python.exe")


def _run_subprocess_sync(cmd: list[str], timeout: float) -> tuple[int, str, str]:
    """Execute subprocess synchronously; designed to be dispatched via asyncio.to_thread."""
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )
        return proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired:
        raise asyncio.TimeoutError(f"Process timed out after {timeout}s")
    except Exception as e:
        return 1, "", str(e)


class LinkedInBridge:
    def __init__(self, python_path: Path | None = None, runner_path: Path | None = None):
        self.python_path = python_path or MCP_VENV_PYTHON
        self.runner_path = runner_path or RUNNER_SCRIPT

    def _get_python_executable(self) -> str:
        if self.python_path.exists():
            return str(self.python_path)
        return sys.executable

    async def get_status(self) -> LinkedInStatusResponse:
        """Direct file and cookie inspection; instantaneous and 100% reliable without subprocess overhead."""
        profile_dir = Path.home() / ".linkedin-mcp" / "profile"
        cookies_path = Path.home() / ".linkedin-mcp" / "cookies.json"

        available = profile_dir.exists() and cookies_path.exists()
        logged_in = False
        message = "Session initialized"

        if cookies_path.exists():
            try:
                with open(cookies_path, "r", encoding="utf-8") as f:
                    cookies = json.load(f)
                    cookie_names = [c.get("name") for c in cookies if isinstance(c, dict)]
                    if "li_at" in cookie_names or "JSESSIONID" in cookie_names:
                        logged_in = True
                        message = "Authenticated session active"
                    else:
                        message = "Cookies present but missing li_at/JSESSIONID"
            except Exception as e:
                message = f"Error reading cookies: {e}"
        else:
            message = "No cookies.json found in .linkedin-mcp"

        return LinkedInStatusResponse(
            available=available,
            logged_in=logged_in,
            profile_path=str(profile_dir) if profile_dir.exists() else None,
            cookies_path=str(cookies_path) if cookies_path.exists() else None,
            message=message,
        )

    async def search_jobs(self, req: LinkedInSearchRequest, timeout: float = 45.0) -> dict[str, Any]:
        python_exe = self._get_python_executable()
        cmd = [
            python_exe,
            str(self.runner_path),
            "--action",
            "search_jobs",
            "--keywords",
            req.keywords,
            "--max_pages",
            str(req.max_pages),
        ]
        if req.location:
            cmd.extend(["--location", req.location])
        if req.date_posted:
            cmd.extend(["--date_posted", req.date_posted])
        if req.job_type:
            cmd.extend(["--job_type", req.job_type])
        if req.experience_level:
            cmd.extend(["--experience_level", req.experience_level])
        if req.work_type:
            cmd.extend(["--work_type", req.work_type])
        if req.easy_apply:
            cmd.append("--easy_apply")
        if req.sort_by:
            cmd.extend(["--sort_by", req.sort_by])

        try:
            returncode, stdout, stderr = await asyncio.to_thread(_run_subprocess_sync, cmd, timeout)
            if returncode == 0 and stdout:
                # Find JSON line in output if any logger lines precede it
                for line in stdout.strip().split("\n"):
                    line = line.strip()
                    if line.startswith("{") and line.endswith("}"):
                        return json.loads(line)
                return json.loads(stdout)
            else:
                err_msg = stderr.strip() if stderr else "Search failed"
                logger.error("Search jobs subprocess error: %s", err_msg)
                return {
                    "keywords": req.keywords,
                    "location": req.location,
                    "total_found": 0,
                    "jobs": [],
                    "errors": [err_msg],
                }
        except asyncio.TimeoutError:
            logger.warning("Search jobs timed out after %ss", timeout)
            return {
                "keywords": req.keywords,
                "location": req.location,
                "total_found": 0,
                "jobs": [],
                "errors": [f"Search timed out after {timeout}s"],
            }
        except Exception as e:
            logger.error("Search jobs exception: %s", e)
            return {
                "keywords": req.keywords,
                "location": req.location,
                "total_found": 0,
                "jobs": [],
                "errors": [str(e)],
            }

    async def get_job_details(self, job_id: str, timeout: float = 20.0) -> dict[str, Any]:
        python_exe = self._get_python_executable()
        cmd = [python_exe, str(self.runner_path), "--action", "job_details", "--job_id", str(job_id)]
        try:
            returncode, stdout, stderr = await asyncio.to_thread(_run_subprocess_sync, cmd, timeout)
            if returncode == 0 and stdout:
                for line in stdout.strip().split("\n"):
                    line = line.strip()
                    if line.startswith("{") and line.endswith("}"):
                        return json.loads(line)
                return json.loads(stdout)
            else:
                err_msg = stderr.strip() if stderr else "Failed to load job"
                return {
                    "job_id": str(job_id),
                    "title": "LinkedIn Job",
                    "company": "Company",
                    "location": "Location",
                    "url": f"https://www.linkedin.com/jobs/view/{job_id}/",
                    "full_text": "",
                    "errors": [err_msg],
                }
        except Exception as e:
            return {
                "job_id": str(job_id),
                "title": "LinkedIn Job",
                "company": "Company",
                "location": "Location",
                "url": f"https://www.linkedin.com/jobs/view/{job_id}/",
                "full_text": "",
                "errors": [str(e)],
            }

    async def get_saved_jobs(self, stage: str = "saved", max_pages: int = 1, timeout: float = 30.0) -> dict[str, Any]:
        python_exe = self._get_python_executable()
        cmd = [
            python_exe,
            str(self.runner_path),
            "--action",
            "saved_jobs",
            "--stage",
            stage,
            "--max_pages",
            str(max_pages),
        ]
        try:
            returncode, stdout, stderr = await asyncio.to_thread(_run_subprocess_sync, cmd, timeout)
            if returncode == 0 and stdout:
                for line in stdout.strip().split("\n"):
                    line = line.strip()
                    if line.startswith("{") and line.endswith("}"):
                        return json.loads(line)
                return json.loads(stdout)
            return {"stage": stage, "total_found": 0, "jobs": []}
        except Exception as e:
            return {"stage": stage, "total_found": 0, "jobs": [], "error": str(e)}
