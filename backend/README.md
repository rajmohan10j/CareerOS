# Backend

Document ID: DOC-020  
Version: 0.1.0  
Status: Draft

## Purpose

The backend provides the shared service layer for CareerOS across desktop, mobile, web, browser extension, and automation clients.

## Responsibilities

- User profile service
- Resume intelligence service
- Job and application tracking service
- AI provider abstraction
- Plugin runtime coordination
- Local database access
- API gateway for clients

## Initial Technology

- Python 3.11+
- FastAPI
- SQLite
- SQLAlchemy or SQLModel
- Pydantic
- Uvicorn
- pytest
- Local filesystem storage
- Optional PostgreSQL migration path

## Project Structure

```
backend/
├── app/
│   ├── api/            # Route handlers (thin)
│   ├── core/           # Core utilities
│   ├── services/       # Business logic
│   ├── models/         # Domain/data models
│   └── repositories/   # Persistence layer
├── tests/              # pytest suite
├── pyproject.toml
└── README.md
```

## Quickstart

```bash
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Testing

```bash
cd backend
pytest
```

## Local Path

`C:\Users\Raj\Projects\CareerOS\backend\README.md`
