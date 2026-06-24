Status: done
Category: enhancement
Blocked-by: 01-domain-entity-and-seed.md

# Движок очереди + стор (reducer / engine / provider / selectors / useQueue)

## What to build

Вся бизнес-логика очереди в `features/generation-queue/model/`: конечный автомат статусов (reducer), мок-движок обработки (engine: тики, слоты, таймеры, сбои, чистка), глобальный провайдер (Context + useReducer, запуск движка, персистентность localStorage, эмуляция загрузки/ошибки инициализации), селекторы (счётчики, фильтр, сортировка, поиск) и публичный хук `useQueue`. Плюс `lib/formatEta.ts` (форматтеры времени/кредитов). Публичный API — `index.ts`.

## Acceptance criteria

- [ ] `model/queueReducer.ts`: чистый редьюсер с типизированными экшенами. Переходы: добавить задачу; `tick` (рост прогресса конкретной задачи); `start` (queued→running); `complete` (running→done, progress=100); `fail` (running→failed с текстом ошибки); `cancel` (running|queued→canceled, прогресс замораживается); `retry` (failed|canceled→queued, progress=0, error очищается); `remove` (удалить по id); `clearDone` (удалить все done); `restore`/`hydrate` (загрузка из localStorage с переводом running→queued); init success/error.
- [ ] `MAX_CONCURRENT = 2` вынесен в `consts.ts` (или верх reducer/engine) как именованная константа; не более 2 задач `running` одновременно.
- [ ] `model/queueEngine.ts`: при свободном слоте берёт следующую `queued` по FIFO (`createdAt`), переводит в `running`; прогресс растёт тиками ~400–700 мс на случайный шаг; достиг 100 → `done`; ~15% вероятность `failed` с варьируемым текстом («Недостаточно кредитов», «Превышено время ожидания», «Модель временно недоступна»); video/audio заметно дольше text/image; интервалы/таймеры чистятся при остановке/размонтировании; `cancel` немедленно прекращает прогресс задачи без «дотиков».
- [ ] Движок не мутирует state напрямую — только через dispatch экшенов (единый источник правды).
- [ ] `model/QueueProvider.tsx`: Context + `useReducer`; запускает движок; эмулирует первичную загрузку сида с задержкой ~600 мс (`status: 'loading'`) и возможным сбоем инициализации (`status: 'error'` с возможностью повторить); подписан на персистентность.
- [ ] Персистентность: состояние пишется в `localStorage` (ключ `era2:generation-queue`), восстанавливается при старте; `running` при восстановлении → `queued`. Запись не должна происходить на каждый тик слишком агрессивно (throttle/debounce или запись на значимых переходах — на усмотрение, но без «дёрганья»).
- [ ] `model/selectors.ts`: счётчики по статусам (queued/running/done/failed), фильтрация по статусу, сортировка (newest/oldest минимум), поиск по подстроке промпта, позиция в очереди для queued, усреднённый прогресс активных (running+queued) для статус-бара.
- [ ] `model/useQueue.ts`: публичный хук, отдаёт состояние (список, статус загрузки) и действия (`cancel`, `retry`, `remove`, `clearDone`, `addTask?`), плюс производные через селекторы или отдельные хуки/функции.
- [ ] `lib/formatEta.ts`: форматтеры (мс → `~12s` / `1m 20s`, кредиты, проценты). Чистые функции.
- [ ] `index.ts` экспортирует публичный API: `QueueProvider`, `useQueue`, нужные селекторы/типы экшенов/`formatEta`. Без deep-import снаружи.
- [ ] `yarn lint`, `yarn tsc --noEmit`, `yarn build` — зелёные. Strict TS, без `any`.

## Agent Brief

**Category:** enhancement
**Summary:** Единый стор и мок-движок очереди (Context + useReducer) — мозг фичи.

**Current behavior:**
Логики очереди нет.

**Desired behavior:**
Единый источник правды: один `QueueProvider`, монтируемый глобально (монтирование — в issue 04). И страница, и глобальный статус-бар читают этот стор через `useQueue`/селекторы. Движок детерминирован по правилам автомата, корректно чистит ресурсы, эмулирует асинхронность без сетевых вызовов.

