# RAG_ARCHITECTURE

Document ID: DOC-031  
Version: 0.1.0  
Status: Draft

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
Chunking
  ↓
Embedding
  ↓
Vector Store
  ↓
Retrieval
  ↓
Reranking
  ↓
LLM Response
```

## Vector Collections

- profile_chunks
- resume_chunks
- job_chunks
- interview_chunks
- learning_chunks

## Privacy Rule

All embeddings are generated locally by default.
