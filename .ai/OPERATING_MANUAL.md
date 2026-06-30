# OPERATING_MANUAL.md

> CareerOS Blueprint v0.1
>
> Document ID: DOC-008
> Version: 0.1.0
> Status: Draft

# CareerOS Operating Manual

## Purpose

This manual defines the operational standards for developing, reviewing, documenting, testing, and releasing CareerOS.

## Development Workflow

1. Idea
2. Requirement
3. Architecture Review
4. ADR (if required)
5. Implementation
6. Testing
7. Documentation
8. Code Review
9. Merge
10. Release

## Mandatory Rules

- Documentation precedes implementation.
- All major decisions require traceability.
- Every feature requires tests.
- Every feature requires documentation.
- Human approval is required before merging significant changes.

## AI Agent Responsibilities

AI agents may:
- Generate code
- Draft documentation
- Create tests
- Suggest refactoring
- Analyze architecture

AI agents must not:
- Bypass governance
- Merge changes
- Modify security-critical components without review

## Repository Standards

- Use semantic versioning.
- Follow coding standards.
- Keep modules independent.
- Maintain backward compatibility where practical.

## Release Process

- Draft
- Alpha
- Beta
- Release Candidate
- Stable
- Long-Term Support (future)

## Continuous Improvement

The Operating Manual is a living document and will evolve as the project grows.

## Revision History

| Version | Date | Description |
|---|---|---|
|0.1.0|2026-06-30|Initial draft|
