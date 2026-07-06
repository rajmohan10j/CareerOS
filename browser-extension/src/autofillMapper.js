import { REFERENCE_EDUCATION, REFERENCE_EXPERIENCES } from "./referenceProfile.js";

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

function getLatestExperience(experiences) {
  if (!experiences || experiences.length === 0) return null;
  const sorted = [...experiences].sort((a, b) => {
    if (a.start_date && b.start_date) return b.start_date.localeCompare(a.start_date);
    if (b.start_date) return 1;
    return -1;
  });
  return sorted[0];
}

function getCanonicalResume(profileData) {
  return profileData?.canonicalResume?.success ? profileData.canonicalResume.data : null;
}

function normalizeExperience(entry) {
  if (!entry) return entry;
  return {
    ...entry,
    current: entry.current ?? entry.currently_work_here,
    start_date: entry.start_date || entry.from,
    end_date: entry.end_date || entry.to,
  };
}

function normalizeEducation(entry) {
  if (!entry) return entry;
  return {
    ...entry,
    start_date: entry.start_date || entry.from,
    end_date: entry.end_date || entry.to,
  };
}

function getExperienceSource(experiences, canonicalResume) {
  if (experiences && experiences.length > 0) return experiences.map(normalizeExperience);
  const canonical = canonicalResume?.experience || [];
  return canonical.length > 0 ? canonical.map(normalizeExperience) : REFERENCE_EXPERIENCES;
}

function getFieldContext(field) {
  return [
    field?.label,
    field?.sectionHeading,
    field?.nearbyText,
    field?.fieldKey,
  ].filter(Boolean).join(" ");
}

function isEducationField(field) {
  return /education\s+\d+|school\s*or\s*university|degree|field\s*of\s*study|overall\s*result|gpa/i.test(getFieldContext(field));
}

function isExperienceField(field) {
  const text = getFieldContext(field);
  return !isEducationField(field) &&
    /(?:work|my)\s+experience(?:\s+\d+)?|job\s*title|company|work\s*location|role\s*description|currently\s*work\s*here/i.test(text);
}

function getExperienceIndex(field) {
  const text = getFieldContext(field);
  const match = text.match(/(?:work|my)\s+experience\s+(\d+)/i);
  if (!match) return 0;
  const index = Number.parseInt(match[1], 10);
  return Number.isFinite(index) && index > 0 ? index - 1 : 0;
}

function getExperienceForField(field, experiences, canonicalResume) {
  const source = getExperienceSource(experiences, canonicalResume);
  return source[getExperienceIndex(field)] || source[0] || null;
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function getEducationIndex(field) {
  const text = getFieldContext(field);
  const match = text.match(/education\s+(\d+)/i);
  if (!match) return 0;
  const index = Number.parseInt(match[1], 10);
  return Number.isFinite(index) && index > 0 ? index - 1 : 0;
}

function getEducationForField(field, canonicalResume) {
  const canonical = canonicalResume?.education || [];
  const source = canonical.length > 0 ? canonical.map(normalizeEducation) : REFERENCE_EDUCATION;
  return source[getEducationIndex(field)] || source[0] || null;
}

function dateValueForField(value, field) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (!match) return raw;
  const text = getFieldContext(field);
  if (/year|yyyy|dateSectionYear/i.test(text)) return match[2];
  if (/month|mm|dateSectionMonth/i.test(text)) return match[1].padStart(2, "0");
  return raw;
}

function deriveFirstLastFromSummary(summary) {
  if (!summary) return { first: null, last: null };
  const trimmed = summary.trim().split(/\s+/);
  if (trimmed.length >= 2) {
    return { first: trimmed[0], last: trimmed[trimmed.length - 1] };
  }
  if (trimmed.length === 1) {
    return { first: trimmed[0], last: null };
  }
  return { first: null, last: null };
}

function getPreference(profile, keys) {
  const preferences = profile?.preferences || profile?.preferences_json || {};
  for (const key of keys) {
    if (preferences && preferences[key]) {
      return preferences[key];
    }
  }
  return null;
}

function formatSalaryExpectation(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);
  const currency = value.currency || "";
  const min = value.min || value.minimum || "";
  const max = value.max || value.maximum || "";
  const period = value.period || "";
  if (min && max) return `${currency} ${min}-${max} ${period}`.trim();
  if (min) return `${currency} ${min}+ ${period}`.trim();
  if (max) return `${currency} up to ${max} ${period}`.trim();
  if (value.text) return value.text;
  return null;
}

function mapIntentToValue(intent, profile, skills, experiences, canonicalResume = null) {
  return mapIntentToValueForField(intent, profile, skills, experiences, null, canonicalResume);
}

