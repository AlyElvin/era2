export type GenType = "text" | "image" | "video" | "audio";

export type TaskStatus = "queued" | "running" | "done" | "failed" | "canceled";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";

export interface GenerationTask {
  id: string;
  type: GenType;
  prompt: string;
  /** Название модели/провайдера, напр. "GPT-4o", "Flux 1.1 Pro". */
  model: string;
  status: TaskStatus;
  /** Прогресс выполнения, 0–100. */
  progress: number;
  /** Время создания, epoch ms (сериализуемо для localStorage). */
  createdAt: number;
  /** Стоимость задачи в кредитах. */
  credits: number;
  /** Оценка оставшегося времени, ms (для queued/running). */
  etaMs?: number;
  /** Фактическая длительность выполнения, ms (для done). */
  durationMs?: number;
  /** Текст ошибки для статуса failed. */
  error?: string;
  /** Соотношение сторон для image/video. */
  aspect?: AspectRatio;
}
