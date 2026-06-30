# CORE_PLATFORM_ARCHITECTURE

Document ID: DOC-026  
Version: 0.1.0  
Status: Draft

## Purpose

Defines the core platform architecture for CareerOS.

## Platform Components

```text
CareerOS Core
├── API Layer
├── Service Layer
├── Data Layer
├── AI Provider Layer
├── Plugin Runtime
├── Audit Layer
└── Client Connectors
```

## Core Principle

The backend owns business logic. Desktop, mobile, web, and browser clients should remain lightweight.

## Mandatory Constraints

- Must run locally.
- Must work with free/open-source models.
- Must not require cloud subscriptions.
- Must support future plugin extension.
- Must be testable from day one.
