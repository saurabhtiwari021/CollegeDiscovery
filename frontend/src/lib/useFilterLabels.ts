"use client";

import { useEffect, useState } from "react";
import { fetchGoals, fetchProgramsForGoal, fetchExamsForProgram } from "@/lib/api-client";
import type { GoalCard, ProgramOption, ExamOption } from "@/lib/api-client";

// Goals is a short, near-static list — fetch it once per page load and share
// the in-flight/resolved promise across every caller instead of refetching
// per component.
let goalsPromise: Promise<GoalCard[]> | null = null;
function getGoalsCached(): Promise<GoalCard[]> {
  if (!goalsPromise) {
    goalsPromise = fetchGoals().catch((err) => {
      goalsPromise = null; // allow a retry on the next call
      throw err;
    });
  }
  return goalsPromise;
}

export interface ActiveFilterLabels {
  goal: string | null;
  program: string | null;
  exam: string | null;
}

/**
 * Resolves the goal/program/exam *slugs* carried in the URL into the
 * human-readable labels used to compose empty-state copy and filter chips.
 * Read-only — never touches the URL itself.
 */
export function useActiveFilterLabels(
  goalSlug?: string,
  programSlug?: string,
  examSlug?: string
): ActiveFilterLabels {
  const [goal, setGoal] = useState<string | null>(null);
  const [program, setProgram] = useState<string | null>(null);
  const [exam, setExam] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!goalSlug) {
      setGoal(null);
      return;
    }
    getGoalsCached()
      .then((list) => {
        if (cancelled) return;
        setGoal(list.find((g) => g.slug === goalSlug)?.label ?? null);
      })
      .catch(() => {
        if (!cancelled) setGoal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [goalSlug]);

  useEffect(() => {
    let cancelled = false;
    if (!goalSlug || !programSlug) {
      setProgram(null);
      return;
    }
    fetchProgramsForGoal(goalSlug)
      .then((list) => {
        if (cancelled) return;
        setProgram(list.find((p) => p.slug === programSlug)?.name ?? null);
      })
      .catch(() => {
        if (!cancelled) setProgram(null);
      });
    return () => {
      cancelled = true;
    };
  }, [goalSlug, programSlug]);

  useEffect(() => {
    let cancelled = false;
    if (!programSlug || !examSlug) {
      setExam(null);
      return;
    }
    fetchExamsForProgram(programSlug)
      .then((list) => {
        if (cancelled) return;
        setExam(list.find((e) => e.slug === examSlug)?.name ?? null);
      })
      .catch(() => {
        if (!cancelled) setExam(null);
      });
    return () => {
      cancelled = true;
    };
  }, [programSlug, examSlug]);

  return { goal, program, exam };
}

export type { GoalCard, ProgramOption, ExamOption };
