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

// ── Source code analysis ──────────────────────────────────────────

const classifierSrc = readFile("src/fieldClassifier.js");
const detectorSrc = readFile("src/fieldDetector.js");

// ── Pattern validation ────────────────────────────────────────────

console.log("\n[pattern coverage]");

const typePatterns = [
  { type: "full_name", patterns: ["full\\\\s*\\\\*name", "legal\\\\s*\\\\*name", "your\\\\s*\\\\*name", "applicant\\\\s*\\\\*name"] },
  { type: "first_name", patterns: ["first\\\\s*\\\\*name", "given\\\\s*\\\\*name", "first"] },
  { type: "last_name", patterns: ["last\\\\s*\\\\*name", "family\\\\s*\\\\*name", "surname"] },
  { type: "email", patterns: ["e[\\\\s-]?mail", "email address", "\\\\bemail\\\\b"] },
  { type: "phone", patterns: ["phone", "mobile", "telephone", "contact"] },
  { type: "address", patterns: ["address", "street", "mailing"] },
  { type: "city", patterns: ["city", "town"] },
  { type: "state", patterns: ["state", "province", "region"] },
  { type: "country", patterns: ["country", "nation"] },
  { type: "postal_code", patterns: ["zip", "postal", "post code"] },
  { type: "current_company", patterns: ["current\\\\s*\\\\*compan", "employer", "company", "organization"] },
  { type: "current_title", patterns: ["current\\\\s*\\\\*(title|position|role)", "job\\\\s*\\\\*title", "\\\\b(title|position|role)\\\\b"] },
  { type: "education", patterns: ["education", "degree", "school", "university", "college"] },
  { type: "experience", patterns: ["experience", "work\\\\s*\\\\*history", "employment"] },
  { type: "skills", patterns: ["skills", "expertise", "technolog", "proficiency"] },
  { type: "resume_upload", patterns: ["resume", "\\\\bcv\\\\b", "upload.*resume", "attach.*resume"] },
  { type: "cover_letter", patterns: ["cover\\\\s*\\\\*letter", "coverletter"] },
  { type: "salary_expectation", patterns: ["salary", "compensation", "\\\\bpay\\\\b"] },
  { type: "work_authorization", patterns: ["authorization", "\\\\bvisa\\\\b", "work\\\\s*\\\\*permit", "sponsor", "work\\\\s*\\\\*author", "citizenship"] },
  { type: "notice_period", patterns: ["notice\\\\s*\\\\*period", "available.*start", "start.*date", "earliest.*start"] },
  { type: "diversity", patterns: ["diversity", "demographic", "gender", "ethnicity", "race", "veteran", "disability"] },
  { type: "equal_opportunity", patterns: ["equal opportunity", "eeo", "affirmative action", "equal employment", "eoe", "equal employer"] },
];

// For source-level validation, check that the type name appears in an object literal
for (const tp of typePatterns) {
  // Verify the field type constant is used in a pattern definition
  const typeRef = new RegExp(`type:\\s*"${tp.type}"`);
  assert(
    typeRef.test(classifierSrc),
    `field types include "${tp.type}"`
  );
}

// ── Classifier special-case logic ─────────────────────────────────

console.log("\n[classifier special-case logic]");

const specialPatterns = [
  ['inputType === "tel"', "tel input type maps to phone"],
  ['inputType === "email"', "email input type maps to email"],
  ['inputType === "file"', "file input type is handled"],
  ['inputType === "number"', "number input type is handled"],
  ['fieldType === "textarea"', "textarea field type is handled specially"],
  ['fieldType === "select"', "select field type is handled specially"],
];

for (const [pattern, label] of specialPatterns) {
  assert(classifierSrc.includes(pattern), label);
}

// ── Detector signal extraction ────────────────────────────────────

console.log("\n[detector signal extraction]");

const signalPatterns = [
  ["options", "fieldDetector.js extracts select options"],
  ["radios", "fieldDetector.js detects radio groups"],
  ["ariaLabel", "fieldDetector.js extracts aria-label"],
  ["sectionHeading", "fieldDetector.js extracts section headings"],
  ["nearbyText", "fieldDetector.js extracts nearby text"],
  ["placeholder", "fieldDetector.js extracts placeholder"],
];

for (const [pattern, label] of signalPatterns) {
  assert(detectorSrc.includes(pattern), label);
}

// ── Sensitive field types ─────────────────────────────────────────

console.log("\n[sensitive fields]");

const sensitiveTypes = ["phone", "address", "salary_expectation", "work_authorization", "diversity", "equal_opportunity"];
for (const st of sensitiveTypes) {
  assert(
    classifierSrc.includes(`"${st}"`),
    `sensitive field type "${st}" is defined`
  );
}

// ── Negative security assertions ──────────────────────────────────

console.log("\n[security]");

const allSrc = classifierSrc + detectorSrc;
assert(
  !allSrc.includes("localStorage"),
  "does not use localStorage"
);
assert(
  !allSrc.includes("sessionStorage"),
  "does not use sessionStorage"
);
assert(
  !allSrc.includes("document.cookie"),
  "does not access cookies"
);
assert(
  !allSrc.includes("fetch("),
  "does not make network requests"
);
assert(
  !allSrc.includes("XMLHttpRequest"),
  "does not use XHR"
);
assert(
  !allSrc.includes(".browsing"),
  "does not reference browsing"
);

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? " ❌" : " ✅"}\n`);
process.exit(failed > 0 ? 1 : 0);
