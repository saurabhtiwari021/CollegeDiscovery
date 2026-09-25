import type { Prisma } from "@/generated/prisma/client";

export interface EligibilityInput {
  goalId?: number | null;
  programId?: number | null;
  examId?: number | null;
}

/**
 * The central eligibility relation is CollegeProgram. Goal membership comes
 * from StudyGoalProgram; exam acceptance is resolved against the *exact*
 * CollegeProgram through CollegeProgramExam. All three constraints are
 * combined on the SAME CollegeProgram row (via a single `some`), so a
 * program-agnostic exam can never "leak" onto an unrelated program mapping —
 * e.g. selecting Engineering + JEE Main will never surface a college via an
 * unrelated Architecture + NATA mapping.
 *
 * Returns `null` when no goal/program/exam filter was requested at all.
 */
export function buildEligibilityCollegeProgramWhere({
  goalId,
  programId,
  examId,
}: EligibilityInput): Prisma.CollegeProgramWhereInput | null {
  if (!goalId && !programId && !examId) return null;

  const collegeProgramWhere: Prisma.CollegeProgramWhereInput = {
    isActive: true,
  };

  if (programId) {
    collegeProgramWhere.programId = programId;
  }

  if (goalId) {
    collegeProgramWhere.program = {
      studyGoals: { some: { studyGoalId: goalId } },
    };
  }

  if (examId) {
    collegeProgramWhere.exams = { some: { examId } };
  }

  return collegeProgramWhere;
}

export function buildEligibilityWhere(
  input: EligibilityInput
): Prisma.CollegeWhereInput["programs"] | null {
  const collegeProgramWhere = buildEligibilityCollegeProgramWhere(input);
  return collegeProgramWhere ? { some: collegeProgramWhere } : null;
}
