/**
 * Normalizes free-text search input the same way the seed pipeline normalizes
 * `search_name` / `normalized_name` / alias text — lowercase, trimmed,
 * collapsed whitespace — so lookups against `normalized_name` /
 * `normalized_alias` are consistent.
 */
export function normalizeQuery(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}
