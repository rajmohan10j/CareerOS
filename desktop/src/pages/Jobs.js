import { fetchJobs, createJob } from "../apiClient.js";

let _jobs = [];
let _loading = true;
let _error = null;
let _showForm = false;
let _saving = false;

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
      const score = j.fit_score != null ? `<span class="item-card-score">Fit: ${j.fit_score}/100</span>` : '';
      const status = j.status ? `<span class="item-card-status">${j.status}</span>` : '';
      listHtml += `
        <div class="item-card" data-job-id="${j.id}">
          <div class="item-card-header">
            <strong>${j.title || 'Untitled'}</strong>
            ${j.company ? `<span class="item-card-company">@ ${j.company}</span>` : ''}
          </div>
          <div class="item-card-details">
            ${j.location ? `<span>${j.location}</span>` : ''}
            ${status}
            ${score}
            <span class="item-card-date">Added: ${new Date(j.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      `;
    }
    listHtml += '</div>';
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
        <button class="btn btn-primary" id="saveJobBtn" ${_saving ? 'disabled' : ''}>${_saving ? 'Adding...' : 'Add Job'}</button>
        <button class="btn btn-secondary" id="cancelJobBtn">Cancel</button>
      </div>
    </div>
  ` : '';

  return `
    <div class="page jobs-page">
      <h1 class="page-title">Job Tracker</h1>
      <p class="page-subtitle">Track job opportunities and evaluate fit with your profile.</p>
      <div class="page-actions">
        <button class="btn btn-primary" id="showAddJobBtn">+ Add Job</button>
      </div>
      ${formHtml}
      ${listHtml}
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
