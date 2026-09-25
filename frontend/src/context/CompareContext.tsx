"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";

const COMPARE_KEY = "cd_compare_items";
export const MAX_COMPARE = 3;

export interface CompareRef {
  id: number;
  name: string;
  slug: string;
}

interface CompareContextValue {
  items: CompareRef[];
  ids: number[];
  isSelected: (id: number) => boolean;
  toggle: (college: CompareRef) => { ok: boolean; reason?: "full" };
  remove: (id: number) => void;
  clear: () => void;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareRef[]>([]);
  // Mirror of `items` that is always current, so `toggle` can report
  // success/failure synchronously (a state-updater callback runs later, so a
  // result assigned inside it is never visible to the caller).
  const itemsRef = useRef<CompareRef[]>([]);
  // Don't write to localStorage until the stored value has been read —
  // otherwise the initial empty state (and React StrictMode's double effect
  // run in dev) overwrites the saved selection with [].
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPARE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          const valid = parsed
            .filter(
              (v): v is CompareRef =>
                !!v && typeof v.id === "number" && typeof v.slug === "string" && typeof v.name === "string"
            )
            .slice(0, MAX_COMPARE);
          itemsRef.current = valid;
          setItems(valid);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable (private mode / quota) — selection just won't persist
    }
  }, [items]);

  const commit = useCallback((next: CompareRef[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const toggle = useCallback(
    (college: CompareRef): { ok: boolean; reason?: "full" } => {
      const prev = itemsRef.current;
      if (prev.some((v) => v.id === college.id)) {
        commit(prev.filter((v) => v.id !== college.id));
        return { ok: true };
      }
      if (prev.length >= MAX_COMPARE) return { ok: false, reason: "full" };
      commit([...prev, college]);
      return { ok: true };
    },
    [commit]
  );

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      ids,
      isSelected: (id: number) => ids.includes(id),
      toggle,
      remove,
      clear,
      isFull: items.length >= MAX_COMPARE,
    }),
    [items, ids, toggle, remove, clear]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
