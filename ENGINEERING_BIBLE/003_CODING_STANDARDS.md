# Coding Standards

Document ID: EB-003  
Version: 0.1.0  
Status: Draft

## General Rules

- Write readable code before clever code.
- Keep functions small and testable.
- Use explicit names.
- Avoid hidden side effects.
- Validate inputs.
- Log meaningful events.
- Keep AI calls behind provider abstractions.

## Python Backend

- Use FastAPI.
- Use Pydantic models.
- Keep route handlers thin.
- Put business logic in services.
- Put persistence logic in repositories.
