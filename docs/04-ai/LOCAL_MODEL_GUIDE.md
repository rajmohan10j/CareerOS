# LOCAL_MODEL_GUIDE

Document ID: DOC-029  
Version: 0.1.0  
Status: Draft

## Purpose

Defines how CareerOS should run using free and local AI models.

## Default Runtime

- Ollama
- Optional: LM Studio, vLLM, OpenAI-compatible local endpoints

## Low-End Hardware Profile

For 8 GB RAM systems:

- General reasoning: Gemma 3 4B or Qwen 3 small variant
- Coding: Qwen Coder 3B or DeepSeek Coder small variant
- Embeddings: nomic-embed-text
- OCR: PaddleOCR

## Mid-Range Hardware Profile

For 16 GB RAM systems:

- General reasoning: Qwen 3 8B
- Coding: Qwen2.5-Coder 7B
- Vision: Qwen2.5-VL 7B
- Embeddings: nomic-embed-text or bge-m3

## Rule

CareerOS must remain usable without paid LLMs.
