import type { Metadata } from "next";
import { Suspense } from "react";
import { getContent } from "@/lib/content";
import { ReviewSession } from "@/components/review/review-session";

export const metadata: Metadata = { title: "Повторение" };

export default function ReviewPage() {
  const scopes = Object.fromEntries(
    [...getContent().bySlug.values()].filter((n) => n.kind === "folder").map((n) => [n.id, { title: n.title, href: n.href }]),
  );
  return (
    <Suspense>
      <ReviewSession scopes={scopes} />
    </Suspense>
  );
}
