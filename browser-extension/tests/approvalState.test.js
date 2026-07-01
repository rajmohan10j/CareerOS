import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXTENSION_ROOT = resolve(__dirname, "..");

function readFile(relativePath) {
  return readFileSync(resolve(EXTENSION_ROOT, relativePath), "utf-8");
}

let passed = 0;
let failed = 0;
const verbose = process.argv.includes("verbose");

function assert(condition, label) {
  if (condition) {
    passed++;
    if (verbose) console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}`);
  }
}

// ── File existence ────────────────────────────────────────────────

console.log("\n[file existence]");
const src = readFile("src/approvalState.js");
assert(src.length > 0, "src/approvalState.js exists and is non-empty");

// ── Export validation ─────────────────────────────────────────────

console.log("\n[exports]");
assert(src.includes("export"), "approvalState.js has exports");
assert(src.includes("createApprovalStore"), "approvalState.js exports createApprovalStore");

// ── Store creation ────────────────────────────────────────────────

console.log("\n[store creation]");
assert(src.includes("Map()"), "approvalState.js uses Map for internal state");
assert(src.includes("store.set"), "approvalState.js uses store.set");
assert(src.includes("store.get"), "approvalState.js uses store.get");
assert(src.includes("store.clear"), "approvalState.js uses store.clear");
assert(src.includes("store.has"), "approvalState.js uses store.has");
assert(src.includes("return {"), "approvalState.js returns an object");

// ── State methods ─────────────────────────────────────────────────

console.log("\n[state methods]");
const expectedMethods = [
  "approve", "reject", "remove", "clear", "reset",
  "isApproved", "isRejected", "isPending",
  "getApproved", "getRejected",
  "selectAllSafe", "getSummary",
];
for (const method of expectedMethods) {
  assert(src.includes(method), `approvalState.js defines ${method}`);
}

// ── Approval logic ────────────────────────────────────────────────

console.log("\n[approval logic]");
assert(src.includes("store.set(fieldIntent, true)"), "approve sets true");
assert(src.includes("store.set(fieldIntent, false)"), "reject sets false");
assert(src.includes("v === true"), "getApproved filters true values");
assert(src.includes("v === false"), "getRejected filters false values");

// ── Select all safe ───────────────────────────────────────────────

console.log("\n[select all safe]");
assert(src.includes("selectAllSafe"), "approvalState.js defines selectAllSafe");
assert(src.includes("mapping.sensitive"), "selectAllSafe checks sensitive flag");
assert(src.includes("mappingConfidence"), "selectAllSafe checks confidence");
assert(src.includes("\"available\""), "selectAllSafe checks available status");
assert(src.includes("\"derived\""), "selectAllSafe checks derived status");
assert(src.includes("mapping.intent"), "selectAllSafe uses intent from mapping");

// ── Remove method ─────────────────────────────────────────────────

console.log("\n[remove method]");
assert(src.includes("store.delete"), "remove uses store.delete");
assert(src.includes("function remove"), "approvalState.js defines remove");
assert(src.includes("function clear"), "approvalState.js defines clear");

// ── Summary ───────────────────────────────────────────────────────

console.log("\n[summary]");
assert(src.includes("getSummary"), "approvalState.js defines getSummary");
assert(src.includes("isApproved(m.intent)"), "getSummary counts approved");
assert(src.includes("isRejected(m.intent)"), "getSummary counts rejected");
assert(src.includes("approved++"), "getSummary increments approved");
assert(src.includes("rejected++"), "getSummary increments rejected");
assert(src.includes("pending++"), "getSummary increments pending");

// ── No persistence ────────────────────────────────────────────────

console.log("\n[no persistence]");
assert(
  !src.includes("chrome.storage"),
  "approvalState.js does not use chrome.storage"
);
assert(
  !src.includes("localStorage"),
  "approvalState.js does not use localStorage"
);

// ── Security ──────────────────────────────────────────────────────

console.log("\n[security]");
assert(
  !src.includes(".value ="),
  "approvalState.js does not assign values"
);
assert(
  !src.includes(".submit("),
  "approvalState.js does not submit forms"
);
assert(
  !src.includes("fetch("),
  "approvalState.js does not make network calls"
);
assert(
  !src.includes(".click("),
  "approvalState.js does not click elements"
);

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
