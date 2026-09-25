import { apiError, ok, withErrorHandling } from "@/lib/api-response";
import { requireUser, UnauthenticatedError } from "@/lib/auth";
import { savedCollegeBodySchema } from "@/lib/validation";
import { listSavedColleges, saveCollege, unsaveCollege } from "@/server/queries/saved-colleges";

export async function GET() {
  return withErrorHandling(async () => {
    try {
      const user = await requireUser();
      const saved = await listSavedColleges(user.id);
      return ok(saved);
    } catch (e) {
      if (e instanceof UnauthenticatedError) {
        return apiError("UNAUTHENTICATED", "Sign in to view your saved colleges.");
      }
      throw e;
    }
  });
}

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    try {
      const user = await requireUser();
      const body = savedCollegeBodySchema.parse(await request.json());
      const result = await saveCollege(user.id, body.collegeId);
      if (!result.ok) {
        return apiError("NOT_FOUND", `No college with id ${body.collegeId}.`);
      }
      return ok({ collegeId: body.collegeId, saved: true }, undefined, 201);
    } catch (e) {
      if (e instanceof UnauthenticatedError) {
        return apiError("UNAUTHENTICATED", "Sign in to save colleges.");
      }
      throw e;
    }
  });
}

export async function DELETE(request: Request) {
  return withErrorHandling(async () => {
    try {
      const user = await requireUser();
      const { searchParams } = new URL(request.url);
      const collegeId = Number(searchParams.get("collegeId"));
      if (!Number.isInteger(collegeId) || collegeId <= 0) {
        return apiError("BAD_REQUEST", "Query param collegeId must be a positive integer.");
      }
      await unsaveCollege(user.id, collegeId);
      return ok({ collegeId, saved: false });
    } catch (e) {
      if (e instanceof UnauthenticatedError) {
        return apiError("UNAUTHENTICATED", "Sign in to manage saved colleges.");
      }
      throw e;
    }
  });
}
