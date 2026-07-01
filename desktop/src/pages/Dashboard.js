import { getStatus } from "../components/BackendStatus.js";
import { checkHealth } from "../apiClient.js";

let _healthData = null;

function render() {
  const status = getStatus();
  return `
    <div class="page dashboard-page">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome to CareerOS — your local career management platform.</p>
      <div class="dashboard-cards">
        <div class="dash-card">
          <div class="dash-card-icon">👤</div>
          <div class="dash-card-content">
            <h3>Profile</h3>
            <p>View and manage your master candidate profile.</p>
          </div>
        </div>
        <div class="dash-card">
          <div class="dash-card-icon">📄</div>
          <div class="dash-card-content">
            <h3>Resumes</h3>
            <p>Create, version, and optimize your resumes.</p>
          </div>
        </div>
        <div class="dash-card">
          <div class="dash-card-icon">💼</div>
          <div class="dash-card-content">
            <h3>Jobs</h3>
            <p>Track job opportunities and evaluate fit.</p>
          </div>
        </div>
        <div class="dash-card">
          <div class="dash-card-icon">📋</div>
          <div class="dash-card-content">
            <h3>Applications</h3>
            <p>Monitor your job applications pipeline.</p>
          </div>
        </div>
        <div class="dash-card">
          <div class="dash-card-icon">🤖</div>
          <div class="dash-card-content">
            <h3>AI Services</h3>
            <p>Check AI model status and configuration.</p>
          </div>
        </div>
        <div class="dash-card">
          <div class="dash-card-icon">🧩</div>
          <div class="dash-card-content">
            <h3>Browser Extension</h3>
            <p>Manage your autofill assistant extension.</p>
          </div>
        </div>
      </div>
      <div class="dashboard-health">
        <h3>Backend Status</h3>
        <div id="dashHealthDetail">
          ${_healthData ? `
            <p class="health-ok">Connected — v${_healthData.version || "?"}, mode ${_healthData.mode || "?"}</p>
          ` : `
            <p class="health-checking">Checking backend connection...</p>
          `}
        </div>
      </div>
    </div>
  `;
}

async function onMount() {
  const result = await checkHealth();
  if (result.status === "ok") {
    _healthData = result.data;
  } else {
    _healthData = { error: result.message };
  }
  const container = document.getElementById("pageContainer");
  if (container) container.innerHTML = render();
}

export default { render, onMount };
