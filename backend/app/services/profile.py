import json

from app.models.profile import Profile
from app.repositories.profile import ProfileRepository
from app.schemas.profile import ProfileCreate, ProfileUpdate


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

    def get(self, profile_id: int | None = None) -> Profile | None:
        return self.repository.get(profile_id)

    def list_all(self) -> list[Profile]:
        return self.repository.list_all()

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

    def create(self, data: ProfileCreate) -> Profile:
        existing = self.repository.list_all()
        is_first = len(existing) == 0
        should_be_active = data.is_active or is_first

        profile = Profile(
            user_id=1,
            name=data.name or f"Profile {len(existing) + 1}",
            is_active=should_be_active,
            summary=data.summary,
            target_roles=_json_dumps(data.target_roles),
            industries=_json_dumps(data.industries),
            locations=_json_dumps(data.locations),
            salary_expectations=_json_dumps(data.salary_expectations),
            preferences_json=_json_dumps(data.preferences_json),
        )
        created = self.repository.create(profile)
        if should_be_active and not is_first:
            self.repository.set_active(created.id)
        return created

    def update(self, data: ProfileUpdate) -> Profile:
        existing = self.repository.get()
        if existing:
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(existing, field, self._to_db_value(field, value))
            existing.user_id = 1
            return self.repository.upsert(existing)
        profile = Profile(
            user_id=1,
            name=data.name or "Primary Profile",
            is_active=True,
            summary=data.summary,
            target_roles=_json_dumps(data.target_roles),
            industries=_json_dumps(data.industries),
            locations=_json_dumps(data.locations),
            salary_expectations=_json_dumps(data.salary_expectations),
            preferences_json=_json_dumps(data.preferences_json),
        )
        return self.repository.upsert(profile)

    def update_by_id(self, profile_id: int, data: ProfileUpdate) -> Profile | None:
        target = self.repository.get(profile_id)
        if not target:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(target, field, self._to_db_value(field, value))
        return self.repository.upsert(target)

    def set_active(self, profile_id: int) -> Profile | None:
        return self.repository.set_active(profile_id)

    def delete(self, profile_id: int) -> bool:
        return self.repository.delete(profile_id)


def profile_to_response(profile: Profile) -> dict:
    return {
        "id": profile.id,
        "name": getattr(profile, "name", "Primary Profile") or "Primary Profile",
        "is_active": getattr(profile, "is_active", True) if getattr(profile, "is_active", None) is not None else True,
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
