# Contributor Onboarding

Document ID: DOC-080  
Version: 0.1.0  
Status: Implemented (Milestone 10B – GitHub Repository Publication Prep)

## Welcome

Thank you for your interest in contributing to CareerOS! This guide will help you get started.

## Prerequisites

- Git
- Python 3.11+
- Node.js 18+
- A code editor (VS Code recommended)

## Quick Start

```powershell
# Clone the repository
git clone <repo-url>
cd CareerOS

# Set up the backend
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
cd ..

# Start the backend
.\scripts\start-backend.ps1
```

Open `http://127.0.0.1:8000/docs` for Swagger UI.

## Running Tests

```powershell
# All tests
.\scripts\verify-all.ps1

# Individual suites
.\scripts\test-backend.ps1
.\scripts\test-extension.ps1
.\scripts\test-desktop.ps1

# Environment check
.\scripts\doctor.ps1
```

## Project Structure

```
CareerOS/
├── backend/            # FastAPI backend (Python)
├── browser-extension/  # Manifest V3 extension (JS)
├── desktop/            # Vanilla JS SPA
├── plugins/            # Plugin SDK
├── scripts/            # PowerShell scripts
├── docs/               # Documentation
├── EXECUTION/          # Milestone tracking
└── ENGINEERING_BIBLE/  # Engineering standards
```

## Finding Issues to Work On

See `FIRST_GOOD_ISSUES.md` for starter-friendly tasks.

Look for issues labeled:
- `good first issue` — beginner-friendly
- `help wanted` — needs contributor
- `bug` — bug fixes
- `enhancement` — feature requests
- `documentation` — docs improvements

## Coding Rules

1. **Backend (Python)**: Follow Ruff linting rules. Use type hints. Write tests for all new code.
2. **Browser Extension (JS)**: Vanilla JS only — no frameworks. Use ES modules.
3. **Desktop (JS)**: Vanilla JS only — no frameworks. Keep it thin (no backend duplication).
4. **Tests**: All tests must pass before merging. Add tests for new functionality.

## Documentation Rules

1. Every feature must include documentation.
2. Update `CHANGELOG.md` for user-visible changes.
3. Update `EXECUTION/` docs for milestone changes.
4. Use clear, concise language.

## PR Rules

1. One feature/fix per PR.
2. Write a clear description linking to any related issues.
3. Ensure all CI checks pass.
4. Request review from maintainers.
5. Do not add paid API dependencies, telemetry, or cloud services.

## Security

- Do not commit secrets, API keys, or credentials.
- Do not add paid API dependencies.
- Do not add telemetry or tracking.
- All data must stay local by default.
- Follow the guidelines in `SECURITY.md`.

## Getting Help

- Open a Discussion for questions
- Tag maintainers in issues for guidance
- Read the ENGINEERING_BIBLE for detailed standards
