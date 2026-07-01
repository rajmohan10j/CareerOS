# TASK-10A-FIX-001
Diagnose desktop backend fetch failure.

## Done
- Confirmed backend works directly: /health, /docs, /analytics/summary all return correct responses
- Confirmed desktop Settings shows URL http://127.0.0.1:8000
- Confirmed Test Connection fails with "Connection error: Failed to fetch"
- Confirmed Dashboard shows same error
- Identified root cause: no CORS middleware on FastAPI backend
