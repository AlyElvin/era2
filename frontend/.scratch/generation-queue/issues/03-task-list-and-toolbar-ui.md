Status: done
Category: enhancement
Blocked-by: 02-queue-engine-and-store.md

# UI очереди: строка/карточка задачи, бейдж, прогресс, действия, тулбар, счётчики, состояния

## What to build

«Тупые» презентационные компоненты в `features/generation-queue/ui/`: `StatusBadge`, `ProgressBar`, `TaskActions`, `TaskRow` (desktop/tablet), `TaskCard` (mobile), `QueueStats` (4 счётчика), `QueueToolbar` (чипы-фильтры + сортировка + поиск с debounce), и `states/` (`EmptyState`, `LoadingState`, `ErrorState`). Компоненты получают данные и колбэки пропсами, без бизнес-логики и без обращения к контексту напрямую (контекст подключается в виджете, issue 04).

## Acceptance criteria

- [ ] `StatusBadge.tsx`: бейдж по `TaskStatus` нужного цвета — queued нейтральный, running оранжевый (primary), done зелёный, failed красный (destructive), canceled приглушённый. Подпись на русском.
- [ ] `ProgressBar.tsx`: полоса прогресса 0–100 + проценты; плавный рост; цвет — акцент. Можно поверх `shared/ui/progress` или свой div.
- [ ] `TaskActions.tsx`: действия по статусу — `running`/`queued` → «Отмена»; `failed`/`canceled` → «Повторить»; `done` → «Скачать» (заглушка); всегда меню «…» (dropdown) минимум с «Удалить». Использовать `shared/ui/dropdown-menu` и `shared/ui/button`/era-кнопки.
- [ ] `TaskRow.tsx` (desktop): иконка/превью по типу (для image/video — плейсхолдер, можно `era/Placeholder` или `lucide-react`), промпт с обрезкой длинного текста (truncate/line-clamp), пилюля модели + мета (ETA / длительность / кредиты / позиция в очереди), `StatusBadge`, для `running` — `ProgressBar` с %, для `failed` — текст ошибки, `TaskActions`.
- [ ] `TaskCard.tsx` (mobile): тот же контент в виде карточки для стека.
- [ ] `QueueStats.tsx`: 4 карточки-счётчика «В очереди / Идёт / Готово / Ошибка»; значения приходят пропсами (реактивность обеспечивает виджет); на mobile раскладка 2×2.
- [ ] `QueueToolbar.tsx`: чипы-фильтры `Все · В очереди · Идёт · Готово · Ошибка` (активный выделен, использовать `era/Chip`); сортировка «Сначала новые / Сначала старые»; поиск по промпту с debounce (~250–300 мс). На mobile чипы со скроллом по горизонтали (`no-scrollbar`). Все колбэки — пропсами.
- [ ] `states/EmptyState.tsx`: осмысленный вид (иконка + заголовок + текст), различает «нет задач» и «нет результатов под фильтром/поиском» через проп.
- [ ] `states/LoadingState.tsx`: скелетоны или спиннер.
- [ ] `states/ErrorState.tsx`: сообщение + кнопка «Повторить» (колбэк пропсом).
- [ ] Все строки UI — на русском; цвета/радиусы/типографика — только токены дизайн-системы (semantic/`era`), без хардкода брендовых hex в JSX (кроме уже принятого в проекте паттерна `#ff7a3d` для акцент-текста, если нужно — согласовать со стилем существующих era-компонентов).
- [ ] Семантический HTML + базовые `aria-*` где уместно (полноценный a11y-проход — issue 06).
- [ ] `yarn lint`, `yarn tsc --noEmit`, `yarn build` — зелёные. Strict TS, без `any`. Один компонент — один файл, имя файла = имя компонента.

## Agent Brief

**Category:** enhancement
**Summary:** Презентационный слой очереди — строки/карточки/тулбар/счётчики/состояния.

**Current behavior:**
UI очереди нет. Есть переиспользуемые `shared/ui` (shadcn) и `shared/ui/era` (Chip, Placeholder, StatusBadge[для NEW/TOP/...], SegmentedToolbar и т.д.). ВНИМАНИЕ: `shared/ui/era/StatusBadge` — это бейдж лейблов (NEW/TOP/BETA), НЕ статус задачи; нужен отдельный `features/generation-queue/ui/StatusBadge.tsx` под `TaskStatus`.

**Desired behavior:**
Чистые презентационные компоненты, управляемые пропсами; типы берут из `@/entities/generation-task`. Никакого `useQueue`/контекста внутри — данные и колбэки приходят сверху (из виджета).

