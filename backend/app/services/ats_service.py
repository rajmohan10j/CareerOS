import re

from app.models.experience import Experience
from app.models.profile import Profile
from app.models.resume import Resume
from app.models.skill import Skill
from app.repositories.experience import ExperienceRepository
from app.repositories.job import JobRepository
from app.repositories.profile import ProfileRepository
from app.repositories.resume import ResumeRepository
from app.repositories.skill import SkillRepository
from app.schemas.ats import (
    AtsAnalyzeRequest,
    AtsAnalyzeResponse,
    AtsOptimizeRequest,
    AtsOptimizeResponse,
    AtsScoreRequest,
    AtsScoreResponse,
)
from app.services.ai_service import AIService


def _parse_skills_from_text(skills_text: str | None) -> list[str]:
    if not skills_text:
        return []
    import ast

    try:
        parsed = ast.literal_eval(skills_text)
        if isinstance(parsed, list):
            return [str(s).strip() for s in parsed if s]
    except (ValueError, SyntaxError):
        pass
    cleaned = skills_text.replace("[", "").replace("]", "").replace("'", "").replace('"', "")
    return [s.strip() for s in cleaned.split(",") if s.strip()]


def _match_keywords(
    jd_skills_text: str | None, user_skills: list[Skill]
) -> tuple[list[str], list[str]]:
    jd_skills = _parse_skills_from_text(jd_skills_text)
    if not jd_skills:
        return [], []

    user_skill_names = {s.name.lower().strip() for s in user_skills if s.name}

    matched = []
    missing = []
    for skill in jd_skills:
        if skill.lower().strip() in user_skill_names:
            matched.append(skill)
        else:
            missing.append(skill)
    return matched, missing


STANDARD_SECTIONS = ["experience", "education", "skills", "summary", "contact", "certifications"]


def _analyze_formatting(content: str) -> tuple[float, list[str]]:
    issues: list[str] = []
    score = 100.0

    if "|" in content and "---" in content:
        issues.append("Tables detected — may not parse correctly in ATS")
        score -= 15

    if "![" in content:
        issues.append("Images detected — not parsed by most ATS")
        score -= 10

    found = [s for s in STANDARD_SECTIONS if s in content.lower()]
    missing = [s for s in STANDARD_SECTIONS if s not in found]
    if missing:
        issues.append(f"Missing standard section headers: {', '.join(missing)}")
        score -= 5 * len(missing)

    lines = content.split("\n")
    if any(len(line) > 120 for line in lines):
        issues.append("Long lines detected — consider shorter line lengths for ATS parsing")
        score -= 5

    special = set(re.findall(r"[^\x00-\x7F]", content))
    if special:
        safe_chars = "".join(sorted(special))[:30]
        issues.append(f"Non-ASCII characters detected: {safe_chars}")
        score -= 5

    return max(0.0, score), issues


def _resolve_jd(
    job_repo: JobRepository | None, job_id: int | None, job_description: str | None
) -> str | None:
    if job_description:
        return job_description
    if job_id is not None and job_repo is not None:
        job = job_repo.get_by_id(job_id)
        if job and job.jd_text:
            return job.jd_text
    return None


def _resolve_skills(job_repo: JobRepository | None, job_id: int | None) -> str | None:
    if job_id is not None and job_repo is not None:
        job = job_repo.get_by_id(job_id)
        if job:
            return job.skills
    return None


