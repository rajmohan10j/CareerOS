# Plugin Lifecycle

Document ID: DOC-056-C
Version: 0.1.0
Status: Implemented (Milestone 09Q)

## Purpose

Defines the plugin lifecycle states for CareerOS plugins.

## States

1. **Registered** — Plugin manifest has been submitted and validated.
   Metadata stored in the plugin registry. No code executed.

2. **Enabled** — Plugin is active and may be executed.
   User must explicitly enable after registration.

3. **Disabled** — Plugin is inactive.
   Metadata retained; no code executed.

4. **Removed** — Plugin metadata deleted from registry.
   This is a soft removal of metadata only.

## State Transitions

```
Registered  -->  Enabled  -->  Disabled  -->  Removed
                  ^            |
                  |____________|
```

- `POST /plugins/register` → creates in Registered state
- `POST /plugins/{id}/enable` → transition to Enabled
- `POST /plugins/{id}/disable` → transition to Disabled
- `DELETE /plugins/{id}` → transition to Removed (metadata deleted)

## Future States (not implemented in this milestone)

- **Installed** — plugin files present on disk
- **Configured** — user has provided configuration
- **Executed** — plugin code is running
- **Updated** — new version of plugin installed
- **Errored** — plugin encountered an error

## Rules

- Plugin code is NOT executed in the current milestone.
- State transitions are recorded with timestamps for audit.
- Only Registered plugins can be enabled.
- Only Enabled plugins can be disabled.
- Removal deletes metadata — no filesystem changes in this milestone.
