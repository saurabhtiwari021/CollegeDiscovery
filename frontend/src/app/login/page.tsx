"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { TextField, PasswordField } from "@/components/ui/FormField";
import { safeRedirect } from "@/lib/utils";
import { validateLoginFields, type LoginFieldErrors } from "@/lib/validation";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // guard against double-submit (e.g. double Enter)

    const errors = validateLoginFields(email, password);
    setFieldErrors(errors);
    setError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not log in.");
      return;
    }
    router.push(redirect);
  }

  return (
    <div className="container-content flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <LogIn className="mx-auto h-6 w-6 text-navy-800" strokeWidth={1.6} />
          <h1 className="mt-3 font-serif text-2xl text-ink">Log in</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Save colleges and pick up your comparisons later.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />

          {error && (
            <p className="rounded bg-rose-light px-3 py-2 text-sm text-rose" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirect)}`}
            className="font-medium text-navy-800 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
