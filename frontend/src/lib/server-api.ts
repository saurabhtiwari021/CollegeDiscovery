import "server-only";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export class BackendApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Fetches JSON directly from the backend. Only for use in Server Components
 * (page.tsx / generateMetadata) — the Next.js rewrite proxy in
 * next.config.mjs only intercepts real HTTP requests that hit the frontend
 * server, not internal fetch() calls made while rendering, so those calls
 * need the backend's absolute URL instead of a relative "/api/..." path.
 * Client components should keep using the relative paths in api-client.ts.
 */
export async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store", ...init });
  const body = await res.json();
  if (!res.ok) {
    const err = body?.error ?? {};
    throw new BackendApiError(err.code ?? "UNKNOWN", err.message ?? "Request failed.", res.status);
  }
  return body as T;
}
