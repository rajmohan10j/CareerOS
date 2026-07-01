# Developer Preview Checklist

Document ID: DOC-072  
Version: 0.1.0  
Status: Implemented (Milestone 09T – Production Readiness Foundation)

Use this checklist to verify CareerOS is ready for a developer preview release.

## Environment

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Virtual environment created and activated
- [ ] Backend dependencies installed (`pip install -e ".[dev]"`)
- [ ] Desktop dependencies installed (`cd desktop; npm install`)
- [ ] No conflicting services on port 8000

## Backend

- [ ] Server starts with `.\scripts\start-backend.ps1`
- [ ] Swagger UI loads at `http://127.0.0.1:8000/docs`
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] `GET /analytics/summary` returns valid JSON
- [ ] Ruff passes with no errors
- [ ] All backend tests pass (`.\scripts\test-backend.ps1`)

## Browser Extension

- [ ] `.\scripts\test-extension.ps1` passes
- [ ] Extension loads in Chrome via "Load unpacked"
- [ ] Popup shows backend health
- [ ] Form detection works on test pages
- [ ] Autofill preview renders mapping data
- [ ] Fill execution respects safety guards

## Desktop App

- [ ] `.\scripts\test-desktop.ps1` passes
- [ ] Dashboard shows live analytics from backend
- [ ] Sidebar navigation works for all 9 pages
- [ ] Settings page can configure backend URL
- [ ] Status bar shows backend connection state
- [ ] No console errors when navigating

## Documentation

- [ ] ROADMAP.md lists all 09 milestones
- [ ] CHANGELOG.md is up to date
- [ ] EXECUTION/002_CURRENT_STATUS.md reflects current state
- [ ] EXECUTION/003_NEXT_TASK.md describes next planned work
- [ ] LOCAL_STARTUP_GUIDE.md has accurate instructions
- [ ] TROUBLESHOOTING.md covers common issues
- [ ] README.md has a concise project description

## Security & Privacy

- [ ] No paid API dependencies
- [ ] No cloud service dependencies
- [ ] No telemetry or external tracking
- [ ] No secrets committed to repository
- [ ] No credentials stored in source code
- [ ] All data stays on localhost by default
- [ ] `SECURITY.md` exists with contact instructions

## Verification Scripts

- [ ] `.\scripts\doctor.ps1` runs without errors
- [ ] `.\scripts\verify-all.ps1` runs all tests
- [ ] `.\scripts\release-check.ps1` passes all checks
