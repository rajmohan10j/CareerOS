# CareerOS Browser Extension

Document ID: DOC-046
Version: 0.1.0
Status: Implemented (Milestone 09K — Field Detection Engine)

## Purpose

The browser extension supports job page extraction and form autofill assistance.
It can detect and classify form fields on any page. No autofill or submission is
implemented yet.

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
│   ├── apiClient.js           # Shared API client (health check)
│   ├── background.js          # Service worker
│   ├── content.js             # Content script — field detection entry point
│   ├── fieldDetector.js       # DOM scanner for form fields
│   ├── fieldClassifier.js     # Field intent classifier
│   ├── popup.html             # Popup UI
│   ├── popup.js               # Popup logic
│   ├── options.html           # Settings page
│   └── options.js             # Settings logic
├── styles/
│   └── popup.css              # Popup styling
└── tests/
    ├── extension.test.js      # 60 tests — manifest, structure, security
    ├── fieldDetector.test.js  # 51 tests — detector source validation
    └── fieldClassifier.test.js # 42 tests — classifier patterns & security
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
sensitive and highlighted in the debug view.

## Backend Connection

The extension calls `GET /health` on the local backend and displays the result
(status, version, mode) in the popup. The backend URL defaults to
`http://localhost:8000` and can be changed in Settings.

## Development

```bash
# Run all tests
npm test
node tests/fieldDetector.test.js
node tests/fieldClassifier.test.js
```

## Security

- Local-first only — no data leaves your machine.
- No credentials are stored in the extension.
- No forms are filled or submitted without explicit user approval.
- Field detection runs entirely in-page — no network calls.
- All autofill actions require human confirmation (future milestone).

## Roadmap

- 09J — Browser Extension Skeleton ✅
- 09K — Browser Field Detection Engine ✅
- Future — Job description extraction
- Future — Autofill with user confirmation
