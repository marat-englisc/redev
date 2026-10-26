"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // изменения из других вкладок
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null): T | undefined {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/**
 * Значение в localStorage как состояние React. На сервере и при первой гидрации — `fallback`,
 * поэтому разметка совпадает; недоступное хранилище (приватный режим) тоже даёт `fallback`.
 * Подходит для удобств конкретного браузера: фильтры, выбранная вкладка, режим просмотра.
 */
export function useLocalStorage<T>(key: string, fallback: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const fallbackJson = JSON.stringify(fallback);
  const value = useMemo(() => parse<T>(raw) ?? (JSON.parse(fallbackJson) as T), [raw, fallbackJson]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = parse<T>(read(key)) ?? (JSON.parse(fallbackJson) as T);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {}
      listeners.forEach((l) => l());
    },
    [key, fallbackJson],
  );

  return [value, setValue] as const;
}
