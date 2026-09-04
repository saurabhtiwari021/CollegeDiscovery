/**
 * Validates the V3 seed CSVs *before* they touch the database.
 * Run: npm run data:validate
 *
 * Checks (per the roadmap, section 8, step 2):
 *  - required headers are present on every file
 *  - required id columns are non-null and unique (primary/composite keys)
 *  - enum-like columns only contain expected values
 *  - foreign keys point at rows that actually exist in the referenced file
 *  - no duplicate active (college_id, program_id) mappings
 *  - no duplicate (college_id, program_id, exam_id) exam mappings
 *
 * Exits with a non-zero code and a printed report if anything critical fails.
 * This never touches Postgres — it is pure CSV-level validation, safe to run
 * before a database even exists.
 */
import path from "node:path";
import { readCsv, toIntOrNull, toStrOrNull } from "./csv-utils";

const DATA_DIR = path.join(process.cwd(), "data", "seed", "v3");

type Row = Record<string, string>;

interface Issue {
  level: "error" | "warning";
  file: string;
  message: string;
}

const issues: Issue[] = [];

function err(file: string, message: string) {
  issues.push({ level: "error", file, message });
}
function warn(file: string, message: string) {
  issues.push({ level: "warning", file, message });
}

function requireColumns(file: string, rows: Row[], columns: string[]) {
  if (rows.length === 0) {
    warn(file, "file has zero data rows");
    return;
  }
  const present = new Set(Object.keys(rows[0]));
  for (const c of columns) {
    if (!present.has(c)) {
      err(file, `missing required column "${c}"`);
    }
  }
}

function requireNonNull(file: string, rows: Row[], column: string) {
  rows.forEach((row, i) => {
    if (toStrOrNull(row[column]) === null) {
      err(file, `row ${i + 2}: required column "${column}" is null/empty`);
    }
  });
}

function requireUniqueInt(file: string, rows: Row[], column: string): Set<number> {
  const seen = new Set<number>();
  rows.forEach((row, i) => {
    const v = toIntOrNull(row[column]);
    if (v === null) {
      err(file, `row ${i + 2}: "${column}" is not a valid integer ("${row[column]}")`);
      return;
    }
    if (seen.has(v)) {
      err(file, `duplicate ${column}=${v} at row ${i + 2}`);
    }
    seen.add(v);
  });
  return seen;
}

function requireEnum(file: string, rows: Row[], column: string, allowed: string[]) {
  const allowedSet = new Set(allowed);
  rows.forEach((row, i) => {
    const v = toStrOrNull(row[column]);
    if (v !== null && !allowedSet.has(v)) {
      warn(file, `row ${i + 2}: "${column}"="${v}" not in expected set [${allowed.join(", ")}]`);
    }
  });
}

function requireFk(
  file: string,
  rows: Row[],
  column: string,
  referencedIds: Set<number>,
  referencedName: string,
  optional = false
) {
  rows.forEach((row, i) => {
    const v = toIntOrNull(row[column]);
    if (v === null) {
      if (!optional) err(file, `row ${i + 2}: "${column}" is null/invalid`);
      return;
    }
    if (!referencedIds.has(v)) {
      err(file, `row ${i + 2}: "${column}"=${v} does not exist in ${referencedName}`);
    }
  });
}

