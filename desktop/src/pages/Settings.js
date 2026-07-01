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
          <button id="testBackendBtn" class="btn btn-secondary">Test Connection</button>
          <button id="saveBackendBtn" class="btn btn-primary">Save</button>
        </div>
        <div id="settingsStatus" class="settings-status"></div>
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

function onMount() {
  const testBtn = document.getElementById("testBackendBtn");
  const saveBtn = document.getElementById("saveBackendBtn");
  const statusEl = document.getElementById("settingsStatus");
  const urlInput = document.getElementById("backendUrlInput");

  if (testBtn) {
    testBtn.addEventListener("click", async () => {
      testBtn.disabled = true;
      testBtn.textContent = "Testing...";
      statusEl.textContent = "Connecting...";
      statusEl.className = "settings-status";
      const result = await checkHealth();
      if (result.status === "ok") {
        statusEl.textContent = `Connected — v${result.data.version || "?"}, mode ${result.data.mode || "?"}`;
        statusEl.className = "settings-status status-ok";
      } else {
        statusEl.textContent = `Connection failed: ${result.message}`;
        statusEl.className = "settings-status status-error";
      }
      testBtn.disabled = false;
      testBtn.textContent = "Test Connection";
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const url = urlInput.value.trim() || DEFAULT_BACKEND_URL;
      setStoredBackendUrl(url);
      statusEl.textContent = "Settings saved.";
      statusEl.className = "settings-status status-ok";
    });
  }
}

export default { render, onMount };
