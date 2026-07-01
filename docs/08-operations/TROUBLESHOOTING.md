# Troubleshooting Guide

Document ID: DOC-071  
Version: 0.1.0  
Status: Implemented (Milestone 09T – Production Readiness Foundation)

## Backend won't start

**Symptom:** `.\scripts\start-backend.ps1` fails or exits immediately.

**Checklist:**

1. **Python version** — Run `python --version`. Must be 3.11 or later.
2. **Virtual environment** — Ensure you created and activated a venv:
   ```powershell
   cd backend
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -e ".[dev]"
   ```
3. **Dependencies installed** — Verify with `pip list | findstr fastapi`.
4. **Port conflict** — Ensure nothing else runs on port 8000:
   ```powershell
   netstat -ano | findstr :8000
   ```
5. **Database permissions** — The backend needs write access to the `backend/` directory for `careeros.db`.

## Tests fail

**Symptom:** `.\scripts\test-backend.ps1` shows test failures.

### Backend tests

- Run `python -m pytest tests/ -v --tb=long` for detailed output.
- Ensure you are in the `backend/` directory or use `--rootdir=backend`.
- Run `python -m ruff check app tests` to check for lint issues.
- If tests fail with database errors, delete `backend/careeros.db` and retry.

### Extension tests

- Ensure you are in the `browser-extension/` directory when running `npm test`.
- Verify `node --version` is 18+.

### Desktop tests

- Ensure you are in the `desktop/` directory when running `npm test`.
- Desktop tests are file-structure and content checks — they do not need a running backend.

## Browser extension not loading

**Symptom:** Extension icon not visible after loading unpacked.

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the `browser-extension/` folder (not a subfolder).
3. Check for errors on the extension card (red text).
4. Verify `manifest.json` has valid JSON.
5. Ensure all referenced files exist (`popup.html`, `background.js`, `content.js`, etc.).

## Desktop app shows "Connection error"

**Symptom:** Dashboard or status bar shows backend is not reachable.

1. Verify the backend is running at `http://localhost:8000/health`.
2. Check the Settings page — the backend URL must match.
3. If using a custom port, update the URL in Settings and click **Save**.
4. Check for firewall or proxy blocking localhost connections.
5. Restart the backend and refresh the desktop page.

## AI provider not responding

**Symptom:** AI-powered endpoints return errors or timeouts.

1. **Ollama:** Ensure Ollama is running (`ollama serve`). Verify model is pulled (`ollama list`).
2. **OpenRouter:** Set `openrouter_api_key` in `backend/.env`. Verify the key is valid.
3. Check `backend/.env` for the correct provider setting:
   ```
   provider=ollama
   # or
   provider=openrouter
   ```
4. Increase timeouts in `backend/.env` if models are slow:
   ```
   ai_generate_timeout=300
   ```

## "No module named app"

**Symptom:** Import errors when running pytest or uvicorn.

- Ensure you are running commands from the `backend/` directory.
- The `pyproject.toml` sets `pythonpath = ["."]`, so app modules are discoverable.
- If using a custom Python path, set `PYTHONPATH=backend`.

## Plugin validation fails

**Symptom:** `POST /plugins/register` returns validation errors.

- Ensure the manifest has all required fields: `source_id`, `name`, `version`, `category`, `entry_point`, `min_careeros_version`, `permissions`.
- Version must be valid semver (e.g., `1.0.0`).
- Category must be one of: `ats`, `analysis`, `generator`, `connector`, `ui`, `data`, `other`.
- Permissions must be from the known list (see `plugins/docs/PLUGIN_PERMISSIONS.md`).
- `source_id` must match pattern `^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$`.

## Getting help

- Run `.\scripts\doctor.ps1` to check your environment.
- Run `.\scripts\release-check.ps1` to verify release readiness.
- Check `EXECUTION/002_CURRENT_STATUS.md` for the current milestone status.
