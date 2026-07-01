const SENSITIVE_TYPES = new Set([
  "phone",
  "address",
  "salary_expectation",
  "work_authorization",
  "diversity",
  "equal_opportunity",
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

function mapIntentToValue(intent, profile, skills, experiences) {
  switch (intent) {
    case "full_name": {
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

    case "first_name": {
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

    case "last_name": {
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

    case "email":
      return {
        value: null,
        status: "missing",
        confidence: 0,
        message: "No email in profile — add email to CareerOS profile",
      };

    case "phone":
      return {
        value: null,
        status: "missing",
        sensitive: true,
        confidence: 0,
        message: "No phone in profile — add phone to CareerOS profile (sensitive field)",
      };

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
      const latest = getLatestExperience(experiences);
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
      const latest = getLatestExperience(experiences);
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

    case "experience": {
      if (experiences && experiences.length > 0) {
        const summary = experiences
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
        return {
          value: profile.salaryExpectations,
          status: "available",
          sensitive: true,
          confidence: 0.6,
          message: "From profile salary expectations (verify before filling)",
        };
      }
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "No salary expectation in profile — requires manual input (sensitive field)",
      };
    }

    case "work_authorization":
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "Work authorization requires manual input (sensitive field)",
      };

    case "notice_period":
      return {
        value: null,
        status: "manual_review",
        sensitive: true,
        confidence: 0,
        message: "Notice period requires manual input (sensitive field)",
      };

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

  return fields.map((field) => {
    const mapping = mapIntentToValue(field.intent, profile, skills, experiences);
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

export { mapFields, mapIntentToValue, summarizeMappings, getLatestExperience, SENSITIVE_TYPES };
