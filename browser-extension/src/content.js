import { detectFields } from "./fieldDetector.js";
import { classifyFields } from "./fieldClassifier.js";

(function () {
  "use strict";

  console.log("[CareerOS] Content script loaded (v0.1.0)");

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "PING") {
      sendResponse({ ready: true, version: "0.1.0" });
      return;
    }
    if (message.type === "GET_PAGE_INFO") {
      sendResponse({
        url: window.location.href,
        title: document.title,
      });
      return;
    }
    if (message.type === "DETECT_FIELDS") {
      try {
        const raw = detectFields();
        const classified = classifyFields(raw);
        sendResponse({
          success: true,
          fieldCount: classified.length,
          fields: classified,
          url: window.location.href,
        });
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message,
          fieldCount: 0,
          fields: [],
        });
      }
      return;
    }
  });
})();
