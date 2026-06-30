# COMPONENT_ARCHITECTURE

Document ID: DOC-070  
Version: 0.1.0  
Status: Draft  
Milestone: 08A – System Architecture Pack

## Purpose

Defines the major system components and responsibilities.

## Components

### Core Backend

Provides APIs, service orchestration, business rules, and persistence access.

### API Layer

Exposes REST APIs for clients and local tools.

### Service Layer

Contains business logic for profiles, resumes, jobs, applications, documents, AI, and plugins.

### Data Layer

Manages SQLite, optional PostgreSQL, vector store, and local filesystem.

### AI Provider Layer

Routes AI tasks to local models such as Ollama.

### Plugin Runtime

Enables controlled extension for job portals, export formats, AI providers, and automation helpers.

### Clients

- Desktop: Tauri
- Mobile: Flutter
- Web: Next.js
- Browser Extension: Chrome/Edge/Firefox

## Component Rule

No client should duplicate core domain logic. Clients call APIs and render user workflows.
