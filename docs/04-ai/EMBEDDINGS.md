# EMBEDDINGS

Document ID: DOC-089  
Version: 0.1.0  
Status: Draft  
Milestone: 08C

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

## Chunking Principles

- Preserve semantic meaning.
- Keep chunks traceable to source.
- Store metadata for retrieval.
- Avoid embedding secrets unnecessarily.

## Privacy Rule

Embeddings are generated locally by default.
