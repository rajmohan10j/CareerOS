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
  });
})();
