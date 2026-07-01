# DESKTOP_USER_GUIDE

Document ID: DOC-053  
Version: 0.2.0  
Status: Implemented (Milestone 09P – Desktop App Shell)

## Purpose

User-facing guide for the CareerOS desktop application.

## Overview

The CareerOS Desktop App is a local-first desktop client that connects to
your local CareerOS backend. It provides a dashboard, navigation, and
placeholder screens for all core modules.

## Getting Started

1. Ensure your CareerOS backend is running on `http://localhost:8000`.
2. Open `src/index.html` in a browser (or via Tauri when configured).
3. The status bar at the bottom shows backend connection status.
4. Use the sidebar to navigate between modules.

## Settings

- Open the **Settings** page via the sidebar.
- Configure the **Backend URL** if your backend runs on a different address.
- Click **Test Connection** to verify connectivity.
- Click **Save** to persist the URL.

## Dashboard

The Dashboard page now fetches live analytics from the backend and displays:
- **Profile** — populated field count and completeness percentage
- **Resumes** — total count, content status, latest version
- **Jobs** — total count, number with scores
- **Applications** — total count, number linked to resumes
- **Documents** — total count and total file size
- **Knowledge** — total records, indexed count, chunk total
- **Plugins** — total count, status distribution
- **Backend Status** — connection status and last activity date

All data comes from the `GET /analytics/summary` endpoint. The dashboard shows empty-state messages when no data exists.

## Planned Sections

- Installation
- First run
- Configure local models
- Create profile
- Generate resume
- Track jobs
- Use autofill
- Troubleshooting
