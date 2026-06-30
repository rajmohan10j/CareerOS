# ADR-007: Local-First RAG

Status: Accepted  
Date: 2026-06-30

## Context

CareerOS requires semantic search over user career data without uploading personal data.

## Decision

Use local embeddings and a local vector store by default.

## Consequences

- Better privacy.
- Works offline.
- Hardware and storage constraints must be considered.
