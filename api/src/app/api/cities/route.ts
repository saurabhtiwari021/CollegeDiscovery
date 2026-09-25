import { ok, withErrorHandling } from "@/lib/api-response";
import { listCitiesByState } from "@/server/queries/colleges";
import { resolveStateId } from "@/server/queries/resolvers";

/**
 * GET /api/cities?state=<id|code|name>
 * Returns every city, or only those in one state when `state` is supplied.
 * Mirrors the resolver pattern used by /api/colleges so the same id/code/
 * name values the discover filters already pass around keep working here.
 */
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const stateParam = searchParams.get("state") ?? undefined;
    const stateId = stateParam ? await resolveStateId(stateParam) : null;

    // An unresolvable state filter should return no cities, not every city.
    if (stateParam && !stateId) {
      return ok([]);
    }

    const cities = await listCitiesByState(stateId);
    return ok(cities);
  });
}
