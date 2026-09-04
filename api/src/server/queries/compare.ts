import { prisma } from "@/lib/prisma";

export async function compareColleges(collegeIds: number[]) {
  const uniqueIds = Array.from(new Set(collegeIds));

  const colleges = await prisma.college.findMany({
    where: { id: { in: uniqueIds }, isActive: true },
    include: {
      city: { select: { name: true } },
      state: { select: { name: true } },
      institutionType: { select: { name: true } },
      ownership: { select: { name: true } },
      programs: {
        where: { isActive: true },
        include: { program: { select: { name: true, degreeLevel: true } } },
      },
    },
  });

  const foundIds = new Set(colleges.map((c) => c.id));
  const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

  // Preserve the order the caller asked for.
  const byId = new Map(colleges.map((c) => [c.id, c]));
  const ordered = uniqueIds.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c));

  return {
    missingIds,
    colleges: ordered.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      city: c.city?.name ?? null,
      state: c.state?.name ?? null,
      institutionType: c.institutionType?.name ?? null,
      ownership: c.ownership?.name ?? null,
      feesUgInr: c.feesUgInr,
      placementAvgLpa: c.placementAvgLpa,
      rating: c.rating,
      nirfRank: c.nirfRank,
      programs: c.programs.map((p) => p.program.name),
    })),
  };
}
