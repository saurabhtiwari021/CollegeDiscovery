/**
 * Post-seed QA report (roadmap section 8, step 9).
 * Run: npm run data:qa
 *
 * Fails (non-zero exit) if any *critical* invariant is broken:
 *  - duplicate active (college_id, program_id) mappings
 *  - orphaned college_program_exams (no matching college_program)
 *  - a study goal with zero eligible colleges
 *  - colleges with a city_id that doesn't belong to their state_id
 *
 * Everything else is printed as an informational count.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Running post-seed data-quality report\n");

  const counts = {
    states: await prisma.state.count(),
    cities: await prisma.city.count(),
    institutionTypes: await prisma.institutionType.count(),
    ownershipTypes: await prisma.ownershipType.count(),
    studyGoals: await prisma.studyGoal.count(),
    programs: await prisma.program.count(),
    studyGoalPrograms: await prisma.studyGoalProgram.count(),
    entranceExams: await prisma.entranceExam.count(),
    programExams: await prisma.programExam.count(),
    colleges: await prisma.college.count(),
    collegePrograms: await prisma.collegeProgram.count(),
    collegeProgramsActive: await prisma.collegeProgram.count({ where: { isActive: true } }),
    collegeProgramExams: await prisma.collegeProgramExam.count(),
    placements: await prisma.placement.count(),
    collegeDetails: await prisma.collegeDetail.count(),
    reviewsDemo: await prisma.reviewDemo.count(),
    collegeAliases: await prisma.collegeAlias.count(),
  };
  console.log("Row counts:", JSON.stringify(counts, null, 2));

  const problems: string[] = [];

  // 0. an empty database must never "pass" — it means the seed didn't run.
  if (counts.colleges === 0 || counts.studyGoals === 0) {
    problems.push("Database is empty (0 colleges / study goals) — run `npm run db:seed` first");
  }

  // 1. duplicate active (college_id, program_id) — the unique constraint
  // already prevents this at the DB level, but confirm no accidental
  // duplicates slipped in via multiple confidences for the same pair.
  const dupeCollegeProgram: { college_id: number; program_id: number; n: bigint }[] =
    await prisma.$queryRawUnsafe(`
      SELECT college_id, program_id, COUNT(*) as n
      FROM college_programs
      GROUP BY college_id, program_id
      HAVING COUNT(*) > 1
      LIMIT 20
    `);
  if (dupeCollegeProgram.length > 0) {
    problems.push(`${dupeCollegeProgram.length} duplicate (college_id, program_id) pair(s) in college_programs`);
  }

  // 2. orphaned college_program_exams
  const orphanExams: { count: bigint }[] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count
    FROM college_program_exams cpe
    LEFT JOIN college_programs cp
      ON cp.college_id = cpe.college_id AND cp.program_id = cpe.program_id
    WHERE cp.id IS NULL
  `);
  const orphanCount = Number(orphanExams[0]?.count ?? 0);
  if (orphanCount > 0) {
    problems.push(`${orphanCount} college_program_exams row(s) with no matching college_programs row`);
  }

  // 3. study goals with zero eligible colleges
  const goalsWithCounts: { slug: string; eligible: bigint }[] = await prisma.$queryRawUnsafe(`
    SELECT sg.slug,
           COUNT(DISTINCT cp.college_id) as eligible
    FROM study_goals sg
    LEFT JOIN study_goal_programs sgp ON sgp.study_goal_id = sg.id
    LEFT JOIN college_programs cp
      ON cp.program_id = sgp.program_id AND cp.is_active = true
    GROUP BY sg.slug
    ORDER BY sg.slug
  `);
  const emptyGoals = goalsWithCounts.filter((g) => Number(g.eligible) === 0);
  console.log(
    "\nEligible college count per study goal:",
    JSON.stringify(
      goalsWithCounts.map((g) => ({ slug: g.slug, eligible: Number(g.eligible) })),
      null,
      2
    )
  );
  if (emptyGoals.length > 0) {
    problems.push(`${emptyGoals.length} study goal(s) with zero eligible colleges: ${emptyGoals.map((g) => g.slug).join(", ")}`);
  }

  // 4. city/state consistency
  const badCityState: { count: bigint }[] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count
    FROM colleges c
    JOIN cities ci ON ci.id = c.city_id
    WHERE c.state_id IS NOT NULL AND ci.state_id <> c.state_id
  `);
  const badCityStateCount = Number(badCityState[0]?.count ?? 0);
  if (badCityStateCount > 0) {
    problems.push(`${badCityStateCount} college(s) whose city_id belongs to a different state than state_id`);
  }

  // 5. sanity check the Engineering / Architecture exam-isolation invariant
  // called out explicitly in the roadmap (section 25).
  const leakage: { count: bigint }[] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*) as count
    FROM college_program_exams cpe
    JOIN entrance_exams e ON e.id = cpe.exam_id
    JOIN programs p ON p.id = cpe.program_id
    WHERE e.slug = 'nata' AND p.slug NOT IN ('b-arch', 'barch')
  `);
  const leakageCount = Number(leakage[0]?.count ?? 0);
  if (leakageCount > 0) {
    problems.push(`NATA is linked to ${leakageCount} non-B.Arch program mapping(s) — exam isolation is broken`);
  }

  if (problems.length > 0) {
    console.log(`\n${problems.length} CRITICAL problem(s):`);
    for (const p of problems) console.log(`  [ERROR] ${p}`);
    console.log("\nData-quality report FAILED.");
    process.exit(1);
  }

  console.log("\nData-quality report passed — no critical invariants broken.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
