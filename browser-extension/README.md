# CareerOS Browser Extension

Document ID: DOC-046
Version: 0.1.0
Status: Implemented (Milestone 09J — Skeleton)

## Purpose

The browser extension supports job page extraction and form autofill assistance.
This is the initial skeleton — it connects to the local CareerOS backend and
displays backend status in the popup UI.

## Target Browsers

- Chrome (Manifest V3)
- Edge (Manifest V3)
- Firefox (Manifest V3)

## Project Structure

```
browser-extension/
├── manifest.json          # Extension manifest (MV3)
├── package.json           # Test runner config
├── README.md              # This file
├── icons/                 # Extension icons (16, 48, 128)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── src/
│   ├── apiClient.js       # Shared API client (health check)
│   ├── background.js      # Service worker
│   ├── content.js         # Content script (placeholder)
│   ├── popup.html         # Popup UI
│   ├── popup.js           # Popup logic
│   ├── options.html       # Settings page
│   └── options.js         # Settings logic
├── styles/
│   └── popup.css          # Popup styling
└── tests/
    └── extension.test.js  # Basic structure & permissions validation
```

## Permissions

- `storage` — Save backend URL preference.
- `http://localhost:8000/*` — Connect to local CareerOS backend only.

No browsing history, credentials, tabs, or cross-origin data is collected.

## Backend Connection

The extension calls `GET /health` on the local backend and displays the result
(status, version, mode) in the popup. The backend URL defaults to
`http://localhost:8000` and can be changed in Settings.

## Development

```bash
# Run tests
npm test

# Verbose output
npm run test:verbose
```

## Security

- Local-first only — no data leaves your machine.
- No credentials are stored in the extension.
- No forms are filled or submitted without explicit user approval.
- All autofill actions require human confirmation (future milestone).

## Roadmap

- 09J — Browser Extension Skeleton ✅
- Future — Form field detection
- Future — Job description extraction
- Future — Autofill with user confirmation
