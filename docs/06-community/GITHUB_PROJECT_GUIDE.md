# GITHUB_PROJECT_GUIDE

Document ID: DOC-062  
Version: 0.1.0  
Status: Active

## Purpose

Defines how GitHub will be used for CareerOS collaboration and GitOps tracking.

## GitHub Features

- Issues
- Pull Requests
- Discussions
- Projects
- Releases
- Actions
- Wiki or documentation site

## Recommendation

Use GitHub Projects for roadmap tracking and GitHub Discussions for community support.

## GitOps Role

GitHub should be the collaboration control plane for CareerOS:

- Issues track planned work, bugs, compatibility reports, and release tasks.
- Pull requests track code, documentation, tests, and reviewed reference fixture changes.
- Actions verify all branches and releases.
- Projects track roadmap state.
- Releases publish tagged live-test, preview, and public release artifacts.
- Discussions support questions and community proposals.

## Current Blocker

This local checkout does not yet have a GitHub remote configured. Add the remote before treating GitHub as the active source of truth:

```powershell
git remote add origin <github-repo-url>
git branch -M main
git push -u origin main
```

After pushing, enable branch protection for `main`, require pull requests, and require passing status checks.
