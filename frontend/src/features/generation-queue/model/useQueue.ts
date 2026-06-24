import type { GenerationTask } from "@/entities/generation-task";
import type { QueueLoadStatus } from "./queueReducer";
import { useQueueContext } from "./queueContext";

export interface UseQueueResult {
  tasks: GenerationTask[];
  status: QueueLoadStatus;
  retryInit: () => void;
  cancel: (id: string) => void;
  retry: (id: string) => void;
  remove: (id: string) => GenerationTask | undefined;
  clearDone: () => GenerationTask[];
  restoreTasks: (tasks: GenerationTask[]) => void;
}

/** Публичный хук доступа к состоянию очереди и действиям. */
export function useQueue(): UseQueueResult {
  const { state, retryInit, cancel, retry, remove, clearDone, restoreTasks } = useQueueContext();
  return {
    tasks: state.tasks,
    status: state.status,
    retryInit,
    cancel,
    retry,
    remove,
    clearDone,
    restoreTasks,
  };
}
