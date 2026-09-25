import { Suspense } from "react";
import type { Metadata } from "next";
import DiscoverPageClient from "./DiscoverPageClient";

export const metadata: Metadata = {
  title: "Discover colleges | College Discovery",
};

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="container-content py-16 text-ink-muted">Loading…</div>}>
      <DiscoverPageClient />
    </Suspense>
  );
}
