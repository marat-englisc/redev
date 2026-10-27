"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRightIcon, SearchIcon, XIcon } from "lucide-react";
import { useAppSelector, useHydrated } from "@/store/hooks";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { CompletionBar, CompletionText } from "@/components/progress-bits";
import { CATEGORIES, LANGUAGES, type CategoryId, type LanguageId } from "@/lib/sections";
import { plural } from "@/lib/date";
import { cn } from "@/lib/utils";

export interface SectionCard {
  id: string;
  num: string | null;
  title: string;
  href: string;
  ids: string[];
  topics: number;
  categories: CategoryId[];
  languages: LanguageId[];
}

type Status = "all" | "new" | "progress" | "done";

const STATUSES: { id: Status; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Не начаты" },
  { id: "progress", label: "В процессе" },
  { id: "done", label: "Пройдены" },
];

interface Filters {
  category: CategoryId | null;
  language: LanguageId | null;
  status: Status;
}

const EMPTY: Filters = { category: null, language: null, status: "all" };

function Chip({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-[13px] whitespace-nowrap transition-colors sm:h-8",
        active
          ? "border-foreground bg-foreground text-background"
          : "bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("font-mono text-[11px] tabular-nums", active ? "text-background/60" : "text-muted-foreground/70")}>{count}</span>
      )}
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <span className="label w-28 shrink-0">{label}</span>
      <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 thin-scrollbar sm:flex-wrap sm:pb-0">{children}</div>
    </div>
  );
}

export function SectionsBrowser({ sections }: { sections: SectionCard[] }) {
  // фильтры — удобство конкретного браузера, поэтому localStorage, а не общий стор; поиск не запоминаем
  const [filters, setFilters] = useLocalStorage<Filters>("refront:section-filters", EMPTY);
  const [search, setSearch] = useState("");
  const hydrated = useHydrated();
  const lessons = useAppSelector((s) => s.progress.lessons);

  const statusOf = useMemo(() => {
    const map = new Map<string, Exclude<Status, "all">>();
    for (const s of sections) {
      let done = 0;
      let touched = 0;
      for (const id of s.ids) {
        const p = lessons[id];
        if (p?.c) done++;
        if (p?.c || p?.v) touched++;
      }
      map.set(s.id, done === s.ids.length && done > 0 ? "done" : touched > 0 ? "progress" : "new");
    }
    return map;
  }, [sections, lessons]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => {
    setFilters(EMPTY);
    setSearch("");
  };
  const query = search.trim().toLowerCase();

  // каждая группа фильтров считает количество с учётом остальных выбранных фильтров
  const matches = (s: SectionCard, skip?: keyof Filters) =>
    (skip === "category" || !filters.category || s.categories.includes(filters.category)) &&
    (skip === "language" || !filters.language || s.languages.includes(filters.language)) &&
    (skip === "status" || filters.status === "all" || !hydrated || statusOf.get(s.id) === filters.status) &&
    (!query || s.title.toLowerCase().includes(query));

  const visible = sections.filter((s) => matches(s));
  const categories = CATEGORIES.filter((c) => sections.some((s) => s.categories.includes(c.id)));
  const languages = LANGUAGES.filter((l) => sections.some((s) => s.languages.includes(l.id)));
  const active = Boolean(filters.category || filters.language || filters.status !== "all" || query);

  return (
    <div>
      <div className="mb-8 grid grid-cols-[minmax(0,1fr)] gap-3 border-y py-5">
        <FilterRow label="Направление">
          <Chip active={!filters.category} onClick={() => set({ category: null })} count={sections.filter((s) => matches(s, "category")).length}>
            Все
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={filters.category === c.id}
              onClick={() => set({ category: filters.category === c.id ? null : c.id })}
              count={sections.filter((s) => s.categories.includes(c.id) && matches(s, "category")).length}
            >
              {c.label}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Язык">
          <Chip active={!filters.language} onClick={() => set({ language: null })}>
            Любой
          </Chip>
          {languages.map((l) => (
            <Chip
              key={l.id}
              active={filters.language === l.id}
              onClick={() => set({ language: filters.language === l.id ? null : l.id })}
              count={sections.filter((s) => s.languages.includes(l.id) && matches(s, "language")).length}
            >
              {l.label}
            </Chip>
          ))}
        </FilterRow>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterRow label="Статус">
            {STATUSES.map((st) => (
              <Chip key={st.id} active={filters.status === st.id} onClick={() => set({ status: st.id })}>
                {st.label}
              </Chip>
            ))}
          </FilterRow>

          <div className="flex items-center gap-2">
            <label className="relative flex h-11 w-full min-w-0 items-center sm:h-8 lg:w-64">
              <SearchIcon className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Найти раздел"
                aria-label="Найти раздел по названию"
                className="h-full w-full min-w-0 rounded-md border bg-muted/40 pl-8 pr-2.5 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40 focus:bg-background"
              />
            </label>
            {active && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <XIcon className="size-3.5" />
                Сбросить
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="label mb-4">
        {active
          ? `Показано ${visible.length} ${plural(visible.length, ["раздел", "раздела", "разделов"])} из ${sections.length}`
          : `${sections.length} ${plural(sections.length, ["раздел", "раздела", "разделов"])}`}
      </div>

      {visible.length === 0 ? (
        <div className="grid place-items-center gap-3 border border-dashed px-6 py-16 text-center">
          <p className="text-muted-foreground">По выбранным фильтрам разделов нет.</p>
          <button type="button" onClick={reset} className="text-[13px] underline underline-offset-4">
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="grid border-l border-t sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((s, i) => (
            <Link
              key={s.id}
              href={s.href}
              className="group relative flex min-h-48 min-w-0 flex-col border-b border-r p-5 transition-colors hover:bg-foreground hover:text-background animate-rise sm:min-h-56 sm:p-6"
              style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-5xl font-light tracking-tighter text-muted-foreground/50 transition-colors group-hover:text-background/40">
                  {s.num}
                </span>
                <ArrowUpRightIcon className="size-5 -translate-x-1 translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
              </div>
              <h3 className="mt-auto pt-8 text-xl font-medium leading-tight tracking-tight">{s.title}</h3>
              <div className="mt-2 flex flex-wrap gap-x-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 group-hover:text-background/50">
                {s.categories
                  .map((id) => CATEGORIES.find((c) => c.id === id)?.label)
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground group-hover:text-background/60">
                <span>
                  {s.topics > 0 ? `${s.topics} тем · ` : ""}
                  {s.ids.length} ур.
                </span>
                <CompletionText ids={s.ids} className="[&>span]:group-hover:text-background/50" />
              </div>
              <CompletionBar ids={s.ids} className="mt-3 group-hover:bg-background/20 [&>div]:group-hover:bg-background" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
