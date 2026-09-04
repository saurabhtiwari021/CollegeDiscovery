"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { fetchCollegeSuggestions, type CollegeSuggestion } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Bolds the first case-insensitive occurrence of `query` inside `text`. */
function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold text-navy-800">{text.slice(idx, idx + q.length)}</strong>
      {text.slice(idx + q.length)}
    </>
  );
}

/**
 * The Discover search input plus a typeahead dropdown. Suggestions come
 * straight from /api/colleges/search-suggestions (name + alias matching
 * lives entirely server-side — this component just renders whatever comes
 * back). Picking a suggestion goes straight to that college's detail page;
 * typing without picking one still drives the normal list filtering via
 * `onChange`, exactly as before.
 */
export function SearchBox({
  value,
  onChange,
  placeholder = "Search colleges by name…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<CollegeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestId = useRef(0);

  // A shorter debounce than the page's own search-filter debounce — the
  // dropdown should feel responsive even while the URL/filter sync is still
  // waiting to fire.
  const debouncedValue = useDebouncedValue(value, 200);

  useEffect(() => {
    const q = debouncedValue.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    fetchCollegeSuggestions(q)
      .then((results) => {
        if (id !== requestId.current) return;
        setSuggestions(results);
        setActiveIndex(-1);
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setSuggestions([]);
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
      });
  }, [debouncedValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmed = value.trim();
  const open = focused && trimmed.length >= 2 && (suggestions.length > 0 || loading);

  function selectSuggestion(s: CollegeSuggestion) {
    setFocused(false);
    setSuggestions([]);
    router.push(`/colleges/${s.slug}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        const chosen = suggestions[activeIndex];
        if (chosen) {
          e.preventDefault();
          selectSuggestion(chosen);
        }
      }
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="college-search-suggestions"
        aria-activedescendant={activeIndex >= 0 ? `college-suggestion-${activeIndex}` : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded border border-line-strong bg-white py-2.5 pl-10 pr-9 text-sm text-ink placeholder:text-ink-faint focus:border-navy-800"
      />
      {loading && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-faint" />
      )}

      {open && (
        <ul
          id="college-search-suggestions"
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-80 w-full overflow-y-auto rounded border border-line-strong bg-white shadow-lg"
        >
          {suggestions.length === 0 && loading && (
            <li className="px-4 py-3 text-sm text-ink-faint">Searching…</li>
          )}
          {suggestions.map((s, i) => (
            <li key={s.id} id={`college-suggestion-${i}`} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // fire before the input's blur clears focus
                onClick={() => selectSuggestion(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "block w-full border-b border-line px-4 py-2.5 text-left text-sm transition-colors last:border-b-0",
                  i === activeIndex ? "bg-navy-800/[0.06]" : "hover:bg-navy-800/[0.04]"
                )}
              >
                <p className="text-ink">{highlightMatch(s.name, trimmed)}</p>
                {s.matchedAlias && s.matchedAlias.toLowerCase() !== s.name.toLowerCase() && (
                  <p className="mt-0.5 text-xs text-ink-faint">{highlightMatch(s.matchedAlias, trimmed)}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
