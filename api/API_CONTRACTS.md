# API_CONTRACTS

Document ID: DOC-081  
Version: 0.1.0  
Status: Draft  
Milestone: 08B

## Purpose

Defines initial API contracts for CareerOS.

## Health

### GET /health

Response:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "mode": "local"
}
```

## Profile

### GET /profile

Returns Master Candidate Profile.

### PUT /profile

Updates profile after validation.

## Resumes

### POST /resumes/generate

Input:

```json
{
  "profile_id": "string",
  "job_id": "string",
  "target_role": "string",
  "format": "markdown"
}
```

## Jobs

### POST /jobs/evaluate

Input:

```json
{
  "job_url": "string",
  "job_description": "string"
}
```

## Applications

### PATCH /applications/{id}

Updates application status.

## AI

### POST /ai/generate

Routes generation task through configured AI provider.
