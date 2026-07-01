# Live Test Checklist

**Milestone:** 10A-FIX – MVP Live Usability Fix  
Use this checklist to verify the full MVP workflow manually.

## Backend

- [ ] Backend starts: `uvicorn app.main:app --host 127.0.0.1 --port 8000`
- [ ] `/health` returns 200 with `{"status":"ok","version":"0.1.0","mode":"local"}`
- [ ] `/docs` renders Swagger UI
- [ ] `/analytics/summary` returns JSON (may be empty)

## Desktop

- [ ] Desktop launches: `http://127.0.0.1:5173`
- [ ] Settings page shows backend URL: `http://127.0.0.1:8000`
- [ ] Test Connection succeeds (green indicator)
- [ ] Dashboard loads analytics cards with data
- [ ] Backend status indicator shows "Connected"
- [ ] Backend URL persists after page refresh
- [ ] Backend URL persists after navigating Dashboard → Settings
- [ ] Saving a new URL works correctly
- [ ] Backend URL never shows `[object Promise]`

## Browser Extension

- [ ] Extension loads in Chrome/Edge via Load Unpacked
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

- [ ] All automated tests pass (backend + extension + desktop)
- [ ] Ruff lint clean
- [ ] No paid API dependencies
- [ ] No telemetry
- [ ] No cloud dependency
