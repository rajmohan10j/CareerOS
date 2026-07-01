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
  "index.html",
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
const hasStartScript = pkg.scripts && pkg.scripts.start;
assert(hasStartScript, 'package.json has start script');

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
assert(apiClient.includes("127.0.0.1:8000"), "apiClient.js defaults to 127.0.0.1:8000");
assert(apiClient.includes("isValidUrl"), "apiClient.js validates URLs");
assert(apiClient.includes("sanitizeUrl"), "apiClient.js sanitizes stored URLs");
assert(apiClient.includes("[object Promise]"), "apiClient.js filters out [object Promise]");
assert(apiClient.includes("normalizeUrl"), "apiClient.js normalizes URLs");
assert(apiClient.includes("str.trim()"), "apiClient.js trims whitespace");
assert(apiClient.includes("replace(/\\/+$/, \"\")") || apiClient.includes("replace(/\\\/+$/, '')"), "apiClient.js removes trailing slash");
assert(apiClient.includes("Ensure the backend is running"), "apiClient.js shows user-friendly next step");
assert(apiClient.includes('${url}'), "apiClient.js includes URL in error messages");
assert(
  !apiClient.includes("apiKey") && !apiClient.includes("api_key") && !apiClient.includes("secret"),
  "apiClient.js does not contain secrets"
);

// ── API client — new helpers ─────────────────────────────────────

console.log("\n[api client — new helpers]");

const apiHelpers = [
  "fetchProfile", "saveProfile",
  "fetchResumes", "createResume", "generateResume",
  "fetchJobs", "createJob", "evaluateJobText",
  "fetchApplications", "createApplication",
  "fetchDocuments", "createDocument",
  "fetchAiProviders", "fetchAiModels", "fetchAiHealth",
];
for (const h of apiHelpers) {
  assert(apiClient.includes(h), `apiClient.js exports ${h}`);
}

assert(apiClient.includes("/profile"), "apiClient.js calls /profile endpoint");
assert(apiClient.includes("/resumes"), "apiClient.js calls /resumes endpoint");
assert(apiClient.includes("/jobs"), "apiClient.js calls /jobs endpoint");
assert(apiClient.includes("/jobs/evaluate-text"), "apiClient.js calls /jobs/evaluate-text endpoint");
assert(apiClient.includes("/applications"), "apiClient.js calls /applications endpoint");
assert(apiClient.includes("/documents"), "apiClient.js calls /documents endpoint");
assert(apiClient.includes("/ai/providers"), "apiClient.js calls /ai/providers endpoint");
assert(apiClient.includes("/ai/models"), "apiClient.js calls /ai/models endpoint");
assert(apiClient.includes("/ai/health"), "apiClient.js calls /ai/health endpoint");

// ── Page validation — Profile, Resumes, Jobs, Applications, Documents, AIStatus ──

console.log("\n[page validation — live pages]");

const profilePage = readFile("src/pages/Profile.js");
assert(profilePage.includes("fetchProfile"), "Profile.js uses fetchProfile");
assert(profilePage.includes("saveProfile"), "Profile.js uses saveProfile");
assert(profilePage.includes("summary"), "Profile.js has summary field");
assert(profilePage.includes("target_roles"), "Profile.js has target_roles field");
assert(profilePage.includes("industries"), "Profile.js has industries field");
assert(profilePage.includes("locations"), "Profile.js has locations field");
assert(profilePage.includes("saveProfileBtn"), "Profile.js has save button");

const resumesPage = readFile("src/pages/Resumes.js");
assert(resumesPage.includes("fetchResumes"), "Resumes.js uses fetchResumes");
assert(resumesPage.includes("item-card"), "Resumes.js renders item cards");
assert(resumesPage.includes("No resumes yet"), "Resumes.js has empty state");

const jobsPage = readFile("src/pages/Jobs.js");
assert(jobsPage.includes("fetchJobs"), "Jobs.js uses fetchJobs");
assert(jobsPage.includes("createJob"), "Jobs.js uses createJob");
assert(jobsPage.includes("item-card"), "Jobs.js renders item cards");
assert(jobsPage.includes("No jobs tracked yet"), "Jobs.js has empty state");
assert(jobsPage.includes("showAddJobBtn"), "Jobs.js has add job button");

const applicationsPage = readFile("src/pages/Applications.js");
assert(applicationsPage.includes("fetchApplications"), "Applications.js uses fetchApplications");
assert(applicationsPage.includes("createApplication"), "Applications.js uses createApplication");
assert(applicationsPage.includes("item-card"), "Applications.js renders item cards");
assert(applicationsPage.includes("No applications yet"), "Applications.js has empty state");
assert(applicationsPage.includes("showAddAppBtn"), "Applications.js has add button");

const documentsPage = readFile("src/pages/Documents.js");
assert(documentsPage.includes("fetchDocuments"), "Documents.js uses fetchDocuments");
assert(documentsPage.includes("createDocument"), "Documents.js uses createDocument");
assert(documentsPage.includes("item-card"), "Documents.js renders item cards");
assert(documentsPage.includes("No documents yet"), "Documents.js has empty state");
assert(documentsPage.includes("showAddDocBtn"), "Documents.js has add button");

const aiStatusPage = readFile("src/pages/AIStatus.js");
assert(aiStatusPage.includes("fetchAiProviders"), "AIStatus.js uses fetchAiProviders");
assert(aiStatusPage.includes("fetchAiModels"), "AIStatus.js uses fetchAiModels");
assert(aiStatusPage.includes("fetchAiHealth"), "AIStatus.js uses fetchAiHealth");
assert(aiStatusPage.includes("checkHealth"), "AIStatus.js uses checkHealth");
assert(aiStatusPage.includes("AI Providers"), "AIStatus.js shows providers section");
assert(aiStatusPage.includes("AI Models"), "AIStatus.js shows models section");
assert(aiStatusPage.includes("AI Health"), "AIStatus.js shows health section");

const browserExtPage = readFile("src/pages/BrowserExtension.js");
assert(browserExtPage.includes("Setup Instructions"), "BrowserExtension.js has setup instructions");
assert(browserExtPage.includes("Supported Job Boards"), "BrowserExtension.js has supported boards");
assert(browserExtPage.includes("Backend Status"), "BrowserExtension.js has backend status section");
assert(browserExtPage.includes("export default"), "BrowserExtension.js has exports");

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
assert(settings.includes("const currentUrl = getStoredBackendUrl()"), "Settings gets URL synchronously (not awaited)");
assert(settings.includes('value="${currentUrl}"'), "Settings input receives a string value");

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
assert(dashboard.includes("dash-card-stat"), "Dashboard has stat cards");
assert(dashboard.includes("dash-card-health"), "Dashboard has health card");
assert(dashboard.includes("Profile"), "Dashboard shows Profile card");
assert(dashboard.includes("Resumes"), "Dashboard shows Resumes card");
assert(dashboard.includes("Jobs"), "Dashboard shows Jobs card");
assert(dashboard.includes("Applications"), "Dashboard shows Applications card");
assert(dashboard.includes("Documents"), "Dashboard shows Documents card");
assert(dashboard.includes("Backend Health"), "Dashboard shows Backend Health card");
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
