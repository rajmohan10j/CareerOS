# CONFIGURATION

Document ID: DOC-078  
Version: 0.1.0  
Status: Draft  
Milestone: 08B

## Purpose

Defines local backend configuration.

## Configuration Sources

1. Default config
2. Local config file
3. Environment variables
4. Runtime settings UI

## Example

```yaml
app:
  mode: local
  host: 127.0.0.1
  port: 8765

database:
  provider: sqlite
  path: ./data/careeros.db

ai:
  provider: ollama
  base_url: http://localhost:11434
  reasoning_model: gemma3:4b
  embedding_model: nomic-embed-text

security:
  telemetry: false
  require_user_confirmation: true
```

## Rule

No paid provider should be configured by default.
