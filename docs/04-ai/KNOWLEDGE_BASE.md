# KNOWLEDGE_BASE

Document ID: DOC-097
Version: 0.1.0
Status: Implemented (Milestone 09R)

## Purpose

Defines the Knowledge Base system for CareerOS. The Knowledge Base stores,
chunks, indexes, and retrieves content from all CareerOS data sources.

## Data Sources

- profile — Master Candidate Profile
- resume — Resume versions
- document — Documents (cover letters, certificates, etc.)
- job — Job descriptions and evaluations
- application — Application notes and history
- note — User notes
- plugin — Plugin metadata
- other — Other text content

## Storage

All knowledge records are stored in the local SQLite `knowledge` table:
- Raw content preserved in `content` field
- Chunks stored as JSON in `chunks_json`
- Embeddings stored as JSON in `embedding_json`
- Metadata stored as JSON in `metadata_json`

## Chunking

Two strategies available:
1. **Paragraph-aware** (`chunk_text`): Splits by `\n\n`, joins until size limit, configurable overlap
2. **Fixed-size** (`chunk_text_fixed_size`): Word-count-based, no semantic boundaries

Default chunk size: 500 tokens, overlap: 50 tokens.

## Embedding

Embeddings go through the `AIService.embed()` abstraction (Ollama by default).
If no AI service is available, keyword search still works.

## Search

### Keyword Search
- SQL `LIKE` search on `title` and `content` fields
- Optional `source_type` filter
- Results limited (default 20)

### Semantic Search (Placeholder)
- Embedding vectors stored but not yet used for search
- Future: cosine similarity search using stored embeddings

## Indexing

- `POST /knowledge/index` with `knowledge_id` — index a single record
- `POST /knowledge/index` without body — re-index all records
- Indexing generates embeddings via AIService and stores them
- `indexed_at` timestamp set after successful embedding

## Rules

- All data stored locally in SQLite.
- No external cloud dependencies.
- Embeddings generated locally by default.
- Keyword search works without embeddings.
- Source types are validated against a known set.
- Invalid source types are rejected at the API layer.
