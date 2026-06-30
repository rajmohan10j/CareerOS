# BACKEND_ARCHITECTURE

Document ID: DOC-021  
Version: 0.1.0  
Status: Draft

## Purpose

Defines the backend architecture for CareerOS.

## Architecture Layers

```text
Client Apps
    ↓
FastAPI API Layer
    ↓
Service Layer
    ↓
Domain Layer
    ↓
Repository Layer
    ↓
SQLite / Vector DB / Filesystem
```

## Core Backend Services

1. Profile Service
2. Resume Service
3. Job Service
4. Application Service
5. Document Service
6. AI Router Service
7. Plugin Service
8. Settings Service
9. Audit Log Service

## Design Rules

- Keep business logic outside API routes.
- Keep persistence logic inside repositories.
- Use dependency injection.
- Keep AI providers behind abstractions.
- Avoid hard-coded model names.
- Do not upload user data by default.

## Acceptance Criteria

- Backend runs locally.
- API documented through OpenAPI.
- SQLite database initialized automatically.
- Services are testable independently.
