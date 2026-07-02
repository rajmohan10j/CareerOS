# Next Task

Current:
Milestone 10A-FIX-4 — Resume Upload / Download / Import MVP ✅ Complete

Resumes page supports: Upload Resume (file picker for .txt/.md, PDF/DOC/DOCX warning), Paste Resume Text, Create Blank Resume, view with metadata, download as .txt/.md via Blob. Folder import limitation message shown. API client: fetchResume, importResumeText, uploadResumeFile, uploadResumeTextFile, downloadResumeText. 258 desktop tests pass. 33 resume backend tests pass (1 new). Ruff clean.

Completed:
- Milestone 10A-LIVE — Desktop Backend Connection Fix (CORS middleware, URL normalization, error messages applied)
- Milestone 10B – GitHub Repository Publication Prep
- Milestone 10E – Desktop Backend Integration v1 (superseded by 10A-FIX)
  - Created: 5 issue templates (bug_report, feature_request, documentation, security_report, browser_site_compatibility)
  - Created: 5 CI workflows (backend-tests, extension-tests, desktop-tests, lint, release-check)
  - Created: PULL_REQUEST_TEMPLATE.md, CODEOWNERS, DISCUSSION_TEMPLATE.md
  - Created: docs/06-community/ (GITHUB_PUBLICATION_GUIDE.md, CONTRIBUTOR_ONBOARDING.md, FIRST_GOOD_ISSUES.md)
  - Rewrote: CONTRIBUTING.md (full contributor guide), CODE_OF_CONDUCT.md (Contributor Covenant v2.1), SECURITY.md (comprehensive), LICENSE (MIT full text), .gitignore (expanded), README.md (public-ready)
  - Updated: ROADMAP.md, CHANGELOG.md, 002_CURRENT_STATUS.md, 003_NEXT_TASK.md, GITHUB_RELEASE_CHECKLIST.md, PUBLIC_RELEASE_READINESS.md
  - Verified: all 1,184 tests pass, Ruff clean, no paid API, no telemetry, no secrets
  - See docs/06-community/GITHUB_PUBLICATION_GUIDE.md for publication steps
- Milestone 10A – Developer Preview Release Preparation
  - Created: DEVELOPER_PREVIEW_RELEASE_NOTES.md, GITHUB_RELEASE_CHECKLIST.md, PUBLIC_RELEASE_READINESS.md, BROWSER_SUPPORT_MATRIX.md, MILESTONE_09_RELEASE_MANIFEST.md
  - Updated: README.md, ROADMAP.md, CHANGELOG.md, SECURITY.md, 002_CURRENT_STATUS.md, 003_NEXT_TASK.md, START_HERE/000_START.md
  - Verified: all 1,184 tests pass, Ruff clean, no paid API, no telemetry, no secrets
  - See docs/08-operations/DEVELOPER_PREVIEW_RELEASE_NOTES.md for full release notes
- Milestone 09A – Backend Skeleton
- Milestone 09B – Database setup (SQLite + SQLModel)
- Milestone 09C – Master Candidate Profile API
- Milestone 09D – AI Provider Service
- Milestone 09E – Resume Intelligence Engine
- Milestone 09F – Document Intelligence Engine
- Milestone 09G – Job Intelligence Engine:
  - Structured JobEvaluateResponse with job_id, fit_score, recommendation, matched_skills, missing_skills, experience_match, location_match, summary, risks, resume_suggestions
  - Local skill matching against actual Skill records (case-insensitive)
  - Enhanced AI evaluation prompt includes real skills & experience data from SkillRepository and ExperienceRepository
  - fit_score returned as float
  - POST /jobs/{id}/evaluate and POST /jobs/evaluate-text return structured JobEvaluateResponse (response_model)
  - Evaluation JSON saved to job record
  - 24 new tests (314 total), all passing, ruff clean
- Milestone 09H – Additional domain models (Experience, Skill, Application)
- Milestone 09I – ATS Optimization Engine:
  - POST /ats/score: ATS compatibility score + keyword matching + formatting analysis
  - POST /ats/analyze: Full analysis with section scores, compliance issues, content alignment
  - POST /ats/optimize: ATS-optimized resume generation as new versioned record
  - AtsService with score/analyze/optimize methods, wired to all repositories + AI
  - 66 new tests (380 total), all passing, ruff clean
- Milestone 09J – Browser Extension Skeleton:
  - Manifest V3 extension for Chrome/Edge/Firefox
  - Popup UI with backend health check
  - Content script placeholder for future field detection
  - Background service worker
  - Options page (backend URL configuration)
  - Minimal permissions (storage only)
  - 37 extension structure/permission tests
- Milestone 09K – Browser Field Detection Engine:
  - fieldDetector.js: DOM scanner for input/textarea/select/radio/checkbox
  - fieldClassifier.js: Intent classifier — 20 field types with confidence scoring
  - Sensitive field tagging (phone, address, salary, work authorization)
  - Popup "Detect Form Fields" button with field count + debug table
  - No autofill, no submit, no credential storage, no network calls
  - 93 new extension tests (153 total), all passing
