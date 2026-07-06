import { fetchProfile, saveProfile } from "../apiClient.js";

let _profile = null;
let _loading = true;
let _error = null;
let _saving = false;
let _saveStatus = null;

function render() {
  const fields = _profile || {};
  const preferences = fields.preferences_json || {};
  const salary = fields.salary_expectations || {};

  return `
    <div class="page profile-page">
      <h1 class="page-title">Master Candidate Profile</h1>
      <p class="page-subtitle">View and manage your professional profile.</p>

      ${_saveStatus ? `<div class="settings-status ${_saveStatus === 'ok' ? 'status-ok' : 'status-error'}">${_saveStatus === 'ok' ? 'Profile saved successfully.' : 'Error saving profile.'}</div>` : ''}

      <div class="settings-section">
        <h2>Profile Details</h2>

        ${_loading ? '<p class="health-checking">Loading profile...</p>' : ''}
        ${_error ? `<p class="health-error">${_error}</p>` : ''}

        ${!_loading && !_error ? `

        <div class="setting-group">
          <label for="profileSummary">Professional Summary</label>
          <textarea id="profileSummary" class="form-textarea" rows="4" placeholder="Write a brief professional summary...">${(fields.summary || '')}</textarea>
        </div>

        <div class="setting-group">
          <label for="profileFullName">Full Legal Name</label>
          <input type="text" id="profileFullName" class="form-input" placeholder="e.g. Raj Sharma" value="${preferences.full_name || ''}" />
          <p class="setting-hint">Used by the browser extension for full-name fields.</p>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profilePrefix">Prefix</label>
            <input type="text" id="profilePrefix" class="form-input" placeholder="e.g. Mr., Ms., Dr." value="${preferences.name_prefix || ''}" />
          </div>
          <div>
            <label for="profileFirstName">First Name</label>
            <input type="text" id="profileFirstName" class="form-input" placeholder="e.g. Raj" value="${preferences.first_name || ''}" />
          </div>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profileMiddleName">Middle Name</label>
            <input type="text" id="profileMiddleName" class="form-input" placeholder="Optional" value="${preferences.middle_name || ''}" />
          </div>
          <div>
            <label for="profileLastName">Last Name</label>
            <input type="text" id="profileLastName" class="form-input" placeholder="e.g. Sharma" value="${preferences.last_name || ''}" />
          </div>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profileEmail">Email</label>
            <input type="email" id="profileEmail" class="form-input" placeholder="e.g. raj@example.com" value="${preferences.contact_email || preferences.email || ''}" />
          </div>
          <div>
            <label for="profilePhone">Phone</label>
            <input type="tel" id="profilePhone" class="form-input" placeholder="e.g. +91 99999 99999" value="${preferences.contact_phone || preferences.phone || ''}" />
          </div>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profileLinkedIn">LinkedIn URL</label>
            <input type="url" id="profileLinkedIn" class="form-input" placeholder="https://www.linkedin.com/in/..." value="${preferences.linkedin_url || ''}" />
          </div>
          <div>
            <label for="profilePortfolio">Portfolio / Project URL</label>
            <input type="url" id="profilePortfolio" class="form-input" placeholder="https://github.com/..." value="${preferences.portfolio_url || preferences.github_url || ''}" />
          </div>
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

        <div class="setting-group form-row">
          <div>
            <label for="profileSalaryMin">Salary Minimum</label>
            <input type="text" id="profileSalaryMin" class="form-input" placeholder="e.g. 4500000" value="${salary.min || ''}" />
          </div>
          <div>
            <label for="profileSalaryMax">Salary Maximum</label>
            <input type="text" id="profileSalaryMax" class="form-input" placeholder="e.g. 6000000" value="${salary.max || ''}" />
          </div>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profileSalaryCurrency">Salary Currency</label>
            <input type="text" id="profileSalaryCurrency" class="form-input" placeholder="e.g. INR" value="${salary.currency || ''}" />
          </div>
          <div>
            <label for="profileSalaryPeriod">Salary Period</label>
            <input type="text" id="profileSalaryPeriod" class="form-input" placeholder="e.g. annual" value="${salary.period || ''}" />
          </div>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profileWorkAuth">Work Authorization</label>
            <input type="text" id="profileWorkAuth" class="form-input" placeholder="e.g. Authorized to work in India" value="${preferences.work_authorization || ''}" />
          </div>
          <div>
            <label for="profileNoticePeriod">Notice Period</label>
            <input type="text" id="profileNoticePeriod" class="form-input" placeholder="e.g. 30 days" value="${preferences.notice_period || ''}" />
          </div>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profileLegalEligibility">Legal Eligibility to Work</label>
            <input type="text" id="profileLegalEligibility" class="form-input" placeholder="e.g. Yes" value="${preferences.legal_eligibility || ''}" />
          </div>
          <div>
            <label for="profileProfessionalCategory">Professional Category</label>
            <input type="text" id="profileProfessionalCategory" class="form-input" placeholder="e.g. Experienced" value="${preferences.professional_category || ''}" />
          </div>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profileReferralSource">How You Heard About Employers</label>
            <input type="text" id="profileReferralSource" class="form-input" placeholder="e.g. LinkedIn, Company Website, Referral" value="${preferences.referral_source || ''}" />
          </div>
          <div>
            <label for="profilePreviousEmployment">Previous Employment Answer</label>
            <input type="text" id="profilePreviousEmployment" class="form-input" placeholder="e.g. No" value="${preferences.previous_employment || ''}" />
          </div>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profileGender">Gender</label>
            <input type="text" id="profileGender" class="form-input" placeholder="Optional voluntary disclosure" value="${preferences.gender || ''}" />
          </div>
          <div>
            <label for="profileDob">Date of Birth</label>
            <input type="text" id="profileDob" class="form-input" placeholder="e.g. 10/01/1974" value="${preferences.date_of_birth || ''}" />
          </div>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profileCitizenship">Citizenship Status</label>
            <input type="text" id="profileCitizenship" class="form-input" placeholder="e.g. Citizen (India)" value="${preferences.citizenship_status || ''}" />
          </div>
          <div>
            <label for="profilePronoun">Pronoun</label>
            <input type="text" id="profilePronoun" class="form-input" placeholder="e.g. He" value="${preferences.pronoun || ''}" />
          </div>
        </div>

        <div class="setting-group form-row">
          <div>
            <label for="profileDisability">Disability Disclosure</label>
            <input type="text" id="profileDisability" class="form-input" placeholder="e.g. I do not have a disability" value="${preferences.disability_status || ''}" />
          </div>
          <div>
            <label for="profileDeclaration">Declaration / Terms Answer</label>
            <input type="text" id="profileDeclaration" class="form-input" placeholder="e.g. Yes" value="${preferences.declaration_confirmation || ''}" />
          </div>
        </div>

        <div class="setting-actions">
          <button class="btn btn-primary" id="saveProfileBtn" ${_saving ? 'disabled' : ''}>${_saving ? 'Saving...' : 'Save Profile'}</button>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

function parseList(value) {
  return value.split(",").map(s => s.trim()).filter(Boolean);
}

function optionalValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function compactObject(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== ""));
}

