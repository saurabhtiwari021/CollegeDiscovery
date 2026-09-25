import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-navy-800/[0.06] text-navy-800",
  marigold: "bg-marigold-50 text-marigold-dark",
  teal: "bg-teal-light text-teal-dark",
  rose: "bg-rose-light text-rose",
  outline: "border border-line-strong text-ink-muted",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
