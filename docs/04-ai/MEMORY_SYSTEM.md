# MEMORY_SYSTEM

Document ID: DOC-091
Version: 0.2.0
Status: Implemented (Milestone 09R)

## Purpose

Defines CareerOS memory design.

## Memory Types

### User-Controlled Memory

Stored in Master Candidate Profile.

### Project Memory

Stored in `.ai/PROJECT_MEMORY.md`.

### Session Memory

Temporary runtime context.

### Vector Memory

Searchable embeddings from approved sources, stored in the Knowledge Base
(`knowledge` table). Supports keyword search, source type filtering, and
source-based retrieval.

## Knowledge Base

The Knowledge Base (Milestone 09R) provides:
- Storage for text content from all data sources
- Chunking with configurable size and overlap
- Embedding generation through AIService
- Keyword search across title and content
- Source type filtering (profile, resume, document, job, application, note, plugin, other)
- Source-based lookup

## Rules

- Users control personal memory.
- AI must not silently persist sensitive data.
- Memory must be editable and exportable.
- Personal data must not leave the device by default.
- All knowledge records are stored locally in SQLite.
