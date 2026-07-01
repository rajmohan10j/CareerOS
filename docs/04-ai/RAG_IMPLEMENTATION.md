# RAG_IMPLEMENTATION

Document ID: DOC-096
Version: 0.1.0
Status: Implemented (Milestone 09R)

## Purpose

Describes the RAG (Retrieval-Augmented Generation) implementation for CareerOS.

## Architecture

```text
Document/Profile/Job text
  ↓
KnowledgeService.create() → stores in knowledge table
  ↓
POST /knowledge/chunk → splits text into chunks
  ↓
POST /knowledge/index → generates embeddings via AIService
  ↓
POST /knowledge/search → keyword search (semantic search skeleton in place)
```

## Components

### Knowledge Model
- `knowledge` table in SQLite
- Fields: source_id, source_type, title, content, chunks_json, metadata_json, embedding_json, chunk_count, indexed_at

### ChunkingService
- `chunk_text()` — paragraph-aware chunking with configurable size and overlap
- `chunk_text_fixed_size()` — fixed-word-count chunking with overlap
- Both return `KnowledgeChunkItem` objects (index, text, token_count)

### KnowledgeService
- `create()` — store a knowledge record
- `chunk_knowledge()` — chunk existing record content
- `index_knowledge()` — generate embeddings via AIService.embed()
- `search()` — keyword search with optional source_type filter
- `get_by_source()` — retrieve by source_type + source_id
- `reindex_all()` — re-index all records

### Embedding
- Goes through `AIService.embed()` abstraction
- If AIService unavailable, keyword search still works
- Embeddings stored as JSON in `embedding_json` field

## Source Types

profile, resume, document, job, application, note, plugin, other

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /knowledge | List records (optional ?source_type=) |
| POST | /knowledge | Create a knowledge record |
| GET | /knowledge/{id} | Get record by ID |
| DELETE | /knowledge/{id} | Delete a record |
| POST | /knowledge/chunk | Chunk a record's content |
| POST | /knowledge/index | Index (embed) one or all records |
| POST | /knowledge/search | Keyword search |
| GET | /knowledge/source/{type}/{id} | Get records by source |

## Future

- Semantic search using stored embeddings
- Reranking of search results
- Hybrid search (keyword + semantic)
- Automatic indexing of profile/resume/job/documents on create
