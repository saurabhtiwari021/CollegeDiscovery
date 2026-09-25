"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CompareProvider } from "@/context/CompareContext";
import { SavedProvider } from "@/context/SavedContext";
import { ToastProvider } from "@/context/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <SavedProvider>
          <CompareProvider>{children}</CompareProvider>
        </SavedProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
