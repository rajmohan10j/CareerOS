const FIELD_SELECTORS = [
  "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset])",
  "textarea",
  "select",
];

function findSectionHeading(el) {
  let current = el.parentElement;
  let depth = 0;
  while (current && depth < 10) {
    const headings = current.querySelectorAll("h1, h2, h3, h4, h5, h6, legend");
    for (const h of headings) {
      const text = (h.textContent || "").trim().toLowerCase();
      if (text) return text;
    }
    const prev = current.previousElementSibling;
    if (prev) {
      const tag = prev.tagName || "";
      if (tag.startsWith("H") || tag === "LEGEND") {
        const text = (prev.textContent || "").trim().toLowerCase();
        if (text) return text;
      }
    }
    current = current.parentElement;
    depth++;
  }
  return null;
}

function findLabel(el) {
  if (el.id) {
    const labelByFor = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (labelByFor) return labelByFor.textContent.trim();
  }
  let current = el.parentElement;
  let depth = 0;
  while (current && depth < 8) {
    const label = current.querySelector("label");
    if (label && label !== el) {
      const text = label.textContent.trim();
      if (text) return text;
    }
    current = current.parentElement;
    depth++;
  }
  if (el.closest("label")) {
    const text = el.closest("label").textContent.trim();
    if (text) return text;
  }
  const prev = el.previousElementSibling;
  if (prev) {
    const tag = (prev.tagName || "").toLowerCase();
    if (["label", "span", "div", "p", "strong"].includes(tag)) {
      const text = prev.textContent.trim();
      if (text) return text;
    }
  }
  return null;
}

function findNearbyText(el) {
  const parent = el.parentElement;
  if (!parent) return null;
  const allText = [];
  for (const node of parent.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || "").trim();
      if (text) allText.push(text);
    }
  }
  return allText.length > 0 ? allText.join(" ") : null;
}

function detectFields() {
  const results = [];
  const seen = new Set();

  document.querySelectorAll(FIELD_SELECTORS.join(", ")).forEach((el) => {
    if (seen.has(el)) return;
    seen.add(el);

    const tagName = (el.tagName || "").toLowerCase();
    const inputType = el.type || null;
    const fieldType =
      tagName === "textarea"
        ? "textarea"
        : tagName === "select"
          ? "select"
          : inputType || "text";

    const name = el.name || null;
    const id = el.id || null;
    const placeholder = el.placeholder || null;
    const ariaLabel = el.getAttribute("aria-label") || null;
    const label = findLabel(el);
    const nearbyText = findNearbyText(el);
    const sectionHeading = findSectionHeading(el);
    const required = el.required || el.getAttribute("aria-required") === "true";
    const readOnly = el.readOnly || false;
    const disabled = el.disabled || false;

    let options = null;
    if (tagName === "select") {
      options = Array.from(el.options)
        .map((o) => ({ value: o.value, text: o.text.trim() }))
        .filter((o) => o.value !== "" || o.text !== "");
    }

    const rect = el.getBoundingClientRect();
    const position = {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };

    const radios = [];
    if (inputType === "radio" && name) {
      document
        .querySelectorAll(`input[type="radio"][name="${CSS.escape(name)}"]`)
        .forEach((r) => {
          if (!seen.has(r)) seen.add(r);
          const labelText = findLabel(r);
          radios.push({ value: r.value, label: labelText });
        });
    }

    results.push({
      tagName,
      fieldType,
      inputType,
      name,
      id,
      placeholder,
      ariaLabel,
      label,
      nearbyText,
      sectionHeading,
      required,
      readOnly,
      disabled,
      options,
      position,
      radios: radios.length > 0 ? radios : null,
    });
  });

  return results;
}

export { detectFields, FIELD_SELECTORS };
