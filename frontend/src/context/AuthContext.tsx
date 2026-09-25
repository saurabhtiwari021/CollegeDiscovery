"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface SessionUser {
  name: string;
  email: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ApiUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthErrorBody {
  error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
}

function toSessionUser(u: ApiUser | null | undefined): SessionUser | null {
  return u ? { name: u.name ?? u.email, email: u.email } : null;
}

/** Reads the standard { data } / { error } response shape used by every auth route. */
async function parseAuthResponse(
  res: Response
): Promise<{ ok: true; user: ApiUser | null } | { ok: false; message: string }> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body as AuthErrorBody | null)?.error;
    const firstFieldError = err?.fieldErrors ? Object.values(err.fieldErrors)[0]?.[0] : undefined;
    return { ok: false, message: firstFieldError ?? err?.message ?? "Something went wrong." };
  }
  return { ok: true, user: (body as { data: { user: ApiUser | null } }).data.user };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then((res) => res.json())
      .then((body: { data?: { user: ApiUser | null } }) => {
        if (cancelled) return;
        setUser(toSessionUser(body.data?.user));
      })
      .catch(() => {
        // Session couldn't be restored (e.g. backend unreachable) — treat as logged out.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password }),
    });
    const result = await parseAuthResponse(res);
    if (!result.ok) return { ok: false, message: result.message };
    setUser(toSessionUser(result.user));
    return { ok: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name, email, password }),
    });
    const result = await parseAuthResponse(res);
    if (!result.ok) return { ok: false, message: result.message };
    setUser(toSessionUser(result.user));
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
