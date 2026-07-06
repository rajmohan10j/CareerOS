# Live Test Checklist

**Milestone:** 10A-FIX – MVP Live Usability Fix  
Use this checklist to verify the full MVP workflow. Items checked on 2026-07-02 were verified by local smoke tests or automated suites; the 2026-07-06 live-test release refreshed automated verification and GitOps policy. Browser-extension load-unpacked checks remain manual release checks.

## Backend

- [x] Backend starts: `uvicorn app.main:app --host 127.0.0.1 --port 8000`
- [x] `/health` returns 200 with `{"status":"ok","version":"0.1.0","mode":"local"}`
- [ ] `/docs` renders Swagger UI
- [x] `/analytics/summary` returns JSON (may be empty)

## Desktop

- [x] Desktop launches: `http://127.0.0.1:5173`
- [x] Resume Manager saves a pasted resume and reloads the saved content
- [ ] Settings page shows backend URL: `http://127.0.0.1:8000`
- [ ] Test Connection succeeds (green indicator)
- [x] Dashboard backend endpoint loads analytics data
- [ ] Backend status indicator shows "Connected"
- [ ] Backend URL persists after page refresh
- [ ] Backend URL persists after navigating Dashboard → Settings
- [ ] Saving a new URL works correctly
- [ ] Backend URL never shows `[object Promise]`

## Browser Extension

- [ ] Extension loads in Chrome/Edge via Load unpacked from canonical folder: `browser-extension/`
- [ ] No duplicate unpacked extension folders or browser-extension zip artifacts remain under `releases/`
- [ ] Popup opens and shows backend health status
- [ ] Extension connects to backend at configured URL
- [ ] Options page shows backend URL and connection test works

## Field Detection

- [ ] Open sample job form page
- [ ] Click "Detect Form Fields" in popup
- [ ] All form fields are detected with correct counts
- [ ] Field types are classified with confidence scores
- [ ] Sensitive fields are tagged

## Mapping

- [ ] Click "Map Fields to Profile"
- [ ] Fields show mapped values from profile/backend
- [ ] Status badges display correctly (available/derived/missing)
- [ ] Missing fields are identified

## Approval

- [ ] Per-field approve/reject/skip toggles are interactive
- [ ] "Select All Safe" works (non-sensitive, high-confidence only)
- [ ] "Reset All" clears all approvals
- [ ] Approval summary bar shows correct counts

## Controlled Fill

- [ ] "Fill Approved Fields" fills only approved fields
- [ ] No submit/click/upload behavior occurs
- [ ] Filled fields show green highlight briefly
- [ ] Fill result summary shows filled/skipped/failed counts

## Security

- [ ] No form.submit() called
- [ ] No .click() on buttons/links
- [ ] No file upload triggers
- [ ] No data sent to external servers
- [ ] No credentials stored in extension

## Final

- [x] All automated tests pass (backend + extension + desktop)
- [x] Ruff lint clean
- [x] No paid API dependencies
- [x] No telemetry
- [x] No cloud dependency

## 2026-07-02 Verification Notes

- Local smoke verified backend startup, `/health`, `/analytics/summary`, desktop static serving, and CORS preflight from `http://127.0.0.1:5173`.
- 2026-07-02 automated verification passed: backend 509, desktop 224, browser extension 570, Ruff clean.
- Resume Manager recheck passed in the in-app browser: uploaded/pasted resume content saved through the backend and loaded back in the detail panel. Focused tests passed: backend resume 33, desktop 239.
- Manual Chrome/Edge load-unpacked extension workflow remains unchecked here and should be completed before a public release tag.

## 2026-07-06 Live-Test Release Notes

- Automated verification refreshed: backend 511, desktop 292, browser-extension assertion inventory 687, Ruff clean, release-check passing.
- GitOps policy added: source, docs, tests, release manifests, workflow files, and reviewed non-sensitive fixtures should be tracked through Git/GitHub.
- GitHub remote is configured; GitHub-backed Issues, Pull Requests, Actions, Releases, and branch protection remain final setup/enforcement steps.
- Do not commit secrets, local databases, generated artifacts, private resumes, private application records, or unsanitized reference data.
