"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BASE_PATH } from "@/lib/assets";

const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const DONE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

const LANG_LABELS: Record<string, string> = { plaintext: "text", javascript: "js", typescript: "ts" };

/**
 * Дополняет статический HTML урока: шапка блоков кода с кнопкой «копировать»
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
      head.innerHTML = `<span class="label">${LANG_LABELS[lang] ?? lang}</span><button type="button" class="copy-btn inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Копировать код">${COPY_ICON}</button>`;
      const btn = head.querySelector("button")!;
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
