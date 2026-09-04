"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: "neutral" | "warning" | "success";
}

interface ToastItem extends ToastInput {
  id: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
