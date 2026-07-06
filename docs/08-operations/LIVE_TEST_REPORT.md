# Live Test Report

**Milestone:** 10A-FIX - MVP Live Usability Fix
**Date:** 2026-07-02
**Status:** Released for local developer-preview live test

## Verified This Run

| Component | Result | Evidence |
|-----------|--------|----------|
| Backend start | PASS | Started with `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000` |
| `/health` endpoint | PASS | Returned `{"status":"ok","version":"0.1.0","mode":"local"}` |
| `/analytics/summary` endpoint | PASS | Returned 200 JSON with analytics sections |
| Desktop static server | PASS | Served `http://127.0.0.1:5173` with the desktop entry point |
| CORS preflight | PASS | `OPTIONS /health` from `Origin: http://127.0.0.1:5173` returned `access-control-allow-origin: http://127.0.0.1:5173` |
| Desktop tests | PASS | 292 passed, 0 failed in the 2026-07-06 live-test release |
| Browser extension tests | PASS | 687 assertion inventory passed in the 2026-07-06 live-test release |
| Backend tests | PASS | 511 passed in the 2026-07-06 live-test release |
| Ruff lint | PASS | `ruff check .` passed |

## Fix Confirmed

The original blocker was a browser CORS failure between the desktop SPA at `http://127.0.0.1:5173` and the FastAPI backend at `http://127.0.0.1:8000`.

Confirmed fixes:

- `CORSMiddleware` is configured in `backend/app/main.py` for local desktop origins.
- Desktop backend URL normalization rejects invalid values and removes trailing slashes.
- Backend and desktop can run locally at the expected ports.
- Backend endpoints needed by the dashboard respond successfully.

## Verification Boundary

This run verified the local backend, desktop static app, CORS behavior, automated desktop coverage, automated backend coverage, and automated browser-extension safety coverage.

Manual Chrome/Edge loading of the unpacked browser extension remains a release-check activity because it depends on the local browser environment. The extension logic itself passed the full repository test suite, including detection, mapping, approval, controlled fill, and safety guards.

## MVP Readiness

| Criterion | Result |
|-----------|--------|
| Backend runs | PASS |
| Desktop serves locally | PASS |
| Desktop-to-backend CORS | PASS |
| Dashboard backend endpoint available | PASS |
| Extension safety test coverage | PASS |
| Automated tests | PASS |
| No paid API / telemetry / cloud dependency added | PASS |
| Manual unpacked-extension browser check | Pending before public release |
| **Overall local developer-preview MVP** | **READY** |
## 2026-07-02 Browser Recheck

The in-app browser initially showed the desktop shell at `http://127.0.0.1:5173/` with backend fetch failures because the backend was not running on port 8000. After starting the backend, `GET /health` and `GET /analytics/summary` returned successfully. Navigating Settings -> Dashboard remounted the dashboard, and the page showed zero-state cards plus `Backend Health: Connected` and status bar `Backend: Connected`.

Operational note: if the desktop shell is opened before the backend starts, refresh or navigate away and back after backend startup so page-level data loaders rerun.

Dashboard now automatically retries failed analytics loads while the dashboard remains mounted, so opening the desktop before the backend is fully ready can recover without manual navigation.
## 2026-07-02 Navigation Recheck

After the backend connection was restored, sidebar navigation exposed a frontend routing issue: the URL hash changed, but the mounted page sometimes stayed stale or showed `Failed to fetch dynamically imported module`. The router now emits an explicit app navigation event after hash updates, and `renderRoute` ignores stale dynamic imports if the user navigates again before a module finishes loading.

Live in-app browser verification passed for Settings, Profile, Jobs, Documents, AI Status, Browser Extension, and Dashboard. No dynamic-import errors were present after the route fix.

## 2026-07-02 Resume Manager Recheck

Resume Manager now supports adding a resume from pasted text or a local text/Markdown file. The desktop page posts the resume title, target role, and content to the backend, and the backend preserves the content on create.

Live in-app browser verification passed for the Resume Manager save/load path: a new resume was created from the UI, the saved title appeared in the list, and the saved resume content rendered back in the detail panel with no visible error.

Focused verification passed: backend resume tests `33 passed`, desktop tests `239 passed`.

## 2026-07-06 Live Test Release

CareerOS is released for local live test / developer-preview MVP.

Verification completed:

- First-run setup check: 16 passed, 0 failed; live endpoint warnings are expected until backend and desktop are started.
- Environment doctor: 32 passed, 0 failed.
- Full verification suite: backend 511 passed, browser extension package test 188 passed, desktop 292 passed.
- Full browser-extension assertion inventory: 687 passed across all extension test files.
- Release readiness check: passed.

Release boundary:

- Manual Chrome/Edge Load unpacked verification from `browser-extension/` remains required before public release.
- Fresh-clone setup and final distribution/release artifact decisions remain required before public release.
- GitHub remote configuration, branch protection, Actions enforcement, and GitHub release publishing remain required before GitHub-backed GitOps is fully active.
