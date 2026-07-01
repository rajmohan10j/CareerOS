from pydantic import BaseModel


class AtsScoreRequest(BaseModel):
    resume_id: int
    job_id: int | None = None
    job_description: str | None = None


class AtsAnalyzeRequest(BaseModel):
    resume_id: int
    job_id: int | None = None
    job_description: str | None = None


class AtsOptimizeRequest(BaseModel):
    resume_id: int
    job_id: int | None = None
    job_description: str | None = None
    target_role: str | None = None


class AtsScoreResponse(BaseModel):
    resume_id: int
    ats_score: float | None = None
    keyword_match_rate: float | None = None
    matched_keywords: list[str] = []
    missing_keywords: list[str] = []
    formatting_score: float | None = None
    compliance_issues: list[str] = []
    suggestions: list[str] = []


class AtsAnalyzeResponse(BaseModel):
    resume_id: int
    ats_score: float | None = None
    keyword_match_rate: float | None = None
    matched_keywords: list[str] = []
    missing_keywords: list[str] = []
    formatting_score: float | None = None
    compliance_issues: list[str] = []
    section_scores: dict = {}
    suggestions: list[str] = []
    content_analysis: str | None = None


class AtsOptimizeResponse(BaseModel):
    resume_id: int
    optimized_content: str
    changes_summary: str
    version: int
