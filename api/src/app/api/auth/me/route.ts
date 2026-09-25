import { ok, withErrorHandling } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  return withErrorHandling(async () => {
    const user = await getCurrentUser();
    return ok({ user });
  });
}
