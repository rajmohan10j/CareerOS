# RAG_SERVICE

Document ID: DOC-094
Version: 0.2.0
Status: Implemented (Milestone 09R)

## Purpose

Defines backend RAG service responsibilities.

## Responsibilities

- Chunk documents (ChunkingService)
- Generate embeddings (AIService.embed)
- Store vector records (Knowledge Repository)
- Retrieve relevant context (keyword search)
- Provide context to AI Router (future)

## Implementation

### KnowledgeService

Located at `backend/app/services/knowledge_service.py`.

Methods:
- `create(data)` — create a knowledge record
- `list_all()` — list all records
- `get_by_id(id)` — get record by ID
- `delete(id)` — delete a record
- `chunk_knowledge(id, chunk_size, overlap)` — chunk record content
- `index_knowledge(id)` — generate embeddings via AIService
- `search(query, source_type, limit)` — keyword search
- `list_by_source_type(type)` — filter by source type
- `get_by_source(type, id)` — retrieve by source
- `reindex_all()` — re-index all records

### ChunkingService

Located at `backend/app/services/chunking_service.py`.

Two strategies:
- `chunk_text(text, chunk_size, overlap)` — paragraph-aware
- `chunk_text_fixed_size(text, chunk_size, overlap)` — fixed word count

### Knowledge Model

Located at `backend/app/models/knowledge.py`.

Fields:
- source_id, source_type, title, content
- chunks_json, metadata_json, embedding_json
- chunk_count, indexed_at

## Inputs

- source_id
- source_type (from defined set)
- text content
- metadata (optional JSON)

## Outputs

- ranked context snippets (keyword search results)
- source references
- chunked text with metadata

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /knowledge | List records |
| POST | /knowledge | Create record |
| GET | /knowledge/{id} | Get record |
| DELETE | /knowledge/{id} | Delete record |
| POST | /knowledge/chunk | Chunk content |
| POST | /knowledge/index | Index embeddings |
| POST | /knowledge/search | Keyword search |
| GET | /knowledge/source/{type}/{id} | Source lookup |

## Rule

RAG output must remain traceable to source documents.
