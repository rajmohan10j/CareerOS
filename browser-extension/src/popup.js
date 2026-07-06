import { checkHealth } from "./apiClient.js";
import { fetchAllProfileData, saveFieldObservations } from "./profileClient.js";
import { mapFields, summarizeMappings } from "./autofillMapper.js";
import { createApprovalStore } from "./approvalState.js";
import { buildPreviewContainerHTML, buildApprovalSummaryHTML } from "./mappingPreview.js";
import { buildApprovedFillFields, executeFill } from "./autofillExecutor.js";
import { selectStaticAnswers, buildQuickCopyText } from "./staticAnswers.js";
import { ensureApplicationSession, getNextPendingEntry, markEntryFilled } from "./applicationSessionClient.js";

const statusEl = document.getElementById("backendStatus");
const versionEl = document.getElementById("backendVersion");
const modeEl = document.getElementById("backendMode");
const errorDetailEl = document.getElementById("errorDetail");
const optionsLink = document.getElementById("openOptionsLink");
const detectBtn = document.getElementById("detectFieldsBtn");
const fillNextPendingBtn = document.getElementById("fillNextPendingBtn");
const fieldSummary = document.getElementById("fieldSummary");
const fieldCountEl = document.getElementById("fieldCount");
const fieldDebug = document.getElementById("fieldDebug");
const toggleDebugBtn = document.getElementById("toggleDebugBtn");
const debugContent = document.getElementById("debugContent");

const mappingSection = document.getElementById("mappingSection");
const mapBtn = document.getElementById("mapFieldsBtn");
const mappingSummary = document.getElementById("mappingSummary");
const mappingDebug = document.getElementById("mappingDebug");
const toggleMappingBtn = document.getElementById("toggleMappingBtn");
const mappingContent = document.getElementById("mappingContent");

const approvalSection = document.getElementById("approvalSection");
const selectAllSafeBtn = document.getElementById("selectAllSafeBtn");
const selectStaticAnswersBtn = document.getElementById("selectStaticAnswersBtn");
const copyStaticAnswersBtn = document.getElementById("copyStaticAnswersBtn");
const resetApprovalsBtn = document.getElementById("resetApprovalsBtn");
const approvalSummaryEl = document.getElementById("approvalSummary");
const previewContent = document.getElementById("previewContent");
const fillBtn = document.getElementById("fillFieldsBtn");
const fillResultEl = document.getElementById("fillResult");

let lastDetectedFields = null;
let lastProfileData = null;
let lastMappedFields = null;
let approvalStore = null;

function showError(message) {
  errorDetailEl.textContent = "⚠ " + message;
  errorDetailEl.classList.remove("hidden");
}

function showSuccess(message) {
  errorDetailEl.textContent = "✓ " + message;
  errorDetailEl.className = "error-detail success-detail";
  errorDetailEl.classList.remove("hidden");
}

function hideError() {
  errorDetailEl.classList.add("hidden");
  errorDetailEl.className = "error-detail";
}

function updateStatus(online, data) {
  if (online) {
    statusEl.textContent = "Online";
    statusEl.className = "status-indicator online";
    versionEl.textContent = data.version || "—";
    modeEl.textContent = data.mode || "—";
    hideError();
  } else {
    statusEl.textContent = "Offline";
    statusEl.className = "status-indicator offline";
    versionEl.textContent = "—";
    modeEl.textContent = "—";
  }
}

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.openOptionsPage();
  }
});