function mapIntentToValueForField(intent, profile, skills, experiences, field, canonicalResume = null) {
  switch (intent) {
    case "full_name": {
      const fullName = getPreference(profile, ["full_name", "legal_name", "name"]);
      if (fullName) {
        return {
          value: fullName,
          status: "available",
          confidence: 0.95,
          message: "From profile name",
        };
      }
      const derived = deriveFirstLastFromSummary(profile?.summary);
      if (derived.first && derived.last) {
        return {
          value: `${derived.first} ${derived.last}`,
          status: "derived",
          confidence: 0.5,
          message: "Derived from profile summary",
        };
      }
      if (derived.first) {
        return {
          value: derived.first,
          status: "partial",
          confidence: 0.3,
          message: "Only first name available from profile summary",
        };
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No name data in profile — add to CareerOS profile",
      };
    }

    case "name_prefix": {
      const prefix = getPreference(profile, ["name_prefix", "prefix", "salutation"]);
      if (prefix) {
        return {
          value: prefix,
          status: "available",
          confidence: 0.8,
          message: "From profile name prefix",
        };
      }
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Name prefix requires manual input unless saved in profile",
      };
    }

    case "first_name": {
      const firstName = getPreference(profile, ["first_name", "given_name"]);
      if (firstName) {
        return {
          value: firstName,
          status: "available",
          confidence: 0.95,
          message: "From profile first name",
        };
      }
      const derived = deriveFirstLastFromSummary(profile?.summary);
      if (derived.first) {
        return {
          value: derived.first,
          status: "derived",
          confidence: 0.5,
          message: "Derived from profile summary",
        };
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No first name data in profile — add to CareerOS profile",
      };
    }

    case "middle_name": {
      const middleName = getPreference(profile, ["middle_name"]);
      if (middleName) {
        return {
          value: middleName,
          status: "available",
          confidence: 0.9,
          message: "From profile middle name",
        };
      }
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Middle name requires manual input unless saved in profile",
      };
    }

    case "last_name": {
      const lastName = getPreference(profile, ["last_name", "family_name", "surname"]);
      if (lastName) {
        return {
          value: lastName,
          status: "available",
          confidence: 0.95,
          message: "From profile last name",
        };
      }
      const derived = deriveFirstLastFromSummary(profile?.summary);
      if (derived.last) {
        return {
          value: derived.last,
          status: "derived",
          confidence: 0.5,
          message: "Derived from profile summary",
        };
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No last name data in profile — add to CareerOS profile",
      };
    }

    case "email": {
      const email = getPreference(profile, ["email", "contact_email"]);
      if (email) {
        return {
          value: email,
          status: "available",
          confidence: 0.95,
          message: "From profile email",
        };
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No email in profile — add email to CareerOS profile",
      };
    }

    case "phone": {
      const phone = getPreference(profile, ["phone", "phone_number", "contact_phone"]);
      if (phone) {
        return {
          value: phone,
          status: "available",
          sensitive: true,
          confidence: 0.9,
          message: "From profile phone (verify before filling)",
        };
      }
      return {
        value: null,
        status: "missing",
        sensitive: true,
        confidence: 0,
        message: "No phone in profile — add phone to CareerOS profile (sensitive field)",
      };
    }

    case "address": {
      if (profile?.locations && profile.locations.length > 0) {
        return {
          value: profile.locations[0],
          status: "available",
          sensitive: true,
          confidence: 0.7,
          message: "From profile locations",
        };
      }
      return {
        value: null,
        status: "missing",
        sensitive: true,
        confidence: 0,
        message: "No address in profile — add location to CareerOS profile (sensitive field)",
      };
    }

    case "city": {
      if (profile?.locations && profile.locations.length > 0) {
        const parts = profile.locations[0].split(",").map((p) => p.trim());
        return {
          value: parts[0],
          status: "available",
          confidence: 0.6,
          message: "Derived from profile location",
        };
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No city in profile — add location to CareerOS profile",
      };
    }

    case "state": {
      if (profile?.locations && profile.locations.length > 0) {
        const parts = profile.locations[0].split(",").map((p) => p.trim());
        if (parts.length >= 2) {
          return {
            value: parts[1],
            status: "available",
            confidence: 0.5,
            message: "Derived from profile location",
          };
        }
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No state in profile — add location to CareerOS profile",
      };
    }

    case "country": {
      if (profile?.locations && profile.locations.length > 0) {
        const parts = profile.locations[0].split(",").map((p) => p.trim());
        if (parts.length >= 3) {
          return {
            value: parts[parts.length - 1],
            status: "available",
            confidence: 0.4,
            message: "Derived from profile location",
          };
        }
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No country in profile — add location to CareerOS profile",
      };
    }

    case "postal_code":
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No postal code in profile — add to CareerOS profile",
      };

    case "current_company": {
      const latest = getLatestExperience(getExperienceSource(experiences, canonicalResume));
      if (latest?.company) {
        return {
          value: latest.company,
          status: "available",
          confidence: 0.8,
          message: "From latest experience entry",
        };
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No experience entries in profile — add experience to CareerOS",
      };
    }

    case "current_title": {
      const latest = getLatestExperience(getExperienceSource(experiences, canonicalResume));
      if (latest?.title) {
        return {
          value: latest.title,
          status: "available",
          confidence: 0.8,
          message: "From latest experience entry",
        };
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No experience entries in profile — add experience to CareerOS",
      };
    }

    case "education":
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No education data in profile — add education to CareerOS profile",
      };

    case "education_school": {
      const edu = getEducationForField(field, canonicalResume);
      if (edu?.school) {
        return { value: edu.school, status: "available", confidence: 0.9, message: "From resume education school" };
      }
      return { value: null, status: "missing", confidence: 0, message: "No matching education school found" };
    }

    case "education_degree": {
      const edu = getEducationForField(field, canonicalResume);
      if (edu?.degree) {
        return { value: edu.degree, status: "available", confidence: 0.85, message: "From resume education degree" };
      }
      return { value: null, status: "missing", confidence: 0, message: "No matching education degree found" };
    }

    case "education_field": {
      const edu = getEducationForField(field, canonicalResume);
      if (edu?.field_of_study) {
        return { value: edu.field_of_study, status: "available", confidence: 0.85, message: "From resume education field of study" };
      }
      return { value: null, status: "missing", confidence: 0, message: "No matching education field of study found" };
    }

    case "education_gpa": {
      const edu = getEducationForField(field, canonicalResume);
      if (edu?.gpa) {
        return { value: edu.gpa, status: "available", confidence: 0.85, message: "From resume education GPA" };
      }
      return { value: null, status: "manual_review", confidence: 0, message: "No matching education GPA found" };
    }

    case "education_start_date": {
      const edu = getEducationForField(field, canonicalResume);
      if (edu?.start_date) {
        return { value: dateValueForField(edu.start_date, field), status: "available", confidence: 0.85, message: "From resume education start year" };
      }
      return { value: null, status: "missing", confidence: 0, message: "No matching education start date found" };
    }

    case "education_end_date": {
      const edu = getEducationForField(field, canonicalResume);
      if (edu?.end_date) {
        return { value: dateValueForField(edu.end_date, field), status: "available", confidence: 0.85, message: "From resume education end year" };
      }
      return { value: null, status: "missing", confidence: 0, message: "No matching education end date found" };
    }

    case "experience": {
      const source = getExperienceSource(experiences, canonicalResume);
      if (source && source.length > 0) {
        const summary = source
          .map((e) => `${e.title || "?"} at ${e.company || "?"}`)
          .join("; ");
        return {
          value: summary,
          status: "available",
          confidence: 0.7,
          message: "From experience entries",
        };
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No experience entries in profile",
      };
    }

    case "experience_title": {
      const exp = getExperienceForField(field, experiences, canonicalResume);
      if (exp?.title) {
        return { value: exp.title, status: "available", confidence: 0.9, message: "From resume/work experience title" };
      }
      return { value: null, status: "missing", confidence: 0, message: "No matching work experience title found" };
    }

    case "experience_company": {
      const exp = getExperienceForField(field, experiences, canonicalResume);
      if (exp?.company) {
        return { value: exp.company, status: "available", confidence: 0.9, message: "From resume/work experience company" };
      }
      return { value: null, status: "missing", confidence: 0, message: "No matching work experience company found" };
    }

    case "experience_location": {
      const exp = getExperienceForField(field, experiences, canonicalResume);
      if (exp?.location) {
        return { value: exp.location, status: "available", confidence: 0.85, message: "From resume/work experience location" };
      }
      return { value: null, status: "manual_review", confidence: 0, message: "Experience location is not available in desktop experience data" };
    }

    case "experience_current": {
      const exp = getExperienceForField(field, experiences, canonicalResume);
      if (exp && (exp.current != null || exp.currently_work_here != null)) {
        return { value: yesNo(Boolean(exp.current ?? exp.currently_work_here)), status: "available", confidence: 0.85, message: "From resume/work experience current-role flag" };
      }
      return { value: "No", status: "derived", confidence: 0.6, message: "Defaulted to No because this experience has an end date" };
    }

    case "experience_start_date": {
      if (field && !isExperienceField(field)) {
        return { value: null, status: "manual_review", confidence: 0, message: "Skipped experience start date because this field is not inside a Work Experience block" };
      }
      const exp = getExperienceForField(field, experiences, canonicalResume);
      if (exp?.start_date || exp?.from) {
        return { value: dateValueForField(exp.start_date || exp.from, field), status: "available", confidence: 0.9, message: "From resume/work experience start date" };
      }
      return { value: null, status: "missing", confidence: 0, message: "No matching work experience start date found" };
    }

    case "experience_end_date": {
      if (field && !isExperienceField(field)) {
        return { value: null, status: "manual_review", confidence: 0, message: "Skipped experience end date because this field is not inside a Work Experience block" };
      }
      const exp = getExperienceForField(field, experiences, canonicalResume);
      if (exp?.end_date || exp?.to) {
        return { value: dateValueForField(exp.end_date || exp.to, field), status: "available", confidence: 0.9, message: "From resume/work experience end date" };
      }
      return { value: null, status: "manual_review", confidence: 0, message: "No matching work experience end date found" };
    }

    case "experience_description": {
      if (field && !isExperienceField(field)) {
        return { value: null, status: "manual_review", confidence: 0, message: "Skipped role description because this field is not inside a Work Experience block" };
      }
      const exp = getExperienceForField(field, experiences, canonicalResume);
      if (exp?.description) {
        return { value: exp.description, status: "available", confidence: 0.85, message: "From resume/work experience role description" };
      }
      return { value: null, status: "missing", confidence: 0, message: "No matching work experience description found" };
    }

    case "skills": {
      if (skills && skills.length > 0) {
        const skillNames = skills.map((s) => s.name).filter(Boolean);
        if (skillNames.length > 0) {
          return {
            value: skillNames.join(", "),
            status: "available",
            confidence: 0.9,
            message: `From ${skillNames.length} skill(s) in profile`,
          };
        }
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No skills in profile — add skills to CareerOS profile",
      };
    }

    case "linkedin_url": {
      const linkedIn = getPreference(profile, ["linkedin_url", "linkedin"]);
      if (linkedIn) {
        return {
          value: linkedIn,
          status: "available",
          confidence: 0.9,
          message: "From profile LinkedIn URL",
        };
      }
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No LinkedIn URL in profile",
      };
    }

    case "portfolio_url": {
      const portfolio = getPreference(profile, ["portfolio_url", "github_url", "website_url", "portfolio"]);
      if (portfolio) {
        return {
          value: portfolio,
          status: "available",
          confidence: 0.8,
          message: "From profile portfolio URL",
        };
      }
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Portfolio or project link should be reviewed manually",
      };
    }

    case "resume_upload":
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Resume file must be selected manually — cannot auto-upload",
      };

    case "cover_letter":
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Cover letter requires manual input — no automatic value available",
      };

    case "salary_expectation": {
      if (profile?.salaryExpectations) {
        const salaryValue = formatSalaryExpectation(profile.salaryExpectations);
        if (salaryValue) {
          return {
            value: salaryValue,
            status: "available",
            sensitive: true,
            confidence: 0.6,
            message: "From profile salary expectations (verify before filling)",
          };
        }
      }
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "No salary expectation in profile — requires manual input (sensitive field)",
      };
    }

    case "work_authorization": {
      const workAuth = getPreference(profile, ["work_authorization", "authorization"]);
      if (workAuth) {
        return {
          value: workAuth,
          status: "available",
          sensitive: true,
          confidence: 0.7,
          message: "From profile work authorization (verify before filling)",
        };
      }
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "Work authorization requires manual input (sensitive field)",
      };
    }

    case "legal_eligibility": {
      const legalEligibility = getPreference(profile, ["legal_eligibility", "eligible_to_work"]);
      if (legalEligibility) {
        return {
          value: legalEligibility,
          status: "available",
          sensitive: true,
          confidence: 0.75,
          message: "From profile legal eligibility answer",
        };
      }
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "Legal eligibility should be reviewed manually",
      };
    }

    case "notice_period": {
      const noticePeriod = getPreference(profile, ["notice_period", "availability"]);
      if (noticePeriod) {
        return {
          value: noticePeriod,
          status: "available",
          sensitive: true,
          confidence: 0.7,
          message: "From profile notice period",
        };
      }
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "Notice period requires manual input (sensitive field)",
      };
    }

    case "professional_category": {
      const professionalCategory = getPreference(profile, ["professional_category", "career_level"]);
      if (professionalCategory) {
        return {
          value: professionalCategory,
          status: "available",
          confidence: 0.75,
          message: "From profile professional category",
        };
      }
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Professional category is portal-specific and should be reviewed manually",
      };
    }

    case "referral_source": {
      const referralSource = getPreference(profile, ["referral_source", "source"]);
      if (referralSource) {
        return {
          value: referralSource,
          status: "available",
          confidence: 0.7,
          message: "From profile referral source",
        };
      }
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Referral source is portal-specific and should be reviewed manually",
      };
    }

    case "previous_employment": {
      const previousEmployment = getPreference(profile, ["previous_employment", "previously_employed"]);
      if (previousEmployment) {
        return {
          value: previousEmployment,
          status: "available",
          confidence: 0.7,
          message: "From profile previous employment answer",
        };
      }
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Previous employment answer should be reviewed manually",
      };
    }

    case "declaration_confirmation": {
      const declaration = getPreference(profile, ["declaration_confirmation"]);
      if (declaration) {
        return {
          value: declaration,
          status: "available",
          confidence: 0.7,
          message: "From profile declaration preference",
        };
      }
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Declaration should be reviewed manually before confirming",
      };
    }

    case "terms_acknowledgement": {
      const terms = getPreference(profile, ["terms_acknowledgement"]);
      if (terms) {
        return {
          value: terms,
          status: "available",
          confidence: 0.7,
          message: "From profile terms acknowledgement preference",
        };
      }
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Terms acknowledgement should be reviewed manually",
      };
    }

    case "date_of_birth": {
      const dob = getPreference(profile, ["date_of_birth", "dob"]);
      if (dob) {
        return {
          value: dob,
          status: "available",
          sensitive: true,
          confidence: 0.8,
          message: "From profile date of birth (sensitive field)",
        };
      }
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "Date of birth is sensitive and should be reviewed manually",
      };
    }

    case "citizenship_status": {
      const citizenship = getPreference(profile, ["citizenship_status", "citizenship"]);
      if (citizenship) {
        return {
          value: citizenship,
          status: "available",
          sensitive: true,
          confidence: 0.75,
          message: "From profile citizenship status",
        };
      }
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "Citizenship status should be reviewed manually",
      };
    }

    case "gender": {
      const gender = getPreference(profile, ["gender"]);
      if (gender) {
        return {
          value: gender,
          status: "available",
          sensitive: true,
          confidence: 0.75,
          message: "From profile gender (sensitive field)",
        };
      }
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "Gender disclosure should be reviewed manually",
      };
    }

    case "pronoun": {
      const pronoun = getPreference(profile, ["pronoun"]);
      if (pronoun) {
        return {
          value: pronoun,
          status: "available",
          confidence: 0.75,
          message: "From profile pronoun",
        };
      }
      return {
        value: null,
        status: "manual_review",
        confidence: 0,
        message: "Pronoun disclosure should be reviewed manually",
      };
    }

    case "diversity":
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "Diversity question requires manual input (sensitive field)",
      };

    case "equal_opportunity":
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "EEO question requires manual input (sensitive field)",
      };

    default:
      return {
        value: null,
        status: "unknown",
        confidence: 0,
        message: "Unknown field type — cannot auto-map",
      };
  }
}

