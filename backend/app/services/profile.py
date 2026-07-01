import json

from app.models.profile import Profile
from app.repositories.profile import ProfileRepository
from app.schemas.profile import ProfileUpdate


def _json_dumps(value: object) -> str | None:
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False, default=str)


def _json_loads(value: str | None) -> object | None:
    if value is None:
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return value


class ProfileService:
    def __init__(self, repository: ProfileRepository) -> None:
        self.repository = repository

    def get(self) -> Profile | None:
        return self.repository.get()

    _JSON_FIELDS = {
        "target_roles",
        "industries",
        "locations",
        "salary_expectations",
        "preferences_json",
    }

    def _to_db_value(self, field: str, value: object) -> object:
        if field in self._JSON_FIELDS:
            return _json_dumps(value)
        return value

    def update(self, data: ProfileUpdate) -> Profile:
        existing = self.repository.get()
        if existing:
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(existing, field, self._to_db_value(field, value))
            existing.user_id = 1
            return self.repository.upsert(existing)
        profile = Profile(
            user_id=1,
            summary=data.summary,
            target_roles=_json_dumps(data.target_roles),
            industries=_json_dumps(data.industries),
            locations=_json_dumps(data.locations),
            salary_expectations=_json_dumps(data.salary_expectations),
            preferences_json=_json_dumps(data.preferences_json),
        )
        return self.repository.upsert(profile)


def profile_to_response(profile: Profile) -> dict:
    return {
        "id": profile.id,
        "summary": profile.summary,
        "target_roles": _json_loads(profile.target_roles),
        "industries": _json_loads(profile.industries),
        "locations": _json_loads(profile.locations),
        "salary_expectations": _json_loads(profile.salary_expectations),
        "preferences_json": _json_loads(profile.preferences_json),
        "created_at": profile.created_at.replace(tzinfo=None).isoformat()
        if profile.created_at
        else None,
        "updated_at": profile.updated_at.replace(tzinfo=None).isoformat()
        if profile.updated_at
        else None,
    }
