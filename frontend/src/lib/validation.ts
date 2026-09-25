import { z } from "zod";

const numericId = z
  .string()
  .regex(/^\d+$/)
  .transform((v) => Number(v));

export const collegeSearchSchema = z.object({
  goal: z.string().trim().max(100).optional(),
  program: z.string().trim().max(100).optional(),
  exam: z.string().trim().max(100).optional(),
  state: numericId.optional(),
  city: numericId.optional(),
  institutionType: numericId.optional(),
  ownership: numericId.optional(),
  minFees: z.coerce.number().min(0).optional(),
  maxFees: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(10).optional(),
  minPlacement: z.coerce.number().min(0).optional(),
  q: z
    .string()
    .trim()
    .max(120)
    .transform((v) => v.toLowerCase().replace(/\s+/g, " "))
    .optional(),
  sort: z
    .enum([
      "relevance",
      "rating_desc",
      "rating_asc",
      "fees_asc",
      "fees_desc",
      "placement_desc",
      "placement_asc",
      "nirf_asc",
      "name_asc",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type CollegeSearchInput = z.infer<typeof collegeSearchSchema>;

export const compareRequestSchema = z.object({
  ids: z.array(z.number().int()).min(2).max(3),
});

export const savedCollegeSchema = z.object({
  collegeId: z.number().int(),
});

// ---------------------------------------------------------------------------
// Client-side auth form validation (login/signup) — inline field errors,
// no reliance on native browser validation popups.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export function validateLoginFields(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  if (!email.trim() || !isValidEmail(email)) {
    errors.email = "Please enter a valid email.";
  }
  if (!password) {
    errors.password = "Password is required.";
  }
  return errors;
}

export interface SignupFieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export function validateSignupFields(
  name: string,
  email: string,
  password: string,
  confirm: string
): SignupFieldErrors {
  const errors: SignupFieldErrors = {};
  if (!name.trim()) {
    errors.name = "Please enter your name.";
  }
  if (!email.trim() || !isValidEmail(email)) {
    errors.email = "Please enter a valid email.";
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (!confirm) {
    errors.confirm = "Please confirm your password.";
  } else if (password && confirm !== password) {
    errors.confirm = "Passwords don't match.";
  }
  return errors;
}

export function validationErrorResponse(fieldErrors: Record<string, string>) {
  return {
    error: {
      code: "VALIDATION_ERROR",
      message: "One or more filters are invalid.",
      fieldErrors,
    },
  };
}
