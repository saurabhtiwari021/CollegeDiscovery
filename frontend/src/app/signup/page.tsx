"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { TextField, PasswordField } from "@/components/ui/FormField";
import { validateSignupFields, type SignupFieldErrors } from "@/lib/validation";

function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/discover";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // guard against double-submit

    const errors = validateSignupFields(name, email, password, confirm);
    setFieldErrors(errors);
    setError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const result = await signup(name, email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not create account.");
      return;
    }
    router.push(redirect);
  }

  return (
    <div className="container-content flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <UserPlus className="mx-auto h-6 w-6 text-navy-800" strokeWidth={1.6} />
          <h1 className="mt-3 font-serif text-2xl text-ink">Create an account</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Takes a few seconds — no email verification required.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <TextField
            id="name"
            label="Name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          <PasswordField
            id="confirm"
            label="Confirm password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={fieldErrors.confirm}
          />

          {error && (
            <p className="rounded bg-rose-light px-3 py-2 text-sm text-rose" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="font-medium text-navy-800 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
