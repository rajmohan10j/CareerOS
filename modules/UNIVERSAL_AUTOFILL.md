# UNIVERSAL_AUTOFILL

Document ID: DOC-048  
Version: 0.3.0  
Status: Implemented (Milestone 09M)

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
Render approval preview (mappingPreview.js + approvalState.js)
  │   - Per-field approve/reject/skip radio toggles
  │   - Select All Safe (excludes sensitive + low-confidence)
  │   - Sensitive field approve buttons disabled
  │   - Visual states: approved (green), rejected (dimmed), sensitive (border)
  │   - Approval summary bar (approved/rejected/pending/total)
  ↓
[Future] Fill selected fields
```

## Implementation

- `browser-extension/src/profileClient.js` — Fetches profile, skills, experiences from local backend in parallel. Normalizes JSON-stringified fields (locations, target_roles, salary_expectations, industries). 5s timeout per fetch via AbortController.
- `browser-extension/src/autofillMapper.js` — Maps each detected field intent to a proposed value using profile data. Uses deriveFirstLastFromSummary for name fields, getLatestExperience (sorted by start_date) for company/title, profile.locations for address/city/state/country, skills concatenation for skills field. Marks phone/address/salary/work_auth/notice_period as sensitive. Never assigns values to DOM elements.
- `browser-extension/src/approvalState.js` — In-memory approval store for the active popup session. Uses Map internally. Methods: approve, reject, reset, isApproved, isRejected, isPending, getApproved, getRejected, selectAllSafe (auto-approves non-sensitive, confidence >= 0.6, available/derived), getSummary. No persistence (no chrome.storage, no localStorage).
- `browser-extension/src/mappingPreview.js` — HTML rendering helpers for the approval UI. buildPreviewItem extracts visible state per mapping. buildItemHTML renders a preview row with intent, value, status badge, confidence, message, sensitive tag, and approve/reject/skip radio toggles. Sensitive fields get disabled approve radio (toggle-disabled class). buildPreviewContainerHTML renders all rows. buildApprovalSummaryHTML renders the approval counts bar. buildPreviewList returns preview item data for all mappings.
- `browser-extension/src/popup.js` — "Map Fields to Profile" button after field detection. Collapsible mapping summary with available/derived/missing/manual/sensitive counts. After mapping, renders approval preview with Select All Safe and Reset All buttons, per-field radio toggles, and approval summary bar.
- `browser-extension/styles/popup.css` — Styling for mapping UI: status badges (6 variants), mapping stats row, sensitive tags, alternate row backgrounds by status. Approval UI: .approval-section, .safe-btn, .reset-btn, .approval-summary, .preview-row (with .preview-approved / .preview-rejected / .preview-sensitive states), .preview-toggle (with .toggle-disabled), .preview-actions.

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
