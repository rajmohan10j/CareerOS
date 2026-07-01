import { fetchResumes } from "../apiClient.js";

let _resumes = [];
let _loading = true;
let _error = null;
let _selectedResume = null;

function render() {
  let listHtml = "";
  if (_loading) {
    listHtml = '<p class="health-checking">Loading resumes...</p>';
  } else if (_error) {
    listHtml = `<p class="health-error">${_error}</p>`;
  } else if (_resumes.length === 0) {
    listHtml = `<div class="empty-state"><div class="empty-state-icon">📄</div><p>No resumes yet.</p><p class="placeholder-hint">Create a resume from the Jobs page, or use the API to generate one.</p></div>`;
  } else {
    listHtml = '<div class="item-list">';
    for (const r of _resumes) {
      const isSelected = _selectedResume && _selectedResume.id === r.id;
      listHtml += `
        <div class="item-card ${isSelected ? 'item-card-selected' : ''}" data-resume-id="${r.id}">
          <div class="item-card-header">
            <strong>${r.title}</strong>
            <span class="item-card-badge">v${r.version}</span>
          </div>
          <div class="item-card-details">
            ${r.target_role ? `<span>Target: ${r.target_role}</span>` : ''}
            <span class="item-card-date">Created: ${new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          ${isSelected && r.content ? `<div class="item-card-content"><pre>${r.content}</pre></div>` : ''}
        </div>
      `;
    }
    listHtml += '</div>';
  }

  return `
    <div class="page resumes-page">
      <h1 class="page-title">Resume Manager</h1>
      <p class="page-subtitle">Create, version, and optimize your resumes.</p>
      ${listHtml}
    </div>
  `;
}

async function onMount() {
  _loading = true;
  _error = null;
  const result = await fetchResumes();
  if (result.status === "ok") {
    _resumes = Array.isArray(result.data) ? result.data : [];
    _error = null;
  } else {
    _resumes = [];
    _error = result.message;
  }
  _loading = false;
  const container = document.getElementById("pageContainer");
  if (container) container.innerHTML = render();

  container?.querySelectorAll(".item-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = parseInt(card.dataset.resumeId, 10);
      const found = _resumes.find(r => r.id === id);
      if (found) {
        _selectedResume = _selectedResume && _selectedResume.id === id && _selectedResume.content ? null : found;
        if (container) container.innerHTML = render();
      }
    });
  });
}

export default { render, onMount };
