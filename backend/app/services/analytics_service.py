import json
from datetime import datetime, timezone

from sqlmodel import Session, func, select

from app.models.profile import Profile
from app.repositories.application import ApplicationRepository
from app.repositories.document import DocumentRepository
from app.repositories.job import JobRepository
from app.repositories.knowledge import KnowledgeRepository
from app.repositories.plugin import PluginRepository
from app.repositories.profile import ProfileRepository
from app.repositories.resume import ResumeRepository
from app.schemas.analytics import (
    AnalyticsSummary,
    ApplicationAnalytics,
    AtsAnalytics,
    DocumentAnalytics,
    JobAnalytics,
    KnowledgeAnalytics,
    PluginAnalytics,
    ProfileAnalytics,
    RecentActivity,
    ResumeAnalytics,
)


def _count(session: Session, model) -> int:
    return session.exec(select(func.count()).select_from(model)).one()


def _count_by(session: Session, model, column) -> dict[str, int]:
    results = session.exec(select(column, func.count()).group_by(column)).all()
    return {str(k): v for k, v in results if k is not None}


class AnalyticsService:
    def __init__(
        self,
        session: Session,
        profile_repo: ProfileRepository,
        resume_repo: ResumeRepository,
        job_repo: JobRepository,
        application_repo: ApplicationRepository,
        document_repo: DocumentRepository,
        knowledge_repo: KnowledgeRepository,
        plugin_repo: PluginRepository,
    ) -> None:
        self._session = session
        self._profile_repo = profile_repo
        self._resume_repo = resume_repo
        self._job_repo = job_repo
        self._application_repo = application_repo
        self._document_repo = document_repo
        self._knowledge_repo = knowledge_repo
        self._plugin_repo = plugin_repo

    def get_profile_analytics(self) -> ProfileAnalytics:
        profile = self._profile_repo.get()
        if profile is None:
            return ProfileAnalytics()
        fields = {
            "has_summary": bool(profile.summary),
            "has_target_roles": bool(profile.target_roles),
            "has_industries": bool(profile.industries),
            "has_locations": bool(profile.locations),
            "has_salary_expectations": bool(profile.salary_expectations),
        }
        populated = sum(1 for v in fields.values() if v)
        total = len(fields)
        return ProfileAnalytics(
            exists=True,
            completeness_pct=round(populated / total * 100, 1),
            fields_populated=populated,
            fields_total=total,
            **fields,
        )

    def get_resume_analytics(self) -> ResumeAnalytics:
        resumes = self._resume_repo.list()
        latest_version = 0
        has_content = 0
        for r in resumes:
            if r.version and r.version > latest_version:
                latest_version = r.version
            if r.content:
                has_content += 1
        return ResumeAnalytics(
            total=len(resumes),
            latest_version=latest_version,
            has_content=has_content,
        )

    def get_job_analytics(self) -> JobAnalytics:
        jobs = self._job_repo.list_all()
        by_status: dict[str, int] = {}
        scores: list[float] = []
        for j in jobs:
            if j.status:
                by_status[j.status] = by_status.get(j.status, 0) + 1
            if j.score is not None:
                scores.append(float(j.score))
        avg_score = round(sum(scores) / len(scores), 1) if scores else None
        return JobAnalytics(
            total=len(jobs),
            by_status=by_status,
            with_score=len(scores),
            avg_score=avg_score,
        )

    def get_application_analytics(self) -> ApplicationAnalytics:
        applications = self._application_repo.list_all()
        by_status: dict[str, int] = {}
        with_resume = 0
        for a in applications:
            if a.status:
                by_status[a.status] = by_status.get(a.status, 0) + 1
            if a.resume_id is not None:
                with_resume += 1
        return ApplicationAnalytics(
            total=len(applications),
            by_status=by_status,
            with_resume=with_resume,
        )

    def get_document_analytics(self) -> DocumentAnalytics:
        documents = self._document_repo.list_all()
        by_category: dict[str, int] = {}
        by_source: dict[str, int] = {}
        total_size = 0
        for d in documents:
            if d.category:
                by_category[d.category] = by_category.get(d.category, 0) + 1
            if d.source:
                by_source[d.source] = by_source.get(d.source, 0) + 1
            if d.file_size:
                total_size += d.file_size
        return DocumentAnalytics(
            total=len(documents),
            by_category=by_category,
            by_source=by_source,
            total_size_bytes=total_size,
        )

    def get_ats_analytics(self) -> AtsAnalytics:
        jobs = self._job_repo.list_all()
        scores: list[float] = []
        keyword_rates: list[float] = []
        formatting_scores: list[float] = []
        for j in jobs:
            if j.score is not None:
                scores.append(float(j.score))
            if j.fit_score is not None:
                scores.append(float(j.fit_score))
            if j.evaluation_json:
                try:
                    ev = json.loads(j.evaluation_json)
                    if isinstance(ev, dict):
                        kr = ev.get("keyword_match_rate")
                        if kr is not None:
                            keyword_rates.append(float(kr))
                        fmt = ev.get("formatting_score")
                        if fmt is not None:
                            formatting_scores.append(float(fmt))
                except (json.JSONDecodeError, TypeError, ValueError):
                    pass
        all_scores = scores
        return AtsAnalytics(
            total_scores=len(all_scores),
            avg_ats_score=round(sum(all_scores) / len(all_scores), 1) if all_scores else None,
            avg_keyword_match_rate=round(sum(keyword_rates) / len(keyword_rates), 1) if keyword_rates else None,
            avg_formatting_score=round(sum(formatting_scores) / len(formatting_scores), 1) if formatting_scores else None,
        )

    def get_knowledge_analytics(self) -> KnowledgeAnalytics:
        records = self._knowledge_repo.list_all()
        by_source_type: dict[str, int] = {}
        indexed = 0
        total_chunks = 0
        for r in records:
            if r.source_type:
                by_source_type[r.source_type] = by_source_type.get(r.source_type, 0) + 1
            if r.embedding_json:
                indexed += 1
            total_chunks += r.chunk_count or 0
        return KnowledgeAnalytics(
            total=len(records),
            by_source_type=by_source_type,
            indexed=indexed,
            total_chunks=total_chunks,
        )

    def get_plugin_analytics(self) -> PluginAnalytics:
        plugins = self._plugin_repo.list_all()
        by_status: dict[str, int] = {}
        by_category: dict[str, int] = {}
        for p in plugins:
            if p.status:
                by_status[p.status] = by_status.get(p.status, 0) + 1
            if p.category:
                by_category[p.category] = by_category.get(p.category, 0) + 1
        return PluginAnalytics(
            total=len(plugins),
            by_status=by_status,
            by_category=by_category,
        )

    def get_recent_activity(self, days: int = 7) -> RecentActivity:
        from datetime import timedelta

        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days)
        recent_profiles = _count(self._session, Profile) if self._profile_repo.get() else 0
        recent_resumes = len([r for r in self._resume_repo.list() if r.created_at and r.created_at >= cutoff])
        recent_jobs = len([j for j in self._job_repo.list_all() if j.created_at and j.created_at >= cutoff])
        recent_applications = len([a for a in self._application_repo.list_all() if a.created_at and a.created_at >= cutoff])
        recent_documents = len([d for d in self._document_repo.list_all() if d.created_at and d.created_at >= cutoff])
        recent_knowledge = len([k for k in self._knowledge_repo.list_all() if k.created_at and k.created_at >= cutoff])

        all_dates: list[datetime] = []
        resume_items = self._resume_repo.list()
        for item in resume_items:
            if item.created_at:
                all_dates.append(item.created_at)
            if item.updated_at:
                all_dates.append(item.updated_at)
        for repo in [
            self._job_repo,
            self._application_repo,
            self._document_repo,
            self._knowledge_repo,
        ]:
            for item in repo.list_all():
                if item.created_at:
                    all_dates.append(item.created_at)
                if item.updated_at:
                    all_dates.append(item.updated_at)

        last_activity = max(all_dates).isoformat() if all_dates else None

        return RecentActivity(
            recent_profiles=recent_profiles,
            recent_resumes=recent_resumes,
            recent_jobs=recent_jobs,
            recent_applications=recent_applications,
            recent_documents=recent_documents,
            recent_knowledge=recent_knowledge,
            last_activity=last_activity,
        )

    def get_summary(self) -> AnalyticsSummary:
        return AnalyticsSummary(
            profile=self.get_profile_analytics(),
            resumes=self.get_resume_analytics(),
            jobs=self.get_job_analytics(),
            applications=self.get_application_analytics(),
            documents=self.get_document_analytics(),
            ats=self.get_ats_analytics(),
            knowledge=self.get_knowledge_analytics(),
            plugins=self.get_plugin_analytics(),
            recent_activity=self.get_recent_activity(),
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
