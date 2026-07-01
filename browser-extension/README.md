# CareerOS Browser Extension

Document ID: DOC-046
Version: 0.2.0
Status: Implemented (Milestone 09O — Browser Extension v2 Refinements)

## Purpose

The browser extension supports job page extraction and form autofill assistance.
Users can detect, classify, map, preview, approve, and fill form fields using
profile data from the local CareerOS backend. All fill operations require explicit
user approval per field and run only after safety checks pass. No data leaves
your machine.

## Target Browsers

- Chrome (Manifest V3)
- Edge (Manifest V3)
- Firefox (Manifest V3)

## Project Structure

```
browser-extension/
├── manifest.json              # Extension manifest (MV3)
├── package.json               # Test runner config
├── README.md                  # This file
├── icons/                     # Extension icons (16, 48, 128)
├── src/
│   ├── apiClient.js           # Shared API client (health check, backend URL)
│   ├── background.js          # Service worker
│   ├── content.js             # Content script — field detection entry point
│   ├── fieldDetector.js       # DOM scanner for form fields
│   ├── fieldClassifier.js     # Field intent classifier (20 types)
│   ├── profileClient.js       # Fetches profile/skills/experiences from backend
│   ├── autofillMapper.js      # Maps field intents to profile data (read-only)
│   ├── approvalState.js       # In-memory approval store for active tab
│   ├── mappingPreview.js      # Preview/approval HTML rendering helpers
│   ├── autofillExecutor.js    # Fill orchestrator — build approved fields, execute fill
│   ├── popup.html             # Popup UI
│   ├── popup.js               # Popup logic
│   ├── options.html           # Settings page
│   └── options.js             # Settings logic
├── styles/
│   └── popup.css              # Popup styling
└── tests/
    ├── extension.test.js      # 172 tests — manifest, structure, source validation, security
    ├── fieldDetector.test.js  # 51 tests — detector source validation
    ├── fieldClassifier.test.js # 46 tests — classifier patterns & security
    ├── profileClient.test.js  # 23 tests — exports, fetch patterns, normalize
    ├── autofillMapper.test.js # 64 tests — intent mapping, status, security
    ├── approvalState.test.js  # 46 tests — store creation, approve/reject, remove, selectAllSafe
    ├── mappingPreview.test.js # 59 tests — preview rendering, safe detection, sensitive handling, low-confidence badges
    ├── autofillExecutor.test.js # 31 tests — buildApprovedFillFields, executeFill, security
    ├── controlledFill.test.js # 56 tests — FILL_FIELDS handler, fillability, events, highlight, field name tracking
    └── safetyGuards.test.js   # 22 tests — no submit, no click, no bypass, no persistence
```

## Permissions

- `storage` — Save backend URL preference.
- `http://localhost:8000/*` — Connect to local CareerOS backend only.

No browsing history, credentials, tabs, or cross-origin data is collected.

## Field Detection

Click "Detect Form Fields" in the popup to scan the current page. The extension
detects:

| Signal | Source |
|--------|--------|
| Tag / type | `input`, `textarea`, `select`, `radio`, `checkbox` |
| Name | `input[name]` |
| ID | `input[id]` |
| Label | `<label for="id">` or wrapping `<label>` |
| Placeholder | `input[placeholder]` |
| aria-label | `input[aria-label]` |
| Nearby text | Text nodes in parent |
| Section heading | Preceding `<h1>`–`<h6>` or `<legend>` |
| Options | `<select>` options |

### Classified Field Types (22)

`full_name`, `first_name`, `last_name`, `email`, `phone`, `address`, `city`,
`state`, `country`, `postal_code`, `current_company`, `current_title`,
`education`, `experience`, `skills`, `resume_upload`, `cover_letter`,
`salary_expectation`, `work_authorization`, `notice_period`, `diversity`,
`equal_opportunity`, `unknown`

### Sensitive Fields

Phone, address, salary expectation, work authorization, diversity, and equal
opportunity fields are marked sensitive. Their approve radio button is disabled
— they cannot be auto-selected and always require manual review.

## Profile Mapping

After detecting fields, click "Map Fields to Profile" to fetch profile data
from the local backend and compute proposed values for each field. The mapping
uses four status levels:

| Status | Meaning |
|--------|---------|
| available | Directly mapped from profile data |
| derived | Inferred from existing data (e.g. name from summary) |
| missing | No data available in profile |
| manual_review | Requires human input (sensitive or non-automatable) |

### Mapping Sources

