import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function paginationMeta(page: number, limit: number, total: number): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Prisma returns `Decimal` columns (rating, fees, LPA, lat/long, ...) as
 * decimal.js instances, whose `toJSON()` emits a *string* ("9.9"). Every
 * consumer of this API (and the documented contract) expects plain JSON
 * numbers, so we convert them while serializing. The replacer has to read
 * `this[key]` because JSON.stringify calls `toJSON()` *before* the replacer
 * sees the value.
 */
function isDecimal(v: unknown): v is { toNumber: () => number } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { toNumber?: unknown }).toNumber === "function" &&
    typeof (v as { toFixed?: unknown }).toFixed === "function"
  );
}

function decimalReplacer(this: Record<string, unknown>, key: string, value: unknown) {
  const raw = this[key];
  return isDecimal(raw) ? raw.toNumber() : value;
}

export function json(body: unknown, status = 200) {
  return new NextResponse(JSON.stringify(body, decimalReplacer), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function ok<T>(
  data: T,
  extra?: { pagination?: Pagination; filters?: { applied: unknown; available?: unknown } },
  init?: number
) {
  return json({ data, ...extra }, init ?? 200);
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
) {
  return NextResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status: STATUS_BY_CODE[code] }
  );
}

/** Converts a ZodError into the standard 400 fieldErrors response shape. */
export function validationErrorResponse(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return apiError("VALIDATION_ERROR", "One or more query parameters are invalid.", fieldErrors);
}

/** Wraps a route handler body, turning thrown errors into a generic 500 and logging details server-side. */
export async function withErrorHandling<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      return validationErrorResponse(err);
    }
    console.error("[api] unhandled error:", err);
    return apiError("INTERNAL_ERROR", "Something went wrong. Please try again.");
  }
}
