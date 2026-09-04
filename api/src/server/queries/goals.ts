import { prisma } from "@/lib/prisma";
import { resolveStudyGoalId } from "./resolvers";

/**
 * Study-goal cards for the landing page. Counts are computed live from
 * active CollegeProgram rows (never hardcoded) — see roadmap section 19.
 */
export async function listStudyGoalsWithCounts() {
  const goals = await prisma.studyGoal.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      programs: {
        include: { program: { select: { id: true, slug: true, name: true } } },
        orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
      },
    },
  });

  // One aggregate query for eligible-college counts per goal, instead of N
  // queries in a loop.
  const counts: { study_goal_id: number; eligible: bigint }[] = await prisma.$queryRawUnsafe(`
    SELECT sgp.study_goal_id, COUNT(DISTINCT cp.college_id) as eligible
    FROM study_goal_programs sgp
    JOIN college_programs cp ON cp.program_id = sgp.program_id AND cp.is_active = true
    GROUP BY sgp.study_goal_id
  `);
  const countByGoal = new Map(counts.map((c) => [c.study_goal_id, Number(c.eligible)]));

  return goals.map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
    description: g.description,
    iconKey: g.iconKey,
    eligibleCollegeCount: countByGoal.get(g.id) ?? 0,
    programs: g.programs.map((sgp) => ({
      id: sgp.program.id,
      slug: sgp.program.slug,
      name: sgp.program.name,
      isPrimary: sgp.isPrimary,
    })),
  }));
}

export async function getGoalProgramsBySlug(slug: string) {
  const goalId = await resolveStudyGoalId(slug);
  if (!goalId) return null;

  const mappings = await prisma.studyGoalProgram.findMany({
    where: { studyGoalId: goalId },
    orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
    include: {
      program: {
        select: {
          id: true,
          slug: true,
          name: true,
          degreeLevel: true,
          eligibilitySummary: true,
          durationYearsDefault: true,
        },
      },
    },
  });

  // eligible college count per program, scoped to this goal (i.e. active +
  // belongs to this goal's program list)
  const programIds = mappings.map((m) => m.programId);
  const counts = programIds.length
    ? await prisma.collegeProgram.groupBy({
        by: ["programId"],
        where: { programId: { in: programIds }, isActive: true },
        _count: { _all: true },
      })
    : [];
  const countByProgram = new Map(counts.map((c) => [c.programId, c._count._all]));

  return mappings.map((m) => ({
    id: m.program.id,
    slug: m.program.slug,
    name: m.program.name,
    degreeLevel: m.program.degreeLevel,
    eligibilitySummary: m.program.eligibilitySummary,
    durationYearsDefault: m.program.durationYearsDefault,
    isPrimary: m.isPrimary,
    eligibleCollegeCount: countByProgram.get(m.program.id) ?? 0,
  }));
}
