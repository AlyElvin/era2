Status: done
Category: enhancement
Blocked-by: 04-queue-widget-page-and-route.md

# Глобальный плавающий статус-бар генераций

## What to build

Глобальный индикатор активных генераций (как «менеджер загрузок» в браузере), видимый поверх любого экрана, пока есть активные задачи (`running` + `queued`). Часть фичи `features/generation-queue` (`ui/GenerationStatusBar.tsx`), читает тот же стор через `useQueue`/селекторы. Монтируется глобально в `App.tsx`. Клик ведёт на `/queue`.

## Acceptance criteria

- [ ] `features/generation-queue/ui/GenerationStatusBar.tsx` читает стор через `useQueue`/`selectActiveSummary` — НЕ дублирует состояние.
- [ ] Состояния по числу активных (`running` + `queued`):
  - нет активных → индикатор скрыт (не в DOM или `hidden`);
  - 1 задача → компактная карточка: спиннер, тип/модель, мини прогресс-бар + %;
  - несколько → раскрытый виджет: заголовок «Генерации идут · N активны · X%» (X — усреднённый прогресс), мини-список 2–3 задач с прогрессом, кнопка-ссылка «Открыть очередь →»;
  - (бонус, опц.) свёрнутый — компактная пилюля «N генераций · X%», разворачивается по клику.
- [ ] Клик по виджету / «Открыть очередь» → `navigate("/queue")` через `@/shared/routing`.
- [ ] Размещение (адаптив): desktop/tablet — плавающий снизу-справа (отступ ~24px), поверх контента (`fixed`, разумный `z-index`); mobile — полноширинная панель снизу с учётом safe-area (`.safe-bottom`), над зоной нижней навигации если есть.
- [ ] Появление/скрытие — плавно; бар НЕ «дёргается» на каждом тике прогресса (значения прогресса меняются плавно через CSS transition; смена состояния компоновки — без резких прыжков).
- [ ] Смонтирован глобально один раз в `src/app/App.tsx` (рядом с другими глобальными оверлеями), внутри провайдеров (имеет доступ к `QueueProvider` и роутеру).
- [ ] Экспортирован через публичный API `features/generation-queue/index.ts`.
- [ ] На странице `/queue` индикатор и счётчики страницы всегда совпадают (один стор).
- [ ] `yarn lint`, `yarn tsc --noEmit`, `yarn build` — зелёные.

## Agent Brief

**Category:** enhancement
**Summary:** Глобальный плавающий индикатор генераций, единый стор со страницей очереди.

**Current behavior:**
Стор и страница готовы (02, 04). Провайдер смонтирован глобально (04). В `App.tsx` уже есть глобальные оверлеи (`OnboardingTour`, `CornerPromo`, `DailyCheckIn`, `CopyToastProvider`) — добавить рядом.

**Desired behavior:**
Индикатор всегда отражает актуальное число активных задач и средний прогресс из единого стора; виден поверх любой страницы; уводит на `/queue`. Никакого дублирования состояния.

**Key interfaces:**
- `selectActiveSummary(state)` → `{ activeCount, avgProgress, sample: GenerationTask[] /* 2–3 */ }` (если отсутствует в 02 — добавить селектор в `model/selectors.ts` и реэкспортировать).
- `GenerationStatusBar` — без пропсов; берёт всё из `useQueue`.
- `navigate` из `@/shared/routing`.

**Styling rules:**
- Токены дизайн-системы; `card`, `era` примитивы; `cn`.
- Плавность — CSS transitions; для появления/исчезновения можно framer-motion (есть в проекте), но без «дёрганья» на тиках.

**Acceptance criteria:** см. выше.

**Out of scope:**
- Финальная a11y/reduced-motion полировка (06) — здесь базовая семантика/aria-live для счётчика уместна.

## Comments

> *Implementation complete — pending QA.*

**Changed areas:**
- `frontend/src/features/generation-queue/ui/GenerationStatusBar.tsx` (new)
- `frontend/src/features/generation-queue/index.ts` (export `GenerationStatusBar`)
- `frontend/src/app/App.tsx` (mounted globally after `<CornerPromo />`)

**Validation:** lint ✅ (0 errors, only pre-existing repo-wide warnings), type-check ✅, build ✅

**Notes:**
- Single source of truth: reads `useQueue()` → `selectActiveSummary({ tasks, status })`; no duplicated state. `status !== 'ready'` renders nothing.
- States by `activeCount`: 0 → hidden (animated out via `AnimatePresence`); 1 → compact card (Loader2 spinner + type/model + mini `ProgressBar`); ≥2 → expanded widget («Генерации идут · N активны · X%», 2–3 sample list, «Открыть очередь →»). Bonus collapsed pill «N генераций · X%» via a minimize/expand toggle.
- Mobile breakpoint: `lg`. Below `lg` → full-width bottom panel (`inset-x-0 bottom-0`, `rounded-t-2xl`) with safe-area `pb-[env(safe-area-inset-bottom)]`. `lg`+ → floating bottom-right (`lg:bottom-6 lg:right-6`, `w-[340px]`). z-index `z-[55]` (consistent with other overlays; CornerPromo is `z-[60]`).
- Navigation: `useNavigate` → `/queue`; guarded by `useLocation` so it no-ops when already on `/queue`.
- Anti-jitter: stable `motion.div` container that never remounts on progress ticks; only inner `ProgressBar` width transitions (CSS `transition-[width]`) and `tabular-nums` percent text change. Appearance/disappearance animated with framer-motion opacity/translate.
- a11y: count/percent regions use `aria-live="polite"`; icon-only buttons (collapse/expand) have `aria-label`.
