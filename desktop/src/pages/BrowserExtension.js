function render() {
  return `
    <div class="page extension-page">
      <h1 class="page-title">Browser Extension</h1>
      <p class="page-subtitle">CareerOS browser extension for job form autofill.</p>

      <div class="settings-section">
        <h2>Setup Instructions</h2>
        <p>The CareerOS browser extension helps you autofill job application forms with your profile data.</p>
        <ol style="margin: 12px 0 0 20px; line-height: 1.8;">
          <li>Open <code>chrome://extensions</code> in Chrome (or <code>about:debugging</code> in Firefox).</li>
          <li>Enable <strong>Developer mode</strong> (toggle in top-right corner on Chrome).</li>
          <li>Click <strong>Load unpacked</strong> and select the <code>browser-extension/</code> folder inside the CareerOS project directory.</li>
          <li>Ensure your CareerOS backend is running at <code>http://127.0.0.1:8000</code>.</li>
          <li>Open a job application page and click the CareerOS icon in your browser toolbar to open the popup.</li>
        </ol>
        <p style="margin-top: 12px;" class="placeholder-hint">The extension runs entirely in your browser. No cloud services required. All data stays on your machine.</p>
      </div>

      <div class="settings-section">
        <h2>Backend Connection</h2>
        <p>Your local CareerOS backend must be running for the extension to fetch your profile data.</p>
        <p style="margin-top: 8px;">Go to <strong>Settings</strong> to verify your backend URL and test the connection.</p>
      </div>
    </div>
  `;
}

export default { render };
