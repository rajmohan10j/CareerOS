"""
CareerOS LinkedIn Bridge Service
Provides an asynchronous interface to the LinkedIn MCP runner subprocess.
"""

import asyncio
import json
import logging
import os
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


class LinkedInBridge:
    def __init__(self, python_path: Path | None = None, runner_path: Path | None = None):
        self.python_path = python_path or MCP_VENV_PYTHON
        self.runner_path = runner_path or RUNNER_SCRIPT

    def _get_python_executable(self) -> str:
        if self.python_path.exists():
            return str(self.python_path)
        # Fallback to sys.executable if dedicated venv not found
        return sys.executable

    async def get_status(self) -> LinkedInStatusResponse:
        python_exe = self._get_python_executable()
        if not self.python_path.exists():
            # Check if profile files exist directly
            profile_dir = Path.home() / ".linkedin-mcp" / "profile"
            cookies_path = Path.home() / ".linkedin-mcp" / "cookies.json"
            if profile_dir.exists() and cookies_path.exists():
                return LinkedInStatusResponse(
                    available=True,
                    logged_in=True,
                    profile_path=str(profile_dir),
                    cookies_path=str(cookies_path),
                    message="Authenticated session detected (runner ready)",
                )
            return LinkedInStatusResponse(
                available=False,
                logged_in=False,
                message="LinkedIn MCP environment not detected at C:\\Users\\Raj\\tools\\linkedin-mcp-server",
            )

        cmd = [python_exe, str(self.runner_path), "--action", "status"]
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=5.0)
            if proc.returncode == 0 and stdout:
                data = json.loads(stdout.decode("utf-8", errors="replace"))
                return LinkedInStatusResponse(**data)
            else:
                err_msg = stderr.decode("utf-8", errors="replace") if stderr else "Non-zero exit code"
                return LinkedInStatusResponse(
                    available=False,
                    logged_in=False,
                    message=f"Status check failed: {err_msg[:200]}",
                )
        except Exception as e:
            logger.warning("LinkedIn status subprocess error: %s", e)
            return LinkedInStatusResponse(
                available=False,
                logged_in=False,
                message=f"Status check exception: {str(e)}",
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
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            if proc.returncode == 0 and stdout:
                return json.loads(stdout.decode("utf-8", errors="replace"))
            else:
                err_msg = stderr.decode("utf-8", errors="replace") if stderr else "Search failed"
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
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            if proc.returncode == 0 and stdout:
                return json.loads(stdout.decode("utf-8", errors="replace"))
            else:
                err_msg = stderr.decode("utf-8", errors="replace") if stderr else "Failed to load job"
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
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            if proc.returncode == 0 and stdout:
                return json.loads(stdout.decode("utf-8", errors="replace"))
            return {"stage": stage, "total_found": 0, "jobs": []}
        except Exception as e:
            return {"stage": stage, "total_found": 0, "jobs": [], "error": str(e)}
