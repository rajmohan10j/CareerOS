import { fetchJobs, createJob } from "../apiClient.js";

let _jobs = [];
let _loading = true;
let _error = null;
let _showForm = false;
let _saving = false;
let _selectedJob = null;

function renderJobModal() {
  if (!_selectedJob) return "";
  const j = _selectedJob;
  const scoreBadge = j.fit_score != null ? `<span class="badge badge-info" style="margin-left: 8px;">Fit: ${j.fit_score}/100</span>` : "";
  const statusBadge = j.status ? `<span class="badge badge-secondary">${j.status}</span>` : "";

  return `
    <div class="modal-overlay" id="jobModalOverlay">
      <div class="modal-card" style="max-width: 750px;">
        <div class="modal-header">
          <div>
            <h3 style="margin: 0;">${j.title || "Untitled Job"}</h3>
            <p style="margin: 4px 0 0 0; color: var(--color-text-secondary); font-size: 14px;">
              ${j.company ? `@ ${j.company}` : "Company Unspecified"} ${j.location ? `• 📍 ${j.location}` : ""}
            </p>
          </div>
          <button class="modal-close" id="btnCloseJobModalX" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 16px;">
            ${statusBadge}
            ${scoreBadge}
            <span style="font-size: 12px; color: var(--color-text-secondary); margin-left: auto;">
              Added: ${new Date(j.created_at).toLocaleDateString()}
            </span>
          </div>

          ${j.url ? `
            <div style="margin-bottom: 16px; padding: 10px 14px; background: rgba(21, 101, 192, 0.06); border-radius: 6px; border: 1px solid rgba(21, 101, 192, 0.2);">
              <strong>Job URL / Link:</strong><br />
              <a href="${j.url}" target="_blank" rel="noopener noreferrer" class="link-external" style="word-break: break-all; font-weight: 500;">
                ${j.url} ↗
              </a>
            </div>
          ` : ""}

          ${j.notes ? `
            <div style="margin-bottom: 16px;">
              <strong>Application & Source Details:</strong>
              <div style="background: var(--color-bg); padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-top: 6px; white-space: pre-wrap; font-family: inherit;">${j.notes}</div>
            </div>
          ` : ""}

          <div>
            <strong>Job Description:</strong>
            <div class="job-full-text" style="max-height: 320px;">
              ${j.jd_text ? j.jd_text.replace(/\n/g, "<br/>") : "No detailed description text saved."}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          ${j.url ? `<a href="${j.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">🌐 Open on Job Site ↗</a>` : ""}
          <a href="#resumes" class="btn btn-secondary">📑 Tailor Resume</a>
          <button class="btn btn-secondary" id="btnCloseJobModal">Close</button>
        </div>
      </div>
    </div>
  `;
}

