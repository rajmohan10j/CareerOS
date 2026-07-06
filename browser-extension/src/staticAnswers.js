const STATIC_AUTOFILL_INTENTS = new Set([
  "name_prefix",
  "full_name",
  "first_name",
  "middle_name",
  "last_name",
  "email",
  "linkedin_url",
  "portfolio_url",
  "professional_category",
  "referral_source",
  "declaration_confirmation",
  "terms_acknowledgement",
  "pronoun",
]);

const QUICK_COPY_INTENTS = [
  "name_prefix",
  "full_name",
  "first_name",
  "middle_name",
  "last_name",
  "email",
  "phone",
  "address",
  "linkedin_url",
  "portfolio_url",
  "salary_expectation",
  "professional_category",
  "notice_period",
  "work_authorization",
  "legal_eligibility",
  "referral_source",
  "previous_employment",
  "declaration_confirmation",
  "terms_acknowledgement",
  "date_of_birth",
  "citizenship_status",
  "gender",
  "pronoun",
];

function isStaticAutofillCandidate(field) {
  return Boolean(
    field &&
    STATIC_AUTOFILL_INTENTS.has(field.intent) &&
    field.mappingStatus === "available" &&
    field.mappedValue != null &&
    String(field.mappedValue).trim() !== ""
  );
}

function selectStaticAnswers(approvalStore, mappedFields) {
  if (!approvalStore || !mappedFields) return 0;
  let count = 0;
  for (const field of mappedFields) {
    if (isStaticAutofillCandidate(field)) {
      approvalStore.approve(field);
      count += 1;
    }
  }
  return count;
}

function buildQuickCopyText(mappedFields) {
  if (!mappedFields || mappedFields.length === 0) return "";

  const lines = [];
  const seen = new Set();
  for (const intent of QUICK_COPY_INTENTS) {
    const field = mappedFields.find((f) => (
      f.intent === intent &&
      f.mappedValue != null &&
      String(f.mappedValue).trim() !== ""
    ));
    if (!field || seen.has(intent)) continue;
    seen.add(intent);
    lines.push(`${humanizeIntent(intent)}: ${String(field.mappedValue).trim()}`);
  }
  return lines.join("\n");
}

function humanizeIntent(intent) {
  return intent
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export {
  STATIC_AUTOFILL_INTENTS,
  QUICK_COPY_INTENTS,
  isStaticAutofillCandidate,
  selectStaticAnswers,
  buildQuickCopyText,
  humanizeIntent,
};
