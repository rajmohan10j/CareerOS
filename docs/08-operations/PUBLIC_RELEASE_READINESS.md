# Public Release Readiness

Document ID: DOC-076  
Version: 0.1.0  
Status: Updated (Milestone 10C-live-test – GitOps policy added)

## Overview

This document assesses CareerOS readiness for public release based on the Developer Preview baseline and live-test release state.

## Release Stage

**Current stage:** Developer Preview

Per `ENGINEERING_BIBLE/010_RELEASE_STANDARDS.md`, the release stages are:
1. Blueprint
2. **Developer Preview** ← current
3. Alpha
4. Beta
5. Release Candidate
6. Stable

## Readiness Assessment

### Passed

- Live-test verification passed locally
- Backend tests pass: 511
- Browser-extension assertion inventory passes: 687
- Desktop tests pass: 292
- Ruff linting is clean
- No paid API dependencies
- No telemetry or tracking
- No cloud service dependencies
- No secrets committed
- Minimal browser extension permissions (`storage` + `localhost:8000`)
- Local-first architecture — all data stays on localhost
- User approval required for all autofill operations
- PowerShell scripts for setup, startup, testing, doctor checks, verification, and release readiness
- Documentation covers startup, troubleshooting, architecture, and release
- GitOps operating model is documented

### Not Yet Ready

- Desktop app is a Vanilla JS SPA — not wrapped in Tauri/Electron
- GitHub remote is configured, but branch protection, required Actions checks, Issues/Projects, and release publishing are not fully enforced yet
- No packaged installer/distribution artifact
- Firefox extension not implemented
- Mobile browsers not supported
- No distribution artifacts (zip, installer)
- No browser-driven end-to-end tests for the full unpacked-extension workflow
- Manual unpacked-extension live browser verification remains pending before public release

## Requirements for Next Stage (Alpha)

To progress from Developer Preview to Alpha:

1. ~~GitHub publication: public repository, CONTRIBUTING guide, issue/PR templates, CI workflow~~ ✅ (10B)
2. ~~Installer/setup verification: setup script with dependency verification~~ ✅ (10C)
3. **Browser extension testing**: structured test pages, fill scenarios, edge case validation (10D)
4. ~~Desktop integration: wire all placeholder pages to live API endpoints~~ ✅ (10A-FIX)
5. **Release**: version tag, changelog finalization, distribution (10F)

## Privacy Guarantees

- All data processing occurs on localhost
- No external API calls except to configured backend URL (defaults to localhost:8000)
- No analytics, telemetry, or usage tracking
- No automatic form submission or data transmission
- Browser extension only connects to user-configured backend URL
- Extension permissions are limited to `storage` and `localhost:8000`
- Private reference data and local databases are excluded from Git/GitHub by policy

## Security Guarantees

- No paid API dependencies — all AI features work with free local Ollama
- No cloud service dependencies — fully self-contained
- No secrets, credentials, or keys stored in source code
- All autofill requires explicit per-field user approval
- Sensitive fields (phone, address, salary, work authorization) cannot be auto-approved
- Fill execution rejects password, hidden, disabled, readonly, file, submit, button, radio, checkbox fields
- Plugin SDK validation prevents unknown permissions and malformed manifests

## Related Documents

- `DEVELOPER_PREVIEW_CHECKLIST.md` — detailed verification checklist
- `DEVELOPER_PREVIEW_RELEASE_NOTES.md` — release notes for v0.1.1
- `GITHUB_RELEASE_CHECKLIST.md` — GitHub publication steps
- `GITOPS_OPERATING_MODEL.md` — Git/GitHub source-of-truth policy
- `MILESTONE_09_COMPLETION_REPORT.md` — full milestone completion report
- `ENGINEERING_BIBLE/010_RELEASE_STANDARDS.md` — release stage definitions
