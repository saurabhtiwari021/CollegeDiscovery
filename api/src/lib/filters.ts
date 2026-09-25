import type { Prisma } from "@/generated/prisma/client";
import type { SORT_VALUES } from "@/lib/validation";

export interface StructuralFilters {
  stateId?: number | null;
  cityId?: number | null;
  /** One or more institution-type ids — filtered with `IN`, not equality. */
  institutionTypeIds?: number[] | null;
  /** One or more ownership-type ids — filtered with `IN`, not equality. */
  ownershipIds?: number[] | null;
  minFees?: number;
  maxFees?: number;
  minRating?: number;
  minPlacement?: number;
}

export function buildStructuralWhere(filters: StructuralFilters): Prisma.CollegeWhereInput {
  const where: Prisma.CollegeWhereInput = { isActive: true };

  if (filters.stateId) where.stateId = filters.stateId;
  if (filters.cityId) where.cityId = filters.cityId;
  if (filters.institutionTypeIds && filters.institutionTypeIds.length > 0) {
    where.institutionTypeId = { in: filters.institutionTypeIds };
  }
  if (filters.ownershipIds && filters.ownershipIds.length > 0) {
    where.ownershipId = { in: filters.ownershipIds };
  }

  if (filters.minFees !== undefined || filters.maxFees !== undefined) {
    where.feesUgInr = {
      ...(filters.minFees !== undefined ? { gte: filters.minFees } : {}),
      ...(filters.maxFees !== undefined ? { lte: filters.maxFees } : {}),
    };
  }

  if (filters.minRating !== undefined) {
    where.rating = { gte: filters.minRating };
  }

  // Only filter on placement where the dataset actually has a value —
  // colleges with a null placement average should not be silently dropped
  // by an *unset* filter, but a real minPlacement filter should exclude
  // colleges where placement data isn't available (can't confirm >= min).
  if (filters.minPlacement !== undefined) {
    where.placementAvgLpa = { gte: filters.minPlacement };
  }

  return where;
}

type SortValue = (typeof SORT_VALUES)[number];

export function buildOrderBy(sort: SortValue, hasSearchQuery: boolean): Prisma.CollegeOrderByWithRelationInput[] {
  switch (sort) {
    case "rating_desc":
      return [{ rating: { sort: "desc", nulls: "last" } }, { name: "asc" }];
    case "rating_asc":
      return [{ rating: { sort: "asc", nulls: "last" } }, { name: "asc" }];
    case "fees_asc":
      return [{ feesUgInr: { sort: "asc", nulls: "last" } }, { name: "asc" }];
    case "fees_desc":
      return [{ feesUgInr: { sort: "desc", nulls: "last" } }, { name: "asc" }];
    case "placement_desc":
      return [{ placementAvgLpa: { sort: "desc", nulls: "last" } }, { name: "asc" }];
    case "placement_asc":
      return [{ placementAvgLpa: { sort: "asc", nulls: "last" } }, { name: "asc" }];
    case "nirf_asc":
      return [{ nirfRank: { sort: "asc", nulls: "last" } }, { name: "asc" }];
    case "name_asc":
      return [{ name: "asc" }];
    case "relevance":
    default:
      // Without a search query there is no relevance signal to sort by —
      // fall back to a deterministic, sensible default (rating, then name)
      // so pagination is stable across requests.
      if (hasSearchQuery) return [{ name: "asc" }];
      return [{ rating: { sort: "desc", nulls: "last" } }, { name: "asc" }];
  }
}
