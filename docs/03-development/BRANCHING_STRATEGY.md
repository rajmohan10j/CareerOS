# BRANCHING_STRATEGY

Document ID: DOC-117  
Version: 0.1.0  
Status: Active
Milestone: 08E

## Branches

- `main`: stable baseline
- `develop`: active development
- `codex/*`: AI-assisted implementation branches
- `feature/*`: new features
- `fix/*`: fixes
- `docs/*`: documentation work
- `release/*`: release preparation

## Rule

Direct commits to `main` should be avoided after GitHub publication.

After the GitHub remote is configured, `main` should be protected and updated through pull requests with passing GitHub Actions checks.
