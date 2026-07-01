# Plugin Manifest

Document ID: DOC-056-A
Version: 0.1.0
Status: Implemented (Milestone 09Q)

## Purpose

Defines the plugin manifest format for CareerOS plugins.

## Manifest Fields

Every plugin must declare a `manifest.json` file in its root directory
with the following structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique plugin identifier (reverse domain or UUID) |
| `name` | string | yes | Human-readable plugin name |
| `version` | string | yes | Semantic version string (e.g. "1.0.0") |
| `description` | string | yes | Short description of the plugin |
| `author` | string | yes | Plugin author or organization |
| `category` | string | yes | One of: job_portal, resume_export, ai_provider, browser_extension, document_import, notification, other |
| `entry_point` | string | yes | Relative path to the plugin entry module |
| `permissions` | string[] | yes | List of required permissions (see PLUGIN_PERMISSIONS.md) |
| `supported_platforms` | string[] | no | List of supported platforms: windows, linux, macos, web, browser_extension |
| `min_careeros_version` | string | yes | Minimum CareerOS version required |
| `config_schema` | object | no | JSON Schema for plugin configuration options |
| `homepage` | string | no | Plugin homepage URL |
| `license` | string | no | Plugin license identifier |

## Example

```json
{
  "id": "com.example.job-board-scraper",
  "name": "Job Board Scraper",
  "version": "1.0.0",
  "description": "Import job listings from external job boards",
  "author": "CareerOS Contributors",
  "category": "job_portal",
  "entry_point": "plugins/job-board-scraper/main.py",
  "permissions": ["read_jobs", "write_jobs", "network_access"],
  "supported_platforms": ["windows", "linux", "macos"],
  "min_careeros_version": "0.1.0",
  "config_schema": {
    "type": "object",
    "properties": {
      "api_key": { "type": "string" },
      "board_url": { "type": "string", "format": "uri" }
    }
  },
  "homepage": "https://github.com/careeros/job-board-scraper",
  "license": "MIT"
}
```

## Validation Rules

- All required fields must be present.
- `version` and `min_careeros_version` must be semantic version strings.
- `category` must be one of the defined enum values.
- `permissions` must only contain known permission names.
- `id` must match the pattern `^[a-zA-Z0-9._-]+$`.
- `supported_platforms` entries must be from the defined enum.
- `config_schema` if provided must be a valid JSON Schema object.
- Unknown fields are allowed for forward compatibility.