| Field Intent | Source |
|-------------|--------|
| full_name / first_name / last_name | Derived from profile summary text |
| email / phone | Marked as missing (not stored in profile) |
| address / city / state / country | From profile locations array |
| postal_code | Marked as missing |
| current_company / current_title | From latest experience (sorted by start_date) |
| experience | Concatenated list of experiences |
| skills | Comma-separated from skill names |
| resume_upload / cover_letter | manual_review — cannot auto-populate |
| salary_expectation | From profile salary expectations |
| work_authorization / notice_period | manual_review — sensitive |
| diversity / equal_opportunity | manual_review — sensitive — requires manual input |

## Approval Preview

After mapping, the popup shows an "Approve Mappings" section with:

- **Select All Safe** — Auto-approves all non-sensitive fields with confidence >= 0.6 and status "available" or "derived". Sensitive fields are excluded.
- **Reset All** — Clears all approvals/rejections.
- **Per-field radio toggles** — Approve / Reject / Skip for each field.
- **Sensitive badge** on fields that require extra caution.
- **Disabled approve radio** on sensitive fields — they cannot be auto-approved.
- **Sensitive warning section** — Purple background warning explaining the field contains personal or regulated information.
- **Low-confidence badge** — Orange badge on fields with confidence < 0.6, with tooltip explaining to verify before filling.
- **Confidence as percentage** — All confidence scores displayed as 0-100% with tooltip explanation.
- **Approval summary** showing approved / rejected / pending / total counts.
- **Visual states** — approved rows get a green background, rejected rows get dimmed.

Approval state is stored in memory only (no chrome.storage) and is scoped to the
current popup session. When the popup closes, all approvals are discarded.

## Fill Execution

After approving field mappings, click "Fill Approved Fields" to execute the fill.
The extension:

1. **buildApprovedFillFields** — Collects all approved intents with non-null values, excluding file inputs.
2. **executeFill** — Sends a `FILL_FIELDS` message to the active tab via the background script.
3. **Content script handler** — For each field:
   - Finds the element by `id` then `name`.
   - Checks fillability: skips password, hidden, disabled, readonly, file, submit, button, reset, image, radio, checkbox fields.
   - Assigns the value and dispatches `input` + `change` events.
   - Highlights the field with a green outline for 2 seconds.
4. **Result** — Returns counts of filled, skipped, and failed fields (with per-field breakdown including field names).

### Fill Safety Guarantees

- No `form.submit()` or `.click()` calls anywhere in the extension.
- Password, hidden, disabled, readonly, and file fields are never filled.
- Only explicitly approved fields are filled — pending, rejected, or missing fields are skipped.
- File upload, radio, checkbox, and button elements are excluded.
- Fill is performed by the content script (the only script with DOM access).
- No chrome.storage, fetch, or XMLHttpRequest calls in fill-related code.
- No new permissions beyond the original `storage` + `localhost:8000`.

## Backend Connection

The extension calls `GET /health` on the local backend and displays the result
(status, version, mode) in the popup. The backend URL defaults to
`http://localhost:8000` and can be changed in Settings. Profile mapping fetches
`GET /profile`, `GET /skills`, and `GET /experiences` in parallel.

## Development

```bash
npm test
node tests/fieldDetector.test.js
node tests/fieldClassifier.test.js
node tests/profileClient.test.js
node tests/autofillMapper.test.js
node tests/approvalState.test.js
node tests/mappingPreview.test.js
node tests/autofillExecutor.test.js
node tests/controlledFill.test.js
node tests/safetyGuards.test.js
```

## Security

- Local-first only — no data leaves your machine.
- No credentials are stored in the extension.
- No forms are submitted or buttons clicked under any circumstance.
- Field detection runs entirely in-page — no network calls.
- Autofill mapper proposes values but never writes to fields.
- Approval state is temporary (in-memory, never persisted).
- Sensitive fields cannot be auto-approved.
- Fill execution only happens after explicit user approval per field.
- Fill execution is performed by the content script with safety guards: password, hidden, disabled, readonly, file, button, radio, and checkbox fields are always skipped.
- Fill operations are tracked with filled/skipped/failed counts and reported back to the popup.

## Roadmap

- 09J — Browser Extension Skeleton ✅
- 09K — Browser Field Detection Engine ✅
- 09L — Universal Autofill Mapping Engine ✅
- 09M — Safe Autofill Preview + User Approval ✅
- 09N — Controlled Autofill Execution ✅
- 09O — Extension v2 Refinements ✅
- 09P — Mobile ⏳
