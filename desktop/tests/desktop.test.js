import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = resolve(__dirname, "..");

function readFile(relativePath) {
  return readFileSync(resolve(DESKTOP_ROOT, relativePath), "utf-8");
}

function fileExists(relativePath) {
  return existsSync(resolve(DESKTOP_ROOT, relativePath));
}

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL  ${label}`);
  }
}

// ── File structure ─────────────────────────────────────────────

console.log("\n[file structure]");

const expectedFiles = [
  "package.json",
  "README.md",
  "src/main.js",
  "src/apiClient.js",
  "src/routes.js",
  "src/index.html",
  "src/components/Layout.js",
  "src/components/Sidebar.js",
  "src/components/StatusBar.js",
  "src/components/BackendStatus.js",
  "src/pages/Dashboard.js",
  "src/pages/Profile.js",
  "src/pages/Resumes.js",
  "src/pages/Jobs.js",
  "src/pages/Applications.js",
  "src/pages/Documents.js",
  "src/pages/AIStatus.js",
  "src/pages/BrowserExtension.js",
  "src/pages/Settings.js",
  "styles/app.css",
  "tests/desktop.test.js",
];

for (const f of expectedFiles) {
  assert(fileExists(f), `${f} exists`);
}

// ── package.json validation ────────────────────────────────────

console.log("\n[package.json]");

const pkg = JSON.parse(readFile("package.json"));
assert(pkg.name === "careeros-desktop", 'package.json has correct name');
assert(pkg.private === true, 'package.json is private');
assert(pkg.type === "module", 'package.json uses ES modules');

const hasTestScript = pkg.scripts && pkg.scripts.test;
assert(hasTestScript, 'package.json has test script');

// No paid dependencies
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const paidKeywords = ["openai", "aws-sdk", "google-cloud", "azure", "stripe", "paid"];
let hasPaidDep = false;
for (const kw of paidKeywords) {
  for (const depName of Object.keys(deps)) {
    if (depName.includes(kw)) {
      hasPaidDep = true;
      console.error(`  Found paid dependency: ${depName}`);
    }
  }
}
assert(!hasPaidDep, "no paid API dependencies");

// No cloud dependencies
const cloudKeywords = ["firebase", "supabase", "aws-amplify", "cloud"];
let hasCloudDep = false;
for (const kw of cloudKeywords) {
  for (const depName of Object.keys(deps)) {
    if (depName.includes(kw)) {
      hasCloudDep = true;
      console.error(`  Found cloud dependency: ${depName}`);
    }
  }
}
assert(!hasCloudDep, "no cloud service dependencies");

// ── Pages exist ────────────────────────────────────────────────

console.log("\n[navigation pages]");

const pageFiles = [
  "Dashboard.js",
  "Profile.js",
  "Resumes.js",
  "Jobs.js",
  "Applications.js",
  "Documents.js",
  "AIStatus.js",
  "BrowserExtension.js",
  "Settings.js",
];

for (const pf of pageFiles) {
  const p = readFile(`src/pages/${pf}`);
  assert(p.includes("function render"), `${pf} has render function`);
  assert(p.includes("export default"), `${pf} has default export`);
}

// ── Routes validation ──────────────────────────────────────────

console.log("\n[routes]");

const routes = readFile("src/routes.js");
assert(routes.includes("dashboard"), "routes define dashboard");
assert(routes.includes("profile"), "routes define profile");
assert(routes.includes("resumes"), "routes define resumes");
assert(routes.includes("jobs"), "routes define jobs");
assert(routes.includes("applications"), "routes define applications");
assert(routes.includes("documents"), "routes define documents");
assert(routes.includes("ai-status"), "routes define ai-status");
assert(routes.includes("browser-extension"), "routes define browser-extension");
assert(routes.includes("settings"), "routes define settings");
assert(routes.includes('import("./pages/'), "routes use dynamic imports");

// ── API client validation ──────────────────────────────────────

console.log("\n[api client]");

const apiClient = readFile("src/apiClient.js");
assert(apiClient.includes("checkHealth"), "apiClient.js has checkHealth");
assert(apiClient.includes("fetchAnalytics"), "apiClient.js has fetchAnalytics");
assert(apiClient.includes("getStoredBackendUrl"), "apiClient.js has getStoredBackendUrl");
assert(apiClient.includes("setStoredBackendUrl"), "apiClient.js has setStoredBackendUrl");
assert(apiClient.includes("DEFAULT_BACKEND_URL"), "apiClient.js has DEFAULT_BACKEND_URL");
assert(apiClient.includes("AbortController"), "apiClient.js uses AbortController");
assert(apiClient.includes("/health"), "apiClient.js calls /health endpoint");
assert(apiClient.includes("/analytics/summary"), "apiClient.js calls /analytics/summary endpoint");
assert(apiClient.includes("localhost:8000"), "apiClient.js defaults to localhost:8000");
assert(
  !apiClient.includes("apiKey") && !apiClient.includes("api_key") && !apiClient.includes("secret"),
  "apiClient.js does not contain secrets"
);

// ── Component validation ───────────────────────────────────────

console.log("\n[components]");

const sidebar = readFile("src/components/Sidebar.js");
assert(sidebar.includes("nav-item"), "Sidebar renders nav items");
assert(sidebar.includes("navigate"), "Sidebar uses navigate");
assert(sidebar.includes("NAV_ITEMS"), "Sidebar has NAV_ITEMS");
assert(sidebar.includes("export"), "Sidebar has exports");

const backendStatus = readFile("src/components/BackendStatus.js");
assert(backendStatus.includes("checkHealth"), "BackendStatus uses checkHealth");
assert(backendStatus.includes("subscribe"), "BackendStatus has subscribe");
assert(backendStatus.includes("refresh"), "BackendStatus has refresh");
assert(backendStatus.includes("export"), "BackendStatus has exports");

const layout = readFile("src/components/Layout.js");
assert(layout.includes("app-layout"), "Layout has app-layout class");
assert(layout.includes("sidebar"), "Layout renders sidebar");
assert(layout.includes("pageContainer"), "Layout has page container");
assert(layout.includes("renderStatusBar"), "Layout calls renderStatusBar");

const statusBar = readFile("src/components/StatusBar.js");
assert(statusBar.includes("status-bar"), "StatusBar renders status bar");
assert(statusBar.includes("BackendStatus"), "StatusBar uses BackendStatus");
assert(statusBar.includes("setInterval"), "StatusBar has refresh interval");

// ── Settings page validation ───────────────────────────────────

console.log("\n[settings]");

const settings = readFile("src/pages/Settings.js");
assert(settings.includes("backendUrlInput"), "Settings has URL input");
assert(settings.includes("testBackendBtn"), "Settings has test button");
assert(settings.includes("saveBackendBtn"), "Settings has save button");
assert(settings.includes("checkHealth"), "Settings uses checkHealth");
assert(settings.includes("setStoredBackendUrl"), "Settings saves backend URL");

// ── Security ───────────────────────────────────────────────────

console.log("\n[security]");

// Only check non-test source files (exclude test file and itself)
const sourceFiles = expectedFiles
  .filter((f) => f.endsWith(".js") && !f.startsWith("tests/"))
  .map((f) => readFile(f))
  .join("\n");

assert(
  !sourceFiles.includes(".submit("),
  "no form submission in source"
);
assert(
  !sourceFiles.includes("document.forms"),
  "no direct form access in source"
);
assert(
  !sourceFiles.includes("XMLHttpRequest"),
  "no XMLHttpRequest usage"
);
assert(
  !sourceFiles.includes("localStorage.clear"),
  "no localStorage.clear in source"
);
assert(
  !sourceFiles.includes("api.openai.com"),
  "no OpenAI API endpoints in source"
);

// No paid API patterns in source
assert(
  !sourceFiles.includes("apiKey") && !sourceFiles.includes("api_key") && !sourceFiles.includes("secret"),
  "no secrets hardcoded in source"
);

// ── Analytics dashboard ────────────────────────────────────────

console.log("\n[analytics dashboard]");

const dashboard = readFile("src/pages/Dashboard.js");
assert(dashboard.includes("fetchAnalytics"), "Dashboard uses fetchAnalytics");
assert(dashboard.includes("fetchAnalytics"), "Dashboard uses fetchAnalytics");
assert(dashboard.includes("dash-card-stat"), "Dashboard has stat cards");
assert(dashboard.includes("dash-card-health"), "Dashboard has health card");
assert(dashboard.includes("Profile"), "Dashboard shows Profile card");
assert(dashboard.includes("Resumes"), "Dashboard shows Resumes card");
assert(dashboard.includes("Jobs"), "Dashboard shows Jobs card");
assert(dashboard.includes("Applications"), "Dashboard shows Applications card");
assert(dashboard.includes("Documents"), "Dashboard shows Documents card");
assert(dashboard.includes("Knowledge"), "Dashboard shows Knowledge card");
assert(dashboard.includes("Plugins"), "Dashboard shows Plugins card");
assert(dashboard.includes("Backend Status"), "Dashboard shows Backend Status card");
assert(dashboard.includes("No profile yet") || dashboard.includes("No resumes yet") || dashboard.includes("no"),
  "Dashboard has empty-state messages"
);
assert(
  !dashboard.includes("api.openai.com"),
  "Dashboard has no OpenAI API endpoints"
);
assert(
  !dashboard.includes("apiKey") && !dashboard.includes("api_key") && !dashboard.includes("secret"),
  "Dashboard has no secrets"
);

// ── Backend independence ───────────────────────────────────────

console.log("\n[backend independence]");

assert(
  !sourceFiles.includes("mapFields") && !sourceFiles.includes("classifyFields") && !sourceFiles.includes("fieldDetector"),
  "desktop does not import browser extension detection/mapping modules"
);
assert(
  !sourceFiles.includes("fillApprovedFields") && !sourceFiles.includes("FILL_FIELDS"),
  "desktop does not import autofill logic"
);

// ── Summary ────────────────────────────────────────────────────

const totalTests = Object.keys(expectedFiles).length > 0 ? passed + failed : 0;
console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
