# Plugins

Document ID: DOC-055
Version: 0.2.0
Status: Implemented (Milestone 09Q)

## Purpose

Plugins allow CareerOS to support new job portals, data sources, AI providers, export formats, and workflow extensions without modifying the core application.

## Plugin Categories

- Job portal plugins
- Resume export plugins
- AI provider plugins
- Browser autofill plugins
- Notification plugins
- Data import/export plugins

## Plugin SDK

See [docs/PLUGIN_SDK.md](docs/PLUGIN_SDK.md) for the full SDK documentation.

## Directory Structure

```
plugins/
├── README.md
├── docs/
│   ├── PLUGIN_SDK.md           # SDK overview
│   ├── PLUGIN_MANIFEST.md      # Manifest format
│   ├── PLUGIN_PERMISSIONS.md   # Permission model
│   ├── PLUGIN_LIFECYCLE.md     # Lifecycle states
│   └── PLUGIN_SECURITY.md      # Security model
├── examples/
│   └── sample-plugin.json      # Example manifest
└── schemas/
    └── plugin-manifest.schema.json  # JSON Schema
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /plugins | List all registered plugins |
| POST | /plugins/register | Register a new plugin |
| POST | /plugins/validate | Validate a manifest without registering |
| GET | /plugins/{id} | Get plugin details |
| POST | /plugins/{id}/enable | Enable a plugin |
| POST | /plugins/{id}/disable | Disable a plugin |
| DELETE | /plugins/{id} | Remove plugin metadata |

## Rule

Plugins must follow security, privacy, and permission rules.
