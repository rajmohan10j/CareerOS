# Next Task

Current: Milestone 10C - Installer / Setup Improvements is released for local live test / developer-preview MVP.

GitOps note: Use Git/GitHub as the source of truth going forward for source, docs, tests, release manifests, workflow files, and reviewed non-sensitive fixtures. Do not commit secrets, local databases, caches, generated artifacts, private resumes, private application records, or unsanitized reference data. This checkout still needs a GitHub `origin` remote before GitHub Issues, Pull Requests, Actions, branch protection, and Releases can enforce the workflow.

## Completed And Verified

- Backend starts at `http://127.0.0.1:8000`.
- Desktop serves at `http://127.0.0.1:5173`.
- `GET /health` returns `{"status":"ok","version":"0.1.0","mode":"local"}`.
- `GET /analytics/summary` returns 200 JSON.
- CORS preflight from `http://127.0.0.1:5173` passes.
- Desktop pages are wired to live backend APIs.
- Resume Manager can save pasted text or text/Markdown file content and reload the saved resume detail.
- Dashboard cards are clickable and keyboard-accessible.
- Browser-extension setup guidance now describes local unpacked installation instead of marketplace availability.
- Backend tests: 511 passed.
- Desktop tests: 292 passed.
- Browser extension tests: 687 passed across all test files.
- Ruff: clean.
- First-run setup verifier added at `scripts/setup-check.ps1`.
- `doctor.ps1` now checks backend Python imports and npm project scripts.
- `start-backend.ps1` now checks dependencies and port 8000 before launching.
- Local startup and troubleshooting docs now point to setup verification before and after startup.
- Setup verification passed: 16 checks passed, 0 failed; live endpoint checks are expected warnings until backend and desktop are started.
- Environment doctor passed: 32 checks passed, 0 failed.
- Release readiness check passed after updating stale 10C expectations.

## Remaining Before Public Release

- Manual Chrome/Edge load-unpacked browser-extension check.
- Fresh-clone setup check.
- Distribution/release artifact decision.
- Real-world browser extension testing pack.
- Configure GitHub remote, branch protection, Actions, Issues/Projects, and release publishing so the documented GitOps model becomes enforceable.
- Keep `browser-extension/` as the only manual Load unpacked target; do not keep duplicate unpacked extension copies under `releases/`.
- Store reviewed application reference entries under `reference-data/applications/YYYY-MM-DD_job-name-slug/` with raw text, structured JSON, and field-map notes.

## Recommended Next Milestone

Proceed to **10D - Real-World Browser Extension Testing Pack**.

Goal: create structured real-world form test pages, fill scenarios, edge case coverage, and manual/automated browser-extension verification assets.

Do not call the project stable or end-user ready yet. The current status is local developer-preview MVP ready.

Dashboard now automatically retries failed analytics loads while the dashboard remains mounted, so opening the desktop before the backend is fully ready can recover without manual navigation.
