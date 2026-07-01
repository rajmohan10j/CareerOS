import { checkHealth, getStoredBackendUrl, DEFAULT_BACKEND_URL } from "./apiClient.js";

const backendUrlInput = document.getElementById("backendUrl");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const saveStatus = document.getElementById("saveStatus");

function setStatus(message, isError) {
  saveStatus.textContent = message;
  saveStatus.className = isError ? "save-error" : "save-success";
}

async function loadSettings() {
  const url = await getStoredBackendUrl();
  backendUrlInput.value = url;
}

async function saveSettings() {
  const url = backendUrlInput.value.trim() || DEFAULT_BACKEND_URL;
  return new Promise((resolve) => {
    chrome.storage.sync.set({ backendUrl: url }, () => {
      if (chrome.runtime.lastError) {
        setStatus("Failed to save: " + chrome.runtime.lastError.message, true);
        resolve(false);
      } else {
        setStatus("Settings saved.", false);
        resolve(true);
      }
    });
  });
}

async function testConnection() {
  const currentUrl = backendUrlInput.value.trim() || DEFAULT_BACKEND_URL;
  backendUrlInput.disabled = true;
  testBtn.disabled = true;
  testBtn.textContent = "Testing...";
  setStatus("Connecting...", false);

  const result = await checkHealth();

  backendUrlInput.disabled = false;
  testBtn.disabled = false;
  testBtn.textContent = "Test Connection";

  if (result.status === "ok") {
    const elapsed = result.elapsed != null ? ` (${result.elapsed}ms)` : "";
    setStatus(
      `Connected — version ${result.data.version || "?"}, mode ${result.data.mode || "?"}${elapsed}`,
      false
    );
  } else {
    setStatus(
      "Connection failed: " + (result.message || "Unknown error") + ". Verify the backend is running.",
      true
    );
  }
}

saveBtn.addEventListener("click", saveSettings);
testBtn.addEventListener("click", testConnection);

loadSettings();
