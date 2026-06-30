# DEPLOYMENT_ARCHITECTURE

Document ID: DOC-072  
Version: 0.1.0  
Status: Draft  
Milestone: 08A – System Architecture Pack

## Purpose

Defines supported deployment modes.

## Deployment Modes

### Local Desktop Mode

```text
Tauri Desktop App
  ↓
Local FastAPI Backend
  ↓
SQLite + Vector DB + Ollama
```

### Local Web Mode

```text
Browser
  ↓
Next.js UI
  ↓
Local FastAPI Backend
```

### Mobile Companion Mode

```text
Mobile App
  ↓
Local Network Backend or Future Sync
```

### Self-Hosted Mode

Future option for advanced users.

## Default Deployment

The default deployment is local-first on the user's machine.
