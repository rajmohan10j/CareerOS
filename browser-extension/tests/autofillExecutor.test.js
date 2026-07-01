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
const src = readFile("src/autofillExecutor.js");
assert(src.length > 0, "src/autofillExecutor.js exists and is non-empty");

// ── Export validation ─────────────────────────────────────────────

console.log("\n[exports]");
assert(src.includes("export"), "autofillExecutor.js has exports");
assert(src.includes("buildApprovedFillFields"), "autofillExecutor.js exports buildApprovedFillFields");
assert(src.includes("executeFill"), "autofillExecutor.js exports executeFill");

// ── buildApprovedFillFields logic ─────────────────────────────────

console.log("\n[buildApprovedFillFields logic]");
assert(src.includes("approvalStore.getApproved"), "checks approvalStore.getApproved");
assert(src.includes("approvedIntents.includes"), "filters by approved intents");
assert(src.includes("mappedValue != null"), "filters non-null values");
assert(src.includes("tagName || \"\""), "reads tagName from field");
assert(src.includes(".toLowerCase()"), "lowercases for comparison");
assert(src.includes("\"file\""), "filters out file inputs");
assert(src.includes(".map("), "maps to simplified format");
assert(src.includes("intent:"), "maps intent");
assert(src.includes("value:"), "maps value");
assert(src.includes("name:"), "maps name");
assert(src.includes("id:"), "maps id");
assert(src.includes("tagName:"), "maps tagName");
assert(src.includes("fieldType:"), "maps fieldType");
assert(src.includes("inputType:"), "maps inputType");

// ── executeFill logic ─────────────────────────────────────────────

console.log("\n[executeFill logic]");
assert(src.includes("executeFill"), "autofillExecutor.js defines executeFill");
assert(src.includes("Promise"), "executeFill returns a promise");
assert(src.includes("FILL_FIELDS"), "executeFill sends FILL_FIELDS message");
assert(src.includes("chrome.runtime.sendMessage"), "executeFill uses chrome.runtime.sendMessage");
assert(src.includes("chrome.runtime.lastError"), "executeFill checks runtime.lastError");
assert(src.includes("filled: 0"), "result includes filled count");
assert(src.includes("skipped: 0"), "result includes skipped count");
assert(src.includes("failed: 0"), "result includes failed count");

// ── Security ──────────────────────────────────────────────────────

console.log("\n[security]");
assert(
  !src.includes(".value ="),
  "autofillExecutor.js does not assign values"
);
assert(
  !src.includes(".submit("),
  "autofillExecutor.js does not submit forms"
);
assert(
  !src.includes(".click("),
  "autofillExecutor.js does not click elements"
);
assert(
  !src.includes("localStorage"),
  "autofillExecutor.js does not use localStorage"
);
assert(
  !src.includes("chrome.storage"),
  "autofillExecutor.js does not use chrome.storage"
);

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
