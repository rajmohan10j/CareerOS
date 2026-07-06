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
  "getLatestExperience", "getEducationForField", "getExperienceForField",
  "REFERENCE_EDUCATION", "REFERENCE_EXPERIENCES", "SENSITIVE_TYPES",
];
for (const exp of expectedExports) {
  assert(src.includes(exp), `autofillMapper.js exports ${exp}`);
}

// ── Intent handling ───────────────────────────────────────────────

console.log("\n[intent handling]");

const expectedIntents = [
  "name_prefix", "full_name", "first_name", "middle_name", "last_name", "email", "phone",
  "address", "city", "state", "country", "postal_code",
  "current_company", "current_title", "experience_title", "experience_company",
  "experience_location", "experience_current", "experience_start_date",
  "experience_end_date", "experience_description", "education_school",
  "education_degree", "education_field", "education_gpa", "education_start_date",
  "education_end_date", "education", "experience", "skills",
  "linkedin_url", "portfolio_url", "resume_upload", "cover_letter", "salary_expectation",
  "work_authorization", "legal_eligibility", "notice_period", "professional_category",
  "referral_source", "previous_employment", "declaration_confirmation",
  "terms_acknowledgement", "date_of_birth", "citizenship_status", "gender", "pronoun",
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
const sensitiveTypes = ["phone", "address", "salary_expectation", "work_authorization", "diversity", "equal_opportunity"];
for (const t of sensitiveTypes) {
  assert(src.includes(t), `autofillMapper.js SENSITIVE_TYPES includes "${t}"`);
}
assert(src.includes("sensitive: true"), "autofillMapper.js marks sensitive fields");

// ── Derivation logic ──────────────────────────────────────────────

console.log("\n[derivation logic]");

assert(src.includes("deriveFirstLastFromSummary"), "autofillMapper.js has deriveFirstLastFromSummary");
assert(src.includes("getPreference"), "autofillMapper.js reads profile preferences");
assert(src.includes("formatSalaryExpectation"), "autofillMapper.js formats salary expectations");
assert(src.includes("getLatestExperience"), "autofillMapper.js has getLatestExperience");
assert(src.includes("getExperienceForField"), "autofillMapper.js maps specific experience rows");
assert(src.includes("REFERENCE_EXPERIENCES"), "autofillMapper.js has reference resume fallback");
assert(src.includes("getEducationForField"), "autofillMapper.js maps specific education rows");
assert(src.includes("REFERENCE_EDUCATION"), "autofillMapper.js has reference education fallback");
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
assert(src.includes("full_name"), "mapFields can use profile full_name");
assert(src.includes("middle_name"), "mapFields can use profile middle_name");
assert(src.includes("contact_email"), "mapFields can use profile contact_email");
assert(src.includes("contact_phone"), "mapFields can use profile contact_phone");
assert(src.includes("linkedin_url"), "mapFields can use profile LinkedIn URL");
assert(src.includes("portfolio_url"), "mapFields can use profile portfolio URL");
assert(src.includes("work_authorization"), "mapFields can use profile work authorization");
assert(src.includes("legal_eligibility"), "mapFields can use profile legal eligibility");
assert(src.includes("referral_source"), "mapFields can use profile referral source");
assert(src.includes("previous_employment"), "mapFields can use profile previous employment");
assert(src.includes("date_of_birth"), "mapFields can use profile date of birth");
assert(src.includes("citizenship_status"), "mapFields can use profile citizenship status");
assert(src.includes("skills.length"), "mapFields checks skills length");
assert(src.includes("experiences.length"), "mapFields checks experiences length");
assert(src.includes("experience_title"), "mapFields can use resume experience title");
assert(src.includes("experience_company"), "mapFields can use resume experience company");
assert(src.includes("experience_description"), "mapFields can use resume experience description");
assert(src.includes("education_school"), "mapFields can use resume education school");
assert(src.includes("education_degree"), "mapFields can use resume education degree");
assert(src.includes("education_field"), "mapFields can use resume education field");

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
