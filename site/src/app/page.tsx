import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { getContent, lessonIdsOf } from "@/lib/content";
import { CompletionPct } from "@/components/progress-bits";
import { HomeStats, ContinueCard } from "@/components/home-client";
import { SectionsBrowser, type SectionCard } from "@/components/sections-browser";
import { sectionMeta } from "@/lib/sections";
import { BRAND } from "@/lib/brand";

export default function HomePage() {
  const { root, lessons } = getContent();
  const sections = root.filter((n) => n.kind === "folder");
  const extras = root.filter((n) => n.kind === "lesson");
  const allIds = lessons.map((l) => l.id);
  const cards: SectionCard[] = sections.map((s) => ({
    id: s.id,
    num: s.num,
    title: s.title,
    href: s.href,
    ids: lessonIdsOf(s),
    topics: s.children.filter((c) => c.kind === "folder").length,
    ...sectionMeta(s.title),
  }));

  return (
    <main className="flex-1">
      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" />
        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">
          <div className="label animate-rise">{BRAND.name} · конспект · {lessons.length} уроков · {sections.length} разделов</div>
          <h1 className="mt-6 text-[clamp(3rem,10vw,8.5rem)] font-semibold leading-[0.88] tracking-[-0.055em] animate-rise [animation-delay:80ms]">
            <span className="text-[color-mix(in_oklch,var(--muted-foreground)_40%,var(--background))]">{BRAND.prefix}</span>
            {BRAND.suffix}
            <br />
            {/* непрозрачный цвет: при полупрозрачном пересечения букв (TT) светлеют */}
            <span className="text-[color-mix(in_oklch,var(--muted-foreground)_35%,var(--background))]">от HTTP</span> до&nbsp;WebGL
          </h1>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end animate-rise [animation-delay:160ms]">
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Фронтенд, бэкенд, геймдев, инструменты и&nbsp;подготовка к&nbsp;собеседованиям. Читайте уроки, запускайте примеры в&nbsp;песочнице
              и&nbsp;закрепляйте знания интервальными повторениями по&nbsp;алгоритму FSRS. Работает офлайн, прогресс хранится только в&nbsp;вашем браузере.
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

        <SectionsBrowser sections={cards} />

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
