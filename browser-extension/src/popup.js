import { checkHealth, getStoredBackendUrl } from "./apiClient.js";

const statusEl = document.getElementById("backendStatus");
const versionEl = document.getElementById("backendVersion");
const modeEl = document.getElementById("backendMode");
const errorDetailEl = document.getElementById("errorDetail");
const optionsLink = document.getElementById("openOptionsLink");

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
