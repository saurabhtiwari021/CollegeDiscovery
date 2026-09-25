"use client";

import { useRouter, usePathname } from "next/navigation";
import { Heart, Square, CheckSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSaved } from "@/context/SavedContext";
import { useCompare, MAX_COMPARE } from "@/context/CompareContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function CollegeActions({
  college,
}: {
  college: { id: number; name: string; slug: string };
}) {
  const { user } = useAuth();
  const { isSaved, save, unsave } = useSaved();
  const { isSelected, toggle, isFull } = useCompare();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const saved = isSaved(college.id);
  const selected = isSelected(college.id);

  function handleSave() {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    saved ? unsave(college.id) : save({ id: college.id, name: college.name, slug: college.slug });
  }

  function handleCompare() {
    const result = toggle({ id: college.id, name: college.name, slug: college.slug });
    if (!result.ok && result.reason === "full") {
      showToast({
        title: "Compare limit reached",
        description: `You can compare up to ${MAX_COMPARE} colleges. Remove one first.`,
        tone: "warning",
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant={saved ? "secondary" : "primary"}
        onClick={handleSave}
        className={cn(saved && "border-teal text-teal-dark hover:bg-teal-light")}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-teal-dark")} />
        {saved ? "Saved" : "Save college"}
      </Button>
      <Button
        variant={selected ? "secondary" : "secondary"}
        onClick={handleCompare}
        disabled={!selected && isFull}
        className={cn(selected && "border-navy-800 bg-navy-800 text-paper hover:bg-navy-900")}
      >
        {selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        {selected ? "Added to compare" : "Add to compare"}
      </Button>
    </div>
  );
}
