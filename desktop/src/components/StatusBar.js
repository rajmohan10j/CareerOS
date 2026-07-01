import { render as renderBackendStatus, refresh as refreshBackend, subscribe } from "./BackendStatus.js";

let _backendRefreshInterval = null;

function render() {
  return `
    <footer class="status-bar">
      <div class="status-bar-left">
        <span class="status-app-version">CareerOS Desktop v0.1.0</span>
      </div>
      <div class="status-bar-right" id="backendStatusContainer">
        ${renderBackendStatus()}
      </div>
    </footer>`
  ;
}

function mount(container) {
  const backendContainer = container.querySelector("#backendStatusContainer");
  if (backendContainer) {
    subscribe(() => {
      backendContainer.innerHTML = renderBackendStatus();
    });
  }
  refreshBackend();
  if (_backendRefreshInterval) clearInterval(_backendRefreshInterval);
  _backendRefreshInterval = setInterval(refreshBackend, 30000);
}

function unmount() {
  if (_backendRefreshInterval) {
    clearInterval(_backendRefreshInterval);
    _backendRefreshInterval = null;
  }
}

export { render, mount, unmount };
