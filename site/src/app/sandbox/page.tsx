import type { Metadata } from "next";
import { SandboxLoader } from "@/components/sandbox/sandbox-loader";

export const metadata: Metadata = {
  title: "Песочница",
  description: "Онлайн-песочница: HTML/CSS, JavaScript, TypeScript, React и canvas с файлами в браузере.",
};

export default function SandboxPage() {
  return (
    <main className="flex h-[calc(100dvh-3.5rem)] min-h-[520px] flex-col">
      <SandboxLoader />
    </main>
  );
}
