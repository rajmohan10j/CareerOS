# DATA_FLOW

Document ID: DOC-074  
Version: 0.1.0  
Status: Draft  
Milestone: 08A – System Architecture Pack

## Resume Generation Flow

```text
Master Candidate Profile
  ↓
Target Job Description
  ↓
Resume Service
  ↓
AI Router
  ↓
Local Model
  ↓
Resume Draft
  ↓
User Review
  ↓
Saved Resume Version
```

## Autofill Flow

```text
Browser Extension
  ↓
DOM Field Detection
  ↓
Autofill Agent
  ↓
Profile Mapping
  ↓
User Confirmation
  ↓
Field Fill
```

## Job Evaluation Flow

```text
Job URL / JD Text
  ↓
Job Service
  ↓
RAG Retrieval
  ↓
AI Evaluation
  ↓
Score + Report
  ↓
Application Tracker
```
