import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-content flex flex-col gap-4 py-10 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          College Discovery MVP — built on the Final V3 dataset (1,203 colleges, 54 programs, 12
          study goals).
        </p>
        <div className="flex items-center gap-5">
          <Link href="/discover" className="hover:text-navy-900">
            Discover
          </Link>
          <Link href="/compare" className="hover:text-navy-900">
            Compare
          </Link>
          <span className="text-ink-faint">Frontend demo · data is seeded, not live</span>
        </div>
      </div>
    </footer>
  );
}
