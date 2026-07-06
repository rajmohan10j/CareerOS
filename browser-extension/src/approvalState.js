function createApprovalStore() {
  const store = new Map();

  function getFieldKey(field) {
    if (typeof field === "string") return field;
    return field?.fieldKey || field?.intent || "";
  }

  function approve(field) {
    store.set(getFieldKey(field), true);
  }

  function reject(field) {
    store.set(getFieldKey(field), false);
  }

  function remove(field) {
    store.delete(getFieldKey(field));
  }

  function clear() {
    store.clear();
  }

  function reset() {
    store.clear();
  }

  function isApproved(field) {
    return store.get(getFieldKey(field)) === true;
  }

  function isRejected(field) {
    return store.get(getFieldKey(field)) === false;
  }

  function isPending(field) {
    return !store.has(getFieldKey(field));
  }

  function getApproved() {
    const result = [];
    for (const [k, v] of store) {
      if (v === true) result.push(k);
    }
    return result;
  }

  function getRejected() {
    const result = [];
    for (const [k, v] of store) {
      if (v === false) result.push(k);
    }
    return result;
  }

  function selectAllSafe(mappings) {
    for (const mapping of mappings) {
      if (mapping.sensitive) continue;
      if (mapping.mappingConfidence != null && mapping.mappingConfidence < 0.6) continue;
      if (mapping.mappingStatus !== "available" && mapping.mappingStatus !== "derived") continue;
      store.set(getFieldKey(mapping), true);
    }
  }

  function getSummary(allMappings) {
    let approved = 0;
    let rejected = 0;
    let pending = 0;
    for (const m of allMappings) {
      if (isApproved(m)) approved++;
      else if (isRejected(m)) rejected++;
      else pending++;
    }
    return { approved, rejected, pending, total: allMappings.length };
  }

  return { approve, reject, remove, clear, reset, isApproved, isRejected, isPending, getApproved, getRejected, selectAllSafe, getSummary, getFieldKey };
}

export { createApprovalStore };
