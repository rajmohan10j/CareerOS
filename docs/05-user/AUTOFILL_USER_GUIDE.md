# AUTOFILL_USER_GUIDE

Document ID: DOC-112  
Version: 0.3.0  
Status: Implemented (Milestone 09N)

## Purpose

Explains how users safely use Universal Autofill.

## User Flow

1. Open job application form.
2. Open CareerOS extension.
3. Detect fields.
4. Review proposed mappings.
5. Approve or reject each field mapping.
6. Use "Select All Safe" to auto-approve non-sensitive, high-confidence fields.
7. Review approval summary (approved / rejected / pending counts).
8. Click "Fill Approved Fields" to execute autofill.
9. Review fill results (filled / skipped / failed counts).
10. Manually review filled fields before submission.

## Approval Rules

- Each field has Approve / Reject / Skip radio toggles.
- Sensitive fields (phone, address, salary, work authorization) have their Approve option disabled — they cannot be auto-selected.
- "Select All Safe" approves only non-sensitive fields with confidence >= 0.6 and available/derived status.
- Approval state is in-memory only — it is not saved when the popup closes.
- No field values are written to the page during approval.

## Fill Rules

- Only explicitly approved fields with non-null/non-empty values are filled.
- File upload, password, hidden, disabled, readonly, submit, button, reset, image, radio, and checkbox fields are never filled.
- The "Fill Approved Fields" button is disabled until at least one field is approved.
- Fill results show filled / skipped (with reason) / failed counts with per-field detail.
- Successfully filled fields are highlighted with a green outline for 2 seconds.
- Fill state is not persisted — each popup session requires fresh approval.

## Rules

- CareerOS never submits a form or clicks a button.
- CareerOS never fills a field without explicit user approval.
- CareerOS never fills password, hidden, or file fields.
- CareerOS never stores fill data or field values outside the browser.
