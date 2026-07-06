const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

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

async function checkHealth(backendUrl) {
  const baseUrl = backendUrl || await getStoredBackendUrl();
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
      return { status: "error", message: `Backend returned HTTP ${resp.status} — check that the server is running correctly`, elapsed };
    }
    const data = await resp.json();
    return { status: "ok", data, elapsed };
  } catch (err) {
    const elapsed = Date.now() - startTime;
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { status: "error", message: `Connection timed out after 5s — is your backend running at ${baseUrl}?`, elapsed };
    }
    if (err.message.includes("fetch")) {
      return { status: "error", message: `Could not reach backend at ${baseUrl} — ensure the server is started and the URL is correct`, elapsed };
    }
    return { status: "error", message: `Connection error: ${err.message}`, elapsed };
  }
}

export { checkHealth, getStoredBackendUrl, DEFAULT_BACKEND_URL };
