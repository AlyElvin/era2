const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

/**
 * Форматирует длительность в человекочитаемую строку (RU).
 * `< 60с` → `~12с`; иначе `1м 20с` (секунды опускаются, если 0).
 */
export function formatEta(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / MS_PER_SECOND));

  if (totalSeconds < SECONDS_PER_MINUTE) {
    return `~${totalSeconds}с`;
  }

  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  return seconds === 0 ? `${minutes}м` : `${minutes}м ${seconds}с`;
}

/** Форматирует число кредитов с разделением разрядов неразрывным пробелом. */
export function formatCredits(n: number): string {
  const safe = Math.max(0, Math.round(n));
  return safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

/** Форматирует прогресс в проценты, клампит 0–100. */
export function formatPercent(n: number): string {
  const clamped = Math.min(100, Math.max(0, Math.round(n)));
  return `${clamped}%`;
}
