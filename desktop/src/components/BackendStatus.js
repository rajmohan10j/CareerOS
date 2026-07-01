import { checkHealth } from "../apiClient.js";

let _status = { online: false, version: null, mode: null, message: "Checking..." };
let _listeners = [];

function getStatus() {
  return { ..._status };
}

function subscribe(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}

function notify() {
  for (const fn of _listeners) fn(_status);
}

async function refresh() {
  _status = { ..._status, message: "Checking..." };
  notify();
  const result = await checkHealth();
  if (result.status === "ok") {
    _status = {
      online: true,
      version: result.data.version || "?",
      mode: result.data.mode || "?",
      message: "Connected",
      elapsed: result.elapsed,
    };
  } else {
    _status = {
      online: false,
      version: null,
      mode: null,
      message: result.message || "Offline",
    };
  }
  notify();
}

function render() {
  const cls = _status.online ? "bs-online" : "bs-offline";
  const detail = _status.online
    ? `v${_status.version} · ${_status.mode}`
    : "";
  return `
    <div class="backend-status ${cls}">
      <span class="bs-indicator"></span>
      <span class="bs-label">Backend</span>
      <span class="bs-message">${_status.message}</span>
      ${detail ? `<span class="bs-detail">${detail}</span>` : ""}
    </div>
  `;
}

export { getStatus, subscribe, refresh, render };
