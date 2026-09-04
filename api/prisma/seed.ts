/**
 * Seed pipeline — rebuilds a clean database from the V3 CSV package.
 * Run: npm run db:seed  (or `npx prisma db seed`, wired via prisma.config.ts)
 *
 * Load order (roadmap section 8, step 8):
 *  1. dimensions: states, cities, study goals, programs, exams, institution
 *     types, ownership types
 *  2. colleges + aliases
 *  3. study-goal <-> program relationships
 *  4. college <-> program relationships (all rows, including is_active=false —
 *     eligibility is enforced at query time, not at import time)
 *  5. program exams, then college-program exams
 *  6. placements, college details, demo reviews
 */
import "dotenv/config";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  readCsv,
  toIntOrNull,
  toInt,
  toFloatOrNull,
  toStrOrNull,
  toBool,
  toDateOrNull,
  normalizeSearchText,
} from "../scripts/csv-utils";

const DATA_DIR = path.join(process.cwd(), "data", "seed", "v3");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** createMany in batches to keep parameter counts sane for very wide tables. */
async function batchedCreateMany<T>(
  label: string,
  rows: T[],
  fn: (batch: T[]) => Promise<{ count: number }>,
  size = 500
) {
  let total = 0;
  for (const batch of chunk(rows, size)) {
    const res = await fn(batch);
    total += res.count;
  }
  console.log(`  ${label}: inserted ${total} / ${rows.length}`);
}

