import { apiError, ok, withErrorHandling } from "@/lib/api-response";
import { getGoalProgramsBySlug } from "@/server/queries/goals";
import { slugParamSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withErrorHandling(async () => {
    const { slug } = await params;
    const parsedSlug = slugParamSchema.parse(slug);

    const programs = await getGoalProgramsBySlug(parsedSlug);
    if (programs === null) {
      return apiError("NOT_FOUND", `No study goal found for "${parsedSlug}".`);
    }
    return ok(programs);
  });
}
