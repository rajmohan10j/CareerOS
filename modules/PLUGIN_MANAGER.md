# PLUGIN_MANAGER

Document ID: DOC-068
Version: 0.2.0
Status: Implemented (Milestone 09Q)

## Purpose

Manages plugin installation, permissions, execution, updates, and removal.

## Implementation

The Plugin Manager is implemented in `backend/app/services/plugin_service.py`
as the `PluginService` class. It uses `PluginRepository` for persistence
and `validate_manifest()` for validation logic.

## States

| State | Description |
|-------|-------------|
| registered | Manifest validated and stored |
| enabled | Plugin active (no code execution in this milestone) |
| disabled | Plugin inactive |
| removed | Metadata deleted |

## Transitions

- `register()`: validates manifest → checks duplicate `source_id` → stores as `registered`
- `enable()`: transitions `registered`/`disabled` → `enabled`
- `disable()`: transitions `enabled` → `disabled`
- `delete()`: removes metadata entirely

## Validation

All manifests are validated against:
1. Required field presence
2. String type + non-empty check
3. `source_id` pattern (`^[a-zA-Z0-9._-]+$`)
4. Semver format for `version` and `min_careeros_version`
5. Valid category enum
6. Known permissions (no unknown permissions allowed)
7. No duplicate permissions
8. No duplicate registration

## Rules

- Plugins require explicit permissions.
- Plugin behavior must be auditable.
- Plugins cannot bypass user approval flows.
- No plugin code execution in this milestone.
