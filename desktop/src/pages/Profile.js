function render() {
  return `
    <div class="page profile-page">
      <h1 class="page-title">Master Candidate Profile</h1>
      <p class="page-subtitle">View and manage your professional profile.</p>
      <div class="page-placeholder">
        <div class="placeholder-icon">👤</div>
        <p>Profile management interface will be available here.</p>
        <p class="placeholder-hint">Data is loaded from the local CareerOS backend (GET /profile).</p>
      </div>
    </div>
  `;
}

export default { render };
