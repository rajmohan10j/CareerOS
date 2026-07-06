import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXTENSION_ROOT = resolve(__dirname, "..");

function readJSON(relativePath) {
  const full = resolve(EXTENSION_ROOT, relativePath);
  return JSON.parse(readFileSync(full, "utf-8"));
}

function readFile(relativePath) {
  const full = resolve(EXTENSION_ROOT, relativePath);
  return readFileSync(full, "utf-8");
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

// ── Manifest validation ──────────────────────────────────────────

console.log("\n[manifest.json]");

const manifest = readJSON("manifest.json");

assert(manifest.manifest_version === 3, "manifest_version is 3");
assert(typeof manifest.name === "string" && manifest.name.length > 0, "name is set");
assert(typeof manifest.version === "string" && manifest.version.length > 0, "version is set");
assert(typeof manifest.description === "string", "description is set");

assert(
  manifest.permissions &&
    Array.isArray(manifest.permissions) &&
    manifest.permissions.includes("storage"),
  'permissions includes "storage"'
);
assert(
  manifest.permissions.includes("activeTab"),
  'permissions includes "activeTab" for user-initiated page access'
);
assert(
  manifest.permissions.includes("scripting"),
  'permissions includes "scripting" for content-script recovery'
);

assert(
  !manifest.permissions.includes("tabs"),
  'permissions does NOT include "tabs"'
);
assert(
  !manifest.permissions.includes("history"),
  'permissions does NOT include "history"'
);
assert(
  !manifest.permissions.includes("cookies"),
  'permissions does NOT include "cookies"'
);
assert(
  !manifest.permissions.includes("webRequest"),
  'permissions does NOT include "webRequest"'
);
assert(
  !manifest.permissions.includes("webNavigation"),
  'permissions does NOT include "webNavigation"'
);

assert(
  manifest.host_permissions &&
    manifest.host_permissions.length === 2 &&
    manifest.host_permissions.includes("http://127.0.0.1:8000/*") &&
    manifest.host_permissions.includes("http://localhost:8000/*"),
  "host_permissions are limited to local backend origins"
);

assert(
  manifest.action && manifest.action.default_popup === "src/popup.html",
  'action.default_popup is "src/popup.html"'
);

assert(
  manifest.background &&
    manifest.background.service_worker === "src/background.js",
  'background.service_worker is "src/background.js"'
);

assert(
  manifest.content_scripts &&
    manifest.content_scripts.length === 1,
  "has exactly 1 content script entry"
);

// ── File structure validation ────────────────────────────────────

console.log("\n[file structure]");

const expectedFiles = [
  "manifest.json",
  "src/background.js",
  "src/content.js",
  "src/fieldDetector.js",
  "src/fieldClassifier.js",
  "src/popup.html",
  "src/popup.js",
  "src/options.html",
  "src/options.js",
  "src/apiClient.js",
  "src/profileClient.js",
  "src/staticAnswers.js",
  "src/autofillMapper.js",
  "src/approvalState.js",
  "src/mappingPreview.js",
  "src/autofillExecutor.js",
  "styles/popup.css",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "tests/extension.test.js",
  "tests/fieldDetector.test.js",
  "tests/fieldClassifier.test.js",
  "tests/profileClient.test.js",
  "tests/autofillMapper.test.js",
  "tests/approvalState.test.js",
  "tests/mappingPreview.test.js",
  "tests/autofillExecutor.test.js",
  "tests/controlledFill.test.js",
  "tests/safetyGuards.test.js",
];

for (const f of expectedFiles) {
  assert(fileExists(f), `file exists: ${f}`);
}

// ── Source content validation ─────────────────────────────────────

console.log("\n[source validation]");

const background = readFile("src/background.js");
assert(
  background.includes("CHECK_HEALTH"),
  "background.js handles CHECK_HEALTH message"
);
assert(
  background.includes("DETECT_FIELDS"),
  "background.js handles DETECT_FIELDS message"
);
assert(
  background.includes("FILL_FIELDS"),
  "background.js handles FILL_FIELDS message"
);
assert(
  background.includes("tabs.sendMessage"),
  "background.js forwards to content script"
);
assert(
  background.includes("scripting.executeScript"),
  "background.js injects content script when page listener is missing"
);
assert(
  background.includes("CareerOS could not connect to this page yet"),
  "background.js returns actionable content-script recovery errors"
);
assert(
  background.includes("http://127.0.0.1:8000"),
  "background.js references 127.0.0.1:8000"
);
assert(
  !background.includes("apiKey") && !background.includes("api_key"),
  "background.js does not contain API keys"
);

const content = readFile("src/content.js");
assert(
  content.includes("PING"),
  "content.js handles PING message"
);
assert(
  content.includes("GET_PAGE_INFO"),
  "content.js handles GET_PAGE_INFO message"
);
assert(
  content.includes("DETECT_FIELDS"),
  "content.js handles DETECT_FIELDS message"
);
assert(
  content.includes("detectFields"),
  "content.js imports detectFields"
);
assert(
  content.includes("classifyFields"),
  "content.js imports classifyFields"
);
assert(
  content.includes("FILL_FIELDS"),
  "content.js handles FILL_FIELDS message"
);
assert(
  content.includes("fillApprovedFields"),
  "content.js defines fillApprovedFields"
);
assert(
  content.includes("isFillableElement"),
  "content.js has isFillableElement safety check"
);
assert(
  content.includes("findFieldElement"),
  "content.js has findFieldElement"
);
assert(
  content.includes("fillElement"),
  "content.js has fillElement"
);
assert(
  content.includes("highlightFilled"),
  "content.js has highlightFilled"
);
assert(
  content.includes("dispatchEvent"),
  "content.js dispatches input/change events"
);
assert(
  !content.includes(".submit("),
  "content.js does not call form.submit"
);
assert(
  !content.includes(".click("),
  "content.js does not click elements"
);

const popupHTML = readFile("src/popup.html");
assert(
  popupHTML.includes("backendStatus"),
  "popup.html has backendStatus element"
);
assert(
  popupHTML.includes("detectFieldsBtn"),
  "popup.html has detect fields button"
);
assert(
  popupHTML.includes("fieldCount"),
  "popup.html has field count element"
);
assert(
  popupHTML.includes("debugContent"),
  "popup.html has debug content area"
);
assert(
  popupHTML.includes("mappingSection"),
  "popup.html has mapping section"
);
assert(
  popupHTML.includes("mapFieldsBtn"),
  "popup.html has map fields button"
);
assert(
  popupHTML.includes("mappingSummary"),
  "popup.html has mapping summary area"
);
assert(
  popupHTML.includes("mappingContent"),
  "popup.html has mapping content area"
);
assert(
  popupHTML.includes("approvalSection"),
  "popup.html has approval section"
);
assert(
  popupHTML.includes("selectAllSafeBtn"),
  "popup.html has select all safe button"
);
assert(
  popupHTML.includes("selectStaticAnswersBtn"),
  "popup.html has select static answers button"
);
assert(
  popupHTML.includes("copyStaticAnswersBtn"),
  "popup.html has copy answer bank button"
);
assert(
  popupHTML.includes("resetApprovalsBtn"),
  "popup.html has reset approvals button"
);
assert(
  popupHTML.includes("approvalSummary"),
  "popup.html has approval summary area"
);
assert(
  popupHTML.includes("previewContent"),
  "popup.html has preview content area"
);
assert(
  popupHTML.includes("fillFieldsBtn"),
  "popup.html has fill approved fields button"
);
assert(
  popupHTML.includes("fillResult"),
  "popup.html has fill result area"
);

const popupJS = readFile("src/popup.js");
assert(
  popupJS.includes("checkHealth"),
  "popup.js imports and calls checkHealth"
);
assert(
  popupJS.includes("DETECT_FIELDS"),
  "popup.js sends DETECT_FIELDS message"
);
assert(
  popupJS.includes("renderDebugTable"),
  "popup.js has renderDebugTable function"
);
assert(
  popupJS.includes("fieldCount"),
  "popup.js displays field count"
);
assert(
  popupJS.includes("fetchAllProfileData"),
  "popup.js imports fetchAllProfileData"
);
assert(
  popupJS.includes("mapFields"),
  "popup.js imports mapFields"
);
assert(
  popupJS.includes("summarizeMappings"),
  "popup.js imports summarizeMappings"
);
assert(
  popupJS.includes("mappingSection"),
  "popup.js references mappingSection"
);
assert(
  popupJS.includes("mapFieldsBtn"),
  "popup.js references map fields button"
);
assert(
  popupJS.includes("renderMappingSummary"),
  "popup.js has renderMappingSummary function"
);
assert(
  popupJS.includes("renderMappingTable"),
  "popup.js has renderMappingTable function"
);
assert(
  popupJS.includes("createApprovalStore"),
  "popup.js imports createApprovalStore"
);
assert(
  popupJS.includes("buildPreviewContainerHTML"),
  "popup.js imports buildPreviewContainerHTML"
);
assert(
  popupJS.includes("buildApprovalSummaryHTML"),
  "popup.js imports buildApprovalSummaryHTML"
);
assert(
  popupJS.includes("renderApprovalUI"),
  "popup.js has renderApprovalUI function"
);
assert(
  popupJS.includes("renderApprovalSummary"),
  "popup.js has renderApprovalSummary function"
);
assert(
  popupJS.includes("selectAllSafeBtn"),
  "popup.js references selectAllSafeBtn"
);
assert(
  popupJS.includes("resetApprovalsBtn"),
  "popup.js references resetApprovalsBtn"
);
assert(
  popupJS.includes("selectAllSafe"),
  "popup.js calls approvalStore.selectAllSafe"
);
assert(
  popupJS.includes("selectStaticAnswers"),
  "popup.js supports selecting static answers"
);
assert(
  popupJS.includes("buildQuickCopyText"),
  "popup.js supports quick copy answer bank"
);
assert(
  popupJS.includes("approvalStore.reset"),
  "popup.js calls approvalStore.reset"
);
assert(
  popupJS.includes("buildApprovedFillFields"),
  "popup.js imports buildApprovedFillFields"
);
assert(
  popupJS.includes("executeFill"),
  "popup.js imports executeFill"
);
assert(
  popupJS.includes("fillFieldsBtn"),
  "popup.js references fill button"
);
assert(
  popupJS.includes("renderFillResult"),
  "popup.js has renderFillResult function"
);
assert(
  popupJS.includes("updateFillButton"),
  "popup.js has updateFillButton function"
);
assert(
  popupJS.includes("fillBtn.disabled"),
  "popup.js controls fill button enabled state"
);
assert(
  popupJS.includes("fillResultEl"),
  "popup.js references fill result element"
);

const apiClient = readFile("src/apiClient.js");
assert(
  apiClient.includes("checkHealth"),
  "apiClient.js exports checkHealth function"
);
assert(
  apiClient.includes("DEFAULT_BACKEND_URL"),
  "apiClient.js has DEFAULT_BACKEND_URL"
);
assert(
  apiClient.includes("http://127.0.0.1:8000"),
  "apiClient.js defaults to 127.0.0.1:8000"
);
assert(
  !apiClient.includes("apiKey") && !apiClient.includes("api_key") && !apiClient.includes("secret"),
  "apiClient.js does not contain secrets"
);

const popupCSS = readFile("styles/popup.css");
assert(popupCSS.length > 0, "popup.css is not empty");
assert(popupCSS.includes("fill-btn"), "popup.css has fill button styles");
assert(popupCSS.includes("fill-result"), "popup.css has fill result styles");
assert(popupCSS.includes("fill-stats"), "popup.css has fill stats styles");
assert(popupCSS.includes("low-conf-badge"), "popup.css has low confidence badge styles");
assert(popupCSS.includes("sensitive-warning"), "popup.css has sensitive warning styles");
assert(popupCSS.includes("success-detail"), "popup.css has success message styles");

const optionsJS = readFile("src/options.js");
assert(
  optionsJS.includes("checkHealth"),
  "options.js uses checkHealth"
);
assert(
  optionsJS.includes("checkHealth(currentUrl)"),
  "options.js tests the typed backend URL"
);
assert(
  optionsJS.includes("getStoredBackendUrl"),
  "options.js uses getStoredBackendUrl"
);
assert(
  optionsJS.includes("testBtn"),
  "options.js has test connection button handler"
);
assert(
  optionsJS.includes("saveBtn"),
  "options.js has save button handler"
);
assert(
  !optionsJS.includes("apiKey") && !optionsJS.includes("api_key") && !optionsJS.includes("secret"),
  "options.js does not contain secrets"
);

const detector = readFile("src/fieldDetector.js");
assert(
  detector.includes("querySelectorAll"),
  "fieldDetector.js uses querySelectorAll"
);
assert(
  detector.includes("findLabel"),
  "fieldDetector.js has findLabel function"
);
assert(
  !detector.includes(".value ="),
  "fieldDetector.js does not assign values"
);
assert(
  !detector.includes(".submit("),
  "fieldDetector.js does not submit forms"
);

const classifier = readFile("src/fieldClassifier.js");
assert(
  classifier.includes("SENSITIVE_TYPES"),
  "fieldClassifier.js defines SENSITIVE_TYPES"
);
assert(
  classifier.includes('"diversity"'),
  "fieldClassifier.js includes diversity in sensitive types"
);
assert(
  classifier.includes('"equal_opportunity"'),
  "fieldClassifier.js includes equal_opportunity in sensitive types"
);
assert(
  classifier.includes("sensitive"),
  "fieldClassifier.js marks sensitive fields"
);
assert(
  !classifier.includes(".value ="),
  "fieldClassifier.js does not assign values"
);

const profileClient = readFile("src/profileClient.js");
assert(
  profileClient.includes("fetchAllProfileData"),
  "profileClient.js exports fetchAllProfileData"
);
assert(
  profileClient.includes("normalizeProfile"),
  "profileClient.js exports normalizeProfile"
);
assert(
  profileClient.includes("parseJsonField"),
  "profileClient.js has parseJsonField"
);
assert(
  profileClient.includes("AbortController"),
  "profileClient.js uses AbortController"
);
assert(
  !profileClient.includes("apiKey") && !profileClient.includes("api_key"),
  "profileClient.js does not contain secrets"
);

const autofillMapper = readFile("src/autofillMapper.js");
assert(
  autofillMapper.includes("mapFields"),
  "autofillMapper.js exports mapFields"
);
assert(
  autofillMapper.includes("mapIntentToValue"),
  "autofillMapper.js exports mapIntentToValue"
);
assert(
  autofillMapper.includes("summarizeMappings"),
  "autofillMapper.js exports summarizeMappings"
);
assert(
  autofillMapper.includes("SENSITIVE_TYPES"),
  "autofillMapper.js defines SENSITIVE_TYPES"
);
assert(
  autofillMapper.includes('"diversity"'),
  "autofillMapper.js includes diversity in SENSITIVE_TYPES"
);
assert(
  autofillMapper.includes('"equal_opportunity"'),
  "autofillMapper.js includes equal_opportunity in SENSITIVE_TYPES"
);
assert(
  autofillMapper.includes("getLatestExperience"),
  "autofillMapper.js has getLatestExperience"
);
assert(
  autofillMapper.includes("deriveFirstLastFromSummary"),
  "autofillMapper.js has deriveFirstLastFromSummary"
);
assert(
  !autofillMapper.includes(".value ="),
  "autofillMapper.js does not assign values"
);
assert(
  !autofillMapper.includes("fetch("),
  "autofillMapper.js does not make network calls"
);

const approvalState = readFile("src/approvalState.js");
assert(
  approvalState.includes("createApprovalStore"),
  "approvalState.js exports createApprovalStore"
);
assert(
  approvalState.includes("selectAllSafe"),
  "approvalState.js has selectAllSafe"
);
assert(
  approvalState.includes("remove"),
  "approvalState.js has remove method"
);
assert(
  approvalState.includes("clear"),
  "approvalState.js has clear method"
);
assert(
  approvalState.includes("getSummary"),
  "approvalState.js has getSummary"
);
assert(
  approvalState.includes("Map()"),
  "approvalState.js uses Map for state"
);
assert(
  !approvalState.includes("chrome.storage"),
  "approvalState.js does not use chrome.storage"
);
assert(
  !approvalState.includes(".value ="),
  "approvalState.js does not assign values"
);

const mappingPreview = readFile("src/mappingPreview.js");
assert(
  mappingPreview.includes("buildPreviewItem"),
  "mappingPreview.js exports buildPreviewItem"
);
assert(
  mappingPreview.includes("buildPreviewContainerHTML"),
  "mappingPreview.js exports buildPreviewContainerHTML"
);
assert(
  mappingPreview.includes("buildApprovalSummaryHTML"),
  "mappingPreview.js exports buildApprovalSummaryHTML"
);
assert(
  mappingPreview.includes("preview-row"),
  "mappingPreview.js renders preview rows"
);
assert(
  mappingPreview.includes("preview-actions"),
  "mappingPreview.js renders action toggles"
);
assert(
  mappingPreview.includes("review before approving"),
  "mappingPreview.js warns before sensitive field approve"
);
assert(
  mappingPreview.includes("low-conf-badge"),
  "mappingPreview.js has low confidence badge"
);
assert(
  mappingPreview.includes("sensitive-warning"),
  "mappingPreview.js has sensitive field warning"
);
assert(
  mappingPreview.includes("Math.round(preview.confidence * 100"),
  "mappingPreview.js shows confidence as percentage"
);
assert(
  !mappingPreview.includes(".value ="),
  "mappingPreview.js does not assign values"
);
assert(
  !mappingPreview.includes(".submit("),
  "mappingPreview.js does not submit forms"
);

const autofillExecutor = readFile("src/autofillExecutor.js");
assert(
  autofillExecutor.includes("buildApprovedFillFields"),
  "autofillExecutor.js exports buildApprovedFillFields"
);
assert(
  autofillExecutor.includes("executeFill"),
  "autofillExecutor.js exports executeFill"
);
assert(
  autofillExecutor.includes("FILL_FIELDS"),
  "autofillExecutor.js sends FILL_FIELDS message"
);
assert(
  autofillExecutor.includes("approvedIntents.includes"),
  "autofillExecutor.js filters by approved intents"
);
assert(
  autofillExecutor.includes("mappedValue != null"),
  "autofillExecutor.js filters non-null values"
);
assert(
  autofillExecutor.includes("\"file\""),
  "autofillExecutor.js excludes file inputs"
);
assert(
  !autofillExecutor.includes(".value ="),
  "autofillExecutor.js does not assign values"
);
assert(
  !autofillExecutor.includes(".submit("),
  "autofillExecutor.js does not submit forms"
);
assert(
  !autofillExecutor.includes("chrome.storage"),
  "autofillExecutor.js does not use chrome.storage"
);

const staticAnswers = readFile("src/staticAnswers.js");
assert(
  staticAnswers.includes("STATIC_AUTOFILL_INTENTS"),
  "staticAnswers.js defines static autofill intents"
);
assert(
  staticAnswers.includes("selectStaticAnswers"),
  "staticAnswers.js exports selectStaticAnswers"
);
assert(
  staticAnswers.includes("buildQuickCopyText"),
  "staticAnswers.js exports buildQuickCopyText"
);
assert(
  staticAnswers.includes("STATIC_AUTOFILL_INTENTS"),
  "staticAnswers.js limits auto-select to explicit static intents"
);
assert(
  !staticAnswers.includes(".submit(") && !staticAnswers.includes(".click("),
  "staticAnswers.js does not submit or click forms"
);

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
