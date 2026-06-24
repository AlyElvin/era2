import { useState } from "react";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { GenType, GenerationTask } from "@/entities/generation-task";
import { cn } from "@/shared/lib/utils";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import { useLocation, useNavigate } from "@/shared/routing";
import { useQueue } from "../model/useQueue";
import { selectActiveSummary } from "../model/selectors";
import { formatPercent } from "../lib/formatEta";
import { ProgressBar } from "./ProgressBar";
import { TaskTypeIcon } from "./TaskTypeIcon";

const QUEUE_PATH = "/queue";

const TYPE_LABELS: Record<GenType, string> = {
  text: "Текст",
  image: "Изображение",
  video: "Видео",
  audio: "Аудио",
};

/**
 * Глобальный плавающий индикатор активных генераций.
 * Читает тот же стор, что и страница очереди (`useQueue` + `selectActiveSummary`) —
 * собственного состояния задач не держит.
 */
export function GenerationStatusBar(): React.ReactElement {
  const { tasks, status } = useQueue();
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [collapsed, setCollapsed] = useState(false);

  const summary = status === "ready" ? selectActiveSummary({ tasks, status }) : null;
  const isVisible = summary !== null && summary.activeCount > 0;

  const goToQueue = (): void => {
    if (location.pathname !== QUEUE_PATH) {
      navigate(QUEUE_PATH);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && summary && (
        <motion.div
          key="generation-status-bar"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
          className={cn(
            "fixed inset-x-0 bottom-0 z-[55] px-3 pb-[env(safe-area-inset-bottom)]",
            "lg:inset-x-auto lg:bottom-6 lg:right-6 lg:px-0 lg:pb-0",
          )}
        >
          <div className="mx-auto w-full max-w-[640px] lg:mx-0 lg:w-[340px]">
            {collapsed ? (
              <CollapsedPill
                count={summary.activeCount}
                percent={summary.avgProgress}
                onExpand={() => setCollapsed(false)}
              />
            ) : summary.activeCount === 1 && summary.sample[0] ? (
              <CompactCard task={summary.sample[0]} onOpen={goToQueue} />
            ) : (
              <ExpandedWidget
                count={summary.activeCount}
                percent={summary.avgProgress}
                sample={summary.sample}
                onOpen={goToQueue}
                onCollapse={() => setCollapsed(true)}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const cardShellClass =
  "rounded-t-2xl border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] lg:rounded-2xl";

interface CompactCardProps {
  task: GenerationTask;
  onOpen: () => void;
}

function CompactCard({ task, onOpen }: CompactCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Открыть очередь генераций"
      className={cn(
        cardShellClass,
        "flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-secondary/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TaskTypeIcon type={task.type} className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{TYPE_LABELS[task.type]}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate font-mono text-foreground/80">{task.model}</span>
        </span>
        <span
          className="mt-1.5 block"
          aria-live="polite"
          aria-label={`Прогресс ${formatPercent(task.progress)}`}
        >
          <ProgressBar value={task.progress} />
        </span>
      </span>
    </button>
  );
}

interface ExpandedWidgetProps {
  count: number;
  percent: number;
  sample: GenerationTask[];
  onOpen: () => void;
  onCollapse: () => void;
}

function ExpandedWidget({
  count,
  percent,
  sample,
  onOpen,
  onCollapse,
}: ExpandedWidgetProps): React.ReactElement {
  return (
    <section
      className={cn(cardShellClass, "overflow-hidden")}
      aria-label="Активные генерации"
    >
      <header className="flex items-center gap-2 px-4 pt-3.5">
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-primary motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p
          className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground tabular-nums"
          aria-live="polite"
        >
          Генерации идут · {count} активны · {formatPercent(percent)}
        </p>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Свернуть индикатор"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <ul className="mt-2.5 flex flex-col gap-2.5 px-4">
        {sample.map((task) => (
          <li key={task.id} className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <TaskTypeIcon type={task.type} className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-xs text-foreground/80">
                {task.model}
              </span>
              <ProgressBar value={task.progress} className="mt-1" />
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 px-4 pb-3.5">
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-primary/15 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Открыть очередь
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

interface CollapsedPillProps {
  count: number;
  percent: number;
  onExpand: () => void;
}

function CollapsedPill({ count, percent, onExpand }: CollapsedPillProps): React.ReactElement {
  return (
    <div className="flex justify-center lg:justify-end">
      <button
        type="button"
        onClick={onExpand}
        aria-label="Развернуть индикатор генераций"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2",
          "text-sm font-medium text-foreground shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] transition-colors hover:bg-secondary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <Loader2
          className="h-4 w-4 animate-spin text-primary motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="tabular-nums" aria-live="polite">
          {count} генераций · {formatPercent(percent)}
        </span>
      </button>
    </div>
  );
}
