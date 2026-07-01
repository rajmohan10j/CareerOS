# GitHub Publication Guide

Document ID: DOC-079  
Version: 0.1.0  
Status: Implemented (Milestone 10B – GitHub Repository Publication Prep)

## Purpose

Guide the CareerOS team through publishing the repository on GitHub as a public open-source project.

## Pre-Publication Checklist

### Repository Settings

- [ ] Repository visibility set to **Public**
- [ ] Repository description set (256 chars max)
- [ ] Repository website URL set (if applicable)
- [ ] Topics/tags configured:
  - `career-management`
  - `fastapi`
  - `browser-extension`
  - `ats`
  - `resume`
  - `job-search`
  - `python`
  - `javascript`
  - `manifest-v3`

### Branch Protection

- [ ] `main` branch protected
- [ ] Require pull request reviews before merging
- [ ] Require status checks to pass (all CI workflows)
- [ ] Require up-to-date branches
- [ ] Do not allow bypassing protections

### Repository Files

- [ ] `README.md` — project description, quick start, badges, links
- [ ] `CONTRIBUTING.md` — how to contribute
- [ ] `CODE_OF_CONDUCT.md` — contributor covenant
- [ ] `SECURITY.md` — vulnerability reporting
- [ ] `LICENSE` — MIT license text
- [ ] `.gitignore` — covers generated files
- [ ] `.github/CODEOWNERS` — ownership assignments
- [ ] `.github/ISSUE_TEMPLATE/` — 5 issue templates
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` — PR template
- [ ] `.github/DISCUSSION_TEMPLATE.md` — discussion template
- [ ] `.github/workflows/` — 5 CI workflows

### Community Health

- [ ] Issue labels configured (bug, enhancement, documentation, security, compatibility, good first issue, help wanted)
- [ ] Discussion categories enabled (Q&A, Ideas, Show and tell)
- [ ] Projects tab configured (optional)
- [ ] Wiki enabled (optional)

## Publication Steps

1. Create a new GitHub repository with the desired name
2. Push the local repository to the remote
3. Configure repository settings as described above
4. Enable and configure GitHub Pages (optional)
5. Verify all CI workflows run on push
6. Verify issue and PR templates appear correctly
7. Test a fresh clone + quick start workflow

## Post-Publication

- [ ] Announce the repository on relevant channels
- [ ] Monitor first issues and PRs
- [ ] Update `PUBLIC_RELEASE_READINESS.md`
- [ ] Update `EXECUTION/003_NEXT_TASK.md`

## Related Documents

- `GITHUB_RELEASE_CHECKLIST.md` — release checklist
- `PUBLIC_RELEASE_READINESS.md` — readiness assessment
- `CONTRIBUTOR_ONBOARDING.md` — contributor guide
- `FIRST_GOOD_ISSUES.md` — starter tasks
