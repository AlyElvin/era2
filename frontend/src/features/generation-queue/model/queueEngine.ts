import type { GenType, GenerationTask } from "@/entities/generation-task";
import type { QueueAction } from "./queueReducer";
import {
  ERROR_MESSAGES,
  FAILURE_PROBABILITY,
  MAX_CONCURRENT,
  SCHEDULER_INTERVAL_MS,
  STEP_RANGE_BY_TYPE,
  TICK_MAX_MS,
  TICK_MIN_MS,
} from "./consts";

export interface QueueEngineDeps {
  /** Геттер актуального списка задач (через ref — без stale-closure). */
  getTasks: () => GenerationTask[];
  /** Единственный способ движка менять состояние. */
  dispatch: (action: QueueAction) => void;
}

export interface QueueEngineHandle {
  start: () => void;
  stop: () => void;
}

type TimerId = ReturnType<typeof setTimeout>;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomStep(type: GenType): number {
  const range = STEP_RANGE_BY_TYPE[type];
  return randomBetween(range.min, range.max);
}

function randomError(): string {
  const index = Math.floor(Math.random() * ERROR_MESSAGES.length);
  return ERROR_MESSAGES[index] ?? ERROR_MESSAGES[0];
}

/**
 * Мок-движок очереди. Не мутирует состояние напрямую — только через `dispatch`.
 * Заполняет свободные слоты (FIFO по `createdAt`), двигает прогресс `running`-задач
 * по-тиково, иногда роняет задачу в `failed`, завершает на 100. Все таймеры
 * чистятся в `stop()`; `cancel`/`remove` не приводят к «дотикам».
 */
export function createQueueEngine(deps: QueueEngineDeps): QueueEngineHandle {
  const { getTasks, dispatch } = deps;

  let scheduler: TimerId | undefined;
  let active = false;
  const tickTimers = new Map<string, TimerId>();
  const startedAt = new Map<string, number>();
  /**
   * «Судьба» каждого прогона задачи решается один раз: `null` — задача дойдёт до
   * конца, число — прогресс, на котором она упадёт в `failed`. Это даёт ≈15%
   * упавших задач (а не ≈15% на каждый тик, что роняло бы почти всё).
   */
  const failAt = new Map<string, number | null>();

  function forgetTask(id: string): void {
    startedAt.delete(id);
    failAt.delete(id);
  }

  function clearTaskTimer(id: string): void {
    const timer = tickTimers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      tickTimers.delete(id);
    }
  }

  function scheduleTick(id: string): void {
    if (!startedAt.has(id)) startedAt.set(id, Date.now());

    const timer = setTimeout(() => {
      tickTimers.delete(id);
      if (!active) return;

      const task = getTasks().find((candidate) => candidate.id === id);
      // Задача исчезла или больше не выполняется (cancel/remove/fail) — не «дотикиваем».
      if (!task || task.status !== "running") {
        forgetTask(id);
        return;
      }

      // Один раз решаем, упадёт ли задача и на каком прогрессе.
      if (!failAt.has(id)) {
        const willFail = Math.random() < FAILURE_PROBABILITY;
        const lower = Math.min(90, task.progress + 5);
        failAt.set(id, willFail ? randomBetween(lower, 95) : null);
      }

      const failThreshold = failAt.get(id);
      if (failThreshold != null && task.progress >= failThreshold) {
        forgetTask(id);
        dispatch({ type: "fail", id, error: randomError() });
        return;
      }

      const step = randomStep(task.type);
      if (task.progress + step >= 100) {
        const begin = startedAt.get(id);
        const durationMs = begin !== undefined ? Date.now() - begin : undefined;
        forgetTask(id);
        dispatch({ type: "complete", id, durationMs });
        return;
      }

      dispatch({ type: "tick", id, step });
      scheduleTick(id);
    }, randomBetween(TICK_MIN_MS, TICK_MAX_MS));

    tickTimers.set(id, timer);
  }

  function runSchedulerCycle(): void {
    if (!active) return;
    const tasks = getTasks();

    // Усыновляем уже выполняющиеся задачи (например, из сида/восстановления).
    for (const task of tasks) {
      if (task.status === "running" && !tickTimers.has(task.id)) {
        scheduleTick(task.id);
      }
    }

    const runningCount = tasks.filter((task) => task.status === "running").length;
    let freeSlots = MAX_CONCURRENT - runningCount;
    if (freeSlots <= 0) return;

    const queued = tasks
      .filter((task) => task.status === "queued")
      .sort((a, b) => a.createdAt - b.createdAt);

    for (const task of queued) {
      if (freeSlots <= 0) break;
      if (tickTimers.has(task.id)) continue;
      dispatch({ type: "start", id: task.id });
      scheduleTick(task.id);
      freeSlots -= 1;
    }
  }

  return {
    start(): void {
      if (active) return;
      active = true;
      runSchedulerCycle();
      scheduler = setInterval(runSchedulerCycle, SCHEDULER_INTERVAL_MS);
    },
    stop(): void {
      active = false;
      if (scheduler !== undefined) {
        clearInterval(scheduler);
        scheduler = undefined;
      }
      for (const id of [...tickTimers.keys()]) clearTaskTimer(id);
      startedAt.clear();
      failAt.clear();
    },
  };
}