- Milestone 09L – Universal Autofill Mapping Engine:
  - profileClient.js: fetches profile/skills/experiences, normalizes JSON fields
  - autofillMapper.js: maps 20 field intents to profile data — 5 status levels, sensitive tagging, name derivation, latest experience lookup, skills concatenation
  - Popup UI: "Map Fields to Profile" button, collapsible mapping summary + detail table
  - 23 profileClient tests, 62 autofillMapper tests, extension.test.js at 88 tests
  - All 266 extension tests passing
  - No value assignments — mapping is read-only proposal
- Milestone 09M – Safe Autofill Preview + User Approval:
  - approvalState.js: in-memory approval store (Map-based, session-scoped, no persistence)
  - mappingPreview.js: HTML rendering for per-field approve/reject/skip toggles, safe auto-select, sensitive field disable
  - Popup: "Select All Safe" + "Reset All" buttons, approval summary bar, visual states for approved/rejected/sensitive rows
  - 41 approvalState tests, 51 mappingPreview tests, extension.test.js updated to 120 tests
  - All 390 extension tests passing
  - No value assignments, no form submission, no persistence
- Milestone 09N – Controlled Autofill Execution:
  - autofillExecutor.js: buildApprovedFillFields (filters approved intents, non-null values, excludes file inputs) + executeFill (sends FILL_FIELDS message)
  - content.js FILL_FIELDS handler: findFieldElement, isFillableElement (rejects password/hidden/disabled/readonly/file/submit/button/radio/checkbox), fillElement (value + input/change events), highlightFilled, fillApprovedFields (tracks filled/skipped/failed)
  - background.js: FILL_FIELDS forwarding to active tab
  - Popup: "Fill Approved Fields" button + fill result summary
  - Strict safety guards: no form.submit, no .click(), no file upload, no external calls, no persistence in content/executor
  - 31 autofillExecutor tests, 53 controlledFill tests, 22 safetyGuards tests
  - extension.test.js updated to 155 tests
  - All 531 extension tests passing
- Milestone 09O – Browser Extension v2 Refinements:
  - Added diversity and equal_opportunity field types (22 total field types)
  - Added remove() and clear() methods to approvalState.js
  - Confidence displayed as percentage across all UI
  - Low-confidence fields show orange badge with explanation
  - Sensitive fields show purple warning section
  - Backend connection errors show actionable messages with hints
  - Fill results show field names in all breakdown categories
  - Options page connection test shows response time in ms
  - Better error display with icon prefixes
  - 91 desktop tests: file structure, package.json, pages, routes, api client, components, security, backend independence
  - All 91 desktop tests passing
- Milestone 09P – Desktop App Shell:
  - Desktop directory with 20 files: src/, components/, pages/, styles/, tests/
  - SPA with hash routing, 9 pages, sidebar navigation, backend health polling
  - Settings page with URL config + test connection
  - No paid/cloud dependencies, thin client design
  - Tauri setup documented but not configured (toolchain unavailable)
  - 91 desktop tests passing
- Milestone 09Q – Plugin SDK Foundation:
  - Plugin SDK folder structure (plugins/docs/, plugins/schemas/, plugins/examples/)
  - Plugin manifest schema, sample manifest, validation logic
  - Plugin docs: SDK, manifest, permissions, lifecycle, security
  - Plugin backend: model, schemas, repository, service, API (7 endpoints)
  - Plugin validation: required fields, types, semver, category enum, known permissions, no duplicates, platform validation, source_id pattern
  - Plugin lifecycle: register, enable, disable, delete
  - No plugin code execution implemented
  - 55 plugin tests, all 435 backend tests passing, Ruff clean
- Milestone 09R – RAG & Knowledge Base Foundation:
  - Knowledge model, schemas, repository (CRUD + keyword search + source type filtering)
  - chunking_service.py (paragraph-aware + fixed-size chunking)
  - KnowledgeService (create, chunk, index/embed, search, reindex)
  - 8 API endpoints (CRUD, chunk, index, search, get_by_source)
  - 54 tests, all passing
- Milestone 09S – Analytics Dashboard Foundation:
  - 10 analytics Pydantic schemas, AnalyticsService with 10 methods across 7 repositories
  - 8 API endpoints (GET /analytics/summary, /profile, /resumes, /jobs, /applications, /documents, /knowledge, /plugins)
  - Dashboard.js rewritten with 8 stat cards consuming /analytics/summary
  - fetchAnalytics() in apiClient.js with 5s timeout
  - 17 backend tests (empty DB, with data, individual endpoints, recent activity, ATS eval JSON, no-regression)
  - 17 desktop test additions (analytics dashboard)
  - 506 total backend tests passing, 108 desktop tests passing, Ruff clean
  - No paid APIs, no cloud, no telemetry

