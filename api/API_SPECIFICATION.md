# API_SPECIFICATION

Document ID: DOC-023  
Version: 0.1.0  
Status: Draft

## Health

`GET /health`

Returns backend status.

## Profile

`GET /profile`  
`PUT /profile`

Manages the Master Candidate Profile.

## Resume

`GET /resumes`  
`POST /resumes`  
`POST /resumes/generate`  
`POST /resumes/optimize`

## Jobs

`GET /jobs`  
`POST /jobs`  
`POST /jobs/evaluate`

## Applications

`GET /applications`  
`POST /applications`  
`PATCH /applications/{id}`

## AI

`GET /ai/providers`  
`POST /ai/generate`  
`POST /ai/embed`

## Plugins

`GET /plugins`  
`POST /plugins/install`  
`POST /plugins/run`

## Security Notes

- No external data transfer unless explicitly enabled.
- All sensitive operations must be auditable.
- Application submission must require user confirmation.
