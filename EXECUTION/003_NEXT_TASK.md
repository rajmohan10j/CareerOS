# Next Task

Current:
Milestone 09G – Additional domain models (Job, Application, Experience, Skill)

Completed:
- Milestone 09A – Backend Skeleton
- Milestone 09B – Database setup (SQLite + SQLModel)
- Milestone 09C – Master Candidate Profile API
- Milestone 09D – AI Provider Service
- Milestone 09E – Resume Intelligence Engine
- Milestone 09F – Document Intelligence Engine:
  - Document SQLModel table with metadata storage and categorization
  - DocumentCreate, DocumentUpdate, DocumentResponse Pydantic schemas
  - DocumentRepository: CRUD + full-text search (title, content, filename, category)
  - DocumentService: CRUD + AI parse (extract JSON metadata), AI classify (categorize into resume/certificate/transcript/job_description/cover_letter/other)
  - 8 endpoints: GET /documents, GET /documents/search?q=, GET /documents/{id}, POST /documents, POST /documents/{id}/parse, POST /documents/{id}/classify, PUT /documents/{id}, DELETE /documents/{id}
  - 45 tests covering API, service, repository, no-regression, edge cases
  - Full test suite: 150/150 passing

Next:
- Add remaining core domain models (Job, Application, Experience, Skill)
- Add corresponding repositories, services, and API endpoints
- Add tests for each model
