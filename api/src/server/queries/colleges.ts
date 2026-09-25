import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { parsePagination } from "@/lib/pagination";
import { buildEligibilityWhere, buildEligibilityCollegeProgramWhere } from "@/lib/eligibility";
import { buildStructuralWhere, buildOrderBy } from "@/lib/filters";
import { normalizeQuery } from "@/lib/search";
import type { CollegesQuery } from "@/lib/validation";
import {
  resolveStudyGoalId,
  resolveProgramId,
  resolveExamId,
  resolveStateId,
  resolveCityId,
  resolveInstitutionTypeIds,
  resolveOwnershipTypeIds,
} from "./resolvers";

const collegeListSelect = {
  id: true,
  slug: true,
  name: true,
  shortName: true,
  feesUgInr: true,
  placementAvgLpa: true,
  rating: true,
  nirfRank: true,
  logoUrl: true,
  establishedYear: true,
  city: { select: { id: true, name: true } },
  state: { select: { id: true, name: true, code: true } },
  institutionType: { select: { id: true, name: true, slug: true } },
  ownership: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.CollegeSelect;

export async function searchColleges(query: CollegesQuery) {
  const [goalId, programId, examId, stateId, institutionTypeIds, ownershipIds] = await Promise.all([
    query.goal ? resolveStudyGoalId(query.goal) : null,
    query.program ? resolveProgramId(query.program) : null,
    query.exam ? resolveExamId(query.exam) : null,
    query.state ? resolveStateId(query.state) : null,
    query.institutionType ? resolveInstitutionTypeIds(query.institutionType) : null,
    query.ownership ? resolveOwnershipTypeIds(query.ownership) : null,
  ]);
  const cityId = query.city ? await resolveCityId(query.city, stateId) : null;

  // If a slug filter was supplied but didn't resolve to a real row, the
  // correct response is zero results (not "ignore the filter") — a typo'd
  // goal slug should never silently widen the search. For the multi-select
  // filters (institutionType/ownership) this means: at least one of the
  // requested values must resolve, or we treat the whole filter as bogus.
  const unresolvedFilter =
    (query.goal && !goalId) ||
    (query.program && !programId) ||
    (query.exam && !examId) ||
    (query.state && !stateId) ||
    (query.city && !cityId) ||
    (query.institutionType && institutionTypeIds?.length === 0) ||
    (query.ownership && ownershipIds?.length === 0);

  const { page, limit, skip, take } = parsePagination(query.page, query.limit);

  const appliedFilters = {
    q: query.q ?? null,
    goal: query.goal ?? null,
    program: query.program ?? null,
    exam: query.exam ?? null,
    state: query.state ?? null,
    city: query.city ?? null,
    institutionType: query.institutionType ?? null,
    ownership: query.ownership ?? null,
    minFees: query.minFees ?? null,
    maxFees: query.maxFees ?? null,
    minRating: query.minRating ?? null,
    minPlacement: query.minPlacement ?? null,
    sort: query.sort,
  };

  if (unresolvedFilter) {
    return {
      colleges: [],
      page,
      limit,
      total: 0,
      appliedFilters,
    };
  }

  const where: Prisma.CollegeWhereInput = {
    ...buildStructuralWhere({
      stateId,
      cityId,
      institutionTypeIds,
      ownershipIds,
      minFees: query.minFees,
      maxFees: query.maxFees,
      minRating: query.minRating,
      minPlacement: query.minPlacement,
    }),
  };

  const eligibility = buildEligibilityWhere({ goalId, programId, examId });
  if (eligibility) {
    where.programs = eligibility;
  }

  if (query.q) {
    const q = normalizeQuery(query.q);
    where.OR = [
      { normalizedName: { contains: q } },
      { searchName: { contains: q, mode: "insensitive" } },
      { aliases: { some: { normalizedAlias: { contains: q } } } },
    ];
  }

  const orderBy = buildOrderBy(query.sort, Boolean(query.q));

  const [total, rows] = await Promise.all([
    prisma.college.count({ where }),
    prisma.college.findMany({ where, orderBy, skip, take, select: collegeListSelect }),
  ]);

  const colleges = await attachMatchedPrograms(rows, { goalId, programId, examId });

  return { colleges, page, limit, total, appliedFilters };
}

/**
 * Attaches the actual matching Program (id/name/slug) to each college row
 * when a goal or program filter narrowed the search — this is what the
 * "Offers B.Tech" line on a college card renders. Resolved against the
 * exact same CollegeProgram eligibility relation used to filter the search
 * (goal -> StudyGoalProgram, exam -> CollegeProgramExam), so the program
 * shown is always one the college is genuinely, actively eligible for.
 */
async function attachMatchedPrograms<T extends { id: number }>(
  rows: T[],
  input: { goalId: number | null; programId: number | null; examId: number | null }
): Promise<(T & { matchedProgram: { id: number; name: string; slug: string } | null })[]> {
  const collegeProgramWhere = buildEligibilityCollegeProgramWhere(input);

  // Only worth resolving when there's something to disambiguate by — a
  // bare exam filter with no goal/program doesn't pin down a single
  // program, so leave matchedProgram unset in that case.
  if (!collegeProgramWhere || (!input.goalId && !input.programId) || rows.length === 0) {
    return rows.map((r) => ({ ...r, matchedProgram: null }));
  }

  const collegeIds = rows.map((r) => r.id);
  const matches = await prisma.collegeProgram.findMany({
    where: { ...collegeProgramWhere, collegeId: { in: collegeIds } },
    select: { collegeId: true, program: { select: { id: true, name: true, slug: true } } },
    orderBy: { program: { name: "asc" } },
  });

  const matchedByCollege = new Map<number, { id: number; name: string; slug: string }>();
  for (const m of matches) {
    if (!matchedByCollege.has(m.collegeId)) matchedByCollege.set(m.collegeId, m.program);
  }

  return rows.map((r) => ({ ...r, matchedProgram: matchedByCollege.get(r.id) ?? null }));
}

export interface CollegeSuggestion {
  id: number;
  slug: string;
  name: string;
  shortName: string | null;
  /** The specific alias text that matched, when the match came from an alias rather than the name. */
  matchedAlias: string | null;
}

/**
 * Typeahead suggestions for the search box. Name matches are always ranked
 * first; alias matches (e.g. "IITD" -> "IIT Delhi") fill any remaining slots
 * so a college already surfaced by its name is never duplicated via an
 * alias. Alias resolution lives entirely here — the client only ever sees
 * canonical college rows plus which alias (if any) matched.
 */
export async function suggestColleges(rawQuery: string, limit = 8): Promise<CollegeSuggestion[]> {
  const q = normalizeQuery(rawQuery);
  if (q.length < 2) return [];

  const nameMatches = await prisma.college.findMany({
    where: {
      isActive: true,
      OR: [{ normalizedName: { contains: q } }, { searchName: { contains: q, mode: "insensitive" } }],
    },
    select: { id: true, slug: true, name: true, shortName: true },
    orderBy: { name: "asc" },
    take: limit,
  });

  const suggestions: CollegeSuggestion[] = nameMatches.map((c) => ({ ...c, matchedAlias: null }));
  const remaining = limit - suggestions.length;

  if (remaining > 0) {
    const excludeIds = nameMatches.map((c) => c.id);
    const aliasRows = await prisma.collegeAlias.findMany({
      where: {
        normalizedAlias: { contains: q },
        collegeId: { notIn: excludeIds },
        college: { isActive: true },
      },
      select: { alias: true, college: { select: { id: true, slug: true, name: true, shortName: true } } },
      orderBy: { alias: "asc" },
      take: remaining * 3, // several aliases can point at the same college; overfetch then de-dupe
    });

    const seen = new Set<number>();
    for (const row of aliasRows) {
      if (seen.has(row.college.id)) continue;
      seen.add(row.college.id);
      suggestions.push({ ...row.college, matchedAlias: row.alias });
      if (suggestions.length >= limit) break;
    }
  }

  return suggestions;
}

/** Static filter option lists — institution types / ownership types / states rarely change size. */
export async function getAvailableFilterOptions() {
  const [states, institutionTypes, ownershipTypes] = await Promise.all([
    prisma.state.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: "asc" } }),
    prisma.institutionType.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.ownershipType.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);
  return { states, institutionTypes, ownershipTypes };
}

