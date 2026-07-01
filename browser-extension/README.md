# CareerOS Browser Extension

Document ID: DOC-046
Version: 0.1.0
Status: Implemented (Milestone 09L — Universal Autofill Mapping Engine)

## Purpose

The browser extension supports job page extraction and form autofill assistance.
It can detect, classify, and map form fields to profile data. No autofill or
submission is implemented yet — mapping is read-only and requires human approval.

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
│   ├── popup.html             # Popup UI
│   ├── popup.js               # Popup logic
│   ├── options.html           # Settings page
│   └── options.js             # Settings logic
├── styles/
│   └── popup.css              # Popup styling
└── tests/
    ├── extension.test.js      # 88 tests — manifest, structure, security
    ├── fieldDetector.test.js  # 51 tests — detector source validation
    ├── fieldClassifier.test.js # 42 tests — classifier patterns & security
    ├── profileClient.test.js  # 23 tests — exports, fetch patterns, normalize
    └── autofillMapper.test.js # 62 tests — intent mapping, status, security
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

### Classified Field Types (20)

`full_name`, `first_name`, `last_name`, `email`, `phone`, `address`, `city`,
`state`, `country`, `postal_code`, `current_company`, `current_title`,
`education`, `experience`, `skills`, `resume_upload`, `cover_letter`,
`salary_expectation`, `work_authorization`, `notice_period`, `unknown`

### Sensitive Fields

Phone, address, salary expectation, and work authorization fields are marked
sensitive and highlighted in the debug view. Sensitive field mappings always
require manual review.

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

## Backend Connection

The extension calls `GET /health` on the local backend and displays the result
(status, version, mode) in the popup. The backend URL defaults to
`http://localhost:8000` and can be changed in Settings. Profile mapping fetches
`GET /profile`, `GET /skills`, and `GET /experiences` in parallel.

## Development

```bash
# Run all tests
npm test
node tests/fieldDetector.test.js
node tests/fieldClassifier.test.js
node tests/profileClient.test.js
node tests/autofillMapper.test.js
```

## Security

- Local-first only — no data leaves your machine.
- No credentials are stored in the extension.
- No forms are filled or submitted without explicit user approval.
- Field detection runs entirely in-page — no network calls.
- Autofill mapper proposes values but never writes to fields.
- All autofill actions require human confirmation (future milestone).

## Roadmap

- 09J — Browser Extension Skeleton ✅
- 09K — Browser Field Detection Engine ✅
- 09L — Universal Autofill Mapping Engine ✅
- Future — Job description extraction
- Future — Autofill with user confirmation
