export interface State {
  id: number;
  name: string;
}

export interface City {
  id: number;
  stateId: number;
  name: string;
  normalizedName: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface InstitutionType {
  id: number;
  name: string;
  slug: string;
}

export interface OwnershipType {
  id: number;
  name: string;
  slug: string;
}

export interface StudyGoal {
  id: number;
  slug: string;
  name: string;
  label: string;
  filterGroup: string | null;
  description: string | null;
  iconKey: string | null;
  displayOrder: number | null;
  isActive: boolean | null;
}

export interface Program {
  id: number;
  slug: string;
  name: string;
  degreeLevel: string | null;
  categoryId: number | null;
  durationYearsDefault: number | null;
  isActive: boolean | null;
  description: string | null;
  eligibilitySummary: string | null;
  typicalEducationLevel: string | null;
  streamRequirement: string | null;
  normalizedName: string | null;
}

export interface EntranceExam {
  id: number;
  slug: string;
  name: string;
  level: string | null;
  conductingBody: string | null;
  examScope: string | null;
  admissionRoute: string | null;
  applicableState: string | null;
  isActive: boolean | null;
}

export interface CollegeRecord {
  id: number;
  name: string;
  slug: string;
  shortName: string;
  cityId: number | null;
  stateId: number | null;
  institutionTypeId: number | null;
  ownershipId: number | null;
  feesUgInr: number | null;
  placementAvgLpa: number | null;
  rating: number | null;
  nirfRank: number | null;
  isActive: boolean | null;
  searchName: string;
  normalizedName: string | null;
  websiteUrl: string | null;
  address: string | null;
  pincode: string | null;
  establishedYear: number | null;
  accreditation: string | null;
  detailAvailable: boolean | null;
}

/** Summary shape returned by list/search endpoints — enriched with joined labels. */
export interface CollegeSummary {
  id: number;
  name: string;
  slug: string;
  shortName: string;
  city: string | null;
  state: string | null;
  institutionType: string | null;
  ownership: string | null;
  feesUgInr: number | null;
  placementAvgLpa: number | null;
  rating: number | null;
  nirfRank: number | null;
  matchedProgram: MatchedProgram | null;
}

/** The specific program that satisfied the active goal/program filter for this college. */
export interface MatchedProgram {
  id: number;
  name: string;
  slug: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CollegeListResponse {
  data: CollegeSummary[];
  pagination: Pagination;
  filters: {
    applied: Record<string, unknown>;
    available: {
      states: State[];
      cities: City[];
      institutionTypes: InstitutionType[];
      ownershipTypes: OwnershipType[];
      programs: Program[];
      exams: EntranceExam[];
    };
  };
}

export interface CollegeDetailResponse {
  college: {
    id: number;
    name: string;
    slug: string;
    shortName: string;
    city: string | null;
    state: string | null;
    institutionType: string | null;
    ownership: string | null;
    rating: number | null;
    feesUgInr: number | null;
    placementAvgLpa: number | null;
    nirfRank: number | null;
    websiteUrl: string | null;
    address: string | null;
    pincode: string | null;
  };
  detail: {
    overview: string | null;
    establishedYear: number | null;
    accreditation: string | null;
    facilities: string | null;
    hostelInfo: string | null;
    websiteUrl: string | null;
    isDemo: boolean;
  } | null;
  programs: Array<{
    programId: number;
    name: string;
    slug: string;
    degreeLevel: string | null;
    annualFeeInr: number | null;
    durationYears: number | null;
    exams: Array<{ id: number; name: string; slug: string }>;
  }>;
  placements: Array<{
    year: number | null;
    averagePackageLpa: number | null;
    medianPackageLpa: number | null;
    highestPackageLpa: number | null;
    placementRatePct: number | null;
  }>;
  reviews: Array<{
    id: number;
    rating: number | null;
    title: string | null;
    body: string | null;
    isDemo: boolean;
  }>;
  actions: {
    canSave: boolean;
    canCompare: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}
