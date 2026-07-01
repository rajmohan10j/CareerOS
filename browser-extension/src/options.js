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
  /* Temporarily override stored URL for the test */
  const originalGet = getStoredBackendUrl;
  backendUrlInput.disabled = true;
  testBtn.disabled = true;
  setStatus("Testing connection...", false);

  const result = await checkHealth();

  backendUrlInput.disabled = false;
  testBtn.disabled = false;

  if (result.status === "ok") {
    setStatus(
      `Connected — version ${result.data.version || "?"}, mode ${result.data.mode || "?"}`,
      false
    );
  } else {
    setStatus("Connection failed: " + (result.message || "Unknown error"), true);
  }
}

saveBtn.addEventListener("click", saveSettings);
testBtn.addEventListener("click", testConnection);

loadSettings();
