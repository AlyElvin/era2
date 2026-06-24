import { Download, MoreHorizontal, RotateCcw, Trash2, X, type LucideIcon } from "lucide-react";
import type { TaskStatus } from "@/entities/generation-task";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";

export interface TaskActionsProps {
  status: TaskStatus;
  onCancel: () => void;
  onRetry: () => void;
  onDownload: () => void;
  onRemove: () => void;
  className?: string;
}

interface PrimaryAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

function getPrimaryAction(
  status: TaskStatus,
  handlers: Pick<TaskActionsProps, "onCancel" | "onRetry" | "onDownload">,
): PrimaryAction | null {
  switch (status) {
    case "running":
    case "queued":
      return { label: "Отмена", icon: X, onClick: handlers.onCancel };
    case "failed":
    case "canceled":
      return { label: "Повторить", icon: RotateCcw, onClick: handlers.onRetry };
    case "done":
      return { label: "Скачать", icon: Download, onClick: handlers.onDownload };
    default:
      return null;
  }
}

/** Действия над задачей: основное (по статусу) + меню «…» с «Удалить». */
export function TaskActions({
  status,
  onCancel,
  onRetry,
  onDownload,
  onRemove,
  className,
}: TaskActionsProps): React.ReactElement {
  const primary = getPrimaryAction(status, { onCancel, onRetry, onDownload });
  const isActive = status === "running" || status === "queued";
  const isRetryable = status === "failed" || status === "canceled";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {primary !== null && (
        <Button variant="ghost" size="sm" onClick={primary.onClick}>
          <primary.icon />
          {primary.label}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 [&_svg]:size-4"
            aria-label="Дополнительные действия"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {status === "done" && (
            <DropdownMenuItem onClick={onDownload}>
              <Download />
              Скачать
            </DropdownMenuItem>
          )}
          {isRetryable && (
            <DropdownMenuItem onClick={onRetry}>
              <RotateCcw />
              Повторить
            </DropdownMenuItem>
          )}
          {isActive && (
            <DropdownMenuItem onClick={onCancel}>
              <X />
              Отменить
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onRemove}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