async function main() {
  console.log(`Validating V3 dataset in ${DATA_DIR}\n`);

  const states = await readCsv(path.join(DATA_DIR, "states.csv"));
  const cities = await readCsv(path.join(DATA_DIR, "cities.csv"));
  const institutionTypes = await readCsv(path.join(DATA_DIR, "institution_types.csv"));
  const ownershipTypes = await readCsv(path.join(DATA_DIR, "ownership_types.csv"));
  const studyGoals = await readCsv(path.join(DATA_DIR, "study_goals.csv"));
  const programs = await readCsv(path.join(DATA_DIR, "programs.csv"));
  const studyGoalPrograms = await readCsv(path.join(DATA_DIR, "study_goal_programs.csv"));
  const exams = await readCsv(path.join(DATA_DIR, "entrance_exams.csv"));
  const programExams = await readCsv(path.join(DATA_DIR, "program_exams.csv"));
  const colleges = await readCsv(path.join(DATA_DIR, "colleges.csv"));
  const collegePrograms = await readCsv(path.join(DATA_DIR, "college_programs.csv"));
  const collegeProgramExams = await readCsv(path.join(DATA_DIR, "college_program_exams.csv"));
  const placements = await readCsv(path.join(DATA_DIR, "placements.csv"));
  const collegeDetails = await readCsv(path.join(DATA_DIR, "college_details.csv"));
  const reviews = await readCsv(path.join(DATA_DIR, "reviews_demo.csv"));
  const aliases = await readCsv(path.join(DATA_DIR, "college_aliases.csv"));

  // --- headers -------------------------------------------------------------
  requireColumns("states.csv", states, ["id", "name"]);
  requireColumns("cities.csv", cities, ["id", "state_id", "name"]);
  requireColumns("institution_types.csv", institutionTypes, ["id", "name", "slug"]);
  requireColumns("ownership_types.csv", ownershipTypes, ["id", "name", "slug"]);
  requireColumns("study_goals.csv", studyGoals, ["id", "slug", "name"]);
  requireColumns("programs.csv", programs, ["id", "slug", "name"]);
  requireColumns("study_goal_programs.csv", studyGoalPrograms, ["study_goal_id", "program_id"]);
  requireColumns("entrance_exams.csv", exams, ["id", "slug", "name"]);
  requireColumns("program_exams.csv", programExams, ["program_id", "exam_id"]);
  requireColumns("colleges.csv", colleges, ["id", "name", "slug"]);
  requireColumns("college_programs.csv", collegePrograms, ["college_id", "program_id", "is_active", "mapping_confidence"]);
  requireColumns("college_program_exams.csv", collegeProgramExams, ["college_id", "program_id", "exam_id"]);

  // --- required / unique ids ------------------------------------------------
  const stateIds = requireUniqueInt("states.csv", states, "id");
  const cityIds = requireUniqueInt("cities.csv", cities, "id");
  const institutionTypeIds = requireUniqueInt("institution_types.csv", institutionTypes, "id");
  const ownershipTypeIds = requireUniqueInt("ownership_types.csv", ownershipTypes, "id");
  const studyGoalIds = requireUniqueInt("study_goals.csv", studyGoals, "id");
  const programIds = requireUniqueInt("programs.csv", programs, "id");
  const examIds = requireUniqueInt("entrance_exams.csv", exams, "id");
  const collegeIds = requireUniqueInt("colleges.csv", colleges, "id");

  requireNonNull("states.csv", states, "name");
  requireNonNull("colleges.csv", colleges, "name");
  requireNonNull("colleges.csv", colleges, "slug");
  requireNonNull("programs.csv", programs, "slug");
  requireNonNull("study_goals.csv", studyGoals, "slug");

  // --- enums -----------------------------------------------------------------
  requireEnum("college_programs.csv", collegePrograms, "mapping_confidence", [
    "verified",
    "high",
    "medium",
    "low",
  ]);
  requireEnum("college_aliases.csv", aliases, "confidence", ["verified", "high", "medium", "low"]);

  // --- foreign keys ------------------------------------------------------
  requireFk("cities.csv", cities, "state_id", stateIds, "states.csv");
  requireFk("colleges.csv", colleges, "city_id", cityIds, "cities.csv", true);
  requireFk("colleges.csv", colleges, "state_id", stateIds, "states.csv", true);
  requireFk("colleges.csv", colleges, "institution_type_id", institutionTypeIds, "institution_types.csv", true);
  requireFk("colleges.csv", colleges, "ownership_id", ownershipTypeIds, "ownership_types.csv", true);

  requireFk("study_goal_programs.csv", studyGoalPrograms, "study_goal_id", studyGoalIds, "study_goals.csv");
  requireFk("study_goal_programs.csv", studyGoalPrograms, "program_id", programIds, "programs.csv");

  requireFk("program_exams.csv", programExams, "program_id", programIds, "programs.csv");
  requireFk("program_exams.csv", programExams, "exam_id", examIds, "entrance_exams.csv");

  requireFk("college_programs.csv", collegePrograms, "college_id", collegeIds, "colleges.csv");
  requireFk("college_programs.csv", collegePrograms, "program_id", programIds, "programs.csv");

  requireFk("college_program_exams.csv", collegeProgramExams, "college_id", collegeIds, "colleges.csv");
  requireFk("college_program_exams.csv", collegeProgramExams, "program_id", programIds, "programs.csv");
  requireFk("college_program_exams.csv", collegeProgramExams, "exam_id", examIds, "entrance_exams.csv");

  requireFk("placements.csv", placements, "college_id", collegeIds, "colleges.csv");
  requireFk("college_details.csv", collegeDetails, "college_id", collegeIds, "colleges.csv");
  requireFk("reviews_demo.csv", reviews, "college_id", collegeIds, "colleges.csv");
  requireFk("college_aliases.csv", aliases, "college_id", collegeIds, "colleges.csv");

  // --- duplicate composite keys -------------------------------------------
  const cpSeen = new Set<string>();
  collegePrograms.forEach((row, i) => {
    const key = `${toIntOrNull(row.college_id)}:${toIntOrNull(row.program_id)}`;
    if (cpSeen.has(key)) err("college_programs.csv", `duplicate (college_id, program_id) at row ${i + 2}: ${key}`);
    cpSeen.add(key);
  });

  const cpeSeen = new Set<string>();
  collegeProgramExams.forEach((row, i) => {
    const key = `${toIntOrNull(row.college_id)}:${toIntOrNull(row.program_id)}:${toIntOrNull(row.exam_id)}`;
    if (cpeSeen.has(key))
      err("college_program_exams.csv", `duplicate (college_id, program_id, exam_id) at row ${i + 2}: ${key}`);
    cpeSeen.add(key);
    // every college_program_exam must reference an *existing* college_program pair
    if (!cpSeen.has(`${toIntOrNull(row.college_id)}:${toIntOrNull(row.program_id)}`)) {
      err(
        "college_program_exams.csv",
        `row ${i + 2}: (college_id=${row.college_id}, program_id=${row.program_id}) has no matching row in college_programs.csv`
      );
    }
  });

  // --- summary -------------------------------------------------------------
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  console.log("Row counts:");
  console.log(
    JSON.stringify(
      {
        states: states.length,
        cities: cities.length,
        institution_types: institutionTypes.length,
        ownership_types: ownershipTypes.length,
        study_goals: studyGoals.length,
        programs: programs.length,
        study_goal_programs: studyGoalPrograms.length,
        entrance_exams: exams.length,
        program_exams: programExams.length,
        colleges: colleges.length,
        college_programs: collegePrograms.length,
        college_program_exams: collegeProgramExams.length,
        placements: placements.length,
        college_details: collegeDetails.length,
        reviews_demo: reviews.length,
        college_aliases: aliases.length,
      },
      null,
      2
    )
  );

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings.slice(0, 50)) console.log(`  [warn] ${w.file}: ${w.message}`);
    if (warnings.length > 50) console.log(`  ...and ${warnings.length - 50} more`);
  }

  if (errors.length > 0) {
    console.log(`\n${errors.length} error(s):`);
    for (const e of errors.slice(0, 50)) console.log(`  [ERROR] ${e.file}: ${e.message}`);
    if (errors.length > 50) console.log(`  ...and ${errors.length - 50} more`);
    console.log("\nValidation FAILED — fix the errors above before seeding.");
    process.exit(1);
  }

  console.log("\nValidation passed with no critical errors.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
