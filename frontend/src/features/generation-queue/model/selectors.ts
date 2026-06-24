import type { GenerationTask, TaskStatus } from "@/entities/generation-task";
import type { QueueState } from "./queueReducer";

export type VisibleFilter = TaskStatus | "all";
export type SortOrder = "newest" | "oldest";

export interface VisibleOptions {
  filter: VisibleFilter;
  sort: SortOrder;
  query: string;
}

export interface QueueCounts {
  queued: number;
  running: number;
  done: number;
  failed: number;
}

export interface ActiveSummary {
  /** Количество активных задач (running + queued). */
  activeCount: number;
  /** Усреднённый прогресс активных задач, 0–100 (queued учитываются как 0). */
  avgProgress: number;
  /** 2–3 активные задачи для превью (сначала running, затем queued по FIFO). */
  sample: GenerationTask[];
}

const ACTIVE_SAMPLE_SIZE = 3;

/** Счётчики по основным статусам. */
export function selectCounts(state: QueueState): QueueCounts {
  const counts: QueueCounts = { queued: 0, running: 0, done: 0, failed: 0 };
  for (const task of state.tasks) {
    switch (task.status) {
      case "queued":
        counts.queued += 1;
        break;
      case "running":
        counts.running += 1;
        break;
      case "done":
        counts.done += 1;
        break;
      case "failed":
        counts.failed += 1;
        break;
      default:
        break;
    }
  }
  return counts;
}

/** Фильтрация по статусу + поиск по подстроке промпта + сортировка по дате. */
export function selectVisible(state: QueueState, options: VisibleOptions): GenerationTask[] {
  const { filter, sort, query } = options;
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = state.tasks.filter((task) => {
    const matchesStatus = filter === "all" || task.status === filter;
    const matchesQuery =
      normalizedQuery.length === 0 || task.prompt.toLowerCase().includes(normalizedQuery);
    return matchesStatus && matchesQuery;
  });

  const sorted = [...filtered].sort((a, b) =>
    sort === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
  );

  return sorted;
}

/** Позиция queued-задачи в очереди (1-based, FIFO по createdAt). null — если не queued. */
export function selectQueuePosition(state: QueueState, id: string): number | null {
  const queued = state.tasks
    .filter((task) => task.status === "queued")
    .sort((a, b) => a.createdAt - b.createdAt);
  const index = queued.findIndex((task) => task.id === id);
  return index === -1 ? null : index + 1;
}

/** Сводка активных задач для глобального статус-бара. */
export function selectActiveSummary(state: QueueState): ActiveSummary {
  const running = state.tasks.filter((task) => task.status === "running");
  const queued = state.tasks
    .filter((task) => task.status === "queued")
    .sort((a, b) => a.createdAt - b.createdAt);

  const active = [...running, ...queued];
  const activeCount = active.length;

  const avgProgress =
    activeCount === 0
      ? 0
      : Math.round(active.reduce((sum, task) => sum + task.progress, 0) / activeCount);

  const sample = active.slice(0, ACTIVE_SAMPLE_SIZE);

  return { activeCount, avgProgress, sample };
}
