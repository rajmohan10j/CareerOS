from pydantic import BaseModel, Field


class ApplicationCampaignRequest(BaseModel):
    job_ids: list[int] = Field(min_length=1, max_length=50)
    resume_id: int
    min_fit_score: float = Field(default=65.0, ge=0, le=100)
    tailor_resume: bool = True
    create_application_drafts: bool = True


class ApplicationCampaignItem(BaseModel):
    job_id: int
    title: str | None = None
    company: str | None = None
    fit_score: float | None = None
    recommendation: str | None = None
    decision: str
    tailored_resume_id: int | None = None
    application_id: int | None = None
    review_required: bool = True
    message: str | None = None


class ApplicationCampaignResponse(BaseModel):
    requested: int
    prepared: int
    skipped: int
    failed: int
    submission_mode: str = "human_review_required"
    items: list[ApplicationCampaignItem]
