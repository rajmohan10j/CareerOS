# Contributing to CareerOS

Thank you for your interest in contributing! CareerOS is a local-first career management platform. We welcome contributions from everyone.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Read the [README](README.md) for project overview.
2. Read the [ENGINEERING_BIBLE](ENGINEERING_BIBLE/README.md) for architecture and standards.
3. Check [FIRST_GOOD_ISSUES.md](docs/06-community/FIRST_GOOD_ISSUES.md) for beginner-friendly tasks.
4. Review open issues labeled `good first issue` or `help wanted`.

## How to Contribute

CareerOS follows a GitOps workflow. Code, tests, documentation, release notes, and reviewed non-sensitive fixtures should move through Git branches, GitHub pull requests, GitHub Actions, and release manifests. See [GITOPS_OPERATING_MODEL.md](docs/03-development/GITOPS_OPERATING_MODEL.md).

### Setup

```powershell
git clone <repo-url>
cd CareerOS

# Backend
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
cd ..
```

### Run Tests

```powershell
.\scripts\verify-all.ps1        # All tests
.\scripts\test-backend.ps1      # Backend only
.\scripts\test-extension.ps1    # Extension only
.\scripts\test-desktop.ps1      # Desktop only
.\scripts\doctor.ps1            # Environment check
```

## Coding Rules

### Backend (Python)

- Follow Ruff linting rules (`python -m ruff check app tests`)
- Use type hints for all functions
- Write tests for all new code (pytest, async)
- No paid API dependencies
- No telemetry or tracking

### Browser Extension (JavaScript)

- Vanilla JS only — no frameworks or libraries
- Use ES modules
- Minimal permissions (`storage` + `localhost:8000`)
- No autofill logic outside content.js
- All fill operations require user approval

### Desktop App (JavaScript)

- Vanilla JS only — no frameworks
- Keep it thin — no backend service duplication
- No paid/cloud dependencies

### Plugin SDK

- No plugin code execution in core
- Validate all permissions against known list
- Collect all validation errors before returning

## Documentation Rules

- Every feature must include documentation updates
- Update `CHANGELOG.md` for user-visible changes
- Update `EXECUTION/` docs for milestone changes
- Follow existing document format and style

## Pull Request Rules

1. One feature/fix per PR
2. Clear description linking to issues
3. All CI checks must pass
4. Request review from maintainers
5. Do not add paid API dependencies, telemetry, or cloud services
6. Do not commit secrets or credentials
7. Add tests for new functionality
8. Update documentation for changes
9. Do not commit local databases, generated caches, private resumes, private application records, or unsanitized reference data
10. Update release/status docs when a change affects live-test or release readiness

## Security

- Report vulnerabilities privately via SECURITY.md
- Do not commit `.env` files or API keys
- Do not commit local SQLite databases, private resume content, compensation data, addresses, or private application answers
- All data must stay local by default
- No automatic job submission or data transmission

## Questions?

Open a GitHub Discussion for questions. Tag maintainers in issues for guidance.
