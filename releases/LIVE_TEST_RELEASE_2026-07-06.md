# CareerOS Live Test Release - 2026-07-06

## Status

Released for local live test / developer-preview MVP.

This is not a public stable release. Public release still requires manual unpacked-extension verification, fresh-clone setup verification, and final distribution artifact decisions.

## Verification

| Gate | Result |
|------|--------|
| First-run setup check | PASS - 16 passed, 0 failed |
| Environment doctor | PASS - 32 passed, 0 failed |
| Backend tests | PASS - 511 passed |
| Browser extension package test | PASS - 188 passed |
| Browser extension full assertion inventory | PASS - 687 passed |
| Desktop tests | PASS - 292 passed |
| Ruff lint | PASS |
| Release readiness check | PASS |
| Paid API dependency check | PASS |
| Telemetry check | PASS |

## Live Test Scope

- Backend API at `http://127.0.0.1:8000`
- Desktop app at `http://127.0.0.1:5173`
- Browser extension loaded manually from canonical folder `browser-extension/`
- Local-only developer-preview workflow

## Remaining Before Public Release

- Manual Chrome/Edge Load unpacked browser-extension check
- Fresh-clone setup check
- Distribution/release artifact decision
- Real-world browser extension testing pack
