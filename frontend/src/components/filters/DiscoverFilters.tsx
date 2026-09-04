"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, RotateCcw } from "lucide-react";
import { fetchGoals, fetchProgramsForGoal, fetchExamsForProgram } from "@/lib/api-client";
import type { GoalCard, ProgramOption, ExamOption } from "@/lib/api-client";
import type { State, City, InstitutionType, OwnershipType } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface FilterValues {
  goal?: string;
  program?: string;
  exam?: string;
  state?: string;
  city?: string;
  /** Comma-separated ids, e.g. "3,5,9" — multi-select. */
  institutionType?: string;
  /** Comma-separated ids, e.g. "1,2" — multi-select. */
  ownership?: string;
  minFees?: string;
  maxFees?: string;
  minRating?: string;
  minPlacement?: string;
  sort?: string;
  q?: string;
  page?: string;
  limit?: string;
}

const FEES_CEILING = 3000000; // ₹30L slider ceiling; "maxFees" beyond this is left unset (no cap)

export const FEE_BREAKPOINTS: Array<{ value: number | undefined; label: string }> = [
  { value: 100000, label: "₹1L" },
  { value: 300000, label: "₹3L" },
  { value: 500000, label: "₹5L" },
  { value: 1000000, label: "₹10L" },
  { value: 2000000, label: "₹20L" },
  { value: undefined, label: "No cap" },
];

/** Compact "₹3L" / "₹45L" style string — no "Up to" prefix, no ceiling check. Used in chips and empty-state copy. */
export function formatFeeCompact(value: number): string {
  if (value >= 10000000) {
    const crores = value / 10000000;
    return `₹${crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2)}Cr`;
  }
  if (value >= 100000) {
    const lakhs = value / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

function formatFeesCap(value: number): string {
  if (value >= FEES_CEILING) return "No cap";
  return `Up to ${formatFeeCompact(value)}`;
}

// Exam scope values come straight from the backend (`examScope`) — never
// inferred client-side. Anything the backend sends that we don't recognize
// falls into "Other" rather than being dropped.
const EXAM_SCOPE_LABELS: Record<string, string> = {
  national: "National",
  state: "State-level",
  institution: "Institution-specific",
};
const EXAM_SCOPE_ORDER = ["national", "state", "institution", "other"];

function groupExamsByScope(exams: ExamOption[]) {
  const groups = new Map<string, ExamOption[]>();
  for (const exam of exams) {
    const key = exam.examScope && EXAM_SCOPE_LABELS[exam.examScope] ? exam.examScope : "other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(exam);
  }
  return EXAM_SCOPE_ORDER.filter((key) => groups.has(key)).map((key) => ({
    key,
    label: key === "other" ? "Other" : EXAM_SCOPE_LABELS[key],
    exams: groups.get(key)!,
  }));
}

function parseCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toggleCsvValue(current: string[], key: string): string[] {
  return current.includes(key) ? current.filter((v) => v !== key) : [...current, key];
}

function PillGroup<T extends { id: number; slug?: string; name: string }>({
  options,
  valueSlug,
  onSelect,
  getKey = (o) => o.slug ?? String(o.id),
  getLabel = (o) => o.name,
  emptyLabel,
}: {
  options: T[];
  valueSlug?: string;
  onSelect: (slug: string | undefined) => void;
  getKey?: (o: T) => string;
  getLabel?: (o: T) => string;
  emptyLabel?: string;
}) {
  if (options.length === 0) {
    return emptyLabel ? <p className="text-xs text-ink-faint">{emptyLabel}</p> : null;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const key = getKey(o);
        const active = valueSlug === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(active ? undefined : key)}
            className={cn(
              "rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "border-navy-800 bg-navy-800 text-paper"
                : "border-line-strong text-ink-muted hover:border-navy-800 hover:text-navy-800"
            )}
          >
            {getLabel(o)}
          </button>
        );
      })}
    </div>
  );
}

