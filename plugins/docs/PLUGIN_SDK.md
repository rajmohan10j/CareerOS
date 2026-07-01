# PLUGIN_SDK

Document ID: DOC-056
Version: 0.2.0
Status: Implemented (Milestone 09Q)

## Purpose

Defines the plugin development model for CareerOS.

## Plugin Manifest

Each plugin must include a manifest with:

- `id` — unique identifier (reverse domain or UUID)
- `name` — human-readable name
- `version` — semantic version string
- `description` — short description
- `author` — plugin author
- `category` — job_portal, resume_export, ai_provider, browser_extension, document_import, notification, other
- `entry_point` — relative path to entry module
- `permissions` — array of required permissions
- `min_careeros_version` — minimum compatible CareerOS version
- `supported_platforms` — optional platform list
- `config_schema` — optional JSON Schema for config
- `homepage` — optional URL
- `license` — optional license identifier

See [PLUGIN_MANIFEST.md](PLUGIN_MANIFEST.md) for full field definitions.

## Plugin Lifecycle

| State | Description |
|-------|-------------|
| Registered | Manifest validated and stored |
| Enabled | Plugin active (may be executed) |
| Disabled | Plugin inactive (metadata retained) |
| Removed | Metadata deleted |

See [PLUGIN_LIFECYCLE.md](PLUGIN_LIFECYCLE.md) for details.

## Permissions

Plugins must declare required permissions. See
[PLUGIN_PERMISSIONS.md](PLUGIN_PERMISSIONS.md) for the full permission list.

## Security

See [PLUGIN_SECURITY.md](PLUGIN_SECURITY.md) for the security model.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /plugins | List all registered plugins |
| POST | /plugins/register | Register a new plugin |
| GET | /plugins/{id} | Get plugin details |
| POST | /plugins/{id}/enable | Enable a plugin |
| POST | /plugins/{id}/disable | Disable a plugin |
| DELETE | /plugins/{id} | Remove plugin metadata |
| POST | /plugins/validate | Validate a manifest without registering |

## Extension Points (Future)

- job portal plugins
- resume export plugins
- AI provider plugins
- browser/autofill plugins
- document import/export plugins
- notification plugins

## Current Scope

This milestone implements the foundation: metadata validation, registry,
and lifecycle management. Plugin code execution is NOT implemented.
