Status: done
Category: enhancement
Blocked-by: 05-global-status-bar.md

# Полировка: a11y + анимации (framer-motion) + Undo + README

## What to build

Финальный проход по фиче очереди: доступность (focus, aria, клавиатура, `prefers-reduced-motion`), анимации появления/удаления строк и появления/скрытия статус-бара через `framer-motion`, Undo для удаления и «Очистить готовые» через `sonner`, и README по фиче.

## Acceptance criteria

- [ ] **Undo:** при «Удалить» и «Очистить готовые» показывается `sonner`-тост с действием «Отменить», восстанавливающим удалённые задачи (в их прежних статусах/прогрессе). `sonner` уже установлен; `Toaster` — проверить, что смонтирован (есть `shared/ui/sonner`), при отсутствии — смонтировать в `App`.
- [ ] **framer-motion:** появление/удаление строк/карточек списка анимируется (`AnimatePresence` + `motion`), без layout-«прыжков»; появление/скрытие глобального статус-бара — плавное.
- [ ] **prefers-reduced-motion:** при включённой настройке анимации отключаются/минимизируются (через media-query или хук; учесть и CSS-, и framer-motion-анимации).
- [ ] **A11y:** интерактивные элементы доступны с клавиатуры (tab/enter/space); у иконочных кнопок есть `aria-label`; чипы-фильтры — корректные роли/`aria-pressed`/`aria-selected`; прогресс — `role="progressbar"` с `aria-valuenow/min/max` (или через `shared/ui/progress`); счётчик активных в статус-баре — `aria-live="polite"`; видимый focus-ring.
- [ ] **README:** `frontend/src/features/generation-queue/README.md` (или раздел в корневом README) с описанием: архитектура (FSD-слои фичи), модель состояния и автомат статусов, правила движка (MAX_CONCURRENT, тики, сбои, длительности по типу, чистка), роутинг до `/queue` (кастомный роутер), политика персистентности (running→queued при восстановлении, ключ localStorage), фолбэк шрифта (Geist → Inter), какие бонусы реализованы.
- [ ] Поведение не сломано: все предыдущие acceptance criteria (issues 01–05) по-прежнему выполняются.
- [ ] `yarn lint`, `yarn tsc --noEmit`, `yarn build` — зелёные.

## Agent Brief

**Category:** enhancement
**Summary:** Доступность, анимации, undo и документация — финальная полировка фичи.

**Current behavior:**
Фича функционально готова (01–05): страница, стор/движок, UI, статус-бар. Анимации/undo/a11y частично отсутствуют. README нет.

**Desired behavior:**
Продакшн-ощущение: плавные анимации (с уважением к reduced-motion), безопасные деструктивные действия (undo), полная клавиатурная доступность, и понятный README.

**Key interfaces:**
- Undo опирается на возможность `model` восстановить удалённые задачи: либо `clearDone()`/`remove(id)` возвращают удалённые элементы, либо есть `restoreTasks(tasks)` экшен. Если в issue 02 этого нет — добавить минимальный `restoreTasks`/`hydrate`-подобный путь в reducer + useQueue (не ломая существующее).
- `framer-motion` (`motion`, `AnimatePresence`) — уже в зависимостях.
- `sonner` (`toast`) + `Toaster` из `@/shared/ui/sonner`.
- Хук/утилита `usePrefersReducedMotion` — можно добавить в `shared/hooks`.

**Acceptance criteria:** см. выше.

**Out of scope:**
- Новые функциональные возможности вне списка бонусов (виртуализация, dnd, фильтр по типу, светлая тема) — НЕ добавлять.

## Comments

> *Implementation complete — pending QA.*

**Changed areas:**
- `frontend/src/app/App.tsx` — смонтирован единый `<Toaster/>` (sonner) для undo-тостов.
- `frontend/src/shared/hooks/usePrefersReducedMotion.ts` — новый хук (стиль `use-mobile.tsx`).
- `frontend/src/widgets/generation-queue/ui/GenerationQueue.tsx` — undo для «Удалить»/«Очистить готовые» через `restoreTasks`; framer-motion enter/exit (`AnimatePresence` + `motion`, `mode="popLayout"`, `key=task.id`); reduced-motion.
- `frontend/src/features/generation-queue/ui/GenerationStatusBar.tsx` — reduced-motion для появления/скрытия; `motion-reduce:` на спиннерах; focus-visible на кастомных кнопках.
- `frontend/src/features/generation-queue/ui/StatusBadge.tsx`, `ProgressBar.tsx`, `states/LoadingState.tsx` — `motion-reduce:` на pulse/spin/skeleton/прогрессе.
- `frontend/src/shared/ui/era/Chip.tsx` — добавлен видимый focus-visible ring.
- `frontend/src/features/generation-queue/README.md` — документация фичи (RU).

**Validation:** lint ✅ (0 errors; только пред­существующие react-refresh warnings), type-check ✅, build ✅

**Notes:**
- Toaster mount: copy-toast НЕ использует sonner (свой кастомный тост), поэтому смонтирован один sonner `<Toaster/>` в `App.tsx` (`theme="dark"`, `position="top-center"` — чтобы не перекрывать нижний статус-бар и copy-toast).
- Reduced-motion: через хук `usePrefersReducedMotion` (обнуление framer-motion transition/offset, `layout` off) + Tailwind `motion-reduce:` для CSS-анимаций.
- A11y: `role="progressbar"`, `aria-pressed` на чипах, `aria-label` у иконочных кнопок, `aria-live="polite"` у счётчика — уже были из issues 01–05; добавлены focus-visible rings на чипах и кастомных кнопках статус-бара.
- Поведение issues 01–05 не изменено (undo восстанавливает прежние статусы/прогресс через существующий `restoreTasks`).
