"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppSelector, useHydrated } from "@/store/hooks";
import { activityByDay, streak } from "@/lib/stats";
import { dayKey, plural } from "@/lib/date";
import { State } from "@/store/srs";
import { useDueSummary } from "@/hooks/use-srs";
import { CompletionBar, CompletionPct } from "./progress-bits";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  num: string | null;
  title: string;
  href: string;
  ids: string[];
}

const WEEKS = 53;
const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function Big({ value, label, sub }: { value: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="border-b border-r p-6">
      <div className="label">{label}</div>
      <div className="mt-4 font-mono text-4xl font-light tracking-tighter tabular-nums sm:text-5xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function StatsView({ sections, total }: { sections: Section[]; total: number }) {
  const hydrated = useHydrated();
  const srs = useAppSelector((s) => s.srs);
  const progress = useAppSelector((s) => s.progress);
  const due = useDueSummary();

  const data = useMemo(() => {
    const activity = activityByDay(srs, progress);
    const cards = Object.values(srs.cards);
    const states = { [State.New]: 0, [State.Learning]: 0, [State.Review]: 0, [State.Relearning]: 0 } as Record<number, number>;
    for (const c of cards) states[c.state]++;
    let reviews = 0;
    let again = 0;
    for (const d of Object.values(srs.days)) {
      reviews += d.r;
      again += d.a;
    }
    const completed = Object.values(progress.lessons).filter((p) => p.c).length;
    const mature = cards.filter((c) => c.state === State.Review && c.scheduled_days >= 21).length;

    // календарь активности: WEEKS недель, начиная с понедельника
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    const dow = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - dow - (WEEKS - 1) * 7);
    const weeks: { key: string; count: number; future: boolean; date: Date }[][] = [];
    let max = 0;
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const key = dayKey(date.getTime());
        const count = activity.get(key) ?? 0;
        max = Math.max(max, count);
        col.push({ key, count, future: date > today, date });
      }
      weeks.push(col);
    }

    // прогноз на 14 дней
    const forecast: { label: string; count: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      const count = cards.filter((c) => c.state !== State.New && (i === 0 ? c.due <= end.getTime() : c.due >= d.getTime() && c.due <= end.getTime())).length;
      forecast.push({ label: i === 0 ? "сег" : String(d.getDate()), count });
    }

    return { activity, streak: streak(activity), states, reviews, again, completed, mature, weeks, max, forecast, deck: cards.length };
  }, [srs, progress]);

  const v = (x: React.ReactNode) => (hydrated ? x : "–");
  const retention = data.reviews ? Math.round(((data.reviews - data.again) / data.reviews) * 100) : null;
  const fMax = Math.max(1, ...data.forecast.map((f) => f.count));
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / Math.max(1, data.max)) * 4)));

  return (
    <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <div className="label">Ваш прогресс</div>
      <h1 className="mt-3 text-5xl font-semibold tracking-[-0.045em] sm:text-7xl">Статистика</h1>

      <div className="mt-12 grid border-l border-t sm:grid-cols-2 lg:grid-cols-4">
        <Big label="Изучено уроков" value={v(data.completed)} sub={`из ${total} · ${Math.round((data.completed / total) * 100)}%`} />
        <Big label="Карточек в колоде" value={v(data.deck)} sub={`${data.mature} ${plural(data.mature, ["зрелая", "зрелые", "зрелых"])} (интервал ≥ 21 д)`} />
        <Big label="К повторению сегодня" value={v(due.total)} sub={`${due.review + due.learning} повт. · ${due.newToday} нов.`} />
        <Big label="Серия" value={v(data.streak)} sub={plural(data.streak, ["день подряд", "дня подряд", "дней подряд"])} />
        <Big label="Всего повторений" value={v(data.reviews)} />
        <Big label="Верных ответов" value={v(retention !== null ? `${retention}%` : "–")} sub="доля ответов кроме «Снова»" />
        <Big label="Новые / изучение" value={v(`${data.states[State.New]}/${data.states[State.Learning] + data.states[State.Relearning]}`)} />
        <Big label="На повторении" value={v(data.states[State.Review])} />
      </div>

      {/* ─────────── Календарь активности ─────────── */}
      <section className="mt-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Активность</h2>
          <span className="label">Последние 12 месяцев</span>
        </div>
        <div className="mt-6 overflow-x-auto rounded-lg border p-5 thin-scrollbar">
          {/* колонки резиновые: календарь занимает всю ширину карточки, на узких экранах — скролл */}
          <div className="grid min-w-[640px] gap-[3px]" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
            {data.weeks.map((col, i) => (
              <div key={i} className="flex min-w-0 flex-col gap-[3px]">
                {/* подпись не влияет на ширину колонки */}
                <div className="relative h-4">
                  <span className="absolute left-0 top-0 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                    {col[0].date.getDate() <= 7 ? MONTHS[col[0].date.getMonth()] : ""}
                  </span>
                </div>
                {col.map((d) => (
                  <div
                    key={d.key}
                    title={`${d.date.toLocaleDateString("ru")}: ${d.count}`}
                    className={cn(
                      "aspect-square w-full rounded-[2px] transition-colors",
                      d.future ? "bg-transparent" : !hydrated ? "bg-muted" : ["bg-muted", "bg-foreground/25", "bg-foreground/50", "bg-foreground/75", "bg-foreground"][level(d.count)],
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-1.5 font-mono text-[10px] text-muted-foreground">
            меньше
            {["bg-muted", "bg-foreground/25", "bg-foreground/50", "bg-foreground/75", "bg-foreground"].map((c) => (
              <span key={c} className={cn("size-[11px] rounded-[2px]", c)} />
            ))}
            больше
          </div>
        </div>
      </section>

      {/* ─────────── Прогноз ─────────── */}
      <section className="mt-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Прогноз повторений</h2>
          <span className="label">14 дней</span>
        </div>
        <div className="mt-6 flex h-48 items-end gap-1.5 rounded-lg border p-5 sm:gap-2">
          {data.forecast.map((f, i) => (
            <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {hydrated ? f.count : ""}
              </span>
              <div
                className={cn("w-full rounded-t-[2px] transition-[height] duration-700", i === 0 ? "bg-foreground" : "bg-foreground/35")}
                style={{ height: hydrated ? `${(f.count / fMax) * 100}%` : 0, minHeight: f.count && hydrated ? 2 : 0 }}
              />
              <span className="font-mono text-[10px] text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── По разделам ─────────── */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight">По разделам</h2>
        <div className="mt-6 border-t">
          {sections.map((s) => (
            <Link key={s.id} href={s.href} className="group grid grid-cols-[2.5rem_1fr_4rem] items-center gap-4 border-b py-4 hover:bg-muted/40 sm:grid-cols-[2.5rem_16rem_1fr_4rem]">
              <span className="font-mono text-xs text-faint">{s.num}</span>
              <span className="truncate font-medium">{s.title}</span>
              <CompletionBar ids={s.ids} className="hidden h-[3px] sm:block" />
              <CompletionPct ids={s.ids} className="text-right text-sm" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