async function seedDimensions() {
  console.log("Step 1/6 — dimension tables");

  const states = await readCsv(path.join(DATA_DIR, "states.csv"));
  await batchedCreateMany("states", states, (batch) =>
    prisma.state.createMany({
      data: batch.map((r) => ({
        id: toInt(r.id, "states.id"),
        name: r.name,
        code: toStrOrNull(r.code),
        sourceType: toStrOrNull(r.source_type),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );

  const cities = await readCsv(path.join(DATA_DIR, "cities.csv"));
  await batchedCreateMany("cities", cities, (batch) =>
    prisma.city.createMany({
      data: batch.map((r) => ({
        id: toInt(r.id, "cities.id"),
        stateId: toInt(r.state_id, "cities.state_id"),
        name: r.name,
        normalizedName: toStrOrNull(r.normalized_name) ?? normalizeSearchText(r.name),
        latitude: toFloatOrNull(r.latitude),
        longitude: toFloatOrNull(r.longitude),
        sourceType: toStrOrNull(r.source_type),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );

  const institutionTypes = await readCsv(path.join(DATA_DIR, "institution_types.csv"));
  await batchedCreateMany("institution_types", institutionTypes, (batch) =>
    prisma.institutionType.createMany({
      data: batch.map((r) => ({ id: toInt(r.id, "institution_types.id"), name: r.name, slug: r.slug })),
      skipDuplicates: true,
    })
  );

  const ownershipTypes = await readCsv(path.join(DATA_DIR, "ownership_types.csv"));
  await batchedCreateMany("ownership_types", ownershipTypes, (batch) =>
    prisma.ownershipType.createMany({
      data: batch.map((r) => ({ id: toInt(r.id, "ownership_types.id"), name: r.name, slug: r.slug })),
      skipDuplicates: true,
    })
  );

  const studyGoals = await readCsv(path.join(DATA_DIR, "study_goals.csv"));
  await batchedCreateMany("study_goals", studyGoals, (batch) =>
    prisma.studyGoal.createMany({
      data: batch.map((r) => ({
        id: toInt(r.id, "study_goals.id"),
        slug: r.slug,
        name: r.name,
        description: toStrOrNull(r.description),
        iconKey: toStrOrNull(r.icon_key),
        displayOrder: toIntOrNull(r.display_order),
        isActive: toBool(r.is_active, true),
        label: toStrOrNull(r.label),
        filterGroup: toStrOrNull(r.filter_group),
        sourceType: toStrOrNull(r.source_type),
        sourceUrl: toStrOrNull(r.source_url),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );

  const programs = await readCsv(path.join(DATA_DIR, "programs.csv"));
  await batchedCreateMany("programs", programs, (batch) =>
    prisma.program.createMany({
      data: batch.map((r) => ({
        id: toInt(r.id, "programs.id"),
        slug: r.slug,
        name: r.name,
        degreeLevel: toStrOrNull(r.degree_level),
        categoryId: toIntOrNull(r.category_id),
        durationYearsDefault: toFloatOrNull(r.duration_years_default),
        isActive: toBool(r.is_active, true),
        description: toStrOrNull(r.description),
        eligibilitySummary: toStrOrNull(r.eligibility_summary),
        typicalEducationLevel: toStrOrNull(r.typical_education_level),
        streamRequirement: toStrOrNull(r.stream_requirement),
        normalizedName: toStrOrNull(r.normalized_name) ?? normalizeSearchText(r.name),
        sourceType: toStrOrNull(r.source_type),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );

  const exams = await readCsv(path.join(DATA_DIR, "entrance_exams.csv"));
  await batchedCreateMany("entrance_exams", exams, (batch) =>
    prisma.entranceExam.createMany({
      data: batch.map((r) => ({
        id: toInt(r.id, "entrance_exams.id"),
        slug: r.slug,
        name: r.name,
        level: toStrOrNull(r.level),
        conductingBody: toStrOrNull(r.conducting_body),
        websiteUrl: toStrOrNull(r.website_url),
        isActive: toBool(r.is_active, true),
        examScope: toStrOrNull(r.exam_scope),
        admissionRoute: toStrOrNull(r.admission_route),
        applicableState: toStrOrNull(r.applicable_state),
        sourceType: toStrOrNull(r.source_type),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );
}

async function seedColleges() {
  console.log("Step 2/6 — colleges + aliases");

  const colleges = await readCsv(path.join(DATA_DIR, "colleges.csv"));
  await batchedCreateMany("colleges", colleges, (batch) =>
    prisma.college.createMany({
      data: batch.map((r) => ({
        id: toInt(r.id, "colleges.id"),
        name: r.name,
        slug: r.slug,
        shortName: toStrOrNull(r.short_name),
        cityId: toIntOrNull(r.city_id),
        stateId: toIntOrNull(r.state_id),
        institutionTypeId: toIntOrNull(r.institution_type_id),
        ownershipId: toIntOrNull(r.ownership_id),
        feesUgInr: toFloatOrNull(r.fees_ug_inr),
        placementAvgLpa: toFloatOrNull(r.placement_avg_lpa),
        rating: toFloatOrNull(r.rating),
        nirfRank: toIntOrNull(r.nirf_rank),
        descriptionShort: toStrOrNull(r.description_short),
        websiteUrl: toStrOrNull(r.website_url),
        isActive: toBool(r.is_active, true),
        searchName: toStrOrNull(r.search_name) ?? r.name,
        normalizedName: toStrOrNull(r.normalized_name) ?? normalizeSearchText(r.name),
        logoUrl: toStrOrNull(r.logo_url),
        coverImageUrl: toStrOrNull(r.cover_image_url),
        address: toStrOrNull(r.address),
        pincode: toStrOrNull(r.pincode),
        establishedYear: toIntOrNull(r.established_year),
        accreditation: toStrOrNull(r.accreditation),
        detailAvailable: toBool(r.detail_available, false),
        sourceType: toStrOrNull(r.source_type),
        sourceUrl: toStrOrNull(r.source_url),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );

  const aliases = await readCsv(path.join(DATA_DIR, "college_aliases.csv"));
  await batchedCreateMany("college_aliases", aliases, (batch) =>
    prisma.collegeAlias.createMany({
      data: batch.map((r) => ({
        id: toInt(r.id, "college_aliases.id"),
        collegeId: toInt(r.college_id, "college_aliases.college_id"),
        alias: r.alias,
        normalizedAlias: normalizeSearchText(r.alias),
        aliasType: toStrOrNull(r.alias_type),
        sourceType: toStrOrNull(r.source_type),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
        confidence: toStrOrNull(r.confidence),
      })),
      skipDuplicates: true,
    })
  );
}

async function seedStudyGoalPrograms() {
  console.log("Step 3/6 — study-goal <-> program relationships");

  const rows = await readCsv(path.join(DATA_DIR, "study_goal_programs.csv"));
  await batchedCreateMany("study_goal_programs", rows, (batch) =>
    prisma.studyGoalProgram.createMany({
      data: batch.map((r) => ({
        studyGoalId: toInt(r.study_goal_id, "study_goal_programs.study_goal_id"),
        programId: toInt(r.program_id, "study_goal_programs.program_id"),
        displayOrder: toIntOrNull(r.display_order),
        isPrimary: toBool(r.is_primary, false),
        sourceType: toStrOrNull(r.source_type),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );
}

async function seedCollegePrograms() {
  console.log("Step 4/6 — college <-> program relationships (all rows; is_active preserved)");

  const rows = await readCsv(path.join(DATA_DIR, "college_programs.csv"));
  await batchedCreateMany("college_programs", rows, (batch) =>
    prisma.collegeProgram.createMany({
      data: batch.map((r) => ({
        collegeId: toInt(r.college_id, "college_programs.college_id"),
        programId: toInt(r.program_id, "college_programs.program_id"),
        annualFeeInr: toFloatOrNull(r.annual_fee_inr),
        durationYears: toFloatOrNull(r.duration_years),
        eligibilityText: toStrOrNull(r.eligibility_text),
        seatsOptional: toIntOrNull(r.seats_optional),
        admissionsNote: toStrOrNull(r.admissions_note),
        sourceType: toStrOrNull(r.source_type),
        sourceStatus: toStrOrNull(r.source_status),
        sourceUrl: toStrOrNull(r.source_url),
        verificationStatus: toStrOrNull(r.verification_status),
        isVerified: toBool(r.is_verified, false),
        isActive: toBool(r.is_active, true),
        notes: toStrOrNull(r.notes),
        mappingConfidence: toStrOrNull(r.mapping_confidence),
        mappingBasis: toStrOrNull(r.mapping_basis),
      })),
      skipDuplicates: true,
    })
  );
}

async function seedExamMappings() {
  console.log("Step 5/6 — program exams, then college-program exams");

  const programExams = await readCsv(path.join(DATA_DIR, "program_exams.csv"));
  await batchedCreateMany("program_exams", programExams, (batch) =>
    prisma.programExam.createMany({
      data: batch.map((r) => ({
        programId: toInt(r.program_id, "program_exams.program_id"),
        examId: toInt(r.exam_id, "program_exams.exam_id"),
        eligibilityScope: toStrOrNull(r.eligibility_scope),
        priority: toIntOrNull(r.priority),
        examScope: toStrOrNull(r.exam_scope),
        admissionRoute: toStrOrNull(r.admission_route),
        applicableState: toStrOrNull(r.applicable_state),
        sourceType: toStrOrNull(r.source_type),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );

  // college_program_exams references the (college_id, program_id) unique
  // constraint on college_programs — rows whose parent mapping doesn't exist
  // are skipped with a warning rather than failing the whole seed.
  const existingPairs = new Set(
    (await prisma.collegeProgram.findMany({ select: { collegeId: true, programId: true } })).map(
      (cp) => `${cp.collegeId}:${cp.programId}`
    )
  );

  const raw = await readCsv(path.join(DATA_DIR, "college_program_exams.csv"));
  const valid = raw.filter((r) => {
    const key = `${toIntOrNull(r.college_id)}:${toIntOrNull(r.program_id)}`;
    return existingPairs.has(key);
  });
  if (valid.length < raw.length) {
    console.log(`  college_program_exams: skipping ${raw.length - valid.length} row(s) with no matching college_program`);
  }

  await batchedCreateMany("college_program_exams", valid, (batch) =>
    prisma.collegeProgramExam.createMany({
      data: batch.map((r) => ({
        collegeId: toInt(r.college_id, "college_program_exams.college_id"),
        programId: toInt(r.program_id, "college_program_exams.program_id"),
        examId: toInt(r.exam_id, "college_program_exams.exam_id"),
        acceptanceScope: toStrOrNull(r.acceptance_scope),
        notes: toStrOrNull(r.notes),
        sourceType: toStrOrNull(r.source_type),
        sourceStatus: toStrOrNull(r.source_status),
        sourceUrl: toStrOrNull(r.source_url),
        verificationStatus: toStrOrNull(r.verification_status),
        admissionRoute: toStrOrNull(r.admission_route),
        applicableState: toStrOrNull(r.applicable_state),
      })),
      skipDuplicates: true,
    })
  );
}

async function seedFacts() {
  console.log("Step 6/6 — placements, college details, demo reviews");

  const placements = await readCsv(path.join(DATA_DIR, "placements.csv"));
  await batchedCreateMany("placements", placements, (batch) =>
    prisma.placement.createMany({
      data: batch.map((r) => ({
        id: toInt(r.id, "placements.id"),
        collegeId: toInt(r.college_id, "placements.college_id"),
        year: toIntOrNull(r.year),
        averagePackageLpa: toFloatOrNull(r.average_package_lpa),
        medianPackageLpa: toFloatOrNull(r.median_package_lpa),
        highestPackageLpa: toFloatOrNull(r.highest_package_lpa),
        placementRatePct: toFloatOrNull(r.placement_rate_pct),
        sourceStatus: toStrOrNull(r.source_status),
        sourceType: toStrOrNull(r.source_type),
        sourceUrl: toStrOrNull(r.source_url),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );

  const details = await readCsv(path.join(DATA_DIR, "college_details.csv"));
  await batchedCreateMany("college_details", details, (batch) =>
    prisma.collegeDetail.createMany({
      data: batch.map((r) => ({
        collegeId: toInt(r.college_id, "college_details.college_id"),
        establishedYear: toIntOrNull(r.established_year),
        campusArea: toStrOrNull(r.campus_area),
        accreditation: toStrOrNull(r.accreditation),
        overview: toStrOrNull(r.overview),
        facilities: toStrOrNull(r.facilities),
        hostelInfo: toStrOrNull(r.hostel_info),
        websiteUrl: toStrOrNull(r.website_url),
        sourceType: toStrOrNull(r.source_type),
        sourceUrl: toStrOrNull(r.source_url),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );

  const reviews = await readCsv(path.join(DATA_DIR, "reviews_demo.csv"));
  await batchedCreateMany("reviews_demo", reviews, (batch) =>
    prisma.reviewDemo.createMany({
      data: batch.map((r) => ({
        id: toInt(r.id, "reviews_demo.id"),
        collegeId: toInt(r.college_id, "reviews_demo.college_id"),
        userId: toStrOrNull(r.user_id),
        rating: toFloatOrNull(r.rating),
        title: toStrOrNull(r.title),
        body: toStrOrNull(r.body),
        createdAt: toDateOrNull(r.created_at),
        status: toStrOrNull(r.status),
        sourceType: toStrOrNull(r.source_type),
        verificationStatus: toStrOrNull(r.verification_status),
        notes: toStrOrNull(r.notes),
      })),
      skipDuplicates: true,
    })
  );
}

async function resetSequences() {
  // college_programs / college_program_exams use autoincrement ids but are
  // populated with explicit values via createMany — bump the sequence past
  // the max used id so future application inserts don't collide.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('college_programs', 'id'), COALESCE((SELECT MAX(id) FROM college_programs), 1))`
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('college_program_exams', 'id'), COALESCE((SELECT MAX(id) FROM college_program_exams), 1))`
  );
}

async function main() {
  console.log("Seeding College Discovery MVP database from V3 dataset\n");
  await seedDimensions();
  await seedColleges();
  await seedStudyGoalPrograms();
  await seedCollegePrograms();
  await seedExamMappings();
  await seedFacts();
  await resetSequences();
  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
