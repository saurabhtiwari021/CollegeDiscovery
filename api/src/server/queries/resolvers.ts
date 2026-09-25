import { prisma } from "@/lib/prisma";

function asId(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function resolveStudyGoalId(slugOrId: string): Promise<number | null> {
  const maybeId = asId(slugOrId);
  const goal = await prisma.studyGoal.findFirst({
    where: maybeId ? { id: maybeId } : { slug: slugOrId },
    select: { id: true },
  });
  return goal?.id ?? null;
}

export async function resolveProgramId(slugOrId: string): Promise<number | null> {
  const maybeId = asId(slugOrId);
  const program = await prisma.program.findFirst({
    where: maybeId ? { id: maybeId } : { slug: slugOrId },
    select: { id: true },
  });
  return program?.id ?? null;
}

export async function resolveExamId(slugOrId: string): Promise<number | null> {
  const maybeId = asId(slugOrId);
  const exam = await prisma.entranceExam.findFirst({
    where: maybeId ? { id: maybeId } : { slug: slugOrId },
    select: { id: true },
  });
  return exam?.id ?? null;
}

export async function resolveStateId(value: string): Promise<number | null> {
  const maybeId = asId(value);
  if (maybeId) return maybeId;
  const state = await prisma.state.findFirst({
    where: {
      OR: [{ code: { equals: value, mode: "insensitive" } }, { name: { equals: value, mode: "insensitive" } }],
    },
    select: { id: true },
  });
  return state?.id ?? null;
}

export async function resolveCityId(value: string, stateId?: number | null): Promise<number | null> {
  const maybeId = asId(value);
  if (maybeId) return maybeId;
  const city = await prisma.city.findFirst({
    where: {
      ...(stateId ? { stateId } : {}),
      OR: [
        { name: { equals: value, mode: "insensitive" } },
        { normalizedName: { equals: value.toLowerCase(), mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  return city?.id ?? null;
}

export async function resolveInstitutionTypeId(value: string): Promise<number | null> {
  const maybeId = asId(value);
  if (maybeId) return maybeId;
  const row = await prisma.institutionType.findFirst({
    where: { OR: [{ slug: value }, { name: { equals: value, mode: "insensitive" } }] },
    select: { id: true },
  });
  return row?.id ?? null;
}

export async function resolveOwnershipTypeId(value: string): Promise<number | null> {
  const maybeId = asId(value);
  if (maybeId) return maybeId;
  const row = await prisma.ownershipType.findFirst({
    where: { OR: [{ slug: value }, { name: { equals: value, mode: "insensitive" } }] },
    select: { id: true },
  });
  return row?.id ?? null;
}

/**
 * Resolves a list of institution-type slugs/ids/names to their ids for a
 * multi-select filter (`institutionType=IIT,NIT,IIIT`). Entries that don't
 * resolve to a real row are simply dropped — the caller decides how to treat
 * an entirely-unresolved list.
 */
export async function resolveInstitutionTypeIds(values: string[]): Promise<number[]> {
  const ids = await Promise.all(values.map((v) => resolveInstitutionTypeId(v)));
  return ids.filter((id): id is number => id !== null);
}

/** Same as {@link resolveInstitutionTypeIds}, for ownership types. */
export async function resolveOwnershipTypeIds(values: string[]): Promise<number[]> {
  const ids = await Promise.all(values.map((v) => resolveOwnershipTypeId(v)));
  return ids.filter((id): id is number => id !== null);
}
