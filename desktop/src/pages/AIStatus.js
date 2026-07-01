import { fetchAiProviders, fetchAiModels, fetchAiHealth, checkHealth } from "../apiClient.js";

let _providers = null;
let _models = null;
let _health = null;
let _backendHealth = null;
let _loading = true;
let _error = null;

function render() {
  const providerCount = _providers ? (Array.isArray(_providers) ? _providers.length : Object.keys(_providers).length) : 0;
  const modelCount = _models && _models.models ? _models.models.length : (_models ? (Array.isArray(_models) ? _models.length : 0) : 0);

  const backendStatusHtml = _backendHealth
    ? `<p class="health-ok"><strong>Backend:</strong> v${_backendHealth.version || '?'}, mode ${_backendHealth.mode || '?'}</p>`
    : '<p class="health-checking">Checking backend...</p>';

  const providersHtml = _providers
    ? `<pre class="ai-json">${JSON.stringify(_providers, null, 2)}</pre>`
    : '<p class="health-checking">Loading providers...</p>';

  const modelsHtml = _models
    ? `<pre class="ai-json">${JSON.stringify(_models, null, 2)}</pre>`
    : '<p class="health-checking">Loading models...</p>';

  const healthHtml = _health
    ? `<pre class="ai-json">${JSON.stringify(_health, null, 2)}</pre>`
    : '<p class="health-checking">Checking AI health...</p>';

  return `
    <div class="page ai-status-page">
      <h1 class="page-title">AI Services Status</h1>
      <p class="page-subtitle">View the status of AI models and providers configured in your local backend.</p>

      ${_error ? `<div class="settings-status status-error">${_error}</div>` : ''}

      <div class="settings-section">
        <h2>Backend Health</h2>
        ${backendStatusHtml}
      </div>

      <div class="settings-section">
        <h2>AI Providers (${providerCount})</h2>
        ${providersHtml}
      </div>

      <div class="settings-section">
        <h2>AI Models (${modelCount})</h2>
        ${modelsHtml}
      </div>

      <div class="settings-section">
        <h2>AI Health</h2>
        ${healthHtml}
      </div>
    </div>
  `;
}

async function onMount() {
  _loading = true;
  _error = null;

  const [providersRes, modelsRes, healthRes, backendRes] = await Promise.all([
    fetchAiProviders(),
    fetchAiModels(),
    fetchAiHealth(),
    checkHealth(),
  ]);

  if (providersRes.status === "ok") {
    _providers = providersRes.data;
  } else {
    _error = providersRes.message;
  }

  if (modelsRes.status === "ok") {
    _models = modelsRes.data;
  }

  if (healthRes.status === "ok") {
    _health = healthRes.data;
  }

  if (backendRes.status === "ok") {
    _backendHealth = backendRes.data;
  }

  _loading = false;
  const container = document.getElementById("pageContainer");
  if (container) container.innerHTML = render();
}

export default { render, onMount };
