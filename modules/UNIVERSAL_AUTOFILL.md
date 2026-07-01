# UNIVERSAL_AUTOFILL

Document ID: DOC-048  
Version: 0.4.0  
Status: Implemented (Milestone 09N)

## Purpose

Universal Autofill maps job application forms to the Master Candidate Profile.
The mapping engine proposes values but never writes to fields directly.
Fill execution is handled separately by autofillExecutor.js + content.js
with safety guards and only after explicit user approval.

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
Build approved fill fields (autofillExecutor.js — filters approved intents, non-null values, excludes file inputs)
   ↓
Send FILL_FIELDS message to content script (via background.js)
   ↓
Content script receives FILL_FIELDS (content.js):
   │   - findFieldElement: locate by id then name
   │   - isFillableElement: reject password/hidden/disabled/readonly/file/submit/button/reset/image/radio/checkbox
   │   - fillElement: assign value, dispatch input+change events
   │   - highlightFilled: green outline for 2 seconds
   │   - fillApprovedFields: track filled/skipped/failed counts per field
   ↓
Return fill result summary to popup
   ↓
Display fill result in popup (filled/skipped/failed with details)
```

## Implementation

- `browser-extension/src/profileClient.js` — Fetches profile, skills, experiences from local backend in parallel. Normalizes JSON-stringified fields (locations, target_roles, salary_expectations, industries). 5s timeout per fetch via AbortController.
- `browser-extension/src/autofillMapper.js` — Maps each detected field intent to a proposed value using profile data. Uses deriveFirstLastFromSummary for name fields, getLatestExperience (sorted by start_date) for company/title, profile.locations for address/city/state/country, skills concatenation for skills field. Marks phone/address/salary/work_auth/notice_period as sensitive. Never assigns values to DOM elements.
- `browser-extension/src/approvalState.js` — In-memory approval store for the active popup session. Uses Map internally. Methods: approve, reject, reset, isApproved, isRejected, isPending, getApproved, getRejected, selectAllSafe (auto-approves non-sensitive, confidence >= 0.6, available/derived), getSummary. No persistence (no chrome.storage, no localStorage).
- `browser-extension/src/mappingPreview.js` — HTML rendering helpers for the approval UI. buildPreviewItem extracts visible state per mapping. buildItemHTML renders a preview row with intent, value, status badge, confidence, message, sensitive tag, and approve/reject/skip radio toggles. Sensitive fields get disabled approve radio (toggle-disabled class). buildPreviewContainerHTML renders all rows. buildApprovalSummaryHTML renders the approval counts bar. buildPreviewList returns preview item data for all mappings.
- `browser-extension/src/popup.js` — "Map Fields to Profile" button after field detection. Collapsible mapping summary with available/derived/missing/manual/sensitive counts. After mapping, renders approval preview with Select All Safe and Reset All buttons, per-field radio toggles, and approval summary bar. "Fill Approved Fields" button with enabled/disabled state based on approval count. Fill result section showing filled/skipped/failed counts and detail breakdown.
- `browser-extension/src/autofillExecutor.js` — Popup-side fill orchestrator. buildApprovedFillFields: from approval store, collects approved intents with non-null/non-empty values, excludes file inputs. executeFill: sends FILL_FIELDS message via chrome.runtime.sendMessage to background.js, awaits response with fill result (filled/skipped/failed arrays).
- `browser-extension/src/content.js` — FILL_FIELDS message handler: findFieldElement (by element ID then by name attribute), isFillableElement (rejects: password, hidden, disabled, readonly, file, submit, button, reset, image, radio, checkbox — returns false with reason), fillElement (assigns value to element.value, dispatches InputEvent + Event change, handles select elements by matching option text), highlightFilled (adds green outline via element.style, removes after 2000ms), fillApprovedFields (iterates fill instructions, tracks results per field).
- `browser-extension/src/background.js` — FILL_FIELDS message forwarding: on popup message with action FILL_FIELDS, forwards to active tab via chrome.tabs.sendMessage and returns response to popup.
- `browser-extension/styles/popup.css` — Styling for mapping UI: status badges (6 variants), mapping stats row, sensitive tags, alternate row backgrounds by status. Approval UI: .approval-section, .safe-btn, .reset-btn, .approval-summary, .preview-row (with .preview-approved / .preview-rejected / .preview-sensitive states), .preview-toggle (with .toggle-disabled), .preview-actions. Fill UI: .fill-section, .fill-btn (disabled state), .fill-result, .fill-stats, .fill-details.

## Sensitive Fields

Phone, address, salary expectation, work authorization, and notice period are
classified as sensitive. Sensitive fields:
- Always show a "sensitive" tag in the mapping table
- Are never auto-filled in the current implementation
- Always require manual_review for fields without profile data

## Absolute Rules

1. CareerOS must never click Submit/Apply without explicit user approval.
2. CareerOS must never call .click() or .submit() on any element.
3. CareerOS must never assign `input.value` or programmatically fill fields without explicit user confirmation on each field.
4. CareerOS must never fill password, hidden, file, or disabled fields.
5. CareerOS must never store fill data or field values outside the browser session.
