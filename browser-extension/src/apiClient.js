const DEFAULT_BACKEND_URL = "http://localhost:8000";

function getStoredBackendUrl() {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get({ backendUrl: DEFAULT_BACKEND_URL }, (items) => {
        resolve(items.backendUrl || DEFAULT_BACKEND_URL);
      });
    } else {
      resolve(DEFAULT_BACKEND_URL);
    }
  });
}

async function checkHealth() {
  const baseUrl = await getStoredBackendUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      return { status: "error", message: `HTTP ${resp.status}` };
    }
    const data = await resp.json();
    return { status: "ok", data };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { status: "error", message: "Connection timed out" };
    }
    return { status: "error", message: err.message };
  }
}

export { checkHealth, getStoredBackendUrl, DEFAULT_BACKEND_URL };
