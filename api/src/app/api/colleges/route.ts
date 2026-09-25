import { ok, paginationMeta, withErrorHandling } from "@/lib/api-response";
import { collegesQuerySchema } from "@/lib/validation";
import { getAvailableFilterOptions, searchColleges } from "@/server/queries/colleges";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const query = collegesQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    const [{ colleges, page, limit, total, appliedFilters }, available] = await Promise.all([
      searchColleges(query),
      getAvailableFilterOptions(),
    ]);

    return ok(colleges, {
      pagination: paginationMeta(page, limit, total),
      filters: { applied: appliedFilters, available },
    });
  });
}
