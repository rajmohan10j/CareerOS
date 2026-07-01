# EXTENSION_FIELD_DETECTION

Document ID: DOC-106  
Version: 0.2.0  
Status: Implemented  
Milestone: 09O

## Purpose

Defines how the browser extension detects form fields.

## Signals

- input name
- input id
- label text
- placeholder
- aria-label
- nearby text
- form section headings
- select options

## Output

A normalized field map (implemented in `src/fieldDetector.js` + `src/fieldClassifier.js`):

```json
{
  "tagName": "input",
  "fieldType": "text",
  "inputType": "email",
  "name": "email",
  "id": "user-email",
  "placeholder": "you@example.com",
  "ariaLabel": null,
  "label": "Email Address",
  "nearbyText": null,
  "sectionHeading": "Contact Information",
  "required": true,
  "readOnly": false,
  "disabled": false,
  "options": null,
  "position": { "top": 120, "left": 30, "width": 300, "height": 40 },
  "radios": null,
  "intent": "email",
  "confidence": 1.0,
  "sensitive": false
}
```

## Classified Field Types (22)

`full_name`, `first_name`, `last_name`, `email`, `phone`, `address`, `city`,
`state`, `country`, `postal_code`, `current_company`, `current_title`,
`education`, `experience`, `skills`, `resume_upload`, `cover_letter`,
`salary_expectation`, `work_authorization`, `notice_period`, `diversity`,
`equal_opportunity`, `unknown`

## Sensitive Fields

- phone
- address
- salary_expectation
- work_authorization
- diversity
- equal_opportunity

## Rule

Low-confidence mappings (confidence < 0.6) must require user confirmation before any future autofill action.
