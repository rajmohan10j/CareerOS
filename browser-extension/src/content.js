(function () {
  "use strict";

  const FIELD_SELECTORS = [
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset])",
    "textarea",
    "select",
  ];

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

  if (window.__careerosContentLoaded) {
    return;
  }
  window.__careerosContentLoaded = true;

  console.log("[CareerOS] Content script loaded (v0.3.7)");

  function cleanText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function getTextByIds(value) {
    if (!value) return null;
    const text = value
      .split(/\s+/)
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .map((el) => cleanText(el.textContent))
      .filter(Boolean)
      .join(" ");
    return text || null;
  }

  function findSectionHeading(el) {
    const nearbyBlock = findNearestRepeatingBlockHeading(el);
    if (nearbyBlock) return nearbyBlock;

    let current = el.parentElement;
    let depth = 0;
    while (current && depth < 10) {
      const headings = current.querySelectorAll("h1, h2, h3, h4, h5, h6, legend");
      for (const h of headings) {
          const text = cleanText(h.textContent).toLowerCase();
        if (text) return text;
      }
      const prev = current.previousElementSibling;
      if (prev) {
        const tag = prev.tagName || "";
        if (tag.startsWith("H") || tag === "LEGEND") {
            const text = cleanText(prev.textContent).toLowerCase();
          if (text) return text;
        }
      }
      current = current.parentElement;
      depth++;
    }
    return null;
  }

  function findNearestRepeatingBlockHeading(el) {
    const rect = el.getBoundingClientRect();
    let best = null;
    const candidates = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, legend, [role='heading'], div, span, p, strong"));
    for (const candidate of candidates) {
      const text = cleanText(candidate.textContent);
      if (!/^(work\s+experience|education)\s+\d+$/i.test(text)) continue;
      const candidateRect = candidate.getBoundingClientRect();
      if (candidateRect.width <= 0 || candidateRect.height <= 0) continue;
      if (candidateRect.top > rect.top) continue;
      if (!best || candidateRect.top > best.top) {
        best = { text: text.toLowerCase(), top: candidateRect.top };
      }
    }
    return best?.text || null;
  }

  function findLabel(el) {
    const labelledBy = getTextByIds(el.getAttribute("aria-labelledby"));
    if (labelledBy) return labelledBy;

    const describedBy = getTextByIds(el.getAttribute("aria-describedby"));
    if (describedBy) return describedBy;

    if (el.id) {
      const labelByFor = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (labelByFor) return cleanText(labelByFor.textContent);
    }

    if (el.closest("label")) {
      const text = cleanText(el.closest("label").textContent);
      if (text) return text;
    }

    const directParentLabel = findDirectParentLabel(el);
    if (directParentLabel) return directParentLabel;

    const preceding = findPrecedingText(el);
    if (preceding) return preceding;

    const prev = el.previousElementSibling;
    if (prev) {
      const tag = (prev.tagName || "").toLowerCase();
      if (["label", "span", "div", "p", "strong"].includes(tag)) {
        const text = cleanText(prev.textContent);
        if (text) return text;
      }
    }
    return null;
  }

  function findDirectParentLabel(el) {
    let current = el.parentElement;
    let depth = 0;
    while (current && depth < 4) {
      const fillableCount = current.querySelectorAll(FIELD_SELECTORS.join(", ")).length;
      const directLabels = Array.from(current.children || []).filter((child) => {
        const tag = (child.tagName || "").toLowerCase();
        return ["label", "span", "div", "p", "strong"].includes(tag) && !child.contains(el);
      });
      for (const label of directLabels) {
        const text = cleanText(label.textContent);
        if (isDateMaskText(text)) continue;
        if (text && text.length > 1 && text.length < 160) return text;
      }
      if (fillableCount > 1) break;
      current = current.parentElement;
      depth++;
    }
    return null;
  }

  function findPrecedingText(el) {
    let current = el;
    let hops = 0;
    while (current && hops < 6) {
      let prev = current.previousElementSibling;
      while (prev) {
        const tag = (prev.tagName || "").toLowerCase();
        const text = cleanText(prev.textContent);
        if (isDateMaskText(text)) {
          prev = prev.previousElementSibling;
          continue;
        }
        if (text && ["label", "span", "div", "p", "strong", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
          if (text.length > 2 && text.length < 240) return text;
        }
        prev = prev.previousElementSibling;
      }
      current = current.parentElement;
      hops++;
    }
    return null;
  }

  function findNearbyText(el) {
    const parent = el.parentElement;
    if (!parent) return null;
    const allText = [];
    for (const node of parent.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
          const text = cleanText(node.textContent);
        if (text) allText.push(text);
      }
    }
    return allText.length > 0 ? cleanText(allText.join(" ")) : findPrecedingText(el);
  }

  function isDateMaskText(text) {
    return /^(m{1,2}\/?y{2,4}|y{2,4}|mm\/yyyy|yyyy)$/i.test(cleanText(text || ""));
  }

  function findRadioGroupLabel(el) {
    const fieldset = el.closest("fieldset");
    if (fieldset) {
      const legend = fieldset.querySelector("legend");
      if (legend && cleanText(legend.textContent)) return cleanText(legend.textContent);
    }

    let current = el.parentElement;
    let depth = 0;
    while (current && depth < 5) {
      const text = cleanText(current.textContent);
      if (text && text.length > 3) {
        const cleaned = text.replace(/\b(yes|no)\b/gi, "").replace(/\s+/g, " ").trim();
        if (cleaned.length > 3 && cleaned.length < 220) return cleaned;
      }
      current = current.parentElement;
      depth++;
    }
    return null;
  }

  function makeFieldKey(index, field) {
    return [
      index,
      field.id || "",
      field.name || "",
      field.label || field.ariaLabel || field.placeholder || field.nearbyText || "",
    ].join("|");
  }

  function detectFields() {
    const results = [];
    const seen = new Set();

    document.querySelectorAll(FIELD_SELECTORS.join(", ")).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);

      const tagName = (el.tagName || "").toLowerCase();
      const inputType = el.type || null;
      const fieldType =
        tagName === "textarea"
          ? "textarea"
          : tagName === "select"
            ? "select"
            : inputType || "text";

      const options = tagName === "select"
        ? Array.from(el.options)
            .map((o) => ({ value: o.value, text: o.text.trim() }))
            .filter((o) => o.value !== "" || o.text !== "")
        : null;

      const rect = el.getBoundingClientRect();
      const visibleInViewport = rect.bottom >= 0 && rect.top <= window.innerHeight && rect.right >= 0 && rect.left <= window.innerWidth;
      const radios = [];
      if (inputType === "radio" && el.name) {
        document.querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`).forEach((r) => {
          if (!seen.has(r)) seen.add(r);
          radios.push({ value: r.value, label: findLabel(r) });
        });
      }

      const label = inputType === "radio" ? findRadioGroupLabel(el) || findLabel(el) : findLabel(el);
      const field = {
        tagName,
        fieldType,
        inputType,
        name: el.name || null,
        id: el.id || null,
        placeholder: el.placeholder || null,
        ariaLabel: el.getAttribute("aria-label") || null,
        label,
        nearbyText: findNearbyText(el),
        currentValue: el.type === "checkbox" || el.type === "radio" ? (el.checked ? "checked" : "") : el.value || "",
        sectionHeading: findSectionHeading(el),
        required: el.required || el.getAttribute("aria-required") === "true",
        readOnly: el.readOnly || false,
        disabled: el.disabled || false,
        options,
        position: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        visibleInViewport,
        radios: radios.length > 0 ? radios : null,
      };
      field.fieldKey = makeFieldKey(results.length, field);
      results.push(field);
    });

    return results;
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
    ].filter(Boolean).map((s) => s.trim());

    if (signals.length === 0) return { intent: "unknown", confidence: 0.1 };

    const combined = signals.join(" ");
    if (/\bdegree\b/i.test(combined)) return { intent: "education_degree", confidence: 0.95 };
    if (/school\s*or\s*university|\bschool\b|\buniversity\b/i.test(combined)) return { intent: "education_school", confidence: 0.95 };
    if (/field\s*of\s*study/i.test(combined)) return { intent: "education_field", confidence: 0.95 };
    if (/overall\s*result|gpa/i.test(combined)) return { intent: "education_gpa", confidence: 0.9 };

    const inEducationSection = /education\s*\d*|school\s*or\s*university|field\s*of\s*study|overall\s*result|gpa|education-\d+|fieldofstudy|gradeyear|yearattended/i.test(combined);
    const inExperienceSection = /(?:work|my)\s*experience|employment\s*history|job\s*history|jobhistory|role\s*description|currently\s*work\s*here/i.test(combined);

    if (inEducationSection && /school\s*or\s*university|\bschool\b|\buniversity\b/i.test(combined)) return { intent: "education_school", confidence: 0.95 };
    if (inEducationSection && /\bdegree\b/i.test(combined)) return { intent: "education_degree", confidence: 0.9 };
    if (inEducationSection && /field\s*of\s*study/i.test(combined)) return { intent: "education_field", confidence: 0.95 };
    if (inEducationSection && /overall\s*result|gpa/i.test(combined)) return { intent: "education_gpa", confidence: 0.9 };
    if (inEducationSection && /\bfrom\b/i.test(combined)) return { intent: "education_start_date", confidence: 0.85 };
    if (inEducationSection && /\bto\b|actual\s*or\s*expected/i.test(combined)) return { intent: "education_end_date", confidence: 0.85 };

    if (inExperienceSection && /job\s*title|position\s*title|\btitle\b/i.test(combined)) return { intent: "experience_title", confidence: 0.95 };
    if (inExperienceSection && /\bcompany\b|employer|organization/i.test(combined)) return { intent: "experience_company", confidence: 0.95 };
    if (inExperienceSection && /\blocation\b|city|work\s*location/i.test(combined)) return { intent: "experience_location", confidence: 0.9 };
    if (inExperienceSection && /role\s*description|description|responsibilities/i.test(combined)) return { intent: "experience_description", confidence: 0.9 };
    if (inExperienceSection && /currently\s*work\s*here|current\s*role|i\s*currently\s*work/i.test(combined)) return { intent: "experience_current", confidence: 0.9 };
    if (inExperienceSection && isStartDateField(field, combined)) return { intent: "experience_start_date", confidence: 0.85 };
    if (inExperienceSection && isEndDateField(field, combined)) return { intent: "experience_end_date", confidence: 0.85 };

    if (field.inputType === "file" && /resume|cv/i.test(combined)) return { intent: "resume_upload", confidence: 1.0 };
    if (field.inputType === "file") return { intent: "resume_upload", confidence: 0.6 };
    if (field.fieldType === "textarea" && /cover|letter/i.test(combined)) return { intent: "cover_letter", confidence: 1.0 };
    if (field.fieldType === "textarea" && /experience|employment|work.*history/i.test(combined)) return { intent: "experience", confidence: 0.9 };
    if (field.fieldType === "textarea") return { intent: "cover_letter", confidence: 0.3 };
    if (field.inputType === "tel") return { intent: "phone", confidence: 1.0 };
    if (field.inputType === "email") return { intent: "email", confidence: /confirm|alternate/i.test(combined) ? 0.6 : 1.0 };
    if (field.inputType === "url") {
      if (/linkedin|linked\s*in/i.test(combined)) return { intent: "linkedin_url", confidence: 1.0 };
      if (/portfolio|project.*link|blog.*link|github|website|personal\s*site/i.test(combined)) return { intent: "portfolio_url", confidence: 0.9 };
      return { intent: "unknown", confidence: 0.3 };
    }
    if (field.inputType === "number" && /salary|compensation|pay/i.test(combined)) return { intent: "salary_expectation", confidence: 1.0 };
    if (field.inputType === "number") return { intent: "unknown", confidence: 0.3 };

    if (field.fieldType === "select") {
      const opts = field.options || [];
      const optTexts = opts.map((o) => o.text.toLowerCase()).join(" ");
      const optVals = opts.map((o) => o.value.toLowerCase()).join(" ");
      if (/country|nation/i.test(combined) || /^[A-Z]{2}$/.test(opts.map((o) => o.value).filter(Boolean).join(" "))) {
        return { intent: "country", confidence: 1.0 };
      }
      if (/state|province|region/i.test(combined) || /state|province|region/i.test(optTexts + " " + optVals)) {
        return { intent: "state", confidence: 0.9 };
      }
      if (/country|nation/i.test(optTexts + " " + optVals)) return { intent: "country", confidence: 0.8 };
    }

    let best = { intent: "unknown", confidence: 0.1 };
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
      if (fp.not.some((p) => p.test(combined))) {
        score -= 0.3;
        if (score <= 0) continue;
      }
      score += field.inputType === "email" && fp.type === "email" ? 0.3
        : field.inputType === "tel" && fp.type === "phone" ? 0.3
          : 0;
      score += field.label ? 0.3 : field.placeholder ? 0.2 : field.ariaLabel ? 0.2 : field.name ? 0.1 : 0;
      const sourceCount = [field.label, field.placeholder, field.ariaLabel, field.name, field.id, field.sectionHeading].filter(Boolean).length;
      score += Math.min((sourceCount - 1) * 0.1, 0.3);
      if (combined.length > 3 && combined.length < 80) score += 0.05;
      const finalScore = Math.min(Math.max(score, 0.1), 1.0);
      if (finalScore > best.confidence) best = { intent: fp.type, confidence: Math.round(finalScore * 100) / 100 };
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

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "PING") {
      sendResponse({ ready: true, version: "0.1.0" });
      return;
    }
    if (message.type === "GET_PAGE_INFO") {
      sendResponse({
        url: window.location.href,
        title: document.title,
      });
      return;
    }
    if (message.type === "DETECT_FIELDS") {
      try {
        const raw = detectFields();
        const classified = classifyFields(raw);
        sendResponse({
          success: true,
          fieldCount: classified.length,
          fields: classified,
          url: window.location.href,
        });
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message,
          fieldCount: 0,
          fields: [],
        });
      }
      return;
    }
    if (message.type === "FILL_FIELDS") {
      try {
        const result = fillApprovedFields(message.fields || []);
        sendResponse(result);
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message,
          filled: 0,
          skipped: message.fields ? message.fields.length : 0,
          failed: 0,
          details: { error: err.message },
        });
      }
      return;
    }
  });

  function findFieldElement(field) {
    const keyed = findFieldElementByKey(field);
    if (keyed) return keyed;

    if (field.id) {
      const el = document.getElementById(field.id);
      if (el) return el;
    }
    if (field.name) {
      const el = document.querySelector(`[name="${CSS.escape(field.name)}"]`);
      if (el) return el;
    }
    return null;
  }

  function findFieldElementByKey(field) {
    if (!field.fieldKey) return null;
    const seen = new Set();
    const candidates = Array.from(document.querySelectorAll(FIELD_SELECTORS.join(", ")));
    let index = 0;
    for (const el of candidates) {
      if (seen.has(el)) continue;
      seen.add(el);

      const tagName = (el.tagName || "").toLowerCase();
      const inputType = el.type || null;
      const label = inputType === "radio" ? findRadioGroupLabel(el) || findLabel(el) : findLabel(el);
      const candidateField = {
        id: el.id || null,
        name: el.name || null,
        label,
        ariaLabel: el.getAttribute("aria-label") || null,
        placeholder: el.placeholder || null,
        nearbyText: findNearbyText(el),
      };

      const key = makeFieldKey(index, candidateField);
      if (key === field.fieldKey) return el;

      if (inputType === "radio" && el.name) {
        document.querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`).forEach((radio) => seen.add(radio));
      }
      index += 1;
    }
    return null;
  }

  function isFillableElement(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (tag !== "input" && tag !== "textarea" && tag !== "select") return false;
    if (el.disabled) return false;
    if (el.readOnly) return false;
    if (tag === "input") {
      const type = (el.type || "text").toLowerCase();
      if (type === "password") return false;
      if (type === "hidden") return false;
      if (type === "file") return false;
      if (type === "submit") return false;
      if (type === "button") return false;
      if (type === "reset") return false;
      if (type === "image") return false;
    }
    return true;
  }

  function normalizeChoice(value) {
    return cleanText(String(value || "")).toLowerCase();
  }

  function findMatchingRadio(field) {
    if (!field.name || field.value == null) return null;
    const desired = normalizeChoice(field.value);
    const radios = Array.from(document.querySelectorAll(`input[type="radio"][name="${CSS.escape(field.name)}"]`));
    return radios.find((radio) => {
      const optionLabel = normalizeChoice(findLabel(radio));
      const optionValue = normalizeChoice(radio.value);
      return optionLabel === desired || optionValue === desired;
    }) || null;
  }

  function setNativeChecked(radio, checked) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked");
    if (descriptor && descriptor.set) {
      descriptor.set.call(radio, checked);
    } else {
      radio.checked = checked;
    }
  }

  function findRadioShell(radio) {
    return radio.closest('[role="radio"], [aria-checked], label') || radio.parentElement;
  }

  function dispatchRadioActivation(target) {
    if (!target) return;
    const pointerEvent = typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
    target.dispatchEvent(new pointerEvent("pointerdown", { bubbles: true, cancelable: true, view: window }));
    target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  }

  function syncRadioGroupUi(radio) {
    if (!radio.name) return;
    document.querySelectorAll(`input[type="radio"][name="${CSS.escape(radio.name)}"]`).forEach((candidate) => {
      const selected = candidate === radio;
      if (candidate.checked !== selected) setNativeChecked(candidate, selected);
      candidate.setAttribute("aria-checked", selected ? "true" : "false");
      const shell = findRadioShell(candidate);
      if (shell) shell.setAttribute("aria-checked", selected ? "true" : "false");
    });
  }

  function fillElement(el, value) {
    const tag = el.tagName.toLowerCase();
    const valueToFill = normalizeValueForElement(el, value);
    if (tag === "select") {
      const optionExists = Array.from(el.options).some(
        (o) => o.value === valueToFill || o.text === valueToFill
      );
      if (!optionExists) return false;
      el.value = valueToFill;
    } else {
      setNativeValue(el, valueToFill);
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function normalizeValueForElement(el, value) {
    const raw = String(value ?? "");
    const type = (el.type || "").toLowerCase();
    const monthYear = raw.match(/^(\d{1,2})\/(\d{4})$/);
    if (type === "month" && monthYear) {
      return `${monthYear[2]}-${monthYear[1].padStart(2, "0")}`;
    }
    if (type === "date" && monthYear) {
      return `${monthYear[2]}-${monthYear[1].padStart(2, "0")}-01`;
    }
    return raw;
  }

  function setNativeValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor?.set) {
      descriptor.set.call(el, value);
    } else {
      el.value = value;
    }
  }

  function fillRadioElement(field) {
    const radio = findMatchingRadio(field);
    if (!radio || radio.disabled || radio.readOnly) return false;
    const shell = findRadioShell(radio);
    dispatchRadioActivation(shell);
    setNativeChecked(radio, true);
    syncRadioGroupUi(radio);
    dispatchRadioActivation(radio);
    setNativeChecked(radio, true);
    syncRadioGroupUi(radio);
    radio.dispatchEvent(new Event("input", { bubbles: true }));
    radio.dispatchEvent(new Event("change", { bubbles: true }));
    highlightFilled(radio);
    return radio.checked === true;
  }

  function valueMeansChecked(value) {
    return /^(yes|true|1|checked)$/i.test(cleanText(String(value || "")));
  }

  function fillCheckboxElement(el, value) {
    const shouldCheck = valueMeansChecked(value);
    setNativeChecked(el, shouldCheck);
    el.setAttribute("aria-checked", shouldCheck ? "true" : "false");
    const shell = findRadioShell(el);
    if (shell) shell.setAttribute("aria-checked", shouldCheck ? "true" : "false");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    highlightFilled(el);
    return el.checked === shouldCheck;
  }

  function highlightFilled(el) {
    const origOutline = el.style.outline;
    const origOutlineOffset = el.style.outlineOffset;
    el.style.outline = "2px solid #2e7d32";
    el.style.outlineOffset = "1px";
    setTimeout(() => {
      el.style.outline = origOutline;
      el.style.outlineOffset = origOutlineOffset;
    }, 2000);
  }

  function fillApprovedFields(fields) {
    let filled = 0;
    let skipped = 0;
    let failed = 0;
    const details = {
      skippedMissing: 0,
      skippedUnfillable: 0,
      skippedNotFound: 0,
      filledFields: [],
      skippedNotFoundFields: [],
      skippedUnfillableFields: [],
      skippedMissingFields: [],
    };

    for (const field of fields) {
      const el = findFieldElement(field);
      if (!el) {
        skipped++;
        details.skippedNotFound++;
        details.skippedNotFoundFields.push(field.intent);
        continue;
      }
      if (!isFillableElement(el)) {
        skipped++;
        details.skippedUnfillable++;
        details.skippedUnfillableFields.push(field.intent);
        continue;
      }
      const type = (el.type || "").toLowerCase();
      const ok = type === "radio"
        ? fillRadioElement(field)
        : type === "checkbox"
          ? fillCheckboxElement(el, field.value)
          : fillElement(el, field.value);
      if (ok) {
        filled++;
        details.filledFields.push(field.intent);
        if (type !== "radio" && type !== "checkbox") highlightFilled(el);
      } else {
        failed++;
      }
    }

    return {
      success: true,
      filled,
      skipped,
      failed,
      total: fields.length,
      details,
    };
  }
})();
