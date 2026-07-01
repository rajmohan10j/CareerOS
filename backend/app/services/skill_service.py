from datetime import datetime, timezone

from app.models.skill import Skill
from app.repositories.skill import SkillRepository
from app.schemas.skill import SkillCreate, SkillUpdate


def skill_to_response(skill: Skill) -> dict:
    return {
        "id": skill.id,
        "profile_id": skill.profile_id,
        "name": skill.name,
        "category": skill.category,
        "proficiency": skill.proficiency,
        "evidence": skill.evidence,
        "created_at": skill.created_at.replace(tzinfo=None).isoformat() if skill.created_at else None,
        "updated_at": skill.updated_at.replace(tzinfo=None).isoformat() if skill.updated_at else None,
    }


class SkillService:
    def __init__(self, skill_repository: SkillRepository) -> None:
        self._repo = skill_repository

    def list_all(self) -> list[Skill]:
        return self._repo.list_all()

    def get_by_id(self, skill_id: int) -> Skill | None:
        return self._repo.get_by_id(skill_id)

    def create(self, data: SkillCreate) -> Skill:
        skill = Skill(
            profile_id=1,
            name=data.name,
            category=data.category,
            proficiency=data.proficiency,
            evidence=data.evidence,
        )
        return self._repo.create(skill)

    def update(self, skill_id: int, data: SkillUpdate) -> Skill | None:
        skill = self._repo.get_by_id(skill_id)
        if skill is None:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(skill, field, value)
        skill.updated_at = datetime.now(timezone.utc)
        return self._repo.update(skill)

    def delete(self, skill_id: int) -> bool:
        return self._repo.delete(skill_id)

    def list_by_category(self, category: str) -> list[Skill]:
        return self._repo.list_by_category(category)
