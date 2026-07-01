import { fetchDocuments, createDocument } from "../apiClient.js";

let _documents = [];
let _loading = true;
let _error = null;
let _showForm = false;
let _saving = false;

function render() {
  let listHtml = "";
  if (_loading) {
    listHtml = '<p class="health-checking">Loading documents...</p>';
  } else if (_error) {
    listHtml = `<p class="health-error">${_error}</p>`;
  } else if (_documents.length === 0) {
    listHtml = `<div class="empty-state"><div class="empty-state-icon">📁</div><p>No documents yet.</p><p class="placeholder-hint">Add a document such as a cover letter or portfolio.</p></div>`;
  } else {
    listHtml = '<div class="item-list">';
    for (const d of _documents) {
      listHtml += `
        <div class="item-card">
          <div class="item-card-header">
            <strong>${d.title || d.filename || 'Untitled'}</strong>
            <span class="item-card-badge">${d.file_type || 'txt'}</span>
          </div>
          <div class="item-card-details">
            ${d.category ? `<span>Category: ${d.category}</span>` : ''}
            ${d.file_size ? `<span>${(d.file_size / 1024).toFixed(1)} KB</span>` : ''}
            <span class="item-card-date">Created: ${new Date(d.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      `;
    }
    listHtml += '</div>';
  }

  const formHtml = _showForm ? `
    <div class="inline-form">
      <h3>Add Document</h3>
      <div class="setting-group">
        <label for="docTitle">Title</label>
        <input type="text" id="docTitle" class="form-input" placeholder="e.g. Cover Letter" />
      </div>
      <div class="setting-group">
        <label for="docCategory">Category</label>
        <input type="text" id="docCategory" class="form-input" placeholder="e.g. cover-letter, portfolio, reference" />
      </div>
      <div class="setting-group">
        <label for="docContent">Content</label>
        <textarea id="docContent" class="form-textarea" rows="6" placeholder="Write your document content..."></textarea>
      </div>
      <div class="setting-actions">
        <button class="btn btn-primary" id="saveDocBtn" ${_saving ? 'disabled' : ''}>${_saving ? 'Adding...' : 'Add Document'}</button>
        <button class="btn btn-secondary" id="cancelDocBtn">Cancel</button>
      </div>
    </div>
  ` : '';

  return `
    <div class="page documents-page">
      <h1 class="page-title">Documents</h1>
      <p class="page-subtitle">Manage your uploaded documents and generated files.</p>
      <div class="page-actions">
        <button class="btn btn-primary" id="showAddDocBtn">+ Add Document</button>
      </div>
      ${formHtml}
      ${listHtml}
    </div>
  `;
}

async function onMount() {
  _loading = true;
  _error = null;
  const result = await fetchDocuments();
  if (result.status === "ok") {
    _documents = Array.isArray(result.data) ? result.data : [];
    _error = null;
  } else {
    _documents = [];
    _error = result.message;
  }
  _loading = false;
  const container = document.getElementById("pageContainer");
  if (container) container.innerHTML = render();
  bindEvents(container);
}

function bindEvents(container) {
  if (!container) return;

  const showBtn = document.getElementById("showAddDocBtn");
  if (showBtn) {
    showBtn.addEventListener("click", () => {
      _showForm = true;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const cancelBtn = document.getElementById("cancelDocBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      _showForm = false;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const saveBtn = document.getElementById("saveDocBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const title = document.getElementById("docTitle")?.value || "";
      const category = document.getElementById("docCategory")?.value || "";
      const content = document.getElementById("docContent")?.value || "";

      _saving = true;
      container.innerHTML = render();
      bindEvents(container);

      const result = await createDocument({ title, content, category, filename: title || "untitled", file_type: "txt" });
      _saving = false;
      _showForm = false;
      if (result.status === "ok") {
        _documents.unshift(result.data);
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
