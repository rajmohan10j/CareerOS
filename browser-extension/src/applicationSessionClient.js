import { getStoredBackendUrl } from "./apiClient.js";

async function postJson(endpoint, body) {
  const baseUrl = await getStoredBackendUrl();
  const resp = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const detail = await resp.json().catch(() => ({}));
    throw new Error(detail.detail || `${endpoint} returned HTTP ${resp.status}`);
  }
  return resp.json();
}

async function ensureApplicationSession(page) {
  return postJson("/application-sessions/ensure", {
    url: page.url,
    page_title: page.title || null,
    job_title: page.title || null,
  });
}

async function getNextPendingEntry(url, section) {
  return postJson("/application-sessions/next-entry", { url, section });
}

async function markEntryFilled(url, section, index, notes) {
  return postJson("/application-sessions/mark-entry", {
    url,
    section,
    index,
    status: "filled",
    notes: notes || null,
  });
}

export { ensureApplicationSession, getNextPendingEntry, markEntryFilled };
