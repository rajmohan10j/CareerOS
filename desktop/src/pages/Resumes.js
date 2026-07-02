import { fetchResumes, createResume, fetchResume, downloadResumeText } from "../apiClient.js";

let _resumes = [];
let _loading = true;
let _error = null;
let _selectedResume = null;
let _showPasteForm = false;
let _showUploadForm = false;
let _saving = false;
let _successMsg = null;
let _uploadMsg = null;

const UNSUPPORTED_EXTS = ["pdf", "doc", "docx"];

function render() {
  let listHtml = "";
  if (_loading) {
    listHtml = '<p class="health-checking">Loading resumes...</p>';
  } else if (_error && _resumes.length === 0) {
    listHtml = `<p class="health-error">${_error}</p>`;
  } else if (_resumes.length === 0) {
    listHtml = `
      <div class="empty-state">
        <div class="empty-state-icon">📄</div>
        <p>No resumes yet.</p>
        <p class="placeholder-hint">Upload a resume file, paste your resume text, or create a blank resume to get started.</p>
        <div class="empty-state-actions">
          <button class="btn btn-primary" id="emptyUploadBtn">Upload Resume</button>
          <button class="btn btn-secondary" id="emptyPasteBtn">Paste Resume Text</button>
          <button class="btn btn-secondary" id="emptyCreateBtn">Create Blank Resume</button>
        </div>
      </div>`;
  } else {
    listHtml = '<div class="item-list">';
    for (const r of _resumes) {
      const isSelected = _selectedResume && _selectedResume.id === r.id;
      listHtml += `
        <div class="item-card ${isSelected ? 'item-card-selected' : ''}" data-resume-id="${r.id}">
          <div class="item-card-header">
            <strong>${r.title}</strong>
            <span class="item-card-badge">v${r.version}</span>
            ${r.is_latest ? '<span class="item-card-status">latest</span>' : ''}
          </div>
          <div class="item-card-details">
            ${r.target_role ? `<span>Target: ${r.target_role}</span>` : ''}
            ${r.updated_at ? `<span>Updated: ${new Date(r.updated_at).toLocaleDateString()}</span>` : ''}
            <span class="item-card-date">Created: ${new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          ${isSelected && r.content ? `
            <div class="item-card-content">
              <div class="item-card-meta">
                ${r.target_role ? `<span class="item-card-meta-item">Target Role: ${r.target_role}</span>` : ''}
                ${r.job_description ? `<span class="item-card-meta-item">Has Job Description</span>` : ''}
              </div>
              <pre>${r.content}</pre>
              <div class="item-card-actions">
                <button class="btn btn-secondary btn-sm download-txt-btn" data-resume-id="${r.id}">Download .txt</button>
                <button class="btn btn-secondary btn-sm download-md-btn" data-resume-id="${r.id}">Download .md</button>
              </div>
            </div>
          ` : ''}
          ${isSelected && !r.content ? '<p class="health-checking" style="margin-top:8px">No content available.</p>' : ''}
        </div>
      `;
    }
    listHtml += '</div>';
  }

  const successHtml = _successMsg ? `<p class="status-ok" style="margin-bottom:12px">${_successMsg}</p>` : '';
  const uploadMsgHtml = _uploadMsg ? `<p class="status-warning" style="margin-bottom:12px">${_uploadMsg}</p>` : '';

  const pasteFormHtml = _showPasteForm ? `
    <div class="inline-form">
      <h3>Paste Resume Text</h3>
      <div class="setting-group">
        <label for="pasteTitle">Resume Title</label>
        <input type="text" id="pasteTitle" class="form-input" placeholder="e.g. My Software Engineer Resume" />
      </div>
      <div class="setting-group">
        <label for="pasteTargetRole">Target Role (optional)</label>
        <input type="text" id="pasteTargetRole" class="form-input" placeholder="e.g. Senior Software Engineer" />
      </div>
      <div class="setting-group">
        <label for="pasteContent">Resume Content</label>
        <textarea id="pasteContent" class="form-textarea" rows="10" placeholder="Paste your resume text here..."></textarea>
      </div>
      <div class="setting-actions">
        <button class="btn btn-primary" id="savePasteBtn" ${_saving ? 'disabled' : ''}>${_saving ? 'Saving...' : 'Save Resume'}</button>
        <button class="btn btn-secondary" id="cancelPasteBtn">Cancel</button>
      </div>
    </div>
  ` : '';

  const uploadFormHtml = _showUploadForm ? `
    <div class="inline-form">
      <h3>Upload Resume</h3>
      <div class="setting-group">
        <label for="uploadTitle">Resume Title</label>
        <input type="text" id="uploadTitle" class="form-input" placeholder="e.g. My Uploaded Resume" />
      </div>
      <div class="setting-group">
        <label for="uploadFile">Choose File</label>
        <input type="file" id="uploadFile" accept=".txt,.md,.pdf,.doc,.docx" />
        <p class="setting-hint">Supported: .txt, .md. PDF/DOC/DOCX upload detected will show guidance. Folder import is not supported in MVP. Please upload one resume file at a time.</p>
      </div>
      <div class="setting-actions">
        <button class="btn btn-primary" id="saveUploadBtn" ${_saving ? 'disabled' : ''}>${_saving ? 'Uploading...' : 'Upload Resume'}</button>
        <button class="btn btn-secondary" id="cancelUploadBtn">Cancel</button>
      </div>
    </div>
  ` : '';

  const actionsBar = _resumes.length > 0 ? `
    <div class="page-actions">
      <input type="file" id="uploadFileBtn" accept=".txt,.md,.pdf,.doc,.docx" style="display:none" />
      <button class="btn btn-primary" id="showUploadBtn">Upload Resume</button>
      <button class="btn btn-secondary" id="showPasteBtn">Paste Resume Text</button>
      <button class="btn btn-secondary" id="showCreateBlankBtn">Create Blank Resume</button>
    </div>
  ` : '';

  return `
    <div class="page resumes-page">
      <h1 class="page-title">Resume Manager</h1>
      <p class="page-subtitle">Create, import, manage, and export your resumes.</p>
      ${successHtml}
      ${uploadMsgHtml}
      ${actionsBar}
      ${pasteFormHtml}
      ${uploadFormHtml}
      ${listHtml}
    </div>
  `;
}

