# EXTENSION_FIELD_DETECTION

Document ID: DOC-106  
Version: 0.1.0  
Status: Draft  
Milestone: 08D

## Purpose

Defines how the browser extension detects form fields.

## Signals

- input name
- input id
- label text
- placeholder
- aria-label
- nearby text
- form section headings
- select options

## Output

A normalized field map:

```json
{
  "field_id": "string",
  "field_type": "email",
  "confidence": 0.92,
  "source_signals": ["label", "placeholder"]
}
```

## Rule

Low-confidence mappings must require user confirmation.
