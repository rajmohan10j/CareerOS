import {
  fetchLinkedInStatus,
  searchLinkedInJobs,
  fetchLinkedInJobDetails,
  importLinkedInJob,
  fetchLinkedInSavedJobs,
} from "../apiClient.js";

let _activeTab = "search"; // "search" | "saved" | "status"
let _status = null;
let _searching = false;
let _searchError = null;
let _searchResults = [];
let _importedJobIds = new Set();
let _detailModal = null;
let _loadingDetail = false;

// Search form state
let _keywords = "Director of Operations";
let _location = "Remote";
let _workType = "2"; // remote
let _experience = "5"; // director
let _datePosted = "past_week";
let _easyApply = false;

// Saved jobs state
let _savedStage = "saved";
let _savedJobs = [];
let _loadingSaved = false;

function render() {
  const statusBadge = _status && _status.logged_in
    ? '<span class="status-pill status-pill-success">🟢 Session Active</span>'
    : '<span class="status-pill status-pill-warning">🟡 Session Checking</span>';

  return `
    <div class="page-container linkedin-page">
      <div class="page-header">
        <div>
          <h2>LinkedIn Intelligence Hub</h2>
          <p class="page-subtitle">Search, discover, evaluate, and sync LinkedIn jobs directly to CareerOS with zero cloud telemetry.</p>
        </div>
        <div class="header-actions">
          ${statusBadge}
        </div>
      </div>

      <div class="tab-nav">
        <button class="tab-btn ${_activeTab === 'search' ? 'tab-btn-active' : ''}" data-tab="search">🔍 Job Discovery</button>
        <button class="tab-btn ${_activeTab === 'saved' ? 'tab-btn-active' : ''}" data-tab="saved">📑 Saved & Applied Sync</button>
        <button class="tab-btn ${_activeTab === 'status' ? 'tab-btn-active' : ''}" data-tab="status">⚙ Session & Health</button>
      </div>

      <div class="tab-content">
        ${_activeTab === 'search' ? renderSearchTab() : ''}
        ${_activeTab === 'saved' ? renderSavedTab() : ''}
        ${_activeTab === 'status' ? renderStatusTab() : ''}
      </div>

      ${_detailModal ? renderDetailModal() : ''}
    </div>
  `;
}

function renderSearchTab() {
  return `
    <div class="card search-card">
      <form id="linkedinSearchForm" class="search-form-grid">
        <div class="form-group span-2">
          <label for="liKeywords">Keywords / Target Title</label>
          <input type="text" id="liKeywords" class="form-input" placeholder="e.g. Director of Engineering, Operations Lead" value="${_keywords}" required />
        </div>
        <div class="form-group span-2">
          <label for="liLocation">Location</label>
          <input type="text" id="liLocation" class="form-input" placeholder="e.g. Remote, United States, India" value="${_location}" />
        </div>

        <div class="form-group">
          <label for="liWorkType">Work Type</label>
          <select id="liWorkType" class="form-input">
            <option value="" ${_workType === '' ? 'selected' : ''}>Any</option>
            <option value="2" ${_workType === '2' ? 'selected' : ''}>Remote</option>
            <option value="3" ${_workType === '3' ? 'selected' : ''}>Hybrid</option>
            <option value="1" ${_workType === '1' ? 'selected' : ''}>On-site</option>
          </select>
        </div>

        <div class="form-group">
          <label for="liExperience">Experience Level</label>
          <select id="liExperience" class="form-input">
            <option value="" ${_experience === '' ? 'selected' : ''}>Any</option>
            <option value="6" ${_experience === '6' ? 'selected' : ''}>Executive</option>
            <option value="5" ${_experience === '5' ? 'selected' : ''}>Director</option>
            <option value="4" ${_experience === '4' ? 'selected' : ''}>Mid-Senior</option>
            <option value="3" ${_experience === '3' ? 'selected' : ''}>Associate</option>
            <option value="2" ${_experience === '2' ? 'selected' : ''}>Entry level</option>
          </select>
        </div>

        <div class="form-group">
          <label for="liDatePosted">Date Posted</label>
          <select id="liDatePosted" class="form-input">
            <option value="" ${_datePosted === '' ? 'selected' : ''}>Any time</option>
            <option value="past_24_hours" ${_datePosted === 'past_24_hours' ? 'selected' : ''}>Past 24 Hours</option>
            <option value="past_week" ${_datePosted === 'past_week' ? 'selected' : ''}>Past Week</option>
            <option value="past_month" ${_datePosted === 'past_month' ? 'selected' : ''}>Past Month</option>
          </select>
        </div>

        <div class="form-group checkbox-group">
          <label class="checkbox-label" for="liEasyApply">
            <input type="checkbox" id="liEasyApply" ${_easyApply ? 'checked' : ''} />
            <span>⚡ Easy Apply Only</span>
          </label>
        </div>

        <div class="form-group span-4 form-actions">
          <button type="submit" class="btn btn-primary" id="btnSearchLinkedIn" ${_searching ? 'disabled' : ''}>
            ${_searching ? '<span class="spinner-small"></span> Searching LinkedIn...' : '🔍 Search LinkedIn Jobs'}
          </button>
        </div>
      </form>
    </div>

    ${_searchError ? `<div class="alert alert-error">${_searchError}</div>` : ''}

    <div class="search-results-section">
      ${renderSearchResults()}
    </div>
  `;
}

