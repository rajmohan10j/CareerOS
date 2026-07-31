from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from pydantic import ValidationError

from app.schemas.application_campaign import ApplicationCampaignRequest
from app.services.application_campaign_service import ApplicationCampaignService


def test_campaign_request_requires_jobs():
    with pytest.raises(ValidationError):
        ApplicationCampaignRequest(job_ids=[], resume_id=1)


def test_campaign_request_limits_fit_score():
    with pytest.raises(ValidationError):
        ApplicationCampaignRequest(job_ids=[1], resume_id=1, min_fit_score=101)


@pytest.mark.asyncio
async def test_campaign_skips_jobs_below_threshold():
    service = ApplicationCampaignService.__new__(ApplicationCampaignService)
    service._resume_repo = Mock()
    service._resume_repo.get_by_id.return_value = SimpleNamespace(id=1, profile_id=1)
    service._job_repo = Mock()
    service._job_repo.get_by_id.return_value = SimpleNamespace(
        id=10, title="Project Manager", company="Example"
    )
    service._job_service = Mock()
    service._job_service.evaluate = AsyncMock(
        return_value={"fit_score": 55.0, "recommendation": "consider"}
    )
    service._ats_service = Mock()
    service._application_service = Mock()

    result = await service.prepare(
        ApplicationCampaignRequest(job_ids=[10], resume_id=1, min_fit_score=65)
    )

    assert result.prepared == 0
    assert result.skipped == 1
    assert result.items[0].decision == "skipped"
    service._ats_service.optimize.assert_not_called()
    service._application_service.create.assert_not_called()


@pytest.mark.asyncio
async def test_campaign_prepares_review_required_draft_without_tailoring():
    service = ApplicationCampaignService.__new__(ApplicationCampaignService)
    service._resume_repo = Mock()
    service._resume_repo.get_by_id.return_value = SimpleNamespace(id=2, profile_id=1)
    service._job_repo = Mock()
    service._job_repo.get_by_id.return_value = SimpleNamespace(
        id=20, title="Delivery Lead", company="Example"
    )
    service._job_service = Mock()
    service._job_service.evaluate = AsyncMock(
        return_value={"fit_score": 82.0, "recommendation": "apply"}
    )
    service._ats_service = Mock()
    service._application_service = Mock()
    service._application_service.create.return_value = SimpleNamespace(id=99)

    result = await service.prepare(
        ApplicationCampaignRequest(
            job_ids=[20],
            resume_id=2,
            min_fit_score=65,
            tailor_resume=False,
        )
    )

    assert result.prepared == 1
    assert result.submission_mode == "human_review_required"
    assert result.items[0].application_id == 99
    assert result.items[0].review_required is True
    created = service._application_service.create.call_args.args[0]
    assert created.status == "review_required"
    service._ats_service.optimize.assert_not_called()


def test_campaign_has_no_automatic_submission_or_login_automation():
    source = Path("app/services/application_campaign_service.py").read_text(encoding="utf-8")
    lowered = source.lower()
    assert "form.submit" not in lowered
    assert ".click(" not in lowered
    assert "captcha" not in lowered
    assert "password" not in lowered
    assert "status=\"applied\"" not in source