function mapFields(fields, profileData) {
  const profile = profileData?.profile?.data || null;
  const skills = profileData?.skills?.data || [];
  const experiences = profileData?.experiences?.data || [];
  const canonicalResume = getCanonicalResume(profileData);

  return fields.map((field) => {
    const mapping = mapIntentToValueForField(field.intent, profile, skills, experiences, field, canonicalResume);
    return {
      ...field,
      mappedValue: mapping.value,
      mappingStatus: mapping.status,
      mappingConfidence: mapping.confidence,
      mappingMessage: mapping.message,
      sensitive: field.sensitive || mapping.sensitive || false,
    };
  });
}

function summarizeMappings(mappedFields) {
  const total = mappedFields.length;
  const available = mappedFields.filter((f) => f.mappingStatus === "available").length;
  const derived = mappedFields.filter((f) => f.mappingStatus === "derived").length;
  const missing = mappedFields.filter((f) => f.mappingStatus === "missing").length;
  const manualReview = mappedFields.filter((f) => f.mappingStatus === "manual_review").length;
  const sensitive = mappedFields.filter((f) => f.sensitive).length;

  return { total, available, derived, missing, manualReview, sensitive };
}

export { mapFields, mapIntentToValue, mapIntentToValueForField, summarizeMappings, getLatestExperience, getEducationForField, getExperienceForField, REFERENCE_EDUCATION, REFERENCE_EXPERIENCES, SENSITIVE_TYPES };
