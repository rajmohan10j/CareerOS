const SENSITIVE_TYPES = new Set([
  "phone",
  "address",
  "salary_expectation",
  "work_authorization",
  "legal_eligibility",
  "diversity",
  "equal_opportunity",
  "date_of_birth",
  "citizenship_status",
  "gender",
]);

const FIELD_PATTERNS = [
  { type: "name_prefix", patterns: [/^prefix$/i, /name\s*prefix/i, /salutation/i, /\btitle\b/i], not: [/job/i, /current/i, /position/i] },
  { type: "full_name", patterns: [/full\s*name/i, /legal\s*name/i, /your\s*name/i, /applicant\s*name/i], not: [/first/i, /last/i] },
  { type: "first_name", patterns: [/first\s*name/i, /given\s*name/i, /first/i], not: [/last/i, /full/i] },
  { type: "middle_name", patterns: [/middle\s*name/i, /\bmiddle\b/i], not: [/first/i, /last/i, /full/i] },
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
  { type: "experience_title", patterns: [/job\s*title/i, /position\s*title/i], not: [] },
  { type: "experience_company", patterns: [/\bcompany\b/i, /employer/i], not: [] },
  { type: "experience_location", patterns: [/\blocation\b/i, /work\s*location/i], not: [] },
  { type: "experience_current", patterns: [/currently\s*work\s*here/i, /current\s*role/i], not: [] },
  { type: "experience_start_date", patterns: [/\bfrom\b/i, /start\s*date/i], not: [] },
  { type: "experience_end_date", patterns: [/\bto\b/i, /end\s*date/i], not: [] },
  { type: "experience_description", patterns: [/role\s*description/i, /responsibilities/i], not: [] },
  { type: "education_school", patterns: [/school\s*or\s*university/i, /\bschool\b/i, /\buniversity\b/i], not: [] },
  { type: "education_degree", patterns: [/\bdegree\b/i], not: [] },
  { type: "education_field", patterns: [/field\s*of\s*study/i], not: [] },
  { type: "education_gpa", patterns: [/overall\s*result|gpa/i], not: [] },
  { type: "education_start_date", patterns: [/\bfrom\b/i], not: [] },
  { type: "education_end_date", patterns: [/\bto\b|actual\s*or\s*expected/i], not: [] },
  { type: "education", patterns: [/education/i, /degree/i, /school/i, /university/i, /college/i, /academic/i], not: [/email/i] },
  { type: "experience", patterns: [/experience/i, /work\s*history/i, /employment/i, /work\s*experience/i], not: [] },
  { type: "skills", patterns: [/skills/i, /expertise/i, /technolog/i, /proficiency/i, /competenc/i], not: [] },
  { type: "linkedin_url", patterns: [/linkedin/i, /linked\s*in/i], not: [] },
  { type: "portfolio_url", patterns: [/portfolio/i, /project.*link/i, /blog.*link/i, /github/i, /website/i, /personal\s*site/i], not: [] },
  { type: "resume_upload", patterns: [/resume/i, /\bcv\b/i, /upload.*resume/i, /attach.*resume/i], not: [] },
  { type: "cover_letter", patterns: [/cover\s*letter/i, /coverletter/i], not: [] },
  { type: "salary_expectation", patterns: [/salary/i, /compensation/i, /\bpay\b/i, /expected.*salary/i, /desired.*salary/i], not: [] },
  { type: "work_authorization", patterns: [/authorization/i, /\bvisa\b/i, /work\s*permit/i, /sponsor/i, /work\s*author/i, /citizenship/, /eligible.*work/i], not: [] },
  { type: "legal_eligibility", patterns: [/legally.*eligible/i, /eligible.*country/i, /eligible.*work/i, /right.*work/i], not: [] },
  { type: "notice_period", patterns: [/notice\s*period/i, /available.*start/i, /start.*date/i, /earliest.*start/i, /notice\s*time/i], not: [] },
  { type: "professional_category", patterns: [/professional\s*category/i, /career\s*level/i, /experience\s*level/i, /employment\s*category/i], not: [] },
  { type: "referral_source", patterns: [/how.*hear.*about.*us/i, /how.*did.*you.*hear/i, /source/i, /referral/i, /referred/i], not: [/source\s*code/i] },
  { type: "previous_employment", patterns: [/previously.*employed/i, /prior.*employment/i, /worked.*before/i, /former.*employee/i, /predecessor.*entities/i], not: [] },
  { type: "declaration_confirmation", patterns: [/declaration/i, /information.*true/i, /true.*accurate/i, /certify/i, /undertake/i], not: [] },
  { type: "terms_acknowledgement", patterns: [/terms.*conditions/i, /terms.*use/i, /acknowledge.*terms/i], not: [] },
  { type: "date_of_birth", patterns: [/date\s*of\s*birth/i, /\bdob\b/i, /birth\s*date/i], not: [] },
  { type: "citizenship_status", patterns: [/citizenship/i, /citizen\s*status/i, /nationality/i], not: [] },
  { type: "gender", patterns: [/^gender$/i, /\bgender\b/i], not: [] },
  { type: "pronoun", patterns: [/pronoun/i], not: [] },
  { type: "diversity", patterns: [/diversity/i, /demographic/i, /gender/i, /ethnicity/i, /race/i, /veteran/i, /disability/i], not: [/skills/i] },
  { type: "equal_opportunity", patterns: [/equal opportunity/i, /eeo/i, /affirmative action/i, /equal employment/i, /eoe/i, /equal employer/i], not: [] },
];

