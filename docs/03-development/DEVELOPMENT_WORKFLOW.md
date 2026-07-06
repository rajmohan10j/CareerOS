# DEVELOPMENT_WORKFLOW

Document ID: DOC-116  
Version: 0.1.0  
Status: Active
Milestone: 08E – Engineering Operations Pack

## Purpose

Defines the standard development workflow for CareerOS. This workflow is now GitOps-based: source changes, documentation changes, tests, release manifests, and reviewed non-sensitive fixtures should be tracked through Git and GitHub.

## Workflow

1. Read current task and related GitHub issue when available.
2. Read relevant architecture/specification files.
3. Confirm dependencies and local environment.
4. Create or use a branch for the change.
5. Implement the smallest useful increment.
6. Add or update tests.
7. Update documentation and release/status notes.
8. Run checks.
9. Commit with a clear message.
10. Push the branch to GitHub when a remote is configured.
11. Open or update the pull request.
12. Update execution status after verification.

## Rule

No implementation task is complete without tests and documentation.

No live-test or release task is complete without an updated release manifest and passing verification gates.

See `docs/03-development/GITOPS_OPERATING_MODEL.md` for the full GitOps operating model.
