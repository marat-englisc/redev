"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckIcon, CloudDownloadIcon, MonitorDownIcon, Trash2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchIndex } from "@/lib/assets";
import {
  PAGE_SIZE_ESTIMATE,
  cachedHrefs,
  clearOfflinePages,
  downloadPages,
  offlineSupported,
  requestPersistentStorage,
  storageEstimate,
} from "@/lib/offline";
import { useInstallPrompt } from "@/components/pwa";
import { cn } from "@/lib/utils";

interface OfflineSection {
  key: string;
  title: string;
  /** страницы уроков и папок раздела — всё, что открывается при чтении */
  hrefs: string[];
}

const mb = (bytes: number) => `${Math.max(0.1, bytes / 1024 / 1024).toFixed(bytes > 100 * 1024 * 1024 ? 0 : 1)} МБ`;

/** Все страницы раздела: уроки + промежуточные папки (/l/03/, /l/03/06/). */
function useOfflineSections(): OfflineSection[] | null {
  const index = useSearchIndex();
  return useMemo(() => {
    if (!index) return null;
    const map = new Map<string, OfflineSection>();
    for (const entry of index) {
      const parts = entry.href.split("/").filter(Boolean); // ["l", "03", "06", "04"]
      const key = parts.slice(0, 2).join("/");
      const section = map.get(key) ?? { key, title: entry.section, hrefs: [] };
      for (let i = 2; i <= parts.length; i++) {
        const href = `/${parts.slice(0, i).join("/")}/`;
        if (!section.hrefs.includes(href)) section.hrefs.push(href);
      }
      map.set(key, section);
    }
    return [...map.values()];
  }, [index]);
}

function Row({ title, desc, children }: { title: string; desc: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 border-b py-7 md:grid-cols-[1fr_minmax(0,360px)] md:items-center md:gap-10">
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</div>
      </div>
      <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">{children}</div>
    </div>
  );
}

export function OfflineSettings() {
  const sections = useOfflineSections();
  const { canInstall, installed, install } = useInstallPrompt();
  const [saved, setSaved] = useState<Set<string> | null>(null);
  const [usage, setUsage] = useState<number | null>(null);
  const [job, setJob] = useState<{ label: string; done: number; total: number } | null>(null);
  const [swActive, setSwActive] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!offlineSupported()) return;
    const [hrefs, estimate, registration] = await Promise.all([cachedHrefs(), storageEstimate(), navigator.serviceWorker.getRegistration()]);
    setSaved(hrefs);
    setUsage(estimate?.usage ?? null);
    setSwActive(Boolean(registration?.active));
  }, []);

  useEffect(() => {
    // состояние кеша — внешняя система: читаем его после монтирования
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const allHrefs = useMemo(() => sections?.flatMap((s) => s.hrefs) ?? [], [sections]);
  const savedCount = saved ? allHrefs.filter((h) => saved.has(h)).length : 0;

  async function download(hrefs: string[], label: string) {
    if (job) return;
    const persisted = await requestPersistentStorage();
    const controller = new AbortController();
    abortRef.current = controller;
    setJob({ label, done: 0, total: hrefs.length });
    try {
      const { failed } = await downloadPages(hrefs, {
        signal: controller.signal,
        onProgress: (done) => setJob({ label, done, total: hrefs.length }),
      });
      if (controller.signal.aborted) toast("Загрузка остановлена");
      else if (failed) toast.error(`Не удалось сохранить страниц: ${failed}. Проверьте подключение и повторите.`);
      else toast.success(`«${label}» доступно офлайн`, { description: persisted ? undefined : "Браузер может удалить данные при нехватке места." });
    } finally {
      abortRef.current = null;
      setJob(null);
      void refresh();
    }
  }

  async function clear() {
    if (!confirm("Удалить все сохранённые для офлайна страницы? Прогресс и карточки не пострадают.")) return;
    await clearOfflinePages();
    toast("Офлайн-данные удалены");
    void refresh();
  }

  if (!offlineSupported()) {
    return (
      <Row title="Офлайн-режим" desc="Этот браузер не поддерживает service worker — офлайн-режим недоступен.">
        <span className="text-sm text-muted-foreground">Недоступно</span>
      </Row>
    );
  }

  return (
    <>
      <Row
        title="Установить приложение"
        desc={
          installed
            ? "re:dev уже запущен как приложение."
            : "Отдельное окно без вкладок браузера, иконка на рабочем столе или главном экране. В Safari на iPhone: «Поделиться» → «На экран Домой»."
        }
      >
        {installed ? (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <CheckIcon className="size-4" /> Установлено
          </span>
        ) : (
          <Button variant="outline" onClick={install} disabled={!canInstall}>
            <MonitorDownIcon /> {canInstall ? "Установить" : "Через меню браузера"}
          </Button>
        )}
      </Row>

      <Row
        title="Офлайн-доступ"
        desc={
          <>
            Главная, повторение карточек, статистика и все открытые уроки сохраняются автоматически. Разделы целиком можно скачать заранее.
            {swActive === false && <span className="mt-1 block">Service worker ещё не активен — обновите страницу.</span>}
          </>
        }
      >
        <div className="w-full space-y-3">
          <div className="flex items-baseline justify-between gap-4 font-mono text-[12px] text-muted-foreground">
            <span>
              Сохранено <span className="text-foreground tabular-nums">{saved ? savedCount : "–"}</span> из {allHrefs.length || "–"} стр.
            </span>
            {usage !== null && <span>занято {mb(usage)}</span>}
          </div>
          {job ? (
            <div className="space-y-2">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-foreground transition-[width]" style={{ width: `${(job.done / job.total) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                <span className="truncate">
                  {job.label}: {job.done} / {job.total}
                </span>
                <Button size="sm" variant="ghost" onClick={() => abortRef.current?.abort()}>
                  <XIcon /> Остановить
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button onClick={() => download(allHrefs, "Все разделы")} disabled={!sections || savedCount === allHrefs.length}>
                <CloudDownloadIcon /> Скачать всё ≈ {mb((allHrefs.length - savedCount) * PAGE_SIZE_ESTIMATE)}
              </Button>
              <Button variant="outline" onClick={clear} disabled={!saved?.size}>
                <Trash2Icon /> Очистить
              </Button>
            </div>
          )}
        </div>
      </Row>

      {sections && (
        <div className="grid gap-px border-b bg-border sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => {
            const have = saved ? s.hrefs.filter((h) => saved.has(h)).length : 0;
            const complete = have === s.hrefs.length;
            return (
              <div key={s.key} className="flex items-center gap-3 bg-background px-1 py-3 sm:px-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.title}</div>
                  <div className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    {have}/{s.hrefs.length} стр. · ≈ {mb(s.hrefs.length * PAGE_SIZE_ESTIMATE)}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={Boolean(job) || complete}
                  onClick={() => download(s.hrefs, s.title)}
                  title={complete ? "Раздел сохранён" : "Скачать раздел для офлайна"}
                  aria-label={complete ? `${s.title}: сохранён` : `Скачать раздел «${s.title}»`}
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-md border transition-colors",
                    complete ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:border-foreground/40 hover:text-foreground disabled:opacity-40",
                  )}
                >
                  {complete ? <CheckIcon className="size-4" /> : <CloudDownloadIcon className="size-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
