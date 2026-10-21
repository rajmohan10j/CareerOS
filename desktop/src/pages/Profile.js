import {
  fetchProfile,
  saveProfile,
  fetchProfiles,
  createProfile,
  fetchProfileById,
  updateProfileById,
  activateProfile,
  deleteProfile,
} from "../apiClient.js";

let _profiles = [];
let _currentProfileId = null;
let _profile = null;
let _loading = true;
let _error = null;
let _saving = false;
let _saveStatus = null;
let _statusMessage = null;

function render() {
  const fields = _profile || {};
  const currentId = _currentProfileId;

  const profileOptions = _profiles.map(p => `
    <option value="${p.id}" ${p.id === currentId ? 'selected' : ''}>
      ${p.name || ('Profile ' + p.id)}${p.is_active ? ' ★ (Active)' : ''}
    </option>
  `).join('');

  return `
    <div class="page profile-page">
      <h1 class="page-title">Master Candidate Profile</h1>
      <p class="page-subtitle">View and manage multiple career tracks and professional profiles.</p>

      ${_statusMessage ? `<div class="settings-status ${_saveStatus === 'ok' ? 'status-ok' : 'status-error'}" style="margin-bottom: 16px;">${_statusMessage}</div>` : ''}

      <div class="settings-section" style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 260px;">
            <label for="profileSelect" style="font-weight: 600; white-space: nowrap;">Selected Profile:</label>
            <select id="profileSelect" class="form-input" style="max-width: 380px;">
              ${profileOptions.length > 0 ? profileOptions : '<option value="">No profiles</option>'}
            </select>
            ${fields.is_active ? `<span class="badge" style="background: #e8f5e9; color: #2e7d32; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap;">✓ Active Profile</span>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${!fields.is_active && currentId ? `<button class="btn btn-secondary btn-sm" id="activateProfileBtn">⭐ Set as Active</button>` : ''}
            <button class="btn btn-primary btn-sm" id="newProfileBtn">➕ New Profile</button>
            ${_profiles.length > 1 ? `<button class="btn btn-secondary btn-sm" id="deleteProfileBtn" style="color: var(--color-error);">🗑️ Delete</button>` : ''}
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>${fields.name ? `Profile Details — ${fields.name}` : 'Profile Details'}</h2>

        ${_loading ? '<p class="health-checking">Loading profile...</p>' : ''}
        ${_error ? `<p class="health-error">${_error}</p>` : ''}

        <div class="setting-group">
          <label for="profileName">Profile Name / Career Track</label>
          <input type="text" id="profileName" class="form-input" placeholder="e.g. Publishing Operations Leader" value="${(fields.name || 'Primary Profile')}" />
          <p class="setting-hint">Name this career profile (e.g. Publishing Leader, Digital Transformation Director, Consulting).</p>
        </div>

        <div class="setting-group">
          <label for="profileSummary">Professional Summary</label>
          <textarea id="profileSummary" class="form-textarea" rows="4" placeholder="Write a brief professional summary...">${(fields.summary || '')}</textarea>
        </div>

        <div class="setting-group">
          <label for="profileRoles">Target Roles</label>
          <input type="text" id="profileRoles" class="form-input" placeholder="e.g. Software Engineer, Full Stack Developer" value="${Array.isArray(fields.target_roles) ? fields.target_roles.join(', ') : (fields.target_roles || '')}" />
          <p class="setting-hint">Comma-separated list of roles you are targeting.</p>
        </div>

        <div class="setting-group">
          <label for="profileIndustries">Industries</label>
          <input type="text" id="profileIndustries" class="form-input" placeholder="e.g. Technology, Healthcare, Finance" value="${Array.isArray(fields.industries) ? fields.industries.join(', ') : (fields.industries || '')}" />
          <p class="setting-hint">Comma-separated list of target industries.</p>
        </div>

        <div class="setting-group">
          <label for="profileLocations">Preferred Locations</label>
          <input type="text" id="profileLocations" class="form-input" placeholder="e.g. Remote, New York, San Francisco" value="${Array.isArray(fields.locations) ? fields.locations.join(', ') : (fields.locations || '')}" />
          <p class="setting-hint">Comma-separated list of preferred work locations.</p>
        </div>

        <div class="setting-actions" style="margin-top: 16px;">
          <button class="btn btn-primary" id="saveProfileBtn" ${_saving ? 'disabled' : ''}>${_saving ? 'Saving...' : 'Save Profile'}</button>
        </div>
      </div>
    </div>
  `;
}

function setNotification(msg, isOk = true) {
  _statusMessage = msg;
  _saveStatus = isOk ? 'ok' : 'error';
  setTimeout(() => {
    _statusMessage = null;
    const container = document.getElementById("pageContainer");
    if (container) {
      container.innerHTML = render();
      bindEvents(container);
    }
  }, 4500);
}

async function loadAllProfiles() {
  _loading = true;
  _error = null;
  const result = await fetchProfiles();
  if (result.status === "ok" && Array.isArray(result.data) && result.data.length > 0) {
    _profiles = result.data;
    if (!_currentProfileId || !_profiles.some(p => p.id === _currentProfileId)) {
      const active = _profiles.find(p => p.is_active);
      _currentProfileId = active ? active.id : _profiles[0].id;
    }
    _profile = _profiles.find(p => p.id === _currentProfileId) || _profiles[0];
  } else {
    // Fallback to single profile endpoint
    const singleResult = await fetchProfile();
    if (singleResult.status === "ok" && singleResult.data && singleResult.data.id) {
      _profile = singleResult.data;
      _profiles = [_profile];
      _currentProfileId = _profile.id;
    } else {
      _profile = {};
      _profiles = [];
      _currentProfileId = null;
    }
  }
  _loading = false;
}

function bindEvents(container) {
  if (!container) return;

  const profileSelect = document.getElementById("profileSelect");
  if (profileSelect) {
    profileSelect.addEventListener("change", (e) => {
      const id = parseInt(e.target.value, 10);
      if (id && id !== _currentProfileId) {
        _currentProfileId = id;
        _profile = _profiles.find(p => p.id === id) || null;
        _statusMessage = null;
        container.innerHTML = render();
        bindEvents(container);
      }
    });
  }

  const newProfileBtn = document.getElementById("newProfileBtn");
  if (newProfileBtn) {
    newProfileBtn.addEventListener("click", async () => {
      const name = window.prompt("Enter a name/track for the new profile:", `Career Track ${_profiles.length + 1}`);
      if (!name || !name.trim()) return;

      _saving = true;
      container.innerHTML = render();
      bindEvents(container);

      const createRes = await createProfile({
        name: name.trim(),
        summary: "",
        target_roles: [],
        industries: [],
        locations: [],
        is_active: false,
      });

      _saving = false;
      if (createRes.status === "ok" && createRes.data) {
        _profiles.push(createRes.data);
        _currentProfileId = createRes.data.id;
        _profile = createRes.data;
        setNotification(`New profile "${createRes.data.name}" created. You can now edit its details below.`);
      } else {
        setNotification(createRes.message || "Failed to create new profile.", false);
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const activateProfileBtn = document.getElementById("activateProfileBtn");
  if (activateProfileBtn) {
    activateProfileBtn.addEventListener("click", async () => {
      if (!_currentProfileId) return;
      _saving = true;
      container.innerHTML = render();
      bindEvents(container);

      const actRes = await activateProfile(_currentProfileId);
      _saving = false;
      if (actRes.status === "ok" && actRes.data) {
        for (const p of _profiles) {
          p.is_active = (p.id === _currentProfileId);
        }
        _profile = actRes.data;
        setNotification(`Profile "${actRes.data.name}" is now the active profile used for resume generation and job discovery.`);
      } else {
        setNotification(actRes.message || "Failed to activate profile.", false);
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const deleteProfileBtn = document.getElementById("deleteProfileBtn");
  if (deleteProfileBtn) {
    deleteProfileBtn.addEventListener("click", async () => {
      if (!_currentProfileId || _profiles.length <= 1) return;
      const targetName = _profile?.name || "this profile";
      if (!window.confirm(`Are you sure you want to delete "${targetName}"?`)) return;

      _saving = true;
      container.innerHTML = render();
      bindEvents(container);

      const delRes = await deleteProfile(_currentProfileId);
      _saving = false;
      if (delRes.status === "ok") {
        _profiles = _profiles.filter(p => p.id !== _currentProfileId);
        _currentProfileId = _profiles.length > 0 ? _profiles[0].id : null;
        _profile = _profiles.length > 0 ? _profiles[0] : null;
        setNotification(`Profile "${targetName}" deleted.`);
      } else {
        setNotification(delRes.message || "Failed to delete profile.", false);
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  }

  const saveProfileBtn = document.getElementById("saveProfileBtn");
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
      const name = document.getElementById("profileName")?.value?.trim() || "Primary Profile";
      const summary = document.getElementById("profileSummary")?.value || "";
      const rolesStr = document.getElementById("profileRoles")?.value || "";
      const industriesStr = document.getElementById("profileIndustries")?.value || "";
      const locationsStr = document.getElementById("profileLocations")?.value || "";

      const target_roles = rolesStr.split(",").map(s => s.trim()).filter(Boolean);
      const industries = industriesStr.split(",").map(s => s.trim()).filter(Boolean);
      const locations = locationsStr.split(",").map(s => s.trim()).filter(Boolean);

      _saving = true;
      container.innerHTML = render();
      bindEvents(container);

      let saveResult;
      if (_currentProfileId) {
        saveResult = await updateProfileById(_currentProfileId, {
          name,
          summary,
          target_roles,
          industries,
          locations,
        });
      } else {
        saveResult = await saveProfile({
          name,
          summary,
          target_roles,
          industries,
          locations,
        });
      }

      _saving = false;
      if (saveResult.status === "ok" && saveResult.data) {
        _profile = saveResult.data;
        const idx = _profiles.findIndex(p => p.id === saveResult.data.id);
        if (idx >= 0) {
          _profiles[idx] = saveResult.data;
        } else {
          _profiles.push(saveResult.data);
          _currentProfileId = saveResult.data.id;
        }
        setNotification(`Profile "${_profile.name}" saved successfully.`);
      } else {
        setNotification(saveResult.message || "Error saving profile.", false);
      }
      container.innerHTML = render();
      bindEvents(container);
    });
  }
}

async function onMount() {
  await loadAllProfiles();
  const container = document.getElementById("pageContainer");
  if (container) {
    container.innerHTML = render();
    bindEvents(container);
  }
}

export default { render, onMount };
