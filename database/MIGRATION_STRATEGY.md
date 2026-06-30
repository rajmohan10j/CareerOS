# MIGRATION_STRATEGY

Document ID: DOC-083  
Version: 0.1.0  
Status: Draft  
Milestone: 08B

## Purpose

Defines database migration strategy.

## Initial Tool

Alembic, if SQLAlchemy is selected.

## Rules

- Every schema change requires a migration.
- Migrations must be reversible where practical.
- Migration files must not contain private data.
- Startup should verify database version.
- Backups should be recommended before destructive migrations.

## Initial Migration

Create tables:

- users
- profiles
- experiences
- skills
- resumes
- jobs
- applications
- documents
- ai_runs
- audit_events
