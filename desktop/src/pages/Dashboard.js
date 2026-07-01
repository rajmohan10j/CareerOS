import { fetchAnalytics } from "../apiClient.js";

let _analyticsData = null;
let _error = null;

function cardHtml(icon, label, value, subtitle) {
  const val = value != null && value !== 0 ? value : "0";
  const sub = subtitle ? `<span class="dash-card-sub">${subtitle}</span>` : "";
  return `
    <div class="dash-card dash-card-stat">
      <div class="dash-card-icon">${icon}</div>
      <div class="dash-card-content">
        <h3>${label}</h3>
        <p class="dash-card-value">${val}</p>
        ${sub}
      </div>
    </div>
  `;
}

function render() {
  if (_error) {
    return `
      <div class="page dashboard-page">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Welcome to CareerOS — your local career management platform.</p>
        <div class="dashboard-cards">
          ${cardHtml("👤", "Profile", "—", "Loading...")}
          ${cardHtml("📄", "Resumes", "—", "Loading...")}
          ${cardHtml("💼", "Jobs", "—", "Loading...")}
          ${cardHtml("📋", "Applications", "—", "Loading...")}
          ${cardHtml("📁", "Documents", "—", "Loading...")}
          ${cardHtml("🧠", "Knowledge", "—", "Loading...")}
          ${cardHtml("🧩", "Plugins", "—", "Loading...")}
          <div class="dash-card dash-card-health">
            <div class="dash-card-icon">🔌</div>
            <div class="dash-card-content">
              <h3>Backend Status</h3>
              <p class="dash-card-value health-error">${_error}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (!_analyticsData) {
    return `
      <div class="page dashboard-page">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Welcome to CareerOS — your local career management platform.</p>
        <div class="dashboard-cards">
          ${cardHtml("👤", "Profile", "—", "Loading...")}
          ${cardHtml("📄", "Resumes", "—", "Loading...")}
          ${cardHtml("💼", "Jobs", "—", "Loading...")}
          ${cardHtml("📋", "Applications", "—", "Loading...")}
          ${cardHtml("📁", "Documents", "—", "Loading...")}
          ${cardHtml("🧠", "Knowledge", "—", "Loading...")}
          ${cardHtml("🧩", "Plugins", "—", "Loading...")}
          <div class="dash-card dash-card-health">
            <div class="dash-card-icon">🔌</div>
            <div class="dash-card-content">
              <h3>Backend Status</h3>
              <p class="dash-card-value">Checking...</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const d = _analyticsData;
  const p = d.profile || {};
  const r = d.resumes || {};
  const j = d.jobs || {};
  const a = d.applications || {};
  const doc = d.documents || {};
  const k = d.knowledge || {};
  const pl = d.plugins || {};

  const profileSub = p.exists ? `${p.completeness_pct}% complete (${p.fields_populated}/${p.fields_total})` : "No profile yet";
  const resumeSub = r.total > 0 ? `${r.has_content} with content, v${r.latest_version}` : "No resumes yet";
  const jobSub = j.total > 0 ? `${j.with_score} with scores` : "No jobs yet";
  const appSub = a.total > 0 ? `${a.with_resume} with resume` : "No applications yet";
  const docSub = doc.total > 0 ? `${(doc.total_size_bytes / 1024).toFixed(1)} KB total` : "No documents yet";
  const knowledgeSub = k.total > 0 ? `${k.indexed} indexed, ${k.total_chunks} chunks` : "No knowledge records yet";
  const pluginSub = pl.total > 0 ? `${Object.keys(pl.by_status).length} statuses` : "No plugins yet";

  const healthHtml = `
    <div class="dash-card dash-card-health">
      <div class="dash-card-icon">🔌</div>
      <div class="dash-card-content">
        <h3>Backend Status</h3>
        <p class="dash-card-value health-ok">Connected</p>
        <span class="dash-card-sub">Last activity: ${d.recent_activity?.last_activity ? new Date(d.recent_activity.last_activity).toLocaleDateString() : "None"}</span>
      </div>
    </div>
  `;

  return `
    <div class="page dashboard-page">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome to CareerOS — your local career management platform.</p>
      <div class="dashboard-cards">
        ${cardHtml("👤", "Profile", p.exists ? p.fields_populated : 0, profileSub)}
        ${cardHtml("📄", "Resumes", r.total, resumeSub)}
        ${cardHtml("💼", "Jobs", j.total, jobSub)}
        ${cardHtml("📋", "Applications", a.total, appSub)}
        ${cardHtml("📁", "Documents", doc.total, docSub)}
        ${cardHtml("🧠", "Knowledge", k.total, knowledgeSub)}
        ${cardHtml("🧩", "Plugins", pl.total, pluginSub)}
        ${healthHtml}
      </div>
    </div>
  `;
}

async function onMount() {
  const result = await fetchAnalytics();
  if (result.status === "ok") {
    _analyticsData = result.data;
    _error = null;
  } else {
    _analyticsData = null;
    _error = result.message;
  }
  const container = document.getElementById("pageContainer");
  if (container) container.innerHTML = render();
}

export default { render, onMount };