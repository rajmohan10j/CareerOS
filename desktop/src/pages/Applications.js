import { fetchApplicationSessions, fetchApplications, createApplication } from "../apiClient.js";

let _applications = [];
let _sessions = [];
let _loading = true;
let _error = null;
let _showForm = false;
let _saving = false;

function render() {
  const sessionHtml = renderSessions();
  let listHtml = "";
  if (_loading) {
    listHtml = '<p class="health-checking">Loading applications...</p>';
  } else if (_error) {
    listHtml = `<p class="health-error">${_error}</p>`;
  } else if (_applications.length === 0) {
    listHtml = `<div class="empty-state"><div class="empty-state-icon">📋</div><p>No applications yet.</p><p class="placeholder-hint">Track job applications to manage your pipeline.</p></div>`;
  } else {
    listHtml = '<div class="item-list">';
    for (const a of _applications) {
      const status = a.status ? `<span class="item-card-status">${a.status}</span>` : '';
      listHtml += `
        <div class="item-card">
          <div class="item-card-header">
            <strong>Job #${a.job_id || '—'}</strong>
            ${status}
          </div>
          <div class="item-card-details">
            ${a.applied_at ? `<span>Applied: ${new Date(a.applied_at).toLocaleDateString()}</span>` : ''}
            <span class="item-card-date">Updated: ${new Date(a.updated_at).toLocaleDateString()}</span>
          </div>
          ${a.notes ? `<div class="item-card-notes">${a.notes}</div>` : ''}
        </div>
      `;
    }
    listHtml += '</div>';
  }

  const formHtml = _showForm ? `
    <div class="inline-form">
      <h3>Add Application</h3>
      <div class="setting-group">
        <label for="appJobId">Job ID</label>
        <input type="number" id="appJobId" class="form-input" placeholder="Job ID number" />
      </div>
      <div class="setting-group">
        <label for="appResumeId">Resume ID (optional)</label>
        <input type="number" id="appResumeId" class="form-input" placeholder="Resume ID" />
      </div>
      <div class="setting-group">
        <label for="appStatus">Status</label>
        <input type="text" id="appStatus" class="form-input" placeholder="e.g. applied, interview, offer" value="applied" />
      </div>
      <div class="setting-group">
        <label for="appNotes">Notes</label>
        <textarea id="appNotes" class="form-textarea" rows="3" placeholder="Any notes about this application..."></textarea>
      </div>
      <div class="setting-actions">
        <button class="btn btn-primary" id="saveAppBtn" ${_saving ? 'disabled' : ''}>${_saving ? 'Adding...' : 'Add Application'}</button>
        <button class="btn btn-secondary" id="cancelAppBtn">Cancel</button>
      </div>
    </div>
  ` : '';

  return `
    <div class="page applications-page">
      <h1 class="page-title">Applications</h1>
      <p class="page-subtitle">Monitor your job applications pipeline.</p>
      <div class="page-actions">
        <button class="btn btn-primary" id="showAddAppBtn">+ Add Application</button>
      </div>
      ${formHtml}
      ${sessionHtml}
      ${listHtml}
    </div>
  `;
}

function renderSessions() {
  if (_loading) return "";
  if (_sessions.length === 0) {
    return `
      <section class="settings-section">
        <h2>Live Application Sessions</h2>
        <p class="placeholder-hint">No live browser sessions tracked yet. Use the extension's Fill Next Pending Entry action on an application page.</p>
      </section>
    `;
  }

  const rows = _sessions.map((s) => {
    const exp = s.progress?.experience || {};
    const edu = s.progress?.education || {};
    const expFilled = exp.filled?.length || 0;
    const eduFilled = edu.filled?.length || 0;
    const title = s.job_title || s.page_title || "Application session";
    return `
      <div class="item-card">
        <div class="item-card-header">
          <strong>${escapeHtml(title)}</strong>
          <span class="item-card-status">${escapeHtml(s.status || "in_progress")}</span>
        </div>
        <div class="item-card-details">
          <span>Experience: ${expFilled}/${exp.total || 0}</span>
          <span>Education: ${eduFilled}/${edu.total || 0}</span>
          <span class="item-card-date">Updated: ${new Date(s.updated_at).toLocaleString()}</span>
        </div>
        <div class="item-card-notes">${escapeHtml(s.url || "")}</div>
      </div>
    `;
  }).join("");

  return `
    <section class="settings-section">
      <h2>Live Application Sessions</h2>
      <p class="placeholder-hint">Tracks which resume entries have already been filled for each online application.</p>
      <div class="item-list">${rows}</div>
    </section>
  `;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

async function onMount() {
  _loading = true;
  _error = null;
  const [result, sessionResult] = await Promise.all([
    fetchApplications(),
    fetchApplicationSessions(),
  ]);
  if (result.status === "ok") {
    _applications = Array.isArray(result.data) ? result.data : [];
    _error = null;
  } else {
    _applications = [];
    _error = result.message;
  }
  _sessions = sessionResult.status === "ok" && Array.isArray(sessionResult.data) ? sessionResult.data : [];
  _loading = false;
  const container = document.getElementById("pageContainer");
  if (container) container.innerHTML = render();
  bindEvents(container);
}

function bindEvents(container) {
  if (!container) return;

  const showBtn = document.getElementById("showAddAppBtn");
  if (showBtn) {
    showBtn.addEventListener("click", () => {
      _showForm = true;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const cancelBtn = document.getElementById("cancelAppBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      _showForm = false;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const saveBtn = document.getElementById("saveAppBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const job_id = parseInt(document.getElementById("appJobId")?.value, 10) || null;
      const resume_id = parseInt(document.getElementById("appResumeId")?.value, 10) || null;
      const status = document.getElementById("appStatus")?.value || "applied";
      const notes = document.getElementById("appNotes")?.value || "";

      _saving = true;
      container.innerHTML = render();
      bindEvents(container);

      const result = await createApplication({ job_id, resume_id, status, notes });
      _saving = false;
      _showForm = false;
      if (result.status === "ok") {
        _applications.unshift(result.data);
        _error = null;
      } else {
        _error = result.message;
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  }
}

export default { render, onMount };
