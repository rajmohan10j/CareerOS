# CareerOS

> Developer Preview v0.1.1 — Local-first career management platform with AI-powered job tracking, resume optimization, browser autofill, and analytics.

[![Milestone 09](https://img.shields.io/badge/milestone-09--T%20complete-brightgreen)](#)
[![Tests](https://img.shields.io/badge/tests-1%2C184%20passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

## Privacy & Security

- **Local-first** — all data stays on your machine
- **No paid API required** — works with free local Ollama
- **No telemetry** — no analytics, no tracking, no external calls
- **No cloud dependency** — fully self-contained
- **User approval required** for all autofill operations
- **Minimal permissions** — `storage` + `localhost:8000` only

## Features

| Module | Description |
|---|---|
| **Backend APIs** | FastAPI + SQLite — profile, resumes, documents, jobs, applications, skills, experience |
| **Resume Engine** | AI-powered generation, versioning, and content optimization |
| **Document Intelligence** | AI parse, classify, and search uploaded documents |
| **Job Intelligence** | AI evaluate, skill matching, gap analysis, and recommendations |
| **ATS Engine** | Score, analyze, and optimize resumes for applicant tracking systems |
| **Browser Extension** | Manifest V3 — field detection (22 types), autofill mapping, user approval, safe fill |
| **Desktop Shell** | Vanilla JS SPA — dashboard, analytics, health monitoring, settings |
| **Plugin SDK** | Manifest schema, validation, lifecycle management, 7 API endpoints |
| **Knowledge Base** | RAG-powered chunking, embedding, and keyword search |
| **Analytics Dashboard** | 8 live stat cards across all platform modules |

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

## Browser Support

| Browser | Status |
|---|---|
| Chrome | ✅ Primary |
| Edge | ✅ Primary |
| Brave | 🔶 Best effort |
| Firefox | 📋 Planned |
| Safari | 🔮 Future |
| Mobile | ❌ Not supported |

See `browser-extension/docs/BROWSER_SUPPORT_MATRIX.md` for details.

## Test Count

| Component | Tests |
|---|---|
| Backend | 506 |
| Browser Extension | 570 |
| Desktop | 108 |
| **Total** | **1,184** |

## Documentation

See `docs/08-operations/LOCAL_STARTUP_GUIDE.md` for full setup instructions.

## License

MIT
