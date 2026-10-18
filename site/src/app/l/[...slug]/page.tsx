import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, getNode } from "@/lib/content";
import { LessonView } from "@/components/lesson/lesson-view";
import { FolderView } from "@/components/folder-view";

export const dynamicParams = false;

export function generateStaticParams() {
  return [...getContent().bySlug.values()].map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: PageProps<"/l/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const node = getNode(slug);
  return { title: node?.title ?? "Не найдено" };
}

export default async function Page({ params }: PageProps<"/l/[...slug]">) {
  const { slug } = await params;
  const node = getNode(slug);
  if (!node) notFound();
  return node.kind === "lesson" ? <LessonView node={node} /> : <FolderView node={node} />;
}
