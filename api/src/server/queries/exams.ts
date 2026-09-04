import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { resolveProgramId } from "./resolvers";

export async function listExams(opts: { program?: string; state?: string }) {
  const where: Prisma.EntranceExamWhereInput = { isActive: true };

  if (opts.program) {
    const programId = await resolveProgramId(opts.program);
    if (!programId) return [];
    where.programExams = { some: { programId } };
  }

  if (opts.state) {
    where.OR = [{ applicableState: null }, { applicableState: { equals: opts.state, mode: "insensitive" } }];
  }

  return prisma.entranceExam.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      level: true,
      conductingBody: true,
      examScope: true,
      admissionRoute: true,
      applicableState: true,
    },
  });
}
