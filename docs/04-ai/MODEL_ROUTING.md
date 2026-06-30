# MODEL_ROUTING

Document ID: DOC-030  
Version: 0.1.0  
Status: Draft

## Purpose

Defines how CareerOS routes AI tasks to models.

## Routing Rules

| Task | Preferred Model Type |
|---|---|
| Resume writing | General reasoning LLM |
| Code generation | Coding LLM |
| Job matching | Reasoning LLM + embeddings |
| Document search | Embedding model |
| PDF/image parsing | OCR + vision model |
| Interview feedback | Reasoning LLM |
| Form autofill | Reasoning LLM + browser DOM context |

## Provider Abstraction

Do not call model names directly in business logic. Use:

`AIProvider.generate(task_type, input, config)`

## Fallback Rule

If a specialized model is unavailable, disable only that feature and keep the rest of the system running.
