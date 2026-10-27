"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRightIcon, BrainIcon, LoaderIcon, Undo2Icon, XIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useAppDispatch, useAppSelector, useAppStore, useHydrated } from "@/store/hooks";
import { answer, newLeftToday, undoAnswer } from "@/store";
import { formatInterval, fromCard, GRADES, scheduler, State, toCard, type Grade, type StoredCard } from "@/store/srs";
import { BASE_PATH, useCards } from "@/lib/assets";
import type { CardContent } from "@/lib/types";
import { plural } from "@/lib/date";
import { useNow } from "@/hooks/use-srs";
import { cn } from "@/lib/utils";

const LEARN_AHEAD = 20 * 60_000;

interface UndoEntry {
  id: string;
  prev: StoredCard;
  rating: Grade;
  wasNew: boolean;
  at: number;
  queue: string[];
}

const STATE_LABEL: Record<number, string> = {
  [State.New]: "Новая",
  [State.Learning]: "Изучение",
  [State.Review]: "Повторение",
  [State.Relearning]: "Переучивание",
};

function interleave(due: string[], fresh: string[]) {
  if (!fresh.length) return due;
  if (!due.length) return fresh;
  const out: string[] = [];
  const step = Math.max(1, Math.round(due.length / fresh.length));
  let f = 0;
  due.forEach((id, i) => {
    out.push(id);
    if ((i + 1) % step === 0 && f < fresh.length) out.push(fresh[f++]);
  });
  return out.concat(fresh.slice(f));
}

