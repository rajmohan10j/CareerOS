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
const src = readFile("src/profileClient.js");
assert(src.length > 0, "src/profileClient.js exists and is non-empty");

// ── Export validation ─────────────────────────────────────────────

console.log("\n[exports]");
assert(src.includes("export"), "profileClient.js has exports");
assert(src.includes("fetchProfile"), "profileClient.js exports fetchProfile");
assert(src.includes("fetchSkills"), "profileClient.js exports fetchSkills");
assert(src.includes("fetchExperiences"), "profileClient.js exports fetchExperiences");
assert(src.includes("fetchAllProfileData"), "profileClient.js exports fetchAllProfileData");
assert(src.includes("normalizeProfile"), "profileClient.js exports normalizeProfile");

// ── Source validation ─────────────────────────────────────────────

console.log("\n[source validation]");
assert(src.includes("fetch("), "profileClient.js makes fetch calls");
assert(src.includes("AbortController"), "profileClient.js uses AbortController timing");
assert(src.includes("Promise.all"), "profileClient.js uses Promise.all for parallel fetch");
assert(src.includes("getStoredBackendUrl"), "profileClient.js imports apiClient from getStoredBackendUrl");
assert(src.includes("/profile"), "profileClient.js fetches /profile");
assert(src.includes("/skills"), "profileClient.js fetches /skills");
assert(src.includes("/experiences"), "profileClient.js fetches /experiences");

// ── normalizeProfile validation ───────────────────────────────────

console.log("\n[normalizeProfile validation]");
assert(src.includes("normalizeProfile"), "profileClient.js defines normalizeProfile");
assert(src.includes("parseJsonField"), "profileClient.js defines parseJsonField");
assert(src.includes("locations"), "normalizeProfile handles locations");
assert(src.includes("target_roles"), "normalizeProfile handles target_roles");
assert(src.includes("salary_expectations"), "normalizeProfile handles salary_expectations");
assert(src.includes("JSON.parse"), "parseJsonField uses JSON.parse for string fields");
assert(src.includes("typeof value === \"object\""), "parseJsonField checks for object type");

// ── Security ──────────────────────────────────────────────────────

console.log("\n[security]");
assert(
  !src.includes("apiKey") && !src.includes("api_key") && !src.includes("secret"),
  "profileClient.js does not contain secrets"
);
assert(
  !src.includes("localStorage"),
  "profileClient.js does not use localStorage"
);

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
