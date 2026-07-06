# CareerOS

> **Developer Preview** — Local-first career management platform with AI-powered job tracking, resume optimization, browser autofill, and analytics.

> ✅ **Live-test developer preview released.** All 9 desktop pages are live with real backend API calls, local desktop-to-backend CORS is verified, and automated backend/desktop/extension checks pass. See `docs/08-operations/MVP_LIVE_RUN_GUIDE.md`, `docs/08-operations/LIVE_TEST_REPORT.md`, and `releases/LIVE_TEST_RELEASE_2026-07-06.md`.

[![Tests](https://img.shields.io/badge/tests-1%2C490%20verified-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/)
[![Node](https://img.shields.io/badge/node-18%2B-green)](https://nodejs.org/)

## What is CareerOS?

CareerOS is a **local-first** career management platform that helps you:

- **Track jobs** and applications across companies
- **Optimize resumes** with ATS scoring and AI-powered suggestions
- **Analyze job fit** with skill matching and gap analysis
- **Autofill applications** using a browser extension with user approval
- **Store documents** with AI-powered parsing and classification
- **Monitor analytics** across your entire job search

Everything runs on **your machine** — no cloud, no telemetry, no paid APIs required.

## Privacy & Security

| Principle | Detail |
|---|---|
| **Local-first** | All data stays on your machine. No external servers. |
| **No paid API required** | Works with free local [Ollama](https://ollama.ai). OpenRouter is optional. |
| **No telemetry** | Zero analytics, tracking, or external calls. |
| **No cloud dependency** | Fully self-contained. Backend, database, and AI all local. |
| **User approval required** | All autofill operations require per-field approval. |
| **Minimal permissions** | Extension needs only `storage` + `localhost:8000`. |

## GitOps

CareerOS uses Git, GitHub, and GitHub Actions as the operating source of truth for source code, documentation, tests, release manifests, and reviewed non-sensitive reference fixtures.

Important boundary: local databases, secrets, caches, generated artifacts, and private resume/application data must not be committed. See `docs/03-development/GITOPS_OPERATING_MODEL.md`.

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

## Browser Support

| Browser | Status |
|---|---|
| Chrome | ✅ Primary — fully tested |
| Edge | ✅ Primary — fully tested |
| Brave | 🔶 Best effort — Chromium-based |
| Firefox | 📋 Planned |
| Safari | 🔮 Future |
| Mobile | ❌ Not supported |

## Quick Start

**Prerequisites:** Python 3.11+, Node.js 18+, PowerShell (Windows) or bash (macOS/Linux)

```powershell
# First-run readiness check
.\scripts\setup-check.ps1

# Backend setup
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
cd ..

# Start the backend
.\scripts\start-backend.ps1
```

- Open **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Check your environment: `.\scripts\doctor.ps1`
- Start the desktop app: `cd desktop; npm start`, then open [http://127.0.0.1:5173](http://127.0.0.1:5173)
- Verify the live local loop: `.\scripts\setup-check.ps1 -RequireLive`
- Load the browser extension via `chrome://extensions` → Load unpacked → select the canonical `browser-extension/` folder. Do not load generated copies under `releases/`.

## Test Count

| Component | Tests |
|---|---|
| Backend | 511 |
| Browser Extension | 687 assertion inventory / 188 package smoke |
| Desktop | 292 |
| **Total** | **1,490 assertion inventory** |

## Current Limitations

- **Desktop app** is a Vanilla JS SPA — not yet wrapped in Tauri/Electron
- **No automated installer** — manual setup required
- **Firefox** and **Safari** not yet supported
- **Browser extension** only tested on Chrome and Edge
- **GitHub remote not configured in this checkout** — required before GitHub Actions, PRs, Issues, Releases, and branch protection can become the active control plane
- **No distribution artifacts** — load extension via developer mode

## Documentation

| Document | Description |
|---|---|
| `docs/08-operations/LOCAL_STARTUP_GUIDE.md` | Full setup instructions |
| `docs/08-operations/TROUBLESHOOTING.md` | Common issues and fixes |
| `docs/08-operations/DEVELOPER_PREVIEW_RELEASE_NOTES.md` | Release notes |
| `docs/03-development/GITOPS_OPERATING_MODEL.md` | Git/GitHub operating model |
| `docs/06-community/CONTRIBUTOR_ONBOARDING.md` | Contributor guide |
| `ENGINEERING_BIBLE/README.md` | Engineering standards |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/06-community/CONTRIBUTOR_ONBOARDING.md](docs/06-community/CONTRIBUTOR_ONBOARDING.md).

## License

MIT — see [LICENSE](LICENSE).
