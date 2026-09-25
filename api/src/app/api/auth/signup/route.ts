import { apiError, ok, withErrorHandling } from "@/lib/api-response";
import { signupBodySchema } from "@/lib/validation";
import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  return withErrorHandling(async () => {
    const body = signupBodySchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return apiError("CONFLICT", "An account with that email already exists.");
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: { email: body.email, name: body.name, passwordHash },
      select: { id: true, email: true, name: true },
    });

    await createSession(user.id);
    return ok({ user }, undefined, 201);
  });
}
