import { fetchProfile, saveProfile } from "../apiClient.js";

let _profile = null;
let _loading = true;
let _error = null;
let _saving = false;
let _saveStatus = null;

function render() {
  const fields = _profile || {};

  return `
    <div class="page profile-page">
      <h1 class="page-title">Master Candidate Profile</h1>
      <p class="page-subtitle">View and manage your professional profile.</p>

      ${_saveStatus ? `<div class="settings-status ${_saveStatus === 'ok' ? 'status-ok' : 'status-error'}">${_saveStatus === 'ok' ? 'Profile saved successfully.' : 'Error saving profile.'}</div>` : ''}

      <div class="settings-section">
        <h2>Profile Details</h2>

        ${_loading ? '<p class="health-checking">Loading profile...</p>' : ''}
        ${_error ? `<p class="health-error">${_error}</p>` : ''}

        <div class="setting-group">
          <label for="profileSummary">Professional Summary</label>
          <textarea id="profileSummary" class="form-textarea" rows="4" placeholder="Write a brief professional summary...">${(fields.summary || '')}</textarea>
        </div>

        <div class="setting-group">
          <label for="profileRoles">Target Roles</label>
          <input type="text" id="profileRoles" class="form-input" placeholder="e.g. Software Engineer, Full Stack Developer" value="${(fields.target_roles || []).join(', ')}" />
          <p class="setting-hint">Comma-separated list of roles you are targeting.</p>
        </div>

        <div class="setting-group">
          <label for="profileIndustries">Industries</label>
          <input type="text" id="profileIndustries" class="form-input" placeholder="e.g. Technology, Healthcare, Finance" value="${(fields.industries || []).join(', ')}" />
          <p class="setting-hint">Comma-separated list of target industries.</p>
        </div>

        <div class="setting-group">
          <label for="profileLocations">Preferred Locations</label>
          <input type="text" id="profileLocations" class="form-input" placeholder="e.g. Remote, New York, San Francisco" value="${(fields.locations || []).join(', ')}" />
          <p class="setting-hint">Comma-separated list of preferred work locations.</p>
        </div>

        <div class="setting-actions">
          <button class="btn btn-primary" id="saveProfileBtn" ${_saving ? 'disabled' : ''}>${_saving ? 'Saving...' : 'Save Profile'}</button>
        </div>
      </div>
    </div>
  `;
}

async function onMount() {
  _loading = true;
  _error = null;
  _saveStatus = null;
  const result = await fetchProfile();
  if (result.status === "ok" && result.data && result.data.id) {
    _profile = result.data;
    _error = null;
  } else if (result.status === "ok") {
    _profile = {};
    _error = null;
  } else {
    _profile = null;
    _error = result.message;
  }
  _loading = false;
  const container = document.getElementById("pageContainer");
  if (container) container.innerHTML = render();

  const btn = document.getElementById("saveProfileBtn");
  if (btn) {
    btn.addEventListener("click", async () => {
      const summary = document.getElementById("profileSummary")?.value || "";
      const rolesStr = document.getElementById("profileRoles")?.value || "";
      const industriesStr = document.getElementById("profileIndustries")?.value || "";
      const locationsStr = document.getElementById("profileLocations")?.value || "";

      const target_roles = rolesStr.split(",").map(s => s.trim()).filter(Boolean);
      const industries = industriesStr.split(",").map(s => s.trim()).filter(Boolean);
      const locations = locationsStr.split(",").map(s => s.trim()).filter(Boolean);

      _saving = true;
      _saveStatus = null;
      const container2 = document.getElementById("pageContainer");
      if (container2) container2.innerHTML = render();

      const saveResult = await saveProfile({ summary, target_roles, industries, locations });
      _saving = false;
      if (saveResult.status === "ok") {
        _profile = saveResult.data;
        _saveStatus = "ok";
      } else {
        _saveStatus = "error";
      }
      if (container2) container2.innerHTML = render();
    });
  }
}

export default { render, onMount };
