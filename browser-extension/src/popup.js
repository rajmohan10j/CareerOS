import { checkHealth } from "./apiClient.js";
import { fetchAllProfileData } from "./profileClient.js";
import { mapFields, summarizeMappings } from "./autofillMapper.js";

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

let lastDetectedFields = null;
let lastProfileData = null;
let lastMappedFields = null;

function showError(message) {
  errorDetailEl.textContent = message;
  errorDetailEl.classList.remove("hidden");
}

function hideError() {
  errorDetailEl.classList.add("hidden");
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
          (f, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${f.fieldType || f.inputType || "—"}</td>
          <td>${f.intent || "unknown"}</td>
          <td>${f.confidence != null ? f.confidence.toFixed(2) : "—"}</td>
          <td class="${f.sensitive ? "sensitive-yes" : "sensitive-no"}">${f.sensitive ? "Yes" : "No"}</td>
          <td class="debug-signal">${f.label || f.placeholder || f.ariaLabel || f.name || "—"}</td>
        </tr>`
        )
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
          (f, i) => `
        <tr class="mapping-row-${f.mappingStatus}">
          <td>${i + 1}</td>
          <td>${f.intent || "unknown"}</td>
          <td class="mapping-value">${f.mappedValue != null ? escapeHtml(String(f.mappedValue)) : "—"}</td>
          <td><span class="status-badge badge-${f.mappingStatus}">${f.mappingStatus}</span></td>
          <td>${f.mappingConfidence != null ? f.mappingConfidence.toFixed(2) : "—"}</td>
          <td class="debug-signal">${f.mappingMessage || "—"}${f.sensitive ? ' <span class="sensitive-tag">sensitive</span>' : ""}</td>
        </tr>`
        )
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

mapBtn.addEventListener("click", async () => {
  if (!lastDetectedFields || lastDetectedFields.length === 0) {
    showError("No fields detected. Click 'Detect Form Fields' first.");
    return;
  }

  mapBtn.disabled = true;
  mapBtn.textContent = "Mapping...";
  mappingSummary.classList.add("hidden");
  mappingDebug.classList.add("hidden");

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

    renderMappingSummary(summary);
    if (mapped.length > 0) {
      mappingDebug.classList.remove("hidden");
      renderMappingTable(mapped);
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
