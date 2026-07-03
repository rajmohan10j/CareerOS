import { getStoredBackendUrl, setStoredBackendUrl, checkHealth, DEFAULT_BACKEND_URL } from "../apiClient.js";

function render() {
  const currentUrl = getStoredBackendUrl();
  return `
    <div class="page settings-page">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your CareerOS desktop application.</p>

      <section class="settings-section">
        <h2>Backend Connection</h2>
        <div class="setting-group">
          <label for="backendUrlInput">Backend URL</label>
          <input type="url" id="backendUrlInput" value="${currentUrl}" placeholder="${DEFAULT_BACKEND_URL}" />
          <p class="setting-hint">The URL of your local CareerOS backend server (default: ${DEFAULT_BACKEND_URL}).</p>
        </div>
        <div class="setting-actions">
          <button id="testBackendBtn" class="btn btn-secondary" onclick="window.CareerOSSettingsActions?.testConnection()">Test Connection</button>
          <button id="saveBackendBtn" class="btn btn-primary" onclick="window.CareerOSSettingsActions?.saveSettings()">Save</button>
        </div>
        <div id="settingsStatus" class="settings-status" role="status" aria-live="polite">
          Click Test Connection to check the backend.
        </div>
      </section>

      <section class="settings-section">
        <h2>Application</h2>
        <div class="setting-group">
          <p class="setting-hint">CareerOS Desktop v0.1.0</p>
          <p class="setting-hint">All data is stored locally on your machine. No cloud services are required.</p>
        </div>
      </section>
    </div>
  `;
}

function getSettingsElements() {
  return {
    testBtn: document.getElementById("testBackendBtn"),
    saveBtn: document.getElementById("saveBackendBtn"),
    statusEl: document.getElementById("settingsStatus"),
    urlInput: document.getElementById("backendUrlInput"),
  };
}

function setStatus(message, state = "idle") {
  const { statusEl } = getSettingsElements();
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `settings-status status-${state}`;
}

async function testConnection() {
  const { testBtn, statusEl } = getSettingsElements();
  if (!testBtn || !statusEl) return;
  if (testBtn.disabled) return;

  testBtn.disabled = true;
  testBtn.textContent = "Testing...";
  setStatus("Testing backend connection...", "checking");

  const result = await checkHealth();
  if (result.status === "ok") {
    setStatus(`Connected. Backend v${result.data.version || "?"}, mode ${result.data.mode || "?"}.`, "ok");
  } else {
    setStatus(`Connection failed. ${result.message}`, "error");
  }

  testBtn.disabled = false;
  testBtn.textContent = "Test Connection";
}

function saveSettings() {
  const { urlInput } = getSettingsElements();
  const url = urlInput?.value.trim() || DEFAULT_BACKEND_URL;
  setStoredBackendUrl(url);
  setStatus(`Saved backend URL: ${getStoredBackendUrl()}`, "ok");
}

function installGlobalActions() {
  window.CareerOSSettingsActions = {
    testConnection,
    saveSettings,
  };
}

function onMount() {
  installGlobalActions();
  const testBtn = document.getElementById("testBackendBtn");
  const saveBtn = document.getElementById("saveBackendBtn");

  if (testBtn) {
    testBtn.addEventListener("click", testConnection);
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveSettings);
  }
}

if (typeof window !== "undefined") {
  installGlobalActions();
}

export default { render, onMount };
