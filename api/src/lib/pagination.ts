export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

/** Clamp page >= 1 and 1 <= limit <= MAX_LIMIT, then derive skip/take for Prisma. */
export function parsePagination(page?: number, limit?: number): ParsedPagination {
  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit ?? DEFAULT_LIMIT)));
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}
