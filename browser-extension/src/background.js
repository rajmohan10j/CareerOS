const DEFAULT_BACKEND_URL = "http://localhost:8000";

chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.sync.get("backendUrl", (items) => {
    if (!items.backendUrl) {
      chrome.storage.sync.set({ backendUrl: DEFAULT_BACKEND_URL });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_HEALTH") {
    chrome.storage.sync.get({ backendUrl: DEFAULT_BACKEND_URL }, async (items) => {
      const baseUrl = items.backendUrl;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const resp = await fetch(`${baseUrl}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!resp.ok) {
          sendResponse({ status: "error", message: `HTTP ${resp.status}` });
          return;
        }
        const data = await resp.json();
        sendResponse({ status: "ok", data });
      } catch (err) {
        clearTimeout(timeout);
        sendResponse({
          status: "error",
          message: err.name === "AbortError" ? "Connection timed out" : err.message,
        });
      }
    });
    return true;
  }
});
