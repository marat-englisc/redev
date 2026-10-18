import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { getContent, lessonIdsOf } from "@/lib/content";
import { CompletionBar, CompletionPct, CompletionText } from "@/components/progress-bits";
import { HomeStats, ContinueCard } from "@/components/home-client";

export default function HomePage() {
  const { root, lessons } = getContent();
  const sections = root.filter((n) => n.kind === "folder");
  const extras = root.filter((n) => n.kind === "lesson");
  const allIds = lessons.map((l) => l.id);

  return (
    <main className="flex-1">
      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" />
        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">
          <div className="label animate-rise">re:front · конспект · {lessons.length} уроков · {sections.length} разделов</div>
          <h1 className="mt-6 text-[clamp(3rem,10vw,8.5rem)] font-semibold leading-[0.88] tracking-[-0.055em] animate-rise [animation-delay:80ms]">
            <span className="text-[color-mix(in_oklch,var(--muted-foreground)_40%,var(--background))]">re:</span>front
            <br />
            {/* непрозрачный цвет: при полупрозрачном пересечения букв (TT) светлеют */}
            <span className="text-[color-mix(in_oklch,var(--muted-foreground)_35%,var(--background))]">от HTTP</span> до&nbsp;System&nbsp;Design
          </h1>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end animate-rise [animation-delay:160ms]">
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Читайте уроки, отмечайте пройденное и закрепляйте знания интервальными повторениями по&nbsp;алгоритму FSRS. Весь прогресс хранится только
              в&nbsp;вашем браузере.
            </p>
            <HomeStats allIds={allIds} />
          </div>
          <div className="mt-10 animate-rise [animation-delay:240ms]">
            <ContinueCard />
          </div>
        </div>
      </section>

      {/* ─────────── Разделы ─────────── */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 py-14 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Разделы</h2>
          <span className="label">
            Пройдено <CompletionPct ids={allIds} className="text-foreground" />
          </span>
        </div>

        <div className="grid border-l border-t sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sections.map((s, i) => {
            const ids = lessonIdsOf(s);
            const topics = s.children.filter((c) => c.kind === "folder").length;
            return (
              <Link
                key={s.id}
                href={s.href}
                className="group relative flex min-h-56 flex-col border-b border-r p-6 transition-colors hover:bg-foreground hover:text-background animate-rise"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-5xl font-light tracking-tighter text-muted-foreground/50 transition-colors group-hover:text-background/40">
                    {s.num}
                  </span>
                  <ArrowUpRightIcon className="size-5 -translate-x-1 translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </div>
                <h3 className="mt-auto pt-8 text-xl font-medium leading-tight tracking-tight">{s.title}</h3>
                <div className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground group-hover:text-background/60">
                  <span>
                    {topics > 0 ? `${topics} тем · ` : ""}
                    {ids.length} ур.
                  </span>
                  <CompletionText ids={ids} className="[&>span]:group-hover:text-background/50" />
                </div>
                <CompletionBar ids={ids} className="mt-3 group-hover:bg-background/20 [&>div]:group-hover:bg-background" />
              </Link>
            );
          })}
        </div>

        {extras.length > 0 && (
          <div className="mt-14">
            <div className="label mb-4">Дополнительно</div>
            <div className="grid border-l border-t sm:grid-cols-3">
              {extras.map((e) => (
                <Link
                  key={e.id}
                  href={e.href}
                  className="group flex items-center gap-4 border-b border-r px-6 py-5 transition-colors hover:bg-muted"
                >
                  <span className="font-mono text-sm text-muted-foreground">{e.num}</span>
                  <span className="font-medium">{e.title}</span>
                  <ArrowUpRightIcon className="ml-auto size-4 opacity-40 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
