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

console.log("\n[file references]");
const contentSrc = readFile("src/content.js");
const backgroundSrc = readFile("src/background.js");
const popupJSSrc = readFile("src/popup.js");
const popupHTMLSrc = readFile("src/popup.html");
const cssSrc = readFile("styles/popup.css");

// ── Content script: FILL_FIELDS handler ───────────────────────────

console.log("\n[content script: FILL_FIELDS handler]");
assert(contentSrc.includes("FILL_FIELDS"), "content.js handles FILL_FIELDS message");
assert(contentSrc.includes("fillApprovedFields"), "content.js defines fillApprovedFields");
assert(contentSrc.includes("sendResponse"), "content.js sends response for FILL_FIELDS");

// ── Content script: field finding ─────────────────────────────────

console.log("\n[content script: field finding]");
assert(contentSrc.includes("findFieldElement"), "content.js has findFieldElement");
assert(contentSrc.includes("getElementById"), "findFieldElement uses getElementById");
assert(contentSrc.includes("querySelector"), "findFieldElement uses querySelector");
assert(contentSrc.includes("field.id"), "findFieldElement checks id first");
assert(contentSrc.includes("field.name"), "findFieldElement checks name second");

// ── Content script: isFillableElement safety checks ────────────────

console.log("\n[content script: isFillableElement safety]");
assert(contentSrc.includes("isFillableElement"), "content.js has isFillableElement");
assert(contentSrc.includes("el.disabled"), "checks disabled");
assert(contentSrc.includes("el.readOnly"), "checks readOnly");
assert(contentSrc.includes("\"password\""), "rejects password fields");
assert(contentSrc.includes("\"hidden\""), "rejects hidden fields");
assert(contentSrc.includes("\"file\""), "rejects file inputs");
assert(contentSrc.includes("\"submit\""), "rejects submit buttons");
assert(contentSrc.includes("\"button\""), "rejects button type inputs");
assert(contentSrc.includes("\"radio\""), "rejects radio inputs");
assert(contentSrc.includes("\"checkbox\""), "rejects checkbox inputs");

// ── Content script: element fill logic ─────────────────────────────

console.log("\n[content script: element fill logic]");
assert(contentSrc.includes("fillElement"), "content.js has fillElement");
assert(contentSrc.includes("el.value = value"), "fillElement assigns value");
assert(contentSrc.includes("dispatchEvent"), "fillElement dispatches events");
assert(contentSrc.includes("\"input\""), "fillElement dispatches input event");
assert(contentSrc.includes("\"change\""), "fillElement dispatches change event");
assert(contentSrc.includes("bubbles: true"), "events bubble");
assert(contentSrc.includes("select"), "fillElement handles select elements");
assert(contentSrc.includes("Array.from(el.options)"), "fillElement checks select options");

// ── Content script: highlight ─────────────────────────────────────

console.log("\n[content script: highlight]");
assert(contentSrc.includes("highlightFilled"), "content.js has highlightFilled");
assert(contentSrc.includes("el.style.outline"), "highlight uses outline styling");
assert(contentSrc.includes("#2e7d32"), "highlight uses green outline");
assert(contentSrc.includes("setTimeout"), "highlight uses setTimeout for fade");

// ── Content script: result tracking ───────────────────────────────

console.log("\n[content script: result tracking]");
assert(contentSrc.includes("filled++"), "fillApprovedFields counts filled");
assert(contentSrc.includes("skipped++"), "fillApprovedFields counts skipped");
assert(contentSrc.includes("failed++"), "fillApprovedFields counts failed");
assert(contentSrc.includes("skippedNotFound"), "tracks not-found skips");
assert(contentSrc.includes("skippedUnfillable"), "tracks unfillable skips");

// ── Background script: FILL_FIELDS forwarding ─────────────────────

console.log("\n[background script: FILL_FIELDS forwarding]");
assert(backgroundSrc.includes("FILL_FIELDS"), "background.js handles FILL_FIELDS");
assert(backgroundSrc.includes("tabs.query"), "background.js queries active tab");
assert(backgroundSrc.includes("tabs.sendMessage"), "background.js forwards to content script");

// ── Popup: fill button ────────────────────────────────────────────

console.log("\n[popup: fill button]");
assert(popupJSSrc.includes("fillFieldsBtn"), "popup.js references fill button");
assert(popupJSSrc.includes("buildApprovedFillFields"), "popup.js imports buildApprovedFillFields");
assert(popupJSSrc.includes("executeFill"), "popup.js imports executeFill");
assert(popupJSSrc.includes("renderFillResult"), "popup.js has renderFillResult");
assert(popupJSSrc.includes("fillBtn.disabled"), "popup.js controls fill button disabled state");
assert(popupJSSrc.includes("approvedFields.length === 0"), "popup.js checks approved count");
assert(popupJSSrc.includes("fillResultEl"), "popup.js references fill result element");

// ── Popup HTML: fill elements ────────────────────────────────────

console.log("\n[popup HTML: fill elements]");
assert(popupHTMLSrc.includes("fillFieldsBtn"), "popup.html has fill button");
assert(popupHTMLSrc.includes("fillResult"), "popup.html has fill result area");

// ── Popup CSS: fill styles ────────────────────────────────────────

console.log("\n[popup CSS: fill styles]");
assert(cssSrc.includes("fill-btn"), "popup.css has fill-btn styles");
assert(cssSrc.includes("fill-result"), "popup.css has fill-result styles");
assert(cssSrc.includes("fill-stats"), "popup.css has fill-stats styles");
assert(cssSrc.includes("fill-stat"), "popup.css has fill-stat styles");
assert(cssSrc.includes("fill-details"), "popup.css has fill-details styles");
assert(cssSrc.includes("fill-error"), "popup.css has fill-error styles");

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
