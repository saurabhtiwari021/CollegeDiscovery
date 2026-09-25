export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;
export const MAX_PAGE = 500;

export function parsePage(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), MAX_PAGE);
}

export function parseLimit(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

export function paginate<T>(rows: T[], page: number, limit: number) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const data = rows.slice(start, start + limit);
  return {
    data,
    pagination: { page: safePage, limit, total, totalPages },
  };
}
