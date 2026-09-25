import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

type Numeric = number | string | null | undefined;

/** Coerces API numerics (Prisma Decimals can arrive as strings) into a finite number, else null. */
function toNum(value: Numeric): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Formats annual fees (INR) into a compact Lakh/Crore string. Returns "Not available" style callers decide. */
export function formatInr(input: Numeric): string {
  const value = toNum(input);
  if (value === null) return "Not available";
  if (value === 0) return "No fee listed";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr / yr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L / yr`;
  return `₹${value.toLocaleString("en-IN")} / yr`;
}

export function formatLpa(input: Numeric): string {
  const value = toNum(input);
  if (value === null) return "Not available";
  return `₹${value.toFixed(1)} LPA`;
}

export function formatRating(input: Numeric): string {
  const value = toNum(input);
  if (value === null) return "—";
  return value.toFixed(1);
}

export function formatRank(input: Numeric): string {
  const value = toNum(input);
  if (value === null) return "Not ranked";
  return `#${value}`;
}

export function pluralize(count: number, noun: string, plural?: string): string {
  return `${count.toLocaleString("en-IN")} ${count === 1 ? noun : plural ?? `${noun}s`}`;
}

export function slugifyQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Only allow same-origin, in-app redirect targets ("/discover?x=1"). Rejects
 * absolute URLs and protocol-relative ("//evil.com", "/\\evil.com") values so a
 * crafted `?redirect=` link can't bounce a freshly-logged-in user off-site.
 */
export function safeRedirect(target: string | null | undefined, fallback = "/discover"): string {
  if (!target) return fallback;
  if (!target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return fallback;
  return target;
}
