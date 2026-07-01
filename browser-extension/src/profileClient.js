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

  return {
    id: raw.id || null,
    summary: raw.summary || null,
    targetRoles,
    industries,
    locations,
    salaryExpectations,
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
  const [profile, skills, experiences] = await Promise.all([
    fetchProfile(),
    fetchSkills(),
    fetchExperiences(),
  ]);
  return { profile, skills, experiences };
}

export { fetchProfile, fetchSkills, fetchExperiences, fetchAllProfileData, normalizeProfile };
