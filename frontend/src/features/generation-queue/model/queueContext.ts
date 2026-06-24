import { createContext, useContext } from "react";
import type { GenerationTask } from "@/entities/generation-task";
import type { QueueState } from "./queueReducer";

export interface QueueContextValue {
  state: QueueState;
  /** Повторить инициализацию после ошибки загрузки. */
  retryInit: () => void;
  cancel: (id: string) => void;
  retry: (id: string) => void;
  /** Удаляет задачу и возвращает её (для возможного undo). */
  remove: (id: string) => GenerationTask | undefined;
  /** Удаляет все `done`-задачи и возвращает удалённые (для undo в issue 06). */
  clearDone: () => GenerationTask[];
  /** Восстанавливает задачи (undo/гидрация); `running` → `queued`. */
  restoreTasks: (tasks: GenerationTask[]) => void;
}

export const QueueContext = createContext<QueueContextValue | null>(null);

export function useQueueContext(): QueueContextValue {
  const ctx = useContext(QueueContext);
  if (!ctx) {
    throw new Error("useQueue/useQueueContext must be used within a QueueProvider");
  }
  return ctx;
}
