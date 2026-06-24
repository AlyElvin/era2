import { z } from "zod";
import type { GenerationTask } from "@/entities/generation-task";
import { STORAGE_KEY } from "./consts";

const generationTaskSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "image", "video", "audio"]),
  prompt: z.string(),
  model: z.string(),
  status: z.enum(["queued", "running", "done", "failed", "canceled"]),
  progress: z.number(),
  createdAt: z.number(),
  credits: z.number(),
  etaMs: z.number().optional(),
  durationMs: z.number().optional(),
  error: z.string().optional(),
  aspect: z.enum(["1:1", "16:9", "9:16", "4:3"]).optional(),
});

const tasksSchema = z.array(generationTaskSchema);

/** Безопасно читает и валидирует список задач из localStorage. */
export function loadTasksFromStorage(): GenerationTask[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const result = tasksSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Сохраняет список задач в localStorage (ошибки записи игнорируются). */
export function saveTasksToStorage(tasks: GenerationTask[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* квота/недоступность localStorage — игнорируем, это не критично для UI */
  }
}
