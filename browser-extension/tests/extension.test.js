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
    manifest.host_permissions.length === 1 &&
    manifest.host_permissions[0] === "http://localhost:8000/*",
  'host_permissions is only "http://localhost:8000/*"'
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
  "styles/popup.css",
  "icons/icon16.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "tests/extension.test.js",
  "tests/fieldDetector.test.js",
  "tests/fieldClassifier.test.js",
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
  background.includes("tabs.sendMessage"),
  "background.js forwards to content script"
);
assert(
  background.includes("http://localhost:8000"),
  "background.js references localhost:8000"
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
  !apiClient.includes("apiKey") && !apiClient.includes("api_key") && !apiClient.includes("secret"),
  "apiClient.js does not contain secrets"
);

const popupCSS = readFile("styles/popup.css");
assert(popupCSS.length > 0, "popup.css is not empty");

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
  classifier.includes("sensitive"),
  "fieldClassifier.js marks sensitive fields"
);
assert(
  !classifier.includes(".value ="),
  "fieldClassifier.js does not assign values"
);

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
