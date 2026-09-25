"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Star, Bookmark, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSaved } from "@/context/SavedContext";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { fetchCollegeDetail } from "@/lib/api-client";
import type { CollegeDetailResponse } from "@/lib/types";
import { formatInr, formatRating } from "@/lib/utils";

export default function SavedPage() {
  const { user, ready } = useAuth();
  const { items, unsave } = useSaved();
  const router = useRouter();

  const [details, setDetails] = useState<CollegeDetailResponse[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?redirect=${encodeURIComponent("/saved")}`);
    }
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    if (items.length === 0) {
      setDetails([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    Promise.all(items.map((i) => fetchCollegeDetail(i.slug)))
      .then((results) => {
        setDetails(results);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [items, user]);

  if (!ready || !user) {
    return (
      <div className="container-content py-10">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-content py-10">
      <div className="mb-8 flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-teal-dark" />
        <h1 className="font-serif text-3xl text-ink">Saved colleges</h1>
      </div>

      {items.length === 0 && (
        <EmptyState
          title="You haven't saved any colleges yet"
          description="Tap “Save” on any college from Discover or a college page to keep it here."
        />
      )}

      {status === "loading" && items.length > 0 && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState description="Could not load your saved colleges." />}

      {status === "idle" && details.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {details.map((d) => (
            <li key={d.college.id} className="flex items-center justify-between gap-4 py-5">
              <div className="min-w-0">
                <Link
                  href={`/colleges/${d.college.slug}`}
                  className="font-serif text-lg text-ink hover:text-navy-800"
                >
                  {d.college.name}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                  {(d.college.city || d.college.state) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[d.college.city, d.college.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-marigold-dark">
                    <Star className="h-3.5 w-3.5 fill-marigold-dark" /> {formatRating(d.college.rating)}
                  </span>
                  <span>{formatInr(d.college.feesUgInr)}</span>
                </div>
              </div>
              <button
                onClick={() => unsave(d.college.id)}
                className="flex shrink-0 items-center gap-1.5 rounded border border-line-strong px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-rose hover:text-rose"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        <LinkButton href="/discover" variant="secondary">
          Browse more colleges
        </LinkButton>
      </div>
    </div>
  );
}
