# ATS ENGINE

Document ID: DOC-033
Version: 0.2.0
Status: Implemented

## Purpose

The ATS Engine analyzes resumes for Applicant Tracking System compatibility, provides scoring and keyword gap analysis, and generates ATS-optimized resume versions.

## Capabilities

- **ATS Score** — Score a resume against a job description (0–100) using AI analysis
- **Keyword Matching** — Match user Skill records against job-described skills; identify gaps
- **Formatting Analysis** — Detect ATS-unfriendly elements: tables, images, missing section headers, long lines, non-ASCII characters
- **Full Analysis** — Section-by-section scoring, content alignment assessment, compliance issues, actionable suggestions
- **ATS-Optimized Generation** — Rewrite resume to maximize ATS parsing while preserving factual accuracy; creates new versioned resume record

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ats/score` | ATS compatibility score + keyword match + formatting check |
| POST | `/ats/analyze` | Full analysis with section scores and content alignment |
| POST | `/ats/optimize` | Generate ATS-optimized resume version |

## Inputs

- Resume (by ID)
- Job description (by job ID or raw text)
- Candidate Skills (from Skill table)
- Candidate Experience (from Experience table)
- Candidate Profile (from Profile table)
- Target Role (optimize only)

## Outputs

- ATS score (0–100)
- Keyword match rate, matched/missing keywords
- Formatting score, compliance issues
- Section scores (analyze only)
- Content analysis summary (analyze only)
- Actionable suggestions
- ATS-optimized resume content with new version (optimize only)

## Constraints

- Must not invent experience, employers, education, titles, dates, or achievements
- Keyword matching is case-insensitive and uses only actual Skill table records
- Formatting analysis uses heuristics for local detection (tables, images, section headers, line length, non-ASCII)
- AI analysis falls back gracefully to basic results when AI service is unavailable

## Implementation

- `backend/app/schemas/ats.py` — Request/response Pydantic models
- `backend/app/services/ats_service.py` — AtsService with score/analyze/optimize methods
- `backend/app/api/ats.py` — 3 FastAPI routes; thin delegation to service
- `backend/tests/test_ats.py` — 66 tests across API, service, formatting, keyword matching, prompt building, no-regression

## AI Prompts

- **Score prompt**: Includes candidate profile, skills (name/proficiency/category), experience (title/company/dates/description), resume content, job description. Returns `{ats_score, formatting_score, compliance_issues, suggestions}`.
- **Analyze prompt**: Same as score plus `{section_scores, content_analysis}`.
- **Optimize prompt**: ATS optimization guidelines, candidate skills/experience, original resume, job description. Returns raw Markdown resume.

## Related

- RESUME_ENGINE (DOC-032) — Resume generation and tailoring
- RESUME_AGENT (DOC-035) — Agent responsible for ATS recommendations
