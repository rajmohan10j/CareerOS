const SENSITIVE_TYPES = new Set([
  "phone",
  "address",
  "salary_expectation",
  "work_authorization",
]);

const FIELD_PATTERNS = [
  { type: "full_name", patterns: [/full\s*name/i, /legal\s*name/i, /your\s*name/i, /applicant\s*name/i], not: [/first/i, /last/i] },
  { type: "first_name", patterns: [/first\s*name/i, /given\s*name/i, /first/i], not: [/last/i, /full/i] },
  { type: "last_name", patterns: [/last\s*name/i, /family\s*name/i, /surname/i], not: [/first/i, /full/i] },
  { type: "email", patterns: [/e[\s-]?mail/i, /email address/i, /\bemail\b/i], not: [/confirm/i, /alternate/i] },
  { type: "phone", patterns: [/phone/i, /mobile/i, /cell/i, /telephone/i, /contact\s*number/i], not: [] },
  { type: "address", patterns: [/address/i, /street/i, /mailing/i, /location/i], not: [/email/i, /ip\s*address/i] },
  { type: "city", patterns: [/city/i, /town/i, /municipality/i], not: [] },
  { type: "state", patterns: [/state/i, /province/i, /region/i, /prefecture/i], not: [/united/i, /country/i] },
  { type: "country", patterns: [/country/i, /nation/i, /nationality/i], not: [] },
  { type: "postal_code", patterns: [/zip/i, /postal/i, /post\s*code/i, /\bpin\b/i], not: [] },
  { type: "current_company", patterns: [/current\s*compan/i, /employer/i, /company/i, /\borganization\b/i], not: [] },
  { type: "current_title", patterns: [/current\s*(title|position|role)/i, /\b(title|position|role)\b/i, /job\s*title/i], not: [/apply/i] },
  { type: "education", patterns: [/education/i, /degree/i, /school/i, /university/i, /college/i, /academic/i], not: [/email/i] },
  { type: "experience", patterns: [/experience/i, /work\s*history/i, /employment/i, /work\s*experience/i], not: [] },
  { type: "skills", patterns: [/skills/i, /expertise/i, /technolog/i, /proficiency/i, /competenc/i], not: [] },
  { type: "resume_upload", patterns: [/resume/i, /\bcv\b/i, /upload.*resume/i, /attach.*resume/i], not: [] },
  { type: "cover_letter", patterns: [/cover\s*letter/i, /coverletter/i], not: [] },
  { type: "salary_expectation", patterns: [/salary/i, /compensation/i, /\bpay\b/i, /expected.*salary/i, /desired.*salary/i], not: [] },
  { type: "work_authorization", patterns: [/authorization/i, /\bvisa\b/i, /work\s*permit/i, /sponsor/i, /work\s*author/i, /citizenship/, /eligible.*work/i], not: [] },
  { type: "notice_period", patterns: [/notice\s*period/i, /available.*start/i, /start.*date/i, /earliest.*start/i, /notice\s*time/i], not: [] },
];

function classifyField(field) {
  const signals = [
    field.label,
    field.placeholder,
    field.ariaLabel,
    field.name,
    field.id,
    field.sectionHeading,
    field.nearbyText,
  ]
    .filter(Boolean)
    .map((s) => s.trim());

  if (signals.length === 0) {
    return { intent: "unknown", confidence: 0.1 };
  }

  const combined = signals.join(" ");

  if (field.inputType === "file" && /resume|cv/i.test(combined)) {
    return { intent: "resume_upload", confidence: 1.0 };
  }

  if (field.inputType === "file") {
    return { intent: "resume_upload", confidence: 0.6 };
  }

  if (field.fieldType === "textarea" && /cover|letter/i.test(combined)) {
    return { intent: "cover_letter", confidence: 1.0 };
  }

  if (field.fieldType === "textarea" && /experience|employment|work.*history/i.test(combined)) {
    return { intent: "experience", confidence: 0.9 };
  }

  if (field.fieldType === "textarea") {
    return { intent: "cover_letter", confidence: 0.3 };
  }

  if (field.inputType === "tel") {
    return { intent: "phone", confidence: 1.0 };
  }

  if (field.inputType === "email") {
    const hasConfirm = /confirm|alternate/i.test(combined);
    return { intent: "email", confidence: hasConfirm ? 0.6 : 1.0 };
  }

  if (field.inputType === "url") {
    return { intent: "unknown", confidence: 0.3 };
  }

  if (field.inputType === "number" && /salary|compensation|pay/i.test(combined)) {
    return { intent: "salary_expectation", confidence: 1.0 };
  }

  if (field.inputType === "number") {
    return { intent: "unknown", confidence: 0.3 };
  }

  if (field.fieldType === "select") {
    const opts = field.options || [];
    const optTexts = opts.map((o) => o.text.toLowerCase()).join(" ");
    const optVals = opts.map((o) => o.value.toLowerCase()).join(" ");
    if (/country|nation/i.test(combined) || /^[A-Z]{2}$/.test(opts.map(o => o.value).filter(Boolean).join(" "))) {
      return { intent: "country", confidence: 1.0 };
    }
    if (/state|province|region/i.test(combined) || /state|province|region/i.test(optTexts + " " + optVals)) {
      return { intent: "state", confidence: 0.9 };
    }
    if (/country|nation/i.test(optTexts + " " + optVals)) {
      return { intent: "country", confidence: 0.8 };
    }
  }

  let best = { intent: "unknown", confidence: 0.1 };
  const combinedLower = combined.toLowerCase();

  for (const fp of FIELD_PATTERNS) {
    let score = 0;
    let matched = false;

    for (const p of fp.patterns) {
      if (p.test(combined)) {
        matched = true;
        score += 0.4;
        break;
      }
    }

    if (!matched) continue;

    const notMatched = fp.not.some((p) => p.test(combined));
    if (notMatched) {
      score -= 0.3;
      if (score <= 0) continue;
    }

    const fieldTypeScore = field.inputType === "email" && fp.type === "email" ? 0.3
      : field.inputType === "tel" && fp.type === "phone" ? 0.3
        : 0;

    score += fieldTypeScore;

    const sourceBonus = field.label ? 0.3 : field.placeholder ? 0.2 : field.ariaLabel ? 0.2 : field.name ? 0.1 : 0;
    score += sourceBonus;

    const sourceCount = [field.label, field.placeholder, field.ariaLabel, field.name, field.id, field.sectionHeading].filter(Boolean).length;
    score += Math.min((sourceCount - 1) * 0.1, 0.3);

    const textLen = combined.length;
    if (textLen > 3 && textLen < 80) score += 0.05;

    const finalScore = Math.min(Math.max(score, 0.1), 1.0);
    if (finalScore > best.confidence) {
      best = { intent: fp.type, confidence: Math.round(finalScore * 100) / 100 };
    }
  }

  return best;
}

function classifyFields(fields) {
  return fields.map((f) => {
    const classification = classifyField(f);
    return {
      ...f,
      intent: classification.intent,
      confidence: classification.confidence,
      sensitive: SENSITIVE_TYPES.has(classification.intent),
    };
  });
}

export { classifyField, classifyFields, SENSITIVE_TYPES, FIELD_PATTERNS };
