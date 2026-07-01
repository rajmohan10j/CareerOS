# Developer Preview Release Notes

Document ID: DOC-074  
Version: 0.1.0  
Status: Implemented (Milestone 10A – Developer Preview Release Preparation)

## Version

v0.1.1 — Developer Preview baseline (Milestone 09)

## Summary

CareerOS is a local-first career management platform with AI-powered job tracking, resume optimization, browser autofill, and analytics. This Developer Preview marks the completion of all 20 Milestone 09 sub-milestones (09A–09T) and provides a stable baseline for testing, feedback, and future development.

## Key Features

### Backend APIs (FastAPI, SQLite)

- Profile management (create, read, update)
- Resume intelligence (CRUD, AI generation, versioning)
- Document intelligence (CRUD, AI parse/classify, search)
- Job intelligence (CRUD, AI analyze/evaluate, skill matching)
- Experience, skill, and application management
- ATS optimization engine (score, analyze, optimize)
- RAG knowledge base (chunking, embedding, keyword search)
- Plugin SDK (manifest validation, lifecycle management)
- Analytics dashboard (8 endpoints across all modules)

### Browser Extension (Manifest V3)

- Field detection engine — 22 field types with confidence scoring
- Autofill mapping engine — 20 intents with 5 status levels
- Safe autofill preview with per-field approval toggles
- Controlled fill execution with strict safety guards
- Sensitive field handling (purple warning, disabled auto-approve)
- Low-confidence indicators (orange badges with tooltips)

### Desktop App (Vanilla JS SPA)

- Hash-based routing with 9 pages
- Sidebar navigation with active state
- Live analytics dashboard (8 stat cards)
- Backend health monitoring (30s polling)
- Settings page with URL configuration and test connection

### Plugin SDK

- Manifest JSON Schema with 16 fields
- 5 documentation files (SDK, manifest, permissions, lifecycle, security)
- 7 API endpoints (register, validate, list, get, enable, disable, delete)
- Validation: required fields, semver, category enum, known permissions

## Test Summary

| Component | Tests |
|---|---|
| Backend | 506 passing |
| Browser Extension | 570 passing |
| Desktop App | 108 passing |
| **Total** | **1,184 passing** |

## Browser Support

| Browser | Status |
|---|---|
| Chrome | Primary — fully tested, Manifest V3 |
| Edge | Primary — fully tested, Chromium-based |
| Brave | Best effort — Chromium-based, may need adjustments |
| Firefox | Planned — future milestone |
| Safari | Future — not yet scoped |
| Mobile browsers | Not supported initially |

## Privacy & Security

- **Local-first** — all data stays on localhost by default
- **No paid API required** — works with free Ollama; OpenRouter optional
- **No telemetry** — no analytics, no tracking, no external calls
- **No cloud dependency** — fully self-contained
- **No automatic job submission** — all autofill requires explicit user approval
- **User approval required for autofill** — per-field approve/reject toggles before any fill
- **Minimal extension permissions** — `storage` + `localhost:8000` only

## Known Limitations

- Desktop app is a Vanilla JS SPA — not yet wrapped in Tauri/Electron
- Browser extension tested on Chrome/Edge only
- No CI/CD pipeline configured
- No automated installer script
- Desktop placeholder pages not yet wired to live API endpoints
- Firefox support not implemented
- Mobile browsers not supported

## Quick Start

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
..\scripts\start-backend.ps1
```

Open `http://127.0.0.1:8000/docs` for Swagger UI.

## Related Documents

- `DEVELOPER_PREVIEW_CHECKLIST.md` — release verification checklist
- `GITHUB_RELEASE_CHECKLIST.md` — GitHub publication steps
- `PUBLIC_RELEASE_READINESS.md` — readiness assessment
- `MILESTONE_09_COMPLETION_REPORT.md` — full milestone completion report