function renderSearchResults() {
  if (_searching) {
    return `
      <div class="loading-state">
        <div class="pulse-ring"></div>
        <p>Connecting to LinkedIn stealth engine... scraping top matching jobs...</p>
        <p class="placeholder-hint">Pacing requests to respect anti-bot safety limits.</p>
      </div>
    `;
  }

  if (!_searchResults || _searchResults.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🌐</div>
        <p>No LinkedIn jobs loaded yet.</p>
        <p class="placeholder-hint">Enter your search keywords above to discover matching roles.</p>
      </div>
    `;
  }

  const cards = _searchResults.map((job) => {
    const isImported = _importedJobIds.has(job.job_id);
    const fitBadge = job.fit_score != null
      ? `<span class="badge ${job.fit_score >= 80 ? 'badge-success' : 'badge-info'}">Fit: ${job.fit_score}%</span>`
      : '';
    const applyBadge = job.apply_type === 'easy_apply'
      ? '<span class="badge badge-purple">⚡ Easy Apply</span>'
      : '<span class="badge badge-secondary">↗ External Apply</span>';

    const matchedTags = (job.matched_skills || [])
      .map(s => `<span class="skill-tag">${s}</span>`)
      .join(" ");

    return `
      <div class="job-result-card" data-job-id="${job.job_id}">
        <div class="job-result-header">
          <div>
            <h3 class="job-result-title">${job.title}</h3>
            <p class="job-result-company">${job.company} • 📍 ${job.location}</p>
          </div>
          <div class="job-result-badges">
            ${applyBadge}
            ${fitBadge}
          </div>
        </div>

        ${matchedTags ? `<div class="job-matched-skills"><small>Matched Skills:</small> ${matchedTags}</div>` : ''}

        <p class="job-snippet">${job.snippet || 'Click View Details for complete role description and requirements.'}</p>

        <div class="job-result-footer">
          <div class="footer-links">
            <a href="${job.url}" target="_blank" rel="noopener noreferrer" class="link-external">Open on LinkedIn ↗</a>
          </div>
          <div class="footer-buttons">
            <button class="btn btn-secondary btn-sm btn-view-details" data-job-id="${job.job_id}">👁 View Details</button>
            <button class="btn ${isImported ? 'btn-success' : 'btn-primary'} btn-sm btn-import-job" data-job-id="${job.job_id}" ${isImported ? 'disabled' : ''}>
              ${isImported ? 'Imported ✅' : '📥 Import to Jobs'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="results-header">
      <h4>Found ${_searchResults.length} LinkedIn Opportunities</h4>
    </div>
    <div class="job-results-list">
      ${cards}
    </div>
  `;
}

function renderSavedTab() {
  return `
    <div class="card saved-tab-card">
      <div class="saved-controls">
        <label for="savedStageSelect">Select Tracker Stage:</label>
        <select id="savedStageSelect" class="form-input" style="width: auto; display: inline-block;">
          <option value="saved" ${_savedStage === 'saved' ? 'selected' : ''}>Saved Jobs</option>
          <option value="in_progress" ${_savedStage === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="applied" ${_savedStage === 'applied' ? 'selected' : ''}>Applied Jobs</option>
          <option value="archived" ${_savedStage === 'archived' ? 'selected' : ''}>Archived Jobs</option>
        </select>
        <button id="btnFetchSaved" class="btn btn-primary btn-sm" ${_loadingSaved ? 'disabled' : ''}>
          ${_loadingSaved ? 'Fetching...' : '🔄 Sync from LinkedIn'}
        </button>
      </div>

      <div class="saved-list-container">
        ${_loadingSaved ? '<p class="health-checking">Fetching your saved tracker jobs from LinkedIn...</p>' : ''}
        ${!_loadingSaved && _savedJobs.length === 0 ? '<p class="placeholder-hint">Click Sync to load your bookmarked LinkedIn jobs.</p>' : ''}
        ${!_loadingSaved && _savedJobs.length > 0 ? renderSavedList() : ''}
      </div>
    </div>
  `;
}

function renderSavedList() {
  return `
    <ul class="saved-jobs-list">
      ${_savedJobs.map(j => `
        <li class="saved-job-item">
          <div>
            <strong>Job ID: ${j.job_id}</strong>
            <a href="${j.url}" target="_blank" class="link-external" style="margin-left: 10px;">View Posting ↗</a>
          </div>
          <button class="btn btn-secondary btn-sm btn-import-saved" data-job-id="${j.job_id}">📥 Import</button>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderStatusTab() {
  const s = _status || {};
  return `
    <div class="card status-tab-card">
      <h3>LinkedIn MCP Session Diagnostics</h3>
      <table class="diagnostics-table">
        <tr>
          <td><strong>Status:</strong></td>
          <td>${s.logged_in ? '🟢 Active & Logged In' : '🔴 Not Logged In'}</td>
        </tr>
        <tr>
          <td><strong>Message:</strong></td>
          <td>${s.message || 'Unknown'}</td>
        </tr>
        <tr>
          <td><strong>Profile Path:</strong></td>
          <td><code>${s.profile_path || 'None'}</code></td>
        </tr>
        <tr>
          <td><strong>Cookies Path:</strong></td>
          <td><code>${s.cookies_path || 'None'}</code></td>
        </tr>
        <tr>
          <td><strong>Stealth Engine:</strong></td>
          <td>Patchright Chromium 1.64.1 (Anti-Bot Bot-Bypass Active)</td>
        </tr>
      </table>
      <div style="margin-top: 15px;">
        <button id="btnRefreshStatus" class="btn btn-secondary btn-sm">🔄 Recheck Status</button>
      </div>
    </div>
  `;
}

function renderDetailModal() {
  const m = _detailModal;
  return `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3>${m.title}</h3>
          <button class="modal-close" id="btnCloseModal">×</button>
        </div>
        <div class="modal-body">
          <p><strong>Company:</strong> ${m.company} • <strong>Location:</strong> ${m.location}</p>
          <p><strong>Apply Mode:</strong> ${m.apply_type === 'easy_apply' ? '⚡ Easy Apply' : '↗ External'}</p>
          ${m.apply_url ? `<p><strong>Application Link:</strong> <a href="${m.apply_url}" target="_blank" class="link-external">${m.apply_url}</a></p>` : ''}
          ${m.fit_score != null ? `<div class="alert alert-info"><strong>CareerOS AI Fit Score: ${m.fit_score}%</strong><br/><small>${m.recommendation || ''}</small></div>` : ''}
          <hr />
          <h4>About the Job:</h4>
          <div class="job-full-text">${m.full_text ? m.full_text.replace(/\n/g, '<br/>') : 'No description text extracted.'}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btnCloseModalBtn">Close</button>
          <button class="btn btn-primary" id="btnModalImport" data-job-id="${m.job_id}">📥 Import into CareerOS</button>
        </div>
      </div>
    </div>
  `;
}

async function onMount(container) {
  // Check session status on mount if not checked
  if (!_status) {
    const res = await fetchLinkedInStatus();
    if (res.status === "ok") {
      _status = res.data;
      updateHeaderStatus(container);
    }
  }

  // Bind tab switching
  container.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      _activeTab = btn.dataset.tab;
      container.innerHTML = render();
      onMount(container);
    });
  });

  // Bind search form
  const form = container.querySelector("#linkedinSearchForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      _keywords = container.querySelector("#liKeywords").value.trim();
      _location = container.querySelector("#liLocation").value.trim();
      _workType = container.querySelector("#liWorkType").value;
      _experience = container.querySelector("#liExperience").value;
      _datePosted = container.querySelector("#liDatePosted").value;
      _easyApply = container.querySelector("#liEasyApply").checked;

      _searching = true;
      _searchError = null;
      container.innerHTML = render();
      onMount(container);

      const res = await searchLinkedInJobs({
        keywords: _keywords,
        location: _location || null,
        work_type: _workType || null,
        experience_level: _experience || null,
        date_posted: _datePosted || null,
        easy_apply: _easyApply,
        max_pages: 1,
      });

      _searching = false;
      if (res.status === "ok") {
        _searchResults = res.data.jobs || [];
        if (res.data.errors && res.data.errors.length > 0) {
          _searchError = res.data.errors.join(", ");
        }
      } else {
        _searchError = res.message || "Failed to search LinkedIn jobs.";
      }

      container.innerHTML = render();
      onMount(container);
    });
  }

  // Bind import button clicks
  container.querySelectorAll(".btn-import-job").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const jid = btn.dataset.jobId;
      const job = _searchResults.find((j) => j.job_id === jid);
      if (!job) return;

      btn.disabled = true;
      btn.innerText = "Importing...";

      const res = await importLinkedInJob({
        job_id: job.job_id,
        title: job.title,
        company: job.company,
        location: job.location,
        url: job.url,
        jd_text: job.snippet,
        apply_type: job.apply_type,
        apply_url: job.apply_url,
      });

      if (res.status === "ok") {
        _importedJobIds.add(jid);
        btn.innerText = "Imported ✅";
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-success");
      } else {
        btn.disabled = false;
        btn.innerText = "Retry Import";
        alert(res.message || "Failed to import job.");
      }
    });
  });

  // Bind view details
  container.querySelectorAll(".btn-view-details").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const jid = btn.dataset.jobId;
      btn.innerText = "Loading...";
      btn.disabled = true;

      const res = await fetchLinkedInJobDetails(jid);
      btn.innerText = "👁 View Details";
      btn.disabled = false;

      if (res.status === "ok") {
        _detailModal = res.data;
        container.innerHTML = render();
        onMount(container);
      } else {
        alert(res.message || "Failed to load job details.");
      }
    });
  });

  // Bind modal close
  const closeBtn = container.querySelector("#btnCloseModal");
  const closeBtn2 = container.querySelector("#btnCloseModalBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      _detailModal = null;
      container.innerHTML = render();
      onMount(container);
    });
  }
  if (closeBtn2) {
    closeBtn2.addEventListener("click", () => {
      _detailModal = null;
      container.innerHTML = render();
      onMount(container);
    });
  }

  // Modal import
  const modalImport = container.querySelector("#btnModalImport");
  if (modalImport && _detailModal) {
    modalImport.addEventListener("click", async () => {
      modalImport.disabled = true;
      modalImport.innerText = "Importing...";
      const res = await importLinkedInJob({
        job_id: _detailModal.job_id,
        title: _detailModal.title,
        company: _detailModal.company,
        location: _detailModal.location,
        url: _detailModal.url,
        jd_text: _detailModal.full_text,
        apply_type: _detailModal.apply_type,
        apply_url: _detailModal.apply_url,
      });
      if (res.status === "ok") {
        _importedJobIds.add(_detailModal.job_id);
        modalImport.innerText = "Imported ✅";
        modalImport.classList.remove("btn-primary");
        modalImport.classList.add("btn-success");
      } else {
        modalImport.disabled = false;
        modalImport.innerText = "Retry Import";
        alert(res.message || "Failed to import job.");
      }
    });
  }

  // Bind saved jobs fetch
  const btnFetchSaved = container.querySelector("#btnFetchSaved");
  if (btnFetchSaved) {
    btnFetchSaved.addEventListener("click", async () => {
      const select = container.querySelector("#savedStageSelect");
      _savedStage = select ? select.value : "saved";
      _loadingSaved = true;
      container.innerHTML = render();
      onMount(container);

      const res = await fetchLinkedInSavedJobs(_savedStage, 1);
      _loadingSaved = false;
      if (res.status === "ok") {
        _savedJobs = res.data.jobs || [];
      } else {
        alert(res.message || "Failed to sync saved jobs.");
      }
      container.innerHTML = render();
      onMount(container);
    });
  }

  // Bind status refresh
  const btnRefreshStatus = container.querySelector("#btnRefreshStatus");
  if (btnRefreshStatus) {
    btnRefreshStatus.addEventListener("click", async () => {
      btnRefreshStatus.disabled = true;
      btnRefreshStatus.innerText = "Checking...";
      const res = await fetchLinkedInStatus();
      if (res.status === "ok") {
        _status = res.data;
      }
      container.innerHTML = render();
      onMount(container);
    });
  }
}

function updateHeaderStatus(container) {
  const el = container.querySelector(".status-pill");
  if (el && _status) {
    el.className = _status.logged_in ? "status-pill status-pill-success" : "status-pill status-pill-warning";
    el.innerText = _status.logged_in ? "🟢 Session Active" : "🟡 Action Needed";
  }
}

export default { render, onMount };
export { render, onMount };
