from datetime import datetime, timezone

from app.models.experience import Experience
from app.repositories.experience import ExperienceRepository
from app.schemas.experience import ExperienceCreate, ExperienceUpdate


def experience_to_response(experience: Experience) -> dict:
    return {
        "id": experience.id,
        "profile_id": experience.profile_id,
        "company": experience.company,
        "title": experience.title,
        "start_date": experience.start_date,
        "end_date": experience.end_date,
        "description": experience.description,
        "achievements_json": experience.achievements_json,
        "created_at": experience.created_at.replace(tzinfo=None).isoformat() if experience.created_at else None,
        "updated_at": experience.updated_at.replace(tzinfo=None).isoformat() if experience.updated_at else None,
    }


class ExperienceService:
    def __init__(self, experience_repository: ExperienceRepository) -> None:
        self._repo = experience_repository

    def list_all(self) -> list[Experience]:
        return self._repo.list_all()

    def get_by_id(self, experience_id: int) -> Experience | None:
        return self._repo.get_by_id(experience_id)

    def create(self, data: ExperienceCreate) -> Experience:
        experience = Experience(
            profile_id=1,
            company=data.company,
            title=data.title,
            start_date=data.start_date,
            end_date=data.end_date,
            description=data.description,
            achievements_json=data.achievements_json,
        )
        return self._repo.create(experience)

    def update(self, experience_id: int, data: ExperienceUpdate) -> Experience | None:
        experience = self._repo.get_by_id(experience_id)
        if experience is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(experience, field, value)
        experience.updated_at = datetime.now(timezone.utc)
        return self._repo.update(experience)

    def delete(self, experience_id: int) -> bool:
        return self._repo.delete(experience_id)
