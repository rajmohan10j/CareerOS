import { fetchAnalytics } from "../apiClient.js";
import { navigate } from "../routes.js";

let _analyticsData = null;
let _error = null;

const CARD_ROUTES = {
  "dash-card-profile": "profile",
  "dash-card-resumes": "resumes",
  "dash-card-jobs": "jobs",
  "dash-card-applications": "applications",
  "dash-card-documents": "documents",
  "dash-card-health": "settings",
};

function cardHtml(id, icon, label, value, subtitle) {
  const val = value != null && value !== 0 ? value : "0";
  const sub = subtitle ? `<span class="dash-card-sub">${subtitle}</span>` : "";
  return `
    <div class="dash-card dash-card-stat" id="${id}" data-route="${CARD_ROUTES[id]}" tabindex="0" role="button" aria-label="Navigate to ${label}">
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
          ${cardHtml("dash-card-profile", "👤", "Profile", "—", "Waiting...")}
          ${cardHtml("dash-card-resumes", "📄", "Resumes", "—", "Waiting...")}
          ${cardHtml("dash-card-jobs", "💼", "Jobs", "—", "Waiting...")}
          ${cardHtml("dash-card-applications", "📋", "Applications", "—", "Waiting...")}
          ${cardHtml("dash-card-documents", "📁", "Documents", "—", "Waiting...")}
          <div class="dash-card dash-card-health" id="dash-card-health" data-route="settings" tabindex="0" role="button" aria-label="Navigate to Settings">
            <div class="dash-card-icon">🔌</div>
            <div class="dash-card-content">
              <h3>Backend Health</h3>
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
          ${cardHtml("dash-card-profile", "👤", "Profile", "—", "Checking...")}
          ${cardHtml("dash-card-resumes", "📄", "Resumes", "—", "Checking...")}
          ${cardHtml("dash-card-jobs", "💼", "Jobs", "—", "Checking...")}
          ${cardHtml("dash-card-applications", "📋", "Applications", "—", "Checking...")}
          ${cardHtml("dash-card-documents", "📁", "Documents", "—", "Checking...")}
          <div class="dash-card dash-card-health" id="dash-card-health" data-route="settings" tabindex="0" role="button" aria-label="Navigate to Settings">
            <div class="dash-card-icon">🔌</div>
            <div class="dash-card-content">
              <h3>Backend Health</h3>
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

  const profileSub = p.exists ? `${p.completeness_pct || 0}% complete (${p.fields_populated || 0}/${p.fields_total || 0})` : "No profile yet";
  const resumeSub = r.total > 0 ? `${r.has_content || 0} with content` : "No resumes yet";
  const jobSub = j.total > 0 ? `${j.with_score || 0} with scores` : "No jobs yet";
  const appSub = a.total > 0 ? `${a.with_resume || 0} with resume` : "No applications yet";
  const docSub = doc.total > 0 ? `${((doc.total_size_bytes || 0) / 1024).toFixed(1)} KB total` : "No documents yet";

  const healthHtml = `
    <div class="dash-card dash-card-health" id="dash-card-health" data-route="settings" tabindex="0" role="button" aria-label="Navigate to Settings">
      <div class="dash-card-icon">🔌</div>
      <div class="dash-card-content">
        <h3>Backend Health</h3>
        <p class="dash-card-value health-ok">Connected</p>
        <span class="dash-card-sub">${d.recent_activity?.last_activity ? "Last activity: " + new Date(d.recent_activity.last_activity).toLocaleDateString() : "No recent activity"}</span>
      </div>
    </div>
  `;

  return `
    <div class="page dashboard-page">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome to CareerOS — your local career management platform.</p>
      <div class="dashboard-cards">
        ${cardHtml("dash-card-profile", "👤", "Profile", p.exists ? p.fields_populated : 0, profileSub)}
        ${cardHtml("dash-card-resumes", "📄", "Resumes", r.total || 0, resumeSub)}
        ${cardHtml("dash-card-jobs", "💼", "Jobs", j.total || 0, jobSub)}
        ${cardHtml("dash-card-applications", "📋", "Applications", a.total || 0, appSub)}
        ${cardHtml("dash-card-documents", "📁", "Documents", doc.total || 0, docSub)}
        ${healthHtml}
      </div>
    </div>
  `;
}

function attachCardClicks(container) {
  if (!container) return;
  container.querySelectorAll(".dash-card").forEach(card => {
    const route = card.dataset.route;
    if (route) {
      card.addEventListener("click", () => navigate(route));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(route);
        }
      });
    }
  });
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
  if (container) {
    container.innerHTML = render();
    attachCardClicks(container);
  }
}

export default { render, onMount };
