import {
  getStoredBackendUrl,
  setStoredBackendUrl,
  checkHealth,
  DEFAULT_BACKEND_URL,
  fetchPortals,
  createPortal,
  updatePortal,
  deletePortal,
} from "../apiClient.js";

let _portals = [];
let _portalsLoading = false;
let _showPortalForm = false;
let _editingPortal = null;
let _portalStatusMsg = null;

function setPortalFlash(msg) {
  _portalStatusMsg = msg;
  setTimeout(() => {
    _portalStatusMsg = null;
    const container = document.getElementById("pageContainer");
    if (container) {
      container.innerHTML = render();
      bindEvents(container);
    }
  }, 4000);
}

function render() {
  const currentUrl = getStoredBackendUrl();

  const portalsListHtml = _portalsLoading ? `
    <p class="health-checking" style="font-size: 13px;">Loading portals...</p>
  ` : _portals.length === 0 ? `
    <p style="color: var(--color-text-secondary); font-size: 13px;">No job portals configured.</p>
  ` : `
    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
      ${_portals.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #fff; border: 1px solid var(--color-border); border-radius: 6px; gap: 10px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 200px;">
            <span style="font-size: 20px;">${p.icon || '🌐'}</span>
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="font-size: 14px; color: var(--color-text);">${p.name}</strong>
                ${p.is_default ? `<span class="badge" style="background: #f1f5f9; color: #475569; font-size: 10px; padding: 1px 6px;">Default</span>` : `<span class="badge" style="background: #e0f2fe; color: #0284c7; font-size: 10px; padding: 1px 6px;">Custom</span>`}
              </div>
              <div style="font-size: 12px; color: var(--color-text-secondary); font-family: monospace;">${p.domain}</div>
            </div>
          </div>
          <div style="font-size: 11px; color: var(--color-text-secondary); flex: 1; min-width: 220px; max-width: 450px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.search_url_template}">
            Template: <code>${p.search_url_template}</code>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm btn-edit-portal" data-portal-id="${p.id}" style="font-size: 11px; padding: 3px 8px;">✏️ Edit</button>
            ${!p.is_default ? `
              <button class="btn btn-secondary btn-sm btn-delete-portal" data-portal-id="${p.id}" style="font-size: 11px; padding: 3px 8px; color: #b91c1c;">🗑️</button>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const portalFormHtml = _showPortalForm ? `
    <div style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: 8px; padding: 16px; margin-top: 14px;">
      <h4 style="margin: 0 0 12px 0;">${_editingPortal ? 'Edit Job Portal' : 'Add New Job Portal'}</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
        <div class="setting-group">
          <label for="portalNameInput">Portal Name *</label>
          <input type="text" id="portalNameInput" class="form-input" placeholder="e.g. IIMJobs or Foundit" value="${_editingPortal ? _editingPortal.name : ''}" />
        </div>
        <div class="setting-group">
          <label for="portalDomainInput">Domain Identifier *</label>
          <input type="text" id="portalDomainInput" class="form-input" placeholder="e.g. iimjobs.com" value="${_editingPortal ? _editingPortal.domain : ''}" />
        </div>
      </div>

      <div class="setting-group" style="margin-top: 10px;">
        <label for="portalTemplateInput">Search URL Template * <span style="font-size: 11px; color: var(--color-text-secondary); font-weight: normal;">(Use {role} and {location} or {role_slug} and {loc_slug})</span></label>
        <input type="text" id="portalTemplateInput" class="form-input" placeholder="https://www.iimjobs.com/search/{role_slug}-{loc_slug}.html" value="${_editingPortal ? _editingPortal.search_url_template : ''}" />
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 10px;">
        <div class="setting-group">
          <label for="portalIconInput">Icon / Emoji</label>
          <input type="text" id="portalIconInput" class="form-input" placeholder="e.g. 🎓 or 💼" value="${_editingPortal ? (_editingPortal.icon || '🌐') : '🌐'}" />
        </div>
        <div class="setting-group">
          <label for="portalColorInput">Theme Color</label>
          <input type="color" id="portalColorInput" class="form-input" style="height: 38px; padding: 2px;" value="${_editingPortal ? (_editingPortal.color || '#0284c7') : '#0284c7'}" />
        </div>
      </div>

      <div class="setting-actions" style="margin-top: 14px;">
        <button class="btn btn-primary btn-sm" id="btnSavePortalForm">Save Portal</button>
        <button class="btn btn-secondary btn-sm" id="btnCancelPortalForm">Cancel</button>
      </div>
    </div>
  ` : "";

  return `
    <div class="page settings-page">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your CareerOS desktop application and custom search integrations.</p>

      <!-- Job Portals Management Section -->
      <section class="settings-section" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h2 style="margin: 0;">Job Portals Manager</h2>
            <p class="setting-hint" style="margin: 4px 0 0 0;">Add and configure portals for search launchpad, auto-detection, and multi-sheet Excel tracking without touching any code.</p>
          </div>
          <button class="btn btn-primary btn-sm" id="btnAddPortalBtn">+ Add New Portal</button>
        </div>
        
        ${_portalStatusMsg ? `<div class="status-ok" style="margin-top: 12px; padding: 8px 12px; font-size: 13px; border-radius: 6px;">${_portalStatusMsg}</div>` : ''}
        ${portalFormHtml}
        ${portalsListHtml}
      </section>

      <!-- Backend Connection Section -->
      <section class="settings-section">
        <h2>Backend Connection</h2>
        <div class="setting-group">
          <label for="backendUrlInput">Backend URL</label>
          <input type="url" id="backendUrlInput" value="${currentUrl}" placeholder="${DEFAULT_BACKEND_URL}" />
          <p class="setting-hint">The URL of your local CareerOS backend server (default: ${DEFAULT_BACKEND_URL}).</p>
        </div>
        <div class="setting-actions">
          <button id="testBackendBtn" class="btn btn-secondary">Test Connection</button>
          <button id="saveBackendBtn" class="btn btn-primary">Save</button>
        </div>
        <div id="settingsStatus" class="settings-status"></div>
      </section>

      <!-- Application Info Section -->
      <section class="settings-section">
        <h2>Application</h2>
        <div class="setting-group">
          <p class="setting-hint">CareerOS Desktop v0.3.0</p>
          <p class="setting-hint">All data is stored locally on your machine. No cloud services are required.</p>
        </div>
      </section>
    </div>
  `;
}

