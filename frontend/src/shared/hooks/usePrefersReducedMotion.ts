import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Подписка на системную настройку `prefers-reduced-motion`.
 * Возвращает `true`, если пользователь просит минимизировать анимации.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = (): void => setPrefersReduced(mql.matches);
    mql.addEventListener("change", onChange);
    setPrefersReduced(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return prefersReduced;
}
