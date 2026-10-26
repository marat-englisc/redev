"use client";

import { useSyncExternalStore } from "react";
import { BASE_PATH } from "./assets";

/**
 * Кеши офлайн-режима. Имена совпадают с runtimeCaching в scripts/build-sw.mjs:
 * service worker кладёт сюда открытые страницы, а «Скачать для офлайна» — разделы целиком.
 */
export const PAGES_CACHE = "redev-pages";
export const RSC_CACHE = "redev-rsc";

/** Примерный вес одной страницы урока в кеше — для оценки перед скачиванием. */
export const PAGE_SIZE_ESTIMATE = 140 * 1024;

export const offlineSupported = () => typeof window !== "undefined" && "caches" in window && "serviceWorker" in navigator;

/** URL страницы в кеше — так же, как его запрашивает браузер при переходе. */
export const pageUrl = (href: string) => new URL(`${BASE_PATH}${href}`, location.origin).href;

/** Какие страницы (href без basePath) уже лежат в кеше. */
export async function cachedHrefs(): Promise<Set<string>> {
  if (!offlineSupported()) return new Set();
  const cache = await caches.open(PAGES_CACHE);
  const keys = await cache.keys();
  return new Set(keys.map((r) => new URL(r.url).pathname.slice(BASE_PATH.length)));
}

/**
 * Скачивает страницы в кеш с ограниченной параллельностью.
 * Уже сохранённые пропускаются; onProgress получает число обработанных страниц.
 */
export async function downloadPages(
  hrefs: string[],
  { signal, onProgress, concurrency = 6 }: { signal?: AbortSignal; onProgress?: (done: number) => void; concurrency?: number } = {},
) {
  const cache = await caches.open(PAGES_CACHE);
  const have = await cachedHrefs();
  const queue = hrefs.filter((h) => !have.has(h));
  let done = hrefs.length - queue.length;
  let failed = 0;
  onProgress?.(done);

  async function worker() {
    while (queue.length && !signal?.aborted) {
      const href = queue.shift()!;
      try {
        const res = await fetch(pageUrl(href), { signal, credentials: "same-origin" });
        if (res.ok) await cache.put(pageUrl(href), res);
        else failed++;
      } catch (e) {
        if (signal?.aborted) return;
        failed++;
        void e;
      }
      onProgress?.(++done);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return { failed };
}

export async function clearOfflinePages() {
  await Promise.all([caches.delete(PAGES_CACHE), caches.delete(RSC_CACHE)]);
}

/** Просим браузер не вытеснять кеш при нехватке места (без этого он может удалить офлайн-данные). */
export async function requestPersistentStorage() {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export async function storageEstimate() {
  try {
    return (await navigator.storage?.estimate?.()) ?? null;
  } catch {
    return null;
  }
}

/* ───────────── сеть ───────────── */

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** true, пока браузер считает, что сеть есть. На сервере — всегда true. */
export function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}
