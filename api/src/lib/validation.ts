import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Accepts a query-string value and coerces to a positive integer. */
const intFromQuery = (min = 1) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
    .pipe(z.number().int().min(min).optional());

const floatFromQuery = (min?: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
    .pipe(z.number().min(min ?? -Infinity).optional());

/**
 * Accepts a comma-separated query-string value ("IIT,NIT,IIIT") and returns
 * a de-duplicated array of trimmed, non-empty entries — or `undefined` when
 * the param wasn't supplied at all. Used for multi-select filters.
 */
const csvFromQuery = (max = 100) =>
  z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined;
      const values = Array.from(
        new Set(
          v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      );
      return values.length > 0 ? values : undefined;
    })
    .pipe(z.array(z.string().max(max)).optional());

export const SORT_VALUES = [
  "relevance",
  "rating_desc",
  "rating_asc",
  "fees_asc",
  "fees_desc",
  "placement_desc",
  "placement_asc",
  "nirf_asc",
  "name_asc",
] as const;

// ---------------------------------------------------------------------------
// GET /api/colleges
// ---------------------------------------------------------------------------

export const collegesQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  goal: z.string().trim().max(100).optional(), // slug
  program: z.string().trim().max(100).optional(), // slug
  exam: z.string().trim().max(100).optional(), // slug
  state: z.string().trim().max(100).optional(), // slug or numeric id
  city: z.string().trim().max(100).optional(),
  // Comma-separated multi-select: institutionType=IIT,NIT,IIIT
  institutionType: csvFromQuery(100),
  ownership: csvFromQuery(100),
  minFees: floatFromQuery(0),
  maxFees: floatFromQuery(0),
  minRating: floatFromQuery(0),
  minPlacement: floatFromQuery(0),
  sort: z.enum(SORT_VALUES).optional().default("relevance"),
  page: intFromQuery(1).transform((v) => v ?? 1),
  limit: intFromQuery(1).transform((v) => Math.min(v ?? 20, 50)),
});

export type CollegesQuery = z.infer<typeof collegesQuerySchema>;

// ---------------------------------------------------------------------------
// GET /api/colleges/search-suggestions
// ---------------------------------------------------------------------------

export const collegeSuggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: intFromQuery(1).transform((v) => Math.min(v ?? 6, 10)),
});

// ---------------------------------------------------------------------------
// GET/POST /api/compare
// ---------------------------------------------------------------------------

export const compareQuerySchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((v) => v.split(",").map((s) => Number(s.trim())))
    .pipe(z.array(z.number().int().positive()).min(2).max(3)),
});

export const compareBodySchema = z.object({
  collegeIds: z.array(z.number().int().positive()).min(2).max(3),
});

// ---------------------------------------------------------------------------
// /api/saved-colleges
// ---------------------------------------------------------------------------

export const savedCollegeBodySchema = z.object({
  collegeId: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const signupBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(200),
  name: z.string().trim().max(200).optional(),
});

export const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(200),
});

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export const slugParamSchema = z.string().trim().min(1).max(150);
