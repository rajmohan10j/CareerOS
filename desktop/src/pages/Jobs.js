import {
  fetchJobs,
  createJob,
  updateJob,
  deleteJob,
  checkJobAvailability,
  checkAllJobsAvailability,
  getJobsExcelExportUrl,
  fetchPortals,
  detectPortal,
  fetchPortalSearchUrls,
} from "../apiClient.js";

let _jobs = [];
let _portals = [];
let _loading = true;
let _error = null;
let _showForm = false;
let _showQuickImport = false;
let _showLaunchpad = true;
let _saving = false;
let _checking = false;
let _selectedJob = null;
let _currentFilter = "all"; // status filter
let _currentPortalFilter = "all"; // portal filter
let _currentRoleFilter = "all"; // role tier filter
let _currentRegionFilter = "all"; // region filter
let _viewMode = "list"; // "list" or "board"
let _hideUnavailable = false;
let _statusMsg = null;

// Search Launchpad State
let _launchRole = localStorage.getItem("careeros_launch_role") || "Placement Director";
let _launchLocation = localStorage.getItem("careeros_launch_loc") || "Bangalore";
let _searchPresets = JSON.parse(localStorage.getItem("careeros_search_presets") || "[]");

if (_searchPresets.length === 0) {
  _searchPresets = [
    { name: "Placement Director • Bangalore", role: "Placement Director", location: "Bangalore" },
    { name: "Corporate Relations • India", role: "Corporate Relations Director", location: "India" },
    { name: "VP Operations • Remote", role: "VP Operations", location: "Remote" },
    { name: "Advisory / Consulting • UAE", role: "Advisory Consultant", location: "Dubai" },
  ];
}

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

const DEFAULT_PORTALS = [
  { id: 1, slug: "linkedin", name: "LinkedIn", icon: "🔵", color: "#0284c7", domain: "linkedin.com" },
  { id: 2, slug: "naukri", name: "Naukri", icon: "🔷", color: "#0d9488", domain: "naukri.com" },
  { id: 3, slug: "indeed", name: "Indeed", icon: "🔶", color: "#d97706", domain: "indeed.com" },
  { id: 4, slug: "google", name: "Google", icon: "🔴", color: "#dc2626", domain: "google.com" },
  { id: 5, slug: "iimjobs", name: "IIMJobs", icon: "🎓", color: "#7c3aed", domain: "iimjobs.com" },
  { id: 6, slug: "glassdoor", name: "Glassdoor", icon: "🟢", color: "#059669", domain: "glassdoor.com" },
];

const ROLE_TIERS = [
  { id: "all", label: "All Roles" },
  { id: "executive", label: "Executive / Director" },
  { id: "marketing", label: "Marketing & Growth" },
  { id: "operations", label: "Operations & Strategy" },
  { id: "engineering", label: "Engineering & Tech" },
  { id: "advisory", label: "Advisory & Consulting" },
];

const REGIONS = [
  { id: "all", label: "All Locations" },
  { id: "india", label: "🇮🇳 India" },
  { id: "international", label: "🌍 International" },
  { id: "remote", label: "🌐 Remote Worldwide" },
];

