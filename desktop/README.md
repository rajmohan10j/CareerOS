# Desktop Application

Document ID: DOC-040  
Version: 0.2.0  
Status: Implemented (Milestone 09P — Desktop App Shell)

## Purpose

The desktop application is the primary local interface for CareerOS.
It provides a dashboard, navigation, and placeholder screens for all
core modules. The client is thin — business logic lives in the backend.

## Target Framework

Tauri (frontend shell ready; Tauri Rust wrapper not yet configured)

## Initial Target Platform

Windows first, followed by Linux and macOS.

## Project Structure

```
desktop/
├── README.md
├── package.json
├── src/
│   ├── index.html              # HTML entry point
│   ├── main.js                 # App bootstrap + hash routing
│   ├── apiClient.js            # Backend health check client
│   ├── routes.js               # SPA route definitions (dynamic imports)
│   ├── components/
│   │   ├── Layout.js           # Grid layout: sidebar + content + status bar
│   │   ├── Sidebar.js          # Navigation sidebar (9 pages)
│   │   ├── StatusBar.js        # Bottom status bar with backend indicator
│   │   └── BackendStatus.js    # Backend health check (polled every 30s)
│   └── pages/
│       ├── Dashboard.js        # Overview with dashboard cards + health
│       ├── Profile.js          # Placeholder
│       ├── Resumes.js          # Placeholder
│       ├── Jobs.js             # Placeholder
│       ├── Applications.js     # Placeholder
│       ├── Documents.js        # Placeholder
│       ├── AIStatus.js         # Placeholder with backend health
│       ├── BrowserExtension.js # Placeholder
│       └── Settings.js         # Backend URL config + test connection
├── styles/
│   └── app.css                 # Application styles
└── tests/
    └── desktop.test.js         # 120 tests — file structure, pages, security, analytics dashboard, URL normalization, CORS
```

## Capabilities

- Dashboard with 8 live analytics cards (Profile, Resumes, Jobs, Applications, Documents, Knowledge, Plugins, Backend Status) fetched from `GET /analytics/summary`
- Dashboard shows empty-state messages when no data exists
- Sidebar navigation with 9 pages (hash-based SPA routing)
- Backend health check (checks `GET /health` on startup and every 30s)
- Status bar showing backend connection status
- Settings page with backend URL configuration + Test Connection button
- Placeholder pages for: Profile, Resumes, Jobs, Applications, Documents, AI Status, Browser Extension
- Local-first: all configuration stored in localStorage, backend calls to 127.0.0.1:8000 only

## Getting Started

```bash
# Install dependencies (no runtime deps needed)
cd desktop
npm install

# Run tests
npm test

# Start local development server
npm start

# Open in browser
# http://127.0.0.1:5173
```

## Tauri Setup (Future)

To wrap this frontend in a Tauri desktop window:

```bash
cargo install tauri-cli
npm install @tauri-apps/cli @tauri-apps/api
npx tauri init
```

Then configure `tauri.conf.json` with window settings and `src/index.html` as the entry point.

## Responsibilities

- Local user interface (thin client)
- Dashboard and navigation
- Profile, resume, job, application management (future)
- AI assistant interface (future)
- Settings and model configuration (future)
- Local backend connection

## Rules

- Business logic stays in the backend.
- Desktop client is thin — no duplicated backend services.
- No paid dependencies.
- No cloud services required.
- No autofill logic in the desktop app.
- No form submission or job application automation.
