"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDueSummary, openSearch } from "@/hooks/use-srs";
import { useHydrated } from "@/store/hooks";
import { ThemeToggle } from "./theme-toggle";
import { Kbd } from "@/components/ui/kbd";

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

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/65">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 shrink-0" aria-label="На главную">
          <span className="grid size-7 place-items-center bg-foreground text-background font-mono text-[11px] font-bold tracking-tighter transition-transform group-hover:rotate-90 duration-500">
            re:
          </span>
          <span className="hidden font-mono text-[13px] font-medium tracking-[0.04em] sm:inline">
            <span className="text-muted-foreground">re:</span>front
          </span>
        </Link>

        <nav className="ml-2 flex items-center overflow-x-auto no-scrollbar">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const showDue = item.href === "/review/" && hydrated && due.total > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex h-14 items-center gap-1.5 px-2.5 text-[13px] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                  active && "text-foreground",
                  !["/", "/review/", "/sandbox/"].includes(item.href) && "hidden md:flex",
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

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={openSearch}
            className="flex h-8 items-center gap-2 rounded-md border bg-muted/40 pl-2.5 pr-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SearchIcon className="size-3.5" />
            <span className="hidden lg:inline pr-6">Поиск по урокам</span>
            <Kbd className="hidden sm:inline-flex">Ctrl K</Kbd>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
