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
