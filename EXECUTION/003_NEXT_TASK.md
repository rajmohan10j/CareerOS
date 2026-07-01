# Next Task

Current:
Milestone 09H – Additional Domain Models (Experience, Skill, Application)

Completed:
- Milestone 09A – Backend Skeleton
- Milestone 09B – Database setup (SQLite + SQLModel)
- Milestone 09C – Master Candidate Profile API
- Milestone 09D – AI Provider Service
- Milestone 09E – Resume Intelligence Engine
- Milestone 09F – Document Intelligence Engine
- Milestone 09G – Job Intelligence Engine
- Milestone 09H – Additional domain models:
  - Experience model (company, title, start_date, end_date, description, achievements_json)
  - Skill model (name, category, proficiency, evidence) with list_by_category filtering
  - Application model (job_id, resume_id, status, applied_at, notes, follow_up_date) with list_by_status and list_by_job filtering
  - All three with full CRUD: model, schemas, repository, service, API, 6 endpoints each
  - 85 new tests (290 total), all passing, ruff clean

Next:
- No remaining domain models to implement
- Await user instructions for next milestone
