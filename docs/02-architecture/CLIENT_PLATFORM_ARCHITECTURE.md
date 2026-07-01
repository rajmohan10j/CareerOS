# CLIENT_PLATFORM_ARCHITECTURE

Document ID: DOC-102  
Version: 0.2.0  
Status: Implemented (Milestone 09P – Desktop App Shell)

## Purpose

Defines the shared client platform architecture across desktop, mobile, web, and browser extension.

## Client Principle

CareerOS clients are interfaces to the shared platform. They should not own core business logic.

## Client Types

- Desktop app: primary local productivity interface.
- Mobile app: companion workflow and alerts.
- Web app: local/self-hosted browser interface.
- Browser extension: job extraction and autofill assistant.

## Shared Requirements

- Connect to CareerOS backend.
- Respect local-first privacy.
- Provide clear AI/model status.
- Require approval for critical actions.
- Support accessibility and responsive UI.
