# Application Reference Entries

Use one folder per job application, named by application date and job title.

Example:

```text
2026-07-04_senior-director-business-operations-international-business/
```

This keeps form-review data easy to compare against browser-extension detection, desktop profile data, and future form-fill improvements.

## GitOps Boundary

Only sanitized application fixtures should be committed to Git/GitHub. Real application records, employer portal screenshots, private answers, compensation details, addresses, phone numbers, and other personal data should stay local under `reference-data/private/` or use `*.local.*` filenames.
