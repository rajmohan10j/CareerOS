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
    if (message.type === "FILL_FIELDS") {
      try {
        const result = fillApprovedFields(message.fields || []);
        sendResponse(result);
      } catch (err) {
        sendResponse({
          success: false,
          error: err.message,
          filled: 0,
          skipped: message.fields ? message.fields.length : 0,
          failed: 0,
          details: { error: err.message },
        });
      }
      return;
    }
  });

  function findFieldElement(field) {
    if (field.id) {
      const el = document.getElementById(field.id);
      if (el) return el;
    }
    if (field.name) {
      const el = document.querySelector(`[name="${CSS.escape(field.name)}"]`);
      if (el) return el;
    }
    return null;
  }

  function isFillableElement(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    if (tag !== "input" && tag !== "textarea" && tag !== "select") return false;
    if (el.disabled) return false;
    if (el.readOnly) return false;
    if (tag === "input") {
      const type = (el.type || "text").toLowerCase();
      if (type === "password") return false;
      if (type === "hidden") return false;
      if (type === "file") return false;
      if (type === "submit") return false;
      if (type === "button") return false;
      if (type === "reset") return false;
      if (type === "image") return false;
      if (type === "radio") return false;
      if (type === "checkbox") return false;
    }
    return true;
  }

  function fillElement(el, value) {
    const tag = el.tagName.toLowerCase();
    if (tag === "select") {
      const optionExists = Array.from(el.options).some(
        (o) => o.value === value || o.text === value
      );
      if (!optionExists) return false;
      el.value = value;
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function highlightFilled(el) {
    const origOutline = el.style.outline;
    const origOutlineOffset = el.style.outlineOffset;
    el.style.outline = "2px solid #2e7d32";
    el.style.outlineOffset = "1px";
    setTimeout(() => {
      el.style.outline = origOutline;
      el.style.outlineOffset = origOutlineOffset;
    }, 2000);
  }

  function fillApprovedFields(fields) {
    let filled = 0;
    let skipped = 0;
    let failed = 0;
    const details = {
      skippedMissing: 0,
      skippedUnfillable: 0,
      skippedNotFound: 0,
      filledFields: [],
      skippedNotFoundFields: [],
      skippedUnfillableFields: [],
      skippedMissingFields: [],
    };

    for (const field of fields) {
      const el = findFieldElement(field);
      if (!el) {
        skipped++;
        details.skippedNotFound++;
        details.skippedNotFoundFields.push(field.intent);
        continue;
      }
      if (!isFillableElement(el)) {
        skipped++;
        details.skippedUnfillable++;
        details.skippedUnfillableFields.push(field.intent);
        continue;
      }
      const ok = fillElement(el, field.value);
      if (ok) {
        filled++;
        details.filledFields.push(field.intent);
        highlightFilled(el);
      } else {
        failed++;
      }
    }

    return {
      success: true,
      filled,
      skipped,
      failed,
      total: fields.length,
      details,
    };
  }
})();
