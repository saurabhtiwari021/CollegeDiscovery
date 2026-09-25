import { prisma } from "@/lib/prisma";

export async function listSavedColleges(userId: string) {
  const saved = await prisma.savedCollege.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      college: {
        select: {
          id: true,
          slug: true,
          name: true,
          rating: true,
          feesUgInr: true,
          placementAvgLpa: true,
          city: { select: { name: true } },
          state: { select: { name: true } },
        },
      },
    },
  });
  return saved.map((s) => ({ savedAt: s.createdAt, college: s.college }));
}

export async function saveCollege(userId: string, collegeId: number) {
  const college = await prisma.college.findUnique({ where: { id: collegeId }, select: { id: true } });
  if (!college) return { ok: false as const, reason: "NOT_FOUND" as const };

  await prisma.savedCollege.upsert({
    where: { userId_collegeId: { userId, collegeId } },
    create: { userId, collegeId },
    update: {},
  });
  return { ok: true as const };
}

export async function unsaveCollege(userId: string, collegeId: number) {
  await prisma.savedCollege.deleteMany({ where: { userId, collegeId } });
  return { ok: true as const };
}
