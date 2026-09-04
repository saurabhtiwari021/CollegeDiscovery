"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCompare, MAX_COMPARE } from "@/context/CompareContext";
import { CompareTable } from "@/components/compare/CompareTable";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { fetchCompare, type CompareCollege } from "@/lib/api-client";

export default function ComparePage() {
  const { items, ids, clear } = useCompare();
  const [colleges, setColleges] = useState<CompareCollege[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const loadComparison = useCallback(() => {
    if (ids.length < 2) {
      setColleges([]);
      return;
    }
    setStatus("loading");
    fetchCompare(ids)
      .then((result) => {
        setColleges(result.colleges);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [ids]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  return (
    <div className="container-content py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">Compare colleges</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Select 2–{MAX_COMPARE} colleges from Discover, then compare them side by side here.
          </p>
        </div>
        {items.length > 0 && (
          <button onClick={clear} className="text-sm text-ink-muted hover:text-rose">
            Clear selection
          </button>
        )}
      </div>

      {items.length < 2 && (
        <EmptyState
          title={items.length === 0 ? "No colleges selected yet" : "Add one more college"}
          description={
            items.length === 0
              ? "Browse Discover and tap “Compare” on at least two colleges to see them here."
              : `You’ve selected ${items.length} of ${MAX_COMPARE}. Add at least one more to compare.`
          }
        />
      )}

      {items.length >= 2 && status === "loading" && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {items.length >= 2 && status === "error" && (
        <ErrorState
          description="Could not load one or more colleges for comparison."
          onRetry={loadComparison}
        />
      )}

      {items.length >= 2 && status === "idle" && colleges.length >= 2 && (
        <CompareTable colleges={colleges} />
      )}

      <div className="mt-10">
        <LinkButton href="/discover" variant="secondary">
          {items.length === 0 ? "Browse colleges" : "Add another college"}
        </LinkButton>
      </div>
    </div>
  );
}