def _build_score_prompt(
    profile: Profile | None,
    resume_content: str,
    jd_text: str,
    user_skills: list[Skill],
    user_experiences: list[Experience],
) -> str:
    skills_text = (
        ", ".join(
            f"{s.name} (proficiency: {s.proficiency}, category: {s.category})"
            for s in user_skills
            if s.name
        )
        or "No skills listed"
    )

    exp_lines = []
    for e in user_experiences:
        exp_lines.append(
            f"- {e.title or 'Unknown'} at {e.company or 'Unknown'} "
            f"({e.start_date or '?'} - {e.end_date or 'present'}): {e.description or ''}"
        )
    experiences_text = "\n".join(exp_lines) or "No experience listed"

    profile_summary = profile.summary if profile else "Not provided"

    lines = [
        "You are an ATS (Applicant Tracking System) scoring assistant.",
        "Analyze the following resume against the job description.",
        "Do NOT invent skills or experience. Only reference what is in the resume or candidate profile.",
        "Return a JSON object with these keys:",
        '  - "ats_score": a number from 0 to 100 indicating overall ATS compatibility',
        '  - "formatting_score": a number from 0 to 100 for formatting/parsing friendliness',
        '  - "compliance_issues": list of specific ATS compliance problems found',
        '  - "suggestions": list of actionable improvements to increase ATS score',
        "",
        "Candidate Profile Summary:",
        profile_summary,
        "",
        "Candidate Skills:",
        skills_text,
        "",
        "Candidate Experience:",
        experiences_text,
        "",
        "Resume Content:",
        resume_content,
        "",
        "Job Description:",
        jd_text,
    ]
    return "\n".join(lines)


def _build_analyze_prompt(
    profile: Profile | None,
    resume_content: str,
    jd_text: str,
    user_skills: list[Skill],
    user_experiences: list[Experience],
) -> str:
    base = _build_score_prompt(profile, resume_content, jd_text, user_skills, user_experiences)
    extra = [
        '  - "section_scores": a JSON object with scores per section (e.g. {"contact": 90, "experience": 75, "skills": 80, "education": 85})',
        '  - "content_analysis": a 2-3 sentence summary of how well the resume content aligns with the job',
    ]
    lines = base.split("\n")
    insert_at = None
    for i, line in enumerate(lines):
        if "Return a JSON object" in line:
            insert_at = i + 1
            break
    if insert_at is not None:
        for j, ex in enumerate(extra):
            lines.insert(insert_at + j, ex)
    return "\n".join(lines)


def _build_optimize_prompt(
    resume_content: str,
    jd_text: str,
    target_role: str | None,
    user_skills: list[Skill],
    user_experiences: list[Experience],
) -> str:
    skills_text = (
        ", ".join(f"{s.name} (proficiency: {s.proficiency})" for s in user_skills if s.name)
        or "No skills listed"
    )

    exp_lines = []
    for e in user_experiences:
        exp_lines.append(
            f"- {e.title or 'Unknown'} at {e.company or 'Unknown'} "
            f"({e.start_date or '?'} - {e.end_date or 'present'}): {e.description or ''}"
        )
    experiences_text = "\n".join(exp_lines) or "No experience listed"

    lines = [
        "You are an ATS optimization specialist.",
        "Rewrite the following resume to maximize ATS (Applicant Tracking System) compatibility.",
        "IMPORTANT: Do not invent experience, employers, education, titles, dates, or achievements.",
        "Use only the information from the original resume and candidate profile below.",
        "",
        "ATS optimization guidelines:",
        "- Use standard section headers (Contact, Professional Summary, Skills, Experience, Education, Certifications)",
        "- Use bullet points (not tables or columns) for experience and achievements",
        "- Include relevant keywords from the job description naturally in the Skills and Experience sections",
        "- Avoid images, tables, columns, and special characters",
        "- Keep formatting clean and parseable",
        "- Order sections by relevance to the target role",
        "",
    ]
    if target_role:
        lines.append(f"Target Role: {target_role}")
        lines.append("")
    lines.append("Candidate Skills:")
    lines.append(skills_text)
    lines.append("")
    lines.append("Candidate Experience:")
    lines.append(experiences_text)
    lines.append("")
    lines.append("Original Resume:")
    lines.append(resume_content)
    lines.append("")
    lines.append("Job Description:")
    lines.append(jd_text)
    lines.append("")
    lines.append(
        "Return ONLY the rewritten resume in clean Markdown format. No JSON, no explanation."
    )
    return "\n".join(lines)


def _parse_json_field(text: str) -> dict | None:
    import json

    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError, TypeError):
        return None


