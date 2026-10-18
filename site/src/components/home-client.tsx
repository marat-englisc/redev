"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRightIcon, BrainIcon, BookOpenIcon } from "lucide-react";
import { useAppSelector, useHydrated } from "@/store/hooks";
import { useCompletion, useDueSummary } from "@/hooks/use-srs";
import { activityByDay, streak } from "@/lib/stats";
import { plural } from "@/lib/date";
import { cn } from "@/lib/utils";

function Stat({ value, label, sub }: { value: React.ReactNode; label: string; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0 border-l pl-4 first:border-l-0 first:pl-0 sm:pl-6 sm:first:pl-0">
      <div className="font-mono text-3xl font-light tracking-tighter tabular-nums sm:text-4xl">{value}</div>
      <div className="label mt-2 whitespace-nowrap">{label}</div>
      {sub && <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function HomeStats({ allIds }: { allIds: string[] }) {
  const hydrated = useHydrated();
  const { done, total } = useCompletion(allIds);
  const deck = useAppSelector((s) => Object.keys(s.srs.cards).length);
  const srs = useAppSelector((s) => s.srs);
  const progress = useAppSelector((s) => s.progress);
  const due = useDueSummary();
  const days = useMemo(() => streak(activityByDay(srs, progress)), [srs, progress]);
  const v = (n: number) => (hydrated ? n : "–");

  return (
    <div className="grid grid-cols-2 gap-y-6 sm:flex sm:gap-0">
      <Stat value={v(done)} label="Изучено" sub={`из ${total}`} />
      <Stat value={v(deck)} label="В колоде" sub="карточек" />
      <Stat value={v(due.total)} label="Сегодня" sub="к повторению" />
      <Stat value={v(days)} label="Серия" sub={hydrated ? plural(days, ["день", "дня", "дней"]) : "дней"} />
    </div>
  );
}

export function ContinueCard() {
  const hydrated = useHydrated();
  const last = useAppSelector((s) => s.progress.last);
  const due = useDueSummary();

  return (
    <div className={cn("grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 transition-opacity", !hydrated && "opacity-0")}>
      <Link href={last?.href ?? "/l/01/"} className="group flex items-center gap-4 bg-background p-5 transition-colors hover:bg-muted/60">
        <span className="grid size-10 shrink-0 place-items-center rounded-md border">
          <BookOpenIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="label block">{last ? "Продолжить чтение" : "Начать с первого раздела"}</span>
          <span className="mt-1 block truncate font-medium">{last?.title ?? "Web технологии"}</span>
        </span>
        <ArrowRightIcon className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>
      <Link
        href="/review/"
        className={cn(
          "group flex items-center gap-4 p-5 transition-colors",
          due.total > 0 ? "bg-foreground text-background hover:bg-foreground/90" : "bg-background hover:bg-muted/60",
        )}
      >
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-md border", due.total > 0 && "border-background/25")}>
          <BrainIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("label block", due.total > 0 && "text-background/60")}>Интервальное повторение</span>
          <span className="mt-1 block truncate font-medium">
            {due.total > 0
              ? `${due.total} ${plural(due.total, ["карточка ждёт", "карточки ждут", "карточек ждут"])}`
              : "На сегодня всё повторено"}
          </span>
        </span>
        <ArrowRightIcon className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
