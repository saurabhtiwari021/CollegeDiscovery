"use client";

import Link from "next/link";
import {
  Cog,
  Briefcase,
  Calculator,
  BookOpen,
  FlaskConical,
  HeartPulse,
  Scale as ScaleIcon,
  Palette,
  Building2,
  Laptop,
  Pill,
  School,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { pluralize } from "@/lib/utils";
import type { GoalCard } from "@/lib/api-client";

const ICONS: Record<string, LucideIcon> = {
  engineering: Cog,
  management: Briefcase,
  commerce: Calculator,
  arts_humanities: BookOpen,
  science: FlaskConical,
  medicine_health: HeartPulse,
  law: ScaleIcon,
  design_creative: Palette,
  architecture_planning: Building2,
  computer_applications: Laptop,
  pharmacy: Pill,
  education: School,
};

/**
 * Study-goal cards for the landing page — a responsive grid (1 col mobile,
 * 2 cols tablet, 3-4 cols desktop) matching the reference layout. Counts
 * and program lists are computed live by the backend and passed straight
 * through — never hardcoded here.
 */
export function GoalDirectory({ goals }: { goals: GoalCard[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {goals.map((goal) => {
        const Icon = ICONS[goal.iconKey ?? ""] ?? BookOpen;
        return (
          <li key={goal.id}>
            <Link
              href={`/discover?goal=${goal.slug}`}
              className="group flex h-full flex-col gap-4 rounded border border-line bg-white p-5 transition-colors hover:border-navy-800 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-navy-800 transition-colors group-hover:border-navy-800 group-hover:bg-navy-800 group-hover:text-paper">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-navy-800" />
              </div>

              <div>
                <p className="font-serif text-xl text-ink">{goal.label}</p>
                <p className="mt-0.5 text-sm tabular-nums text-ink-faint">
                  {pluralize(goal.collegeCount, "college")}
                </p>
              </div>

              {goal.primaryPrograms.length > 0 && (
                <ul className="mt-auto space-y-1 border-t border-line pt-3 text-sm text-ink-muted">
                  {goal.primaryPrograms.slice(0, 4).map((program) => (
                    <li key={program} className="truncate">
                      {program}
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
