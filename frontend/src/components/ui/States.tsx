import { cn } from "@/lib/utils";
import { SearchX, TriangleAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actions,
}: {
  title: string;
  description?: string;
  /** Single-action shorthand — kept for existing call sites. */
  actionLabel?: string;
  onAction?: () => void;
  /** Multiple contextual actions (e.g. "Clear Exam", "Increase Fee", "Clear Location"). Takes priority over actionLabel/onAction when supplied. */
  actions?: EmptyStateAction[];
}) {
  const resolvedActions: EmptyStateAction[] =
    actions && actions.length > 0
      ? actions
      : actionLabel && onAction
      ? [{ label: actionLabel, onClick: onAction }]
      : [];

  return (
    <div className="flex flex-col items-center gap-3 rounded border border-dashed border-line-strong px-6 py-16 text-center">
      <SearchX className="h-7 w-7 text-ink-faint" strokeWidth={1.5} />
      <p className="whitespace-pre-line font-serif text-lg text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {resolvedActions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {resolvedActions.map((action) => (
            <Button key={action.label} variant="secondary" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Could not load colleges",
  description = "Something went wrong while fetching results.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded border border-rose-light bg-rose-light/40 px-6 py-16 text-center">
      <TriangleAlert className="h-7 w-7 text-rose" strokeWidth={1.5} />
      <p className="font-serif text-lg text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          Retry
        </Button>
      )}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded", className)} />;
}
