import type { Metadata } from "next";
import { getContent, lessonIdsOf } from "@/lib/content";
import { StatsView } from "@/components/stats-view";

export const metadata: Metadata = { title: "Статистика" };

export default function StatsPage() {
  const { root, lessons } = getContent();
  const sections = root.map((s) => ({ id: s.id, num: s.num, title: s.title, href: s.href, ids: lessonIdsOf(s) }));
  return <StatsView sections={sections} total={lessons.length} />;
}
