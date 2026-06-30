# CLIENT_ARCHITECTURE

Document ID: DOC-052  
Version: 0.1.0  
Status: Draft

## Purpose

Defines how desktop, mobile, web, and browser clients interact with the CareerOS platform.

## Client Strategy

```text
Shared Backend
  ├── Desktop Client
  ├── Mobile Client
  ├── Web Client
  └── Browser Extension
```

## Rule

Clients should avoid duplicating core business logic. Shared logic belongs in backend services.