**Key interfaces:**
- `StatusBadge` props: `{ status: TaskStatus }`.
- `ProgressBar` props: `{ value: number }`.
- `TaskActions` props: `{ status: TaskStatus; onCancel(): void; onRetry(): void; onDownload(): void; onRemove(): void }`.
- `TaskRow` / `TaskCard` props: `{ task: GenerationTask; queuePosition?: number; onCancel/onRetry/onDownload/onRemove }`.
- `QueueStats` props: `{ counts: { queued; running; done; failed } }`.
- `QueueToolbar` props: `{ filter; onFilterChange; sort; onSortChange; query; onQueryChange; counts? }` (поиск с внутренним debounce или debounce в виджете — реализовать debounce здесь через локальное состояние + таймер, отдавая наверх debounced-значение).
- States: `EmptyState { variant: 'no-tasks' | 'no-results' }`, `LoadingState`, `ErrorState { onRetry(): void }`.

**Styling rules:**
- Tailwind + токены дизайн-системы; переиспользовать `cn` из `@/shared/lib/utils`.
- Переиспользовать существующие `shared/ui`/`era` примитивы где уместно (button, card, input, dropdown-menu, progress, Chip, Placeholder).
- Адаптив по `тз` §4.6.

**Acceptance criteria:** см. выше.

**Out of scope:**
- Подключение к стору/контексту и сборка экрана (issue 04).
- Глобальный статус-бар (05).
- Глубокий a11y/keyboard/reduced-motion и framer-motion (06) — здесь только базовая семантика.

## Comments

> *Implementation complete — pending QA.*

**Changed areas:** `features/generation-queue/ui/` (new presentational layer): `StatusBadge.tsx`, `ProgressBar.tsx`, `TaskTypeIcon.tsx`, `TaskPreview.tsx`, `TaskActions.tsx`, `TaskMeta.tsx`, `TaskRow.tsx`, `TaskCard.tsx`, `QueueStats.tsx`, `QueueToolbar.tsx`, and `ui/states/` (`EmptyState.tsx`, `LoadingState.tsx`, `ErrorState.tsx`).

**Validation:** lint ✅ (0 errors; pre-existing repo-wide `react-refresh` warnings only — none in new files), type-check ✅ (`yarn tsc --noEmit` clean), build ✅ (`yarn build`).

**Notes:**
- All components are dumb/presentational — data + callbacks via props, no `useQueue`/context access, no business logic. Only `QueueToolbar` holds local UI state (search debounce ~280ms via `useState` + `setTimeout`, emitting the debounced value upward while showing the typed value immediately).
- Domain types imported from `@/entities/generation-task`; selector types (`QueueCounts`, `VisibleFilter`, `SortOrder`) and formatters (`formatEta`, `formatCredits`, `formatPercent`) imported relatively from within the feature (`../model/selectors`, `../lib/formatEta`) to avoid a circular dependency through the public `index.ts`.
- Two small extra presentational helpers (`TaskTypeIcon`, `TaskPreview`, `TaskMeta`) were extracted to keep `TaskRow`/`TaskCard` DRY — each is one component per file, filename === export.
- **Exports:** the public `features/generation-queue/index.ts` (owned by issue 02) was intentionally left untouched. These UI components are not yet imported anywhere; ESLint does not flag unused exported components, lint/tsc/build are green, so issue 04/05 can import them directly (e.g. `@/features/generation-queue/ui/TaskRow`) or wire them through the public index then.
- **Styling:** Tailwind + design-system tokens via `cn`. Reused shadcn primitives (`button`, `input`, `dropdown-menu`) and `era/Chip`. Status colors: queued → `muted`, running → `primary`/`#ff7a3d` accent, done → `emerald` (matches existing `era/StatusBadge` pattern; no dedicated success token exists), failed → `destructive`, canceled → dimmed `muted`. The only literal hex used is `#ff7a3d`, the project's accepted accent-text value (same as `era/Chip`, `era/Placeholder`, `era/StatusBadge`).
- **Responsive:** `QueueStats` is 2×2 on mobile (`grid-cols-2 sm:grid-cols-4`); `QueueToolbar` chips are horizontally scrollable on mobile (`no-scrollbar`) and wrap on `sm+`. `TaskRow` (desktop row) and `TaskCard` (mobile stacked) cover the breakpoints; the widget (issue 04) chooses which to render.
- Basic semantics/aria included (`article`, `role="progressbar"`, `role="group"`, `role="status"`, `role="alert"`, `aria-label`, `aria-pressed`); full a11y/keyboard/reduced-motion pass is deferred to issue 06.
