import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liveness/readiness probe for deploy platforms (Render, Railway, etc).
 * Runs a trivial query so a healthy response also confirms the DB
 * connection — not just that the Next.js process is up.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[health] database check failed:", err);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
