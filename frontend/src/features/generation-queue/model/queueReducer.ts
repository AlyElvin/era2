import type { GenerationTask } from "@/entities/generation-task";

/** Состояние загрузки очереди. */
export type QueueLoadStatus = "loading" | "ready" | "error";

export interface QueueState {
  tasks: GenerationTask[];
  status: QueueLoadStatus;
}

/**
 * Дискриминированный union экшенов очереди.
 * Все экшены сериализуемы и обрабатываются чистым редьюсером.
 */
export type QueueAction =
  | { type: "loaded"; tasks: GenerationTask[] }
  | { type: "initError" }
  | { type: "retryInit" }
  | { type: "tick"; id: string; step: number }
  | { type: "start"; id: string }
  | { type: "complete"; id: string; durationMs?: number }
  | { type: "fail"; id: string; error: string }
  | { type: "cancel"; id: string }
  | { type: "retry"; id: string }
  | { type: "remove"; id: string }
  | { type: "clearDone" }
  | { type: "restoreTasks"; tasks: GenerationTask[] };

export const initialQueueState: QueueState = {
  tasks: [],
  status: "loading",
};

/**
 * Нормализация задачи при восстановлении из хранилища: незавершённые `running`
 * переводятся в `queued` (прогресс сохраняется — движок продолжит с этого места).
 */
function normalizeRestored(task: GenerationTask): GenerationTask {
  if (task.status !== "running") return task;
  return { ...task, status: "queued" };
}

function updateTask(
  tasks: GenerationTask[],
  id: string,
  updater: (task: GenerationTask) => GenerationTask,
): GenerationTask[] {
  return tasks.map((task) => (task.id === id ? updater(task) : task));
}

/** Чистый редьюсер конечного автомата очереди. */
export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case "loaded":
      return { tasks: action.tasks, status: "ready" };

    case "initError":
      return { ...state, status: "error" };

    case "retryInit":
      return { tasks: [], status: "loading" };

    case "restoreTasks": {
      const incoming = action.tasks.map(normalizeRestored);
      const byId = new Map(state.tasks.map((task) => [task.id, task]));
      for (const task of incoming) byId.set(task.id, task);
      const tasks = [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
      return { tasks, status: "ready" };
    }

    case "tick":
      return {
        ...state,
        tasks: updateTask(state.tasks, action.id, (task) =>
          task.status === "running"
            ? { ...task, progress: Math.min(100, task.progress + action.step) }
            : task,
        ),
      };

    case "start":
      return {
        ...state,
        tasks: updateTask(state.tasks, action.id, (task) =>
          task.status === "queued" ? { ...task, status: "running" } : task,
        ),
      };

    case "complete":
      return {
        ...state,
        tasks: updateTask(state.tasks, action.id, (task) =>
          task.status === "running"
            ? {
                ...task,
                status: "done",
                progress: 100,
                etaMs: undefined,
                durationMs: action.durationMs ?? task.durationMs,
              }
            : task,
        ),
      };

    case "fail":
      return {
        ...state,
        tasks: updateTask(state.tasks, action.id, (task) =>
          task.status === "running"
            ? { ...task, status: "failed", error: action.error, etaMs: undefined }
            : task,
        ),
      };

    case "cancel":
      return {
        ...state,
        tasks: updateTask(state.tasks, action.id, (task) =>
          task.status === "running" || task.status === "queued"
            ? { ...task, status: "canceled", etaMs: undefined }
            : task,
        ),
      };

    case "retry":
      return {
        ...state,
        tasks: updateTask(state.tasks, action.id, (task) =>
          task.status === "failed" || task.status === "canceled"
            ? { ...task, status: "queued", progress: 0, error: undefined }
            : task,
        ),
      };

    case "remove":
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.id) };

    case "clearDone":
      return { ...state, tasks: state.tasks.filter((task) => task.status !== "done") };

    default:
      return state;
  }
}
