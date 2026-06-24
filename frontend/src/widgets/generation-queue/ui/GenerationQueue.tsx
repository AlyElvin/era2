import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { GenerationTask } from "@/entities/generation-task";
import { Button } from "@/shared/ui/button";
import { usePrefersReducedMotion } from "@/shared/hooks/usePrefersReducedMotion";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  QueueStats,
  QueueToolbar,
  TaskCard,
  TaskRow,
  selectCounts,
  selectQueuePosition,
  selectVisible,
  useQueue,
  type QueueState,
  type SortOrder,
  type VisibleFilter,
} from "@/features/generation-queue";

/** Виджет очереди: композиция стора, тулбара и адаптивного списка задач. */
export function GenerationQueue(): React.ReactElement {
  const { tasks, status, retryInit, cancel, retry, remove, clearDone, restoreTasks } = useQueue();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [filter, setFilter] = useState<VisibleFilter>("all");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [query, setQuery] = useState<string>("");

  const queueState = useMemo<QueueState>(() => ({ tasks, status }), [tasks, status]);
  const counts = useMemo(() => selectCounts(queueState), [queueState]);
  const visible = useMemo(
    () => selectVisible(queueState, { filter, sort, query }),
    [queueState, filter, sort, query],
  );

  const handleDownload = (): void => {
    // Скачивание результата — заглушка (вне рамок этой задачи).
  };

  const handleRemove = (task: GenerationTask): void => {
    const removed = remove(task.id);
    if (removed) {
      toast("Задача удалена", {
        action: { label: "Отменить", onClick: () => restoreTasks([removed]) },
      });
    }
  };

  const handleClearDone = (): void => {
    const removed = clearDone();
    if (removed.length) {
      toast(`Удалено готовых: ${removed.length}`, {
        action: { label: "Отменить", onClick: () => restoreTasks(removed) },
      });
    }
  };

  const motionProps = prefersReducedMotion
    ? {
        initial: false as const,
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8, scale: 0.98 },
        transition: { duration: 0.22, ease: "easeOut" as const },
      };

  const renderBody = (): React.ReactElement => {
    if (status === "loading") {
      return <LoadingState />;
    }
    if (status === "error") {
      return <ErrorState onRetry={retryInit} />;
    }
    if (visible.length === 0) {
      return <EmptyState variant={tasks.length === 0 ? "no-tasks" : "no-results"} />;
    }

    return (
      <>
        <div className="hidden flex-col gap-3 lg:flex">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((task) => (
              <motion.div key={task.id} layout={!prefersReducedMotion} {...motionProps}>
                <TaskRow
                  task={task}
                  queuePosition={
                    task.status === "queued" ? selectQueuePosition(queueState, task.id) : undefined
                  }
                  onCancel={() => cancel(task.id)}
                  onRetry={() => retry(task.id)}
                  onDownload={handleDownload}
                  onRemove={() => handleRemove(task)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-3 lg:hidden">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((task) => (
              <motion.div key={task.id} layout={!prefersReducedMotion} {...motionProps}>
                <TaskCard
                  task={task}
                  queuePosition={
                    task.status === "queued" ? selectQueuePosition(queueState, task.id) : undefined
                  }
                  onCancel={() => cancel(task.id)}
                  onRetry={() => retry(task.id)}
                  onDownload={handleDownload}
                  onRemove={() => handleRemove(task)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </>
    );
  };

  return (
    <main className="min-h-[calc(100vh-var(--header-height,64px))]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pb-12 pt-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Очередь генераций</h1>
            <p className="text-sm text-muted-foreground">
              Отслеживайте прогресс и управляйте задачами генерации.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearDone}
            disabled={counts.done === 0}
            className="shrink-0"
          >
            <Trash2 />
            Очистить готовые
          </Button>
        </header>

        <QueueStats counts={counts} />

        <QueueToolbar
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          query={query}
          onQueryChange={setQuery}
          counts={counts}
        />

        <section aria-label="Список задач">{renderBody()}</section>
      </div>
    </main>
  );
}
