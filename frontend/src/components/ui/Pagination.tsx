"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    if (i > 0 && p - (sorted[i - 1] as number) > 1) out.push("ellipsis");
    out.push(p);
  }
  return out;
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1 pt-8" aria-label="Pagination">
      <button
        className="flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-navy-800/[0.06] disabled:opacity-30"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="px-2 text-ink-faint">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              "h-9 min-w-9 rounded px-2 text-sm tabular-nums",
              p === page
                ? "bg-navy-800 text-paper"
                : "text-ink-muted hover:bg-navy-800/[0.06]"
            )}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        className="flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-navy-800/[0.06] disabled:opacity-30"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
