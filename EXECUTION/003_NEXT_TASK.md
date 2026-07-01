# Next Task

Current:
Milestone 09G – Job Intelligence Engine (enhanced)

Completed:
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
  - 24 new tests: API structured response (5), service skill matching (3), skill matching unit (5), fit score parsing (5), build response (2), no-regression (3)
  - 314 total tests, all passing, ruff clean
- Milestone 09H – Additional domain models (Experience, Skill, Application)

Next:
- No remaining domain models to implement
- Await user instructions for next milestone
