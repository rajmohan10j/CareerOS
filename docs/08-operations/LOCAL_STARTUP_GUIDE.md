# Local Startup Guide

Document ID: DOC-070  
Version: 0.1.0  
Status: Implemented (Milestone 09T – Production Readiness Foundation)

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm (ships with Node.js)

## Quick Start

### 1. Clone and enter the repository

```powershell
git clone <repo-url>
cd CareerOS
```

### 2. Run the first setup check

```powershell
.\scripts\setup-check.ps1
```

This verifies Python, Node.js, npm, backend imports, npm scripts, and local port state. Warnings for backend or desktop live endpoints are expected before you start them.

### 3. Set up the Python backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
cd ..
```

### 4. Start the backend

```powershell
.\scripts\start-backend.ps1
```

The backend starts on `http://127.0.0.1:8000`.  
Open `http://127.0.0.1:8000/docs` for the Swagger UI.

### 5. Start the desktop app (in a second terminal)

```powershell
cd desktop
npm start
```

Open `http://127.0.0.1:5173` in your browser.

### 6. Verify the live local loop

```powershell
.\scripts\setup-check.ps1 -RequireLive
```

This confirms the backend health endpoint, Swagger UI, and desktop app are reachable.

### 7. Load the browser extension (development mode)

1. Open Chrome/Edge and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the canonical `browser-extension/` folder.
4. The extension icon appears in the toolbar.

Rule: use `browser-extension/` as the only manual Load unpacked target. Generated folders or zip files under `releases/` are temporary artifacts and should not be kept as browser-test targets.

## Running Tests

| What | Command |
|---|---|
| All backend tests | `.\scripts\test-backend.ps1` |
| Extension tests | `.\scripts\test-extension.ps1` |
| Desktop tests | `.\scripts\test-desktop.ps1` |
| All tests | `.\scripts\verify-all.ps1` |
| First-run setup check | `.\scripts\setup-check.ps1` |
| Live endpoint setup check | `.\scripts\setup-check.ps1 -RequireLive` |
| Environment check | `.\scripts\doctor.ps1` |
| Release check | `.\scripts\release-check.ps1` |

## Project Structure

```
CareerOS/
├── backend/          # FastAPI backend (Python)
├── browser-extension/ # Chrome/Edge/Firefox extension
├── desktop/          # Desktop app shell (Vanilla JS)
├── plugins/          # Plugin SDK and docs
├── scripts/          # PowerShell utility scripts
├── docs/             # Architecture and user documentation
├── EXECUTION/        # Milestone tracking
├── ENGINEERING_BIBLE/ # Engineering standards
└── database/         # Schema documentation
```

## Configuration

Backend settings are in `backend/.env` (auto-loaded by Pydantic).  
Key settings:

| Variable | Default | Description |
|---|---|---|
| `provider` | `ollama` | AI provider (`ollama` or `openrouter`) |
| `ollama_base_url` | `http://localhost:11434` | Ollama server URL |
| `openrouter_api_key` | `""` | OpenRouter API key |
| `database_url` | `sqlite:///./careeros.db` | Database path |

Desktop and extension backend URL is configurable via their respective Settings pages.

## Next Steps

After startup, use the desktop Dashboard or Swagger UI to:
- Create your profile (PUT /profile)
- Add skills, experience, and resumes
- Track jobs and applications
- Explore the analytics dashboard
- Register plugins via POST /plugins/register
