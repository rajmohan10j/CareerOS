# Scripts

Utility scripts for development, repository maintenance, documentation generation, and release automation.

| Script | Purpose |
|---|---|
| `setup-check.ps1` | First-run readiness check for tools, dependencies, ports, and optional live endpoints. |
| `doctor.ps1` | Environment health check for installed tools, project files, and npm scripts. |
| `start-backend.ps1` | Starts the local FastAPI backend with dependency and port checks. |
| `test-backend.ps1` | Runs Ruff and backend tests. |
| `test-desktop.ps1` | Runs desktop tests. |
| `test-extension.ps1` | Runs browser-extension tests. |
| `verify-all.ps1` | Runs all test suites in sequence. |
| `release-check.ps1` | Runs release-readiness checks. |

For a fresh setup, run:

```powershell
.\scripts\setup-check.ps1
```

After starting the backend and desktop server, run:

```powershell
.\scripts\setup-check.ps1 -RequireLive
```
