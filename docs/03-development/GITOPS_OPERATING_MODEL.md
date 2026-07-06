# GitOps Operating Model

Document ID: DOC-118
Version: 0.1.0
Status: Active
Milestone: 10C-live-test

## Purpose

CareerOS uses Git, GitHub, and GitHub Actions as the operating source of truth for code, documentation, tests, release manifests, CI checks, and reviewed non-sensitive reference fixtures.

Going forward, project changes should be traceable through Git history, GitHub pull requests, GitHub issues, GitHub Actions, and release artifacts.

## Source Of Truth

Track these in Git/GitHub:

- Application source code
- Tests and fixtures
- Documentation and Markdown operating notes
- GitHub issue, pull request, and workflow configuration
- Release manifests and live-test reports
- Sanitized sample data and reviewed non-sensitive reference data
- Scripts required to verify, start, release, or recover the project

Do not track these in Git/GitHub:

- `.env` files, secrets, API keys, tokens, credentials, or certificates
- Local SQLite databases such as `*.db`
- Python bytecode, caches, virtual environments, node modules, logs, or generated build output
- Private resumes, compensation data, addresses, application answers, or personal application records unless explicitly sanitized and approved for repository storage
- Browser-generated extension copies or temporary release zips

## GitHub Remote

This checkout is connected to:

```powershell
https://github.com/rajmohan10j/CareerOS.git
```

GitHub-backed GitOps becomes fully active after branch protection, required Actions checks, Issues/Projects, and release publishing are configured.

## Branching

- `main`: protected release baseline.
- `codex/*`: AI-assisted implementation branches.
- `feature/*`: human-authored features.
- `fix/*`: bug fixes.
- `docs/*`: documentation-only changes.
- `release/*`: release preparation.

Do not commit directly to `main` after GitHub publication. Use a branch and pull request.

## Change Flow

1. Create or select a GitHub issue for the change.
2. Create a branch from the latest `main`.
3. Implement code, tests, docs, and release notes together.
4. Run local verification:

```powershell
.\scripts\doctor.ps1
.\scripts\verify-all.ps1
.\scripts\release-check.ps1
```

5. Commit with a clear message.
6. Push the branch to GitHub.
7. Open a pull request linked to the issue.
8. Require GitHub Actions to pass before merge.
9. Merge through GitHub after review.
10. Tag releases and publish GitHub Releases only from verified release commits.

## Data Governance

Reference data is allowed in Git only when it is intentionally reviewed and safe to share. For CareerOS, this means:

- Synthetic form samples, sanitized fixtures, and non-sensitive mapping examples can be tracked.
- Real personal data must stay local by default.
- Real application records must be sanitized before they become repository fixtures.
- Any file under `reference-data/` should be treated as sensitive until reviewed.

Use `reference-data/private/` or `*.local.*` for local-only records that must never be committed.

## Release Gates

A release or live-test handoff is not ready until:

- `.\scripts\verify-all.ps1` passes.
- `.\scripts\release-check.ps1` passes.
- `CHANGELOG.md`, `ROADMAP.md`, `EXECUTION/002_CURRENT_STATUS.md`, and `EXECUTION/003_NEXT_TASK.md` are current.
- A release manifest exists under `releases/`.
- GitHub Actions pass on the release branch or release commit once GitHub is configured.

## Known Current Gap

As of 2026-07-06, the GitHub remote is configured and the live-test/GitOps baseline has been pushed to `rajmohan10j/CareerOS`. GitHub-backed tracking still needs branch protection, required Actions checks, Issues/Projects, and release publishing configured before it is fully enforceable.
