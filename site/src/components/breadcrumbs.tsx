import Link from "next/link";
import type { ContentNode } from "@/lib/types";

export function Breadcrumbs({ chain }: { chain: ContentNode[] }) {
  return (
    <nav aria-label="Навигация" className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
      <Link href="/" className="hover:text-foreground transition-colors">
        Разделы
      </Link>
      {chain.map((c) => (
        <span key={c.id} className="flex items-center gap-2">
          <span className="text-faint">/</span>
          <Link href={c.href} className="hover:text-foreground transition-colors">
            {c.num && <span className="text-faint mr-1.5">{c.num}</span>}
            {c.title}
          </Link>
        </span>
      ))}
    </nav>
  );
}
