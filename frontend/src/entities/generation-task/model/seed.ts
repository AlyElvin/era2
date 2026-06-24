import type { GenerationTask } from "./types";

const MINUTE_MS = 60_000;

/**
 * Создаёт стартовый набор задач очереди (11 шт.) в разных статусах,
 * чтобы экран при загрузке выглядел «живым».
 *
 * Порядок по `createdAt` согласован со статусами по логике FIFO:
 * самые старые задачи уже завершены (`done`/`failed`/`canceled`),
 * следом идут `running`, самые новые — `queued`.
 */
export function createSeedTasks(): GenerationTask[] {
  const now = Date.now();
  const minutesAgo = (m: number): number => now - m * MINUTE_MS;

  return [
    // ─── Завершённые (самые старые) ───
    {
      id: "task-01",
      type: "text",
      prompt: "Напиши короткое стихотворение про закат над морем",
      model: "GPT-4o",
      status: "done",
      progress: 100,
      createdAt: minutesAgo(42),
      credits: 5,
      durationMs: 7_400,
    },
    {
      id: "task-02",
      type: "image",
      prompt: "Минималистичный плакат: оранжевый круг на тёмном фоне, тонкая типографика",
      model: "Flux 1.1 Pro",
      status: "done",
      progress: 100,
      createdAt: minutesAgo(38),
      credits: 25,
      durationMs: 21_300,
      aspect: "4:3",
    },
    {
      id: "task-03",
      type: "audio",
      prompt: "Эмбиент-трек с тёплыми синтезаторами, медленный темп, без ударных",
      model: "Suno v4",
      status: "done",
      progress: 100,
      createdAt: minutesAgo(33),
      credits: 60,
      durationMs: 48_900,
    },
    // ─── Ошибка (старая) ───
    {
      id: "task-04",
      type: "video",
      prompt: "Дрон-облёт горящего костра в горах на закате, медленное кинематографичное движение",
      model: "Kling 2.0",
      status: "failed",
      progress: 64,
      createdAt: minutesAgo(28),
      credits: 75,
      error: "Превышено время ожидания",
      aspect: "16:9",
    },
    // ─── Отменённая ───
    {
      id: "task-05",
      type: "image",
      prompt: "Архитектура будущего: башня из стекла и меди в пустыне",
      model: "Midjourney v7",
      status: "canceled",
      progress: 18,
      createdAt: minutesAgo(24),
      credits: 45,
      aspect: "16:9",
    },
    // ─── В работе (с ненулевым прогрессом) ───
    {
      id: "task-06",
      type: "video",
      prompt:
        "Замедленная макросъёмка капли чернил, медленно растворяющейся в прозрачной воде: " +
        "тёмные вихри расходятся облаками, мягкий боковой свет, тёплый оранжевый отблеск на " +
        "поверхности, глубокий чёрный фон, ультрадетализация, плавное кинематографичное движение камеры",
      model: "Veo 3",
      status: "running",
      progress: 37,
      createdAt: minutesAgo(16),
      credits: 120,
      etaMs: 96_000,
      aspect: "9:16",
    },
    {
      id: "task-07",
      type: "text",
      prompt: "Объясни простыми словами, что такое квантовая запутанность",
      model: "Claude Sonnet 4.5",
      status: "running",
      progress: 72,
      createdAt: minutesAgo(13),
      credits: 8,
      etaMs: 4_000,
    },
    // ─── В очереди (самые новые) ───
    {
      id: "task-08",
      type: "image",
      prompt: "Кинематографичный портрет: воин на закате, песчаная буря, золотой свет",
      model: "Nano Banana",
      status: "queued",
      progress: 0,
      createdAt: minutesAgo(9),
      credits: 30,
      etaMs: 24_000,
      aspect: "1:1",
    },
    {
      id: "task-09",
      type: "text",
      prompt: "Слоган для кофейни в стиле минимализма",
      model: "Gemini 2.5 Pro",
      status: "queued",
      progress: 0,
      createdAt: minutesAgo(6),
      credits: 6,
      etaMs: 9_000,
    },
    {
      id: "task-10",
      type: "audio",
      prompt: "Голос рассказчика читает короткое вступление к подкасту о космосе",
      model: "ElevenLabs v3",
      status: "queued",
      progress: 0,
      createdAt: minutesAgo(3),
      credits: 40,
      etaMs: 18_000,
    },
    {
      id: "task-11",
      type: "video",
      prompt: "Город ночью с высоты птичьего полёта, неоновые огни, лёгкий дождь",
      model: "Sora 2",
      status: "queued",
      progress: 0,
      createdAt: minutesAgo(1),
      credits: 150,
      etaMs: 140_000,
      aspect: "16:9",
    },
  ];
}
