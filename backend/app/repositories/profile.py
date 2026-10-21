from sqlmodel import Session, select

from app.models.profile import Profile


class ProfileRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, profile_id: int | None = None) -> Profile | None:
        if profile_id is not None:
            return self.session.get(Profile, profile_id)
        # Try active profile first
        statement = select(Profile).where(Profile.is_active == True).limit(1)  # noqa: E712
        profile = self.session.exec(statement).first()
        if profile is not None:
            return profile
        # Fallback to first profile
        statement = select(Profile).limit(1)
        return self.session.exec(statement).first()

    def list_all(self) -> list[Profile]:
        statement = select(Profile).order_by(Profile.id)
        return list(self.session.exec(statement).all())

    def create(self, profile: Profile) -> Profile:
        self.session.add(profile)
        self.session.commit()
        self.session.refresh(profile)
        return profile

    def upsert(self, profile: Profile) -> Profile:
        self.session.add(profile)
        self.session.commit()
        self.session.refresh(profile)
        return profile

    def set_active(self, profile_id: int) -> Profile | None:
        target = self.session.get(Profile, profile_id)
        if not target:
            return None
        profiles = self.list_all()
        for p in profiles:
            p.is_active = (p.id == profile_id)
            self.session.add(p)
        self.session.commit()
        self.session.refresh(target)
        return target

    def delete(self, profile_id: int) -> bool:
        target = self.session.get(Profile, profile_id)
        if not target:
            return False
        was_active = target.is_active
        self.session.delete(target)
        self.session.commit()
        if was_active:
            remaining = self.list_all()
            if remaining:
                remaining[0].is_active = True
                self.session.add(remaining[0])
                self.session.commit()
        return True
