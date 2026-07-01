import { checkHealth } from "./apiClient.js";

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

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "DETECT_FIELDS" }, resolve);
    });

    if (response && response.success) {
      fieldSummary.classList.remove("hidden");
      fieldCountEl.textContent = response.fieldCount;
      if (response.fieldCount > 0) {
        fieldDebug.classList.remove("hidden");
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
  const isHidden = debugContent.classList.contains("hidden");
  debugContent.classList.toggle("hidden");
  toggleDebugBtn.textContent = isHidden ? "Hide field details" : "Show field details";
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
