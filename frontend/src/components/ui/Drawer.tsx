"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null // skip hidden elements
  );
}

/**
 * Accessible slide-in panel used for the mobile filter drawer (and any
 * future dialog-like panel). Implements the pieces a raw `fixed inset-0`
 * div doesn't get for free: dialog semantics, a focus trap, Escape-to-close,
 * focus restored to whatever opened it, and a body scroll lock while open.
 */
export function Drawer({
  open,
  onClose,
  title,
  id,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog (announced by screen readers on open). */
  title: string;
  /** Optional id for the panel, so a trigger button can reference it via aria-controls. */
  id?: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const first = panel ? getFocusable(panel)[0] : undefined;
    (first ?? panel)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = focusable[0]!;
      const lastEl = focusable[focusable.length - 1]!;

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      } else if (!panel.contains(document.activeElement)) {
        // focus somehow escaped the panel — pull it back in
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-navy-950/40" onClick={onClose} aria-hidden="true" />
      <div
        id={id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-paper shadow-xl outline-none"
      >
        {children}
      </div>
    </div>
  );
}
