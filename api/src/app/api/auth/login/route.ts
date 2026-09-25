import { apiError, ok, withErrorHandling } from "@/lib/api-response";
import { loginBodySchema } from "@/lib/validation";
import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = loginBodySchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.passwordHash || !(await verifyPassword(body.password, user.passwordHash))) {
      return apiError("UNAUTHENTICATED", "Invalid email or password.");
    }

    await createSession(user.id);
    return ok({ user: { id: user.id, email: user.email, name: user.name } });
  });
}
