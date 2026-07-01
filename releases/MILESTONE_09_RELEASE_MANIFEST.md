# Milestone 09 Release Manifest

Document ID: DOC-078  
Version: 0.1.0  
Status: Implemented (Milestone 10A – Developer Preview Release Preparation)

## Release Information

| Field | Value |
|---|---|
| Release Version | v0.1.1 |
| Release Stage | Developer Preview |
| Milestone | 09 (09A–09T) |
| Date | Milestone 10A |
| Manifest Version | 1.0.0 |

## Baseline Components

### Backend (Python/FastAPI)

| Component | Status | Tests | Details |
|---|---|---|---|
| Health API | Done | — | GET /health |
| Profile API | Done | 10 | CRUD, JSON field normalization |
| Resume API | Done | 32 | CRUD, AI generation, versioning |
| Document API | Done | 45 | CRUD, AI parse/classify, search |
| Job API | Done | 57 | CRUD, AI evaluate, skill matching |
| Experience API | Done | 24 | CRUD |
| Skill API | Done | 26 | CRUD, category filtering |
| Application API | Done | 30 | CRUD, status filtering |
| ATS Optimization | Done | 66 | Score, analyze, optimize |
| AI Service | Done | 55 | Ollama, OpenRouter, registry, router, retry |
| Plugin SDK | Done | 55 | 7 API endpoints, manifest validation |
| Knowledge Base | Done | 54 | Chunking, embedding, keyword search |
| Analytics | Done | 17 | 8 endpoints, summary |
| Database | Done | 4 | SQLite + SQLModel + BaseTable |

### Browser Extension (Manifest V3)

| Component | Status | Tests | Details |
|---|---|---|---|
| Skeleton | Done | 37 | Manifest V3, popup, options, background |
| Field Detection | Done | 46 | 22 field types, confidence scoring |
| Field Classification | Done | 46 | Intent classifier, sensitive tagging |
| Profile Client | Done | 23 | Fetch profile from backend |
| Autofill Mapping | Done | 64 | 20 intents, 5 status levels |
| Approval State | Done | 46 | In-memory approve/reject store |
| Mapping Preview | Done | 59 | HTML toggles, safe auto-select |
| Autofill Executor | Done | 31 | Build fill fields, send message |
| Controlled Fill | Done | 56 | Content script, safety checks |
| Safety Guards | Done | 22 | No submit, no click, no file upload |
| Extension Tests | Done | 172 | File structure, source validation |

### Desktop App (Vanilla JS SPA)

| Component | Status | Tests | Details |
|---|---|---|---|
| Shell | Done | 91 | 9 pages, sidebar, health polling, settings |
| Analytics Dashboard | Done | 17 | 8 stat cards, live data |
| API Client | Done | — | checkHealth, fetchAnalytics, 5s timeout |

### Plugin SDK

| Component | Status | Details |
|---|---|---|
| Manifest Schema | Done | JSON Schema with 16 fields |
| Documentation | Done | 5 docs (SDK, manifest, permissions, lifecycle, security) |
| API Endpoints | Done | 7 endpoints (register, validate, list, get, enable, disable, delete) |

### Operations

| Component | Status | Details |
|---|---|---|
| start-backend.ps1 | Done | Start FastAPI backend |
| test-backend.ps1 | Done | Run backend tests |
| test-extension.ps1 | Done | Run extension tests |
| test-desktop.ps1 | Done | Run desktop tests |
| verify-all.ps1 | Done | Run all test suites |
| doctor.ps1 | Done | Environment verification (read-only) |
| release-check.ps1 | Done | Release readiness checks |

## Test Summary

| Suite | Count |
|---|---|
| Backend | 506 |
| Browser Extension | 570 |
| Desktop App | 108 |
| **Total** | **1,184** |

## Dependencies

### Backend (pyproject.toml)

- Python 3.11+
- FastAPI, SQLModel, Pydantic, SQLite
- Ollama (optional — free, local) or OpenRouter (optional — requires API key)
- No paid API dependencies
- Full list in `backend/pyproject.toml`

### Browser Extension

- Node.js 18+ (for tests only)
- No runtime dependencies — pure Vanilla JS
- Not a Node.js application; package.json is for test tooling only

### Desktop App

- No npm runtime dependencies
- Pure Vanilla JS — no frameworks

## Security Posture

- All data stays on localhost by default
- No paid API required — Ollama is free and local
- No telemetry, no analytics, no tracking
- No cloud service dependencies
- No secrets committed to repository
- Extension permissions: `storage` + `localhost:8000` only
- All autofill requires explicit user approval
- Sensitive fields cannot be auto-approved
- Fill execution rejects dangerous field types (password, hidden, file, submit, etc.)
- Plugin SDK validates all permissions against known list

## Known Limitations

- Desktop app is Vanilla JS SPA — not yet wrapped in Tauri/Electron
- Desktop placeholder pages not wired to live API endpoints
- No CI/CD pipeline
- No automated installer script
- Firefox and Safari not supported
- Browser extension tested on Chrome/Edge only
- No distribution artifacts (zip, installer)

## Next Steps

See `EXECUTION/003_NEXT_TASK.md` for planned Milestone 10 work.
