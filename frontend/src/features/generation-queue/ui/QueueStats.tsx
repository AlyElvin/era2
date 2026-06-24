import type { QueueCounts } from "../model/selectors";
import { cn } from "@/shared/lib/utils";

export interface QueueStatsProps {
  counts: QueueCounts;
  className?: string;
}

interface StatItem {
  key: keyof QueueCounts;
  label: string;
  valueClassName: string;
}

const STATS: StatItem[] = [
  { key: "queued", label: "В очереди", valueClassName: "text-foreground" },
  { key: "running", label: "Идёт", valueClassName: "text-[#ff7a3d]" },
  { key: "done", label: "Готово", valueClassName: "text-emerald-400" },
  { key: "failed", label: "Ошибка", valueClassName: "text-destructive" },
];

/** Сводка очереди: 4 счётчика. Mobile — сетка 2×2, desktop — ряд. */
export function QueueStats({ counts, className }: QueueStatsProps): React.ReactElement {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {STATS.map((stat) => (
        <div key={stat.key} className="rounded-xl border border-border bg-card p-4">
          <div
            className={cn(
              "font-mono text-2xl font-semibold tabular-nums leading-none",
              stat.valueClassName,
            )}
          >
            {counts[stat.key]}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
