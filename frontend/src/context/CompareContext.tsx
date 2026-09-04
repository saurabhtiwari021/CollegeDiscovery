"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPARE_KEY);
      if (raw) setItems(JSON.parse(raw) as CompareRef[]);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(items));
  }, [items]);

  const toggle = useCallback((college: CompareRef) => {
    let result: { ok: boolean; reason?: "full" } = { ok: true };
    setItems((prev) => {
      if (prev.some((v) => v.id === college.id)) return prev.filter((v) => v.id !== college.id);
      if (prev.length >= MAX_COMPARE) {
        result = { ok: false, reason: "full" };
        return prev;
      }
      return [...prev, college];
    });
    return result;
  }, []);

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
