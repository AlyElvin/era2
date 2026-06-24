import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { createSeedTasks, type GenerationTask } from "@/entities/generation-task";
import { INIT_DELAY_MS, INIT_FAILURE_PROBABILITY, PERSIST_THROTTLE_MS } from "./consts";
import { createQueueEngine, type QueueEngineHandle } from "./queueEngine";
import { QueueContext, type QueueContextValue } from "./queueContext";
import { initialQueueState, queueReducer } from "./queueReducer";
import { loadTasksFromStorage, saveTasksToStorage } from "./queueStorage";

interface QueueProviderProps {
  children: ReactNode;
}

export function QueueProvider({ children }: QueueProviderProps) {
  const [state, dispatch] = useReducer(queueReducer, initialQueueState);

  // Актуальный снимок состояния для движка и колбэков — без stale-closure.
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Эмуляция первичной загрузки (с возможным сбоем инициализации) ──
  useEffect(() => {
    if (state.status !== "loading") return;
    let canceled = false;
    const timer = setTimeout(() => {
      if (canceled) return;
      if (Math.random() < INIT_FAILURE_PROBABILITY) {
        dispatch({ type: "initError" });
        return;
      }
      const stored = loadTasksFromStorage();
      if (stored && stored.length > 0) {
        dispatch({ type: "restoreTasks", tasks: stored });
      } else {
        dispatch({ type: "loaded", tasks: createSeedTasks() });
      }
    }, INIT_DELAY_MS);

    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [state.status]);

  // ── Запуск/остановка движка, когда очередь готова ──
  useEffect(() => {
    if (state.status !== "ready") return;
    const engine: QueueEngineHandle = createQueueEngine({
      getTasks: () => stateRef.current.tasks,
      dispatch,
    });
    engine.start();
    return () => engine.stop();
  }, [state.status]);

  // ── Персистентность с throttle (не пишем на каждый тик) ──
  const lastWriteRef = useRef(0);
  const pendingWriteRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (state.status !== "ready") return;

    const write = (): void => {
      lastWriteRef.current = Date.now();
      saveTasksToStorage(stateRef.current.tasks);
    };

    const elapsed = Date.now() - lastWriteRef.current;
    if (elapsed >= PERSIST_THROTTLE_MS) {
      write();
    } else {
      if (pendingWriteRef.current !== undefined) clearTimeout(pendingWriteRef.current);
      pendingWriteRef.current = setTimeout(write, PERSIST_THROTTLE_MS - elapsed);
    }

    return () => {
      if (pendingWriteRef.current !== undefined) {
        clearTimeout(pendingWriteRef.current);
        pendingWriteRef.current = undefined;
      }
    };
  }, [state.tasks, state.status]);

  // Финальная запись при размонтировании, чтобы не потерять последнее состояние.
  useEffect(() => {
    return () => {
      if (stateRef.current.status === "ready") {
        saveTasksToStorage(stateRef.current.tasks);
      }
    };
  }, []);

  const retryInit = useCallback(() => dispatch({ type: "retryInit" }), []);
  const cancel = useCallback((id: string) => dispatch({ type: "cancel", id }), []);
  const retry = useCallback((id: string) => dispatch({ type: "retry", id }), []);

  const remove = useCallback((id: string): GenerationTask | undefined => {
    const removed = stateRef.current.tasks.find((task) => task.id === id);
    dispatch({ type: "remove", id });
    return removed;
  }, []);

  const clearDone = useCallback((): GenerationTask[] => {
    const removed = stateRef.current.tasks.filter((task) => task.status === "done");
    dispatch({ type: "clearDone" });
    return removed;
  }, []);

  const restoreTasks = useCallback((tasks: GenerationTask[]) => {
    dispatch({ type: "restoreTasks", tasks });
  }, []);

  const value = useMemo<QueueContextValue>(
    () => ({ state, retryInit, cancel, retry, remove, clearDone, restoreTasks }),
    [state, retryInit, cancel, retry, remove, clearDone, restoreTasks],
  );

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}