function attachHandlers() {
  const btn = document.getElementById("saveProfileBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const summary = document.getElementById("profileSummary")?.value || "";
    const rolesStr = document.getElementById("profileRoles")?.value || "";
    const industriesStr = document.getElementById("profileIndustries")?.value || "";
    const locationsStr = document.getElementById("profileLocations")?.value || "";
    const preferences = compactObject({
      ...((_profile && _profile.preferences_json) || {}),
      full_name: optionalValue("profileFullName"),
      name_prefix: optionalValue("profilePrefix"),
      first_name: optionalValue("profileFirstName"),
      middle_name: optionalValue("profileMiddleName"),
      last_name: optionalValue("profileLastName"),
      contact_email: optionalValue("profileEmail"),
      contact_phone: optionalValue("profilePhone"),
      linkedin_url: optionalValue("profileLinkedIn"),
      portfolio_url: optionalValue("profilePortfolio"),
      work_authorization: optionalValue("profileWorkAuth"),
      legal_eligibility: optionalValue("profileLegalEligibility"),
      notice_period: optionalValue("profileNoticePeriod"),
      professional_category: optionalValue("profileProfessionalCategory"),
      referral_source: optionalValue("profileReferralSource"),
      previous_employment: optionalValue("profilePreviousEmployment"),
      gender: optionalValue("profileGender"),
      date_of_birth: optionalValue("profileDob"),
      citizenship_status: optionalValue("profileCitizenship"),
      pronoun: optionalValue("profilePronoun"),
      disability_status: optionalValue("profileDisability"),
      declaration_confirmation: optionalValue("profileDeclaration"),
      terms_acknowledgement: optionalValue("profileDeclaration"),
    });
    const salary = compactObject({
      ...((_profile && _profile.salary_expectations) || {}),
      min: optionalValue("profileSalaryMin"),
      max: optionalValue("profileSalaryMax"),
      currency: optionalValue("profileSalaryCurrency"),
      period: optionalValue("profileSalaryPeriod"),
    });

    _profile = {
      ...(_profile || {}),
      summary,
      target_roles: parseList(rolesStr),
      industries: parseList(industriesStr),
      locations: parseList(locationsStr),
      salary_expectations: salary,
      preferences_json: preferences,
    };
    _saving = true;
    _saveStatus = null;
    renderInto(document.getElementById("pageContainer"));

    const saveResult = await saveProfile(_profile);
    _saving = false;
    if (saveResult.status === "ok") {
      _profile = saveResult.data;
      _saveStatus = "ok";
    } else {
      _saveStatus = "error";
    }
    renderInto(document.getElementById("pageContainer"));
  });
}

function renderInto(container) {
  if (!container) return;
  container.innerHTML = render();
  attachHandlers();
}

async function onMount() {
  _loading = true;
  _error = null;
  _saveStatus = null;
  renderInto(document.getElementById("pageContainer"));

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
  renderInto(document.getElementById("pageContainer"));
}

export default { render, onMount };
