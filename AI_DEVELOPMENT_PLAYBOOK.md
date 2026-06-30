# AI_DEVELOPMENT_PLAYBOOK

**Version:** 1.0\
**Status:** Mandatory for all AI development sessions.

## Purpose

This document is the single entry point for every AI coding assistant
used on the CareerOS project.

Supported assistants include:

-   OpenCode
-   Open WebUI
-   ChatGPT
-   Claude Code
-   Future AI coding assistants

------------------------------------------------------------------------

# Read Order

Every AI session must follow this sequence:

1.  README.md
2.  PROJECT_INDEX.md
3.  ENGINEERING_BIBLE/README.md
4.  EXECUTION/000_READ_FIRST.md
5.  EXECUTION/003_NEXT_TASK.md
6.  Relevant Sprint Task
7.  Relevant Architecture Documents
8.  Begin implementation

------------------------------------------------------------------------

# AI Responsibilities

## OpenCode

Primary implementation engine.

Responsibilities:

-   Implement code
-   Refactor
-   Create tests
-   Update documentation
-   Follow Engineering Bible

## Open WebUI

Research and experimentation.

Responsibilities:

-   Compare models
-   Test prompts
-   Validate RAG
-   Prototype workflows

## ChatGPT

Architecture and technical leadership.

Responsibilities:

-   Review designs
-   Improve documentation
-   Validate implementation strategy
-   Resolve complex engineering decisions

------------------------------------------------------------------------

# Mandatory Rules

-   Local-first architecture.
-   Free/open models for core functionality.
-   No mandatory paid APIs.
-   Never fabricate user data.
-   Never auto-submit job applications.
-   Keep business logic in the backend.
-   Update documentation together with code.
-   Add tests for every feature.
-   Record significant architecture changes as ADRs.

------------------------------------------------------------------------

# Definition of Done

A task is complete only if:

-   Code compiles/runs.
-   Tests pass.
-   Documentation is updated.
-   Security implications reviewed.
-   Sprint status updated.
-   NEXT_TASK updated if required.

------------------------------------------------------------------------

# Daily Workflow

1.  Read NEXT_TASK.
2.  Implement one task.
3.  Run tests.
4.  Review output.
5.  Commit.
6.  Update CURRENT_STATUS.
7.  Select next task.

------------------------------------------------------------------------

# Commit Format

-   feat:
-   fix:
-   docs:
-   test:
-   refactor:
-   chore:

------------------------------------------------------------------------

# Success Criteria

The repository should always remain in a buildable, documented, and
testable state.
