function buildApprovedFillFields(approvalStore, mappedFields) {
  if (!approvalStore || !mappedFields) return [];
  const approvedIntents = approvalStore.getApproved();
  return mappedFields
    .filter((f) => approvedIntents.includes(f.intent))
    .filter((f) => f.mappedValue != null && String(f.mappedValue).trim() !== "")
    .filter((f) => {
      const tag = (f.tagName || "").toLowerCase();
      const type = (f.fieldType || f.inputType || "").toLowerCase();
      if (tag === "input" && type === "file") return false;
      return true;
    })
    .map((f) => ({
      intent: f.intent,
      value: String(f.mappedValue),
      name: f.name || null,
      id: f.id || null,
      tagName: (f.tagName || "input").toLowerCase(),
      fieldType: f.fieldType || "text",
      inputType: f.inputType || null,
    }));
}

function executeFill(fields) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "FILL_FIELDS", fields }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message, filled: 0, skipped: 0, failed: 0 });
        return;
      }
      resolve(response || { success: false, error: "No response from background", filled: 0, skipped: 0, failed: 0 });
    });
  });
}

export { buildApprovedFillFields, executeFill };
