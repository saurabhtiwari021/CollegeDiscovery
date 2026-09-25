import { ok, withErrorHandling } from "@/lib/api-response";
import { destroySession } from "@/lib/auth";

export async function POST() {
  return withErrorHandling(async () => {
    await destroySession();
    return ok({ loggedOut: true });
  });
}
