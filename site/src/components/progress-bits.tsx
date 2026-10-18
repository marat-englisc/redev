"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompletion } from "@/hooks/use-srs";
import { useAppSelector, useHydrated } from "@/store/hooks";

/** Тонкая полоса прогресса по списку уроков. */
export function CompletionBar({ ids, className }: { ids: string[]; className?: string }) {
  const hydrated = useHydrated();
  const { pct } = useCompletion(ids);
  return (
    <div className={cn("h-px w-full bg-border overflow-hidden", className)}>
      <div
        className="h-full bg-foreground transition-[width] duration-700 ease-out"
        style={{ width: hydrated ? `${pct * 100}%` : 0 }}
      />
    </div>
  );
}

export function CompletionText({ ids, className }: { ids: string[]; className?: string }) {
  const hydrated = useHydrated();
  const { done, total } = useCompletion(ids);
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {hydrated ? done : "–"}
      <span className="text-muted-foreground">/{total}</span>
    </span>
  );
}

export function CompletionPct({ ids, className }: { ids: string[]; className?: string }) {
  const hydrated = useHydrated();
  const { pct } = useCompletion(ids);
  return <span className={cn("font-mono tabular-nums", className)}>{hydrated ? Math.round(pct * 100) : 0}%</span>;
}

/** Статус урока: пусто / открыт / изучен / в колоде. */
export function LessonMark({ id, className }: { id: string; className?: string }) {
  const p = useAppSelector((s) => s.progress.lessons[id]);
  const inDeck = useAppSelector((s) => Boolean(s.srs.cards[id]));
  const hydrated = useHydrated();
  const done = hydrated && Boolean(p?.c);
  const seen = hydrated && Boolean(p?.v);
  return (
    <span
      className={cn(
        "relative grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
        done ? "border-foreground bg-foreground text-background" : seen ? "border-foreground/60" : "border-border",
        className,
      )}
      title={done ? "Изучено" : seen ? "Открыт" : "Не начат"}
    >
      {done ? <CheckIcon className="size-2.5" strokeWidth={3} /> : seen ? <span className="size-1 rounded-full bg-foreground/70" /> : null}
      {inDeck && hydrated && <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-foreground ring-2 ring-background" />}
    </span>
  );
}
