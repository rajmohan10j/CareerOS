# MVP Live Run Guide

**Milestone:** 10A-FIX – MVP Live Usability Fix  
**Status:** Complete — all desktop pages wired to live backend APIs

## Prerequisites

- Python 3.11+
- Node.js 18+
- Backend dependencies installed (`pip install -e ".[dev]"`)
- No other process on port 8000 or 5173

## Commands

### 1. Start Backend

```powershell
cd backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Expected:** Server starts on `http://127.0.0.1:8000`

### 2. Verify Backend Health

Open in browser or run:

```powershell
curl http://127.0.0.1:8000/health
```

**Expected:** `{"status":"ok","version":"0.1.0","mode":"local"}`

### 3. Start Desktop

```powershell
cd desktop
npm start
```

**Expected:** Server starts on `http://127.0.0.1:5173`

### 4. Verify Desktop Settings

Open `http://127.0.0.1:5173` → Navigate to Settings.

- Backend URL should show `http://127.0.0.1:8000`
- Click **Test Connection** → should show "Connected" with version and mode

**Expected:** Green success indicator

### 5. Verify Dashboard

Navigate to Dashboard.

- Analytics cards should load with data (or "0" if empty)
- Backend Status card should show "Connected"

**Expected:** No error messages

### 6. Verify Profile Page

Navigate to **Profile**.

- Profile form should load with saved data (or empty fields with placeholders)
- Fill in **Professional Summary**, **Target Roles**, **Industries**, **Preferred Locations**
- Click **Save Profile** → green success indicator

**Expected:** Profile data persists across page reloads (`GET /profile` / `PUT /profile`)

### 7. Verify Resumes Page

Navigate to **Resumes**.

- Shows list of existing resumes (or "No resumes yet" empty state with Upload/Paste/Create buttons)
- Click **Upload Resume** → file picker appears, supports .txt and .md; PDF/DOC/DOCX shows guidance
- Click **Paste Resume Text** → inline form with title, target role, content textarea
- Click **Create Blank Resume** → immediately creates empty resume
- Enter pasted content and save → resume appears in list
- Click a resume card to toggle content view with metadata (lazy fetch if content not loaded)
- Click **Download .txt** → file downloads locally via Blob
- Click **Download .md** → file downloads locally via Blob
- Folder import limitation message visible in upload form

**Expected:** Data from `GET /resumes`, new resume via `POST /resumes` with content, download via Blob

### 8. Verify Jobs Page

Navigate to **Jobs**.

- Shows list of existing jobs (or "No jobs tracked yet" empty state)
- Click **+ Add Job** → inline form appears
- Fill in title, company, location, URL, description
- Click **Add Job** → new job appears in list

**Expected:** Data from `GET /jobs`, new job via `POST /jobs`

### 9. Verify Applications Page

Navigate to **Applications**.

- Shows list of existing applications (or "No applications yet" empty state)
- Click **+ Add Application** → inline form appears
- Enter Job ID, optional Resume ID, Status, Notes
- Click **Add Application** → new application appears in list

**Expected:** Data from `GET /applications`, new application via `POST /applications`

### 10. Verify Documents Page

Navigate to **Documents**.

- Shows list of existing documents (or "No documents yet" empty state)
- Click **+ Add Document** → inline form appears
- Enter title, category, content
- Click **Add Document** → new document appears in list

**Expected:** Data from `GET /documents`, new document via `POST /documents`

### 11. Verify AI Status Page

Navigate to **AI Status**.

- **Backend Health** section shows version and mode
- **AI Providers** section lists configured providers
- **AI Models** section lists available models
- **AI Health** section shows provider health status

**Expected:** Data from `GET /ai/providers`, `GET /ai/models`, `GET /ai/health`

### 12. Verify Browser Extension Page

Navigate to **Browser Extension**.

- Shows **Setup Instructions** with installation steps
- Shows **Backend Status** section
- Shows **Supported Job Boards** list

**Expected:** Static guidance page — no backend calls

### 13. Load Browser Extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `browser-extension/` folder

**Expected:** Extension icon appears in toolbar

## Known Limitations

- Desktop app is a Vanilla JS SPA — not wrapped in Tauri/Electron
- No automated installer — manual setup required
- Firefox and Safari not yet supported for the extension
- Extension tested only on Chrome and Edge

## Troubleshooting

See `docs/08-operations/TROUBLESHOOTING.md` for common issues.
