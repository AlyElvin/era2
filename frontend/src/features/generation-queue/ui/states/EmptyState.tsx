import { Inbox, SearchX, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type EmptyStateVariant = "no-tasks" | "no-results";

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  className?: string;
}

interface EmptyStateCopy {
  icon: LucideIcon;
  title: string;
  description: string;
}

const COPY: Record<EmptyStateVariant, EmptyStateCopy> = {
  "no-tasks": {
    icon: Inbox,
    title: "Очередь пуста",
    description: "Здесь появятся ваши задачи генерации.",
  },
  "no-results": {
    icon: SearchX,
    title: "Ничего не найдено",
    description: "Измените фильтр или поисковый запрос.",
  },
};

/** Осмысленное пустое состояние: «нет задач» либо «нет результатов под фильтром». */
export function EmptyState({ variant, className }: EmptyStateProps): React.ReactElement {
  const { icon: Icon, title, description } = COPY[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-10 text-muted-foreground/60" />
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
