# BROWSER_EXTENSION_ARCHITECTURE

Document ID: DOC-047  
Version: 0.2.0  
Status: Implemented (Milestone 09O)

## Purpose

Defines the browser extension architecture.

## Components

- Content script
- Background worker
- Popup UI
- Field detection engine (fieldDetector.js, fieldClassifier.js — 22 field types)
- Field mapping engine (profileClient.js, autofillMapper.js — 5 mapping status levels)
- Approval store (approvalState.js — in-memory Map with approve/reject/remove/clear/selectAllSafe)
- Preview renderer (mappingPreview.js — confidence %, low-confidence badges, sensitive warnings)
- Autofill executor (autofillExecutor.js — builds approved fill fields, sends FILL_FIELDS)
- Secure local backend connector (apiClient.js — health check with elapsed time)
- Permission manager

## Security Rules

- Request minimum browser permissions.
- Do not collect browsing history.
- Do not submit forms automatically.
- Do not click buttons or programmatically submit forms.
- Do not fill password, hidden, file, or disabled fields.
- Require explicit approval before filling any fields.
- Sensitive fields (phone, address, salary, work authorization, diversity, equal opportunity) cannot be auto-approved.
- Low-confidence fields (< 0.6) require verification.
- Fill execution runs only in content script with safety guards.
