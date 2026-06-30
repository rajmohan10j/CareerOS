# ADR-003: Local-First AI

Status: Accepted  
Date: 2026-06-30

## Context

CareerOS must be usable without paid LLMs or mandatory cloud AI.

## Decision

Use local/free AI models as the default supported path. Ollama is the first supported runtime.

## Consequences

- Users avoid mandatory subscription costs.
- Performance depends on local hardware.
- Model routing and graceful degradation are required.
