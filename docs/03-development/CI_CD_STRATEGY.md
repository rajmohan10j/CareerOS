# CI_CD_STRATEGY

Document ID: DOC-060  
Version: 0.1.0  
Status: Active

## Purpose

Defines CI/CD approach for CareerOS. CI/CD is part of the GitOps operating model and should run through GitHub Actions once the GitHub remote is configured.

## CI Scope

- Run backend tests
- Run browser-extension tests
- Run desktop tests
- Run security checks
- Run release readiness checks
- Protect release branches and tags

## GitHub Actions

Current workflow files:

- backend-tests.yml
- ci.yml
- desktop-tests.yml
- docs.yml
- documentation.yml
- extension-tests.yml
- lint.yml
- release-check.yml
- release.yml
- security.yml
- tests.yml

## GitOps Rule

GitHub Actions must pass before release branches are merged or tagged. Until a GitHub remote is configured, local scripts remain the release gate:

```powershell
.\scripts\doctor.ps1
.\scripts\verify-all.ps1
.\scripts\release-check.ps1
```
