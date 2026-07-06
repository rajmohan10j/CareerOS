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
const src = readFile("src/mappingPreview.js");
assert(src.length > 0, "src/mappingPreview.js exists and is non-empty");

// ── Export validation ─────────────────────────────────────────────

console.log("\n[exports]");
const expectedExports = [
  "buildPreviewItem", "buildPreviewList",
  "buildItemHTML", "buildPreviewContainerHTML",
  "buildApprovalSummaryHTML", "escapeHtml",
];
for (const exp of expectedExports) {
  assert(src.includes(exp), `mappingPreview.js exports ${exp}`);
}

// ── Preview item logic ────────────────────────────────────────────

console.log("\n[preview item logic]");
assert(src.includes("buildPreviewItem"), "mappingPreview.js has buildPreviewItem");
assert(src.includes("mapping.intent"), "buildPreviewItem reads intent");
assert(src.includes("mapping.mappedValue"), "buildPreviewItem reads mappedValue");
assert(src.includes("mapping.mappingStatus"), "buildPreviewItem reads mappingStatus");
assert(src.includes("mapping.mappingConfidence"), "buildPreviewItem reads mappingConfidence");
assert(src.includes("mapping.sensitive"), "buildPreviewItem reads sensitive");
assert(src.includes("mapping.mappingMessage"), "buildPreviewItem reads mappingMessage");
assert(src.includes("isApproved"), "buildPreviewItem checks approvalStore.isApproved");
assert(src.includes("isRejected"), "buildPreviewItem checks approvalStore.isRejected");
assert(src.includes("isPending"), "buildPreviewItem checks approvalStore.isPending");

// ── Safe field detection ──────────────────────────────────────────

console.log("\n[safe field detection]");
assert(src.includes("!mapping.sensitive"), "safe excludes sensitive fields");
assert(src.includes("mappingConfidence >= 0.6"), "safe requires confidence >= 0.6");
assert(src.includes("mappingStatus === \"available\""), "safe requires available status");
assert(src.includes("mappingStatus === \"derived\""), "safe allows derived status");
assert(src.includes("safe"), "buildPreviewItem exposes safe flag");

// ── HTML generation ───────────────────────────────────────────────

console.log("\n[HTML generation]");
assert(src.includes("buildItemHTML"), "mappingPreview.js has buildItemHTML");
assert(src.includes("buildPreviewContainerHTML"), "mappingPreview.js has buildPreviewContainerHTML");
assert(src.includes("preview-row"), "buildItemHTML renders preview-row");
assert(src.includes("data-intent"), "buildItemHTML includes data-intent attribute");
assert(src.includes("preview-header"), "buildItemHTML renders header");
assert(src.includes("preview-intent"), "buildItemHTML renders intent label");
assert(src.includes("preview-value"), "buildItemHTML renders value");
assert(src.includes("preview-details"), "buildItemHTML renders details");
assert(src.includes("preview-actions"), "buildItemHTML renders actions");
assert(src.includes("preview-approve"), "buildItemHTML has approve radio");
assert(src.includes("preview-reject"), "buildItemHTML has reject radio");
assert(src.includes("preview-pending"), "buildItemHTML has pending radio");
assert(src.includes("approve"), "buildItemHTML has approve option");
assert(src.includes("reject"), "buildItemHTML has reject option");

// ── Summary HTML ──────────────────────────────────────────────────

console.log("\n[summary HTML]");
assert(src.includes("buildApprovalSummaryHTML"), "mappingPreview.js has buildApprovalSummaryHTML");
assert(src.includes("approval-summary"), "buildApprovalSummaryHTML renders summary wrapper");
assert(src.includes("approved"), "buildApprovalSummaryHTML shows approved count");
assert(src.includes("rejected"), "buildApprovalSummaryHTML shows rejected count");
assert(src.includes("pending"), "buildApprovalSummaryHTML shows pending count");
assert(src.includes("total"), "buildApprovalSummaryHTML shows total count");

// ── Sensitive field handling ──────────────────────────────────────

console.log("\n[sensitive field handling]");
assert(src.includes("preview-sensitive"), "sensitive rows get preview-sensitive class");
assert(src.includes("sensitive-tag"), "sensitive fields get a sensitive-tag");
assert(src.includes("review before approving"), "sensitive approve radio asks for review");
assert(!src.includes("toggle-disabled"), "sensitive radios are not globally disabled");

// ── Low confidence handling ───────────────────────────────────────

console.log("\n[low confidence handling]");
assert(src.includes("low-conf-badge"), "mappingPreview.js has low-conf-badge");
assert(src.includes("confidence < 0.6"), "mappingPreview.js checks low confidence");
assert(src.includes("low confidence"), "mappingPreview.js shows low confidence warning");

// ── Sensitive warning language ────────────────────────────────────

console.log("\n[sensitive warning]");
assert(src.includes("sensitive-warning"), "mappingPreview.js has sensitive warning section");
assert(src.includes("Review carefully before filling"), "sensitive warning asks for careful review");

// ── Confidence display ────────────────────────────────────────────

console.log("\n[confidence display]");
assert(src.includes("Math.round(preview.confidence * 100"), "mappingPreview.js formats confidence as percentage");
assert(src.includes("title="), "mappingPreview.js uses title attributes for tooltips");
assert(src.includes("Confidence score"), "mappingPreview.js explains confidence in tooltip");

// ── Empty state ───────────────────────────────────────────────────

console.log("\n[empty state]");
assert(src.includes("No mappings to preview"), "empty mappings shows message");

// ── Security ──────────────────────────────────────────────────────

console.log("\n[security]");
assert(
  !src.includes(".value ="),
  "mappingPreview.js does not assign values"
);
assert(
  !src.includes(".submit("),
  "mappingPreview.js does not submit forms"
);
assert(
  !src.includes("fetch("),
  "mappingPreview.js does not make network calls"
);
assert(
  !src.includes("chrome.storage"),
  "mappingPreview.js does not use chrome.storage"
);

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
