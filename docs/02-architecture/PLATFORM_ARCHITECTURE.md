# PLATFORM_ARCHITECTURE

Document ID: DOC-075  
Version: 0.1.0  
Status: Draft  
Milestone: 08A – System Architecture Pack

## Purpose

Defines CareerOS as a platform rather than a single application.

## Platform Layers

```text
Applications
  ↓
Public APIs
  ↓
Core Services
  ↓
AI Runtime
  ↓
Data Layer
  ↓
Plugin SDK
```

## Platform Goals

- Enable third-party plugins.
- Allow multiple clients to share the same core.
- Keep local-first operation.
- Preserve user control.
- Avoid vendor lock-in.