class AtsService:
    def __init__(
        self,
        resume_repository: ResumeRepository,
        job_repository: JobRepository | None = None,
        profile_repository: ProfileRepository | None = None,
        skill_repository: SkillRepository | None = None,
        experience_repository: ExperienceRepository | None = None,
        ai_service: AIService | None = None,
    ) -> None:
        self._resume_repo = resume_repository
        self._job_repo = job_repository
        self._profile_repo = profile_repository
        self._skill_repo = skill_repository
        self._experience_repo = experience_repository
        self._ai_service = ai_service

    def _load_skills(self) -> list[Skill]:
        return self._skill_repo.list_all() if self._skill_repo else []

    def _load_experiences(self) -> list[Experience]:
        return self._experience_repo.list_all() if self._experience_repo else []

    def _load_profile(self) -> Profile | None:
        return self._profile_repo.get() if self._profile_repo else None

    async def score(self, request: AtsScoreRequest) -> AtsScoreResponse:
        resume = self._resume_repo.get_by_id(request.resume_id)
        if resume is None:
            raise ValueError(f"Resume {request.resume_id} not found")
        if not resume.content:
            raise ValueError(f"Resume {request.resume_id} has no content")

        jd_text = _resolve_jd(self._job_repo, request.job_id, request.job_description)
        if not jd_text:
            raise ValueError("No job description available. Provide job_id or job_description.")

        jd_skills_text = _resolve_skills(self._job_repo, request.job_id)
        user_skills = self._load_skills()
        matched, missing = _match_keywords(jd_skills_text, user_skills)
        keyword_rate = (
            len(matched) / (len(matched) + len(missing)) if (matched or missing) else None
        )

        formatting_score, compliance_issues = _analyze_formatting(resume.content)

        ats_score: float | None = None
        ai_suggestions: list[str] = []

        if self._ai_service:
            profile = self._load_profile()
            user_experiences = self._load_experiences()
            prompt = _build_score_prompt(
                profile, resume.content, jd_text, user_skills, user_experiences
            )
            try:
                result = await self._ai_service.generate(prompt, task_type="reasoning")
            except Exception:
                result = None
            data = _parse_json_field(result) if result else None
            if data is not None:
                raw_score = data.get("ats_score")
                if raw_score is not None:
                    try:
                        ats_score = float(raw_score)
                    except (ValueError, TypeError):
                        pass
                raw_fmt = data.get("formatting_score")
                if raw_fmt is not None:
                    try:
                        formatting_score = float(raw_fmt)
                    except (ValueError, TypeError):
                        pass
                raw_issues = data.get("compliance_issues")
                if isinstance(raw_issues, list):
                    compliance_issues = raw_issues
                raw_suggestions = data.get("suggestions")
                if isinstance(raw_suggestions, list):
                    ai_suggestions = raw_suggestions

        return AtsScoreResponse(
            resume_id=request.resume_id,
            ats_score=ats_score,
            keyword_match_rate=keyword_rate,
            matched_keywords=matched,
            missing_keywords=missing,
            formatting_score=formatting_score,
            compliance_issues=compliance_issues,
            suggestions=ai_suggestions,
        )

    async def analyze(self, request: AtsAnalyzeRequest) -> AtsAnalyzeResponse:
        resume = self._resume_repo.get_by_id(request.resume_id)
        if resume is None:
            raise ValueError(f"Resume {request.resume_id} not found")
        if not resume.content:
            raise ValueError(f"Resume {request.resume_id} has no content")

        jd_text = _resolve_jd(self._job_repo, request.job_id, request.job_description)
        if not jd_text:
            raise ValueError("No job description available. Provide job_id or job_description.")

        jd_skills_text = _resolve_skills(self._job_repo, request.job_id)
        user_skills = self._load_skills()
        matched, missing = _match_keywords(jd_skills_text, user_skills)
        keyword_rate = (
            len(matched) / (len(matched) + len(missing)) if (matched or missing) else None
        )

        formatting_score, compliance_issues = _analyze_formatting(resume.content)
        section_scores: dict = {}
        content_analysis: str | None = None
        ai_suggestions: list[str] = []

        if self._ai_service:
            profile = self._load_profile()
            user_experiences = self._load_experiences()
            prompt = _build_analyze_prompt(
                profile, resume.content, jd_text, user_skills, user_experiences
            )
            try:
                result = await self._ai_service.generate(prompt, task_type="reasoning")
            except Exception:
                result = None
            data = _parse_json_field(result) if result else None
            if data is not None:
                raw_score = data.get("ats_score")
                if raw_score is not None:
                    try:
                        ats_score_val = float(raw_score)
                    except (ValueError, TypeError):
                        ats_score_val = None
                else:
                    ats_score_val = None
                raw_fmt = data.get("formatting_score")
                if raw_fmt is not None:
                    try:
                        formatting_score = float(raw_fmt)
                    except (ValueError, TypeError):
                        pass
                raw_issues = data.get("compliance_issues")
                if isinstance(raw_issues, list):
                    compliance_issues = raw_issues
                raw_sections = data.get("section_scores")
                if isinstance(raw_sections, dict):
                    section_scores = raw_sections
                raw_suggestions = data.get("suggestions")
                if isinstance(raw_suggestions, list):
                    ai_suggestions = raw_suggestions
                raw_analysis = data.get("content_analysis")
                if isinstance(raw_analysis, str):
                    content_analysis = raw_analysis

                return AtsAnalyzeResponse(
                    resume_id=request.resume_id,
                    ats_score=ats_score_val,
                    keyword_match_rate=keyword_rate,
                    matched_keywords=matched,
                    missing_keywords=missing,
                    formatting_score=formatting_score,
                    compliance_issues=compliance_issues,
                    section_scores=section_scores,
                    suggestions=ai_suggestions,
                    content_analysis=content_analysis,
                )

        return AtsAnalyzeResponse(
            resume_id=request.resume_id,
            ats_score=None,
            keyword_match_rate=keyword_rate,
            matched_keywords=matched,
            missing_keywords=missing,
            formatting_score=formatting_score,
            compliance_issues=compliance_issues,
            section_scores=section_scores,
            suggestions=ai_suggestions,
            content_analysis=content_analysis,
        )

    async def optimize(self, request: AtsOptimizeRequest) -> AtsOptimizeResponse:
        resume = self._resume_repo.get_by_id(request.resume_id)
        if resume is None:
            raise ValueError(f"Resume {request.resume_id} not found")
        if not resume.content:
            raise ValueError(f"Resume {request.resume_id} has no content")

        jd_text = _resolve_jd(self._job_repo, request.job_id, request.job_description)
        if not jd_text:
            raise ValueError("No job description available. Provide job_id or job_description.")

        user_skills = self._load_skills()
        user_experiences = self._load_experiences()

        prompt = _build_optimize_prompt(
            resume.content, jd_text, request.target_role, user_skills, user_experiences
        )

        if self._ai_service is None:
            raise ValueError("AI service is required for optimization")

        try:
            optimized = await self._ai_service.generate(prompt, task_type="reasoning")
        except Exception:
            raise ValueError("AI service failed to generate optimized content")

        next_version = self._resume_repo.get_latest_version(resume.profile_id) + 1
        self._resume_repo.mark_previous_as_not_latest(resume.profile_id)

        new_resume = Resume(
            profile_id=resume.profile_id,
            title=f"{resume.title} (ATS Optimized)" if resume.title else "ATS Optimized Resume",
            content=optimized,
            target_role=request.target_role or resume.target_role,
            job_description=jd_text,
            version=next_version,
            is_latest=True,
        )
        saved = self._resume_repo.create(new_resume)

        return AtsOptimizeResponse(
            resume_id=request.resume_id,
            optimized_content=optimized,
            changes_summary=f"ATS-optimized version {saved.version} created. Tailored to target role and JD.",
            version=saved.version,
        )
