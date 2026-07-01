from sqlmodel import Session, select

from app.models.profile import Profile


class ProfileRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self) -> Profile | None:
        statement = select(Profile).limit(1)
        return self.session.exec(statement).first()

    def upsert(self, profile: Profile) -> Profile:
        self.session.add(profile)
        self.session.commit()
        self.session.refresh(profile)
        return profile