function renderDebugTable(fields) {
  if (!fields || fields.length === 0) {
    debugContent.innerHTML = "<p class='debug-empty'>No fields detected.</p>";
    return;
  }
  const table = document.createElement("table");
  table.className = "debug-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Type</th>
        <th>Intent</th>
        <th>Confidence</th>
        <th>Sensitive</th>
        <th>Label / Placeholder</th>
      </tr>
    </thead>
    <tbody>
      ${fields
        .map(
          (f, i) => {
            const confidencePct = f.confidence != null ? (f.confidence * 100).toFixed(0) + "%" : "—";
            const lowConf = f.confidence != null && f.confidence < 0.6;
            return `
        <tr class="${lowConf ? "row-low-confidence" : ""}">
          <td>${i + 1}</td>
          <td>${f.fieldType || f.inputType || "—"}</td>
          <td>${f.intent || "unknown"}${lowConf ? ' <span class="low-conf-indicator" title="Low confidence — verify intent">⚠</span>' : ""}</td>
          <td class="${lowConf ? "conf-low" : "conf-ok"}">${confidencePct}</td>
          <td class="${f.sensitive ? "sensitive-yes" : "sensitive-no"}">${f.sensitive ? "Yes" : "No"}</td>
          <td class="debug-signal">${f.label || f.placeholder || f.ariaLabel || f.name || "—"}</td>
        </tr>`;
        })
        .join("")}
    </tbody>
  `;
  debugContent.innerHTML = "";
  debugContent.appendChild(table);
}

detectBtn.addEventListener("click", async () => {
  detectBtn.disabled = true;
  detectBtn.textContent = "Detecting...";
  fieldSummary.classList.add("hidden");
  fieldDebug.classList.add("hidden");
  mappingSection.classList.add("hidden");
  approvalSection.classList.add("hidden");
  fillResultEl.classList.add("hidden");
  lastDetectedFields = null;

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "DETECT_FIELDS" }, resolve);
    });

    if (response && response.success) {
      lastDetectedFields = scopeFieldsForCurrentView(dedupeDetectedFields(response.fields));
      const page = await sendRuntimeMessage({ type: "GET_PAGE_INFO" });
      saveFieldObservations(page, lastDetectedFields);
      fieldSummary.classList.remove("hidden");
      fieldCountEl.textContent = lastDetectedFields.length;
      if (lastDetectedFields.length > 0) {
        fieldDebug.classList.remove("hidden");
        mappingSection.classList.remove("hidden");
        renderDebugTable(lastDetectedFields);
      }
    } else {
      showError(response?.error || "Field detection failed");
    }
  } catch (err) {
    showError("Detection error: " + err.message);
  } finally {
    detectBtn.disabled = false;
    detectBtn.textContent = "Detect Form Fields";
  }
});

fillNextPendingBtn.addEventListener("click", async () => {
  fillNextPendingBtn.disabled = true;
  fillNextPendingBtn.textContent = "Filling next...";
  fillResultEl.classList.add("hidden");

  try {
    const page = await sendRuntimeMessage({ type: "GET_PAGE_INFO" });
    if (!page || !page.url) throw new Error("Could not read the active application page.");

    await ensureApplicationSession(page);

    const detected = await sendRuntimeMessage({ type: "DETECT_FIELDS" });
    if (!detected?.success || !detected.fields?.length) {
      throw new Error(detected?.error || "No fields detected on this page.");
    }
    const detectedFields = scopeFieldsForCurrentView(dedupeDetectedFields(detected.fields));
    saveFieldObservations(page, detectedFields);

    const section = detectActiveSection(detectedFields);
    if (!section) {
      throw new Error("This page does not look like a Work Experience or Education entry section yet.");
    }

    const blockIndex = getCurrentBlockIndex(detectedFields, section);
    let next = null;
    let entry = null;
    let entryIndex = blockIndex;
    if (blockIndex != null) {
      const profileData = await fetchAllProfileData();
      const records = profileData?.canonicalResume?.data?.[section] || [];
      entry = records[blockIndex] || null;
      next = { index: blockIndex, entry, complete: !entry };
    } else {
      next = await getNextPendingEntry(page.url, section);
      entry = next.entry;
      entryIndex = next.index;
    }

    if (next.complete || !entry) {
      showSuccess(`All ${section} entries are already marked complete for this application.`);
      return;
    }

    const fillFields = buildNextEntryFillFields(detectedFields, section, entry);
    if (fillFields.length === 0) {
      throw new Error(`No empty ${section} fields are ready to fill on this page.`);
    }

    const result = await executeFill(fillFields);
    renderFillResult(result);
    if (result.success && result.filled > 0 && result.failed === 0) {
      await markEntryFilled(page.url, section, entryIndex, `Filled ${result.filled} field(s) from extension`);
      showSuccess(`Marked ${section} entry ${entryIndex + 1} complete.`);
    } else if (result.filled > 0) {
      showError(`Filled ${result.filled} field(s), but did not mark complete because ${result.failed || 0} failed.`);
    } else {
      showError("No fields were filled, so progress was not marked complete.");
    }
  } catch (err) {
    showError(err.message);
  } finally {
    fillNextPendingBtn.disabled = false;
    fillNextPendingBtn.textContent = "Fill Next Pending Entry";
  }
});

function sendRuntimeMessage(payload) {
  return new Promise((resolve) => chrome.runtime.sendMessage(payload, resolve));
}

function scopeFieldsForCurrentView(fields) {
  if (!Array.isArray(fields) || fields.length === 0) return [];
  const visible = fields.filter((f) => f.visibleInViewport !== false);
  const source = visible.length > 0 ? visible : fields;
  const blockScoped = chooseMostRelevantRepeatingBlock(source);
  if (blockScoped.length > 0) return blockScoped;
  const empty = source.filter((f) => isBlankCurrentValue(f.currentValue));
  return empty.length > 0 ? empty : source;
}

function getCurrentBlockIndex(fields, section) {
  const pattern = section === "experience" ? /work\s+experience\s+(\d+)/i : /education\s+(\d+)/i;
  for (const field of fields || []) {
    const text = [field.sectionHeading, field.label, field.nearbyText, field.fieldKey].filter(Boolean).join(" ");
    const match = text.match(pattern);
    if (match) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed - 1;
    }
  }
  return null;
}

function chooseMostRelevantRepeatingBlock(fields) {
  const groups = new Map();
  for (const field of fields) {
    const block = getRepeatingBlockLabel(field);
    if (!block) continue;
    if (!groups.has(block)) groups.set(block, []);
    groups.get(block).push(field);
  }
  if (groups.size === 0) return [];

  let bestBlock = null;
  let bestScore = -1;
  let bestIndex = -1;
  for (const [block, group] of groups.entries()) {
    const blankCount = group.filter((f) => isBlankCurrentValue(f.currentValue)).length;
    const editableCount = group.filter((f) => !f.disabled && !f.readOnly).length;
    const score = blankCount * 10 + editableCount;
    const blockIndex = parseRepeatingBlockIndex(block);
    if (score > bestScore || (score === bestScore && blockIndex > bestIndex)) {
      bestBlock = block;
      bestScore = score;
      bestIndex = blockIndex;
    }
  }
  return bestBlock ? groups.get(bestBlock) || [] : [];
}

function getRepeatingBlockLabel(field) {
  const text = [field?.sectionHeading, field?.nearbyText, field?.fieldKey].filter(Boolean).join(" ");
  const match = text.match(/\b(work\s+experience|education)\s+(\d+)\b/i);
  return match ? `${match[1].toLowerCase()} ${match[2]}` : null;
}

function parseRepeatingBlockIndex(block) {
  const match = String(block || "").match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : -1;
}

function dedupeDetectedFields(fields) {
  if (!Array.isArray(fields)) return [];
  const seen = new Set();
  const result = [];
  for (const field of fields) {
    if (isNoisySkippedDateField(field)) continue;
    const key = detectedFieldDedupeKey(field);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(field);
  }
  return result;
}

function dedupeMappedFields(fields) {
  if (!Array.isArray(fields)) return [];
  const seen = new Set();
  const result = [];
  for (const field of fields) {
    if (isNoisySkippedDateField(field)) continue;
    const key = mappedFieldDedupeKey(field);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(field);
  }
  return result;
}

function isNoisySkippedDateField(field) {
  const intent = field?.intent || "";
  if (!/_(start|end)_date$/.test(intent)) return false;
  const status = field?.mappingStatus || "";
  const message = field?.mappingMessage || "";
  return status === "manual_review" &&
    /not inside a Work Experience block/i.test(message);
}

function detectedFieldDedupeKey(field) {
  const intent = field?.intent || "unknown";
  const label = normalizeDedupeText(field?.label || field?.placeholder || field?.ariaLabel || field?.name || field?.id || "");
  const section = normalizeDedupeText(field?.sectionHeading || "");
  const id = normalizeDedupeText(field?.id || field?.name || "");
  if (/_(start|end)_date$/.test(intent)) return `${intent}|${id || label}|${section}`;
  return `${intent}|${label}|${section}`;
}

function mappedFieldDedupeKey(field) {
  const intent = field?.intent || "unknown";
  const label = normalizeDedupeText(field?.label || field?.placeholder || field?.ariaLabel || field?.name || field?.id || "");
  const value = normalizeDedupeText(field?.mappedValue ?? field?.value ?? "");
  const section = normalizeDedupeText(getRepeatingBlockLabel(field) || field?.sectionHeading || "");
  if (/_(start|end)_date$/.test(intent)) {
    return `${intent}|${label}|${value}|${field?.fieldKey || ""}`;
  }
  return `${intent}|${label}|${value}|${section}`;
}

function normalizeDedupeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function detectActiveSection(fields) {
  const visibleEmpty = fields.filter((f) => !f.disabled && !f.readOnly);
  const experienceCount = visibleEmpty.filter((f) => (f.intent || "").startsWith("experience_")).length;
  const educationCount = visibleEmpty.filter((f) => (f.intent || "").startsWith("education_")).length;
  if (experienceCount === 0 && educationCount === 0) return null;
  return experienceCount >= educationCount ? "experience" : "education";
}

function buildNextEntryFillFields(fields, section, entry) {
  return dedupeDetectedFields(fields)
    .filter((f) => (f.intent || "").startsWith(`${section}_`))
    .filter((f) => isBlankCurrentValue(f.currentValue))
    .map((f) => ({ ...f, value: valueForEntryIntent(f.intent, entry, f) }))
    .filter((f) => f.value != null && String(f.value).trim() !== "");
}

function valueForEntryIntent(intent, entry, field = null) {
  const yesNo = (value) => value ? "Yes" : "No";
  const map = {
    experience_title: entry.title,
    experience_company: entry.company,
    experience_location: entry.location,
    experience_current: yesNo(Boolean(entry.currently_work_here ?? entry.current)),
    experience_start_date: dateValueForField(entry.from || entry.start_date, field),
    experience_end_date: dateValueForField(entry.to || entry.end_date, field),
    experience_description: entry.description,
    education_school: entry.school,
    education_degree: entry.degree,
    education_field: entry.field_of_study,
    education_gpa: entry.gpa,
    education_start_date: dateValueForField(entry.from || entry.start_date, field),
    education_end_date: dateValueForField(entry.to || entry.end_date, field),
  };
  return map[intent] ?? null;
}

function isBlankCurrentValue(value) {
  const text = String(value || "").trim();
  return !text || /^m{1,2}\/?y{2,4}$/i.test(text) || /^y{2,4}$/i.test(text) || /^current value is\s*(m{1,2}\/?y{2,4}|y{2,4})$/i.test(text);
}

function dateValueForField(value, field) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (!match) return raw;
  const text = [
    field?.label,
    field?.placeholder,
    field?.ariaLabel,
    field?.name,
    field?.id,
    field?.fieldKey,
  ].filter(Boolean).join(" ");
  if (/year|yyyy|dateSectionYear/i.test(text)) return match[2];
  if (/month|mm|dateSectionMonth/i.test(text)) return match[1].padStart(2, "0");
  return raw;
}

toggleDebugBtn.addEventListener("click", () => {
  debugContent.classList.toggle("hidden");
  toggleDebugBtn.textContent = debugContent.classList.contains("hidden")
    ? "Show field details"
    : "Hide field details";
});

function renderMappingSummary(summary) {
  mappingSummary.classList.remove("hidden");
  let html = `<div class="mapping-stats">`;
  html += `<span class="mapping-stat stat-ok">${summary.available} available</span>`;
  if (summary.derived > 0) html += `<span class="mapping-stat stat-derived">${summary.derived} derived</span>`;
  html += `<span class="mapping-stat stat-missing">${summary.missing} missing</span>`;
  if (summary.manualReview > 0) html += `<span class="mapping-stat stat-review">${summary.manualReview} manual</span>`;
  if (summary.sensitive > 0) html += `<span class="mapping-stat stat-sensitive">${summary.sensitive} sensitive</span>`;
  html += `</div>`;
  mappingSummary.innerHTML = html;
}

function renderMappingTable(mappedFields) {
  if (!mappedFields || mappedFields.length === 0) {
    mappingContent.innerHTML = "<p class='debug-empty'>No fields to map.</p>";
    return;
  }
  const table = document.createElement("table");
  table.className = "debug-table mapping-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Field</th>
        <th>Proposed Value</th>
        <th>Status</th>
        <th>Confidence</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${mappedFields
        .map(
          (f, i) => {
            const confidencePct = f.mappingConfidence != null ? (f.mappingConfidence * 100).toFixed(0) + "%" : "—";
            return `
        <tr class="mapping-row-${f.mappingStatus}">
          <td>${i + 1}</td>
          <td>${f.intent || "unknown"}</td>
          <td class="mapping-value">${f.mappedValue != null ? escapeHtml(String(f.mappedValue)) : "—"}</td>
          <td><span class="status-badge badge-${f.mappingStatus}">${f.mappingStatus}</span></td>
          <td>${confidencePct}</td>
          <td class="debug-signal">${f.mappingMessage || "—"}${f.sensitive ? ' <span class="sensitive-tag">sensitive</span>' : ""}</td>
        </tr>`;
        })
        .join("")}
    </tbody>
  `;
  mappingContent.innerHTML = "";
  mappingContent.appendChild(table);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Approval Preview ─────────────────────────────────────────────

function updateFillButton() {
  if (!lastMappedFields || !approvalStore) {
    fillBtn.disabled = true;
    return;
  }
  const approved = buildApprovedFillFields(approvalStore, lastMappedFields);
  fillBtn.disabled = approved.length === 0;
}

function renderApprovalUI(mappedFields) {
  if (!approvalStore) approvalStore = createApprovalStore();

  approvalSection.classList.remove("hidden");
  const html = buildPreviewContainerHTML(mappedFields, approvalStore);
  previewContent.innerHTML = html;

  renderApprovalSummary();
  updateFillButton();

  const radios = previewContent.querySelectorAll("input[type=radio]");
  for (const radio of radios) {
    radio.addEventListener("change", (e) => {
      const row = e.target.closest("[data-intent]");
      if (!row) return;
      const fieldKey = row.getAttribute("data-field-key") || row.getAttribute("data-intent");
      if (e.target.value === "approve") {
        approvalStore.approve(fieldKey);
      } else if (e.target.value === "reject") {
        approvalStore.reject(fieldKey);
      } else {
        approvalStore.remove(fieldKey);
      }
      renderApprovalSummary();
      updateFillButton();
    });
  }
}

function renderApprovalSummary() {
  if (!lastMappedFields || !approvalStore) return;
  const summary = approvalStore.getSummary(lastMappedFields);
  approvalSummaryEl.classList.remove("hidden");
  approvalSummaryEl.innerHTML = buildApprovalSummaryHTML(summary);
}

selectAllSafeBtn.addEventListener("click", () => {
  if (!lastMappedFields || !approvalStore) return;
  approvalStore.reset();
  approvalStore.selectAllSafe(lastMappedFields);
  renderApprovalUI(lastMappedFields);
});

selectStaticAnswersBtn.addEventListener("click", () => {
  if (!lastMappedFields || !approvalStore) return;
  const count = selectStaticAnswers(approvalStore, lastMappedFields);
  renderApprovalUI(lastMappedFields);
  showSuccess(`${count} saved static answer${count === 1 ? "" : "s"} selected for filling.`);
});

copyStaticAnswersBtn.addEventListener("click", async () => {
  if (!lastMappedFields) return;
  const text = buildQuickCopyText(lastMappedFields);
  if (!text) {
    showError("No saved answer-bank values are available yet. Update your Desktop Profile first.");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showSuccess("Copied answer bank to clipboard.");
  } catch {
    showError("Could not copy automatically. Open proposed mappings and copy values manually.");
  }
});

resetApprovalsBtn.addEventListener("click", () => {
  if (!approvalStore) return;
  approvalStore.reset();
  if (lastMappedFields) renderApprovalUI(lastMappedFields);
});

// ── Fill Approved Fields ──────────────────────────────────────────

function renderFillResult(result) {
  fillResultEl.classList.remove("hidden");
  let html = `<div class="fill-stats">`;
  html += `<span class="fill-stat stat-ok">${result.filled} filled</span>`;
  html += `<span class="fill-stat stat-missing">${result.skipped} skipped</span>`;
  if (result.failed > 0) html += `<span class="fill-stat stat-review">${result.failed} failed</span>`;
  html += `</div>`;
  if (result.details) {
    html += `<div class="fill-details">`;
    if (result.filled > 0 && result.details.filledFields) {
      html += `<div class="fill-detail-list"><strong>Filled:</strong> ${result.details.filledFields.join(", ")}</div>`;
    }
    if (result.details.skippedNotFound > 0) {
      const fields = result.details.skippedNotFoundFields ? result.details.skippedNotFoundFields.join(", ") : "";
      html += `<div class="fill-detail"><span class="fill-detail-label">Not found:</span> ${result.details.skippedNotFound}${fields ? " (" + fields + ")" : ""}</div>`;
    }
    if (result.details.skippedUnfillable > 0) {
      const fields = result.details.skippedUnfillableFields ? result.details.skippedUnfillableFields.join(", ") : "";
      html += `<div class="fill-detail"><span class="fill-detail-label">Unfillable:</span> ${result.details.skippedUnfillable}${fields ? " (" + fields + ")" : ""}</div>`;
    }
    if (result.details.skippedMissing > 0) {
      const fields = result.details.skippedMissingFields ? result.details.skippedMissingFields.join(", ") : "";
      html += `<div class="fill-detail"><span class="fill-detail-label">Missing value:</span> ${result.details.skippedMissing}${fields ? " (" + fields + ")" : ""}</div>`;
    }
    html += `</div>`;
  }
  if (!result.success) {
    html += `<div class="fill-error">${escapeHtml(result.error || "Unknown error")}</div>`;
  }
  fillResultEl.innerHTML = html;
}

fillBtn.addEventListener("click", async () => {
  if (!lastMappedFields || !approvalStore) return;

  fillBtn.disabled = true;
  fillBtn.textContent = "Filling...";
  fillResultEl.classList.add("hidden");

  try {
    const approvedFields = buildApprovedFillFields(approvalStore, lastMappedFields);
    if (approvedFields.length === 0) {
      showError("No approved fields to fill.");
      fillBtn.disabled = false;
      fillBtn.textContent = "Fill Approved Fields";
      return;
    }
    const result = await executeFill(approvedFields);
    renderFillResult(result);
  } catch (err) {
    showError("Fill error: " + err.message);
  } finally {
    fillBtn.disabled = false;
    fillBtn.textContent = "Fill Approved Fields";
  }
});

// ── Map Fields ─────────────────────────────────────────────────────

mapBtn.addEventListener("click", async () => {
  if (!lastDetectedFields || lastDetectedFields.length === 0) {
    showError("No fields detected. Click 'Detect Form Fields' first.");
    return;
  }

  mapBtn.disabled = true;
  mapBtn.textContent = "Mapping...";
  mappingSummary.classList.add("hidden");
  mappingDebug.classList.add("hidden");
  approvalSection.classList.add("hidden");
  fillResultEl.classList.add("hidden");

  try {
    const profileData = await fetchAllProfileData();
    lastProfileData = profileData;

    if (profileData.profile && !profileData.profile.success) {
      showError("Failed to fetch profile: " + profileData.profile.error);
      mapBtn.disabled = false;
      mapBtn.textContent = "Map Fields to Profile";
      return;
    }

    const mapped = dedupeMappedFields(mapFields(lastDetectedFields, profileData));
    const page = await sendRuntimeMessage({ type: "GET_PAGE_INFO" });
    saveFieldObservations(page, mapped);
    lastMappedFields = mapped;
    const summary = summarizeMappings(mapped);

    approvalStore = createApprovalStore();

    renderMappingSummary(summary);
    if (mapped.length > 0) {
      mappingDebug.classList.remove("hidden");
      renderMappingTable(mapped);
      renderApprovalUI(mapped);
    }
  } catch (err) {
    showError("Mapping error: " + err.message);
  } finally {
    mapBtn.disabled = false;
    mapBtn.textContent = "Map Fields to Profile";
  }
});

toggleMappingBtn.addEventListener("click", () => {
  mappingContent.classList.toggle("hidden");
  toggleMappingBtn.textContent = mappingContent.classList.contains("hidden")
    ? "Show proposed mappings"
    : "Hide proposed mappings";
});

async function init() {
  statusEl.textContent = "Checking...";
  statusEl.className = "status-indicator checking";
  updateStatus(false);

  const result = await checkHealth();
  if (result.status === "ok") {
    updateStatus(true, result.data);
  } else {
    updateStatus(false);
    showError(result.message || "Unable to connect to backend");
  }
}

init();
