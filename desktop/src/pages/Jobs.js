import { fetchJobs, createJob, updateJob, deleteJob } from "../apiClient.js";

let _jobs = [];
let _loading = true;
let _error = null;
let _showForm = false;
let _saving = false;
let _selectedJob = null;
let _currentFilter = "all";
let _statusMsg = null;

const STATUS_CONFIG = {
  discovered: { label: "Not Yet Applied", color: "#475569", bg: "#f1f5f9", icon: "⏳" },
  applied: { label: "Applied", color: "#166534", bg: "#dcfce7", icon: "📤" },
  interviewing: { label: "Interviewing", color: "#6b21a8", bg: "#f3e8ff", icon: "💼" },
  unavailable: { label: "No Longer Available", color: "#991b1b", bg: "#fee2e2", icon: "⛔" },
  not_interested: { label: "Not Interested / Closed", color: "#334155", bg: "#e2e8f0", icon: "🚫" },
};

const STATUS_CATEGORIES = [
  { id: "all", label: "All Opportunities" },
  { id: "discovered", label: "Not Yet Applied", icon: "⏳" },
  { id: "applied", label: "Applied", icon: "📤" },
  { id: "interviewing", label: "Interviewing", icon: "💼" },
  { id: "unavailable", label: "No Longer Available", icon: "⛔" },
  { id: "not_interested", label: "Closed / Passed", icon: "🚫" },
];

function normalizeStatus(status) {
  if (!status) return "discovered";
  const s = String(status).toLowerCase().trim();
  if (s === "saved" || s === "discovered" || s === "new") return "discovered";
  if (s === "applied" || s === "submitting" || s === "submitted") return "applied";
  if (s === "interview" || s === "interviewing") return "interviewing";
  if (s === "unavailable" || s === "closed" || s === "expired" || s.includes("no longer")) return "unavailable";
  if (s === "not_interested" || s === "declined" || s === "rejected") return "not_interested";
  return s in STATUS_CONFIG ? s : "discovered";
}

function setFlashMessage(msg) {
  _statusMsg = msg;
  setTimeout(() => {
    _statusMsg = null;
    const container = document.getElementById("pageContainer");
    if (container) {
      container.innerHTML = render();
      bindEvents(container);
    }
  }, 4000);
}

