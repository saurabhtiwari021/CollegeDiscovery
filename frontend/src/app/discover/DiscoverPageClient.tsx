"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { DiscoverFilters, FEE_BREAKPOINTS, formatFeeCompact, type FilterValues } from "@/components/filters/DiscoverFilters";
import { FilterSummary, type FilterChip } from "@/components/filters/FilterSummary";
import { SearchBox } from "@/components/filters/SearchBox";
import { CollegeCard, CollegeCardSkeleton } from "@/components/colleges/CollegeCard";
import { EmptyState, ErrorState, type EmptyStateAction } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { Drawer } from "@/components/ui/Drawer";
import { fetchColleges } from "@/lib/api-client";
import { useActiveFilterLabels } from "@/lib/useFilterLabels";
import type { CollegeListResponse } from "@/lib/types";
import { pluralize } from "@/lib/utils";

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Next quick-select fee breakpoint strictly above `current` — undefined means "clear the cap entirely". */
function nextFeeBreakpoint(current: number): number | undefined {
  const defined = FEE_BREAKPOINTS.map((bp) => bp.value).filter((v): v is number => v !== undefined);
  return defined.find((v) => v > current);
}

export default function DiscoverPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values: FilterValues = Object.fromEntries(searchParams.entries());
  const [queryInput, setQueryInput] = useState(values.q ?? "");
  const debouncedQuery = useDebounced(queryInput, 350);

  const [response, setResponse] = useState<CollegeListResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const requestId = useRef(0);

  // sync debounced search text into the URL (without disturbing other filters)
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debouncedQuery === current) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery) params.set("q", debouncedQuery);
    else params.delete("q");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setStatus("loading");
    fetchColleges(searchParams.toString())
      .then((data) => {
        if (id !== requestId.current) return;
        setResponse(data);
        setStatus("idle");
      })
      .catch(() => {
        if (id !== requestId.current) return;
        setStatus("error");
      });
  }, [searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Shared "patch the URL's filter params" used by both the chip bar and the empty-state actions. */
  const updateParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(patch)) {
        if (val === undefined || val === "") params.delete(key);
        else params.set(key, val);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const availableStates = response?.filters.available.states ?? [];
  const availableCities = response?.filters.available.cities ?? [];
  const availableInstitutionTypes = response?.filters.available.institutionTypes ?? [];
  const availableOwnershipTypes = response?.filters.available.ownershipTypes ?? [];

  const activeFilterCount = Object.entries(values).filter(
    ([k, v]) => v && !["page", "limit", "q"].includes(k)
  ).length;

  // Human-readable labels for the goal/program/exam slugs carried in the URL —
  // used by both the filter-summary chips and the composed empty-state copy.
  const labels = useActiveFilterLabels(values.goal, values.program, values.exam);

  const stateName = availableStates.find((s) => String(s.id) === values.state)?.name ?? null;
  const cityName = availableCities.find((c) => String(c.id) === values.city)?.name ?? null;
  const selectedInstitutionTypeIds = values.institutionType ? values.institutionType.split(",") : [];
  const selectedOwnershipIds = values.ownership ? values.ownership.split(",") : [];

  // -------------------------------------------------------------------------
  // Filter summary chips
  // -------------------------------------------------------------------------
  const chips: FilterChip[] = useMemo(() => {
    const out: FilterChip[] = [];

    if (values.q) {
      out.push({
        key: "q",
        label: `"${values.q}"`,
        onRemove: () => {
          setQueryInput("");
          updateParams({ q: undefined });
        },
      });
    }
    if (values.goal) {
      out.push({
        key: "goal",
        label: labels.goal ?? "Goal",
        onRemove: () => updateParams({ goal: undefined, program: undefined, exam: undefined }),
      });
    }
    if (values.program) {
      out.push({
        key: "program",
        label: labels.program ?? "Program",
        onRemove: () => updateParams({ program: undefined, exam: undefined }),
      });
    }
    if (values.exam) {
      out.push({
        key: "exam",
        label: labels.exam ?? "Exam",
        onRemove: () => updateParams({ exam: undefined }),
      });
    }
    if (values.state) {
      out.push({
        key: "state",
        label: [cityName, stateName].filter(Boolean).join(", ") || "Location",
        onRemove: () => updateParams({ state: undefined, city: undefined }),
      });
    }
    for (const id of selectedInstitutionTypeIds) {
      const name = availableInstitutionTypes.find((t) => String(t.id) === id)?.name;
      if (!name) continue;
      out.push({
        key: `institutionType-${id}`,
        label: name,
        onRemove: () =>
          updateParams({
            institutionType:
              selectedInstitutionTypeIds.filter((v) => v !== id).join(",") || undefined,
          }),
      });
    }
    for (const id of selectedOwnershipIds) {
      const name = availableOwnershipTypes.find((t) => String(t.id) === id)?.name;
      if (!name) continue;
      out.push({
        key: `ownership-${id}`,
        label: name,
        onRemove: () =>
          updateParams({
            ownership: selectedOwnershipIds.filter((v) => v !== id).join(",") || undefined,
          }),
      });
    }
    if (values.maxFees) {
      out.push({
        key: "maxFees",
        label: `${formatFeeCompact(Number(values.maxFees))} max`,
        onRemove: () => updateParams({ maxFees: undefined }),
      });
    }
    if (values.minRating) {
      out.push({
        key: "minRating",
        label: `★ ${values.minRating}+`,
        onRemove: () => updateParams({ minRating: undefined }),
      });
    }
    if (values.minPlacement) {
      out.push({
        key: "minPlacement",
        label: `${values.minPlacement}+ LPA`,
        onRemove: () => updateParams({ minPlacement: undefined }),
      });
    }
    return out;
  }, [
    values.q,
    values.goal,
    values.program,
    values.exam,
    values.state,
    values.institutionType,
    values.ownership,
    values.maxFees,
    values.minRating,
    values.minPlacement,
    labels.goal,
    labels.program,
    labels.exam,
    stateName,
    cityName,
    selectedInstitutionTypeIds.join(","),
    selectedOwnershipIds.join(","),
    availableInstitutionTypes,
    availableOwnershipTypes,
    updateParams,
  ]);

  // -------------------------------------------------------------------------
  // Composed, specific empty-state copy + contextual actions
  // -------------------------------------------------------------------------
  const emptyState = useMemo(() => {
    if (activeFilterCount === 0 && !values.q) {
      return {
        title: "No colleges found",
        description: undefined as string | undefined,
        actions: [] as EmptyStateAction[],
      };
    }

    const subject = labels.program ?? labels.goal;
    const clauses: string[] = [];
    if (labels.exam) clauses.push(`for ${labels.exam}`);
    const location = [cityName, stateName].filter(Boolean).join(", ");
    if (location) clauses.push(`in ${location}`);
    if (values.maxFees) clauses.push(`under ${formatFeeCompact(Number(values.maxFees))}`);

    const lead = subject ? `No ${subject} colleges found` : "No colleges found";
    const title = clauses.length > 0 ? `${lead} ${clauses.join(" ")}.` : `${lead}.`;

    const actions: EmptyStateAction[] = [];
    if (values.exam) {
      actions.push({ label: "Clear Exam", onClick: () => updateParams({ exam: undefined }) });
    }
    if (values.maxFees) {
      actions.push({
        label: "Increase Fee",
        onClick: () => {
          const next = nextFeeBreakpoint(Number(values.maxFees));
          updateParams({ maxFees: next ? String(next) : undefined });
        },
      });
    }
    if (values.state || values.city) {
      actions.push({
        label: "Clear Location",
        onClick: () => updateParams({ state: undefined, city: undefined }),
      });
    }
    // Every other active filter (goal/program alone, rating, placement,
    // institution type, ownership, free-text search) has no single obvious
    // "loosen it" action — fall back to a full reset when nothing above applies.
    if (actions.length === 0) {
      actions.push({
        label: "Clear filters",
        onClick: () => {
          setQueryInput("");
          router.push(pathname);
        },
      });
    }

    return { title, description: undefined as string | undefined, actions };
  }, [
    activeFilterCount,
    values.q,
    values.exam,
    values.maxFees,
    values.state,
    values.city,
    labels.goal,
    labels.program,
    labels.exam,
    stateName,
    cityName,
    updateParams,
    router,
    pathname,
  ]);

  return (
    <div className="container-content py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchBox value={queryInput} onChange={setQueryInput} />
        <button
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls="mobile-filters-drawer"
          className="flex items-center justify-center gap-2 rounded border border-line-strong px-4 py-2.5 text-sm font-medium text-ink-muted hover:border-navy-800 hover:text-navy-800 md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-navy-800 px-1.5 text-xs text-paper">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-[240px_1fr]">
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <DiscoverFilters
              values={values}
              states={availableStates}
              cities={availableCities}
              institutionTypes={availableInstitutionTypes}
              ownershipTypes={availableOwnershipTypes}
            />
          </div>
        </aside>

        <section>
          {response && chips.length > 0 ? (
            <FilterSummary total={response.pagination.total} chips={chips} />
          ) : (
            <div className="mb-4 flex items-baseline justify-between">
              <p className="text-sm text-ink-muted">
                {status === "loading" && !response
                  ? "Loading colleges…"
                  : response
                  ? `${pluralize(response.pagination.total, "college")} found`
                  : null}
              </p>
            </div>
          )}

          {status === "error" && <ErrorState onRetry={load} />}

          {status !== "error" && status === "loading" && !response && (
            <div>
              {Array.from({ length: 6 }).map((_, i) => (
                <CollegeCardSkeleton key={i} />
              ))}
            </div>
          )}

          {status !== "error" && response && response.data.length === 0 && (
            <EmptyState
              title={emptyState.title}
              description={emptyState.description}
              actions={emptyState.actions}
            />
          )}

          {response && response.data.length > 0 && (
            <div className={status === "loading" ? "opacity-60 transition-opacity" : ""}>
              {response.data.map((college) => (
                <CollegeCard key={college.id} college={college} />
              ))}
              <Pagination
                page={response.pagination.page}
                totalPages={response.pagination.totalPages}
                onChange={goToPage}
              />
            </div>
          )}
        </section>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        id="mobile-filters-drawer"
      >
        <DiscoverFilters
          values={values}
          states={availableStates}
          cities={availableCities}
          institutionTypes={availableInstitutionTypes}
          ownershipTypes={availableOwnershipTypes}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
}
