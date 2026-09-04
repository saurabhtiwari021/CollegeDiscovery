"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type BaseProps = {
  id: string;
  label: string;
  error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "type">;

const inputClass =
  "mt-1 w-full rounded border border-line-strong bg-white px-3 py-2.5 text-sm focus:border-navy-800 focus:outline-none";

/** A labeled text input (email, name, ...) with an inline, screen-reader-announced error. */
export function TextField({ id, label, error, ...props }: BaseProps & { type?: string }) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(inputClass, error && "border-rose focus:border-rose")}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-rose">
          {error}
        </p>
      )}
    </div>
  );
}

/** A labeled password input with a show/hide toggle and an inline error. */
export function PasswordField({ id, label, error, ...props }: BaseProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-ink-muted">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(inputClass, "mt-0 pr-10", error && "border-rose focus:border-rose")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          tabIndex={0}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
