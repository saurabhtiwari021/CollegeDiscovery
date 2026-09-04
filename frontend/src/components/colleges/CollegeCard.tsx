"use client";

import Link from "next/link";
import { Star, MapPin, Landmark, Square, CheckSquare, Heart } from "lucide-react";
import type { CollegeSummary } from "@/lib/types";
import { formatInr, formatLpa, formatRank, formatRating, cn } from "@/lib/utils";
import { useCompare, MAX_COMPARE } from "@/context/CompareContext";
import { useAuth } from "@/context/AuthContext";
import { useSaved } from "@/context/SavedContext";
import { useToast } from "@/context/ToastContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function CollegeCard({ college }: { college: CollegeSummary }) {
  const { isSelected, toggle, isFull } = useCompare();
  const { user } = useAuth();
  const { isSaved, save, unsave } = useSaved();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected = isSelected(college.id);
  const saved = isSaved(college.id);

  function handleCompareToggle() {
    const result = toggle({ id: college.id, name: college.name, slug: college.slug });
    if (!result.ok && result.reason === "full") {
      showToast({
        title: "Compare limit reached",
        description: `You can compare up to ${MAX_COMPARE} colleges. Remove one first.`,
        tone: "warning",
      });
    }
  }

  function handleSaveToggle() {
    if (!user) {
      const redirect = `${pathname}?${searchParams.toString()}`;
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    saved
      ? unsave(college.id)
      : save({ id: college.id, name: college.name, slug: college.slug });
  }

  return (
    <div className="group relative flex flex-col gap-3 border-b border-line py-6 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/colleges/${college.slug}`}
            className="font-serif text-xl leading-snug text-ink hover:text-navy-800"
          >
            {college.name}
          </Link>
          {college.matchedProgram && (
            <p className="mt-1 text-sm font-semibold text-teal-dark">{college.matchedProgram.name}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
            {(college.city || college.state) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[college.city, college.state].filter(Boolean).join(", ")}
              </span>
            )}
            {college.institutionType && (
              <span className="inline-flex items-center gap-1">
                <Landmark className="h-3.5 w-3.5" />
                {college.institutionType}
              </span>
            )}
            {college.ownership && <span>{college.ownership}</span>}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 rounded-sm bg-marigold-50 px-2 py-1 text-sm font-semibold text-marigold-dark">
            <Star className="h-3.5 w-3.5 fill-marigold-dark text-marigold-dark" />
            {formatRating(college.rating)}
          </span>
          <span className="text-xs text-ink-faint">{formatRank(college.nirfRank)}</span>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-ink-faint">Fees</dt>
          <dd className="tabular-nums text-ink">{formatInr(college.feesUgInr)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-faint">Avg. placement</dt>
          <dd className="tabular-nums text-ink">{formatLpa(college.placementAvgLpa)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-faint">NIRF rank</dt>
          <dd className="tabular-nums text-ink">{formatRank(college.nirfRank)}</dd>
        </div>
      </dl>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleCompareToggle}
          disabled={!selected && isFull}
          className={cn(
            "inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
            selected
              ? "border-navy-800 bg-navy-800 text-paper"
              : "border-line-strong text-ink-muted hover:border-navy-800 hover:text-navy-800"
          )}
        >
          {selected ? (
            <CheckSquare className="h-3.5 w-3.5" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
          {selected ? "Added to compare" : "Compare"}
        </button>
        <button
          onClick={handleSaveToggle}
          className={cn(
            "inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors",
            saved
              ? "border-teal bg-teal-light text-teal-dark"
              : "border-line-strong text-ink-muted hover:border-teal hover:text-teal-dark"
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", saved && "fill-teal-dark")} />
          {saved ? "Saved" : "Save"}
        </button>
        <Link
          href={`/colleges/${college.slug}`}
          className="ml-auto text-xs font-medium text-navy-800 hover:underline"
        >
          View details →
        </Link>
      </div>
    </div>
  );
}

export function CollegeCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full space-y-2">
          <div className="skeleton h-6 w-3/5 rounded" />
          <div className="skeleton h-4 w-2/5 rounded" />
        </div>
        <div className="skeleton h-6 w-14 rounded-sm" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="skeleton h-8 rounded" />
        <div className="skeleton h-8 rounded" />
        <div className="skeleton h-8 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-7 w-24 rounded" />
        <div className="skeleton h-7 w-20 rounded" />
      </div>
    </div>
  );
}
