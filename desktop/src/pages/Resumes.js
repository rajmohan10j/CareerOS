import { createResume, fetchResumes } from "../apiClient.js";

let _resumes = [];
let _loading = true;
let _error = null;
let _selectedResume = null;
let _formVisible = false;
let _saving = false;
let _status = null;
let _draftContent = "";
let _draftFileName = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderUploadForm() {
  if (!_formVisible) return "";
  return `
    <div class="settings-section resume-upload-section">
      <h2>Upload or Paste Resume</h2>
      <p class="placeholder-hint">Save a plain-text or Markdown resume into your local CareerOS backend.</p>
      ${_status ? `<div class="settings-status ${_status.type === "error" ? "status-error" : "status-ok"}">${escapeHtml(_status.message)}</div>` : ""}
      <label for="resumeTitle">Resume Title</label>
      <input id="resumeTitle" type="text" placeholder="My Resume" value="${escapeHtml(_draftFileName || "Uploaded Resume")}" />
      <label for="resumeTargetRole">Target Role</label>
      <input id="resumeTargetRole" type="text" placeholder="Optional target role" />
      <label for="resumeFile">Resume File</label>
      <input id="resumeFile" type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" />
      <label for="resumeContent">Resume Content</label>
      <textarea id="resumeContent" rows="12" placeholder="Paste your resume text here...">${escapeHtml(_draftContent)}</textarea>
      <div class="form-actions">
        <button id="saveResumeBtn" class="primary-btn" type="button" ${_saving ? "disabled" : ""}>${_saving ? "Saving..." : "Save Resume"}</button>
        <button id="cancelResumeBtn" class="secondary-btn" type="button">Cancel</button>
      </div>
    </div>
  `;
}

function renderList() {
  if (_loading) {
    return '<p class="health-checking">Loading resumes...</p>';
  }
  if (_error) {
    return `<p class="health-error">${escapeHtml(_error)}</p>`;
  }
  if (_resumes.length === 0) {
    return `<div class="empty-state"><div class="empty-state-icon">📄</div><p>No resumes yet.</p><p class="placeholder-hint">Upload or paste a resume to save it locally.</p></div>`;
  }

  let listHtml = '<div class="item-list">';
  for (const r of _resumes) {
    const isSelected = _selectedResume && _selectedResume.id === r.id;
    listHtml += `
      <div class="item-card ${isSelected ? "item-card-selected" : ""}" data-resume-id="${r.id}">
        <div class="item-card-header">
          <strong>${escapeHtml(r.title)}</strong>
          <span class="item-card-badge">v${escapeHtml(r.version)}</span>
        </div>
        <div class="item-card-details">
          ${r.target_role ? `<span>Target: ${escapeHtml(r.target_role)}</span>` : ""}
          <span class="item-card-date">Created: ${new Date(r.created_at).toLocaleDateString()}</span>
        </div>
        ${isSelected && r.content ? `<div class="item-card-content"><pre>${escapeHtml(r.content)}</pre></div>` : ""}
      </div>
    `;
  }
  listHtml += "</div>";
  return listHtml;
}

function render() {
  return `
    <div class="page resumes-page">
      <h1 class="page-title">Resume Manager</h1>
      <p class="page-subtitle">Upload, save, view, and version your resumes.</p>
      <div class="page-actions">
        <button id="showAddResumeBtn" class="primary-btn" type="button">+ Upload Resume</button>
      </div>
      ${renderUploadForm()}
      ${renderList()}
    </div>
  `;
}

async function loadResumes(container) {
  _loading = true;
  _error = null;
  renderInto(container);

  const result = await fetchResumes();
  if (result.status === "ok") {
    _resumes = Array.isArray(result.data) ? result.data : [];
    _error = null;
  } else {
    _resumes = [];
    _error = result.message;
  }
  _loading = false;
  renderInto(container);
}

function renderInto(container) {
  if (!container) return;
  container.innerHTML = render();
  attachEvents(container);
}

function attachEvents(container) {
  container.querySelector("#showAddResumeBtn")?.addEventListener("click", () => {
    _formVisible = true;
    _status = null;
    renderInto(container);
  });

  container.querySelector("#cancelResumeBtn")?.addEventListener("click", () => {
    _formVisible = false;
    _saving = false;
    _status = null;
    _draftContent = "";
    _draftFileName = "";
    renderInto(container);
  });

  container.querySelector("#resumeFile")?.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    _draftFileName = file.name.replace(/\.(txt|md|markdown)$/i, "");
    try {
      _draftContent = await file.text();
      _status = { type: "ok", message: `Loaded ${file.name}. Review and save when ready.` };
    } catch {
      _status = { type: "error", message: "Could not read this file. Try a .txt or .md resume." };
    }
    renderInto(container);
  });

  container.querySelector("#saveResumeBtn")?.addEventListener("click", async () => {
    const title = container.querySelector("#resumeTitle")?.value.trim() || "Uploaded Resume";
    const targetRole = container.querySelector("#resumeTargetRole")?.value.trim() || null;
    const content = container.querySelector("#resumeContent")?.value.trim() || "";
    if (!content) {
      _status = { type: "error", message: "Add resume content before saving." };
      renderInto(container);
      return;
    }

    _saving = true;
    _status = null;
    renderInto(container);
    const result = await createResume({ title, target_role: targetRole, content });
    _saving = false;

    if (result.status === "ok") {
      _formVisible = false;
      _draftContent = "";
      _draftFileName = "";
      _selectedResume = result.data;
      _status = { type: "ok", message: "Resume saved." };
      await loadResumes(container);
      return;
    }

    _status = { type: "error", message: result.message };
    renderInto(container);
  });

  container.querySelectorAll(".item-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = parseInt(card.dataset.resumeId, 10);
      const found = _resumes.find(r => r.id === id);
      if (found) {
        _selectedResume = _selectedResume && _selectedResume.id === id && _selectedResume.content ? null : found;
        renderInto(container);
      }
    });
  });
}

async function onMount(container = document.getElementById("pageContainer")) {
  await loadResumes(container);
}

export default { render, onMount };