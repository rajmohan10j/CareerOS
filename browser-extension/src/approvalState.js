function createApprovalStore() {
  const store = new Map();

  function approve(fieldIntent) {
    store.set(fieldIntent, true);
  }

  function reject(fieldIntent) {
    store.set(fieldIntent, false);
  }

  function remove(fieldIntent) {
    store.delete(fieldIntent);
  }

  function clear() {
    store.clear();
  }

  function reset() {
    store.clear();
  }

  function isApproved(fieldIntent) {
    return store.get(fieldIntent) === true;
  }

  function isRejected(fieldIntent) {
    return store.get(fieldIntent) === false;
  }

  function isPending(fieldIntent) {
    return !store.has(fieldIntent);
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
      store.set(mapping.intent, true);
    }
  }

  function getSummary(allMappings) {
    let approved = 0;
    let rejected = 0;
    let pending = 0;
    for (const m of allMappings) {
      if (isApproved(m.intent)) approved++;
      else if (isRejected(m.intent)) rejected++;
      else pending++;
    }
    return { approved, rejected, pending, total: allMappings.length };
  }

  return { approve, reject, remove, clear, reset, isApproved, isRejected, isPending, getApproved, getRejected, selectAllSafe, getSummary };
}

export { createApprovalStore };
