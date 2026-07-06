# CareerOS Reference Data

This folder stores reviewed reference entries for job applications, form filling, and future tuning of detection/mapping rules.

Treat everything in this folder as sensitive until reviewed. Sanitized fixtures and non-sensitive examples may be committed to Git/GitHub. Private resumes, compensation data, addresses, application answers, and real application records must stay local unless explicitly sanitized and approved.

## Folder Rule

Every submitted or reviewed application should be stored under:

```text
reference-data/applications/YYYY-MM-DD_job-name-slug/
```

Each application folder should include:

- `raw-entry.md` — the original copied review/application text.
- `application-data.json` — structured data for future import, mapping, and checks.
- `field-map.md` — observed portal fields and how CareerOS should map them.

Do not create duplicate browser-extension release folders for reference data. Use this folder only for human/application reference records.

## Canonical Resume Rule

Use JSON only for resume data going forward. The active resume/reference file is:

```text
reference-data/canonical/Raj-CV.canonical.json
```

When a new resume is provided, save the parsed result as `ResumeName.canonical.json` in `reference-data/canonical/` and point backend/extension flows to that JSON. Do not keep extracted `.txt` resume files as an active source.

When new application fields, answers, mappings, or columns are discovered during browser-extension use, store them in the JSON `knowledge_bank` section so they can be reused as the reference knowledge bank next time.

## Static Answers

Use `static-answer-bank.md` and `static-answer-bank.json` for repeated application answers such as referral source, legal eligibility, notice period, declaration answers, LinkedIn URL, and portfolio URL. Save the same values in the Desktop Profile when you want the browser extension to map/fill them.

## GitOps Rule

Track only reviewed, non-sensitive reference data in Git.

Keep local-only records in:

```text
reference-data/private/
```

or use filenames matching:

```text
*.local.*
```

Before committing reference data, remove or replace personal identifiers, addresses, phone numbers, compensation data, private employer/application details, and any secrets or tokens.

## Privacy

These files may contain personal information, compensation data, addresses, and application answers. Keep them local unless explicitly sanitized and approved for repository storage.
