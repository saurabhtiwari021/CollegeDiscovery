import { apiError, ok, withErrorHandling } from "@/lib/api-response";
import { getCollegeProgramsBySlug } from "@/server/queries/colleges";
import { slugParamSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withErrorHandling(async () => {
    const { slug } = await params;
    const parsedSlug = slugParamSchema.parse(slug);

    const programs = await getCollegeProgramsBySlug(parsedSlug);
    if (programs === null) {
      return apiError("NOT_FOUND", `No college found for "${parsedSlug}".`);
    }
    return ok(
      programs.map((cp) => ({
        id: cp.program.id,
        slug: cp.program.slug,
        name: cp.program.name,
        degreeLevel: cp.program.degreeLevel,
        durationYears: cp.durationYears ?? cp.program.durationYearsDefault,
        annualFeeInr: cp.annualFeeInr,
        eligibilityText: cp.eligibilityText,
        exams: cp.exams.map((e) => ({ slug: e.exam.slug, name: e.exam.name })),
      }))
    );
  });
}
