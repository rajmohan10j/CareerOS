# ADR-006: AI Provider Abstraction

Status: Accepted  
Date: 2026-06-30

## Context

CareerOS must support local/free AI models and optional providers without vendor lock-in.

## Decision

All AI functionality must go through a provider abstraction layer.

## Consequences

- Easier provider replacement.
- Better testing.
- No hard dependency on a paid provider.
- Requires careful interface design.
