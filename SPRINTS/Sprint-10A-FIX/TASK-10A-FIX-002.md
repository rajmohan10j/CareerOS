# TASK-10A-FIX-002
Fix desktop/backend connection and CORS/local URL handling.

## Done
- Added CORSMiddleware to backend/app/main.py with allow_origins for local dev
- Added URL normalization to desktop/src/apiClient.js (trim, trailing slash removal, invalid value reset)
- Improved error messages with URL + endpoint + user-friendly next step
- Added CORS tests to backend (3 new tests)
- Added normalization/error message tests to desktop (6 new assertions)
- All 509 backend tests pass, 120 desktop tests pass, Ruff clean
