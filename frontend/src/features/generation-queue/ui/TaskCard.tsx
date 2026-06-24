import type { GenerationTask } from "@/entities/generation-task";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { TaskActions } from "./TaskActions";
import { TaskMeta } from "./TaskMeta";
import { TaskPreview } from "./TaskPreview";

export interface TaskCardProps {
  task: GenerationTask;
  queuePosition?: number | null;
  onCancel: () => void;
  onRetry: () => void;
  onDownload: () => void;
  onRemove: () => void;
}

/** Карточка задачи для mobile-раскладки (контент в стек). */
export function TaskCard({
  task,
  queuePosition,
  onCancel,
  onRetry,
  onDownload,
  onRemove,
}: TaskCardProps): React.ReactElement {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <TaskPreview type={task.type} className="size-11" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <StatusBadge status={task.status} className="self-start" />
          <p className="line-clamp-3 text-sm leading-snug text-foreground">{task.prompt}</p>
        </div>
      </div>

      <TaskMeta task={task} queuePosition={queuePosition} />

      {task.status === "running" && <ProgressBar value={task.progress} />}

      {task.status === "failed" && task.error !== undefined && (
        <p className="text-xs text-destructive">{task.error}</p>
      )}

      <div className="flex justify-end pt-1">
        <TaskActions
          status={task.status}
          onCancel={onCancel}
          onRetry={onRetry}
          onDownload={onDownload}
          onRemove={onRemove}
        />
      </div>
    </article>
  );
}
