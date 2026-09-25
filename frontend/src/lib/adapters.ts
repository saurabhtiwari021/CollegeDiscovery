/**
 * The frontend's types (src/lib/types.ts) and api-client.ts were written
 * against the roadmap's documented API contract, before the real backend
 * existed. The real backend (college-discovery-mvp-api) implements the same
 * endpoints but with slightly different field names and nesting in a few
 * places (e.g. `fees` vs `feesUgInr`, nested `location: {city, state}` vs
 * flat `city`/`state` strings, `eligibleCollegeCount` vs `collegeCount`).
 *
 * Rather than reshape every component, this file adapts the backend's raw
 * responses into the shapes the UI already expects.
 */
import type {
  City,
  CollegeDetailResponse,
  CollegeListResponse,
  CollegeSummary,
  InstitutionType,
  OwnershipType,
  State,
} from "@/lib/types";
import type { ExamOption, GoalCard, ProgramOption } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Raw backend shapes (only the fields the adapters actually read)
// ---------------------------------------------------------------------------

interface RawNamed {
  id: number;
  name: string;
}

export interface RawGoal {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  eligibleCollegeCount: number;
  programs: Array<{ id: number; slug: string; name: string; isPrimary: boolean }>;
}

export interface RawProgramOption {
  id: number;
  slug: string;
  name: string;
  degreeLevel: string | null;
  isPrimary: boolean;
  eligibleCollegeCount: number;
}

export interface RawExamOption {
  id: number;
  slug: string;
  name: string;
  level: string | null;
  /** national / state / institution / consortium — drives categorized filter groups. */
  examScope: string | null;
  eligibilityScope: string;
}

interface RawCollegeSummary {
  id: number;
  slug: string;
  name: string;
  shortName: string;
  feesUgInr: number | null;
  placementAvgLpa: number | null;
  rating: number | null;
  nirfRank: number | null;
  city: RawNamed | null;
  state: (RawNamed & { code?: string }) | null;
  institutionType: (RawNamed & { slug?: string }) | null;
  ownership: (RawNamed & { slug?: string }) | null;
  matchedProgram: { id: number; name: string; slug: string } | null;
}

export interface RawCollegeListResponse {
  data: RawCollegeSummary[];
  pagination: CollegeListResponse["pagination"];
  filters: {
    applied: Record<string, unknown>;
    available: {
      states: State[];
      institutionTypes: InstitutionType[];
      ownershipTypes: OwnershipType[];
    };
  };
}

export interface RawCollegeDetailResponse {
  college: {
    id: number;
    name: string;
    slug: string;
    shortName: string;
    location: { city: string | null; state: string | null; address: string | null; pincode: string | null };
    rating: number | null;
    fees: number | null;
    type: string | null;
    ownership: string | null;
    nirfRank: number | null;
    placementAvgLpa: number | null;
    websiteUrl: string | null;
  };
  detail: {
    overview: string | null;
    establishedYear: number | null;
    accreditation: string | null;
    facilities: string | null;
    hostel: string | null;
    website: string | null;
    sourceType?: string | null;
    verificationStatus?: string | null;
  } | null;
  programs: Array<{
    id: number;
    slug: string;
    name: string;
    degreeLevel: string | null;
    annualFeeInr: number | null;
    durationYears: number | null;
    exams: Array<{ slug: string; name: string }>;
  }>;
  placements: CollegeDetailResponse["placements"];
  reviews: Array<{ id: number; rating: number | null; title: string | null; body: string | null }>;
  actions: { canSave: boolean; canCompare: boolean; isSaved: boolean };
}

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

export function adaptGoal(g: RawGoal): GoalCard {
  const primary = g.programs.filter((p) => p.isPrimary);
  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    label: g.name,
    description: g.description,
    iconKey: g.iconKey,
    filterGroup: null,
    collegeCount: g.eligibleCollegeCount,
    primaryPrograms: (primary.length > 0 ? primary : g.programs.slice(0, 4)).map((p) => p.name),
  };
}

export function adaptProgramOption(p: RawProgramOption): ProgramOption {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    degreeLevel: p.degreeLevel,
    isPrimary: p.isPrimary,
    collegeCount: p.eligibleCollegeCount,
  };
}

export function adaptExamOption(e: RawExamOption): ExamOption {
  return {
    id: e.id,
    slug: e.slug,
    name: e.name,
    examScope: e.examScope,
    applicableState: null,
    eligibilityScope:
      e.eligibilityScope === "primary" || e.eligibilityScope === "college_specific"
        ? e.eligibilityScope
        : "conditional",
  };
}

function adaptCollegeSummary(c: RawCollegeSummary): CollegeSummary {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    shortName: c.shortName,
    city: c.city?.name ?? null,
    state: c.state?.name ?? null,
    institutionType: c.institutionType?.name ?? null,
    ownership: c.ownership?.name ?? null,
    feesUgInr: c.feesUgInr,
    placementAvgLpa: c.placementAvgLpa,
    rating: c.rating,
    nirfRank: c.nirfRank,
    matchedProgram: c.matchedProgram,
  };
}

export function adaptCollegeListResponse(raw: RawCollegeListResponse, cities: City[]): CollegeListResponse {
  return {
    data: raw.data.map(adaptCollegeSummary),
    pagination: raw.pagination,
    filters: {
      applied: raw.filters.applied,
      available: {
        states: raw.filters.available.states,
        cities,
        institutionTypes: raw.filters.available.institutionTypes,
        ownershipTypes: raw.filters.available.ownershipTypes,
        // Not surfaced by the backend's filter-options endpoint, and not
        // consumed by DiscoverFilters (it fetches these separately via
        // fetchProgramsForGoal / fetchExamsForProgram instead).
        programs: [],
        exams: [],
      },
    },
  };
}

export function adaptCollegeDetail(raw: RawCollegeDetailResponse): CollegeDetailResponse {
  return {
    college: {
      id: raw.college.id,
      name: raw.college.name,
      slug: raw.college.slug,
      shortName: raw.college.shortName,
      city: raw.college.location.city,
      state: raw.college.location.state,
      institutionType: raw.college.type,
      ownership: raw.college.ownership,
      rating: raw.college.rating,
      feesUgInr: raw.college.fees,
      placementAvgLpa: raw.college.placementAvgLpa,
      nirfRank: raw.college.nirfRank,
      websiteUrl: raw.college.websiteUrl,
      address: raw.college.location.address,
      pincode: raw.college.location.pincode,
    },
    detail: raw.detail
      ? {
          overview: raw.detail.overview,
          establishedYear: raw.detail.establishedYear,
          accreditation: raw.detail.accreditation,
          facilities: raw.detail.facilities,
          hostelInfo: raw.detail.hostel,
          websiteUrl: raw.detail.website,
          // Synthetic seed shells and curated-but-unverified profiles both get
          // the "pending verified sourcing" note; only verified rows drop it.
          isDemo:
            raw.detail.sourceType === "synthetic_demo" ||
            raw.detail.verificationStatus === "unverified",
        }
      : null,
    programs: raw.programs.map((p) => ({
      programId: p.id,
      name: p.name,
      slug: p.slug,
      degreeLevel: p.degreeLevel,
      annualFeeInr: p.annualFeeInr,
      durationYears: p.durationYears,
      exams: p.exams.map((e, i) => ({ id: i, name: e.name, slug: e.slug })),
    })),
    placements: raw.placements,
    reviews: raw.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      // The backend serves these from the `reviews_demo` table.
      isDemo: true,
    })),
    actions: { canSave: raw.actions.canSave, canCompare: raw.actions.canCompare },
  };
}
