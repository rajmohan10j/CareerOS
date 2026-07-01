# First Good Issues

Document ID: DOC-081  
Version: 0.1.0  
Status: Implemented (Milestone 10B – GitHub Repository Publication Prep)

This document lists starter-friendly tasks for new contributors.

## Documentation (Low difficulty)

### DOC-001: Review docs for stale references
- **Files**: All `.md` files in `docs/`
- **Task**: Check for broken cross-references, outdated file paths, or Draft-status documents that should be updated
- **Skills**: Markdown, documentation review
- **Estimated time**: 1–2 hours

### DOC-002: Improve TROUBLESHOOTING.md
- **Files**: `docs/08-operations/TROUBLESHOOTING.md`
- **Task**: Add common error scenarios discovered during local testing
- **Skills**: Markdown, debugging
- **Estimated time**: 30 min–1 hour

### DOC-003: Browser support matrix test results
- **Files**: `browser-extension/docs/BROWSER_SUPPORT_MATRIX.md`
- **Task**: Load the extension in Edge and/or Brave, verify basic functionality, add notes to the matrix
- **Skills**: Browser extension testing, Markdown
- **Estimated time**: 30 min–1 hour

## Browser Extension (Low-Medium difficulty)

### EXT-001: Add test page examples for field detection
- **Files**: `browser-extension/tests/`
- **Task**: Create simple HTML pages with various form layouts (single-column, multi-column, inline) for manual field detection testing
- **Skills**: HTML, browser extension testing
- **Estimated time**: 1–2 hours

### EXT-002: Extension UI polish
- **Files**: `browser-extension/popup.js`, `browser-extension/popup.css`
- **Task**: Improve popup styling, responsive layout, dark mode support (CSS-only)
- **Skills**: CSS, HTML
- **Estimated time**: 1–2 hours

### EXT-003: Add more field classification patterns
- **Files**: `browser-extension/fieldClassifier.js`
- **Task**: Add patterns for additional job application field types (e.g., "linkedin profile", "portfolio", "cover letter")
- **Skills**: JavaScript, regex
- **Estimated time**: 1–2 hours

## Desktop App (Medium difficulty)

### DESK-001: Wire Settings page to backend config
- **Files**: `desktop/src/pages/Settings.js`
- **Task**: Add ability to fetch current backend settings from `GET /settings` (if endpoint exists) and display them
- **Skills**: JavaScript, REST APIs
- **Estimated time**: 1–2 hours

### DESK-002: Add loading spinners to analytics dashboard
- **Files**: `desktop/src/pages/Dashboard.js`
- **Task**: Show loading spinners while analytics data is being fetched
- **Skills**: JavaScript, CSS
- **Estimated time**: 30 min–1 hour

### DESK-003: Add sidebar collapse/expand
- **Files**: `desktop/styles/app.css`, `desktop/src/components/Sidebar.js`
- **Task**: Add a toggle to collapse the sidebar to icon-only mode
- **Skills**: CSS, JavaScript
- **Estimated time**: 1–2 hours

## Backend (Medium difficulty)

### BACK-001: Add pagination support to list endpoints
- **Files**: Backend repository and route files
- **Task**: Add `offset` and `limit` query parameters to list endpoints (jobs, applications, documents, resumes)
- **Skills**: Python, FastAPI, SQL
- **Estimated time**: 2–3 hours

### BACK-002: Add health endpoint version info
- **Files**: `backend/app/api/health.py`
- **Task**: Return additional metadata in `/health` response (uptime, Python version, database size)
- **Skills**: Python, FastAPI
- **Estimated time**: 1 hour

### BACK-003: Improve Ruff configuration
- **Files**: `backend/pyproject.toml`
- **Task**: Add more Ruff rules (isort, pep8-naming, etc.) and fix any new violations
- **Skills**: Python, linting
- **Estimated time**: 1–2 hours

## How to Claim an Issue

1. Comment on the issue that you'd like to work on it.
2. Wait for a maintainer to assign it to you.
3. Fork the repository and create a branch.
4. Make your changes and write tests.
5. Submit a pull request.
