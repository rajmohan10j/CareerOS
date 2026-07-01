const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

let _cachedBackendUrl = null;

function normalizeUrl(str) {
  if (typeof str !== "string") return str;
  return str.trim().replace(/\/+$/, "");
}

function isValidUrl(str) {
  if (!str || typeof str !== "string") return false;
  if (str === "[object Promise]" || str === "[object Object]") return false;
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeUrl(url) {
  const normalized = normalizeUrl(url);
  return isValidUrl(normalized) ? normalized : DEFAULT_BACKEND_URL;
}

function getStoredBackendUrl() {
  try {
    const stored = localStorage.getItem("careeros_backend_url");
    const valid = sanitizeUrl(stored);
    _cachedBackendUrl = valid;
    return valid;
  } catch {
    if (_cachedBackendUrl && isValidUrl(_cachedBackendUrl)) {
      return _cachedBackendUrl;
    }
    _cachedBackendUrl = DEFAULT_BACKEND_URL;
    return DEFAULT_BACKEND_URL;
  }
}

function setStoredBackendUrl(url) {
  _cachedBackendUrl = sanitizeUrl(url);
  try {
    localStorage.setItem("careeros_backend_url", _cachedBackendUrl);
  } catch {
  }
}

async function checkHealth() {
  const baseUrl = await getStoredBackendUrl();
  const endpoint = "/health";
  const url = `${baseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const startTime = Date.now();
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
    });
    const elapsed = Date.now() - startTime;
    clearTimeout(timeout);
    if (!resp.ok) {
      return { status: "error", message: `Health check failed — ${url} returned HTTP ${resp.status}. Ensure the backend is running at ${baseUrl}.`, elapsed, url, endpoint };
    }
    const data = await resp.json();
    return { status: "ok", data, elapsed, url, endpoint };
  } catch (err) {
    const elapsed = Date.now() - startTime;
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { status: "error", message: `Health check timed out after 5s for ${url}. Ensure the backend is running at ${baseUrl}.`, elapsed, url, endpoint };
    }
    return { status: "error", message: `Health check failed for ${url} — ${err.message}. Ensure the backend is running at ${baseUrl}.`, elapsed, url, endpoint };
  }
}

async function apiFetch(endpoint) {
  const baseUrl = await getStoredBackendUrl();
  const url = `${baseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) {
      const detail = await resp.json().catch(() => ({}));
      return { status: "error", message: `${endpoint} returned HTTP ${resp.status}${detail.detail ? ": " + detail.detail : ""}. Ensure the backend is running at ${baseUrl}.` };
    }
    const data = await resp.json();
    return { status: "ok", data };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { status: "error", message: `Request timed out for ${url}. Ensure the backend is running at ${baseUrl}.` };
    }
    return { status: "error", message: `Failed to fetch ${url} — ${err.message}. Ensure the backend is running at ${baseUrl}.` };
  }
}

async function apiPost(endpoint, body) {
  const baseUrl = await getStoredBackendUrl();
  const url = `${baseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      const detail = await resp.json().catch(() => ({}));
      return { status: "error", message: `${endpoint} returned HTTP ${resp.status}${detail.detail ? ": " + detail.detail : ""}.` };
    }
    const data = await resp.json();
    return { status: "ok", data };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { status: "error", message: `Request timed out for ${url}.` };
    }
    return { status: "error", message: `Failed to POST ${url} — ${err.message}.` };
  }
}

async function apiPut(endpoint, body) {
  const baseUrl = await getStoredBackendUrl();
  const url = `${baseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      const detail = await resp.json().catch(() => ({}));
      return { status: "error", message: `${endpoint} returned HTTP ${resp.status}${detail.detail ? ": " + detail.detail : ""}.` };
    }
    const data = await resp.json();
    return { status: "ok", data };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { status: "error", message: `Request timed out for ${url}.` };
    }
    return { status: "error", message: `Failed to PUT ${url} — ${err.message}.` };
  }
}

async function fetchProfile() {
  return apiFetch("/profile");
}

async function saveProfile(data) {
  return apiPut("/profile", data);
}

async function fetchResumes() {
  return apiFetch("/resumes");
}

async function fetchJobs() {
  return apiFetch("/jobs");
}

async function createResume(data) {
  return apiPost("/resumes", data);
}

async function generateResume(data) {
  return apiPost("/resumes/generate", data);
}

async function createJob(data) {
  return apiPost("/jobs", data);
}

async function evaluateJobText(description) {
  return apiPost("/jobs/evaluate-text", { description });
}

async function fetchApplications() {
  return apiFetch("/applications");
}

async function createApplication(data) {
  return apiPost("/applications", data);
}

async function fetchDocuments() {
  return apiFetch("/documents");
}

async function createDocument(data) {
  return apiPost("/documents", data);
}

async function fetchAiProviders() {
  return apiFetch("/ai/providers");
}

async function fetchAiModels() {
  return apiFetch("/ai/models");
}

async function fetchAiHealth() {
  return apiFetch("/ai/health");
}

async function fetchAnalytics() {
  const baseUrl = await getStoredBackendUrl();
  const endpoint = "/analytics/summary";
  const url = `${baseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      return { status: "error", message: `Analytics fetch failed — ${url} returned HTTP ${resp.status}. Ensure the backend is running at ${baseUrl}.`, url, endpoint };
    }
    const data = await resp.json();
    return { status: "ok", data, url, endpoint };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { status: "error", message: `Analytics request timed out for ${url}. Ensure the backend is running at ${baseUrl}.`, url, endpoint };
    }
    return { status: "error", message: `Analytics fetch failed for ${url} — ${err.message}. Ensure the backend is running at ${baseUrl}.`, url, endpoint };
  }
}

export {
  checkHealth,
  fetchAnalytics,
  getStoredBackendUrl,
  setStoredBackendUrl,
  DEFAULT_BACKEND_URL,
  fetchProfile,
  saveProfile,
  fetchResumes,
  createResume,
  generateResume,
  fetchJobs,
  createJob,
  evaluateJobText,
  fetchApplications,
  createApplication,
  fetchDocuments,
  createDocument,
  fetchAiProviders,
  fetchAiModels,
  fetchAiHealth,
};
