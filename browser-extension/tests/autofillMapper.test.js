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
const src = readFile("src/autofillMapper.js");
assert(src.length > 0, "src/autofillMapper.js exists and is non-empty");

// ── Export validation ─────────────────────────────────────────────

console.log("\n[exports]");
const expectedExports = [
  "mapFields", "mapIntentToValue", "summarizeMappings",
  "getLatestExperience", "SENSITIVE_TYPES",
];
for (const exp of expectedExports) {
  assert(src.includes(exp), `autofillMapper.js exports ${exp}`);
}

// ── Intent handling ───────────────────────────────────────────────

console.log("\n[intent handling]");

const expectedIntents = [
  "full_name", "first_name", "last_name", "email", "phone",
  "address", "city", "state", "country", "postal_code",
  "current_company", "current_title", "education", "experience", "skills",
  "resume_upload", "cover_letter", "salary_expectation",
  "work_authorization", "notice_period",
];
for (const intent of expectedIntents) {
  assert(
    src.includes(`case "${intent}"`),
    `autofillMapper.js has intent case: "${intent}"`
  );
}

assert(src.includes("default:"), "autofillMapper.js has default case");

// ── Status values ─────────────────────────────────────────────────

console.log("\n[status values]");

const statusValues = ["available", "derived", "missing", "manual_review", "unknown"];
for (const s of statusValues) {
  assert(src.includes(`status: "${s}"`), `autofillMapper.js uses status: "${s}"`);
}

// ── Sensitive fields ──────────────────────────────────────────────

console.log("\n[sensitive fields]");

assert(src.includes("SENSITIVE_TYPES"), "autofillMapper.js defines SENSITIVE_TYPES");
const sensitiveTypes = ["phone", "address", "salary_expectation", "work_authorization"];
for (const t of sensitiveTypes) {
  assert(src.includes(t), `autofillMapper.js SENSITIVE_TYPES includes "${t}"`);
}
assert(src.includes("sensitive: true"), "autofillMapper.js marks sensitive fields");

// ── Derivation logic ──────────────────────────────────────────────

console.log("\n[derivation logic]");

assert(src.includes("deriveFirstLastFromSummary"), "autofillMapper.js has deriveFirstLastFromSummary");
assert(src.includes("getLatestExperience"), "autofillMapper.js has getLatestExperience");
assert(src.includes("start_date"), "getLatestExperience sorts by start_date");
assert(src.includes("localeCompare"), "getLatestExperience uses localeCompare for sorting");
assert(src.includes("split(/\\s+/"), "deriveFirstLastFromSummary splits summary by whitespace");
assert(src.includes("trimmed.length"), "deriveFirstLastFromSummary checks array length");

// ── Summarize ─────────────────────────────────────────────────────

console.log("\n[summarize]");

assert(src.includes("summarizeMappings"), "autofillMapper.js defines summarizeMappings");
assert(src.includes("mappingStatus"), "summarizeMappings checks mappingStatus");
assert(src.includes(".filter"), "summarizeMappings uses filter for counts");
assert(src.includes("filter((f) =>"), "summarizeMappings uses arrow function filter");
assert(src.includes("sensitive"), "summarizeMappings counts sensitive fields");

// ── Value assignment prohibition ──────────────────────────────────

console.log("\n[value assignment prohibition]");

assert(
  !src.includes(".value ="),
  "autofillMapper.js does not assign values"
);
assert(
  !src.includes(".submit("),
  "autofillMapper.js does not submit forms"
);
assert(
  !src.includes(".click("),
  "autofillMapper.js does not click elements"
);
assert(
  !src.includes("input.value"),
  "autofillMapper.js does not reference input.value"
);

// ── Profile data usage ────────────────────────────────────────────

console.log("\n[profile data usage]");

assert(src.includes("mapFields"), "autofillMapper.js defines mapFields");
assert(src.includes("profileData"), "mapFields takes profileData parameter");
assert(src.includes("profile?.summary"), "mapFields accesses profile summary");
assert(src.includes("profile?.locations"), "mapFields accesses profile locations");
assert(src.includes("profile?.salaryExpectations"), "mapFields accesses salary expectations");
assert(src.includes("skills.length"), "mapFields checks skills length");
assert(src.includes("experiences.length"), "mapFields checks experiences length");

// ── Security ──────────────────────────────────────────────────────

console.log("\n[security]");

assert(
  !src.includes("apiKey") && !src.includes("api_key") && !src.includes("secret"),
  "autofillMapper.js does not contain secrets"
);
assert(
  !src.includes("fetch("),
  "autofillMapper.js does not make network calls"
);

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
