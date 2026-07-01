import { checkHealth } from "./apiClient.js";
import { fetchAllProfileData } from "./profileClient.js";
import { mapFields, summarizeMappings } from "./autofillMapper.js";
import { createApprovalStore } from "./approvalState.js";
import { buildPreviewContainerHTML, buildApprovalSummaryHTML } from "./mappingPreview.js";
import { buildApprovedFillFields, executeFill } from "./autofillExecutor.js";

const statusEl = document.getElementById("backendStatus");
const versionEl = document.getElementById("backendVersion");
const modeEl = document.getElementById("backendMode");
const errorDetailEl = document.getElementById("errorDetail");
const optionsLink = document.getElementById("openOptionsLink");
const detectBtn = document.getElementById("detectFieldsBtn");
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
      lastDetectedFields = response.fields;
      fieldSummary.classList.remove("hidden");
      fieldCountEl.textContent = response.fieldCount;
      if (response.fieldCount > 0) {
        fieldDebug.classList.remove("hidden");
        mappingSection.classList.remove("hidden");
        renderDebugTable(response.fields);
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
      const intent = row.getAttribute("data-intent");
      if (e.target.value === "approve") {
        approvalStore.approve(intent);
      } else if (e.target.value === "reject") {
        approvalStore.reject(intent);
      } else {
        approvalStore.reject(intent);
        approvalStore.approve(intent);
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

    const mapped = mapFields(lastDetectedFields, profileData);
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
