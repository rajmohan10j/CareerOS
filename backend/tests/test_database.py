from datetime import datetime
from unittest.mock import patch

import pytest
from sqlmodel import Field, Session, SQLModel, create_engine

import app.core.database
from app.models.database import BaseTable


class SampleItem(BaseTable, table=True):
    __tablename__ = "sample_items"
    name: str = Field(index=True)


@pytest.fixture(autouse=True)
def _patch_engine():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with patch.object(app.core.database, "get_engine", return_value=engine):
        yield
    SQLModel.metadata.drop_all(engine)


def test_init_db_creates_tables():
    app.core.database.init_db()
    engine = app.core.database.get_engine()
    inspector = __import__("sqlalchemy").inspect(engine)
    tables = inspector.get_table_names()
    assert "sample_items" in tables


def test_get_session_yields_active_session():
    gen = app.core.database.get_session()
    session = next(gen)
    assert isinstance(session, Session)
    assert session.is_active


def test_base_table_defaults():
    item = SampleItem(name="test")
    assert item.id is None
    assert isinstance(item.created_at, datetime)
    assert item.created_at.tzinfo is not None
    assert isinstance(item.updated_at, datetime)
    assert item.updated_at.tzinfo is not None


def test_crud_operations():
    item = SampleItem(name="test-item")
    session = next(app.core.database.get_session())
    session.add(item)
    session.commit()
    session.refresh(item)

    assert item.id is not None
    assert item.name == "test-item"
    assert isinstance(item.created_at, datetime)
    assert isinstance(item.updated_at, datetime)

    fetched = session.get(SampleItem, item.id)
    assert fetched is not None
    assert fetched.name == "test-item"
