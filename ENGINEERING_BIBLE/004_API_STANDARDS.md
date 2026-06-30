# API Standards

Document ID: EB-004  
Version: 0.1.0  
Status: Draft

## API Style

- REST first.
- JSON request and response bodies.
- OpenAPI documentation required.
- Stable endpoint naming.
- Versioned APIs when breaking changes occur.

## Naming

Use plural resources:

- `/profiles`
- `/resumes`
- `/jobs`
- `/applications`
- `/documents`
- `/plugins`

## Error Format

All API errors should use a consistent structure:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```
