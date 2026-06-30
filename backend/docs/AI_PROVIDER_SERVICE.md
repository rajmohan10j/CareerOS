# AI_PROVIDER_SERVICE

Document ID: DOC-039  
Version: 0.1.0  
Status: Draft

## Purpose

Defines backend abstraction for AI model providers.

## Provider Interface

- generate()
- embed()
- rerank()
- vision()
- transcribe()
- health_check()

## Initial Provider

Ollama

## Future Providers

- LM Studio
- vLLM
- OpenAI-compatible local APIs
- Optional commercial APIs

## Rule

No commercial provider may be required for core functionality.
