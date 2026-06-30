# Repository Structure Standards

Document ID: EB-002  
Version: 0.1.0  
Status: Draft

## Top-Level Structure

```text
CareerOS/
├── backend/
├── frontend/
├── desktop/
├── mobile/
├── browser-extension/
├── plugins/
├── api/
├── database/
├── modules/
├── agents/
├── prompts/
├── tests/
├── docs/
├── adr/
├── EXECUTION/
└── ENGINEERING_BIBLE/
```

## Rule

Core business logic belongs in shared backend services. Client applications should not duplicate business logic.
