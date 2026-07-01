# EMBEDDINGS

Document ID: DOC-089
Version: 0.2.0
Status: Implemented (Milestone 09R)

## Purpose

Defines embedding strategy for CareerOS.

## Default Model

`nomic-embed-text`

## Alternative Models

- bge-m3
- all-MiniLM variants
- other local embedding models

## Embedded Content

- Master Candidate Profile
- Resume versions
- Job descriptions
- Interview notes
- Learning materials
- Portfolio documents
- Any content added to the Knowledge Base

## Implementation

Embeddings are generated through the `AIService.embed()` abstraction,
which delegates to the configured provider (Ollama by default).

The embedding service:
1. Accepts a list of text strings
2. Calls the provider's embed endpoint
3. Returns `list[list[float]]` vectors
4. Stores vectors as JSON in the `knowledge` table's `embedding_json` field

## RAG Integration

The Knowledge Base stores embeddings alongside chunked text.
When the AI service generates responses, relevant context can be
retrieved via keyword search (semantic search is a future enhancement).

## Chunking Principles

- Preserve semantic meaning.
- Keep chunks traceable to source.
- Store metadata for retrieval.
- Avoid embedding secrets unnecessarily.

## Privacy Rule

Embeddings are generated locally by default.