function cleanText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

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
  if (/\bdegree\b/i.test(combined)) {
    return { intent: "education_degree", confidence: 0.95 };
  }
  if (/school\s*or\s*university|\bschool\b|\buniversity\b/i.test(combined)) {
    return { intent: "education_school", confidence: 0.95 };
  }
  if (/field\s*of\s*study/i.test(combined)) {
    return { intent: "education_field", confidence: 0.95 };
  }
  if (/overall\s*result|gpa/i.test(combined)) {
    return { intent: "education_gpa", confidence: 0.9 };
  }

  const inEducationSection = /education\s*\d*|school\s*or\s*university|field\s*of\s*study|overall\s*result|gpa|education-\d+|fieldofstudy|gradeyear|yearattended/i.test(combined);
  const inExperienceSection = /(?:work|my)\s*experience|employment\s*history|job\s*history|jobhistory|role\s*description|currently\s*work\s*here/i.test(combined);

  if (inEducationSection && /school\s*or\s*university|\bschool\b|\buniversity\b/i.test(combined)) {
    return { intent: "education_school", confidence: 0.95 };
  }
  if (inEducationSection && /\bdegree\b/i.test(combined)) {
    return { intent: "education_degree", confidence: 0.9 };
  }
  if (inEducationSection && /field\s*of\s*study/i.test(combined)) {
    return { intent: "education_field", confidence: 0.95 };
  }
  if (inEducationSection && /overall\s*result|gpa/i.test(combined)) {
    return { intent: "education_gpa", confidence: 0.9 };
  }
  if (inEducationSection && /\bfrom\b/i.test(combined)) {
    return { intent: "education_start_date", confidence: 0.85 };
  }
  if (inEducationSection && /\bto\b|actual\s*or\s*expected/i.test(combined)) {
    return { intent: "education_end_date", confidence: 0.85 };
  }

  if (inExperienceSection && /job\s*title|position\s*title|\btitle\b/i.test(combined)) {
    return { intent: "experience_title", confidence: 0.95 };
  }
  if (inExperienceSection && /\bcompany\b|employer|organization/i.test(combined)) {
    return { intent: "experience_company", confidence: 0.95 };
  }
  if (inExperienceSection && /\blocation\b|city|work\s*location/i.test(combined)) {
    return { intent: "experience_location", confidence: 0.9 };
  }
  if (inExperienceSection && /role\s*description|description|responsibilities/i.test(combined)) {
    return { intent: "experience_description", confidence: 0.9 };
  }
  if (inExperienceSection && /currently\s*work\s*here|current\s*role|i\s*currently\s*work/i.test(combined)) {
    return { intent: "experience_current", confidence: 0.9 };
  }
  if (inExperienceSection && isStartDateField(field, combined)) {
    return { intent: "experience_start_date", confidence: 0.85 };
  }
  if (inExperienceSection && isEndDateField(field, combined)) {
    return { intent: "experience_end_date", confidence: 0.85 };
  }

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
    if (/linkedin|linked\s*in/i.test(combined)) {
      return { intent: "linkedin_url", confidence: 1.0 };
    }
    if (/portfolio|project.*link|blog.*link|github|website|personal\s*site/i.test(combined)) {
      return { intent: "portfolio_url", confidence: 0.9 };
    }
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

function isStartDateField(field, combined) {
  return /\bfrom\b|start\s*date/i.test(primaryFieldText(field, combined));
}

function isEndDateField(field, combined) {
  return /\bto\b|end\s*date/i.test(primaryFieldText(field, combined));
}

function primaryFieldText(field, combined) {
  const direct = [
    field?.label,
    field?.placeholder,
    field?.ariaLabel,
  ].filter(Boolean).join(" ");
  const technical = [
    field?.name,
    field?.id,
    field?.fieldKey,
  ].filter(Boolean).join(" ");
  if (!direct || /current\s*value\s*is|^m{1,2}\/?y{2,4}$|^y{2,4}$|^\d{1,2}\/?\d{0,4}$/i.test(cleanText(direct))) {
    return `${direct} ${technical}`.trim() || combined || "";
  }
  return direct || combined || "";
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
