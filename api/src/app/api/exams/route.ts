import { ok, withErrorHandling } from "@/lib/api-response";
import { listExams } from "@/server/queries/exams";

export async function GET(request: Request) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(request.url);
    const program = searchParams.get("program") ?? undefined;
    const state = searchParams.get("state") ?? undefined;

    const exams = await listExams({ program, state });
    return ok(exams);
  });
}
