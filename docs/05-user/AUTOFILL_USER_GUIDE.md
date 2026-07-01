# AUTOFILL_USER_GUIDE

Document ID: DOC-112  
Version: 0.2.0  
Status: Implemented (Milestone 09M)

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
8. Fill form (future milestone).
9. Manually review before submission.

## Approval Rules

- Each field has Approve / Reject / Skip radio toggles.
- Sensitive fields (phone, address, salary, work authorization) have their Approve option disabled — they cannot be auto-selected.
- "Select All Safe" approves only non-sensitive fields with confidence >= 0.6 and available/derived status.
- Approval state is in-memory only — it is not saved when the popup closes.
- No field values are written to the page during approval.

## Rule

CareerOS never submits without approval.
CareerOS never fills a field without explicit user approval.
