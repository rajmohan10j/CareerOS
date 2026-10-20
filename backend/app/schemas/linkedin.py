from typing import Any
from pydantic import BaseModel, Field


class LinkedInStatusResponse(BaseModel):
    available: bool = False
    logged_in: bool = False
    profile_path: str | None = None
    cookies_path: str | None = None
    message: str = "Checking session..."


class LinkedInSearchRequest(BaseModel):
    keywords: str = Field(..., description="Search keywords, e.g. 'Software Engineer'")
    location: str | None = Field(default=None, description="Location filter, e.g. 'Remote', 'India'")
    max_pages: int = Field(default=1, ge=1, le=5, description="Number of pages to scrape (1-5)")
    date_posted: str | None = Field(default=None, description="past_hour, past_24_hours, past_week, past_month")
    job_type: str | None = Field(default=None, description="full_time, contract, part_time, internship")
    experience_level: str | None = Field(default=None, description="entry, associate, mid_senior, director, executive")
    work_type: str | None = Field(default=None, description="on_site, remote, hybrid")
    easy_apply: bool = Field(default=False, description="Filter for Easy Apply jobs only")
    sort_by: str | None = Field(default="date", description="date or relevance")


class LinkedInJobItem(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    url: str
    apply_type: str = "external"
    apply_url: str | None = None
    snippet: str = ""
    fit_score: float | None = None
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)


class LinkedInSearchResponse(BaseModel):
    keywords: str
    location: str | None = None
    total_found: int = 0
    jobs: list[LinkedInJobItem] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)


class LinkedInJobDetailResponse(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    url: str
    apply_type: str = "external"
    apply_url: str | None = None
    full_text: str = ""
    fit_score: float | None = None
    recommendation: str | None = None
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)


class LinkedInImportRequest(BaseModel):
    job_id: str
    title: str
    company: str
    location: str | None = None
    url: str | None = None
    jd_text: str | None = None
    apply_type: str | None = "external"
    apply_url: str | None = None


class LinkedInSavedJobsRequest(BaseModel):
    stage: str = Field(default="saved", description="saved, in_progress, applied, archived")
    max_pages: int = Field(default=1, ge=1, le=5)


class LinkedInRecruiterSearchRequest(BaseModel):
    keywords: str = Field(..., description="Recruiter, Talent Acquisition, Hiring Manager")
    company: str | None = Field(default=None, description="Target company name or URN")
    location: str | None = None
    network: list[str] | None = Field(default=None, description="F, S, O (1st, 2nd, 3rd degree)")


class LinkedInRecruiterItem(BaseModel):
    name: str
    headline: str | None = None
    location: str | None = None
    profile_url: str


class LinkedInRecruiterSearchResponse(BaseModel):
    total_found: int = 0
    recruiters: list[LinkedInRecruiterItem] = Field(default_factory=list)


class LinkedInPostsSearchRequest(BaseModel):
    keywords: str = Field(..., description="e.g. 'we are hiring python developer'")
    date_posted: str | None = Field(default="past_week", description="past_24_hours, past_week, past_month")


class LinkedInPostItem(BaseModel):
    author: str
    content: str
    post_url: str | None = None
    date: str | None = None


class LinkedInPostsSearchResponse(BaseModel):
    keywords: str
    total_found: int = 0
    posts: list[LinkedInPostItem] = Field(default_factory=list)
