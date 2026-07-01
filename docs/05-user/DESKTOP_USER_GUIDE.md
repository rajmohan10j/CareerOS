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

## Planned Sections

- Installation
- First run
- Configure local models
- Create profile
- Generate resume
- Track jobs
- Use autofill
- Troubleshooting
