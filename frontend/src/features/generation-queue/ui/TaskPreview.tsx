import type { GenType } from "@/entities/generation-task";
import { cn } from "@/shared/lib/utils";
import { TaskTypeIcon } from "./TaskTypeIcon";

export interface TaskPreviewProps {
  type: GenType;
  className?: string;
}

/** Превью-плитка задачи: иконка типа на нейтральном фоне (заглушка для image/video). */
export function TaskPreview({ type, className }: TaskPreviewProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground",
        className,
      )}
    >
      <TaskTypeIcon type={type} className="size-5" />
    </div>
  );
}
