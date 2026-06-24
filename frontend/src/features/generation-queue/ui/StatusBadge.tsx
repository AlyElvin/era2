import type { TaskStatus } from "@/entities/generation-task";
import { cn } from "@/shared/lib/utils";

export interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const LABELS: Record<TaskStatus, string> = {
  queued: "В очереди",
  running: "Идёт",
  done: "Готово",
  failed: "Ошибка",
  canceled: "Отменено",
};

const STYLES: Record<TaskStatus, string> = {
  queued: "bg-muted text-muted-foreground border-border",
  running: "bg-primary/15 text-[#ff7a3d] border-primary/40",
  done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/40",
  canceled: "bg-muted/40 text-muted-foreground/70 border-border/60",
};

/** Бейдж статуса задачи генерации (цвет + русская подпись). */
export function StatusBadge({ status, className }: StatusBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none",
        STYLES[status],
        className,
      )}
    >
      {status === "running" && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot motion-reduce:animate-none"
        />
      )}
      {LABELS[status]}
    </span>
  );
}
