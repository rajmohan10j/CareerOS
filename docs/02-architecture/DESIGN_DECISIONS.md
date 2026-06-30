# DESIGN_DECISIONS

Document ID: DOC-076  
Version: 0.1.0  
Status: Draft  
Milestone: 08A – System Architecture Pack

## Purpose

Summarizes key architectural design decisions.

## Decisions

1. CareerOS is a platform, not only an app.
2. Backend owns core business logic.
3. SQLite is the default local database.
4. FastAPI is the initial backend framework.
5. Ollama is the default AI runtime.
6. Tauri is preferred for desktop.
7. Flutter is preferred for mobile.
8. Next.js is preferred for web.
9. Browser extension is required for autofill.
10. Plugins are permission-scoped.

## ADR Requirement

Every major future change must be recorded as an ADR.
