# MILESTONE_09A5_DEVELOPMENT_PLAYGROUND

Document ID: DOC-131  
Version: 0.1.0  
Status: Draft  
Milestone: 09A.5 – Development Playground

## Purpose

Create a lightweight browser-based developer cockpit for CareerOS backend testing.

## Scope

### Initial Version

- Add `/playground` endpoint.
- Return simple local HTML page.
- Show CareerOS version and local mode.
- Link to `/health`.
- Link to `/docs`.
- Add placeholders for future tools.

### Future Sections

- AI prompt tester
- Resume generator tester
- Job evaluator tester
- RAG search tester
- Embedding viewer
- Database status viewer
- Plugin sandbox
- API console
- Model benchmark

## Required Backend Files

```text
backend/
└── app/
    ├── api/
    │   └── playground.py
    └── main.py
```

## Acceptance Criteria

- `http://127.0.0.1:8000/playground` opens in browser.
- Page loads without external internet dependencies.
- Page links to `/health` and `/docs`.
- Route handler remains thin.
- Tests are added.
- Execution status is updated.

## OpenCode Prompt

```text
Read AI_DEVELOPMENT_PLAYBOOK.md, ENGINEERING_BIBLE/003_CODING_STANDARDS.md, ENGINEERING_BIBLE/004_API_STANDARDS.md, backend/docs/BACKEND_ENGINEERING_DESIGN.md, and docs/03-development/MILESTONE_09A5_DEVELOPMENT_PLAYGROUND.md.

Execute Milestone 09A.5 – Development Playground.

Implement:
- backend/app/api/playground.py
- /playground route returning simple local HTML
- register route in backend/app/main.py
- add tests for /playground
- update backend README if needed
- update EXECUTION/002_CURRENT_STATUS.md
- update EXECUTION/003_NEXT_TASK.md

Constraints:
- Do not add paid API dependencies.
- Do not add external CDN dependencies.
- Keep the route handler thin.
- Keep the page simple and local-first.
```
