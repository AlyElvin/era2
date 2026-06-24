import type { GenType } from "@/entities/generation-task";

/** Максимум одновременно выполняющихся (`running`) задач. */
export const MAX_CONCURRENT = 2;

/** Нижняя/верхняя граница интервала между тиками прогресса (мс). */
export const TICK_MIN_MS = 400;
export const TICK_MAX_MS = 700;

/** Период планировщика движка: как часто заполняются свободные слоты (мс). */
export const SCHEDULER_INTERVAL_MS = 300;

/** Вероятность того, что задача упадёт за время выполнения (~15% на задачу, а не на тик). */
export const FAILURE_PROBABILITY = 0.15;

/**
 * Диапазон шага прогресса (в процентах) за один тик, зависит от типа.
 * video/audio «генерируются» заметно медленнее, чем text/image.
 */
export const STEP_RANGE_BY_TYPE: Record<GenType, { min: number; max: number }> = {
  text: { min: 9, max: 17 },
  image: { min: 6, max: 13 },
  audio: { min: 3, max: 6 },
  video: { min: 2, max: 5 },
};

/** Задержка эмуляции первичной загрузки сида (мс). */
export const INIT_DELAY_MS = 600;

/** Вероятность сбоя инициализации (эмуляция «не удалось загрузить»). */
export const INIT_FAILURE_PROBABILITY = 0.08;

/** Минимальный интервал между записями в localStorage (мс), чтобы не «дёргать» на каждом тике. */
export const PERSIST_THROTTLE_MS = 1000;

/** Ключ хранения состояния очереди в localStorage. */
export const STORAGE_KEY = "era2:generation-queue";

/** Варьируемые тексты ошибок для статуса `failed`. */
export const ERROR_MESSAGES: readonly string[] = [
  "Недостаточно кредитов",
  "Превышено время ожидания",
  "Модель временно недоступна",
  "Внутренняя ошибка генерации",
  "Запрос отклонён модерацией",
];
