"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MenuIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDueSummary, openSearch } from "@/hooks/use-srs";
import { useHydrated } from "@/store/hooks";
import { ThemeToggle } from "./theme-toggle";
import { Kbd } from "@/components/ui/kbd";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { href: "/", label: "Разделы", match: (p: string) => p === "/" || p.startsWith("/l/") },
  { href: "/review/", label: "Повторение", match: (p: string) => p.startsWith("/review") },
  { href: "/sandbox/", label: "Песочница", match: (p: string) => p.startsWith("/sandbox") },
  { href: "/stats/", label: "Статистика", match: (p: string) => p.startsWith("/stats") },
  { href: "/settings/", label: "Настройки", match: (p: string) => p.startsWith("/settings") },
];

export function SiteHeader() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const due = useDueSummary();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/65">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 shrink-0" aria-label="На главную">
          <span className="grid size-7 place-items-center bg-foreground text-background font-mono text-[11px] font-bold tracking-tighter transition-transform group-hover:rotate-90 duration-500">
            re:
          </span>
          <span className="font-mono text-[13px] font-medium tracking-[0.04em]">
            <span className="text-muted-foreground">{BRAND.prefix}</span>
            {BRAND.suffix}
          </span>
        </Link>

        <nav aria-label="Основная навигация" className="ml-2 hidden min-w-0 items-center md:flex">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const showDue = item.href === "/review/" && hydrated && due.total > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-14 items-center gap-1.5 px-2.5 text-[13px] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                {item.label}
                {showDue && (
                  <span className="min-w-5 rounded-full bg-foreground px-1.5 text-center font-mono text-[10px] leading-5 text-background tabular-nums">
                    {due.total}
                  </span>
                )}
                {active && <span className="absolute inset-x-2.5 -bottom-px h-px bg-foreground" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label="Поиск по урокам"
            onClick={openSearch}
            className="flex size-11 items-center justify-center gap-2 rounded-md border bg-muted/40 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:h-8 md:w-auto md:pl-2.5 md:pr-1.5"
          >
            <SearchIcon className="size-3.5" />
            <span className="hidden lg:inline pr-6">Поиск по урокам</span>
            <Kbd className="hidden md:inline-flex">Ctrl K</Kbd>
          </button>
          <ThemeToggle />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="size-11 md:hidden" aria-label="Открыть меню" />}>
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(88vw,360px)] gap-6 overflow-y-auto px-5 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <SheetTitle className="pr-10 font-mono">{BRAND.name}</SheetTitle>
              <nav aria-label="Мобильная навигация" className="flex flex-col gap-2">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={item.match(pathname) ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={cn("flex min-h-12 items-center justify-between gap-3 rounded-md px-4 py-3 text-base transition-colors hover:bg-muted", item.match(pathname) ? "bg-muted font-medium" : "text-muted-foreground")}
                  >
                    {item.label}
                    {item.href === "/review/" && hydrated && due.total > 0 && <span className="font-mono text-xs tabular-nums">{due.total}</span>}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
