import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { GoalDirectory } from "@/components/discovery/GoalDirectory";
import { pluralize } from "@/lib/utils";
import { backendFetch } from "@/lib/server-api";
import { adaptGoal, type RawGoal } from "@/lib/adapters";
import type { State } from "@/lib/types";

async function getHomeData() {
  const [goalsBody, collegesBody] = await Promise.all([
    backendFetch<{ data: RawGoal[] }>("/api/goals"),
    backendFetch<{
      data: unknown[];
      pagination: { total: number };
      filters: { available: { states: State[] } };
    }>("/api/colleges?limit=1"),
  ]);

  const goals = goalsBody.data.map(adaptGoal);

  // No single endpoint returns the total distinct program count, so it's
  // derived from the union of programs mapped to every study goal.
  const programSlugs = new Set<string>();
  for (const g of goalsBody.data) {
    for (const p of g.programs) programSlugs.add(p.slug);
  }

  return {
    goals,
    activeColleges: collegesBody.pagination.total,
    programCount: programSlugs.size,
    studyGoalCount: goals.length,
    stateCount: collegesBody.filters.available.states.length,
  };
}

export default async function HomePage() {
  const { goals, activeColleges, programCount, studyGoalCount, stateCount } = await getHomeData();

  const stats = [
    { label: "Colleges", value: activeColleges },
    { label: "Programs", value: programCount },
    { label: "Study goals", value: studyGoalCount },
    { label: "States covered", value: stateCount },
  ];

  return (
    <div>
      <section className="border-b border-line bg-white">
        <div className="container-content grid grid-cols-1 gap-12 py-16 md:grid-cols-[1.3fr_1fr] md:py-24">
          <div>
            <h1 className="font-serif text-display-md text-ink md:text-display-lg">
              Find where you&rsquo;ll actually get in.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-muted">
              Search {pluralize(activeColleges, "college")} the way admissions actually work —
              by study goal, exact program, and the entrance exam each college accepts. No
              guesswork, no hidden eligibility.
            </p>

            <form action="/discover" className="mt-8 flex max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input
                  name="q"
                  type="text"
                  placeholder="Search by college name…"
                  className="w-full rounded border border-line-strong bg-paper py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-navy-800"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 rounded bg-navy-800 px-5 py-3 text-sm font-medium text-paper hover:bg-navy-900"
              >
                Search
              </button>
            </form>

            <Link
              href="/discover"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-800 hover:underline"
            >
              Or browse every college <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <dl className="flex flex-col justify-center gap-6 border-t border-line pt-8 md:border-l md:border-t-0 md:pl-12 md:pt-0">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-ink-muted">{s.label}</dt>
                <dd className="font-serif text-3xl tabular-nums text-navy-900">
                  {s.value.toLocaleString("en-IN")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-content py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-2xl text-ink">Select your study goal</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Counts are computed live from active college–program mappings.
            </p>
          </div>
        </div>
        <GoalDirectory goals={goals} />
      </section>
    </div>
  );
}
