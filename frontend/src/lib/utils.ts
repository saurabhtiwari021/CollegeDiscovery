import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Formats annual fees (INR) into a compact Lakh/Crore string. Returns "Not available" style callers decide. */
export function formatInr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Not available";
  if (value === 0) return "No fee listed";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr / yr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L / yr`;
  return `₹${value.toLocaleString("en-IN")} / yr`;
}

export function formatLpa(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Not available";
  return `₹${value.toFixed(1)} LPA`;
}

export function formatRating(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(1);
}

export function formatRank(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Not ranked";
  return `#${value}`;
}

export function pluralize(count: number, noun: string, plural?: string): string {
  return `${count.toLocaleString("en-IN")} ${count === 1 ? noun : plural ?? `${noun}s`}`;
}

export function slugifyQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}
