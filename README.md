# CareerOS

Local-first career management platform with AI-powered job tracking, resume optimization, browser autofill, and analytics.

## Milestone 09 Complete

All 20 sub-milestones (09A–09T) are implemented:

- **Backend** (FastAPI, SQLite, 506 tests) — Profile, resumes, documents, jobs, applications, skills, experience, ATS optimization, RAG knowledge base, plugin SDK, analytics
- **Browser Extension** (Manifest V3, 570 tests) — Field detection, autofill mapping, approval preview, safe fill execution
- **Desktop App** (Vanilla JS SPA, 108 tests) — Dashboard with live analytics, sidebar navigation, health monitoring
- **Plugin SDK** — Manifest schema, validation, lifecycle management, 7 API endpoints
- **Operations** — 7 PowerShell scripts, local startup guide, troubleshooting guide

## Quick Start

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
..\scripts\start-backend.ps1
```

Open `http://127.0.0.1:8000/docs` for Swagger UI.

Run `.\scripts\doctor.ps1` to check your environment.

## Test Count

| Component | Tests |
|---|---|
| Backend | 506 |
| Browser Extension | 570 |
| Desktop | 108 |
| **Total** | **1,184** |

## Next: Milestone 10 – Developer Preview

- **10A** – Developer Preview Release Preparation
- **10B** – GitHub Repository Publication Prep
- **10C** – Installer / Setup Improvements
- **10D** – Real-World Browser Extension Testing Pack
- **10E** – Desktop Backend Integration v1
- **10F** – Public Developer Preview v0.1.0

## License

MIT
