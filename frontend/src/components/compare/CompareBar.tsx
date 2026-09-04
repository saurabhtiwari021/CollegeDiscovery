"use client";

import Link from "next/link";
import { X, Scale } from "lucide-react";
import { useCompare, MAX_COMPARE } from "@/context/CompareContext";
import { pluralize } from "@/lib/utils";

export function CompareBar() {
  const { items, remove, clear } = useCompare();
  if (items.length === 0) return null;

  const isFull = items.length >= MAX_COMPARE;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-navy-950 text-paper shadow-[0_-8px_24px_rgba(13,26,43,0.25)]">
      <div className="container-content flex flex-wrap items-center gap-3 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Scale className="h-4 w-4 text-marigold" />
          {pluralize(items.length, "college")} selected
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {items.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1.5 rounded-sm bg-white/10 px-2 py-1 text-xs"
            >
              {item.name}
              <button onClick={() => remove(item.id)} aria-label={`Remove ${item.name} from compare`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        {isFull && (
          <p className="w-full text-xs text-marigold sm:w-auto">
            Maximum {MAX_COMPARE} colleges can be compared
          </p>
        )}
        <div className="ml-auto flex items-center gap-3">
          <button onClick={clear} className="text-xs text-white/70 hover:text-white">
            Clear
          </button>
          <Link
            href="/compare"
            className="rounded bg-marigold px-4 py-2 text-sm font-medium text-navy-950 hover:bg-marigold-dark"
          >
            {items.length < 2 ? "Add one more to compare" : "Compare"}
          </Link>
        </div>
      </div>
    </div>
  );
}
