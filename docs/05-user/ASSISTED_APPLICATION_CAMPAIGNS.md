# Assisted Application Campaigns

## Purpose

Assisted Application Campaigns prepare a reviewed queue of job applications from jobs already saved in CareerOS. The workflow screens jobs, optionally generates a tailored ATS resume, and creates application records that remain in `review_required` status.

This feature does **not** log into job sites, solve CAPTCHA challenges, upload files, accept declarations, click submit, or claim that an application was submitted.

## Endpoint

`POST /application-campaigns/prepare`

Example request:

```json
{
  "job_ids": [12, 18, 24],
  "resume_id": 3,
  "min_fit_score": 65,
  "tailor_resume": true,
  "create_application_drafts": true
}
```

## Workflow

1. Confirm the source resume exists.
2. Evaluate each saved job against the CareerOS profile, skills, and experience.
3. Skip jobs below the configured fit threshold or jobs explicitly recommended as `skip`.
4. For qualifying jobs, optionally generate an ATS-tailored resume version.
5. Create an application record with status `review_required`.
6. Return a per-job report showing prepared, skipped, and failed items.
7. Open the job page and use the CareerOS browser extension for detect, map, approve, and controlled fill.
8. Review sensitive fields, declarations, attachments, login, and final submission manually.

## Safety Boundary

- Maximum 50 saved jobs per campaign request.
- Every prepared application remains human-reviewed.
- No browser automation is performed by the campaign endpoint.
- No automatic application submission.
- No password, OTP, CAPTCHA, cookie, or credential handling.
- No invented experience, education, skills, or achievements.

## Response Meaning

- `prepared`: The job passed screening and its application draft is ready for review.
- `skipped`: The job did not meet the campaign threshold or was recommended as skip.
- `failed`: CareerOS could not prepare the item; inspect its message.
- `submission_mode`: Always `human_review_required`.
