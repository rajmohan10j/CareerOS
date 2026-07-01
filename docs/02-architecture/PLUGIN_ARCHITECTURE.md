# PLUGIN_ARCHITECTURE

Document ID: DOC-057
Version: 0.2.0
Status: Implemented (Milestone 09Q)

## Purpose

Defines how CareerOS supports extensibility through plugins.

## Architecture

```text
CareerOS Core
  ↓
Plugin Manager (PluginService)
  ↓
Plugin Registry (PluginRepository + SQLite)
  ↓
Plugin APIs (REST endpoints)
```

## Layer Description

### Plugin Manager (PluginService)

- Validates plugin manifests against JSON Schema + business rules
- Manages lifecycle states: registered → enabled → disabled → removed
- No code execution — metadata and state only

### Plugin Registry (PluginRepository + SQLite)

- Stores plugin metadata in `plugins` table
- Supports CRUD operations
- `source_id` uniqueness enforcement

### Plugin APIs

- `GET /plugins` — list registered plugins
- `POST /plugins/register` — register a new plugin (requires validation)
- `POST /plugins/validate` — validate a manifest without persisting
- `GET /plugins/{id}` — get plugin by ID
- `POST /plugins/{id}/enable` — transition to enabled
- `POST /plugins/{id}/disable` — transition to disabled
- `DELETE /plugins/{id}` — remove plugin metadata

## Requirements

- Plugins must be isolated.
- Plugins must be permission-scoped.
- Plugins must not bypass audit logging.
- Plugins must not submit applications automatically.
- Plugin code is NOT executed in this milestone.
- Manifests must pass validation (required fields, known permissions, valid categories, semver versions).
