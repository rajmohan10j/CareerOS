# AI_PLATFORM_ARCHITECTURE

Document ID: DOC-087  
Version: 0.1.0  
Status: Draft  
Milestone: 08C – AI Platform Pack

## Purpose

Defines the AI platform architecture for CareerOS.

## AI Platform Goals

- Work with free/local models by default.
- Support optional commercial providers only as plug-ins.
- Keep model usage abstracted behind provider interfaces.
- Enable task-based model routing.
- Support graceful degradation on low-end hardware.

## Layers

```text
AI Task Request
  ↓
AI Router Service
  ↓
Task Classifier
  ↓
Provider Selection
  ↓
Model Execution
  ↓
Output Validator
  ↓
Audit Log
  ↓
Calling Service
```

## Core Services

- AI Router
- AI Provider Registry
- Prompt Manager
- Embedding Service
- RAG Service
- Output Validator
- Model Health Checker
- AI Audit Logger

## Mandatory Rule

No CareerOS core feature may require a paid LLM provider.
