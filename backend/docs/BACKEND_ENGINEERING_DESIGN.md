# BACKEND_ENGINEERING_DESIGN

Document ID: DOC-077  
Version: 0.1.0  
Status: Draft  
Milestone: 08B – Backend Engineering Pack

## Purpose

This document defines the backend engineering design for CareerOS.

## Backend Goals

- Run locally by default.
- Expose stable APIs for all clients.
- Keep business logic centralized.
- Support AI provider abstraction.
- Support plugin execution later.
- Store user data in local-first persistence.

## Recommended Stack

- Python
- FastAPI
- Pydantic
- SQLModel or SQLAlchemy
- SQLite
- Alembic
- pytest
- Uvicorn

## Backend Layering

```text
api/
  ↓
services/
  ↓
domain/
  ↓
repositories/
  ↓
database/
```

## Initial Backend Modules

- health
- profile
- resume
- jobs
- applications
- documents
- ai
- plugins
- settings
- audit

## Rules

- API routes must remain thin.
- Services contain business logic.
- Repositories handle persistence.
- AI calls go through AI Provider Service.
- No route should directly call Ollama or any concrete model.
