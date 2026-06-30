# ERROR_HANDLING

Document ID: DOC-079  
Version: 0.1.0  
Status: Draft  
Milestone: 08B

## Purpose

Defines consistent backend error handling.

## Error Response Shape

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found.",
    "details": {}
  }
}
```

## Error Categories

- validation_error
- authentication_error
- authorization_error
- not_found
- conflict
- ai_provider_error
- plugin_error
- database_error
- internal_error

## Rule

Do not expose secrets, stack traces, or private file paths in user-facing errors.
