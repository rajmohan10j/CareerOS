# Changelog

## v0.1.0
- Initial Blueprint repository created.

## v0.1.1
- Milestone 09A: Backend skeleton (FastAPI, /health, layered structure, pytest)
- Milestone 09B: Database setup (SQLite + SQLModel, BaseTable)
- Milestone 09C: Master Candidate Profile API
- Milestone 09D: AI Provider Service (Ollama, registry, router, retry)
- Milestone 09E: Resume Intelligence Engine (CRUD, AI generation, versioning)
- Milestone 09F: Document Intelligence Engine (CRUD, AI parse/classify, search)
- Milestone 09G: Job Intelligence Engine (CRUD, AI analyze/evaluate, structured evaluation with skill matching/gap analysis/recommendation, experience/location matching, resume suggestions)
- Milestone 09H: Additional Domain Models (Experience, Skill, Application CRUD with filtering)
- Milestone 09I: ATS Optimization Engine (score/analyze/optimize, keyword matching, formatting analysis, ATS-optimized resume generation, 66 tests)
- Milestone 09J: Browser Extension Skeleton (Manifest V3, popup health check, content script placeholder, options page, minimal permissions, 37 tests)
- Milestone 09K: Browser Field Detection Engine (fieldDetector.js, fieldClassifier.js, 20 field types, confidence scoring, sensitive field tagging, debug table, 93 tests)
- Milestone 09L: Universal Autofill Mapping Engine (profileClient.js, autofillMapper.js, 20-intent mapping with 5 status levels, sensitive field tagging, name/experience derivation, popup Map Fields UI, collapsible mapping summary + detail table, 85 new tests, all 266 extension tests passing)
- Milestone 09M: Safe Autofill Preview + User Approval (approvalState.js, mappingPreview.js, in-memory approve/reject store, per-field radio toggles, Select All Safe button (excludes sensitive + low-confidence), Reset All button, approval summary bar, visual state backgrounds, 92 new tests (41+51), all 390 extension tests passing)
- Milestone 09N: Controlled Autofill Execution (autofillExecutor.js, content.js FILL_FIELDS handler with fillability checks, background.js forwarding, popup Fill Approved Fields button + result summary, strict safety guards — no submit/click/file/password fill, 106 new tests (31+53+22), all 531 extension tests passing)
- Milestone 09O: Browser Extension v2 Refinements (diversity/equal_opportunity field types added to classifier + mapper, remove()/clear() methods in approvalState.js, confidence shown as percentage, low-confidence badges, sensitive field warnings, better backend error messages with hints, fill results show field names, options page response time, all 570 extension tests passing)
- Milestone 09P: Desktop App Shell (SPA with hash routing, 9 pages, sidebar navigation, backend health polling, settings page with URL config + test connection, 91 tests, no paid/cloud deps)
- Milestone 09Q: Plugin SDK Foundation (plugin manifest schema, permission model, validation, registration, listing, enable/disable, delete, 7 API endpoints, 55 plugin tests, 435 total backend tests, Ruff clean, no plugin code execution)
- Milestone 09R: RAG & Knowledge Base Foundation (knowledge model, chunking service, keyword search, source type filtering, embedding via AIService, 8 API endpoints, 54 tests)
- Milestone 09S: Analytics Dashboard Foundation (10 analytics schemas, AnalyticsService with profile/resume/job/application/document/ATS/knowledge/plugin analytics, 8 API endpoints, Desktop Dashboard with 8 stat cards consuming /analytics/summary, fetchAnalytics in apiClient.js, 17 backend + 17 desktop tests, 506 total backend tests, 108 desktop tests, Ruff clean)
- Milestone 09T: Production Readiness Foundation (7 PowerShell scripts: start-backend, test-backend, test-extension, test-desktop, verify-all, doctor, release-check; 4 docs: LOCAL_STARTUP_GUIDE, TROUBLESHOOTING, DEVELOPER_PREVIEW_CHECKLIST, MILESTONE_09_COMPLETION_REPORT; all 1,184 tests passing; Ruff clean; no paid APIs, no cloud, no telemetry)

All 20 Milestone 09 sub-milestones completed.

---

## v0.2.0
- Milestone 10A: Developer Preview Release Preparation — release notes, GitHub release checklist, public readiness doc, browser support matrix, Milestone 09 release manifest; README updated with features/browsers/privacy tables; 5 new docs created; all 1,184 tests verified; no paid API, no telemetry, no secrets confirmed
- Milestone 10B: GitHub Repository Publication Prep — 5 issue templates (bug, feature, docs, security, site compatibility), 5 CI workflows (backend, extension, desktop, lint, release-check), PR template, CODEOWNERS, discussion template, community docs (publication guide, contributor onboarding, first good issues); root files rewritten (README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, LICENSE to MIT, .gitignore); all 1,184 tests pass; no paid API, no telemetry, no secrets
- Milestone 10B-live-fix: Added desktop/index.html entry point for `npm start` (python -m http.server 5173), updated package.json with start script, updated desktop README with exact run command, added root index.html + start script tests (110 desktop tests), all 1,186 tests pass; no paid API, no telemetry, no secrets
- Milestone 10C: Installer / Setup Improvements (planned — bootstrap script, backend auto-setup, dependency checks)
- Milestone 10D: Real-World Browser Extension Testing Pack (planned — test pages, fill scenarios, edge case database)
- Milestone 10E: Desktop Backend Integration v1 (planned — desktop components call real backend APIs)
- Milestone 10F: Public Developer Preview v0.1.0 (planned — release tag, changelog finalization, announcement)
- Milestone 10A-LIVE: Desktop Backend Connection Fix — added CORS middleware to FastAPI backend (allow_origins: 127.0.0.1:5173, localhost:5173, 127.0.0.1:8000, localhost:8000), added URL normalization (trim whitespace, remove trailing slash, reject [object Promise]), improved fetch error messages with URL + endpoint + user-friendly next step, updated desktop tests (120 passed), backend tests (CORS coverage added, Ruff clean); no paid APIs, no telemetry, no cloud dependency
- Milestone 10A-FIX: MVP Live Usability Fix — CORS fix applied. All 9 desktop menu pages rewritten from placeholders to live MVP using real backend APIs (Dashboard, Profile, Resumes, Jobs, Applications, Documents, AI Status, Browser Extension, Settings). Profile: GET/PUT /profile with editable form. Resumes: GET /resumes with list/view. Jobs: GET /jobs + POST /jobs with inline form. Applications: GET /applications + POST /applications. Documents: GET /documents + POST /documents. AI Status: GET /ai/providers, /ai/models, /ai/health. Browser Extension: static setup guidance. Dashboard: live analytics via /analytics/summary. New API client helpers added to apiClient.js. CSS styles for item lists, forms, cards, empty states. Desktop tests updated: 176 passed. Backend: 509 tests passed, Ruff clean. MVP_LIVE_RUN_GUIDE updated with per-page verification steps. 10B unpaused.
