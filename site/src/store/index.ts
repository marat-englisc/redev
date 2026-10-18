import { configureStore, createAction, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_SRS, newStoredCard, Rating, State, type SrsSettings, type StoredCard } from "./srs";
import { dayKey } from "@/lib/date";

/* ─────────────────────────── типы состояния ─────────────────────────── */

export interface LessonProgress {
  /** когда впервые открыт */
  v?: number;
  /** когда отмечен изученным */
  c?: number;
}

export interface ProgressState {
  lessons: Record<string, LessonProgress>;
  last: { id: string; href: string; title: string; at: number } | null;
}

export interface DayStat {
  /** повторений */
  r: number;
  /** из них «Снова» */
  a: number;
  /** новых карточек введено */
  n: number;
}

export interface SrsState {
  cards: Record<string, StoredCard>;
  days: Record<string, DayStat>;
}

export interface SettingsState extends SrsSettings {
  autoAdd: boolean;
}

export interface PersistedState {
  progress: ProgressState;
  srs: SrsState;
  settings: SettingsState;
}

// ключ оставлен прежним, чтобы не потерять уже сохранённый прогресс
export const STORAGE_KEY = "konspekt:v1";

export const hydrate = createAction<Partial<PersistedState> | null>("app/hydrate");
export const resetAll = createAction("app/reset");

/* ─────────────────────────── meta ─────────────────────────── */

const meta = createSlice({
  name: "meta",
  initialState: { hydrated: false },
  reducers: {},
  extraReducers: (b) => b.addCase(hydrate, (s) => void (s.hydrated = true)),
});

/* ─────────────────────────── settings ─────────────────────────── */

const initialSettings: SettingsState = { ...DEFAULT_SRS, autoAdd: true };

const settings = createSlice({
  name: "settings",
  initialState: initialSettings,
  reducers: {
    updateSettings: (s, a: PayloadAction<Partial<SettingsState>>) => ({ ...s, ...a.payload }),
  },
  extraReducers: (b) =>
    b
      .addCase(hydrate, (s, a) => ({ ...initialSettings, ...(a.payload?.settings ?? {}) }))
      .addCase(resetAll, () => initialSettings),
});

/* ─────────────────────────── srs ─────────────────────────── */

const initialSrs: SrsState = { cards: {}, days: {} };

function bumpDay(s: SrsState, key: string, delta: Partial<DayStat>) {
  const d = (s.days[key] ??= { r: 0, a: 0, n: 0 });
  d.r = Math.max(0, d.r + (delta.r ?? 0));
  d.a = Math.max(0, d.a + (delta.a ?? 0));
  d.n = Math.max(0, d.n + (delta.n ?? 0));
}

const srs = createSlice({
  name: "srs",
  initialState: initialSrs,
  reducers: {
    addCards: (s, a: PayloadAction<string[]>) => {
      const now = Date.now();
      for (const id of a.payload) if (!s.cards[id]) s.cards[id] = newStoredCard(now);
    },
    removeCards: (s, a: PayloadAction<string[]>) => {
      for (const id of a.payload) delete s.cards[id];
    },
    /** Результат ответа уже посчитан FSRS снаружи (редьюсер остаётся чистым). */
    answer: (s, a: PayloadAction<{ id: string; card: StoredCard; rating: number; wasNew: boolean; at: number }>) => {
      const { id, card, rating, wasNew, at } = a.payload;
      s.cards[id] = card;
      bumpDay(s, dayKey(at), { r: 1, a: rating === Rating.Again ? 1 : 0, n: wasNew ? 1 : 0 });
    },
    undoAnswer: (s, a: PayloadAction<{ id: string; card: StoredCard; rating: number; wasNew: boolean; at: number }>) => {
      const { id, card, rating, wasNew, at } = a.payload;
      s.cards[id] = card;
      bumpDay(s, dayKey(at), { r: -1, a: rating === Rating.Again ? -1 : 0, n: wasNew ? -1 : 0 });
    },
    resetCards: (s, a: PayloadAction<string[]>) => {
      const now = Date.now();
      for (const id of a.payload) if (s.cards[id]) s.cards[id] = { ...newStoredCard(now), addedAt: s.cards[id].addedAt };
    },
  },
  extraReducers: (b) =>
    b
      .addCase(hydrate, (s, a) => ({ ...initialSrs, ...(a.payload?.srs ?? {}) }))
      .addCase(resetAll, () => initialSrs),
});

/* ─────────────────────────── progress ─────────────────────────── */

const initialProgress: ProgressState = { lessons: {}, last: null };

const progress = createSlice({
  name: "progress",
  initialState: initialProgress,
  reducers: {
    visit: (s, a: PayloadAction<{ id: string; href: string; title: string }>) => {
      const now = Date.now();
      const p = (s.lessons[a.payload.id] ??= {});
      p.v ??= now;
      s.last = { ...a.payload, at: now };
    },
    setCompleted: (s, a: PayloadAction<{ ids: string[]; value: boolean }>) => {
      const now = Date.now();
      for (const id of a.payload.ids) {
        const p = (s.lessons[id] ??= {});
        if (a.payload.value) {
          p.c ??= now;
          p.v ??= now;
        } else delete p.c;
      }
    },
  },
  extraReducers: (b) =>
    b
      .addCase(hydrate, (s, a) => ({ ...initialProgress, ...(a.payload?.progress ?? {}) }))
      .addCase(resetAll, () => initialProgress),
});

/* ─────────────────────────── store ─────────────────────────── */

export const makeStore = () =>
  configureStore({
    reducer: {
      meta: meta.reducer,
      settings: settings.reducer,
      srs: srs.reducer,
      progress: progress.reducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const { updateSettings } = settings.actions;
export const { addCards, removeCards, answer, undoAnswer, resetCards } = srs.actions;
export const { visit, setCompleted } = progress.actions;

export function selectPersisted(s: RootState): PersistedState {
  return { progress: s.progress, srs: s.srs, settings: s.settings };
}

/** Новые карточки, которые ещё можно ввести сегодня. */
export function newLeftToday(s: RootState) {
  return Math.max(0, s.settings.newPerDay - (s.srs.days[dayKey()]?.n ?? 0));
}

export function isNewCard(c: StoredCard) {
  return c.state === State.New;
}
