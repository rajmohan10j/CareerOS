# BACKEND_SEQUENCE_DIAGRAMS

Document ID: DOC-086  
Version: 0.1.0  
Status: Draft  
Milestone: 08B

## Resume Generation Sequence

```text
Client
  ↓ POST /resumes/generate
API Route
  ↓
Resume Service
  ↓
Profile Repository
  ↓
Job Repository
  ↓
AI Router Service
  ↓
Ollama Provider
  ↓
Resume Service
  ↓
Resume Repository
  ↓
Client
```

## Job Evaluation Sequence

```text
Client
  ↓ POST /jobs/evaluate
Job API
  ↓
Job Service
  ↓
RAG Service
  ↓
AI Router
  ↓
Evaluation Result
  ↓
Application Tracker
```
