const FIELD_SELECTORS = [
  "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset])",
  "textarea",
  "select",
];

function cleanText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function getTextByIds(value) {
  if (!value) return null;
  const text = value
    .split(/\s+/)
    .map((id) => document.getElementById(id))
    .filter(Boolean)
    .map((el) => cleanText(el.textContent))
    .filter(Boolean)
    .join(" ");
  return text || null;
}

function findSectionHeading(el) {
  const nearbyBlock = findNearestRepeatingBlockHeading(el);
  if (nearbyBlock) return nearbyBlock;

  let current = el.parentElement;
  let depth = 0;
  while (current && depth < 10) {
    const headings = current.querySelectorAll("h1, h2, h3, h4, h5, h6, legend");
    for (const h of headings) {
      const text = cleanText(h.textContent).toLowerCase();
      if (text) return text;
    }
    const prev = current.previousElementSibling;
    if (prev) {
      const tag = prev.tagName || "";
      if (tag.startsWith("H") || tag === "LEGEND") {
        const text = cleanText(prev.textContent).toLowerCase();
        if (text) return text;
      }
    }
    current = current.parentElement;
    depth++;
  }
  return null;
}

function findNearestRepeatingBlockHeading(el) {
  const rect = el.getBoundingClientRect();
  let best = null;
  const candidates = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, legend, [role='heading'], div, span, p, strong"));
  for (const candidate of candidates) {
    const text = cleanText(candidate.textContent);
    if (!/^(work\s+experience|education)\s+\d+$/i.test(text)) continue;
    const candidateRect = candidate.getBoundingClientRect();
    if (candidateRect.width <= 0 || candidateRect.height <= 0) continue;
    if (candidateRect.top > rect.top) continue;
    if (!best || candidateRect.top > best.top) {
      best = { text: text.toLowerCase(), top: candidateRect.top };
    }
  }
  return best?.text || null;
}

function findLabel(el) {
  const labelledBy = getTextByIds(el.getAttribute("aria-labelledby"));
  if (labelledBy) return labelledBy;

  const describedBy = getTextByIds(el.getAttribute("aria-describedby"));
  if (describedBy) return describedBy;

  if (el.id) {
    const labelByFor = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (labelByFor) return cleanText(labelByFor.textContent);
  }
  let current = el.parentElement;
  let depth = 0;
  while (current && depth < 8) {
    const label = current.querySelector("label");
    if (label && label !== el) {
      const text = cleanText(label.textContent);
      if (isDateMaskText(text)) {
        current = current.parentElement;
        depth++;
        continue;
      }
      if (text) return text;
    }
    current = current.parentElement;
    depth++;
  }
  if (el.closest("label")) {
    const text = cleanText(el.closest("label").textContent);
    if (text) return text;
  }
  const prev = el.previousElementSibling;
  if (prev) {
    const tag = (prev.tagName || "").toLowerCase();
    if (["label", "span", "div", "p", "strong"].includes(tag)) {
      const text = cleanText(prev.textContent);
      if (text) return text;
    }
  }
  return null;
}

function findPrecedingText(el) {
  let current = el;
  let hops = 0;
  while (current && hops < 6) {
    let prev = current.previousElementSibling;
    while (prev) {
      const tag = (prev.tagName || "").toLowerCase();
      const text = cleanText(prev.textContent);
      if (isDateMaskText(text)) {
        prev = prev.previousElementSibling;
        continue;
      }
      if (text && ["label", "span", "div", "p", "strong", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        if (text.length > 2 && text.length < 240) return text;
      }
      prev = prev.previousElementSibling;
    }
    current = current.parentElement;
    hops++;
  }
  return null;
}

function findNearbyText(el) {
  const parent = el.parentElement;
  if (!parent) return null;
  const allText = [];
  for (const node of parent.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = cleanText(node.textContent);
      if (text) allText.push(text);
    }
  }
  return allText.length > 0 ? cleanText(allText.join(" ")) : findPrecedingText(el);
}

function isDateMaskText(text) {
  return /^(m{1,2}\/?y{2,4}|y{2,4}|mm\/yyyy|yyyy)$/i.test(cleanText(text || ""));
}

function findRadioGroupLabel(el) {
  const fieldset = el.closest("fieldset");
  if (fieldset) {
    const legend = fieldset.querySelector("legend");
    if (legend && legend.textContent.trim()) return legend.textContent.trim();
  }

  let current = el.parentElement;
  let depth = 0;
  while (current && depth < 5) {
      const text = cleanText(current.textContent);
    if (text && text.length > 3) {
      const cleaned = text.replace(/\b(yes|no)\b/gi, "").replace(/\s+/g, " ").trim();
      if (cleaned.length > 3 && cleaned.length < 220) return cleaned;
    }
    current = current.parentElement;
    depth++;
  }
  return null;
}

function makeFieldKey(index, field) {
  return [
    index,
    field.id || "",
    field.name || "",
    field.label || field.ariaLabel || field.placeholder || field.nearbyText || "",
  ].join("|");
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
    const label = inputType === "radio" ? findRadioGroupLabel(el) || findLabel(el) : findLabel(el);
    const nearbyText = findNearbyText(el);
    const currentValue = inputType === "checkbox" || inputType === "radio" ? (el.checked ? "checked" : "") : el.value || "";
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
    const visibleInViewport = rect.bottom >= 0 && rect.top <= window.innerHeight && rect.right >= 0 && rect.left <= window.innerWidth;
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

    const field = {
      tagName,
      fieldType,
      inputType,
      name,
      id,
      placeholder,
      ariaLabel,
      label,
      nearbyText,
      currentValue,
      sectionHeading,
      required,
      readOnly,
      disabled,
      options,
      position,
      visibleInViewport,
      radios: radios.length > 0 ? radios : null,
    };
    field.fieldKey = makeFieldKey(results.length, field);
    results.push(field);
  });

  return results;
}

export { detectFields, FIELD_SELECTORS };
