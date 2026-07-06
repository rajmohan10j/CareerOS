const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

function noActiveTabResponse(kind) {
  if (kind === "fill") {
    return { success: false, error: "No active tab", filled: 0, skipped: 0, failed: 0 };
  }
  return { success: false, error: "No active tab", fieldCount: 0, fields: [] };
}

function failedPageResponse(message, kind) {
  const help = message && message.includes("Cannot access")
    ? "This page cannot be accessed by the extension. Try a normal job application page and reload it."
    : "CareerOS could not connect to this page yet. Reload the job page and try again.";
  if (kind === "fill") {
    return { success: false, error: `${message}. ${help}`, filled: 0, skipped: 0, failed: 0 };
  }
  return { success: false, error: `${message}. ${help}`, fieldCount: 0, fields: [] };
}

function sendToActiveTab(payload, kind, sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      sendResponse(noActiveTabResponse(kind));
      return;
    }

    const forward = () => {
      chrome.tabs.sendMessage(tab.id, payload, (response) => {
        const error = chrome.runtime.lastError;
        if (!error) {
          sendResponse(response || failedPageResponse("No response from content script", kind));
          return;
        }

        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, files: ["src/content.js"] },
          () => {
            const injectError = chrome.runtime.lastError;
            if (injectError) {
              sendResponse(failedPageResponse(injectError.message, kind));
              return;
            }
            chrome.tabs.sendMessage(tab.id, payload, (retryResponse) => {
              const retryError = chrome.runtime.lastError;
              if (retryError) {
                sendResponse(failedPageResponse(retryError.message, kind));
                return;
              }
              sendResponse(retryResponse || failedPageResponse("No response from content script", kind));
            });
          }
        );
      });
    };

    forward();
  });
}

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
    sendToActiveTab({ type: "DETECT_FIELDS" }, "detect", sendResponse);
    return true;
  }

  if (message.type === "GET_PAGE_INFO") {
    sendToActiveTab({ type: "GET_PAGE_INFO" }, "detect", sendResponse);
    return true;
  }

  if (message.type === "FILL_FIELDS") {
    sendToActiveTab({ type: "FILL_FIELDS", fields: message.fields }, "fill", sendResponse);
    return true;
  }
});
