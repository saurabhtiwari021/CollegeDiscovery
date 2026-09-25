"use client";

import { X } from "lucide-react";
import { pluralize } from "@/lib/utils";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Renders the "234 colleges found" strip with a removable chip per active
 * filter, so the URL-driven filter state (goal, program, exam, location,
 * fee cap, etc.) is legible rather than just a query string. Chips are
 * built by the caller (DiscoverPageClient) since only it has the labels
 * resolved and the URL-update logic to remove a single filter.
 */
export function FilterSummary({ total, chips }: { total: number; chips: FilterChip[] }) {
  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded border border-line bg-navy-800/[0.03] px-4 py-3">
      <span className="text-sm font-semibold text-ink">{pluralize(total, "college")} found</span>
      <span className="text-line-strong" aria-hidden="true">
        ·
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-white px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-rose hover:text-rose"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}