function renderJobModal() {
  if (!_selectedJob) return "";
  const j = _selectedJob;
  const currStatus = normalizeStatus(j.status);
  const cfg = STATUS_CONFIG[currStatus] || STATUS_CONFIG.discovered;
  const scoreBadge = j.fit_score != null ? `<span class="badge badge-info" style="margin-left: 8px;">Fit: ${j.fit_score}/100</span>` : "";

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

          <!-- Categorization & Status Bar -->
          <div style="background: var(--color-bg); padding: 14px 18px; border-radius: 8px; border: 1px solid var(--color-border); margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 280px;">
              <label for="modalJobStatusSelect" style="font-weight: 600; font-size: 13px; color: var(--color-text); white-space: nowrap;">Status / Category:</label>
              <select id="modalJobStatusSelect" class="form-input" style="padding: 6px 12px; font-weight: 600; font-size: 13px; border-radius: 6px; background: ${cfg.bg}; color: ${cfg.color}; border: 1px solid var(--color-border); flex: 1; max-width: 260px;">
                <option value="discovered" ${currStatus === 'discovered' ? 'selected' : ''}>⏳ Not Yet Applied</option>
                <option value="applied" ${currStatus === 'applied' ? 'selected' : ''}>📤 Applied</option>
                <option value="interviewing" ${currStatus === 'interviewing' ? 'selected' : ''}>💼 Interviewing</option>
                <option value="unavailable" ${currStatus === 'unavailable' ? 'selected' : ''}>⛔ Job No Longer Available</option>
                <option value="not_interested" ${currStatus === 'not_interested' ? 'selected' : ''}>🚫 Not Interested / Closed</option>
              </select>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              ${currStatus !== 'unavailable' ? `
                <button class="btn btn-secondary btn-sm" id="btnQuickMarkUnavailable" style="color: #991b1b; font-weight: 500;">
                  ⛔ Mark No Longer Available
                </button>
              ` : ''}
              ${currStatus !== 'applied' ? `
                <button class="btn btn-secondary btn-sm" id="btnQuickMarkApplied" style="color: #166534; font-weight: 500;">
                  📤 Mark Applied
                </button>
              ` : ''}
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 16px;">
            <span class="badge" style="background: ${cfg.bg}; color: ${cfg.color}; font-weight: 600;">${cfg.icon} ${cfg.label}</span>
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
        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <button class="btn btn-secondary btn-sm" id="btnDeleteJobModal" style="color: var(--color-error);">🗑️ Delete Job</button>
          </div>
          <div style="display: flex; gap: 8px;">
            ${j.url ? `<a href="${j.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">🌐 Open on Job Site ↗</a>` : ""}
            <a href="#resumes" class="btn btn-secondary">📑 Tailor Resume</a>
            <button class="btn btn-secondary" id="btnCloseJobModal">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function render() {
  // Category counts
  const counts = {
    all: _jobs.length,
    discovered: 0,
    applied: 0,
    interviewing: 0,
    unavailable: 0,
    not_interested: 0,
  };

  for (const j of _jobs) {
    const st = normalizeStatus(j.status);
    if (st in counts) counts[st]++;
    else counts.discovered++;
  }

  // Filter tabs HTML
  const filterTabsHtml = `
    <div class="job-category-tabs" style="display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 4px; flex-wrap: wrap;">
      ${STATUS_CATEGORIES.map(cat => {
        const count = counts[cat.id] ?? 0;
        const isActive = _currentFilter === cat.id;
        return `
          <button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'} job-filter-btn" data-filter="${cat.id}" style="border-radius: 20px; padding: 6px 14px; font-weight: ${isActive ? '600' : '500'}; display: flex; align-items: center; gap: 6px;">
            ${cat.icon ? `<span>${cat.icon}</span>` : ''}
            <span>${cat.label}</span>
            <span style="opacity: 0.85; font-size: 11px; background: ${isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)'}; padding: 1px 7px; border-radius: 10px;">${count}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  // Filtered jobs list
  const filteredJobs = _currentFilter === "all"
    ? _jobs
    : _jobs.filter(j => normalizeStatus(j.status) === _currentFilter);

  let listHtml = "";
  if (_loading) {
    listHtml = '<p class="health-checking">Loading jobs...</p>';
  } else if (_error) {
    listHtml = `<p class="health-error">${_error}</p>`;
  } else if (_jobs.length === 0) {
    listHtml = `<div class="empty-state"><div class="empty-state-icon">💼</div><p>No jobs tracked yet.</p><p class="placeholder-hint">Add a job to start tracking and evaluating opportunities.</p></div>`;
  } else if (filteredJobs.length === 0) {
    const currentCat = STATUS_CATEGORIES.find(c => c.id === _currentFilter);
    listHtml = `
      <div class="empty-state" style="padding: 40px 20px; background: #fff; border-radius: 8px; border: 1px dashed var(--color-border); text-align: center;">
        <p style="font-size: 15px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 12px;">
          No jobs categorized as "${currentCat ? currentCat.label : _currentFilter}".
        </p>
        <button class="btn btn-secondary btn-sm" id="btnResetFilter">View All Jobs</button>
      </div>
    `;
  } else {
    listHtml = '<div class="item-list">';
    for (const j of filteredJobs) {
      const currStatus = normalizeStatus(j.status);
      const cfg = STATUS_CONFIG[currStatus] || STATUS_CONFIG.discovered;
      const score = j.fit_score != null ? `<span class="item-card-score">Fit: ${j.fit_score}/100</span>` : "";

      listHtml += `
        <div class="item-card" data-job-id="${j.id}" style="cursor: pointer; padding: 16px; margin-bottom: 12px; border-left: 4px solid ${cfg.color};" title="Click anywhere on card to view full details and notes">
          <div class="item-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div>
              <strong style="font-size: 16px; color: var(--color-text);">${j.title || "Untitled"}</strong>
              ${j.company ? `<span class="item-card-company" style="margin-left: 8px; font-weight: 500;">@ ${j.company}</span>` : ""}
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
              ${j.url ? `<a href="${j.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" onclick="event.stopPropagation()">🌐 Open Link ↗</a>` : ""}
              <button class="btn btn-secondary btn-sm btn-open-modal" data-job-id="${j.id}">👁 View Details</button>
            </div>
          </div>
          <div class="item-card-details" style="margin-top: 10px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            ${j.location ? `<span>📍 ${j.location}</span>` : ""}

            <!-- Quick status selector on card -->
            <select class="job-status-quick-select" data-job-id="${j.id}" onclick="event.stopPropagation()" style="font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 6px; border: 1px solid var(--color-border); background: ${cfg.bg}; color: ${cfg.color}; cursor: pointer;">
              <option value="discovered" ${currStatus === 'discovered' ? 'selected' : ''}>⏳ Not Yet Applied</option>
              <option value="applied" ${currStatus === 'applied' ? 'selected' : ''}>📤 Applied</option>
              <option value="interviewing" ${currStatus === 'interviewing' ? 'selected' : ''}>💼 Interviewing</option>
              <option value="unavailable" ${currStatus === 'unavailable' ? 'selected' : ''}>⛔ No Longer Available</option>
              <option value="not_interested" ${currStatus === 'not_interested' ? 'selected' : ''}>🚫 Closed / Passed</option>
            </select>

            ${score}
            <span class="item-card-date" style="margin-left: auto;">Added: ${new Date(j.created_at).toLocaleDateString()}</span>
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
        <label for="jobStatus">Initial Status / Category</label>
        <select id="jobStatus" class="form-input">
          <option value="discovered" selected>⏳ Not Yet Applied</option>
          <option value="applied">📤 Applied</option>
          <option value="interviewing">💼 Interviewing</option>
          <option value="unavailable">⛔ No Longer Available</option>
          <option value="not_interested">🚫 Not Interested / Closed</option>
        </select>
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
      <p class="page-subtitle">Track, categorize, and segregate job opportunities throughout your search pipeline.</p>
      
      ${_statusMsg ? `<div class="status-ok" style="margin-bottom: 14px; padding: 10px 14px; background: #e8f5e9; border-radius: 6px; font-weight: 500;">${_statusMsg}</div>` : ''}

      <div class="page-actions" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <button class="btn btn-primary" id="showAddJobBtn">+ Add Job</button>
      </div>
      ${formHtml}
      ${filterTabsHtml}
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

async function handleStatusChange(jobId, newStatus) {
  const job = _jobs.find(j => String(j.id) === String(jobId));
  if (!job) return;

  const prevStatus = job.status;
  job.status = newStatus;
  if (_selectedJob && String(_selectedJob.id) === String(jobId)) {
    _selectedJob.status = newStatus;
  }

  const res = await updateJob(jobId, { status: newStatus });
  if (res.status === "ok") {
    const label = STATUS_CONFIG[newStatus]?.label || newStatus;
    setFlashMessage(`Updated "${job.title || 'Job'}" status to "${label}".`);
  } else {
    job.status = prevStatus;
    if (_selectedJob && String(_selectedJob.id) === String(jobId)) {
      _selectedJob.status = prevStatus;
    }
    alert(res.message || "Failed to update job status.");
  }

  const container = document.getElementById("pageContainer");
  if (container) {
    container.innerHTML = render();
    bindEvents(container);
  }
}

function bindEvents(container) {
  if (!container) return;

  // Filter category buttons
  container.querySelectorAll(".job-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      _currentFilter = btn.dataset.filter || "all";
      container.innerHTML = render();
      bindEvents(container);
    });
  });

  const btnReset = document.getElementById("btnResetFilter");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      _currentFilter = "all";
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // Quick status selector on item cards
  container.querySelectorAll(".job-status-quick-select").forEach((sel) => {
    sel.addEventListener("change", (e) => {
      e.stopPropagation();
      const jobId = sel.dataset.jobId;
      const newStatus = sel.value;
      handleStatusChange(jobId, newStatus);
    });
  });

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

  // Modal Status dropdown change
  const modalStatusSelect = document.getElementById("modalJobStatusSelect");
  if (modalStatusSelect && _selectedJob) {
    modalStatusSelect.addEventListener("change", (e) => {
      handleStatusChange(_selectedJob.id, e.target.value);
    });
  }

  // Quick "Mark No Longer Available" button in modal
  const btnMarkUnavailable = document.getElementById("btnQuickMarkUnavailable");
  if (btnMarkUnavailable && _selectedJob) {
    btnMarkUnavailable.addEventListener("click", () => {
      handleStatusChange(_selectedJob.id, "unavailable");
    });
  }

  // Quick "Mark Applied" button in modal
  const btnMarkApplied = document.getElementById("btnQuickMarkApplied");
  if (btnMarkApplied && _selectedJob) {
    btnMarkApplied.addEventListener("click", () => {
      handleStatusChange(_selectedJob.id, "applied");
    });
  }

  // Delete Job button in modal
  const btnDeleteJob = document.getElementById("btnDeleteJobModal");
  if (btnDeleteJob && _selectedJob) {
    btnDeleteJob.addEventListener("click", async () => {
      if (!window.confirm(`Are you sure you want to delete "${_selectedJob.title || 'this job'}" from your tracker?`)) return;
      const idToDelete = _selectedJob.id;
      const titleToDelete = _selectedJob.title || "Job";
      const res = await deleteJob(idToDelete);
      if (res.status === "ok") {
        _jobs = _jobs.filter(j => j.id !== idToDelete);
        _selectedJob = null;
        setFlashMessage(`Deleted "${titleToDelete}" from tracker.`);
      } else {
        alert(res.message || "Failed to delete job.");
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  }

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
      const status = document.getElementById("jobStatus")?.value || "discovered";
      const jd_text = document.getElementById("jobJdText")?.value || "";

      _saving = true;
      container.innerHTML = render();
      bindEvents(container);

      const result = await createJob({ title, company, location, url, status, jd_text });
      _saving = false;
      _showForm = false;
      if (result.status === "ok") {
        _jobs.unshift(result.data);
        _error = null;
        setFlashMessage(`Added job "${title}".`);
      } else {
        _error = result.message;
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  }
}

export default { render, onMount };
