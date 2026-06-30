# MODEL_SELECTION

Document ID: DOC-088  
Version: 0.1.0  
Status: Draft  
Milestone: 08C

## Purpose

Defines how models are selected for user hardware and task type.

## Hardware Profiles

### Low-End: 8 GB RAM

- Reasoning: Gemma 3 4B or Qwen small model
- Coding: Qwen2.5-Coder 3B
- Embeddings: nomic-embed-text
- Vision: disabled or optional external local OCR

### Mid-Range: 16 GB RAM

- Reasoning: Qwen 3 8B
- Coding: Qwen2.5-Coder 7B
- Vision: Qwen2.5-VL 7B
- Embeddings: nomic-embed-text or bge-m3

### High-End: 32 GB+

- Larger coding/reasoning models
- Vision enabled
- Reranking enabled
- Multiple agents possible

## Selection Rule

The installer should recommend a profile based on available RAM and CPU/GPU capability.
