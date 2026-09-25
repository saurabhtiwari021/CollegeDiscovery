import type { City, CollegeDetailResponse, ApiError } from "@/lib/types";
import {
  adaptCollegeDetail,
  adaptCollegeListResponse,
  adaptExamOption,
  adaptGoal,
  adaptProgramOption,
  type RawCollegeDetailResponse,
  type RawCollegeListResponse,
  type RawExamOption,
  type RawGoal,
  type RawProgramOption,
} from "@/lib/adapters";

export interface GoalCard {
  id: number;
  slug: string;
  name: string;
  label: string;
  description: string | null;
  iconKey: string | null;
  filterGroup: string | null;
  collegeCount: number;
  primaryPrograms: string[];
}

export interface ProgramOption {
  id: number;
  slug: string;
  name: string;
  degreeLevel: string | null;
  isPrimary: boolean;
  collegeCount: number;
}

export interface ExamOption {
  id: number;
  slug: string;
  name: string;
  examScope: string | null;
  applicableState: string | null;
  eligibilityScope: "primary" | "conditional" | "college_specific";
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
  const body = (await res.json()) as T | ApiError;
  if (!res.ok) {
    const err = body as ApiError;
    throw new Error(err?.error?.message ?? "Request failed.");
  }
  return body as T;
}

export function fetchGoals() {
  return getJson<{ data: RawGoal[] }>("/api/goals").then((r) => r.data.map(adaptGoal));
}

export function fetchProgramsForGoal(goalSlug: string) {
  return getJson<{ data: RawProgramOption[] }>(`/api/goals/${goalSlug}/programs`).then((r) =>
    r.data.map(adaptProgramOption)
  );
}

export function fetchExamsForProgram(programSlug: string) {
  return getJson<{ data: RawExamOption[] }>(`/api/programs/${programSlug}/exams`).then((r) =>
    r.data.map(adaptExamOption)
  );
}

/** Cities for the dependent city filter, optionally scoped to a state id/code/name. */
export function fetchCities(state?: string) {
  const qs = state ? `?state=${encodeURIComponent(state)}` : "";
  return getJson<{ data: City[] }>(`/api/cities${qs}`).then((r) => r.data);
}

export interface CollegeSuggestion {
  id: number;
  slug: string;
  name: string;
  shortName: string | null;
  /** The alias text that matched, when the match came from an alias rather than the canonical name. */
  matchedAlias: string | null;
}

/** Typeahead suggestions for the search box — matches college name or alias. */
export function fetchCollegeSuggestions(query: string, limit = 6) {
  if (query.trim().length < 2) return Promise.resolve<CollegeSuggestion[]>([]);
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return getJson<{ data: CollegeSuggestion[] }>(`/api/colleges/search-suggestions?${params}`).then(
    (r) => r.data
  );
}

export async function fetchColleges(query: string) {
  const raw = await getJson<RawCollegeListResponse>(`/api/colleges?${query}`);
  const stateParam = new URLSearchParams(query).get("state") ?? undefined;
  const cities = stateParam ? await fetchCities(stateParam) : [];
  return adaptCollegeListResponse(raw, cities);
}

export function fetchCollegeDetail(slug: string) {
  // The backend wraps every success payload in a `{ data }` envelope.
  return getJson<{ data: RawCollegeDetailResponse }>(`/api/colleges/${encodeURIComponent(slug)}`).then(
    (r) => adaptCollegeDetail(r.data)
  );
}

export interface CompareCollege {
  id: number;
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  institutionType: string | null;
  ownership: string | null;
  feesUgInr: number | null;
  placementAvgLpa: number | null;
  rating: number | null;
  nirfRank: number | null;
  programs: string[];
}

/** Used by the compare page: one request for the full comparison set. */
export function fetchCompare(ids: number[]) {
  return getJson<{ data: { colleges: CompareCollege[]; missingIds: number[] } }>(
    `/api/compare?ids=${ids.join(",")}`
  ).then((r) => r.data);
}

export type { CollegeDetailResponse };
