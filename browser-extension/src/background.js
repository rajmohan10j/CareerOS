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

  if (message.type === "DETECT_FIELDS") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) {
        sendResponse({ success: false, error: "No active tab", fieldCount: 0, fields: [] });
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: "DETECT_FIELDS" }, (response) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message, fieldCount: 0, fields: [] });
          return;
        }
        sendResponse(response || { success: false, error: "No response from content script", fieldCount: 0, fields: [] });
      });
    });
    return true;
  }
});
