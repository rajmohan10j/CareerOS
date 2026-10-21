from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.config import settings


def get_engine():
    connect_args = (
        {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
    )
    return create_engine(
        settings.database_url,
        echo=settings.debug,
        connect_args=connect_args,
    )


def init_db() -> None:
    engine = get_engine()
    SQLModel.metadata.create_all(engine)
    # Check SQLite migrations for existing profiles table
    try:
        from sqlmodel import text
        with Session(engine) as session:
            info = session.exec(text("PRAGMA table_info(profiles)")).all()
            cols = {row[1] for row in info}
            if cols and "name" not in cols:
                session.exec(text("ALTER TABLE profiles ADD COLUMN name TEXT DEFAULT 'Primary Profile'"))
            if cols and "is_active" not in cols:
                session.exec(text("ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT 1"))
            session.commit()
    except Exception:
        pass


def get_session() -> Generator[Session, None]:
    engine = get_engine()
    with Session(engine) as session:
        yield session
