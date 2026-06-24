import type { GenerationTask } from "@/entities/generation-task";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { TaskActions } from "./TaskActions";
import { TaskMeta } from "./TaskMeta";
import { TaskPreview } from "./TaskPreview";

export interface TaskRowProps {
  task: GenerationTask;
  queuePosition?: number | null;
  onCancel: () => void;
  onRetry: () => void;
  onDownload: () => void;
  onRemove: () => void;
}

/** Строка задачи для desktop/tablet раскладки списка очереди. */
export function TaskRow({
  task,
  queuePosition,
  onCancel,
  onRetry,
  onDownload,
  onRemove,
}: TaskRowProps): React.ReactElement {
  return (
    <article className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40">
      <TaskPreview type={task.type} className="size-12" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 text-sm leading-snug text-foreground">{task.prompt}</p>
          <StatusBadge status={task.status} className="mt-0.5 shrink-0" />
        </div>

        <TaskMeta task={task} queuePosition={queuePosition} />

        {task.status === "running" && <ProgressBar value={task.progress} />}

        {task.status === "failed" && task.error !== undefined && (
          <p className="text-xs text-destructive">{task.error}</p>
        )}
      </div>

      <TaskActions
        status={task.status}
        onCancel={onCancel}
        onRetry={onRetry}
        onDownload={onDownload}
        onRemove={onRemove}
        className="shrink-0"
      />
    </article>
  );
}
