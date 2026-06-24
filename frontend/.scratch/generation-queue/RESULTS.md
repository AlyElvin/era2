# Results — generation-queue

| Issue | Summary | QA | Review |
| ----- | ------- | -- | ------ |
| 01-domain-entity-and-seed | Доменные типы + сид 8–12 задач | PASS | ✅ |
| 02-queue-engine-and-store | Reducer / engine / provider / selectors / useQueue + persistence | PASS (1 bug fixed) | ✅ |
| 03-task-list-and-toolbar-ui | Строка/карточка/бейдж/прогресс/действия/тулбар/счётчики/состояния | PASS | ✅ |
| 04-queue-widget-page-and-route | Виджет + QueuePage + маршрут /queue + глобальный провайдер | PASS | ✅ |
| 05-global-status-bar | Глобальный плавающий статус-бар | PASS | ✅ |
| 06-a11y-motion-undo-readme | Undo + framer-motion + a11y + README | PASS | ✅ |

## Validation gates (whole app, from `frontend/`)
- `yarn lint` — 0 errors (19 pre-existing `react-refresh` warnings in `shared/ui`, none in new code).
- `yarn tsc --noEmit` — clean.
- `yarn build` — success (pre-existing >500kB chunk warning, project-wide, not introduced here).

## Runtime QA (yarn dev, http://localhost:8080/queue, verified in browser)
- Desktop: header + «Очистить готовые», 4 reactive counters, filter chips with counts, sort, search, task rows with type icon/preview, truncated prompt, model pill + meta, status badge, live orange progress bars for running, error text + «Повторить» for failed, «Скачать» for done, «Отмена» for running/queued, «…» menu.
- Engine is live: tasks advance through statuses, counters update reactively, MAX_CONCURRENT=2 respected (2 running at start from seed).
- **Bug found & fixed:** failure roll was per-tick (~80% failed); now per-task → verified ~15–20% fail, rest complete.
- Global status bar: shows «Генерации идут · N активны · X%» with 2–3 mini-rows + «Открыть очередь →»; auto-hides at 0 active; counts match the page (single store).
- Mobile (390px): stats 2×2, chips horizontal scroll, task **cards** stacked, full-width bottom status panel.
- States: loading (~600ms), error-init (retry), empty (no-tasks / no-results) — wired via provider + widget.

## Bonuses delivered
- Undo (sonner) on delete & «Очистить готовые».
- A11y: aria-labels, aria-pressed chips, role=progressbar, aria-live count, focus-visible rings.
- framer-motion enter/exit for list rows/cards + status bar; `prefers-reduced-motion` respected via `usePrefersReducedMotion` + `motion-reduce:` variants.
- localStorage persistence (key `era2:generation-queue`), running→queued on restore.

## Out of scope (per decision)
Unit tests/Vitest, type filter, dedicated light-theme work, virtualization, drag-to-reorder.

Started: 2026-06-24
Completed: 2026-06-24
