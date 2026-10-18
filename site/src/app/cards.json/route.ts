import fs from "node:fs";
import { getContent, getParents, readLesson } from "@/lib/content";
import { renderCard } from "@/lib/markdown";
import type { CardContent, ContentNode } from "@/lib/types";

export const dynamic = "force-static";

/**
 * Кэш отрендеренных карточек по файлу и времени изменения. В dev route handler
 * вызывается на каждый запрос — без кэша это десятки секунд работы, которые
 * блокируют весь dev-сервер. С кэшем повторно рендерятся только изменённые уроки.
 */
const cardCache = new Map<string, { mtime: number; card: CardContent }>();

async function buildCard(l: ContentNode): Promise<CardContent> {
  const mtime = fs.statSync(l.file!).mtimeMs;
  const hit = cardCache.get(l.file!);
  if (hit && hit.mtime === mtime && hit.card.href === l.href) return hit.card;

  const parents = getParents(l);
  const { title, q, a } = await renderCard(readLesson(l), l.rel);
  const card: CardContent = {
    id: l.id,
    title: title ?? l.title,
    href: l.href,
    path: parents.map((p) => p.title).join(" / "),
    section: (parents[0] ?? l).title,
    anc: parents.map((p) => p.id),
    q,
    a,
  };
  cardCache.set(l.file!, { mtime, card });
  return card;
}

export async function GET() {
  const { lessons } = getContent();
  const cards: CardContent[] = [];
  // небольшими пачками, чтобы не держать в памяти тысячу параллельных промисов
  for (let i = 0; i < lessons.length; i += 32) {
    cards.push(...(await Promise.all(lessons.slice(i, i + 32).map(buildCard))));
  }
  return Response.json(cards);
}
