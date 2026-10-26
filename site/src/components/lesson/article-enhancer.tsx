"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BASE_PATH } from "@/lib/assets";
import { LESSON_SNIPPET_KEY, SANDBOX_LANGS, type LessonSnippet } from "@/components/sandbox/shared";

const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const DONE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

const PLAY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 3 14 9-14 9V3z"/></svg>';

const LANG_LABELS: Record<string, string> = { plaintext: "text", javascript: "js", typescript: "ts" };

/**
 * Дополняет статический HTML урока: шапка блоков кода с кнопками «копировать» и «в песочницу»
 * и клиентская навигация по внутренним ссылкам без перезагрузки страницы.
 */
export function ArticleEnhancer({ targetId }: { targetId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;

    root.querySelectorAll<HTMLElement>("figure[data-rehype-pretty-code-figure]").forEach((fig) => {
      if (fig.querySelector(".code-head")) return;
      const pre = fig.querySelector("pre");
      if (!pre) return;
      const lang = pre.dataset.language ?? "";
      const head = document.createElement("div");
      head.className = "code-head";
      const btnClass =
        "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
      const runnable = SANDBOX_LANGS.has(lang);
      head.innerHTML = `<span class="label">${LANG_LABELS[lang] ?? lang}</span><span class="flex items-center">${
        runnable ? `<button type="button" class="run-btn ${btnClass}" aria-label="Открыть в песочнице" title="Открыть в песочнице">${PLAY_ICON}</button>` : ""
      }<button type="button" class="copy-btn ${btnClass}" aria-label="Копировать код" title="Копировать">${COPY_ICON}</button></span>`;
      head.querySelector(".run-btn")?.addEventListener("click", () => {
        const snippet: LessonSnippet = {
          lang,
          code: pre.innerText.replace(/\n$/, ""),
          title: document.querySelector("h1")?.textContent?.trim(),
        };
        try {
          localStorage.setItem(LESSON_SNIPPET_KEY, JSON.stringify(snippet));
        } catch {}
        router.push("/sandbox/");
      });
      const btn = head.querySelector<HTMLButtonElement>(".copy-btn")!;
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText.replace(/\n$/, ""));
          btn.innerHTML = DONE_ICON;
          setTimeout(() => (btn.innerHTML = COPY_ICON), 1400);
        } catch {}
      });
      fig.prepend(head);
    });

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-internal]");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      e.preventDefault();
      router.push(BASE_PATH && href.startsWith(BASE_PATH) ? href.slice(BASE_PATH.length) : href);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [targetId, router, pathname]);

  return null;
}
