# SERVICE_ARCHITECTURE

Document ID: DOC-071  
Version: 0.1.0  
Status: Draft  
Milestone: 08A – System Architecture Pack

## Purpose

Defines service-level architecture.

## Initial Services

| Service | Responsibility |
|---|---|
| Profile Service | Master Candidate Profile |
| Resume Service | Resume creation and versioning |
| Job Service | Job storage and evaluation |
| Application Service | Application lifecycle |
| Document Service | File parsing and indexing |
| AI Router Service | Model routing and provider calls |
| Plugin Service | Plugin registration and execution |
| Settings Service | Local configuration |
| Audit Service | Critical action tracking |

## Service Design Rules

- Services should be independent.
- Services should use repositories for persistence.
- Services should be testable without UI.
- Services should not directly call concrete AI models.
