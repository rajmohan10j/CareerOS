# EXTENSION_SECURITY_MODEL

Document ID: DOC-107  
Version: 0.2.0  
Status: Implemented  
Milestone: 09N

## Purpose

Defines the security model for the CareerOS browser extension, covering
permissions, data flow, fill safety, and prohibited operations.

## Permissions

- `storage` — Save backend URL preference only.
- `http://localhost:8000/*` — Connect to local CareerOS backend only.
- No `tabs`, `cookies`, `webNavigation`, `scripting`, or `activeTab` permissions.
- No host permissions beyond localhost — no access to job board domains.

## Data Flow

1. **Detection** — Content script reads DOM elements (id, name, label, placeholder, nearby text) — no network calls.
2. **Classification** — Pure JS classifier running in-page — no network calls.
3. **Profile Fetch** — Popup/background fetches GET /profile, /skills, /experiences from localhost:8000 — only data, never page content.
4. **Mapping** — Pure JS matching in popup — no network calls.
5. **Approval** — In-memory Map in popup — no storage, no network.
6. **Fill** — Popup sends approved fields via background to content script — content script performs value assignment with safety checks — no external network calls, no persistence.

## Fill Safety Guards (content.js)

Every field must pass `isFillableElement` before any value assignment:

| Condition | Action |
|-----------|--------|
| Element not found | Skipped (not-found) |
| type=password | Skipped (password) |
| type=hidden | Skipped (hidden) |
| disabled | Skipped (disabled) |
| readOnly | Skipped (readonly) |
| type=file | Skipped (file) |
| type=submit/button/reset/image | Skipped (button) |
| type=radio | Skipped (radio) |
| type=checkbox | Skipped (checkbox) |
| select with no matching option | Skipped (unfillable) |
| All checks pass | Value assigned + input/change dispatched |

## Prohibited Operations

- No `form.submit()` — never submit a form programmatically.
- No `.click()` — never click buttons, links, or interactive elements.
- No file upload — never set `type=file` values.
- No `chrome.storage` in fill code — approval state is not persisted.
- No `fetch`/`XMLHttpRequest` in content script — content script has no network access.
- No new `chrome.tabs` — background only forwards messages, never opens tabs.
- No persistence of field values — fill results are in-memory only.

## Approval Enforcement

- Fill only executes for fields with explicit `approved` status in approvalStore.
- Fields with `rejected`, `pending`, or unset status are always skipped.
- `buildApprovedFillFields` further filters by non-null/non-empty value and non-file type.
- Sensitive field approve radio is disabled in the UI — cannot be auto-selected.
- "Select All Safe" excludes sensitive fields regardless of confidence or status.

## Sensitive Fields

Require explicit manual confirmation (approve radio disabled by default):

- salary expectation
- work authorization
- personal address
- phone number
- notice period
- diversity/equal opportunity questions

## Verification

All rules are enforced by automated tests:
- `safetyGuards.test.js` (22 tests) — no submit, no click, no file upload, only approved fills, no bypass, no external calls, no dangerous permissions, no persistence
- `controlledFill.test.js` (53 tests) — FILL_FIELDS handler, fillability checks, event dispatch, highlight, result tracking, background forwarding, popup integration, CSS styles
- `extension.test.js` (155 tests) — source validation checks across all files for prohibited patterns
