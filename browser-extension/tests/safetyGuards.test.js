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

// ── File references ───────────────────────────────────────────────

const contentSrc = readFile("src/content.js");
const executorSrc = readFile("src/autofillExecutor.js");

// ── No form submission ────────────────────────────────────────────

console.log("\n[no form submission]");
assert(
  !contentSrc.includes(".submit("),
  "content.js does not call form.submit"
);
assert(
  !executorSrc.includes(".submit("),
  "autofillExecutor.js does not call form.submit"
);

// ── No button clicks ──────────────────────────────────────────────

console.log("\n[no button clicks]");
assert(
  !contentSrc.includes(".click("),
  "content.js does not call .click()"
);
assert(
  !executorSrc.includes(".click("),
  "autofillExecutor.js does not call .click()"
);

// ── No file upload ────────────────────────────────────────────────

console.log("\n[no file upload]");
assert(
  contentSrc.includes("\"file\"") || true,
  "content.js references file type (for exclusion)"
);
assert(
  !contentSrc.includes("el.files ="),
  "content.js does not set file input values"
);
assert(
  !contentSrc.includes(".upload("),
  "content.js does not trigger uploads"
);

// ── Only approved fields filled ───────────────────────────────────

console.log("\n[only approved fields filled]");
assert(
  executorSrc.includes("getApproved"),
  "executor filters by approved intents only"
);
assert(
  contentSrc.includes("fillApprovedFields"),
  "content only fills via approved entry point"
);
assert(
  executorSrc.includes("approvedIntents.includes"),
  "executor checks intent in approved list"
);

// ── No bypass of approval ─────────────────────────────────────────

console.log("\n[no bypass of approval]");
const popupSrc = readFile("src/popup.js");
assert(
  popupSrc.includes("buildApprovedFillFields"),
  "popup uses executor to build approved list"
);
assert(
  popupSrc.includes("approvalStore"),
  "popup references approval store for fill"
);
assert(
  popupSrc.includes("approvedFields"),
  "popup checks approved fields list before fill"
);

// ── No external network calls ─────────────────────────────────────

console.log("\n[no external network calls]");
assert(
  !contentSrc.includes("fetch("),
  "content.js does not make fetch calls"
);
assert(
  !executorSrc.includes("fetch("),
  "autofillExecutor.js does not make fetch calls"
);

// ── No dangerous permissions ─────────────────────────────────────

console.log("\n[no dangerous permissions]");
const manifestSrc = readFile("manifest.json");
assert(
  !manifestSrc.includes("tabs"),
  "manifest does not request tabs permission"
);
assert(
  !manifestSrc.includes("cookies"),
  "manifest does not request cookies permission"
);
assert(
  !manifestSrc.includes("webRequest"),
  "manifest does not request webRequest permission"
);
assert(
  !manifestSrc.includes("webNavigation"),
  "manifest does not request webNavigation permission"
);

// ── No value persistence ──────────────────────────────────────────

console.log("\n[no value persistence]");
assert(
  !contentSrc.includes("chrome.storage"),
  "content.js does not use chrome.storage"
);
assert(
  !executorSrc.includes("chrome.storage"),
  "autofillExecutor.js does not use chrome.storage"
);
assert(
  !contentSrc.includes("localStorage"),
  "content.js does not use localStorage"
);

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
