# MODEL_PROVIDER_INTERFACE

Document ID: DOC-095  
Version: 0.1.0  
Status: Draft  
Milestone: 08C

## Purpose

Defines common AI provider interface.

## Interface Methods

- `generate(task_type, prompt, options)`
- `embed(texts, options)`
- `rerank(query, documents, options)`
- `vision(image, prompt, options)`
- `transcribe(audio, options)`
- `health_check()`

## Initial Provider

Ollama

## Rule

Business logic must not depend on concrete provider implementation.