**Key interfaces:**
- Импорт типов из `@/entities/generation-task` (публичный API).
- `QueueAction` — дискриминированный union экшенов.
- `QueueState { tasks: GenerationTask[]; status: 'loading' | 'ready' | 'error' }`.
- `useQueue()` → `{ tasks, status, retryInit, cancel(id), retry(id), remove(id), clearDone(), restoreClearedDone(snapshot)? }` (последнее — для undo, согласовать с issue 06; как минимум `clearDone` должен возвращать удалённые задачи или принимать механизм восстановления).
- `selectCounts(state)`, `selectVisible(state, { filter, sort, query })`, `selectActiveSummary(state)` (N активных, X% средний прогресс).
- `formatEta(ms)`, `formatCredits(n)`.

**State/architecture rules:**
- Вся бизнес-логика только в `model/` — компоненты «тупые».
- Состояние сериализуемо (для localStorage) — без `Date`/функций/классов.
- Чистка всех таймеров в эффектах (`useEffect` cleanup / при остановке движка).
- Использовать `useReducer`; движок — через `dispatch`, желательно ref на актуальный state или функциональные апдейты, чтобы избежать гонок и «дотиков» после cancel.

**Acceptance criteria:** см. выше.

**Out of scope:**
- UI-компоненты (issue 03), монтирование провайдера и маршрут (04), статус-бар-компонент (05).
- Анимации.

## Comments

> *QA fix (orchestrator).* Runtime testing showed failures applied ~15% **per tick**, compounding to ~80% of tasks failing. Changed `queueEngine.ts` to decide a task's fate once per run (`failAt` map: `null` = will finish, number = progress at which it fails). Result verified live: ~15–20% of tasks fail, the rest complete. Cleanup updated in `stop()`. lint/tsc/build green.

> *Implementation complete — pending QA.*

**Changed areas:** `features/generation-queue/model/` (`consts.ts`, `queueReducer.ts`, `queueStorage.ts`, `queueEngine.ts`, `queueContext.ts`, `QueueProvider.tsx`, `selectors.ts`, `useQueue.ts`), `features/generation-queue/lib/formatEta.ts`, `features/generation-queue/index.ts`.

**Validation:** lint ✅ (0 errors; only pre-existing repo-wide `react-refresh` warnings, none in new files), type-check ✅ (`yarn tsc --noEmit` clean), build ✅ (`yarn build`).

**Notes:**
- **Restore policy:** on hydrate/undo (`restoreTasks`) `running` → `queued` with **progress kept** (engine resumes from where it stopped, not from 0). Restore is merge-by-id + sort by `createdAt` asc, so it serves both hydration (empty current state) and undo (re-adding removed tasks) without clobbering in-flight tasks.
- **Persistence throttle:** writes to `localStorage` (`era2:generation-queue`) at most once per `PERSIST_THROTTLE_MS` (1000ms) with a trailing write, plus a final flush on unmount — no per-tick thrash.
- **Engine:** single scheduler interval (`SCHEDULER_INTERVAL_MS` 300ms) fills free slots (FIFO by `createdAt`, respects `MAX_CONCURRENT=2`) and adopts pre-existing `running` seed tasks; each running task self-schedules its own tick timeout (`TICK_MIN/MAX_MS` 400–700ms). Per-type step ranges make video/audio noticeably slower than text/image. ~15% failure with varied RU errors. `cancel`/`remove` produce no late ticks (fire handler re-reads latest state via ref and bails if not `running`). `stop()` clears the scheduler and all per-task timers. Engine never mutates state — only `dispatch`.
- **avg-progress definition:** `selectActiveSummary.avgProgress` = rounded mean of `progress` across active tasks (running + queued), counting queued as their stored progress (0 for fresh). Sample = first 3 active (running first, then queued FIFO).
- **clearDone undo contract:** `clearDone(): GenerationTask[]` returns the removed `done` tasks; `remove(id): GenerationTask | undefined` returns the removed task. Issue 06 can undo via `restoreTasks(removed)` (additive merge). `restoreTasks` also handles hydration.
- **Reducer purity:** no `Date`/`Math.random` inside the reducer; `complete` receives an optional `durationMs` computed by the engine. `retry` keeps original `createdAt` (preserves creation time; documented).
- Stored tasks are runtime-validated with Zod (`queueStorage.ts`) before hydration; invalid/absent data falls back to the seed.
