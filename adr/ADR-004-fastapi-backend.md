# ADR-004: FastAPI Backend

Status: Accepted  
Date: 2026-06-30

## Context

CareerOS needs a local backend that is easy to build, document, test, and integrate with AI workflows.

## Decision

Use FastAPI as the initial backend framework.

## Consequences

- Strong OpenAPI support.
- Good Python AI ecosystem compatibility.
- Easy local development.
- Requires disciplined service layering to avoid route-level business logic.
