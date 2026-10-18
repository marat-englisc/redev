"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { BarChart3Icon, BrainIcon, CheckIcon, FileTextIcon, HomeIcon, MoonIcon, SettingsIcon } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Command } from "@/components/ui/command";
import { useSearchIndex } from "@/lib/assets";
import { OPEN_SEARCH_EVENT } from "@/hooks/use-srs";
import { useAppSelector } from "@/store/hooks";

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const index = useSearchIndex(open);
  const lessons = useAppSelector((s) => s.progress.lessons);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K" || e.code === "KeyK") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !(e.target as HTMLElement)?.closest("input, textarea, [contenteditable]")) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
    };
  }, []);

  const prepared = useMemo(() => index?.map((e) => ({ ...e, hay: norm(`${e.title} ${e.path}`) })) ?? [], [index]);

  const results = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const out = [];
    for (const e of prepared) {
      if (words.every((w) => e.hay.includes(w))) {
        out.push(e);
        if (out.length >= 60) break;
      }
    }
    return out;
  }, [prepared, query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Поиск" description="Поиск по урокам" className="sm:max-w-2xl">
      <Command shouldFilter={false} className="bg-popover">
        <CommandInput placeholder="Найти урок: замыкания, CORS, useEffect…" value={query} onValueChange={setQuery} />
        <CommandList className="max-h-[min(60vh,480px)] thin-scrollbar">
          {query && <CommandEmpty>{index ? "Ничего не найдено" : "Загрузка индекса…"}</CommandEmpty>}
          {results.length > 0 && (
            <CommandGroup heading={`Уроки · ${results.length}${results.length === 60 ? "+" : ""}`}>
              {results.map((r) => (
                <CommandItem key={r.id} value={r.id} onSelect={() => go(r.href)} className="items-start py-2">
                  <FileTextIcon className="mt-0.5 opacity-60" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{r.title}</div>
                    <div className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.path}</div>
                  </div>
                  {lessons[r.id]?.c ? <CheckIcon className="mt-0.5 size-3.5" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {!query && (
            <CommandGroup heading="Навигация">
              <CommandItem onSelect={() => go("/")}>
                <HomeIcon /> Разделы
              </CommandItem>
              <CommandItem onSelect={() => go("/review/")}>
                <BrainIcon /> Повторение
              </CommandItem>
              <CommandItem onSelect={() => go("/stats/")}>
                <BarChart3Icon /> Статистика
              </CommandItem>
              <CommandItem onSelect={() => go("/settings/")}>
                <SettingsIcon /> Настройки
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setTheme(resolvedTheme === "dark" ? "light" : "dark");
                  setOpen(false);
                }}
              >
                <MoonIcon /> Сменить тему
                <CommandShortcut>{resolvedTheme === "dark" ? "светлая" : "тёмная"}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
