# Technical Debt

Capture shortcuts and future improvements.

## Milestone 09G Follow-up
- Document Intelligence currently does not handle job-description text ingestion directly. Future milestone should add JD ingestion from pasted text, uploaded files, and browser extension extraction.
- Job fit_score is stored as integer in SQLite and returned as float in API. This is acceptable while scores are whole-number 0–100 values. Revisit if fractional scoring is introduced.

## Milestone 09I Follow-up
- ATS keyword matching is exact/case-insensitive only. Synonym detection or fuzzy matching not implemented.
- ATS formatting analysis is heuristic-based (tables, images, section headers, line length, non-ASCII). More sophisticated ATS parsing engines may detect additional issues.


## Milestone 09K Follow-up
- No DOM-based integration tests yet. Add jsdom or browser test runner later.
- Confidence scoring is heuristic-based and should be refined after real-world form testing.
- Some unusual form layouts may produce false positives.
- Field label matching currently supports English patterns only. Add i18n later.

