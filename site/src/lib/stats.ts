import { dayKey } from "./date";
import type { ProgressState, SrsState } from "@/store";

/** Активность по дням: повторения + отмеченные уроки. */
export function activityByDay(srs: SrsState, progress: ProgressState) {
  const map = new Map<string, number>();
  for (const [k, d] of Object.entries(srs.days)) if (d.r) map.set(k, (map.get(k) ?? 0) + d.r);
  for (const p of Object.values(progress.lessons)) {
    if (p.c) {
      const k = dayKey(p.c);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
  }
  return map;
}

/** Серия дней подряд с активностью (сегодня можно ещё не заниматься). */
export function streak(activity: Map<string, number>) {
  const d = new Date();
  if (!activity.get(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (activity.get(dayKey(d.getTime()))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
