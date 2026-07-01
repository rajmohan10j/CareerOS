# Plugin Security

Document ID: DOC-056-D
Version: 0.1.0
Status: Implemented (Milestone 09Q)

## Purpose

Defines the security model for CareerOS plugins.

## Security Principles

1. **No Code Execution** — Plugin code is never executed in this milestone.
   The SDK handles metadata, validation, and registry only.

2. **Explicit Permissions** — All permissions must be declared in the
   plugin manifest. Unknown permissions are rejected.

3. **Input Validation** — All manifest fields are validated against
   the schema. Invalid manifests are rejected.

4. **Audit Trail** — All plugin operations (register, enable, disable,
   remove) are timestamped and idempotent.

5. **No Secrets in Metadata** — API keys, tokens, and passwords must
   NOT be stored in plugin manifests or metadata.

6. **Local-First** — Plugins must not require cloud services.

7. **No Application Submission** — Plugins must not submit job
   applications automatically.

## What Is NOT Allowed

- Arbitrary code execution from plugin manifests
- Shell command execution
- Dynamic package installation
- Arbitrary filesystem access (restricted to sandboxed paths)
- Arbitrary network access (permission-gated)
- Storage of secrets in metadata fields
- Bypass of user approval flows
- Automatic job application submission

## Permission Enforcement

- `network_access` — gated; outbound requests subject to policy
- `filesystem_read` / `filesystem_write` — restricted to plugin sandbox
- `browser_access` — gated by browser extension permissions
- `use_ai` — subject to AI service rate limits and content policy

## Validation

All plugin manifests undergo:

1. Schema validation (required fields, types, patterns)
2. Permission validation (all permissions must be from known set)
3. Category validation (must be from defined enum)
4. Version format validation (semver pattern)
5. Platform validation (entries must be from defined enum)