/** Checkbox-style multi-select — used for Institution Type and Ownership. */
function CheckboxGroup<T extends { id: number; slug?: string; name: string }>({
  options,
  selectedKeys,
  onToggle,
  getKey = (o) => String(o.id),
  getLabel = (o) => o.name,
  emptyLabel,
}: {
  options: T[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  getKey?: (o: T) => string;
  getLabel?: (o: T) => string;
  emptyLabel?: string;
}) {
  if (options.length === 0) {
    return emptyLabel ? <p className="text-xs text-ink-faint">{emptyLabel}</p> : null;
  }
  return (
    <div className="space-y-1.5">
      {options.map((o) => {
        const key = getKey(o);
        const checked = selectedKeys.includes(key);
        return (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(key)}
              className="h-4 w-4 rounded border-line-strong text-navy-800 focus:ring-1 focus:ring-navy-800"
            />
            {getLabel(o)}
          </label>
        );
      })}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  /** id of the control this labels — when set, renders a real <label> linked via htmlFor. */
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Tag = htmlFor ? "label" : "p";
  return (
    <div className="space-y-2">
      <Tag
        {...(htmlFor ? { htmlFor } : {})}
        className="block text-xs font-semibold uppercase tracking-wide text-ink-faint"
      >
        {label}
      </Tag>
      {children}
    </div>
  );
}

/** Numbered step used for the goal -> program -> exam progressive flow. */
function StepField({
  step,
  label,
  done,
  children,
}: {
  step: number;
  label: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2 border-l-2 pl-3", done ? "border-teal" : "border-navy-800/25")}>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-800">
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] text-paper",
            done ? "bg-teal" : "bg-navy-800"
          )}
        >
          {step}
        </span>
        {label}
      </p>
      {children}
    </div>
  );
}

