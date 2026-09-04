import { apiError, ok, withErrorHandling } from "@/lib/api-response";
import { getProgramExamsBySlug } from "@/server/queries/programs";
import { slugParamSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withErrorHandling(async () => {
    const { slug } = await params;
    const parsedSlug = slugParamSchema.parse(slug);

    const exams = await getProgramExamsBySlug(parsedSlug);
    if (exams === null) {
      return apiError("NOT_FOUND", `No program found for "${parsedSlug}".`);
    }
    return ok(exams);
  });
}
