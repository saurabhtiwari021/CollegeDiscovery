import { apiError, ok, withErrorHandling } from "@/lib/api-response";
import { getCollegeBySlug } from "@/server/queries/colleges";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugParamSchema } from "@/lib/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withErrorHandling(async () => {
    const { slug } = await params;
    const parsedSlug = slugParamSchema.parse(slug);

    const college = await getCollegeBySlug(parsedSlug);
    if (!college) {
      return apiError("NOT_FOUND", `No college found for "${parsedSlug}".`);
    }

    const user = await getCurrentUser();
    let isSaved = false;
    if (user) {
      const saved = await prisma.savedCollege.findUnique({
        where: { userId_collegeId: { userId: user.id, collegeId: college.id } },
        select: { userId: true },
      });
      isSaved = Boolean(saved);
    }

    return ok({
      college: {
        id: college.id,
        name: college.name,
        slug: college.slug,
        shortName: college.shortName,
        location: {
          city: college.city?.name ?? null,
          state: college.state?.name ?? null,
          address: college.address,
          pincode: college.pincode,
        },
        rating: college.rating,
        fees: college.feesUgInr,
        type: college.institutionType?.name ?? null,
        ownership: college.ownership?.name ?? null,
        nirfRank: college.nirfRank,
        placementAvgLpa: college.placementAvgLpa,
        websiteUrl: college.websiteUrl,
        logoUrl: college.logoUrl,
        coverImageUrl: college.coverImageUrl,
      },
      detail: college.detail
        ? {
            overview: college.detail.overview,
            establishedYear: college.detail.establishedYear ?? college.establishedYear,
            accreditation: college.detail.accreditation ?? college.accreditation,
            facilities: college.detail.facilities,
            hostel: college.detail.hostelInfo,
            website: college.detail.websiteUrl ?? college.websiteUrl,
            sourceType: college.detail.sourceType,
            verificationStatus: college.detail.verificationStatus,
          }
        : {
            overview: null,
            establishedYear: college.establishedYear,
            accreditation: college.accreditation,
            facilities: null,
            hostel: null,
            website: college.websiteUrl,
          },
      programs: college.programs.map((cp) => ({
        id: cp.program.id,
        slug: cp.program.slug,
        name: cp.program.name,
        degreeLevel: cp.program.degreeLevel,
        annualFeeInr: cp.annualFeeInr,
        durationYears: cp.durationYears,
        eligibilityText: cp.eligibilityText,
        exams: cp.exams.map((e) => ({ slug: e.exam.slug, name: e.exam.name })),
      })),
      placements: college.placements.map((p) => ({
        year: p.year,
        averagePackageLpa: p.averagePackageLpa,
        medianPackageLpa: p.medianPackageLpa,
        highestPackageLpa: p.highestPackageLpa,
        placementRatePct: p.placementRatePct,
      })),
      reviews: college.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAt: r.createdAt,
      })),
      actions: {
        canSave: true,
        canCompare: true,
        isSaved,
      },
    });
  });
}
