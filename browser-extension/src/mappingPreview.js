function buildPreviewItem(mapping, approvalStore) {
  const approved = approvalStore.isApproved(mapping.intent);
  const rejected = approvalStore.isRejected(mapping.intent);
  const pending = approvalStore.isPending(mapping.intent);
  const safe = !mapping.sensitive && mapping.mappingConfidence != null && mapping.mappingConfidence >= 0.6 && (mapping.mappingStatus === "available" || mapping.mappingStatus === "derived");

  return {
    intent: mapping.intent,
    value: mapping.mappedValue,
    status: mapping.mappingStatus,
    confidence: mapping.mappingConfidence,
    sensitive: mapping.sensitive,
    message: mapping.mappingMessage,
    approved,
    rejected,
    pending,
    safe,
  };
}

function buildPreviewList(mappings, approvalStore) {
  if (!mappings || mappings.length === 0) return [];
  return mappings.map((m) => buildPreviewItem(m, approvalStore));
}

function buildItemHTML(mapping, approvalStore) {
  const preview = buildPreviewItem(mapping, approvalStore);
  const isApproved = preview.approved;
  const isRejected = preview.rejected;

  const valueDisplay = preview.value != null ? escapeHtml(String(preview.value)) : "<span class='preview-empty'>—</span>";
  const sensitiveBadge = preview.sensitive ? '<span class="sensitive-tag">sensitive — requires manual review</span>' : "";
  const messageHtml = preview.message ? escapeHtml(preview.message) : "—";
  const confidencePct = preview.confidence != null ? Math.round(preview.confidence * 100) : null;
  const confidenceDisplay = confidencePct != null ? `${confidencePct}%` : "—";
  const lowConfBadge = preview.confidence != null && preview.confidence < 0.6 ? '<span class="low-conf-badge" title="Low confidence — verify value before filling">low confidence</span>' : "";
  const statusBadge = `<span class="status-badge badge-${preview.status}">${preview.status}</span>`;
  const sensitiveWarning = preview.sensitive ? '<div class="sensitive-warning">This field contains personal or regulated information. Review carefully before filling.</div>' : "";

  const approvedChecked = isApproved ? "checked" : "";
  const rejectedChecked = isRejected ? "checked" : "";

  return `
    <div class="preview-row ${preview.sensitive ? "preview-sensitive" : ""} ${isApproved ? "preview-approved" : ""} ${isRejected ? "preview-rejected" : ""}" data-intent="${preview.intent}">
      <div class="preview-header">
        <span class="preview-intent">${escapeHtml(preview.intent)}</span>
        ${statusBadge}
        ${sensitiveBadge}
        ${lowConfBadge}
      </div>
      <div class="preview-value">${valueDisplay}</div>
      ${sensitiveWarning}
      <div class="preview-details">
        <span class="preview-confidence" title="Confidence score: how reliably the field intent was identified">Confidence: ${confidenceDisplay}</span>
        <span class="preview-msg">${messageHtml}</span>
      </div>
      <div class="preview-actions">
        <label class="preview-toggle ${!preview.sensitive ? "" : "toggle-disabled"}" title="${preview.sensitive ? "Sensitive field — cannot be auto-approved" : "Approve this field for filling"}">
          <input type="radio" name="action_${preview.intent}" value="approve" class="preview-approve" ${approvedChecked} ${preview.sensitive ? "disabled" : ""}>
          Approve
        </label>
        <label class="preview-toggle">
          <input type="radio" name="action_${preview.intent}" value="reject" class="preview-reject" ${rejectedChecked}>
          Reject
        </label>
        <label class="preview-toggle">
          <input type="radio" name="action_${preview.intent}" value="pending" class="preview-pending" ${!isApproved && !isRejected ? "checked" : ""}>
          Skip
        </label>
      </div>
    </div>`;
}

function buildPreviewContainerHTML(mappings, approvalStore) {
  if (!mappings || mappings.length === 0) {
    return "<p class='debug-empty'>No mappings to preview.</p>";
  }
  return mappings.map((m) => buildItemHTML(m, approvalStore)).join("");
}

function buildApprovalSummaryHTML(summary) {
  if (!summary) return "";
  return `
    <div class="approval-summary">
      <span class="approval-stat stat-ok">${summary.approved} approved</span>
      <span class="approval-stat stat-missing">${summary.rejected} rejected</span>
      <span class="approval-stat stat-review">${summary.pending} pending</span>
      <span class="approval-stat stat-total">${summary.total} total</span>
    </div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export { buildPreviewItem, buildPreviewList, buildItemHTML, buildPreviewContainerHTML, buildApprovalSummaryHTML, escapeHtml };