export function ReviewSession({ scopes }: { scopes: Record<string, { title: string; href: string }> }) {
  const params = useSearchParams();
  const scope = params.get("scope");
  const scopeInfo = scope ? scopes[scope] : null;

  const store = useAppStore();
  const dispatch = useAppDispatch();
  const hydrated = useHydrated();
  const cardsCount = useAppSelector((s) => Object.keys(s.srs.cards).length);
  // при пустой колоде почти мегабайтный cards.json не нужен вовсе
  const deckEmpty = hydrated && cardsCount === 0;
  const { data: contents, error: loadError, retry } = useCards(hydrated && !deckEmpty);
  const settings = useAppSelector((s) => s.settings);
  const cards = useAppSelector((s) => s.srs.cards);

  const byId = useMemo(() => new Map<string, CardContent>(contents?.map((c) => [c.id, c]) ?? []), [contents]);

  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [undo, setUndo] = useState<UndoEntry[]>([]);
  const [stats, setStats] = useState({ done: 0, again: 0, started: 0, last: 0 });
  const extraNew = useRef(0);

  const inScope = useCallback(
    (id: string) => {
      const c = byId.get(id);
      return Boolean(c) && (!scope || c!.anc.includes(scope));
    },
    [byId, scope],
  );

  const build = useCallback((fresh = false) => {
    const s = store.getState();
    const now = Date.now();
    if (fresh) setStats({ done: 0, again: 0, started: now, last: now });
    const entries = Object.entries(s.srs.cards).filter(([id]) => inScope(id));
    const due = entries
      .filter(([, c]) => c.state !== State.New && c.due <= now + (c.state === State.Review ? 0 : LEARN_AHEAD))
      .sort((a, b) => a[1].due - b[1].due)
      .map(([id]) => id);
    const fresh2 = entries
      .filter(([, c]) => c.state === State.New)
      .sort((a, b) => a[1].addedAt - b[1].addedAt)
      .slice(0, newLeftToday(s) + extraNew.current)
      .map(([id]) => id);
    setQueue(interleave(due, fresh2));
    setRevealed(false);
  }, [store, inScope]);

  useEffect(() => {
    if (hydrated && contents && queue === null) {
      // первичная сборка очереди, когда загружены карточки и состояние из localStorage
      // eslint-disable-next-line react-hooks/set-state-in-effect
      build(true);
    }
  }, [hydrated, contents, queue, build]);

  const currentId = queue?.[0];
  const current = currentId ? byId.get(currentId) : undefined;
  const currentCard = currentId ? cards[currentId] : undefined;

  const f = useMemo(() => scheduler(settings), [settings]);

  const previews = useMemo(() => {
    if (!currentCard || !revealed) return null;
    const now = new Date();
    const rec = f.repeat(toCard(currentCard), now);
    return Object.fromEntries(GRADES.map((g) => [g.grade, formatInterval(rec[g.grade].card.due.getTime() - now.getTime())]));
  }, [currentCard, revealed, f]);

  const grade = useCallback(
    (g: Grade) => {
      if (!queue || !currentId) return;
      const prev = store.getState().srs.cards[currentId];
      if (!prev) return;
      const now = new Date();
      const res = f.next(toCard(prev), now, g);
      const next = fromCard(res.card, prev.addedAt);
      const wasNew = prev.state === State.New;
      dispatch(answer({ id: currentId, card: next, rating: g, wasNew, at: now.getTime() }));
      setUndo((u) => [...u.slice(-30), { id: currentId, prev, rating: g, wasNew, at: now.getTime(), queue }]);
      setStats((s) => ({ ...s, done: s.done + 1, again: s.again + (g === 1 ? 1 : 0), last: now.getTime() }));

      const rest = queue.slice(1);
      if (next.due - now.getTime() < LEARN_AHEAD) {
        // карточка в шагах изучения — покажем её снова в этой же сессии
        rest.splice(Math.min(rest.length, g === 1 ? 3 : 6), 0, currentId);
      }
      setQueue(rest);
      setRevealed(false);
    },
    [queue, currentId, store, f, dispatch],
  );

  const doUndo = useCallback(() => {
    const last = undo.at(-1);
    if (!last) return;
    dispatch(undoAnswer({ id: last.id, card: last.prev, rating: last.rating, wasNew: last.wasNew, at: last.at }));
    setUndo((u) => u.slice(0, -1));
    setQueue(last.queue);
    setStats((s) => ({ ...s, done: Math.max(0, s.done - 1), again: Math.max(0, s.again - (last.rating === 1 ? 1 : 0)) }));
    setRevealed(true);
  }, [undo, dispatch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea, [role=dialog]")) return;
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        doUndo();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || !current) return;
      if (!revealed && (e.code === "Space" || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) grade(g.grade);
        else if (e.code === "Space" || e.key === "Enter") {
          e.preventDefault();
          grade(3 as Grade);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, grade, doUndo]);

  /* ──────────── подсчёты ──────────── */

  const counts = useMemo(() => {
    const c = { new: 0, learn: 0, review: 0 };
    for (const id of new Set(queue ?? [])) {
      const st = cards[id]?.state;
      if (st === State.New) c.new++;
      else if (st === State.Review) c.review++;
      else c.learn++;
    }
    return c;
  }, [queue, cards]);

  const remainingNew = useMemo(
    () => Object.entries(cards).filter(([id, c]) => c.state === State.New && inScope(id) && !queue?.includes(id)).length,
    [cards, inScope, queue],
  );

  const deckSize = useMemo(() => Object.keys(cards).filter(inScope).length, [cards, inScope]);

  const now = useNow();
  const nextDue = useMemo(() => {
    const upcoming = Object.entries(cards)
      .filter(([id, c]) => inScope(id) && c.state !== State.New && c.due > now)
      .map(([, c]) => c.due)
      .sort((a, b) => a - b);
    if (!upcoming.length) return null;
    const first = upcoming[0];
    const day = new Date(first).toDateString();
    return { at: first, count: upcoming.filter((d) => new Date(d).toDateString() === day).length };
  }, [cards, inScope, now]);

  /* ──────────── рендер ──────────── */

  const total = stats.done + (queue?.length ?? 0);
  const pct = total ? stats.done / total : 0;

  const header = (
    <div className="border-b">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrainIcon className="size-4 shrink-0" />
          <span className="truncate text-sm font-medium">{scopeInfo ? scopeInfo.title : "Все карточки"}</span>
          {scopeInfo && (
            <Link href="/review/" className="text-muted-foreground hover:text-foreground" aria-label="Сбросить фильтр">
              <XIcon className="size-3.5" />
            </Link>
          )}
        </div>
        <div className="ml-auto flex items-center gap-4 font-mono text-[11px] uppercase tracking-wider">
          <span title="Новые">
            <span className="text-muted-foreground">нов </span>
            <span className="tabular-nums">{counts.new}</span>
          </span>
          <span title="Изучение">
            <span className="text-muted-foreground">изуч </span>
            <span className="tabular-nums">{counts.learn}</span>
          </span>
          <span title="Повторение">
            <span className="text-muted-foreground">повт </span>
            <span className="tabular-nums">{counts.review}</span>
          </span>
          <Button variant="ghost" size="icon-sm" onClick={doUndo} disabled={!undo.length} aria-label="Отменить последний ответ (Ctrl+Z)">
            <Undo2Icon />
          </Button>
        </div>
      </div>
      <div className="h-px bg-border">
        <div className="h-full bg-foreground transition-[width] duration-500" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );

  if (loadError && !deckEmpty) {
    return (
      <main className="grid flex-1 place-items-center px-4">
        <div className="text-center">
          <div className="label">Ошибка загрузки</div>
          <p className="mt-3 text-muted-foreground">Не удалось загрузить карточки. Проверьте соединение и попробуйте ещё раз.</p>
          <Button size="lg" variant="outline" className="mt-6 px-5" onClick={retry}>
            Повторить
          </Button>
        </div>
      </main>
    );
  }

  if (!hydrated || (!deckEmpty && (!contents || queue === null))) {
    return (
      <main className="grid flex-1 place-items-center">
        <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (deckEmpty || deckSize === 0) {
    return (
      <main className="flex-1">
        {header}
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <div className="label">Колода пуста</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Пока нечего повторять</h1>
          <p className="mx-auto mt-5 max-w-lg text-muted-foreground leading-relaxed">
            Каждый урок превращается в карточку: на лицевой стороне — вопрос, на обороте — краткий ответ. Отметьте урок изученным или нажмите «В
            повторение». Можно добавить и целый раздел сразу.
          </p>
          <Link href="/" className={buttonVariants({ size: "lg", className: "mt-8 px-5" })}>
            Выбрать раздел
          </Link>
        </div>
      </main>
    );
  }

  if (!current || !currentCard) {
    const acc = stats.done ? Math.round(((stats.done - stats.again) / stats.done) * 100) : null;
    const minutes = Math.max(1, Math.round((stats.last - stats.started) / 60000));
    return (
      <main className="flex-1">
        {header}
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="label animate-rise">{stats.done ? "Сессия завершена" : "На сегодня всё"}</div>
          <h1 className="mt-4 text-6xl font-semibold tracking-[-0.05em] animate-rise sm:text-8xl">Готово.</h1>
          {stats.done > 0 && (
            <div className="mt-12 grid grid-cols-3 border-y animate-rise [animation-delay:100ms]">
              {[
                [stats.done, plural(stats.done, ["карточка", "карточки", "карточек"])],
                [acc !== null ? `${acc}%` : "–", "верных ответов"],
                [minutes, plural(minutes, ["минута", "минуты", "минут"])],
              ].map(([v, l], i) => (
                <div key={i} className="border-l py-6 pl-5 first:border-l-0 first:pl-0">
                  <div className="font-mono text-4xl font-light tracking-tighter tabular-nums">{v}</div>
                  <div className="label mt-2">{l}</div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-10 text-muted-foreground animate-rise [animation-delay:160ms]">
            {nextDue
              ? `Следующее повторение — ${new Date(nextDue.at).toLocaleString("ru", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}, ${nextDue.count} ${plural(nextDue.count, ["карточка", "карточки", "карточек"])}.`
              : "Новых повторений пока не запланировано."}
          </p>
          <div className="mt-8 flex flex-wrap gap-2 animate-rise [animation-delay:200ms]">
            {remainingNew > 0 && (
              <Button
                size="lg"
                className="px-5"
                onClick={() => {
                  extraNew.current += 10;
                  build();
                }}
              >
                Ещё {Math.min(10, remainingNew)} новых
              </Button>
            )}
            <Link href={scopeInfo?.href ?? "/"} className={buttonVariants({ size: "lg", variant: "outline", className: "px-5" })}>
              {scopeInfo ? "К разделу" : "К разделам"}
            </Link>
            <Link href="/stats/" className={buttonVariants({ size: "lg", variant: "ghost", className: "px-5" })}>
              Статистика
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      {header}
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <article key={`${currentId}-${stats.done}`} className="animate-rise">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">{STATE_LABEL[currentCard.state]}</span>
            <span className="label truncate">{current.path}</span>
          </div>
          <h1 className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.03em] text-balance sm:text-4xl">{current.title}</h1>
          {current.q && <div className="prose prose-card mt-5 text-muted-foreground" dangerouslySetInnerHTML={{ __html: current.q }} />}

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="group mt-12 flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-8 text-center text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:flex-row sm:py-10"
            >
              Вспомните ответ и откройте карточку
              <Kbd className="hidden sm:inline-flex">Space</Kbd>
            </button>
          ) : (
            <div className="mt-10 animate-rise [animation-duration:0.4s]">
              <div className="flex items-center gap-4">
                <span className="label">Ответ</span>
                <span className="h-px flex-1 bg-border" />
                <a
                  href={`${BASE_PATH}${current.href}`}
                  target="_blank"
                  rel="noreferrer"
                  className="label flex items-center gap-1 hover:text-foreground"
                >
                  Урок целиком <ArrowUpRightIcon className="size-3" />
                </a>
              </div>
              <div className="prose prose-card mt-5" dangerouslySetInnerHTML={{ __html: current.a }} />
            </div>
          )}
        </article>

        <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-background via-background to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
          {revealed && previews && (
            <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border bg-border animate-rise [animation-duration:0.35s]">
              {GRADES.map((g) => (
                <button
                  key={g.grade}
                  onClick={() => grade(g.grade)}
                  className={cn(
                    "group flex flex-col items-center gap-1 bg-background px-2 py-4 transition-colors hover:bg-foreground hover:text-background",
                    g.grade === 3 && "bg-muted/60",
                  )}
                >
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums group-hover:text-background/60">{previews[g.grade]}</span>
                  <span className="text-sm font-medium sm:text-base">{g.label}</span>
                  <span className="hidden font-mono text-[10px] text-faint group-hover:text-background/50 sm:block">{g.key}</span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 hidden justify-center gap-5 font-mono text-[10px] uppercase tracking-wider text-faint sm:flex">
            <span>Space — {revealed ? "хорошо" : "показать"}</span>
            <span>1–4 — оценка</span>
            <span>Ctrl+Z — отменить</span>
          </div>
        </div>
      </div>
    </main>
  );
}
