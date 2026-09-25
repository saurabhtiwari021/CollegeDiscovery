import { apiError, ok, withErrorHandling } from "@/lib/api-response";
import { getCollegeReviewsBySlug } from "@/server/queries/colleges";
import { slugParamSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withErrorHandling(async () => {
    const { slug } = await params;
    const parsedSlug = slugParamSchema.parse(slug);

    const reviews = await getCollegeReviewsBySlug(parsedSlug);
    if (reviews === null) {
      return apiError("NOT_FOUND", `No college found for "${parsedSlug}".`);
    }
    return ok(reviews);
  });
}
