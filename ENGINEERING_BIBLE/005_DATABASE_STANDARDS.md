# Database Standards

Document ID: EB-005  
Version: 0.1.0  
Status: Draft

## Default Database

SQLite is the default local database.

## Future Database

PostgreSQL may be supported for multi-user or self-hosted deployments.

## Rules

- Every schema change requires migration.
- User data must be exportable.
- Sensitive data should be minimized.
- Audit-sensitive events must be tracked.