async function loadPortals(container) {
  _portalsLoading = true;
  const res = await fetchPortals();
  _portalsLoading = false;
  if (res.status === "ok") {
    _portals = Array.isArray(res.data) ? res.data : [];
  }
  if (container) {
    container.innerHTML = render();
    bindEvents(container);
  }
}

function bindEvents(container) {
  if (!container) return;

  const testBtn = document.getElementById("testBackendBtn");
  const saveBtn = document.getElementById("saveBackendBtn");
  const statusEl = document.getElementById("settingsStatus");
  const urlInput = document.getElementById("backendUrlInput");

  if (testBtn) {
    testBtn.addEventListener("click", async () => {
      testBtn.disabled = true;
      testBtn.textContent = "Testing...";
      statusEl.textContent = "Connecting...";
      statusEl.className = "settings-status";
      const result = await checkHealth();
      if (result.status === "ok") {
        statusEl.textContent = `Connected — v${result.data.version || "?"}, mode ${result.data.mode || "?"}`;
        statusEl.className = "settings-status status-ok";
      } else {
        statusEl.textContent = `Connection failed: ${result.message}`;
        statusEl.className = "settings-status status-error";
      }
      testBtn.disabled = false;
      testBtn.textContent = "Test Connection";
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const url = urlInput.value.trim() || DEFAULT_BACKEND_URL;
      setStoredBackendUrl(url);
      statusEl.textContent = "Settings saved.";
      statusEl.className = "settings-status status-ok";
    });
  }

  // Portal form toggle
  const btnAdd = document.getElementById("btnAddPortalBtn");
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      _editingPortal = null;
      _showPortalForm = true;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const btnCancel = document.getElementById("btnCancelPortalForm");
  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      _showPortalForm = false;
      _editingPortal = null;
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  // Save Portal Form
  const btnSavePortal = document.getElementById("btnSavePortalForm");
  if (btnSavePortal) {
    btnSavePortal.addEventListener("click", async () => {
      const name = document.getElementById("portalNameInput")?.value.trim();
      const domain = document.getElementById("portalDomainInput")?.value.trim();
      const search_url_template = document.getElementById("portalTemplateInput")?.value.trim();
      const icon = document.getElementById("portalIconInput")?.value.trim() || "🌐";
      const color = document.getElementById("portalColorInput")?.value || "#0284c7";

      if (!name || !domain || !search_url_template) {
        alert("Please provide Portal Name, Domain, and Search URL Template.");
        return;
      }

      if (_editingPortal) {
        const res = await updatePortal(_editingPortal.id, { name, domain, search_url_template, icon, color });
        if (res.status === "ok") {
          _showPortalForm = false;
          _editingPortal = null;
          setPortalFlash(`Updated portal "${name}".`);
          await loadPortals(container);
        } else {
          alert(res.message || "Failed to update portal.");
        }
      } else {
        const res = await createPortal({ name, domain, search_url_template, icon, color });
        if (res.status === "ok") {
          _showPortalForm = false;
          setPortalFlash(`Added portal "${name}".`);
          await loadPortals(container);
        } else {
          alert(res.message || "Failed to add portal.");
        }
      }
    });
  }

  // Edit portal button
  container.querySelectorAll(".btn-edit-portal").forEach(btn => {
    btn.addEventListener("click", () => {
      const pId = btn.dataset.portalId;
      const found = _portals.find(p => String(p.id) === String(pId));
      if (found) {
        _editingPortal = found;
        _showPortalForm = true;
        container.innerHTML = render();
        bindEvents(container);
      }
    });
  });

  // Delete portal button
  container.querySelectorAll(".btn-delete-portal").forEach(btn => {
    btn.addEventListener("click", async () => {
      const pId = btn.dataset.portalId;
      const found = _portals.find(p => String(p.id) === String(pId));
      if (!found) return;
      if (!confirm(`Are you sure you want to remove portal "${found.name}"?`)) return;

      const res = await deletePortal(pId);
      if (res.status === "ok") {
        setPortalFlash(`Removed portal "${found.name}".`);
        await loadPortals(container);
      } else {
        alert(res.message || "Failed to remove portal.");
      }
    });
  });
}

async function onMount() {
  const container = document.getElementById("pageContainer");
  if (container) {
    container.innerHTML = render();
    bindEvents(container);
  }
  await loadPortals(container);
}

export default { render, onMount };