- Milestone 09T – Production Readiness Foundation:
  - 7 PowerShell scripts: start-backend.ps1, test-backend.ps1, test-extension.ps1, test-desktop.ps1, verify-all.ps1, doctor.ps1, release-check.ps1
  - 4 documentation files: LOCAL_STARTUP_GUIDE.md, TROUBLESHOOTING.md, DEVELOPER_PREVIEW_CHECKLIST.md, MILESTONE_09_COMPLETION_REPORT.md
  - doctor.ps1: checks Python, Node.js, folders, pyproject.toml, key docs (read-only)
  - release-check.ps1: verifies tests, changelog, roadmap, status, no paid deps, no telemetry, Ruff clean
  - verify-all.ps1: runs all test suites (backend + extension + desktop)
  - All 506 backend tests, 570 extension tests, 108 desktop tests pass, Ruff clean
  - No paid APIs, no cloud, no telemetry added

All Milestone 09 milestones completed.

---

## Next: 10A-FIX-4 – Resume Upload / Download / Import MVP ✅ Complete

**Purpose:** Make the Resumes page MVP-useful by adding resume upload/import/create/view/download functionality connected to the existing backend.

### What was done

1. **Backend:** Added `content` field to `ResumeCreate` schema; `ResumeService.create()` passes content through
2. **API client:** Added `fetchResume(id)`, `importResumeText(data)`, `uploadResumeFile(data)`, `uploadResumeTextFile(data)`, `downloadResumeText(content, filename, ext)`
3. **Resumes page:** Upload Resume (file picker for .txt/.md, PDF/DOC/DOCX warning), Paste Resume Text (textarea + title + target role), Create Blank Resume
4. **Download:** Download as .txt and .md buttons for each resume with content using Blob/object URL (local, no cloud)
5. **Metadata view:** Expanded content view shows target role, job description presence
6. **Folder import:** Clear limitation message displayed
7. **Empty state:** Actionable Upload / Paste / Create buttons instead of passive text
8. **Resume list:** Shows title, version, latest badge, created date, updated date, target role
9. **Error handling:** Success messages, useful error messages, PDF/DOC/DOCX warning with guidance

### Files Changed

| File | Change |
|------|--------|
| `backend/app/schemas/resume.py` | Added `content` field to `ResumeCreate` |
| `backend/app/services/resume_service.py` | `create()` passes `content` through |
| `backend/tests/test_resume.py` | Added `test_create_with_content` |
| `desktop/src/apiClient.js` | Added `fetchResume`, `importResumeText`, `uploadResumeFile`, `uploadResumeTextFile`, `downloadResumeText` exports |
| `desktop/src/pages/Resumes.js` | Added download buttons, metadata view, folder import message, .doc handling |
| `desktop/styles/app.css` | Added `.item-card-meta`, `.item-card-meta-item`, `.item-card-actions`, `.btn-sm` |
| `desktop/tests/desktop.test.js` | Updated assertions for download, folder import, .doc, metadata |

### Test Results

- Desktop: **258 passed, 0 failed**
- Backend: **33 resume tests passed** (1 new), all backend tests pass
- Ruff: All checks passed

### Acceptance Criteria Met

1. ✅ Resumes page shows Upload Resume / Paste Resume Text / Create Blank Resume
2. ✅ Upload supports .txt and .md files; PDF/DOC/DOCX shows guidance message
3. ✅ Paste resume text with title saves to backend
4. ✅ Resume list refreshes after save
5. ✅ Click resume to view stored content with metadata (lazy fetch if needed)
6. ✅ Download as .txt and .md buttons for each resume with content
7. ✅ Download uses Blob/object URL — no cloud, no paid APIs
8. ✅ Folder import limitation message shown
9. ✅ Empty state shows actionable buttons
10. ✅ Success/error messages displayed
11. ✅ No paid APIs, no telemetry, no cloud dependency added

### Manual Verification

```
1. Start backend at http://127.0.0.1:8000
2. Start desktop at http://127.0.0.1:5173
3. Open Resumes page → Upload / Paste / Create buttons visible
4. Click "Paste Resume Text" → enter title + content → Save
5. Resume appears in list with title, version, date
6. Click resume to view content with metadata
7. Click "Download .txt" → file downloads locally
8. Click "Download .md" → file downloads locally
9. Try Upload with .pdf → shows "PDF/DOCX parsing is not supported yet..."
10. Folder import message visible in upload form
```

### Blocked Milestones

The following milestones are PAUSED:

- **10B** – GitHub Repository Publication Prep ⏸️
- **10C** – Installer / Setup Improvements ⏸️
- **10D** – Real-World Browser Extension Testing Pack ⏸️
- **10E** – Desktop Backend Integration v1 ⏸️
- **10F** – Public Developer Preview v0.1.0 ⏸️

**Do not start 10B or any downstream milestone until directed.**
