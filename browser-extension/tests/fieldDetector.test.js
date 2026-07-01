import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXTENSION_ROOT = resolve(__dirname, "..");

function readFile(relativePath) {
  return readFileSync(resolve(EXTENSION_ROOT, relativePath), "utf-8");
}

function fileExists(relativePath) {
  return existsSync(resolve(EXTENSION_ROOT, relativePath));
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
assert(fileExists("src/fieldDetector.js"), "src/fieldDetector.js exists");
assert(fileExists("src/fieldClassifier.js"), "src/fieldClassifier.js exists");

// ── Export validation ─────────────────────────────────────────────

console.log("\n[exports]");

const detectorSrc = readFile("src/fieldDetector.js");
assert(detectorSrc.includes("detectFields"), "fieldDetector.js exports detectFields");

const classifierSrc = readFile("src/fieldClassifier.js");
assert(classifierSrc.includes("classifyFields"), "fieldClassifier.js exports classifyFields");

// ── Detector source structure validation ──────────────────────────

console.log("\n[detector source validation]");

assert(
  detectorSrc.includes("querySelectorAll"),
  "fieldDetector.js uses querySelectorAll"
);
assert(
  detectorSrc.includes("findLabel"),
  "fieldDetector.js has findLabel function"
);
assert(
  detectorSrc.includes("findSectionHeading"),
  "fieldDetector.js has findSectionHeading function"
);
assert(
  detectorSrc.includes("findNearbyText"),
  "fieldDetector.js has findNearbyText function"
);
assert(
  detectorSrc.includes("input:not"),
  "fieldDetector.js filters hidden/submit inputs"
);
assert(
  detectorSrc.includes("textarea"),
  "fieldDetector.js detects textarea"
);
assert(
  detectorSrc.includes("select"),
  "fieldDetector.js detects select"
);
assert(
  !detectorSrc.includes(".value ="),
  "fieldDetector.js does not assign values"
);
assert(
  !detectorSrc.includes(".submit("),
  "fieldDetector.js does not submit forms"
);
assert(
  !detectorSrc.includes("click("),
  "fieldDetector.js does not click elements"
);

// ── Classifier source structure validation ────────────────────────

console.log("\n[classifier source validation]");

const expectedIntents = [
  "full_name", "first_name", "last_name", "email", "phone",
  "address", "city", "state", "country", "postal_code",
  "current_company", "current_title", "education", "experience", "skills",
  "resume_upload", "cover_letter", "salary_expectation",
  "work_authorization", "notice_period", "unknown",
];
for (const intent of expectedIntents) {
  assert(
    classifierSrc.includes(intent),
    `fieldClassifier.js handles "${intent}" intent`
  );
}
assert(
  classifierSrc.includes("SENSITIVE_TYPES"),
  "fieldClassifier.js defines SENSITIVE_TYPES"
);
assert(
  classifierSrc.includes("sensitive"),
  "fieldClassifier.js marks sensitive fields"
);
assert(
  !classifierSrc.includes(".value ="),
  "fieldClassifier.js does not assign values"
);

// ── Content script integration ────────────────────────────────────

console.log("\n[content script integration]");

const contentSrc = readFile("src/content.js");
assert(
  contentSrc.includes("DETECT_FIELDS"),
  "content.js handles DETECT_FIELDS message"
);
assert(
  contentSrc.includes("detectFields"),
  "content.js imports detectFields"
);
assert(
  contentSrc.includes("classifyFields"),
  "content.js imports classifyFields"
);

// ── Popup integration ─────────────────────────────────────────────

console.log("\n[popup integration]");

const popupJSSrc = readFile("src/popup.js");
assert(
  popupJSSrc.includes("DETECT_FIELDS"),
  "popup.js sends DETECT_FIELDS message"
);
assert(
  popupJSSrc.includes("fieldCount"),
  "popup.js displays field count"
);
assert(
  popupJSSrc.includes("renderDebugTable"),
  "popup.js has renderDebugTable function"
);

const popupHTMLSrc = readFile("src/popup.html");
assert(
  popupHTMLSrc.includes("detectFieldsBtn"),
  "popup.html has detect button"
);
assert(
  popupHTMLSrc.includes("fieldCount"),
  "popup.html has field count element"
);
assert(
  popupHTMLSrc.includes("debugContent"),
  "popup.html has debug content area"
);

// ── Background integration ────────────────────────────────────────

console.log("\n[background integration]");

const backgroundSrc = readFile("src/background.js");
assert(
  backgroundSrc.includes("DETECT_FIELDS"),
  "background.js handles DETECT_FIELDS message"
);
assert(
  backgroundSrc.includes("tabs.sendMessage"),
  "background.js forwards to content script via tabs.sendMessage"
);

// ── Security assertions ───────────────────────────────────────────

console.log("\n[security]");

assert(
  !detectorSrc.includes("browsing"),
  "fieldDetector.js does not reference browsing"
);
assert(
  !classifierSrc.includes("browsing"),
  "fieldClassifier.js does not reference browsing"
);

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
