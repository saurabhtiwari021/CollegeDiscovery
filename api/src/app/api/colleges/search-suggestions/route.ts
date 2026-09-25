import { ok, withErrorHandling } from "@/lib/api-response";
import { collegeSuggestQuerySchema } from "@/lib/validation";
import { suggestColleges } from "@/server/queries/colleges";

/**
 * GET /api/colleges/search-suggestions?q=IIT+d&limit=6
 *
 * Typeahead for the search box. Matches college name OR alias
 * (`college_aliases`), same normalization as the main /api/colleges search,
 * so "IITD" and "Indian Institute of Technology Delhi" both resolve to the
 * same college. Returns [] for empty/too-short queries rather than erroring
 * — the client can call this on every keystroke without special-casing.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const parsed = collegeSuggestQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return ok([]);
    }
    const { q, limit } = parsed.data;
    if (q.trim().length < 2) {
      return ok([]);
    }
    const suggestions = await suggestColleges(q, limit);
    return ok(suggestions);
  });
}
