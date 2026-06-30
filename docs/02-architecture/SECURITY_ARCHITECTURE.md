# SECURITY_ARCHITECTURE

Document ID: DOC-073  
Version: 0.1.0  
Status: Draft  
Milestone: 08A – System Architecture Pack

## Purpose

Defines the security model for CareerOS.

## Security Principles

- No telemetry by default.
- No automatic cloud transfer.
- No automatic job submission.
- Minimum browser permissions.
- Plugins require explicit permissions.
- User data must be exportable and removable.

## Sensitive Operations

Require explicit confirmation:

- Submit application
- Upload resume
- Send email/message
- Export profile data
- Install plugin
- Enable external provider

## Plugin Security

Plugins must declare:

- permissions
- data access
- network access
- execution scope
