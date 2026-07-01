from datetime import datetime, timezone

from app.models.job import Job
from app.models.profile import Profile
from app.repositories.job import JobRepository
from app.repositories.profile import ProfileRepository
from app.schemas.job import JobCreate, JobEvaluateTextRequest, JobUpdate
from app.services.ai_service import AIService


def job_to_response(job: Job) -> dict:
    return {
        "id": job.id,
        "profile_id": job.profile_id,
        "company": job.company,
        "title": job.title,
        "location": job.location,
        "url": job.url,
        "source": job.source,
        "jd_text": job.jd_text,
        "status": job.status,
        "score": job.score,
        "remote": job.remote,
        "employment_type": job.employment_type,
        "salary_range": job.salary_range,
        "skills": job.skills,
        "requirements": job.requirements,
        "experience": job.experience,
        "notes": job.notes,
        "evaluation_json": job.evaluation_json,
        "fit_score": job.fit_score,
        "created_at": job.created_at.replace(tzinfo=None).isoformat() if job.created_at else None,
        "updated_at": job.updated_at.replace(tzinfo=None).isoformat() if job.updated_at else None,
    }


def _build_analyze_prompt(jd_text: str) -> str:
    lines = [
        "You are a job description analyzer.",
        "Extract structured information from the following job description.",
        "Return a JSON object with these keys:",
        '  - "title": the job title',
        '  - "company": the company name',
        '  - "skills": list of required and preferred skills mentioned',
        '  - "requirements": list of requirements (education, certifications, years of experience, etc.)',
        '  - "experience": description of experience requirements',
        '  - "location": the work location',
        '  - "remote": whether remote work is offered (true, false, or null if unknown)',
        '  - "salary_range": salary information if mentioned',
        '  - "employment_type": full-time, part-time, contract, etc.',
        "",
        "Job Description:",
        jd_text,
    ]
    return "\n".join(lines)


def _build_evaluate_prompt(profile: Profile, jd_text: str, url: str | None) -> str:
    lines = [
        "You are a job evaluation assistant.",
        "Evaluate the following job against the candidate profile.",
        "Do not exaggerate the candidate's fit or invent experience.",
        "Return a JSON object with these keys:",
        '  - "fit_score": a number from 0 to 100 indicating overall fit',
        '  - "summary": a 2-3 sentence evaluation of the opportunity',
        '  - "strengths": list of candidate strengths relevant to this role, matched from profile data only',
        '  - "gaps": list of missing requirements or areas where the candidate falls short',
        '  - "risks": list of potential concerns or risks',
        '  - "recommendation": one of "apply", "consider", or "skip"',
        '  - "reasoning": brief justification for the recommendation',
        "",
        "Candidate Profile:",
        f"- Summary: {profile.summary or 'Not provided'}",
        f"- Target Roles: {profile.target_roles or 'Not provided'}",
        f"- Industries: {profile.industries or 'Not provided'}",
        f"- Locations: {profile.locations or 'Not provided'}",
        f"- Salary Expectations: {profile.salary_expectations or 'Not provided'}",
        "",
        "Job Description:",
        jd_text,
    ]
    if url:
        lines.append(f"Job URL: {url}")
    return "\n".join(lines)


def _parse_json_field(text: str) -> dict | None:
    import json

    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError, TypeError):
        return None


def _parse_fit_score(text: str) -> int | None:
    data = _parse_json_field(text)
    if data is None:
        return None
    score = data.get("fit_score")
    if score is not None:
        try:
            return int(score)
        except (ValueError, TypeError):
            return None
    return None


class JobService:
    def __init__(
        self,
        job_repository: JobRepository,
        profile_repository: ProfileRepository | None = None,
        ai_service: AIService | None = None,
    ) -> None:
        self._job_repo = job_repository
        self._profile_repo = profile_repository
        self._ai_service = ai_service

    def list_all(self) -> list[Job]:
        return self._job_repo.list_all()

    def get_by_id(self, job_id: int) -> Job | None:
        return self._job_repo.get_by_id(job_id)

    def create(self, data: JobCreate) -> Job:
        job = Job(
            profile_id=1,
            title=data.title,
            company=data.company,
            location=data.location,
            url=data.url,
            source=data.source,
            jd_text=data.jd_text,
            status=data.status or "saved",
            remote=data.remote,
            employment_type=data.employment_type,
            salary_range=data.salary_range,
            skills=data.skills,
            requirements=data.requirements,
            experience=data.experience,
            notes=data.notes,
        )
        return self._job_repo.create(job)

    def update(self, job_id: int, data: JobUpdate) -> Job | None:
        job = self._job_repo.get_by_id(job_id)
        if job is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(job, field, value)
        job.updated_at = datetime.now(timezone.utc)
        return self._job_repo.update(job)

    def delete(self, job_id: int) -> bool:
        return self._job_repo.delete(job_id)

    def search(self, query: str) -> list[Job]:
        return self._job_repo.search(query)

    async def analyze(self, job_id: int) -> Job | None:
        job = self._job_repo.get_by_id(job_id)
        if job is None:
            return None
        if not job.jd_text:
            return job
        if self._ai_service is None:
            return job

        prompt = _build_analyze_prompt(job.jd_text)
        result = await self._ai_service.generate(prompt, task_type="reasoning")
        data = _parse_json_field(result)
        if data is not None:
            job.title = data.get("title", job.title)
            job.company = data.get("company", job.company)
            job.location = data.get("location", job.location)
            skills_list = data.get("skills")
            if skills_list is not None:
                job.skills = skills_list if isinstance(skills_list, str) else str(skills_list)
            reqs_list = data.get("requirements")
            if reqs_list is not None:
                job.requirements = reqs_list if isinstance(reqs_list, str) else str(reqs_list)
            job.experience = data.get("experience", job.experience)
            remote_val = data.get("remote")
            if remote_val is not None:  # noqa: SIM102
                if isinstance(remote_val, bool):
                    job.remote = remote_val
            job.salary_range = data.get("salary_range", job.salary_range)
            job.employment_type = data.get("employment_type", job.employment_type)
        job.updated_at = datetime.now(timezone.utc)
        return self._job_repo.update(job)

    async def evaluate(self, job_id: int) -> Job | None:
        job = self._job_repo.get_by_id(job_id)
        if job is None:
            return None
        if self._profile_repo is None or self._ai_service is None:
            return job
        if not job.jd_text:
            return job

        profile = self._profile_repo.get()
        if profile is None:
            return job

        prompt = _build_evaluate_prompt(profile, job.jd_text, job.url)
        result = await self._ai_service.generate(prompt, task_type="reasoning")
        job.evaluation_json = result.strip()
        job.fit_score = _parse_fit_score(result)
        job.updated_at = datetime.now(timezone.utc)
        return self._job_repo.update(job)

    async def evaluate_text(self, data: JobEvaluateTextRequest) -> dict:
        if self._profile_repo is None:
            raise ValueError("Profile repository is required for evaluation")
        if self._ai_service is None:
            raise ValueError("AI service is required for evaluation")

        profile = self._profile_repo.get()
        if profile is None:
            raise ValueError("No profile found. Create a profile first.")

        prompt = _build_evaluate_prompt(profile, data.description, data.url)
        result = await self._ai_service.generate(prompt, task_type="reasoning")
        return {
            "evaluation_json": result.strip(),
            "fit_score": _parse_fit_score(result),
        }
