"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

export interface SavedRef {
  id: number;
  name: string;
  slug: string;
}

interface SavedContextValue {
  items: SavedRef[];
  isSaved: (id: number) => boolean;
  save: (college: SavedRef) => void;
  unsave: (id: number) => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

interface RawSavedItem {
  savedAt: string;
  college: {
    id: number;
    slug: string;
    name: string;
    rating: number | null;
    feesUgInr: number | null;
    placementAvgLpa: number | null;
    city: { name: string } | null;
    state: { name: string } | null;
  };
}

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<SavedRef[]>([]);

  // Load the real saved list from the backend once the session is known.
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetch("/api/saved-colleges", { credentials: "same-origin", cache: "no-store" })
      .then((res) => res.json())
      .then((body: { data?: RawSavedItem[] }) => {
        if (cancelled) return;
        const list = (body.data ?? []).map((s) => ({
          id: s.college.id,
          name: s.college.name,
          slug: s.college.slug,
        }));
        setItems(list);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user, ready]);

  // Optimistic update + fire-and-forget request, with rollback on failure —
  // keeps the same synchronous-looking call signature the UI already uses.
  const save = useCallback(
    (college: SavedRef) => {
      if (!user) return;
      setItems((prev) => (prev.some((i) => i.id === college.id) ? prev : [...prev, college]));
      fetch("/api/saved-colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ collegeId: college.id }),
      })
        .then((res) => {
          // fetch() only rejects on network-level failures — a 401/404/500
          // response still resolves, so we have to check res.ok ourselves
          // and roll back the optimistic update if the save didn't stick.
          if (!res.ok) {
            setItems((prev) => prev.filter((i) => i.id !== college.id));
          }
        })
        .catch(() => {
          setItems((prev) => prev.filter((i) => i.id !== college.id));
        });
    },
    [user]
  );

  const unsave = useCallback(
    (id: number) => {
      let removed: SavedRef | undefined;
      setItems((prev) => {
        removed = prev.find((i) => i.id === id);
        return prev.filter((i) => i.id !== id);
      });
      const rollback = () => {
        if (removed) {
          const r = removed;
          setItems((prev) => (prev.some((i) => i.id === r.id) ? prev : [...prev, r]));
        }
      };
      fetch(`/api/saved-colleges?collegeId=${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      })
        .then((res) => {
          if (!res.ok) rollback();
        })
        .catch(rollback);
    },
    []
  );

  const value = useMemo<SavedContextValue>(
    () => ({ items, isSaved: (id: number) => items.some((i) => i.id === id), save, unsave }),
    [items, save, unsave]
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}
