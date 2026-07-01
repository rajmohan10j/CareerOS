# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in CareerOS, please report it privately by emailing the project maintainers. **Do not disclose security vulnerabilities publicly via GitHub issues or discussions.**

Please include:
- Description of the vulnerability
- Steps to reproduce
- Affected components and versions
- Any proof-of-concept (if available)

You can expect:
- Acknowledgment within 48 hours
- A timeline for fix and release
- Credit in release notes (if desired)

## Security Principles

### Local-First Architecture

CareerOS is designed as a local-first application. All data processing occurs on localhost by default. No data is transmitted to external servers unless explicitly configured by the user.

### No Paid API Required

All AI features work with free local Ollama. OpenRouter is optional and requires a user-provided API key. No paid API dependencies are bundled.

### No Telemetry

CareerOS contains no analytics, telemetry, usage tracking, or external calls. The browser extension only connects to the user-configured backend URL (defaults to `localhost:8000`).

### No Secrets in Source Code

- `.env` files are never committed to the repository
- API keys and credentials are configured locally and never stored in source
- `backend/.env` is in `.gitignore`

### Browser Extension Safety

- Minimal permissions: `storage` + `localhost:8000`
- All autofill operations require explicit per-field user approval
- Sensitive fields (phone, address, salary, work authorization) cannot be auto-approved
- Fill execution rejects password, hidden, disabled, readonly, file, submit, button, radio, and checkbox fields
- No chrome.storage in content scripts
- No HTTP requests from content scripts

### Plugin Security

- All plugin permissions are validated against a known permission list
- Unknown permissions cause validation failure
- Plugin code is never executed by the core system
- Plugin manifests must pass validation before registration

## Scope

This security policy applies to all components of CareerOS:
- Backend API (FastAPI)
- Browser Extension (Manifest V3)
- Desktop App (Vanilla JS SPA)
- Plugin SDK
- Documentation and scripts

## Supported Versions

| Version | Supported |
|---|---|
| v0.1.1 (Developer Preview) | ✅ Security fixes |
| Older versions | ❌ |

## Security Checklist

Before each release:
- [ ] No secrets committed
- [ ] No `.env` files tracked by git
- [ ] No paid API dependencies added
- [ ] No telemetry or tracking code added
- [ ] Extension permissions remain minimal
- [ ] All autofill safety guards remain in place
- [ ] Plugin validation remains strict
