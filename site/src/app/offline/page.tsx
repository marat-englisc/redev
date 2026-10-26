import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Нет подключения", robots: { index: false } };

/** Service worker показывает эту страницу, если урок не сохранён для офлайна, а сети нет. */
export default function OfflinePage() {
  return (
    <main className="grid flex-1 place-items-center px-4 py-24">
      <div className="max-w-md text-center">
        <div className="font-mono text-[clamp(4rem,14vw,8rem)] font-extralight leading-none tracking-tighter text-muted-foreground/30">offline</div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Эта страница не сохранена для офлайна</h1>
        <p className="mt-3 text-muted-foreground">
          Без интернета доступны уже открытые уроки, повторение карточек и статистика. Чтобы читать любые разделы без сети, скачайте их в
          настройках.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link href="/review/" className={buttonVariants({ size: "lg", className: "px-5" })}>
            Повторять карточки
          </Link>
          <Link href="/settings/#offline" className={buttonVariants({ size: "lg", variant: "outline", className: "px-5" })}>
            Офлайн-доступ
          </Link>
        </div>
      </div>
    </main>
  );
}
