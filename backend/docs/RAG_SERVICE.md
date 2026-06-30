# RAG_SERVICE

Document ID: DOC-094  
Version: 0.1.0  
Status: Draft  
Milestone: 08C

## Purpose

Defines backend RAG service responsibilities.

## Responsibilities

- Chunk documents
- Generate embeddings
- Store vector records
- Retrieve relevant context
- Rerank results
- Provide context to AI Router

## Inputs

- source_id
- source_type
- text
- metadata

## Outputs

- ranked context snippets
- source references
- confidence indicators

## Rule

RAG output must remain traceable to source documents.
