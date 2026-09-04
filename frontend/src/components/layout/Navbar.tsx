"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Scale, Bookmark, LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCompare } from "@/context/CompareContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/compare", label: "Compare" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, ready } = useAuth();
  const { ids } = useCompare();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="container-content flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg text-navy-900">
          <GraduationCap className="h-5 w-5 text-marigold-dark" strokeWidth={1.75} />
          College&nbsp;Discovery
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded px-3 py-2 text-sm font-medium transition-colors",
                pathname?.startsWith(link.href)
                  ? "text-navy-900"
                  : "text-ink-muted hover:text-navy-900"
              )}
            >
              {link.label}
              {link.href === "/compare" && ids.length > 0 && (
                <span className="ml-1.5 rounded-sm bg-marigold px-1.5 py-0.5 text-[11px] font-semibold text-navy-950">
                  {ids.length}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/compare"
            className="relative flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-navy-800/[0.06] md:hidden"
            aria-label="Compare"
          >
            <Scale className="h-[18px] w-[18px]" />
            {ids.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-marigold text-[10px] font-semibold text-navy-950">
                {ids.length}
              </span>
            )}
          </Link>

          {!ready ? (
            <div className="h-8 w-20 animate-pulse rounded bg-line" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/saved"
                className="hidden items-center gap-1.5 rounded px-3 py-2 text-sm font-medium text-ink-muted hover:text-navy-900 sm:flex"
              >
                <Bookmark className="h-4 w-4" /> Saved
              </Link>
              <span className="hidden items-center gap-1.5 text-sm text-ink-muted lg:flex">
                <User className="h-4 w-4" /> {user.name.split(" ")[0]}
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium text-ink-muted hover:text-rose"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded px-3 py-2 text-sm font-medium text-ink-muted hover:text-navy-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded bg-navy-800 px-3.5 py-2 text-sm font-medium text-paper hover:bg-navy-900"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
