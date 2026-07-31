from app.repositories.application import ApplicationRepository
from app.repositories.experience import ExperienceRepository
from app.repositories.job import JobRepository
from app.repositories.profile import ProfileRepository
from app.repositories.resume import ResumeRepository
from app.repositories.skill import SkillRepository
from app.schemas.application import ApplicationCreate
from app.schemas.application_campaign import (
    ApplicationCampaignItem,
    ApplicationCampaignRequest,
    ApplicationCampaignResponse,
)
from app.schemas.ats import AtsOptimizeRequest
from app.services.ai_service import AIService
from app.services.application_service import ApplicationService
from app.services.ats_service import AtsService
from app.services.job_service import JobService


class ApplicationCampaignService:
    """Prepare multiple applications while keeping final submission human-controlled."""

    def __init__(
        self,
        job_repository: JobRepository,
        resume_repository: ResumeRepository,
        application_repository: ApplicationRepository,
        profile_repository: ProfileRepository,
        skill_repository: SkillRepository,
        experience_repository: ExperienceRepository,
        ai_service: AIService,
    ) -> None:
        self._job_repo = job_repository
        self._resume_repo = resume_repository
        self._application_service = ApplicationService(application_repository)
        self._job_service = JobService(
            job_repository,
            profile_repository=profile_repository,
            skill_repository=skill_repository,
            experience_repository=experience_repository,
            ai_service=ai_service,
        )
        self._ats_service = AtsService(
            resume_repository=resume_repository,
            job_repository=job_repository,
            profile_repository=profile_repository,
            skill_repository=skill_repository,
            experience_repository=experience_repository,
            ai_service=ai_service,
        )

    async def prepare(self, request: ApplicationCampaignRequest) -> ApplicationCampaignResponse:
        source_resume = self._resume_repo.get_by_id(request.resume_id)
        if source_resume is None:
            raise ValueError(f"Resume {request.resume_id} not found")

        items: list[ApplicationCampaignItem] = []
        prepared = skipped = failed = 0

        for job_id in request.job_ids:
            job = self._job_repo.get_by_id(job_id)
            if job is None:
                failed += 1
                items.append(
                    ApplicationCampaignItem(
                        job_id=job_id,
                        decision="failed",
                        message="Job not found",
                    )
                )
                continue

            try:
                evaluation = await self._job_service.evaluate(job_id)
                if evaluation is None:
                    raise ValueError("Job requires a profile and job description before evaluation")

                fit_score = evaluation.get("fit_score")
                recommendation = evaluation.get("recommendation")
                qualifies = fit_score is not None and fit_score >= request.min_fit_score
                if recommendation == "skip":
                    qualifies = False

                if not qualifies:
                    skipped += 1
                    items.append(
                        ApplicationCampaignItem(
                            job_id=job_id,
                            title=job.title,
                            company=job.company,
                            fit_score=fit_score,
                            recommendation=recommendation,
                            decision="skipped",
                            message=f"Below campaign threshold of {request.min_fit_score:g} or marked skip",
                        )
                    )
                    continue

                tailored_resume_id = request.resume_id
                if request.tailor_resume:
                    optimized = await self._ats_service.optimize(
                        AtsOptimizeRequest(
                            resume_id=request.resume_id,
                            job_id=job_id,
                            target_role=job.title,
                        )
                    )
                    tailored = next(
                        (
                            resume
                            for resume in self._resume_repo.list()
                            if resume.profile_id == source_resume.profile_id
                            and resume.version == optimized.version
                        ),
                        None,
                    )
                    if tailored is None:
                        raise ValueError("Tailored resume was generated but could not be resolved")
                    tailored_resume_id = tailored.id

                application_id = None
                if request.create_application_drafts:
                    application = self._application_service.create(
                        ApplicationCreate(
                            job_id=job_id,
                            resume_id=tailored_resume_id,
                            status="review_required",
                            notes=(
                                "Prepared by assisted application campaign. "
                                "Review all fields, login requirements, declarations, and attachments "
                                "before manually submitting."
                            ),
                        )
                    )
                    application_id = application.id

                prepared += 1
                items.append(
                    ApplicationCampaignItem(
                        job_id=job_id,
                        title=job.title,
                        company=job.company,
                        fit_score=fit_score,
                        recommendation=recommendation,
                        decision="prepared",
                        tailored_resume_id=tailored_resume_id,
                        application_id=application_id,
                        message="Prepared for human review; no form was submitted",
                    )
                )
            except Exception as exc:
                failed += 1
                items.append(
                    ApplicationCampaignItem(
                        job_id=job_id,
                        title=job.title,
                        company=job.company,
                        decision="failed",
                        message=str(exc),
                    )
                )

        return ApplicationCampaignResponse(
            requested=len(request.job_ids),
            prepared=prepared,
            skipped=skipped,
            failed=failed,
            items=items,
        )
