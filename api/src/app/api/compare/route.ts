import { apiError, ok, withErrorHandling } from "@/lib/api-response";
import { compareBodySchema, compareQuerySchema } from "@/lib/validation";
import { compareColleges } from "@/server/queries/compare";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const { ids } = compareQuerySchema.parse({ ids: searchParams.get("ids") ?? "" });

    const { colleges, missingIds } = await compareColleges(ids);
    if (colleges.length < 2) {
      return apiError("NOT_FOUND", "Fewer than 2 of the requested colleges could be found.", {
        collegeIds: missingIds.map(String),
      });
    }
    return ok({ colleges, missingIds });
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = compareBodySchema.parse(await request.json());
    const { colleges, missingIds } = await compareColleges(body.collegeIds);
    if (colleges.length < 2) {
      return apiError("NOT_FOUND", "Fewer than 2 of the requested colleges could be found.", {
        collegeIds: missingIds.map(String),
      });
    }
    return ok({ colleges, missingIds });
  });
}