const BOARD_COLUMNS = [
  {
    id: "discovered",
    title: "Not Yet Applied",
    icon: "⏳",
    color: "#475569",
    bg: "#f8fafc",
    border: "#cbd5e1",
    statuses: ["discovered"],
  },
  {
    id: "applied",
    title: "Applied",
    icon: "📤",
    color: "#166534",
    bg: "#f0fdf4",
    border: "#86efac",
    statuses: ["applied"],
  },
  {
    id: "interviewing",
    title: "Interviewing",
    icon: "💼",
    color: "#6b21a8",
    bg: "#faf5ff",
    border: "#d8b4fe",
    statuses: ["interviewing"],
  },
  {
    id: "closed",
    title: "Closed / Expired",
    icon: "⛔",
    color: "#991b1b",
    bg: "#fef2f2",
    border: "#fca5a5",
    statuses: ["unavailable", "not_interested"],
  },
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

function getJobPortal(job) {
  const src = (job.source || "").toLowerCase().trim();
  const url = (job.url || "").toLowerCase().trim();
  const allPortals = _portals.length > 0 ? _portals : DEFAULT_PORTALS;
  for (const p of allPortals) {
    if (src === p.slug || (p.domain && url.includes(p.domain.toLowerCase()))) {
      return p.slug;
    }
  }
  if (src === "linkedin" || url.includes("linkedin.com")) return "linkedin";
  if (src === "naukri" || url.includes("naukri.com")) return "naukri";
  if (src === "indeed" || url.includes("indeed.com")) return "indeed";
  if (src === "google" || url.includes("google.com")) return "google";
  if (src) return src;
  return "other";
}

function matchesRoleFilter(job, filter) {
  if (filter === "all") return true;
  const role = (job.role_category || "").toLowerCase();
  const title = (job.title || "").toLowerCase();
  if (filter === "executive") return role.includes("exec") || role.includes("director") || /director|vp|vice president|cxo|chief|head|lead|placement/i.test(title);
  if (filter === "marketing") return role.includes("market") || /market|growth|brand|sales/i.test(title);
  if (filter === "operations") return role.includes("operat") || /operation|supply|procure|logistics|program/i.test(title);
  if (filter === "engineering") return role.includes("engin") || /engineer|developer|architect|product|tech/i.test(title);
  if (filter === "advisory") return role.includes("advis") || /advis|consult|board|strateg/i.test(title);
  return role === filter;
}

function matchesRegionFilter(job, filter) {
  if (filter === "all") return true;
  const region = (job.region || "").toLowerCase();
  const loc = (job.location || "").toLowerCase();
  const remote = job.remote === true || loc.includes("remote");
  if (filter === "remote") return remote;
  if (filter === "india") return region === "india" || /india|bangalore|bengaluru|mumbai|delhi|ncr|hyderabad|pune|chennai|gurgaon|noida/i.test(loc);
  if (filter === "international") return region === "international" || /us|usa|uk|uae|dubai|singapore|europe|london/i.test(loc);
  return region === filter;
}

function renderPortalBadge(job) {
  const portalId = getJobPortal(job);
  const allPortals = _portals.length > 0 ? _portals : DEFAULT_PORTALS;
  const portal = allPortals.find(p => p.slug === portalId) || { name: portalId.toUpperCase(), icon: "🌐", color: "#64748b" };
  return `
    <span class="badge" style="background: rgba(14, 165, 233, 0.1); color: ${portal.color || '#0284c7'}; font-weight: 600; padding: 2px 8px; border-radius: 4px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(0,0,0,0.06);">
      <span>${portal.icon || '🌐'}</span> <span>${portal.name}</span>
    </span>
  `;
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
  }, 4500);
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
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px; flex-wrap: wrap;">
              ${renderPortalBadge(j)}
              ${j.role_category ? `<span class="badge" style="background: #f3e8ff; color: #6b21a8; font-size: 11px; padding: 2px 8px;">${j.role_category}</span>` : ""}
              ${j.region ? `<span class="badge" style="background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 8px;">${j.region.toUpperCase()}</span>` : ""}
            </div>
            <h3 style="margin: 0;">${j.title || "Untitled Job"}</h3>
            <p style="margin: 4px 0 0 0; color: var(--color-text-secondary); font-size: 14px;">
              ${j.company ? `@ ${j.company}` : "Company Unspecified"} ${j.location ? `• 📍 ${j.location}` : ""} ${j.salary_range ? `• 💰 ${j.salary_range}` : ""}
            </p>
          </div>
          <button class="modal-close" id="btnCloseJobModalX" aria-label="Close">×</button>
        </div>
        <div class="modal-body">

          <!-- Categorization & Status Bar -->
          <div style="background: var(--color-bg); padding: 14px 18px; border-radius: 8px; border: 1px solid var(--color-border); margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 260px;">
              <label for="modalJobStatusSelect" style="font-weight: 600; font-size: 13px; color: var(--color-text); white-space: nowrap;">Status / Stage:</label>
              <select id="modalJobStatusSelect" class="form-input" style="padding: 6px 12px; font-weight: 600; font-size: 13px; border-radius: 6px; background: ${cfg.bg}; color: ${cfg.color}; border: 1px solid var(--color-border); flex: 1; max-width: 260px;">
                <option value="discovered" ${currStatus === 'discovered' ? 'selected' : ''}>⏳ Not Yet Applied</option>
                <option value="applied" ${currStatus === 'applied' ? 'selected' : ''}>📤 Applied</option>
                <option value="interviewing" ${currStatus === 'interviewing' ? 'selected' : ''}>💼 Interviewing</option>
                <option value="unavailable" ${currStatus === 'unavailable' ? 'selected' : ''}>⛔ Job No Longer Available</option>
                <option value="not_interested" ${currStatus === 'not_interested' ? 'selected' : ''}>🚫 Not Interested / Closed</option>
              </select>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              ${j.url ? `
                <button class="btn btn-secondary btn-sm" id="btnCheckSingleAvailability" style="font-weight: 500;">
                  🔍 Verify Availability
                </button>
              ` : ''}
              ${currStatus !== 'unavailable' ? `
                <button class="btn btn-secondary btn-sm" id="btnQuickMarkUnavailable" style="color: #991b1b; font-weight: 500;">
                  ⛔ Mark Unavailable
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

function renderQuickImportModal() {
  if (!_showQuickImport) return "";
  return `
    <div class="modal-overlay" id="quickImportOverlay">
      <div class="modal-card" style="max-width: 650px;">
        <div class="modal-header">
          <h3 style="margin: 0;">⚡ Smart Quick-Import Opportunity</h3>
          <button class="modal-close" id="btnCloseQuickImportX">×</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 13px; color: var(--color-text-secondary); margin-top: 0;">
            Paste any job link (Naukri, Indeed, LinkedIn, IIMJobs, Company Career Page) or copied job description. CareerOS will auto-detect the portal domain and add it directly to your tracker.
          </p>

          <div class="setting-group" style="margin-bottom: 14px;">
            <label for="quickImportUrl">Job Posting URL</label>
            <input type="url" id="quickImportUrl" class="form-input" placeholder="https://www.naukri.com/job-listings... or https://in.indeed.com/viewjob?..." />
            <div id="detectedPortalBadge" style="margin-top: 6px; font-size: 12px; font-weight: 500;"></div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
            <div class="setting-group">
              <label for="quickImportTitle">Job Title (Optional if in URL)</label>
              <input type="text" id="quickImportTitle" class="form-input" placeholder="e.g. Placement Director" />
            </div>
            <div class="setting-group">
              <label for="quickImportCompany">Company / Org</label>
              <input type="text" id="quickImportCompany" class="form-input" placeholder="e.g. Leading University" />
            </div>
          </div>

          <div class="setting-group" style="margin-bottom: 14px;">
            <label for="quickImportJd">Job Description / Requirements (Optional)</label>
            <textarea id="quickImportJd" class="form-textarea" rows="4" placeholder="Paste full or partial JD text here..."></textarea>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="btn btn-secondary" id="btnCancelQuickImport">Cancel</button>
          <button class="btn btn-primary" id="btnConfirmQuickImport">📥 Add to Job Tracker</button>
        </div>
      </div>
    </div>
  `;
}

function renderBoardView(jobsToDisplay) {
  return `
    <div class="kanban-board" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 16px; align-items: start;">
      ${BOARD_COLUMNS.map(col => {
        const colJobs = jobsToDisplay.filter(j => col.statuses.includes(normalizeStatus(j.status)));
        return `
          <div class="kanban-column" style="background: ${col.bg}; border-radius: 8px; border: 1px solid ${col.border}; padding: 14px; min-height: 480px; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid ${col.border};">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">${col.icon}</span>
                <strong style="color: ${col.color}; font-size: 14px;">${col.title}</strong>
              </div>
              <span class="badge" style="background: #fff; color: ${col.color}; font-weight: 700; border: 1px solid ${col.border}; border-radius: 12px; padding: 2px 8px; font-size: 11px;">
                ${colJobs.length}
              </span>
            </div>

            <div class="kanban-cards-container" style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
              ${colJobs.length === 0 ? `
                <div style="padding: 24px 12px; text-align: center; color: var(--color-text-secondary); font-size: 12px; border: 1px dashed ${col.border}; border-radius: 6px;">
                  No jobs in this stage
                </div>
              ` : colJobs.map(j => {
                const currStatus = normalizeStatus(j.status);
                const cfg = STATUS_CONFIG[currStatus] || STATUS_CONFIG.discovered;
                return `
                  <div class="item-card kanban-card" data-job-id="${j.id}" style="background: #fff; padding: 12px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-left: 4px solid ${cfg.color}; cursor: pointer;" title="Click to view full details">
                    <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 6px; flex-wrap: wrap;">
                      ${renderPortalBadge(j)}
                      ${j.role_category ? `<span class="badge" style="background: #f3e8ff; color: #6b21a8; font-size: 10px; padding: 1px 6px;">${j.role_category}</span>` : ""}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px;">
                      <strong style="font-size: 13px; color: var(--color-text); line-height: 1.3;">${j.title || "Untitled"}</strong>
                      ${j.fit_score != null ? `<span class="item-card-score" style="font-size: 10px; padding: 2px 6px;">Fit: ${j.fit_score}</span>` : ""}
                    </div>
                    <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px;">
                      ${j.company ? `@ ${j.company}` : "Unspecified"} ${j.location ? `• 📍 ${j.location}` : ""}
                    </div>
                    ${j.salary_range ? `<div style="font-size: 11px; color: #047857; font-weight: 500; margin-bottom: 6px;">💰 ${j.salary_range}</div>` : ""}

                    <!-- Quick transition buttons -->
                    <div style="display: flex; gap: 6px; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid #f1f5f9;" onclick="event.stopPropagation()">
                      <select class="job-status-quick-select" data-job-id="${j.id}" style="font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--color-border); background: ${cfg.bg}; color: ${cfg.color}; font-weight: 600;">
                        <option value="discovered" ${currStatus === 'discovered' ? 'selected' : ''}>⏳ Not Applied</option>
                        <option value="applied" ${currStatus === 'applied' ? 'selected' : ''}>📤 Applied</option>
                        <option value="interviewing" ${currStatus === 'interviewing' ? 'selected' : ''}>💼 Interviewing</option>
                        <option value="unavailable" ${currStatus === 'unavailable' ? 'selected' : ''}>⛔ Unavailable</option>
                        <option value="not_interested" ${currStatus === 'not_interested' ? 'selected' : ''}>🚫 Closed</option>
                      </select>
                      <button class="btn btn-secondary btn-sm btn-open-modal" data-job-id="${j.id}" style="font-size: 11px; padding: 2px 8px;">
                        👁 Details
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function render() {
  const allPortals = _portals.length > 0 ? _portals : DEFAULT_PORTALS;

  // Status Counts
  const counts = {
    all: _jobs.length,
    discovered: 0,
    applied: 0,
    interviewing: 0,
    unavailable: 0,
    not_interested: 0,
  };

  // Dynamic Portal Counts
  const portalCounts = { all: _jobs.length, other: 0 };
  for (const p of allPortals) {
    portalCounts[p.slug] = 0;
  }

  for (const j of _jobs) {
    const st = normalizeStatus(j.status);
    if (st in counts) counts[st]++;
    else counts.discovered++;

    const pSlug = getJobPortal(j);
    if (pSlug in portalCounts) portalCounts[pSlug]++;
    else portalCounts.other++;
  }

  // Filter tabs HTML (Status)
  const filterTabsHtml = `
    <div class="job-category-tabs" style="display: flex; gap: 8px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 4px; flex-wrap: wrap;">
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

  // Secondary Filter Bar: Portal Pills & Taxonomy Dropdowns
  const portalPillsHtml = `
    <div class="portal-filter-bar" style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      
      <!-- Portals Selection -->
      <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
        <span style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-right: 4px;">Portals:</span>
        <button class="btn btn-sm ${_currentPortalFilter === 'all' ? 'btn-primary' : 'btn-secondary'} job-portal-btn" data-portal="all" style="border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: ${_currentPortalFilter === 'all' ? '600' : '500'};">
          🌐 All (${portalCounts.all})
        </button>
        ${allPortals.map(p => {
          const count = portalCounts[p.slug] ?? 0;
          const isActive = _currentPortalFilter === p.slug;
          return `
            <button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'} job-portal-btn" data-portal="${p.slug}" style="border-radius: 6px; padding: 3px 10px; font-size: 12px; font-weight: ${isActive ? '600' : '500'}; display: flex; align-items: center; gap: 4px;">
              <span>${p.icon || '🌐'}</span>
              <span>${p.name}</span>
              <span style="font-size: 10px; opacity: 0.85;">(${count})</span>
            </button>
          `;
        }).join('')}
        ${portalCounts.other > 0 ? `
          <button class="btn btn-sm ${_currentPortalFilter === 'other' ? 'btn-primary' : 'btn-secondary'} job-portal-btn" data-portal="other" style="border-radius: 6px; padding: 3px 10px; font-size: 12px;">
            ⚪ Other (${portalCounts.other})
          </button>
        ` : ''}
      </div>

      <!-- Role & Region Selectors -->
      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
        <select id="selectRoleTier" style="font-size: 12px; padding: 5px 8px; border-radius: 6px; border: 1px solid var(--color-border); background: #fff; color: var(--color-text); font-weight: 500;">
          ${ROLE_TIERS.map(r => `<option value="${r.id}" ${_currentRoleFilter === r.id ? 'selected' : ''}>${r.label}</option>`).join('')}
        </select>

        <select id="selectRegion" style="font-size: 12px; padding: 5px 8px; border-radius: 6px; border: 1px solid var(--color-border); background: #fff; color: var(--color-text); font-weight: 500;">
          ${REGIONS.map(reg => `<option value="${reg.id}" ${_currentRegionFilter === reg.id ? 'selected' : ''}>${reg.label}</option>`).join('')}
        </select>

        ${(_currentPortalFilter !== 'all' || _currentRoleFilter !== 'all' || _currentRegionFilter !== 'all') ? `
          <button class="btn btn-secondary btn-sm" id="btnClearAdvancedFilters" style="font-size: 11px; padding: 4px 8px; color: #b91c1c;">
            ✕ Reset
          </button>
        ` : ''}
      </div>

    </div>
  `;

  // Dynamic Multi-Portal Search Launchpad HTML
  const launchpadHtml = `
    <div class="search-launchpad-card" style="background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%); border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">🚀</span>
          <div>
            <strong style="font-size: 15px; color: var(--color-text);">Multi-Portal Search Launchpad</strong>
            <span style="font-size: 12px; color: var(--color-text-secondary); margin-left: 8px;">Instant 1-click searches across all job portals with your target criteria</span>
          </div>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <select id="selectSearchPreset" style="font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--color-border); background: #fff;">
            <option value="">-- Choose Saved Preset --</option>
            ${_searchPresets.map((p, idx) => `<option value="${idx}">${p.name}</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-sm" id="btnSavePreset" title="Save current role & location as quick preset" style="font-size: 11px; padding: 4px 8px;">
            💾 Save Preset
          </button>
          <button class="btn btn-secondary btn-sm" id="btnToggleLaunchpad" style="font-size: 11px; padding: 4px 8px;">
            ${_showLaunchpad ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>
      </div>

      ${_showLaunchpad ? `
        <!-- Launchpad Inputs -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 14px; background: #fff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 4px;">Target Role / Keywords:</label>
            <input type="text" id="inputLaunchRole" class="form-input" style="font-size: 13px; font-weight: 600; padding: 6px 10px;" value="${_launchRole}" placeholder="e.g. Placement Director" />
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); display: block; margin-bottom: 4px;">Target Location / City / Scope:</label>
            <input type="text" id="inputLaunchLocation" class="form-input" style="font-size: 13px; font-weight: 600; padding: 6px 10px;" value="${_launchLocation}" placeholder="e.g. Bangalore or Remote" />
          </div>
        </div>

        <!-- Dynamic Portal Launch Buttons -->
        <div>
          <div style="font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px;">1-Click Direct Portal Search Tabs:</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${allPortals.map(p => `
              <button class="btn btn-secondary btn-sm btn-launch-portal" data-portal-slug="${p.slug}" style="border-left: 3px solid ${p.color || '#0284c7'}; font-size: 12px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 6px; background: #fff;" title="Open live ${p.name} search for '${_launchRole}' in '${_launchLocation}'">
                <span>${p.icon || '🌐'}</span>
                <span><strong>${p.name}</strong> ↗</span>
              </button>
            `).join('')}
            <a href="#settings" class="btn btn-secondary btn-sm" style="font-size: 11px; padding: 6px 10px; color: var(--color-text-secondary);">
              ⚙️ Add More Portals...
            </a>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Apply all filters
  let filteredJobs = _jobs.filter(j => {
    if (_currentFilter !== "all" && normalizeStatus(j.status) !== _currentFilter) return false;
    if (_hideUnavailable && _currentFilter === "all") {
      const st = normalizeStatus(j.status);
      if (st === "unavailable" || st === "not_interested") return false;
    }
    if (_currentPortalFilter !== "all" && getJobPortal(j) !== _currentPortalFilter) return false;
    if (!matchesRoleFilter(j, _currentRoleFilter)) return false;
    if (!matchesRegionFilter(j, _currentRegionFilter)) return false;
    return true;
  });

  let listHtml = "";
  if (_loading) {
    listHtml = '<p class="health-checking">Loading opportunities...</p>';
  } else if (_error) {
    listHtml = `<p class="health-error">${_error}</p>`;
  } else if (_jobs.length === 0) {
    listHtml = `<div class="empty-state"><div class="empty-state-icon">💼</div><p>No jobs tracked yet.</p><p class="placeholder-hint">Add or Quick-Import a job to start evaluating opportunities.</p></div>`;
  } else if (filteredJobs.length === 0) {
    listHtml = `
      <div class="empty-state" style="padding: 40px 20px; background: #fff; border-radius: 8px; border: 1px dashed var(--color-border); text-align: center;">
        <p style="font-size: 15px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 12px;">
          No matching jobs found with current filters.
        </p>
        <button class="btn btn-secondary btn-sm" id="btnResetFilter">Clear All Filters</button>
      </div>
    `;
  } else if (_viewMode === "board") {
    listHtml = renderBoardView(filteredJobs);
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
              <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 4px; flex-wrap: wrap;">
                ${renderPortalBadge(j)}
                ${j.role_category ? `<span class="badge" style="background: #f3e8ff; color: #6b21a8; font-size: 11px; padding: 2px 7px;">${j.role_category}</span>` : ""}
                ${j.region ? `<span class="badge" style="background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 7px;">${j.region.toUpperCase()}</span>` : ""}
              </div>
              <strong style="font-size: 16px; color: var(--color-text);">${j.title || "Untitled"}</strong>
              ${j.company ? `<span class="item-card-company" style="margin-left: 8px; font-weight: 500;">@ ${j.company}</span>` : ""}
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
              ${j.url ? `<a href="${j.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" onclick="event.stopPropagation()">🌐 Open Link ↗</a>` : ""}
              <button class="btn btn-secondary btn-sm btn-open-modal" data-job-id="${j.id}">👁 Details</button>
            </div>
          </div>
          <div class="item-card-details" style="margin-top: 10px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            ${j.location ? `<span>📍 ${j.location}</span>` : ""}
            ${j.salary_range ? `<span style="color: #047857; font-weight: 600;">💰 ${j.salary_range}</span>` : ""}

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
      <h3>Add New Job Opportunity</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
        <div class="setting-group">
          <label for="jobTitle">Job Title *</label>
          <input type="text" id="jobTitle" class="form-input" placeholder="e.g. Placement Director" />
        </div>
        <div class="setting-group">
          <label for="jobCompany">Company *</label>
          <input type="text" id="jobCompany" class="form-input" placeholder="e.g. Alliance University" />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
        <div class="setting-group">
          <label for="jobPortalSource">Portal Source</label>
          <select id="jobPortalSource" class="form-input">
            ${allPortals.map(p => `<option value="${p.slug}">${p.name}</option>`).join('')}
            <option value="direct">Direct / Company Site</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="setting-group">
          <label for="jobRoleCategory">Role / Leadership Tier</label>
          <select id="jobRoleCategory" class="form-input">
            <option value="Executive / Director" selected>Executive / Director</option>
            <option value="Marketing & Growth">Marketing & Growth</option>
            <option value="Operations & Strategy">Operations & Strategy</option>
            <option value="Engineering & Tech">Engineering & Tech</option>
            <option value="Advisory & Consulting">Advisory & Consulting</option>
            <option value="Other">General / Other</option>
          </select>
        </div>
        <div class="setting-group">
          <label for="jobRegion">Geographic Scope</label>
          <select id="jobRegion" class="form-input">
            <option value="india" selected>🇮🇳 India</option>
            <option value="international">🌍 International</option>
            <option value="remote">🌐 Remote Worldwide</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
        <div class="setting-group">
          <label for="jobLocation">Specific Location</label>
          <input type="text" id="jobLocation" class="form-input" placeholder="e.g. Bangalore, India" />
        </div>
        <div class="setting-group">
          <label for="jobSalaryRange">Salary Range</label>
          <input type="text" id="jobSalaryRange" class="form-input" placeholder="e.g. 25-35 LPA / Not Disclosed" />
        </div>
        <div class="setting-group">
          <label for="jobStatus">Initial Pipeline Status</label>
          <select id="jobStatus" class="form-input">
            <option value="discovered" selected>⏳ Not Yet Applied</option>
            <option value="applied">📤 Applied</option>
            <option value="interviewing">💼 Interviewing</option>
            <option value="unavailable">⛔ No Longer Available</option>
            <option value="not_interested">🚫 Not Interested / Closed</option>
          </select>
        </div>
      </div>

      <div class="setting-group">
        <label for="jobUrl">Job Posting URL</label>
        <input type="url" id="jobUrl" class="form-input" placeholder="https://..." />
      </div>
      <div class="setting-group">
        <label for="jobJdText">Job Description</label>
        <textarea id="jobJdText" class="form-textarea" rows="4" placeholder="Paste the job description or requirements..."></textarea>
      </div>
      <div class="setting-actions">
        <button class="btn btn-primary" id="saveJobBtn" ${_saving ? "disabled" : ""}>${_saving ? "Adding..." : "Add Job"}</button>
        <button class="btn btn-secondary" id="cancelJobBtn">Cancel</button>
      </div>
    </div>
  ` : "";

  return `
    <div class="page jobs-page">
      <h1 class="page-title">Job Tracker & Sourcing Hub</h1>
      <p class="page-subtitle">Multi-portal discovery, intelligent categorization, and pipeline tracking across all career platforms.</p>
      
      ${_statusMsg ? `<div class="status-ok" style="margin-bottom: 14px; padding: 10px 14px; background: #e8f5e9; border-radius: 6px; font-weight: 500;">${_statusMsg}</div>` : ''}

      <!-- Multi-Portal Search Launchpad -->
      ${launchpadHtml}

      <!-- Action & View Controls Bar -->
      <div class="page-actions" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-primary" id="showAddJobBtn">+ Add Job</button>
          <button class="btn btn-secondary" id="btnShowQuickImport" style="background: #e0f2fe; color: #0284c7; font-weight: 600; border-color: #bae6fd;">
            ⚡ Quick Import
          </button>
          <button class="btn btn-secondary" id="btnExportExcelTracker" title="Download multi-sheet Excel tracking workbook (.xlsx)">
            📥 Export Excel (.xlsx)
          </button>
          <button class="btn btn-secondary" id="btnCheckAllAvailability" ${_checking ? 'disabled' : ''} title="Check active jobs to auto-detect closed postings">
            ${_checking ? '🔄 Checking...' : '🔍 Auto-Check'}
          </button>
        </div>

        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <!-- Hide Unavailable Toggle -->
          <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; cursor: pointer; user-select: none;">
            <input type="checkbox" id="toggleHideUnavailable" ${_hideUnavailable ? 'checked' : ''} style="cursor: pointer;" />
            <span>Hide Expired / Closed</span>
          </label>

          <!-- List vs Board View Switcher -->
          <div style="display: flex; background: #e2e8f0; border-radius: 6px; padding: 2px;">
            <button class="btn btn-sm ${_viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}" id="btnViewList" style="border-radius: 4px; padding: 4px 10px; font-size: 12px;">
              📋 List
            </button>
            <button class="btn btn-sm ${_viewMode === 'board' ? 'btn-primary' : 'btn-secondary'}" id="btnViewBoard" style="border-radius: 4px; padding: 4px 10px; font-size: 12px;">
              📊 Board
            </button>
          </div>
        </div>
      </div>

      ${formHtml}
      ${filterTabsHtml}
      ${portalPillsHtml}
      ${listHtml}
      ${renderJobModal()}
      ${renderQuickImportModal()}
    </div>
  `;
}

async function onMount() {
  _loading = true;
  _error = null;
  const [jobsRes, portalsRes] = await Promise.all([
    fetchJobs(),
    fetchPortals(),
  ]);

  if (jobsRes.status === "ok") {
    _jobs = Array.isArray(jobsRes.data) ? jobsRes.data : [];
  } else {
    _jobs = [];
    _error = jobsRes.message;
  }

  if (portalsRes.status === "ok" && Array.isArray(portalsRes.data)) {
    _portals = portalsRes.data;
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

  // Toggle Launchpad Expand/Collapse
  const btnToggleLaunch = document.getElementById("btnToggleLaunchpad");
  if (btnToggleLaunch) {
    btnToggleLaunch.addEventListener("click", () => {
      _showLaunchpad = !_showLaunchpad;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // Update launchpad role & location on input
  const inputRole = document.getElementById("inputLaunchRole");
  if (inputRole) {
    inputRole.addEventListener("input", (e) => {
      _launchRole = e.target.value;
      localStorage.setItem("careeros_launch_role", _launchRole);
    });
  }

  const inputLoc = document.getElementById("inputLaunchLocation");
  if (inputLoc) {
    inputLoc.addEventListener("input", (e) => {
      _launchLocation = e.target.value;
      localStorage.setItem("careeros_launch_loc", _launchLocation);
    });
  }

  // Presets dropdown
  const selectPreset = document.getElementById("selectSearchPreset");
  if (selectPreset) {
    selectPreset.addEventListener("change", (e) => {
      const idx = e.target.value;
      if (idx !== "" && _searchPresets[idx]) {
        _launchRole = _searchPresets[idx].role;
        _launchLocation = _searchPresets[idx].location;
        localStorage.setItem("careeros_launch_role", _launchRole);
        localStorage.setItem("careeros_launch_loc", _launchLocation);
        container.innerHTML = render();
        bindEvents(container);
      }
    });
  }

  // Save Current Preset
  const btnSavePreset = document.getElementById("btnSavePreset");
  if (btnSavePreset) {
    btnSavePreset.addEventListener("click", () => {
      const name = prompt("Enter a label for this search preset:", `${_launchRole} • ${_launchLocation}`);
      if (name) {
        _searchPresets.push({ name, role: _launchRole, location: _launchLocation });
        localStorage.setItem("careeros_search_presets", JSON.stringify(_searchPresets));
        setFlashMessage(`Saved search preset "${name}".`);
        container.innerHTML = render();
        bindEvents(container);
      }
    });
  }

  // 1-Click Launch Portal search buttons
  container.querySelectorAll(".btn-launch-portal").forEach(btn => {
    btn.addEventListener("click", async () => {
      const slug = btn.dataset.portalSlug;
      const allPortals = _portals.length > 0 ? _portals : DEFAULT_PORTALS;
      const portal = allPortals.find(p => p.slug === slug);
      if (!portal) return;

      const roleEnc = encodeURIComponent(_launchRole.trim());
      const locEnc = encodeURIComponent(_launchLocation.trim());
      const roleSlug = _launchRole.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");
      const locSlug = _launchLocation.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");

      let url = portal.search_url_template || "https://www.google.com/search?q={role}+jobs+{location}";
      url = url.replace(/{role}/g, roleEnc).replace(/{location}/g, locEnc);
      url = url.replace(/{role_slug}/g, roleSlug).replace(/{loc_slug}/g, locSlug);

      window.open(url, "_blank");
    });
  });

  // Quick Import Modal Toggle
  const btnShowQuick = document.getElementById("btnShowQuickImport");
  if (btnShowQuick) {
    btnShowQuick.addEventListener("click", () => {
      _showQuickImport = true;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const btnCancelQuick = document.getElementById("btnCancelQuickImport");
  if (btnCancelQuick) {
    btnCancelQuick.addEventListener("click", () => {
      _showQuickImport = false;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const btnCloseQuickX = document.getElementById("btnCloseQuickImportX");
  if (btnCloseQuickX) {
    btnCloseQuickX.addEventListener("click", () => {
      _showQuickImport = false;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // Quick Import URL input auto-detect
  const quickUrlInput = document.getElementById("quickImportUrl");
  const quickBadge = document.getElementById("detectedPortalBadge");
  if (quickUrlInput && quickBadge) {
    quickUrlInput.addEventListener("input", async (e) => {
      const url = e.target.value.trim();
      if (url.length > 8) {
        const det = await detectPortal(url);
        if (det.status === "ok" && det.data) {
          quickBadge.innerHTML = `<span style="color: ${det.data.color || '#0284c7'};">Detected: <strong>${det.data.icon || '🌐'} ${det.data.name}</strong></span>`;
        }
      } else {
        quickBadge.innerHTML = "";
      }
    });
  }

  // Confirm Quick Import
  const btnConfirmQuick = document.getElementById("btnConfirmQuickImport");
  if (btnConfirmQuick) {
    btnConfirmQuick.addEventListener("click", async () => {
      const url = document.getElementById("quickImportUrl")?.value.trim() || "";
      let title = document.getElementById("quickImportTitle")?.value.trim() || "";
      const company = document.getElementById("quickImportCompany")?.value.trim() || "";
      const jd_text = document.getElementById("quickImportJd")?.value.trim() || "";

      if (!url && !title && !jd_text) {
        alert("Please paste either a Job URL, Title, or Description.");
        return;
      }

      let source = "direct";
      if (url) {
        const det = await detectPortal(url);
        if (det.status === "ok" && det.data) {
          source = det.data.source || "direct";
        }
      }

      if (!title) {
        if (url.includes("naukri.com")) {
          const match = url.match(/job-listings-([a-zA-Z0-9-]+)-\d+/);
          title = match ? match[1].replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "Naukri Opportunity";
        } else if (url.includes("linkedin.com")) {
          title = "LinkedIn Opportunity";
        } else if (url.includes("indeed.com")) {
          title = "Indeed Opportunity";
        } else {
          title = "Imported Opportunity";
        }
      }

      const res = await createJob({
        title,
        company: company || (source !== 'direct' ? source.toUpperCase() : 'Company'),
        url,
        source,
        jd_text,
        status: "discovered",
        role_category: "Executive / Director",
        region: "india",
      });

      _showQuickImport = false;
      if (res.status === "ok") {
        _jobs.unshift(res.data);
        setFlashMessage(`Imported "${title}" into Job Tracker.`);
      } else {
        alert(res.message || "Failed to import job.");
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // View mode switcher
  const btnViewList = document.getElementById("btnViewList");
  if (btnViewList) {
    btnViewList.addEventListener("click", () => {
      _viewMode = "list";
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const btnViewBoard = document.getElementById("btnViewBoard");
  if (btnViewBoard) {
    btnViewBoard.addEventListener("click", () => {
      _viewMode = "board";
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // Toggle Hide Unavailable
  const toggleHide = document.getElementById("toggleHideUnavailable");
  if (toggleHide) {
    toggleHide.addEventListener("change", (e) => {
      _hideUnavailable = e.target.checked;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // Export to Excel Button
  const btnExport = document.getElementById("btnExportExcelTracker");
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      const downloadUrl = getJobsExcelExportUrl();
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "careeros_jobs_tracker.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setFlashMessage("Exporting multi-sheet Excel tracking workbook (.xlsx)... Check your downloads.");
    });
  }

  // Auto-Check All Jobs Availability button
  const btnCheckAll = document.getElementById("btnCheckAllAvailability");
  if (btnCheckAll) {
    btnCheckAll.addEventListener("click", async () => {
      _checking = true;
      container.innerHTML = render();
      bindEvents(container);

      const res = await checkAllJobsAvailability();
      _checking = false;
      if (res.status === "ok" && res.data) {
        const { checked, updated_unavailable } = res.data;
        const jobsRes = await fetchJobs();
        if (jobsRes.status === "ok") {
          _jobs = jobsRes.data;
        }
        setFlashMessage(`Availability verified: ${checked} jobs checked, ${updated_unavailable} marked as No Longer Available.`);
      } else {
        setFlashMessage("Failed to complete availability check.", false);
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // Filter category buttons (Status)
  container.querySelectorAll(".job-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      _currentFilter = btn.dataset.filter || "all";
      container.innerHTML = render();
      bindEvents(container);
    });
  });

  // Portal filter buttons
  container.querySelectorAll(".job-portal-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      _currentPortalFilter = btn.dataset.portal || "all";
      container.innerHTML = render();
      bindEvents(container);
    });
  });

  // Role Tier select
  const selectRole = document.getElementById("selectRoleTier");
  if (selectRole) {
    selectRole.addEventListener("change", (e) => {
      _currentRoleFilter = e.target.value;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // Region select
  const selectRegion = document.getElementById("selectRegion");
  if (selectRegion) {
    selectRegion.addEventListener("change", (e) => {
      _currentRegionFilter = e.target.value;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // Clear advanced filters
  const btnClearAdv = document.getElementById("btnClearAdvancedFilters");
  if (btnClearAdv) {
    btnClearAdv.addEventListener("click", () => {
      _currentPortalFilter = "all";
      _currentRoleFilter = "all";
      _currentRegionFilter = "all";
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const btnReset = document.getElementById("btnResetFilter");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      _currentFilter = "all";
      _currentPortalFilter = "all";
      _currentRoleFilter = "all";
      _currentRegionFilter = "all";
      _hideUnavailable = false;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // Quick status changes on cards
  container.querySelectorAll(".job-status-quick-select").forEach((sel) => {
    sel.addEventListener("change", (e) => {
      const jobId = sel.dataset.jobId;
      const newStatus = e.target.value;
      handleStatusChange(jobId, newStatus);
    });
  });

  // Open Job Details Modal on item-card click
  container.querySelectorAll(".item-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("select") || e.target.closest("a")) return;
      const jobId = card.dataset.jobId;
      const found = _jobs.find((j) => String(j.id) === String(jobId));
      if (found) {
        _selectedJob = found;
        container.innerHTML = render();
        bindEvents(container);
      }
    });
  });

  container.querySelectorAll(".btn-open-modal").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const jobId = btn.dataset.jobId;
      const found = _jobs.find((j) => String(j.id) === String(jobId));
      if (found) {
        _selectedJob = found;
        container.innerHTML = render();
        bindEvents(container);
      }
    });
  });

  // Modal Status change
  const modalSelect = document.getElementById("modalJobStatusSelect");
  if (modalSelect && _selectedJob) {
    modalSelect.addEventListener("change", (e) => {
      const newStatus = e.target.value;
      handleStatusChange(_selectedJob.id, newStatus);
    });
  }

  // Single job live availability check in modal
  const btnCheckSingle = document.getElementById("btnCheckSingleAvailability");
  if (btnCheckSingle && _selectedJob) {
    btnCheckSingle.addEventListener("click", async () => {
      btnCheckSingle.disabled = true;
      btnCheckSingle.innerText = "Checking...";
      const res = await checkJobAvailability(_selectedJob.id);
      if (res.status === "ok" && res.data) {
        if (!res.data.available) {
          _selectedJob.status = "unavailable";
          const jIdx = _jobs.findIndex(j => j.id === _selectedJob.id);
          if (jIdx >= 0) _jobs[jIdx].status = "unavailable";
          setFlashMessage(`Posting is closed on portal: marked as No Longer Available.`);
        } else {
          setFlashMessage(`Posting is active and accepting applications!`);
        }
      } else {
        alert(res.message || "Failed to check job availability.");
      }
      container.innerHTML = render();
      bindEvents(container);
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

  // Delete Job from Modal
  const deleteBtn = document.getElementById("btnDeleteJobModal");
  if (deleteBtn && _selectedJob) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Are you sure you want to delete "${_selectedJob.title || 'this job'}" from your tracker?`)) return;
      const jobId = _selectedJob.id;
      const titleToDelete = _selectedJob.title || "Job";
      const res = await deleteJob(jobId);
      if (res.status === "ok") {
        _jobs = _jobs.filter((j) => j.id !== jobId);
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
      const source = document.getElementById("jobPortalSource")?.value || "linkedin";
      const role_category = document.getElementById("jobRoleCategory")?.value || "Executive / Director";
      const region = document.getElementById("jobRegion")?.value || "india";
      const location = document.getElementById("jobLocation")?.value || "";
      const salary_range = document.getElementById("jobSalaryRange")?.value || "";
      const url = document.getElementById("jobUrl")?.value || "";
      const status = document.getElementById("jobStatus")?.value || "discovered";
      const jd_text = document.getElementById("jobJdText")?.value || "";

      _saving = true;
      container.innerHTML = render();
      bindEvents(container);

      const result = await createJob({
        title,
        company,
        source,
        role_category,
        region,
        location,
        salary_range,
        url,
        status,
        jd_text,
      });
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
