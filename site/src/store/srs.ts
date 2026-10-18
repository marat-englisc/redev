import { fsrs, generatorParameters, createEmptyCard, Rating, State, type Card, type Grade } from "ts-fsrs";

/** Карточка FSRS в сериализуемом виде (даты — timestamp). */
export interface StoredCard {
  due: number;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review: number | null;
  addedAt: number;
}

export interface SrsSettings {
  retention: number;
  newPerDay: number;
  maxInterval: number;
  fuzz: boolean;
}

export const DEFAULT_SRS: SrsSettings = { retention: 0.9, newPerDay: 15, maxInterval: 365, fuzz: true };

export function scheduler(s: SrsSettings) {
  return fsrs(
    generatorParameters({
      request_retention: s.retention,
      maximum_interval: s.maxInterval,
      enable_fuzz: s.fuzz,
      enable_short_term: true,
    }),
  );
}

export function toCard(c: StoredCard): Card {
  return {
    due: new Date(c.due),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: 0,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? new Date(c.last_review) : undefined,
  };
}

export function fromCard(c: Card, addedAt: number): StoredCard {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? c.last_review.getTime() : null,
    addedAt,
  };
}

export function newStoredCard(now = Date.now()): StoredCard {
  return fromCard(createEmptyCard(new Date(now)), now);
}

export const GRADES: { grade: Grade; label: string; key: string }[] = [
  { grade: Rating.Again, label: "Снова", key: "1" },
  { grade: Rating.Hard, label: "Трудно", key: "2" },
  { grade: Rating.Good, label: "Хорошо", key: "3" },
  { grade: Rating.Easy, label: "Легко", key: "4" },
];

export function formatInterval(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 1) return "<1 мин";
  if (m < 60) return `${m} мин`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ч`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} д`;
  const mo = d / 30.4;
  if (mo < 12) return `${mo.toFixed(mo < 3 ? 1 : 0).replace(".0", "")} мес`;
  return `${(d / 365).toFixed(1).replace(".0", "")} г`;
}

export { Rating, State };
export type { Grade };
