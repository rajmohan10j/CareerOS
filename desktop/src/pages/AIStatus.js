import { checkHealth } from "../apiClient.js";

let _aiInfo = null;

function render() {
  return `
    <div class="page ai-status-page">
      <h1 class="page-title">AI Services Status</h1>
      <p class="page-subtitle">View the status of AI models and providers configured in your local backend.</p>
      <div class="page-placeholder">
        <div class="placeholder-icon">🤖</div>
        <p>AI provider status and model configuration will be displayed here.</p>
        <p class="placeholder-hint">Data is sourced from the local backend. No cloud services are required.</p>
      </div>
      <div class="dashboard-health">
        <h3>Backend Health</h3>
        <div id="aiHealthDetail">
          <p class="health-checking">Checking backend...</p>
        </div>
      </div>
    </div>
  `;
}

async function onMount() {
  const result = await checkHealth();
  const el = document.getElementById("aiHealthDetail");
  if (el) {
    if (result.status === "ok") {
      el.innerHTML = `<p class="health-ok">Connected — v${result.data.version || "?"}, mode ${result.data.mode || "?"}</p>`;
    } else {
      el.innerHTML = `<p class="health-error">${result.message}</p>`;
    }
  }
}

export default { render, onMount };
