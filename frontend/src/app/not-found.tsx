import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-content flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <SearchX className="h-8 w-8 text-ink-faint" strokeWidth={1.5} />
      <h1 className="font-serif text-2xl text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        The page you're looking for doesn't exist, or the college may have been removed.
      </p>
      <Link
        href="/discover"
        className="mt-2 rounded bg-navy-800 px-4 py-2 text-sm font-medium text-paper hover:bg-navy-900"
      >
        Browse colleges
      </Link>
    </div>
  );
}
