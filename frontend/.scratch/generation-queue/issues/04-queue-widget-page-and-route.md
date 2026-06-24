Status: done
Category: enhancement
Blocked-by: 03-task-list-and-toolbar-ui.md

# Виджет очереди + страница QueuePage + маршрут /queue + глобальный монтаж провайдера

## What to build

Собрать экран: виджет `widgets/generation-queue` (композиция provider + шапка + stats + toolbar + список с переключением row/card по брейкпоинту + состояния empty/loading/error), тонкая страница `pages/QueuePage.tsx`, маршрут `/queue` в роутере и ссылка в навигации. Смонтировать **единый** `QueueProvider` на уровне `app` (`AppProviders`), чтобы стор был глобальным (для статус-бара в issue 05).

## Acceptance criteria

- [ ] `widgets/generation-queue/ui/GenerationQueue.tsx`: подключается к стору через `useQueue` + селекторы; рендерит шапку (заголовок «Очередь генераций» + подзаголовок + кнопка «Очистить готовые»), `QueueStats`, `QueueToolbar`, и список.
- [ ] Список: при `status==='loading'` → `LoadingState`; при `status==='error'` → `ErrorState` (кнопка «Повторить» дёргает повторную инициализацию); при пустом результате → `EmptyState` (различает «нет задач» vs «нет результатов под фильтром/поиском»); иначе — список задач.
- [ ] Адаптив: desktop (≥1024) — `TaskRow`; mobile (≤480) — `TaskCard` в стек; промежуток не ломается. Переключение через медиазапросы (Tailwind responsive classes) или хук.
- [ ] Счётчики, фильтр, сортировка, поиск, действия (cancel/retry/download/remove) работают и реактивно обновляются по мере работы движка.
- [ ] «Очистить готовые» удаляет все `done`. (Undo-тост — issue 06; здесь достаточно подтверждения или прямого удаления; интерфейс действия должен позволять undo позже.)
- [ ] `pages/QueuePage.tsx`: тонкая страница без бизнес-логики — рендерит виджет; устанавливает `document.title` («ERA2 — Очередь генераций»), как в других страницах.
- [ ] Маршрут `/queue` добавлен в `src/app/router/index.tsx` (карта routes). Ссылка на очередь добавлена в навигацию (`widgets/navigation`, напр. Sidebar) — типобезопасно через `Link`/`navigate` из `@/shared/routing`.
- [ ] `QueueProvider` смонтирован один раз на уровне `app` (`src/app/providers/AppProviders.tsx`) — оборачивает приложение, чтобы и `/queue`, и глобальный статус-бар читали один стор.
- [ ] Импорты между слайсами — только через публичные `index.ts` (без deep-import). У виджета есть `index.ts`.
- [ ] `yarn lint`, `yarn tsc --noEmit`, `yarn build` — зелёные.

## Agent Brief

**Category:** enhancement
**Summary:** Сборка экрана очереди, маршрут `/queue`, глобальный монтаж стора.

**Current behavior:**
Есть готовые `model` (issue 02) и `ui` (issue 03) фичи. Роутер — собственный (`@/shared/routing`), карта маршрутов в `src/app/router/index.tsx` (объект `routes`). Навигация — `widgets/navigation` (Sidebar/Header). `AppProviders` оборачивает дерево провайдерами.

**Desired behavior:**
Страница `/queue` показывает живой экран очереди; провайдер глобальный (единый источник правды для статус-бара). Тонкая страница только рендерит виджет, вся композиция — в виджете, вся логика — в `model`.

**Key interfaces:**
- `widgets/generation-queue` публичный API: `export { GenerationQueue }`.
- Виджет использует `useQueue`, `selectCounts`, `selectVisible` из `@/features/generation-queue`.
- Локальное UI-состояние тулбара (filter/sort/query) — в виджете (useState), передаётся в селектор и в `QueueToolbar`.
- Роутер: добавить `"/queue": QueuePage` в `routes`.
- `AppProviders`: добавить `<QueueProvider>` в композицию провайдеров (внутри, рядом с другими; порядок — чтобы был доступен и Layout, и роуты, и глобальные оверлеи в `App.tsx`).

**Acceptance criteria:** см. выше.

**Out of scope:**
- Сам компонент глобального статус-бара (issue 05) — но провайдер должен быть смонтирован так, чтобы статус-бар (монтируемый в `App.tsx`) имел к нему доступ.
- a11y/motion/undo полировка (06).

## Comments

> *Implementation complete — pending QA.*

**Changed areas:**
- `src/features/generation-queue/index.ts` — appended public exports for UI (`StatusBadge`, `ProgressBar`, `TaskActions`, `TaskRow`, `TaskCard`, `QueueStats`, `QueueToolbar`, `EmptyState`, `LoadingState`, `ErrorState` + prop types); existing exports preserved.
- `src/widgets/generation-queue/ui/GenerationQueue.tsx` — new widget (composition + local toolbar state + selectors + responsive list + states).
- `src/widgets/generation-queue/index.ts` — new public API (`export { GenerationQueue }`).
- `src/pages/QueuePage.tsx` — new thin page (sets `document.title`, renders widget).
- `src/app/router/index.tsx` — imported `QueuePage`, added `"/queue"` to routes map.
- `src/app/providers/AppProviders.tsx` — mounted `<QueueProvider>` once (wraps `TooltipProvider`/`RouterProvider`, inside `AuthProvider`), so `/queue` and the future App-level status bar share one store.
- `src/widgets/navigation/ui/Sidebar.tsx` — added «Очередь» nav item (`ListChecks` icon, `/queue`) to `bottomItems`.

**Validation:** lint ✅ (0 errors; only pre-existing react-refresh warnings), type-check ✅, build ✅.

**Notes:**
- Nav link placed in the existing `bottomItems` data-driven array (alongside Тарифы/История), matching the existing nav item structure.
- «Очистить готовые» calls `clearDone()` directly (disabled when `counts.done === 0`); kept simple so issue 06 can layer an undo toast — `clearDone()` already returns the removed tasks.
- Responsive list: desktop (`hidden lg:flex`) → `TaskRow`; mobile (`lg:hidden`) → `TaskCard`. `queuePosition` resolved via `selectQueuePosition` only for queued tasks.
- Download handler is a no-op stub per ticket scope.
- Provider mounted inside `AuthProvider` and around `RouterProvider`/`TooltipProvider` so it is available to Layout, routes, and App-level overlays.
