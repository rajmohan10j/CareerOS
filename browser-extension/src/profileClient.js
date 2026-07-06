import { getStoredBackendUrl } from "./apiClient.js";

async function fetchProfile() {
  const baseUrl = await getStoredBackendUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`${baseUrl}/profile`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { success: true, data: normalizeProfile(data) };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, error: err.name === "AbortError" ? "Connection timed out" : err.message };
  }
}

function normalizeProfile(raw) {
  const locations = parseJsonField(raw.locations);
  const targetRoles = parseJsonField(raw.target_roles);
  const industries = parseJsonField(raw.industries);
  const salaryExpectations = parseJsonField(raw.salary_expectations);
  const preferences = parseJsonField(raw.preferences_json);

  return {
    id: raw.id || null,
    summary: raw.summary || null,
    targetRoles,
    industries,
    locations,
    salaryExpectations,
    preferences,
  };
}

function parseJsonField(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function fetchSkills() {
  const baseUrl = await getStoredBackendUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`${baseUrl}/skills`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { success: true, data };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, error: err.name === "AbortError" ? "Connection timed out" : err.message };
  }
}

async function fetchExperiences() {
  const baseUrl = await getStoredBackendUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`${baseUrl}/experiences`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { success: true, data };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, error: err.name === "AbortError" ? "Connection timed out" : err.message };
  }
}

async function fetchAllProfileData() {
  const [profile, skills, experiences, canonicalResume] = await Promise.all([
    fetchProfile(),
    fetchSkills(),
    fetchExperiences(),
    fetchCanonicalResume(),
  ]);
  return { profile, skills, experiences, canonicalResume };
}

async function fetchCanonicalResume() {
  const baseUrl = await getStoredBackendUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`${baseUrl}/canonical-resume`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { success: true, data };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, error: err.name === "AbortError" ? "Connection timed out" : err.message };
  }
}

async function saveFieldObservations(page, fields) {
  const baseUrl = await getStoredBackendUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`${baseUrl}/canonical-resume/field-observations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        url: page?.url || null,
        title: page?.title || null,
        fields: (fields || []).map((field) => ({
          fieldKey: field.fieldKey,
          label: field.label || field.placeholder || field.ariaLabel || field.name || null,
          intent: field.intent || "unknown",
          fieldType: field.fieldType || null,
          inputType: field.inputType || null,
          sectionHeading: field.sectionHeading || null,
          required: Boolean(field.required),
          confidence: field.confidence ?? null,
        })),
      }),
    });
    clearTimeout(timeout);
    if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { success: true, data };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, error: err.name === "AbortError" ? "Connection timed out" : err.message };
  }
}

export {
  fetchProfile,
  fetchSkills,
  fetchExperiences,
  fetchCanonicalResume,
  saveFieldObservations,
  fetchAllProfileData,
  normalizeProfile,
};
