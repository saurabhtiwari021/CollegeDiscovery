import { prisma } from "@/lib/prisma";
import { resolveProgramId } from "./resolvers";

/**
 * Exam options for one program, verified through *actual* CollegeProgramExam
 * acceptance rather than just the default ProgramExam vocabulary — so the
 * filter UI only offers exams that some college genuinely accepts for this
 * program (roadmap section 14: "verify through college-program acceptance").
 */
export async function getProgramExamsBySlug(slug: string) {
  const programId = await resolveProgramId(slug);
  if (!programId) return null;

  const [defaultExams, acceptanceCounts] = await Promise.all([
    prisma.programExam.findMany({
      where: { programId },
      orderBy: { priority: "asc" },
      include: {
        exam: { select: { id: true, slug: true, name: true, level: true, examScope: true } },
      },
    }),
    prisma.collegeProgramExam.groupBy({
      by: ["examId"],
      where: { programId },
      _count: { _all: true },
    }),
  ]);

  const acceptedByExam = new Map(acceptanceCounts.map((c) => [c.examId, c._count._all]));

  return defaultExams.map((pe) => ({
    id: pe.exam.id,
    slug: pe.exam.slug,
    name: pe.exam.name,
    level: pe.exam.level,
    // national / state / institution / consortium — drives the categorized
    // exam filter groups on the frontend. Never inferred client-side.
    examScope: pe.exam.examScope,
    eligibilityScope: pe.eligibilityScope,
    priority: pe.priority,
    collegesAcceptingCount: acceptedByExam.get(pe.exam.id) ?? 0,
  }));
}
