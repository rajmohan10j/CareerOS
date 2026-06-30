# SYSTEM_ARCHITECTURE

Document ID: DOC-069  
Version: 0.1.0  
Status: Draft  
Milestone: 08A – System Architecture Pack

## Purpose

This document defines the overall system architecture for CareerOS.

## Architectural Vision

CareerOS is a local-first, open-source career platform composed of shared core services and multiple clients.

```text
CareerOS Platform
├── Core Backend
├── Local AI Runtime
├── Database Layer
├── Vector Search Layer
├── Plugin Runtime
├── API Layer
├── Desktop Client
├── Mobile Client
├── Web Client
└── Browser Extension
```

## Core Architectural Principles

1. Local-first by default.
2. Free/open AI models must support all core features.
3. User data ownership is mandatory.
4. Clients should remain thin.
5. Backend owns business logic.
6. Plugins extend functionality safely.
7. AI providers must be abstracted.
8. Every critical action requires user approval.

## System Boundaries

### In Scope

- Career profile management
- Resume generation
- Job evaluation
- Application tracking
- Local AI routing
- Browser autofill assistance
- Interview preparation
- Plugin-based integrations

### Out of Scope for Initial Release

- Fully autonomous application submission
- Mandatory cloud sync
- Paid-model-only workflows
- Enterprise multi-tenant hosting

## High-Level Data Flow

```text
User Input
  ↓
Client UI
  ↓
CareerOS API
  ↓
Service Layer
  ↓
Database / Vector Store / Filesystem
  ↓
AI Provider Layer
  ↓
Response to Client
```

## Acceptance Criteria

- Architecture supports desktop, mobile, web, and browser clients.
- Architecture can run locally without cloud services.
- All AI calls pass through provider abstraction.
- Business logic remains backend-centered.
