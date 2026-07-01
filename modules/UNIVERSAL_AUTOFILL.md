# UNIVERSAL_AUTOFILL

Document ID: DOC-048  
Version: 0.2.0  
Status: Implemented (Milestone 09L)

## Purpose

Universal Autofill maps job application forms to the Master Candidate Profile.
The mapping engine is read-only — it proposes values but never writes to fields.

## Supported Field Types (20)

| Intent | Mapping Source | Status |
|--------|---------------|--------|
| full_name | Derived from profile summary | derived |
| first_name | Derived from profile summary | derived |
| last_name | Derived from profile summary | derived |
| email | Not stored in profile | missing |
| phone | Not stored in profile (sensitive) | missing |
| address | Profile locations[0] (sensitive) | available |
| city | Profile locations[0], first part | available |
| state | Profile locations[0], second part | available |
| country | Profile locations[0], last part | available |
| postal_code | Not stored in profile | missing |
| current_company | Latest experience by start_date | available |
| current_title | Latest experience by start_date | available |
| education | Not stored in profile | missing |
| experience | All experiences concatenated | available |
| skills | Skills list joined by ", " | available |
| resume_upload | Cannot auto-upload | manual_review |
| cover_letter | Cannot auto-populate | manual_review |
| salary_expectation | Profile salary_expectations (sensitive) | available/manual_review |
| work_authorization | Requires manual input (sensitive) | manual_review |
| notice_period | Requires manual input (sensitive) | manual_review |

## Mapping Status Levels

| Status | Meaning |
|--------|---------|
| available | Directly mapped from existing profile data |
| derived | Inferred from other data fields (e.g. name from summary) |
| missing | No relevant data in profile — user must add to CareerOS |
| manual_review | Requires human input — sensitive or non-automatable |
| unknown | Intent not recognized |

## Process

```text
Read DOM
  ↓
Detect fields (fieldDetector.js)
  ↓
Classify field intent (fieldClassifier.js)
  ↓
Fetch profile data (profileClient.js → GET /profile, /skills, /experiences)
  ↓
Map to profile data (autofillMapper.js — read-only, proposals only)
  ↓
Show mapping summary + detail table in popup
  ↓
[Future] Ask user for confirmation
  ↓
[Future] Fill selected fields
```

## Implementation

- `browser-extension/src/profileClient.js` — Fetches profile, skills, experiences from local backend in parallel. Normalizes JSON-stringified fields (locations, target_roles, salary_expectations, industries). 5s timeout per fetch via AbortController.
- `browser-extension/src/autofillMapper.js` — Maps each detected field intent to a proposed value using profile data. Uses deriveFirstLastFromSummary for name fields, getLatestExperience (sorted by start_date) for company/title, profile.locations for address/city/state/country, skills concatenation for skills field. Marks phone/address/salary/work_auth/notice_period as sensitive. Never assigns values to DOM elements.
- `browser-extension/src/popup.js` — "Map Fields to Profile" button after field detection. Collapsible mapping summary with available/derived/missing/manual/sensitive counts. Mapping detail table with proposed value, status badge, confidence score, and message.
- `browser-extension/styles/popup.css` — Styling for mapping UI: status badges (6 variants), mapping stats row, sensitive tags, alternate row backgrounds by status.

## Sensitive Fields

Phone, address, salary expectation, work authorization, and notice period are
classified as sensitive. Sensitive fields:
- Always show a "sensitive" tag in the mapping table
- Are never auto-filled in the current implementation
- Always require manual_review for fields without profile data

## Absolute Rule

CareerOS must never click Submit/Apply without explicit user approval.
CareerOS must never assign `input.value` or programmatically fill fields
without explicit user confirmation on each field.
