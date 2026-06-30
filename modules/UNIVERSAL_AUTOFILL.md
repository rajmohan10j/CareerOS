# UNIVERSAL_AUTOFILL

Document ID: DOC-048  
Version: 0.1.0  
Status: Draft

## Purpose

Universal Autofill maps job application forms to the Master Candidate Profile.

## Supported Field Types

- Name
- Email
- Phone
- Address
- Education
- Work experience
- Skills
- Resume upload
- Cover letter
- Salary expectation
- Work authorization
- Notice period

## Process

```text
Read DOM
  ↓
Detect fields
  ↓
Classify field intent
  ↓
Map to profile data
  ↓
Ask user for confirmation
  ↓
Fill selected fields
```

## Absolute Rule

CareerOS must never click Submit/Apply without explicit user approval.
