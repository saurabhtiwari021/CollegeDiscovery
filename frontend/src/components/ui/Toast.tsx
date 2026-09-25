"use client";

import { X, TriangleAlert, CheckCircle2, Info } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const TONE_ICON = {
  neutral: Info,
  warning: TriangleAlert,
  success: CheckCircle2,
};

const TONE_STYLES = {
  neutral: "border-line-strong bg-white text-ink",
  warning: "border-marigold-dark/40 bg-marigold-50 text-navy-950",
  success: "border-teal/40 bg-teal-light text-teal-dark",
};

export function ToastStack() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((toast) => {
        const Icon = TONE_ICON[toast.tone ?? "neutral"];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded border px-4 py-3 shadow-lg",
              TONE_STYLES[toast.tone ?? "neutral"]
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs leading-snug opacity-80">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
