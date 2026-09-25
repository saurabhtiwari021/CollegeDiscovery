import { ok, withErrorHandling } from "@/lib/api-response";
import { listStudyGoalsWithCounts } from "@/server/queries/goals";

export async function GET() {
  return withErrorHandling(async () => {
    const goals = await listStudyGoalsWithCounts();
    return ok(goals);
  });
}
