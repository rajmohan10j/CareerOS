# GitHub Release Checklist

Document ID: DOC-075  
Version: 0.1.0  
Status: Updated (Milestone 10B – GitHub Repository Publication Prep)

## Pre-Release

### Repository Setup

- [ ] Repository is public or has public access configured
- [ ] Repository description and website URL are set
- [ ] Topics/tags are configured (e.g., `career-management`, `fastapi`, `browser-extension`, `ats`)
- [ ] License file (MIT) is present at repository root
- [ ] `.gitignore` covers all generated files (`.venv/`, `node_modules/`, `__pycache__/`, `*.db`, `.env`)
- [ ] `README.md` has project description, quick start, and links to documentation

### Code Quality

- [ ] All tests pass (backend, extension, desktop)
- [ ] Ruff linting passes with no errors
- [ ] No `TODO`, `FIXME`, `HACK`, `XXX` comments in source files
- [ ] No debug/development-only code committed
- [ ] No commented-out code in source files
- [ ] No hardcoded absolute paths in source files

### Security

- [ ] No secrets, API keys, or credentials committed
- [ ] No `.env` files committed (add to `.gitignore`)
- [ ] No internal URLs, hostnames, or IP addresses in committed code
- [ ] No paid API dependencies
- [ ] No telemetry or tracking code
- [ ] No cloud service dependencies
- [ ] `SECURITY.md` exists with vulnerability reporting instructions
- [ ] Extension permissions are minimal (`storage` + `localhost:8000`)

### Documentation

- [ ] `CHANGELOG.md` is up to date with all milestones
- [ ] `ROADMAP.md` reflects current state and planned milestones
- [ ] `EXECUTION/002_CURRENT_STATUS.md` reflects current milestone status
- [ ] `EXECUTION/003_NEXT_TASK.md` describes next planned work
- [ ] `README.md` has accurate and clear instructions
- [ ] `LOCAL_STARTUP_GUIDE.md` has accurate setup steps
- [ ] `TROUBLESHOOTING.md` covers common issues
- [ ] `DEVELOPER_PREVIEW_CHECKLIST.md` is complete and verified
- [ ] `DEVELOPER_PREVIEW_RELEASE_NOTES.md` is up to date
- [ ] Browser support matrix is documented
- [ ] Release manifest exists for the baseline

### Verification

- [ ] `.\scripts\doctor.ps1` runs without errors
- [ ] `.\scripts\verify-all.ps1` passes all test suites
- [ ] `.\scripts\release-check.ps1` passes all checks
- [ ] Backend starts successfully with `.\scripts\start-backend.ps1`
- [ ] Swagger UI loads at `http://127.0.0.1:8000/docs`
- [ ] Extension loads in Chrome via "Load unpacked"
- [ ] Desktop opens without console errors

## Release Process

- [ ] Create and push a version tag (e.g., `v0.1.1`)
- [ ] Write release notes with summary of changes, known issues, and quick start
- [ ] Attach any distribution artifacts (zip archives, load-extension instructions)
- [ ] Publish release on GitHub
- [ ] Verify release page renders correctly
- [ ] Test that a fresh clone + quick start works end-to-end

## Post-Release

- [ ] Update `003_NEXT_TASK.md` for next milestone
- [ ] Close any resolved issues linked to this release
- [ ] Announce release on relevant channels
