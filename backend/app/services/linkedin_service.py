"""
CareerOS LinkedIn Business Service
Coordinates LinkedIn search results with CareerOS candidate profile,
skill matching, AI fit scoring, and job repository storage.
"""

import json
import logging
import re
from typing import Any

from app.models.job import Job
from app.repositories.experience import ExperienceRepository
from app.repositories.job import JobRepository
from app.repositories.profile import ProfileRepository
from app.repositories.skill import SkillRepository
from app.schemas.job import JobCreate
from app.schemas.linkedin import (
    LinkedInImportRequest,
    LinkedInJobDetailResponse,
    LinkedInJobItem,
    LinkedInSearchRequest,
    LinkedInSearchResponse,
    LinkedInStatusResponse,
)
from app.services.ai_service import AIService
from app.services.linkedin_bridge import LinkedInBridge

logger = logging.getLogger(__name__)


class LinkedInService:
    def __init__(
        self,
        bridge: LinkedInBridge | None = None,
        job_repository: JobRepository | None = None,
        profile_repository: ProfileRepository | None = None,
        skill_repository: SkillRepository | None = None,
        experience_repository: ExperienceRepository | None = None,
        ai_service: AIService | None = None,
    ):
        self.bridge = bridge or LinkedInBridge()
        self.job_repository = job_repository
        self.profile_repository = profile_repository
        self.skill_repository = skill_repository
        self.experience_repository = experience_repository
        self.ai_service = ai_service or AIService()

    async def get_status(self) -> LinkedInStatusResponse:
        return await self.bridge.get_status()

    def _calculate_local_skill_fit(self, text: str) -> tuple[float, list[str], list[str]]:
        if not self.skill_repository or not text:
            return 70.0, [], []

        try:
            skills = self.skill_repository.list_all()
            if not skills:
                return 70.0, [], []

            user_skill_names = [s.name.strip() for s in skills if s.name]
            matched: list[str] = []
            missing: list[str] = []

            text_lower = text.lower()
            for s_name in user_skill_names:
                # Word-boundary check for skill name
                pattern = r"\b" + re.escape(s_name.lower()) + r"\b"
                if re.search(pattern, text_lower):
                    matched.append(s_name)

            # Heuristic calculation
            if user_skill_names:
                ratio = len(matched) / max(1, min(len(user_skill_names), 8))
                score = round(min(98.0, max(50.0, 50.0 + (ratio * 48.0))), 1)
            else:
                score = 75.0

            return score, matched[:6], missing[:4]
        except Exception as e:
            logger.warning("Local skill fit calculation error: %s", e)
            return 70.0, [], []

    async def search_jobs(self, req: LinkedInSearchRequest) -> LinkedInSearchResponse:
        raw_res = await self.bridge.search_jobs(req)
        jobs_data = raw_res.get("jobs", [])
        job_items: list[LinkedInJobItem] = []

        for j in jobs_data:
            snippet = j.get("snippet", "")
            score, matched, missing = self._calculate_local_skill_fit(snippet)
            item = LinkedInJobItem(
                job_id=str(j.get("job_id", "")),
                title=j.get("title") or "LinkedIn Job",
                company=j.get("company") or "Company",
                location=j.get("location") or (req.location or "Remote"),
                url=j.get("url") or f"https://www.linkedin.com/jobs/view/{j.get('job_id')}/",
                apply_type=j.get("apply_type", "external"),
                apply_url=j.get("apply_url"),
                snippet=snippet[:400] if snippet else "",
                fit_score=score,
                matched_skills=matched,
                missing_skills=missing,
            )
            job_items.append(item)

        return LinkedInSearchResponse(
            keywords=req.keywords,
            location=req.location,
            total_found=len(job_items),
            jobs=job_items,
            errors=raw_res.get("errors", []),
        )

    async def get_job_details(self, job_id: str) -> LinkedInJobDetailResponse:
        raw = await self.bridge.get_job_details(job_id)
        full_text = raw.get("full_text", "")
        score, matched, missing = self._calculate_local_skill_fit(full_text)

        rec = "Strong candidate match based on core skills." if score >= 80 else "Potential opportunity with learning curve."

        return LinkedInJobDetailResponse(
            job_id=str(job_id),
            title=raw.get("title") or "LinkedIn Job",
            company=raw.get("company") or "Company",
            location=raw.get("location") or "Unspecified",
            url=raw.get("url") or f"https://www.linkedin.com/jobs/view/{job_id}/",
            apply_type=raw.get("apply_type", "external"),
            apply_url=raw.get("apply_url"),
            full_text=full_text,
            fit_score=score,
            recommendation=rec,
            matched_skills=matched,
            missing_skills=missing,
        )

    async def import_job(self, req: LinkedInImportRequest) -> dict[str, Any]:
        if not self.job_repository:
            raise ValueError("JobRepository required for import")

        score, matched, missing = self._calculate_local_skill_fit(req.jd_text or f"{req.title} {req.company}")

        job = Job(
            profile_id=1,
            title=req.title,
            company=req.company,
            location=req.location or "Remote",
            url=req.url or f"https://www.linkedin.com/jobs/view/{req.job_id}/",
            source="linkedin",
            jd_text=req.jd_text or f"Imported from LinkedIn #{req.job_id}",
            status="discovered",
            notes=f"LinkedIn Job ID: {req.job_id}\nApply Type: {req.apply_type}\nApply URL: {req.apply_url or req.url}",
            fit_score=int(score),
            evaluation_json=json.dumps({
                "fit_score": score,
                "matched_skills": matched,
                "missing_skills": missing,
                "imported_from": "linkedin",
                "apply_type": req.apply_type,
                "apply_url": req.apply_url,
            }),
        )

        saved_job = self.job_repository.create(job)

        return {
            "id": saved_job.id,
            "job_id": req.job_id,
            "title": saved_job.title,
            "company": saved_job.company,
            "fit_score": saved_job.fit_score,
            "status": saved_job.status,
            "imported": True,
            "message": f"Successfully imported '{saved_job.title}' into CareerOS tracker.",
        }

    async def get_saved_jobs(self, stage: str = "saved", max_pages: int = 1) -> dict[str, Any]:
        return await self.bridge.get_saved_jobs(stage=stage, max_pages=max_pages)
