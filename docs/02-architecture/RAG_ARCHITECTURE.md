# RAG_ARCHITECTURE

Document ID: DOC-031
Version: 0.2.0
Status: Implemented (Milestone 09R)

## Purpose

Defines Retrieval-Augmented Generation architecture for CareerOS.

## Data Sources

- Master Candidate Profile
- Resume versions
- Job descriptions
- Cover letters
- Interview notes
- Certifications
- Portfolio documents
- Learning records

## Pipeline

```text
Document
  ↓
Chunking (ChunkingService)
  ↓
Embedding (AIService.embed via Ollama)
  ↓
Vector Storage (knowledge table embedding_json field)
  ↓
Retrieval (keyword search; semantic search placeholder)
  ↓
LLM Response (future: reranking + context injection)
```

## Storage

Knowledge records are stored in a local SQLite `knowledge` table.
Chunks and embeddings are serialized as JSON fields.
All data remains local — no cloud vector database required.

## Source Types

- profile, resume, document, job, application, note, plugin, other

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /knowledge | List knowledge records |
| POST | /knowledge | Create a knowledge record |
| GET | /knowledge/{id} | Get record by ID |
| DELETE | /knowledge/{id} | Delete a record |
| POST | /knowledge/chunk | Chunk a record |
| POST | /knowledge/index | Index (embed) a record |
| POST | /knowledge/search | Keyword search |
| GET | /knowledge/source/{type}/{id} | Get by source |

## Privacy Rule

All embeddings are generated locally by default.
