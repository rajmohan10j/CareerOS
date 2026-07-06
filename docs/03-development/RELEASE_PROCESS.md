# RELEASE_PROCESS

Document ID: DOC-061  
Version: 0.1.0  
Status: Active

## Release Stages

1. Blueprint
2. Developer Preview
3. Alpha
4. Beta
5. Release Candidate
6. Stable
7. Hotfix

## Requirements Before Release

- Changelog updated
- Tests pass
- Documentation updated
- Security checklist completed
- Version manifest updated
- Release manifest created under `releases/`
- `.\scripts\verify-all.ps1` passes
- `.\scripts\release-check.ps1` passes
- GitHub Actions pass on the release branch or release tag once the GitHub remote is configured
- GitHub Release is published from a verified tag for public releases

## GitOps Release Flow

1. Create or select the release issue.
2. Create a `release/*` branch.
3. Update source, docs, tests, changelog, roadmap, execution status, and release manifest together.
4. Run local verification.
5. Push to GitHub when the remote is configured.
6. Open a pull request and wait for GitHub Actions.
7. Merge through GitHub after review.
8. Tag the verified commit.
9. Publish the GitHub Release with notes and approved artifacts.

Do not publish local databases, secrets, generated caches, private resumes, private application records, or unsanitized reference data as release artifacts.
