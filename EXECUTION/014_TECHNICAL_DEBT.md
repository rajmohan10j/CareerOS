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


## Milestone 09M Follow-up
- Approval state is ephemeral and lost when popup closes. Future milestone may use chrome.storage.session if needed.
- Actual controlled autofill execution is intentionally deferred to the next milestone.
- Diversity/equal opportunity questions are not yet classified as sensitive field intents.
- Low-confidence fields are excluded from Select All Safe but can still be manually approved by the user.
- Skip action currently uses reject+approve clearing behavior. Consider adding a remove() method to approval store.

