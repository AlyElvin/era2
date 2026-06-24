import { cn } from "@/shared/lib/utils";

export interface LoadingStateProps {
  rows?: number;
  className?: string;
}

const DEFAULT_ROWS = 4;

/** Скелетон-плейсхолдеры на время первичной загрузки очереди. */
export function LoadingState({ rows = DEFAULT_ROWS, className }: LoadingStateProps): React.ReactElement {
  const placeholders = Array.from({ length: rows }, (_, index) => index);

  return (
    <div role="status" aria-busy="true" className={cn("flex flex-col gap-3", className)}>
      <span className="sr-only">Загрузка очереди…</span>
      {placeholders.map((index) => (
        <div
          key={index}
          className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="size-12 shrink-0 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
          <div className="flex flex-1 flex-col gap-2 py-1">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted motion-reduce:animate-none" />
            <div className="h-1.5 w-full animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