export function DiscoverFilters({
  values,
  states,
  cities,
  institutionTypes,
  ownershipTypes,
  onClose,
}: {
  values: FilterValues;
  states: State[];
  cities: City[];
  institutionTypes: InstitutionType[];
  ownershipTypes: OwnershipType[];
  onClose?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // DiscoverFilters can be mounted twice at once (desktop aside + mobile
  // drawer), so ids must be unique per instance rather than hardcoded.
  const uid = useId();

  const [goals, setGoals] = useState<GoalCard[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [feesCap, setFeesCap] = useState<number>(
    values.maxFees ? Number(values.maxFees) : FEES_CEILING
  );

  useEffect(() => {
    fetchGoals().then(setGoals).catch(() => setGoals([]));
  }, []);

  useEffect(() => {
    if (!values.goal) {
      setPrograms([]);
      return;
    }
    fetchProgramsForGoal(values.goal).then(setPrograms).catch(() => setPrograms([]));
  }, [values.goal]);

  useEffect(() => {
    if (!values.program) {
      setExams([]);
      return;
    }
    fetchExamsForProgram(values.program).then(setExams).catch(() => setExams([]));
  }, [values.program]);

  const update = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(values as Record<string, string>);
      for (const [key, val] of Object.entries(patch)) {
        if (val === undefined || val === "") params.delete(key);
        else params.set(key, val);
      }
      params.delete("page"); // any filter change resets pagination
      router.push(`${pathname}?${params.toString()}`);
    },
    [values, router, pathname]
  );

  function handleGoalSelect(slug: string | undefined) {
    // Changing the goal invalidates any previously selected program/exam.
    update({ goal: slug, program: undefined, exam: undefined });
  }

  function handleProgramSelect(slug: string | undefined) {
    update({ program: slug, exam: undefined });
  }

  function handleInstitutionTypeToggle(key: string) {
    const next = toggleCsvValue(parseCsv(values.institutionType), key);
    update({ institutionType: next.length > 0 ? next.join(",") : undefined });
  }

  function handleOwnershipToggle(key: string) {
    const next = toggleCsvValue(parseCsv(values.ownership), key);
    update({ ownership: next.length > 0 ? next.join(",") : undefined });
  }

  const activeCount = Object.values(values).filter(Boolean).length;
  const examGroups = groupExamsByScope(exams);
  const selectedInstitutionTypes = parseCsv(values.institutionType);
  const selectedOwnershipTypes = parseCsv(values.ownership);

  return (
    <div className="flex h-full flex-col">
      {onClose && (
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-serif text-lg">Filters</span>
          <button onClick={onClose} aria-label="Close filters">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 md:px-0">
        <div className="space-y-5 rounded border border-line bg-navy-800/[0.02] p-4">
          <StepField step={1} label="What do you want to study?" done={Boolean(values.goal)}>
            <PillGroup
              options={goals}
              valueSlug={values.goal}
              onSelect={handleGoalSelect}
              getLabel={(g) => g.label}
            />
          </StepField>

          {values.goal && (
            <StepField step={2} label="Which program?" done={Boolean(values.program)}>
              <PillGroup
                options={programs}
                valueSlug={values.program}
                onSelect={handleProgramSelect}
                emptyLabel="Loading programs…"
              />
            </StepField>
          )}

          {values.program && (
            <StepField step={3} label="How do you want to get in?" done={Boolean(values.exam)}>
              {examGroups.length === 0 && (
                <p className="text-xs text-ink-faint">No specific exam options for this program.</p>
              )}
              <div className="space-y-3">
                {examGroups.map((group) => (
                  <div key={group.key} className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      {group.label}
                    </p>
                    <PillGroup
                      options={group.exams}
                      valueSlug={values.exam}
                      onSelect={(slug) => update({ exam: slug })}
                    />
                  </div>
                ))}
              </div>
            </StepField>
          )}
        </div>

        <Field label="State" htmlFor={`${uid}-state`}>
          <select
            id={`${uid}-state`}
            className="w-full rounded border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
            value={values.state ?? ""}
            onChange={(e) => update({ state: e.target.value || undefined, city: undefined })}
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        {values.state && (
          <Field label="City" htmlFor={`${uid}-city`}>
            <select
              id={`${uid}-city`}
              className="w-full rounded border border-line-strong bg-paper px-3 py-2 text-sm text-ink disabled:opacity-50"
              value={values.city ?? ""}
              onChange={(e) => update({ city: e.target.value || undefined })}
              disabled={cities.length === 0}
            >
              <option value="">All cities</option>
              {cities
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>
        )}

        <Field label="Institution type">
          <CheckboxGroup
            options={institutionTypes}
            selectedKeys={selectedInstitutionTypes}
            onToggle={handleInstitutionTypeToggle}
          />
        </Field>

        <Field label="Ownership">
          <CheckboxGroup
            options={ownershipTypes}
            selectedKeys={selectedOwnershipTypes}
            onToggle={handleOwnershipToggle}
          />
        </Field>

        <Field label="Maximum annual fee">
          <div className="flex flex-wrap gap-1.5">
            {FEE_BREAKPOINTS.map((bp) => {
              const active =
                bp.value === undefined
                  ? feesCap >= FEES_CEILING
                  : feesCap === bp.value;
              return (
                <button
                  key={bp.label}
                  type="button"
                  onClick={() => {
                    const next = bp.value ?? FEES_CEILING;
                    setFeesCap(next);
                    update({ maxFees: bp.value ? String(bp.value) : undefined });
                  }}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-navy-800 bg-navy-800 text-paper"
                      : "border-line-strong text-ink-muted hover:border-navy-800 hover:text-navy-800"
                  )}
                >
                  {bp.label}
                </button>
              );
            })}
          </div>

          <input
            type="range"
            min={0}
            max={FEES_CEILING}
            step={25000}
            list="fee-breakpoints"
            value={feesCap}
            onChange={(e) => setFeesCap(Number(e.target.value))}
            onMouseUp={() =>
              update({ maxFees: feesCap < FEES_CEILING ? String(feesCap) : undefined })
            }
            onTouchEnd={() =>
              update({ maxFees: feesCap < FEES_CEILING ? String(feesCap) : undefined })
            }
            className="mt-3 w-full"
            aria-label="Maximum annual fee"
          />
          <datalist id="fee-breakpoints">
            {FEE_BREAKPOINTS.filter((bp) => bp.value !== undefined).map((bp) => (
              <option key={bp.label} value={bp.value} label={bp.label} />
            ))}
          </datalist>
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>₹0</span>
            <span className="tabular-nums text-ink">{formatFeesCap(feesCap)}</span>
            <span>₹{FEES_CEILING / 100000}L</span>
          </div>
        </Field>

        <Field label="Minimum rating">
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={values.minRating ?? 0}
            onChange={(e) => update({ minRating: e.target.value === "0" ? undefined : e.target.value })}
            className="w-full"
            aria-label="Minimum rating"
          />
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Any</span>
            <span className="tabular-nums text-ink">{values.minRating ?? "0"}+</span>
          </div>
        </Field>

        <Field label="Minimum avg. placement (LPA)" htmlFor={`${uid}-minPlacement`}>
          <input
            id={`${uid}-minPlacement`}
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 5"
            value={values.minPlacement ?? ""}
            onChange={(e) => update({ minPlacement: e.target.value || undefined })}
            className="w-full rounded border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
          />
        </Field>

        <Field label="Sort by" htmlFor={`${uid}-sort`}>
          <select
            id={`${uid}-sort`}
            className="w-full rounded border border-line-strong bg-paper px-3 py-2 text-sm text-ink"
            value={values.sort ?? "relevance"}
            onChange={(e) => update({ sort: e.target.value === "relevance" ? undefined : e.target.value })}
          >
            <option value="relevance">Relevance</option>
            <option value="rating_desc">Rating: high to low</option>
            <option value="fees_asc">Fees: low to high</option>
            <option value="fees_desc">Fees: high to low</option>
            <option value="placement_desc">Avg. placement: high to low</option>
            <option value="nirf_asc">NIRF rank</option>
          </select>
        </Field>
      </div>

      {activeCount > 0 && (
        <div className="border-t border-line px-4 py-3 md:px-0">
          <button
            onClick={() => router.push(pathname)}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-line-strong py-2 text-sm font-medium text-ink-muted hover:border-rose hover:text-rose"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
