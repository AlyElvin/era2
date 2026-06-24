import { cn } from "@/shared/lib/utils";
import { formatPercent } from "../lib/formatEta";

export interface ProgressBarProps {
  value: number;
  className?: string;
}

/** Полоса прогресса 0–100 с акцентной заливкой, плавным ростом и процентом. */
export function ProgressBar({ value, className }: ProgressBarProps): React.ReactElement {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-primary/15"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {formatPercent(clamped)}
      </span>
    </div>
  );
}
