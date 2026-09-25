import { createReadStream } from "node:fs";
import { parse } from "csv-parse";

/**
 * Parse a V3 dataset CSV into an array of string-keyed records.
 * The dataset uses Pandas-style export quirks (e.g. "1093.0" for integer
 * foreign keys, "True"/"False" for booleans, "" for null) — the `to*`
 * helpers below normalize those.
 */
export async function readCsv(filePath: string): Promise<Record<string, string>[]> {
  const records: Record<string, string>[] = [];
  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    })
  );
  for await (const record of parser) {
    records.push(record as Record<string, string>);
  }
  return records;
}

/** "" -> null, otherwise the trimmed string. */
export function toStrOrNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

/** Handles Pandas float-formatted integer FKs like "1093.0" -> 1093. */
export function toIntOrNull(v: string | undefined): number | null {
  const s = toStrOrNull(v);
  if (s === null) return null;
  const n = Number.parseFloat(s);
  if (Number.isNaN(n)) return null;
  return Math.round(n);
}

export function toInt(v: string | undefined, fallbackFieldForError: string): number {
  const n = toIntOrNull(v);
  if (n === null) {
    throw new Error(`Expected an integer for ${fallbackFieldForError}, got "${v}"`);
  }
  return n;
}

export function toFloatOrNull(v: string | undefined): number | null {
  const s = toStrOrNull(v);
  if (s === null) return null;
  const n = Number.parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

/** "True"/"False"/"true"/"false"/"1"/"0" -> boolean, default when missing. */
export function toBool(v: string | undefined, defaultValue = false): boolean {
  const s = toStrOrNull(v);
  if (s === null) return defaultValue;
  return ["true", "1", "yes"].includes(s.toLowerCase());
}

export function toDateOrNull(v: string | undefined): Date | null {
  const s = toStrOrNull(v);
  if (s === null) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Lowercase, trim, collapse whitespace — used for search_name / normalized_name / aliases. */
export function normalizeSearchText(v: string | null | undefined): string | null {
  if (!v) return null;
  return v.trim().toLowerCase().replace(/\s+/g, " ");
}
