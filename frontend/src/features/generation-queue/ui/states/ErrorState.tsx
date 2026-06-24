import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export interface ErrorStateProps {
  onRetry: () => void;
  className?: string;
}

/** Состояние ошибки загрузки очереди с возможностью повторить. */
export function ErrorState({ onRetry, className }: ErrorStateProps): React.ReactElement {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center",
        className,
      )}
    >
      <AlertTriangle aria-hidden="true" className="size-10 text-destructive" />
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-foreground">Не удалось загрузить очередь</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Что-то пошло не так при загрузке данных. Попробуйте ещё раз.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw />
        Повторить
      </Button>
    </div>
  );
}