/** Cities for the dependent city dropdown — optionally scoped to one state. */
export async function listCitiesByState(stateId?: number | null) {
  const cities = await prisma.city.findMany({
    where: stateId ? { stateId } : undefined,
    orderBy: { name: "asc" },
    select: {
      id: true,
      stateId: true,
      name: true,
      normalizedName: true,
      latitude: true,
      longitude: true,
    },
  });
  return cities.map((c) => ({
    ...c,
    latitude: c.latitude !== null ? Number(c.latitude) : null,
    longitude: c.longitude !== null ? Number(c.longitude) : null,
  }));
}

// ---------------------------------------------------------------------------
// College detail
// ---------------------------------------------------------------------------

export async function getCollegeBySlug(slug: string) {
  return prisma.college.findFirst({
    where: { slug, isActive: true },
    include: {
      city: { select: { id: true, name: true } },
      state: { select: { id: true, name: true, code: true } },
      institutionType: { select: { id: true, name: true, slug: true } },
      ownership: { select: { id: true, name: true, slug: true } },
      detail: true,
      placements: { orderBy: { year: "desc" } },
      programs: {
        where: { isActive: true },
        include: {
          program: { select: { id: true, slug: true, name: true, degreeLevel: true } },
          exams: { include: { exam: { select: { id: true, slug: true, name: true } } } },
        },
      },
      reviews: {
        where: { status: { not: "hidden" } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function getCollegeProgramsBySlug(slug: string) {
  const college = await prisma.college.findFirst({ where: { slug }, select: { id: true } });
  if (!college) return null;
  return prisma.collegeProgram.findMany({
    where: { collegeId: college.id, isActive: true },
    include: {
      program: { select: { id: true, slug: true, name: true, degreeLevel: true, durationYearsDefault: true } },
      exams: { include: { exam: { select: { id: true, slug: true, name: true } } } },
    },
    orderBy: { program: { name: "asc" } },
  });
}

export async function getCollegeReviewsBySlug(slug: string) {
  const college = await prisma.college.findFirst({ where: { slug }, select: { id: true } });
  if (!college) return null;
  return prisma.reviewDemo.findMany({
    where: { collegeId: college.id, status: { not: "hidden" } },
    orderBy: { createdAt: "desc" },
  });
}
