import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { getParents, lessonIdsOf } from "@/lib/content";
import type { ContentNode } from "@/lib/types";
import { Breadcrumbs } from "./breadcrumbs";
import { CompletionBar, CompletionPct, CompletionText, LessonMark } from "./progress-bits";
import { FolderActions } from "./folder-actions";
import { plural } from "@/lib/date";

function LessonRow({ node }: { node: ContentNode }) {
  return (
    <Link
      href={node.href}
      className="group flex items-center gap-4 border-b px-1 py-3.5 transition-colors hover:bg-muted/50 sm:px-3"
    >
      <span className="w-7 shrink-0 font-mono text-xs text-faint tabular-nums">{node.num}</span>
      <span className="min-w-0 flex-1 text-[15px] leading-snug transition-transform duration-300 group-hover:translate-x-1">{node.title}</span>
      <LessonMark id={node.id} />
      <ArrowRightIcon className="size-4 shrink-0 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
    </Link>
  );
}

export function FolderView({ node }: { node: ContentNode }) {
  const parents = getParents(node);
  const ids = lessonIdsOf(node);
  const folders = node.children.filter((c) => c.kind === "folder");
  const directLessons = node.children.filter((c) => c.kind === "lesson");

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <Breadcrumbs chain={parents} />

      <header className="mt-8 grid min-w-0 gap-8 border-b pb-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="min-w-0 animate-rise">
          {node.num && <div className="font-mono text-7xl font-extralight leading-none tracking-tighter text-muted-foreground/40 sm:text-8xl">{node.num}</div>}
          <h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.04em] [overflow-wrap:anywhere] sm:text-6xl sm:leading-[1.02]">{node.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {folders.length > 0 && (
              <span>
                {folders.length} {plural(folders.length, ["тема", "темы", "тем"])}
              </span>
            )}
            <span>
              {ids.length} {plural(ids.length, ["урок", "урока", "уроков"])}
            </span>
            <span>
              Изучено <CompletionText ids={ids} className="text-foreground" />
            </span>
          </div>
        </div>
        <FolderActions id={node.id} ids={ids} />
      </header>
      <CompletionBar ids={ids} className="-mt-px" />

      {directLessons.length > 0 && (
        <div className="mt-10">
          {directLessons.map((l) => (
            <LessonRow key={l.id} node={l} />
          ))}
        </div>
      )}

      <div className="mt-6 space-y-14">
        {folders.map((f, i) => {
          const fids = lessonIdsOf(f);
          return (
            <section key={f.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <div className="sticky top-14 z-10 -mx-1 flex items-end gap-4 bg-background/90 px-1 pb-3 pt-6 backdrop-blur sm:-mx-3 sm:px-3">
                <span className="font-mono text-sm text-faint">{f.num}</span>
                <Link href={f.href} className="min-w-0 flex-1 text-xl font-semibold tracking-tight hover:underline underline-offset-4 decoration-1">
                  {f.title}
                </Link>
                <span className="font-mono text-xs text-muted-foreground">
                  <CompletionPct ids={fids} />
                </span>
              </div>
              <CompletionBar ids={fids} />
              <div>
                {f.children.map((c) =>
                  c.kind === "lesson" ? (
                    <LessonRow key={c.id} node={c} />
                  ) : (
                    <Link key={c.id} href={c.href} className="flex items-center gap-4 border-b px-1 py-3.5 hover:bg-muted/50 sm:px-3">
                      <span className="w-7 font-mono text-xs text-faint">{c.num}</span>
                      <span className="flex-1 font-medium">{c.title}</span>
                      <span className="label">{lessonIdsOf(c).length} ур.</span>
                    </Link>
                  ),
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
