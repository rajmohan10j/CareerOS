function render() {
  return `
    <div class="page extension-page">
      <h1 class="page-title">Browser Extension</h1>
      <p class="page-subtitle">CareerOS browser extension for job form autofill.</p>

      <div class="settings-section">
        <h2>Setup Instructions</h2>
        <p>The CareerOS browser extension helps you autofill job application forms with your profile data.</p>
        <ol style="margin: 12px 0 0 20px; line-height: 1.8;">
          <li>Install the extension from the Chrome Web Store or Firefox Add-ons marketplace.</li>
          <li>Ensure your CareerOS backend is running at <code>http://127.0.0.1:8000</code>.</li>
          <li>Open a job application page and click the CareerOS icon in your browser toolbar.</li>
          <li>Select the form fields you want to autofill and click "Apply".</li>
        </ol>
        <p style="margin-top: 12px;" class="placeholder-hint">The extension runs independently in your browser. No cloud services required.</p>
      </div>

      <div class="settings-section">
        <h2>Backend Status</h2>
        <p>Your backend must be running and accessible for the extension to work.</p>
        <p style="margin-top: 8px;">Go to <strong>Settings</strong> to verify your backend URL and connection status.</p>
      </div>

      <div class="settings-section">
        <h2>Supported Job Boards</h2>
        <ul style="margin: 8px 0 0 20px; line-height: 1.8;">
          <li>LinkedIn</li>
          <li>Indeed</li>
          <li>Glassdoor</li>
          <li>Monster</li>
          <li>ZipRecruiter</li>
        </ul>
        <p style="margin-top: 12px;" class="placeholder-hint">Additional boards can be supported via community-contributed adapters.</p>
      </div>
    </div>
  `;
}

export default { render };
