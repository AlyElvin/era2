Status: done
Category: enhancement
Blocked-by: none

# Доменная сущность generation-task + стартовый сид

## What to build

Создать FSD-сущность `entities/generation-task`: доменные типы задачи генерации (тип контента, статус, сама задача) и стартовый сид из 8–12 задач в разных статусах, чтобы экран при загрузке был «живым». Публичный API — через `index.ts`.

## Acceptance criteria

- [ ] Есть `src/entities/generation-task/model/types.ts` с типами `GenType`, `TaskStatus`, `GenerationTask`.
- [ ] `GenType` = `'text' | 'image' | 'video' | 'audio'`.
- [ ] `TaskStatus` = `'queued' | 'running' | 'done' | 'failed' | 'canceled'`.
- [ ] `GenerationTask` содержит как минимум: `id`, `type`, `prompt`, `model` (название модели/провайдер), `status`, `progress` (0–100), `createdAt` (number, epoch ms — сериализуемо), `credits`, опционально `etaMs`/`durationMs`, `error?` (текст ошибки для failed), `aspect?`.
- [ ] Есть `src/entities/generation-task/model/seed.ts`, экспортирующий функцию-фабрику сида (8–12 задач): минимум 2 `running` с ненулевым прогрессом, несколько `queued`, несколько `done`, минимум 1 `failed`. Промпты — осмысленные, на русском, разной длины (есть длинный для проверки обрезки). Разные типы (text/image/video/audio) и модели.
- [ ] `createdAt` у задач различается (для проверки сортировки новые/старые) и согласован со статусами (FIFO выглядит логично).
- [ ] Есть `src/entities/generation-task/index.ts` — реэкспорт публичного API (типы + сид).
- [ ] Состояние сериализуемо: никаких `Date`, функций, классов в данных задачи (для localStorage). Используем `number` для времени.
- [ ] `yarn lint`, `yarn tsc --noEmit`, `yarn build` — зелёные.

## Agent Brief

**Category:** enhancement
**Summary:** Доменные типы и стартовый сид задач генерации в `entities/generation-task`.

**Current behavior:**
Сущности `generation-task` нет. Есть похожая `entities/generation` (другой домен — каталог/история генераций); НЕ переиспользовать её типы, создать отдельную сущность под очередь.

**Desired behavior:**
Самодостаточная FSD-сущность с доменными типами и сидом. Типы — единственный источник правды для всей фичи очереди (импортируются в `features/generation-queue` через публичный API `@/entities/generation-task`).

**Key interfaces:**
- `type GenType = 'text' | 'image' | 'video' | 'audio'`
- `type TaskStatus = 'queued' | 'running' | 'done' | 'failed' | 'canceled'`
- `interface GenerationTask { id: string; type: GenType; prompt: string; model: string; status: TaskStatus; progress: number; createdAt: number; credits: number; etaMs?: number; durationMs?: number; error?: string; aspect?: '1:1' | '16:9' | '9:16' | '4:3' }`
- `createSeedTasks(): GenerationTask[]` — детерминированный или псевдослучайный сид 8–12 задач.

**Acceptance criteria:** см. раздел выше.

**Out of scope:**
- Любая логика движка/редьюсера/селекторов (issue 02).
- UI-компоненты.
- Не трогать существующую `entities/generation`.

## Comments

> *Implementation complete — pending QA.*

**Changed areas:** `entities/generation-task` (new slice) — `model/types.ts` (`GenType`, `TaskStatus`, `AspectRatio`, `GenerationTask`), `model/seed.ts` (`createSeedTasks()` → 11 задач: 3 done, 1 failed, 1 canceled, 2 running с прогрессом, 4 queued; FIFO-согласованные `createdAt` как epoch ms), `index.ts` (публичный API).
**Validation:** lint ✅, type-check ✅, build ✅
