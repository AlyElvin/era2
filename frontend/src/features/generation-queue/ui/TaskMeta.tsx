import type { GenerationTask } from "@/entities/generation-task";
import { cn } from "@/shared/lib/utils";
import { formatCredits, formatEta } from "../lib/formatEta";

export interface TaskMetaProps {
  task: GenerationTask;
  queuePosition?: number | null;
  className?: string;
}

function buildMetaItems(task: GenerationTask, queuePosition?: number | null): string[] {
  const items: string[] = [`${formatCredits(task.credits)}\u00A0кр.`];

  if (task.status === "queued" && typeof queuePosition === "number") {
    items.push(`№${queuePosition} в очереди`);
  }
  if (task.status === "running" && typeof task.etaMs === "number") {
    items.push(`осталось ${formatEta(task.etaMs)}`);
  }
  if (task.status === "done" && typeof task.durationMs === "number") {
    items.push(`за ${formatEta(task.durationMs)}`);
  }

  return items;
}

/** Пилюля модели + мета (кредиты / ETA / длительность / позиция в очереди). */
export function TaskMeta({ task, queuePosition, className }: TaskMetaProps): React.ReactElement {
  const items = buildMetaItems(task, queuePosition);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] leading-none text-foreground/80">
        {task.model}
      </span>
      <span>{items.join(" · ")}</span>
    </div>
  );
}
