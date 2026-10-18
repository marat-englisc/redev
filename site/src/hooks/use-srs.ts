"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { newLeftToday } from "@/store";
import { State } from "@/store/srs";

/** Текущее время, обновляемое раз в минуту — для пересчёта «к повторению». */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Сколько карточек ждёт сегодня: просроченные + доступные новые. */
export function useDueSummary(scope?: Set<string> | null) {
  const cards = useAppSelector((s) => s.srs.cards);
  const left = useAppSelector(newLeftToday);
  const now = useNow();
  return useMemo(() => {
    let review = 0;
    let learning = 0;
    let fresh = 0;
    for (const [id, c] of Object.entries(cards)) {
      if (scope && !scope.has(id)) continue;
      if (c.state === State.New) fresh++;
      else if (c.due <= now) {
        if (c.state === State.Review) review++;
        else learning++;
      }
    }
    const newToday = Math.min(fresh, left);
    return { review, learning, fresh, newToday, total: review + learning + newToday };
  }, [cards, left, now, scope]);
}

/** Сколько уроков из списка изучено. */
export function useCompletion(ids: string[]) {
  const lessons = useAppSelector((s) => s.progress.lessons);
  return useMemo(() => {
    let done = 0;
    for (const id of ids) if (lessons[id]?.c) done++;
    return { done, total: ids.length, pct: ids.length ? done / ids.length : 0 };
  }, [lessons, ids]);
}

export const OPEN_SEARCH_EVENT = "refront:open-search";
export const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
