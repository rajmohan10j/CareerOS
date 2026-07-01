# Technical Debt

Capture shortcuts and future improvements.

## Milestone 09G Follow-up
- Document Intelligence currently does not handle job-description text ingestion directly. Future milestone should add JD ingestion from pasted text, uploaded files, and browser extension extraction.
- Job fit_score is stored as integer in SQLite and returned as float in API. This is acceptable while scores are whole-number 0–100 values. Revisit if fractional scoring is introduced.