function setSuccess(msg) {
  _successMsg = msg;
  setTimeout(() => { _successMsg = null; }, 4000);
}

function setUploadMsg(msg, isWarning) {
  _uploadMsg = msg;
  if (isWarning) setTimeout(() => { _uploadMsg = null; }, 8000);
  else setTimeout(() => { _uploadMsg = null; }, 4000);
}

async function loadResumes() {
  _loading = true;
  _error = null;
  const result = await fetchResumes();
  if (result.status === "ok") {
    _resumes = Array.isArray(result.data) ? result.data : [];
    _error = null;
  } else {
    if (_resumes.length === 0) _error = result.message;
  }
  _loading = false;
}

async function onMount() {
  await loadResumes();
  const container = document.getElementById("pageContainer");
  if (container) container.innerHTML = render();
  bindEvents(container);
}

function bindEvents(container) {
  if (!container) return;

  const showUploadBtn = document.getElementById("showUploadBtn") || document.getElementById("emptyUploadBtn");
  if (showUploadBtn) {
    showUploadBtn.addEventListener("click", () => {
      _showUploadForm = true;
      _showPasteForm = false;
      _error = null;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const showPasteBtn = document.getElementById("showPasteBtn") || document.getElementById("emptyPasteBtn");
  if (showPasteBtn) {
    showPasteBtn.addEventListener("click", () => {
      _showPasteForm = true;
      _showUploadForm = false;
      _error = null;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const showCreateBlankBtn = document.getElementById("showCreateBlankBtn") || document.getElementById("emptyCreateBtn");
  if (showCreateBlankBtn) {
    showCreateBlankBtn.addEventListener("click", async () => {
      _saving = true;
      _error = null;
      container.innerHTML = render();
      bindEvents(container);
      const result = await createResume({ title: "Untitled Resume", content: "" });
      _saving = false;
      if (result.status === "ok") {
        _resumes.unshift(result.data);
        setSuccess("Blank resume created.");
      } else {
        _error = result.message;
      }
      _showPasteForm = false;
      _showUploadForm = false;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const cancelPasteBtn = document.getElementById("cancelPasteBtn");
  if (cancelPasteBtn) {
    cancelPasteBtn.addEventListener("click", () => {
      _showPasteForm = false;
      _error = null;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const cancelUploadBtn = document.getElementById("cancelUploadBtn");
  if (cancelUploadBtn) {
    cancelUploadBtn.addEventListener("click", () => {
      _showUploadForm = false;
      _error = null;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const savePasteBtn = document.getElementById("savePasteBtn");
  if (savePasteBtn) {
    savePasteBtn.addEventListener("click", async () => {
      const title = document.getElementById("pasteTitle")?.value || "Untitled Resume";
      const targetRole = document.getElementById("pasteTargetRole")?.value || "";
      const content = document.getElementById("pasteContent")?.value || "";

      if (!content.trim()) {
        _error = "Please enter resume content.";
        container.innerHTML = render();
        bindEvents(container);
        return;
      }

      _saving = true;
      _error = null;
      container.innerHTML = render();
      bindEvents(container);

      const payload = { title, content };
      if (targetRole) payload.target_role = targetRole;
      const result = await createResume(payload);
      _saving = false;
      if (result.status === "ok") {
        _resumes.unshift(result.data);
        _showPasteForm = false;
        setSuccess("Resume saved successfully.");
      } else {
        _error = result.message;
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const saveUploadBtn = document.getElementById("saveUploadBtn");
  if (saveUploadBtn) {
    saveUploadBtn.addEventListener("click", async () => {
      const title = document.getElementById("uploadTitle")?.value || "Uploaded Resume";
      const fileInput = document.getElementById("uploadFile");
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        _error = "Please select a file to upload.";
        container.innerHTML = render();
        bindEvents(container);
        return;
      }

      const file = fileInput.files[0];
      const ext = file.name.split(".").pop().toLowerCase();

      if (UNSUPPORTED_EXTS.includes(ext)) {
        setUploadMsg("PDF/DOCX parsing is not supported yet. Please paste resume text or upload .txt/.md for now.", true);
        return;
      }

      if (ext !== "txt" && ext !== "md") {
        _error = `Unsupported file type: .${ext}. Please use .txt or .md files.`;
        container.innerHTML = render();
        bindEvents(container);
        return;
      }

      _saving = true;
      _error = null;
      container.innerHTML = render();
      bindEvents(container);

      try {
        const text = await file.text();
        const payload = { title, content: text };
        const result = await createResume(payload);
        if (result.status === "ok") {
          _resumes.unshift(result.data);
          _showUploadForm = false;
          setSuccess("Resume uploaded successfully.");
        } else {
          _error = result.message;
        }
      } catch (err) {
        _error = "Failed to read file. Please try again.";
      }

      _saving = false;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  container.querySelectorAll(".item-card").forEach(card => {
    card.addEventListener("click", async (e) => {
      if (e.target.closest(".btn")) return;

      const id = parseInt(card.dataset.resumeId, 10);
      const found = _resumes.find(r => r.id === id);
      if (!found) return;

      if (_selectedResume && _selectedResume.id === id && _selectedResume.content) {
        _selectedResume = null;
        container.innerHTML = render();
        bindEvents(container);
        return;
      }

      if (found.content) {
        _selectedResume = found;
        container.innerHTML = render();
        bindEvents(container);
        return;
      }

      const result = await fetchResume(id);
      if (result.status === "ok") {
        _selectedResume = result.data;
        const idx = _resumes.findIndex(r => r.id === id);
        if (idx !== -1) _resumes[idx] = result.data;
      } else {
        _error = result.message;
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  });

  container.querySelectorAll(".download-txt-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.resumeId, 10);
      const found = _resumes.find(r => r.id === id) || _selectedResume;
      if (found && found.content) {
        downloadResumeText(found.title.replace(/[^a-zA-Z0-9_-]/g, "_"), found.content, "txt");
        setSuccess("Resume downloaded as .txt");
        container.innerHTML = render();
        bindEvents(container);
      }
    });
  });

  container.querySelectorAll(".download-md-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.resumeId, 10);
      const found = _resumes.find(r => r.id === id) || _selectedResume;
      if (found && found.content) {
        downloadResumeText(found.title.replace(/[^a-zA-Z0-9_-]/g, "_"), found.content, "md");
        setSuccess("Resume downloaded as .md");
        container.innerHTML = render();
        bindEvents(container);
      }
    });
  });
}

export default { render, onMount };
