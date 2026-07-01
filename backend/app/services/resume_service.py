from datetime import datetime, timezone

from app.models.profile import Profile
from app.models.resume import Resume
from app.repositories.profile import ProfileRepository
from app.repositories.resume import ResumeRepository
from app.schemas.resume import ResumeCreate, ResumeGenerateRequest, ResumeUpdate
from app.services.ai_service import AIService


def resume_to_response(resume: Resume) -> dict:
    return {
        "id": resume.id,
        "profile_id": resume.profile_id,
        "title": resume.title,
        "content": resume.content,
        "target_role": resume.target_role,
        "job_description": resume.job_description,
        "version": resume.version,
        "is_latest": resume.is_latest,
        "created_at": resume.created_at.replace(tzinfo=None).isoformat() if resume.created_at else None,
        "updated_at": resume.updated_at.replace(tzinfo=None).isoformat() if resume.updated_at else None,
    }


def _build_generation_prompt(profile: Profile, target_role: str, job_description: str | None) -> str:
    lines = ["You are a professional resume writer.", ""]
    lines.append("Generate a resume in Markdown format using ONLY the following candidate data.")
    lines.append("Do NOT invent experience, employers, education, titles, dates, or achievements.")
    lines.append("If the profile lacks data for a section, omit that section.")
    lines.append("")
    lines.append("## Candidate Profile")
    lines.append(f"- Summary: {profile.summary or 'Not provided'}")
    lines.append(f"- Target Roles: {profile.target_roles or 'Not provided'}")
    lines.append(f"- Industries: {profile.industries or 'Not provided'}")
    lines.append(f"- Locations: {profile.locations or 'Not provided'}")
    lines.append("")
    lines.append("## Target Role")
    lines.append(target_role)
    if job_description:
        lines.append("")
        lines.append("## Job Description")
        lines.append(job_description)
    lines.append("")
    lines.append("## Output Format")
    lines.append("Generate a clean Markdown resume with these sections if data is available:")
    lines.append("- Contact / Header")
    lines.append("- Professional Summary")
    lines.append("- Skills")
    lines.append("- Experience")
    lines.append("- Education")
    lines.append("- Certifications")
    lines.append("")
    lines.append("Use the candidate's actual profile data. Do not fabricate.")
    return "\n".join(lines)


class ResumeService:
    def __init__(
        self,
        resume_repository: ResumeRepository,
        profile_repository: ProfileRepository | None = None,
        ai_service: AIService | None = None,
    ) -> None:
        self._resume_repo = resume_repository
        self._profile_repo = profile_repository
        self._ai_service = ai_service

    def list(self) -> list[Resume]:
        return self._resume_repo.list()

    def get_by_id(self, resume_id: int) -> Resume | None:
        return self._resume_repo.get_by_id(resume_id)

    def create(self, data: ResumeCreate) -> Resume:
        resume = Resume(
            profile_id=1,
            title=data.title,
            target_role=data.target_role,
            job_description=data.job_description,
            version=1,
            is_latest=True,
        )
        return self._resume_repo.create(resume)

    def update(self, resume_id: int, data: ResumeUpdate) -> Resume | None:
        resume = self._resume_repo.get_by_id(resume_id)
        if resume is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(resume, field, value)
        resume.updated_at = datetime.now(timezone.utc)
        return self._resume_repo.update(resume)

    def delete(self, resume_id: int) -> bool:
        return self._resume_repo.delete(resume_id)

    async def generate(self, data: ResumeGenerateRequest) -> Resume:
        if self._profile_repo is None:
            raise ValueError("Profile repository is required for generation")
        if self._ai_service is None:
            raise ValueError("AI service is required for generation")

        profile = self._profile_repo.get()
        if profile is None:
            raise ValueError("No profile found. Create a profile first.")

        prompt = _build_generation_prompt(profile, data.target_role, data.job_description)

        content = await self._ai_service.generate(prompt, task_type="reasoning")

        next_version = self._resume_repo.get_latest_version(1) + 1
        self._resume_repo.mark_previous_as_not_latest(1)

        resume = Resume(
            profile_id=1,
            title=f"Resume for {data.target_role}",
            content=content,
            target_role=data.target_role,
            job_description=data.job_description,
            version=next_version,
            is_latest=True,
        )
        return self._resume_repo.create(resume)
