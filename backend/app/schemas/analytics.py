from pydantic import BaseModel


class ProfileAnalytics(BaseModel):
    exists: bool = False
    completeness_pct: float = 0.0
    fields_populated: int = 0
    fields_total: int = 5
    has_summary: bool = False
    has_target_roles: bool = False
    has_industries: bool = False
    has_locations: bool = False
    has_salary_expectations: bool = False


class ResumeAnalytics(BaseModel):
    total: int = 0
    latest_version: int = 0
    has_content: int = 0


class JobAnalytics(BaseModel):
    total: int = 0
    by_status: dict[str, int] = {}
    with_score: int = 0
    avg_score: float | None = None


class ApplicationAnalytics(BaseModel):
    total: int = 0
    by_status: dict[str, int] = {}
    with_resume: int = 0


class DocumentAnalytics(BaseModel):
    total: int = 0
    by_category: dict[str, int] = {}
    by_source: dict[str, int] = {}
    total_size_bytes: int = 0


class AtsAnalytics(BaseModel):
    total_scores: int = 0
    avg_ats_score: float | None = None
    avg_keyword_match_rate: float | None = None
    avg_formatting_score: float | None = None


class KnowledgeAnalytics(BaseModel):
    total: int = 0
    by_source_type: dict[str, int] = {}
    indexed: int = 0
    total_chunks: int = 0


class PluginAnalytics(BaseModel):
    total: int = 0
    by_status: dict[str, int] = {}
    by_category: dict[str, int] = {}


class RecentActivity(BaseModel):
    recent_profiles: int = 0
    recent_resumes: int = 0
    recent_jobs: int = 0
    recent_applications: int = 0
    recent_documents: int = 0
    recent_knowledge: int = 0
    last_activity: str | None = None


class AnalyticsSummary(BaseModel):
    profile: ProfileAnalytics
    resumes: ResumeAnalytics
    jobs: JobAnalytics
    applications: ApplicationAnalytics
    documents: DocumentAnalytics
    ats: AtsAnalytics
    knowledge: KnowledgeAnalytics
    plugins: PluginAnalytics
    recent_activity: RecentActivity
    generated_at: str
