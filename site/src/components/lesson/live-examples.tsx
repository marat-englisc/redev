"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { PlayIcon } from "lucide-react";
import type { ExampleBlock } from "@/components/sandbox/shared";

/** Sandpack грузится отдельным чанком только после нажатия «Запустить». */
const LiveExampleRunner = dynamic(() => import("@/components/sandbox/live-example-runner").then((m) => m.LiveExampleRunner), {
  ssr: false,
  loading: () => <div className="label grid h-40 place-items-center">Загрузка песочницы…</div>,
});

const LANG_LABELS: Record<string, string> = { javascript: "js", typescript: "ts" };

function LiveExample({ blocks }: { blocks: ExampleBlock[] }) {
  const [running, setRunning] = useState(false);
  const langs = [...new Set(blocks.map((b) => LANG_LABELS[b.lang] ?? b.lang))].join(" + ");

  return (
    <div className="not-prose overflow-hidden rounded-[var(--radius)] border bg-card">
      {running ? (
        <LiveExampleRunner blocks={blocks} title={document.querySelector("h1")?.textContent?.trim()} onClose={() => setRunning(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setRunning(true)}
          className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-foreground text-background transition-transform group-hover:scale-105">
            <PlayIcon className="size-3.5 translate-x-px" fill="currentColor" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Запустить пример</span>
            <span className="label mt-0.5 block normal-case tracking-normal">
              {langs} · код можно менять, результат обновится сразу
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * Находит в HTML урока заглушки `.live-example` (их ставит remarkLiveExamples)
 * и рендерит в них живые примеры через порталы — так они получают контекст приложения (тема и т.д.).
 */
export function LiveExamples({ targetId }: { targetId: string }) {
  const pathname = usePathname();
  const [slots, setSlots] = useState<{ el: HTMLElement; blocks: ExampleBlock[] }[]>([]);

  useEffect(() => {
    const root = document.getElementById(targetId);
    const found = [...(root?.querySelectorAll<HTMLElement>(".live-example") ?? [])].flatMap((el) => {
      try {
        const { blocks } = JSON.parse(decodeURIComponent(el.dataset.example ?? "")) as { blocks: ExampleBlock[] };
        return blocks?.length ? [{ el, blocks }] : [];
      } catch {
        return [];
      }
    });
    // DOM урока — внешняя система относительно React: синхронизируем найденные слоты в состояние
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSlots(found);
  }, [targetId, pathname]);

  return <>{slots.map(({ el, blocks }, i) => createPortal(<LiveExample blocks={blocks} />, el, `${pathname}:${i}`))}</>;
}
