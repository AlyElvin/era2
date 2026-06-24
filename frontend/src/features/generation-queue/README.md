# Очередь генераций (`features/generation-queue`)

Фича отображает и управляет очередью задач генерации (text / image / video / audio):
страница `/queue`, тулбар (фильтры/сортировка/поиск), адаптивный список (строки на
desktop, карточки на mobile) и глобальный плавающий статус-бар активных генераций.

Реальных сетевых вызовов нет — прогресс эмулируется мок-движком.

---

## Архитектура (FSD)

Слайс следует Feature-Sliced Design. Внешний импорт — только через публичный
`index.ts` (никаких глубоких импортов между слайсами).

```
features/generation-queue/
├── model/                     # бизнес-логика и состояние
│   ├── queueReducer.ts        # чистый редьюсер (конечный автомат статусов)
│   ├── queueEngine.ts         # мок-движок: тики прогресса, слоты, сбои, чистка
│   ├── queueStorage.ts        # persist в localStorage + Zod-валидация при чтении
│   ├── queueContext.ts        # React-контекст очереди
│   ├── QueueProvider.tsx      # провайдер: reducer + движок + persist + init
│   ├── useQueue.ts            # публичный хук доступа к состоянию и действиям
│   ├── selectors.ts           # выборки (counts, visible, queuePosition, activeSummary)
│   └── consts.ts              # настройки движка/persist (единый источник чисел)
├── lib/
│   └── formatEta.ts           # форматирование времени / кредитов / процентов
├── ui/                        # презентационные компоненты
│   ├── TaskRow.tsx            # строка задачи (desktop/tablet)
│   ├── TaskCard.tsx           # карточка задачи (mobile)
│   ├── TaskActions.tsx        # действия по статусу + меню «…» с «Удалить»
│   ├── TaskMeta.tsx · TaskPreview.tsx · TaskTypeIcon.tsx
│   ├── StatusBadge.tsx        # бейдж статуса (цвет + подпись)
│   ├── ProgressBar.tsx        # полоса прогресса (role="progressbar")
│   ├── QueueStats.tsx · QueueToolbar.tsx
│   ├── GenerationStatusBar.tsx# глобальный индикатор активных генераций
│   └── states/                # EmptyState · LoadingState · ErrorState
└── index.ts                   # публичный API слайса
```

Виджет-композиция страницы живёт в `widgets/generation-queue`, сама страница — в
`pages/QueuePage.tsx`. Доменная сущность задачи — `entities/generation-task`.

---

## Модель состояния и автомат статусов

`GenerationTask.status: "queued" | "running" | "done" | "failed" | "canceled"`.

Переходы (чистый `queueReducer`):

```
queued ──start──▶ running ──complete──▶ done
                     │
                     ├──fail──────────▶ failed
                     │
        cancel ◀─────┴───────────────▶ canceled   (из queued или running)

failed | canceled ──retry──▶ queued (progress → 0, error сброшен)
```

Дополнительные экшены:

- `loaded` / `initError` / `retryInit` — управление первичной загрузкой.
- `tick` — инкремент `progress` (только для `running`).
- `remove` — удалить одну задачу; `clearDone` — удалить все `done`.
- `restoreTasks` — восстановить/влить задачи (используется для Undo и для
  гидрации из localStorage); merge по `id`, сортировка по `createdAt`.

Состояние полностью сериализуемо (без функций/классов/`Date`), `createdAt` хранится
как epoch ms.

---

## Правила движка (`queueEngine.ts`)

- **`MAX_CONCURRENT = 2`** — не больше двух одновременных `running`.
- Свободные слоты заполняются по **FIFO** (`createdAt`), планировщик крутится с
  периодом `SCHEDULER_INTERVAL_MS` (300 мс).
- Прогресс растёт по-тиково со случайным интервалом **~400–700 мс**
  (`TICK_MIN_MS`–`TICK_MAX_MS`).
- **~15% сбоев** (`FAILURE_PROBABILITY`) — задача случайно падает в `failed` со
  случайным текстом из `ERROR_MESSAGES`.
- **Длительность зависит от типа** (`STEP_RANGE_BY_TYPE`): `video`/`audio`
  «генерируются» заметно медленнее, чем `text`/`image` (меньше шаг прогресса).
- **Чистка таймеров**: все `setTimeout`/`setInterval` снимаются в `stop()`; после
  `cancel`/`remove` «дотиков» не происходит (тик проверяет актуальный статус задачи
  перед применением).
- Движок **не мутирует state напрямую** — единственный путь изменений — `dispatch`.
  Актуальный снимок задач берётся через `ref`, без stale-closure.

---

## Роутинг до `/queue`

В проекте используется **кастомный лёгкий роутер** из `@/shared/routing`
(`RouterProvider`, `useLocation`, `useNavigate`, `Link`, `Navigate`) поверх
History API. Маршрут `/queue` рендерит `QueuePage`. Статус-бар переходит на очередь
через `useNavigate()` (без жёстко зашитых путей в разметке).

---

## Персистентность (`queueStorage.ts`)

- Ключ localStorage: **`era2:generation-queue`** (`STORAGE_KEY`).
- Запись **throttled** (`PERSIST_THROTTLE_MS = 1000` мс) — чтобы не «дёргать»
  хранилище на каждом тике; плюс финальная запись при размонтировании провайдера.
- Чтение валидируется через **Zod** (`safeParse`); битые данные игнорируются.
- При восстановлении задачи со статусом **`running` переводятся в `queued`**
  (`normalizeRestored`) — движок корректно подхватит их заново с сохранённым
  прогрессом, без «зависших» бесхозных `running`.

---

## Фолбэк шрифта

Дизайн использует **Geist** (и **Geist Mono** для чисел/моделей). Подключены через
CSS-переменные в `app/styles/styles.css`:

```
--font-sans: "Geist Variable", "Manrope", -apple-system, system-ui, sans-serif;
--font-mono: "Geist Mono Variable", "JetBrains Mono", ui-monospace, monospace;
```

Если Geist недоступен, цепочка фолбэков уводит на системные шрифты; в качестве
запасного гротеска допустим **Inter** (см. ТЗ: Geist → Inter).

---

## Реализованные бонусы

- **Undo (sonner):** при «Удалить» и «Очистить готовые» показывается тост с
  действием «Отменить», восстанавливающий задачи в прежних статусах/прогрессе через
  `restoreTasks`. Единый `<Toaster/>` смонтирован в `app/App.tsx`.
- **Анимации (framer-motion):** появление/удаление строк и карточек списка
  (`AnimatePresence` + `motion`, `mode="popLayout"`, `key={task.id}`) и плавное
  появление/скрытие глобального статус-бара.
- **`prefers-reduced-motion`:** хук `@/shared/hooks/usePrefersReducedMotion`
  отключает framer-motion-смещения и обнуляет длительности; декоративные CSS-анимации
  (pulse-dot, спиннеры, skeleton, рост прогресса) гасятся через Tailwind-вариант
  `motion-reduce:`.
- **A11y:** `role="progressbar"` с `aria-valuenow/min/max`; `aria-pressed` на
  чипах-фильтрах; `aria-label` у иконочных кнопок; `aria-live="polite"` у счётчика
  активных генераций; видимый `focus-visible`-ring у интерактивных элементов; полная
  клавиатурная доступность (нативные `<button>` и доступное меню shadcn).

## Вне рамок (не реализовано)

Виртуализация списка, drag-and-drop, фильтр по типу генерации, светлая тема —
сознательно не добавлялись.