function render() {
  let listHtml = "";
  if (_loading) {
    listHtml = '<p class="health-checking">Loading jobs...</p>';
  } else if (_error) {
    listHtml = `<p class="health-error">${_error}</p>`;
  } else if (_jobs.length === 0) {
    listHtml = `<div class="empty-state"><div class="empty-state-icon">💼</div><p>No jobs tracked yet.</p><p class="placeholder-hint">Add a job to start tracking and evaluating opportunities.</p></div>`;
  } else {
    listHtml = '<div class="item-list">';
    for (const j of _jobs) {
      const score = j.fit_score != null ? `<span class="item-card-score">Fit: ${j.fit_score}/100</span>` : "";
      const status = j.status ? `<span class="item-card-status">${j.status}</span>` : "";
      const link = j.url ? `<a href="${j.url}" target="_blank" rel="noopener noreferrer" class="link-external" style="margin-left: auto; font-size: 12px;" onclick="event.stopPropagation()">Open Link ↗</a>` : "";
      listHtml += `
        <div class="item-card" data-job-id="${j.id}" style="cursor: pointer;" title="Click to view details and application link">
          <div class="item-card-header">
            <strong>${j.title || "Untitled"}</strong>
            ${j.company ? `<span class="item-card-company">@ ${j.company}</span>` : ""}
            ${link}
          </div>
          <div class="item-card-details">
            ${j.location ? `<span>${j.location}</span>` : ""}
            ${status}
            ${score}
            <span class="item-card-date">Added: ${new Date(j.created_at).toLocaleDateString()}</span>
            <span style="font-size: 12px; color: var(--color-primary); margin-left: 6px;">👁 View ➔</span>
          </div>
        </div>
      `;
    }
    listHtml += "</div>";
  }

  const formHtml = _showForm ? `
    <div class="inline-form">
      <h3>Add Job</h3>
      <div class="setting-group">
        <label for="jobTitle">Job Title</label>
        <input type="text" id="jobTitle" class="form-input" placeholder="e.g. Software Engineer" />
      </div>
      <div class="setting-group">
        <label for="jobCompany">Company</label>
        <input type="text" id="jobCompany" class="form-input" placeholder="e.g. Acme Corp" />
      </div>
      <div class="setting-group">
        <label for="jobLocation">Location</label>
        <input type="text" id="jobLocation" class="form-input" placeholder="e.g. Remote, New York" />
      </div>
      <div class="setting-group">
        <label for="jobUrl">URL</label>
        <input type="url" id="jobUrl" class="form-input" placeholder="https://..." />
      </div>
      <div class="setting-group">
        <label for="jobJdText">Job Description</label>
        <textarea id="jobJdText" class="form-textarea" rows="4" placeholder="Paste the job description..."></textarea>
      </div>
      <div class="setting-actions">
        <button class="btn btn-primary" id="saveJobBtn" ${_saving ? "disabled" : ""}>${_saving ? "Adding..." : "Add Job"}</button>
        <button class="btn btn-secondary" id="cancelJobBtn">Cancel</button>
      </div>
    </div>
  ` : "";

  return `
    <div class="page jobs-page">
      <h1 class="page-title">Job Tracker</h1>
      <p class="page-subtitle">Track job opportunities and evaluate fit with your profile.</p>
      <div class="page-actions">
        <button class="btn btn-primary" id="showAddJobBtn">+ Add Job</button>
      </div>
      ${formHtml}
      ${listHtml}
      ${renderJobModal()}
    </div>
  `;
}

async function onMount() {
  _loading = true;
  _error = null;
  const result = await fetchJobs();
  if (result.status === "ok") {
    _jobs = Array.isArray(result.data) ? result.data : [];
    _error = null;
  } else {
    _jobs = [];
    _error = result.message;
  }
  _loading = false;
  const container = document.getElementById("pageContainer");
  if (container) container.innerHTML = render();
  bindEvents(container);
}

function bindEvents(container) {
  if (!container) return;

  // Open Job Details Modal on item-card click
  container.querySelectorAll(".item-card").forEach((card) => {
    card.addEventListener("click", () => {
      const jobId = card.dataset.jobId;
      const found = _jobs.find((j) => String(j.id) === String(jobId));
      if (found) {
        _selectedJob = found;
        container.innerHTML = render();
        bindEvents(container);
      }
    });
  });

  // Close Job Details Modal
  const closeBtn = document.getElementById("btnCloseJobModal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      _selectedJob = null;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const closeBtnX = document.getElementById("btnCloseJobModalX");
  if (closeBtnX) {
    closeBtnX.addEventListener("click", () => {
      _selectedJob = null;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const overlay = document.getElementById("jobModalOverlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        _selectedJob = null;
        container.innerHTML = render();
        bindEvents(container);
      }
    });
  }

  const showBtn = document.getElementById("showAddJobBtn");
  if (showBtn) {
    showBtn.addEventListener("click", () => {
      _showForm = true;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const cancelBtn = document.getElementById("cancelJobBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      _showForm = false;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const saveBtn = document.getElementById("saveJobBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const title = document.getElementById("jobTitle")?.value || "";
      const company = document.getElementById("jobCompany")?.value || "";
      const location = document.getElementById("jobLocation")?.value || "";
      const url = document.getElementById("jobUrl")?.value || "";
      const jd_text = document.getElementById("jobJdText")?.value || "";

      _saving = true;
      container.innerHTML = render();
      bindEvents(container);

      const result = await createJob({ title, company, location, url, jd_text });
      _saving = false;
      _showForm = false;
      if (result.status === "ok") {
        _jobs.unshift(result.data);
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
