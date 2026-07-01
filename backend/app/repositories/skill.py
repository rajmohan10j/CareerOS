from sqlmodel import Session, select

from app.models.skill import Skill


class SkillRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self) -> list[Skill]:
        statement = select(Skill).order_by(Skill.updated_at.desc())
        return list(self.session.exec(statement).all())

    def get_by_id(self, skill_id: int) -> Skill | None:
        return self.session.get(Skill, skill_id)

    def create(self, skill: Skill) -> Skill:
        self.session.add(skill)
        self.session.commit()
        self.session.refresh(skill)
        return skill

    def update(self, skill: Skill) -> Skill:
        self.session.add(skill)
        self.session.commit()
        self.session.refresh(skill)
        return skill

    def delete(self, skill_id: int) -> bool:
        skill = self.session.get(Skill, skill_id)
        if skill is None:
            return False
        self.session.delete(skill)
        self.session.commit()
        return True

    def list_by_category(self, category: str) -> list[Skill]:
        statement = select(Skill).where(Skill.category == category).order_by(Skill.updated_at.desc())
        return list(self.session.exec(statement).all())
