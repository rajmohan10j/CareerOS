from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings


def get_engine():
    connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
    return create_engine(
        settings.database_url,
        echo=settings.debug,
        connect_args=connect_args,
    )


def init_db() -> None:
    SQLModel.metadata.create_all(get_engine())


def get_session() -> Generator[Session, None]:
    engine = get_engine()
    with Session(engine) as session:
        yield session
