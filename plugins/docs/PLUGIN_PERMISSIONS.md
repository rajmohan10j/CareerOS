# Plugin Permissions

Document ID: DOC-056-B
Version: 0.1.0
Status: Implemented (Milestone 09Q)

## Purpose

Defines the permission model for CareerOS plugins.

## Permission Categories

Each plugin must declare its required permissions in its manifest.
Unknown permissions cause validation failure.

### Profile Permissions

| Permission | Description |
|------------|-------------|
| `read_profile` | Read profile data (name, summary, contact) |
| `write_profile` | Modify profile data |

### Resume Permissions

| Permission | Description |
|------------|-------------|
| `read_resume` | Read resume content and metadata |
| `write_resume` | Create or modify resumes |

### Job Permissions

| Permission | Description |
|------------|-------------|
| `read_jobs` | Read job listings and evaluations |
| `write_jobs` | Create or modify job listings |

### Document Permissions

| Permission | Description |
|------------|-------------|
| `read_documents` | Read document content and metadata |
| `write_documents` | Create or modify documents |

### AI Permissions

| Permission | Description |
|------------|-------------|
| `use_ai` | Use CareerOS AI services |

### Network Permissions

| Permission | Description |
|------------|-------------|
| `network_access` | Make outbound network requests |

### Browser Permissions

| Permission | Description |
|------------|-------------|
| `browser_access` | Interact with browser extension APIs |

### Filesystem Permissions

| Permission | Description |
|------------|-------------|
| `filesystem_read` | Read files from local filesystem |
| `filesystem_write` | Write files to local filesystem |

### Notification Permissions

| Permission | Description |
|------------|-------------|
| `notifications` | Send user notifications |

## Safety Rules

- Unknown permissions are rejected at validation time.
- Permissions must be explicitly declared — no implicit grants.
- Plugins cannot request permissions not listed above.
- New permission categories require policy review and schema update.
- Plugins cannot bypass user approval for sensitive operations.
- `network_access` does not grant access to localhost without user consent.
- `filesystem_read` and `filesystem_write` are restricted to sandboxed paths.
