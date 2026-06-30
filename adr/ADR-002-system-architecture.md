# ADR-002: System Architecture

Status: Accepted  
Date: 2026-06-30

## Context

CareerOS must support desktop, mobile, web, browser extension, AI services, plugin extensibility, and local-first privacy.

## Decision

Adopt a platform architecture with a shared backend, local AI provider layer, database layer, plugin runtime, and multiple thin clients.

## Consequences

- Clients remain simpler.
- Business logic is centralized.
- Local-first operation is preserved.
- More upfront architecture discipline is required.
