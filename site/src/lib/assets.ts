"use client";

import { useEffect, useState } from "react";
import type { CardContent, IndexEntry } from "./types";

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const cache = new Map<string, Promise<unknown>>();

export function fetchJson<T>(path: string): Promise<T> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(`${BASE_PATH}${path}`).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${path}`);
      return r.json();
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return p as Promise<T>;
}

function useJsonState<T>(path: string, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetchJson<T>(path)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(false);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [path, enabled, attempt]);
  const retry = () => {
    setError(false);
    setAttempt((a) => a + 1);
  };
  return { data, error, retry };
}

export const useSearchIndex = (enabled = true) => useJsonState<IndexEntry[]>("/search-index.json", enabled).data;
/** Карточки грузятся только когда нужны (enabled) — файл почти мегабайт. */
export const useCards = (enabled = true) => useJsonState<CardContent[]>("/cards.json", enabled);
