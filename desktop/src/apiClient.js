const DEFAULT_BACKEND_URL = "http://localhost:8000";

let _cachedBackendUrl = null;

function getStoredBackendUrl() {
  if (_cachedBackendUrl) return Promise.resolve(_cachedBackendUrl);
  try {
    const stored = localStorage.getItem("careeros_backend_url");
    _cachedBackendUrl = stored || DEFAULT_BACKEND_URL;
  } catch {
    _cachedBackendUrl = DEFAULT_BACKEND_URL;
  }
  return Promise.resolve(_cachedBackendUrl);
}

function setStoredBackendUrl(url) {
  _cachedBackendUrl = url || DEFAULT_BACKEND_URL;
  try {
    localStorage.setItem("careeros_backend_url", _cachedBackendUrl);
  } catch {
  }
}

async function checkHealth() {
  const baseUrl = await getStoredBackendUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const startTime = Date.now();
  try {
    const resp = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
    });
    const elapsed = Date.now() - startTime;
    clearTimeout(timeout);
    if (!resp.ok) {
      return { status: "error", message: `Backend returned HTTP ${resp.status}`, elapsed };
    }
    const data = await resp.json();
    return { status: "ok", data, elapsed };
  } catch (err) {
    const elapsed = Date.now() - startTime;
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { status: "error", message: `Connection timed out after 5s`, elapsed };
    }
    return { status: "error", message: `Connection error: ${err.message}`, elapsed };
  }
}

async function fetchAnalytics() {
  const baseUrl = await getStoredBackendUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`${baseUrl}/analytics/summary`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      return { status: "error", message: `Analytics returned HTTP ${resp.status}` };
    }
    const data = await resp.json();
    return { status: "ok", data };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { status: "error", message: "Analytics request timed out" };
    }
    return { status: "error", message: `Analytics error: ${err.message}` };
  }
}

export { checkHealth, fetchAnalytics, getStoredBackendUrl, setStoredBackendUrl, DEFAULT_BACKEND_URL };
