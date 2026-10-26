import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Манифест PWA: установка на главный экран и запуск в отдельном окне. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${BASE}/`,
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.description,
    lang: "ru",
    start_url: `${BASE}/`,
    scope: `${BASE}/`,
    display: "standalone",
    background_color: "#0b0b0b",
    theme_color: "#0b0b0b",
    categories: ["education", "developer", "productivity"],
    icons: [
      { src: `${BASE}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${BASE}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${BASE}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Повторение", url: `${BASE}/review/`, description: "Карточки к повторению на сегодня" },
      { name: "Песочница", url: `${BASE}/sandbox/`, description: "Онлайн-редактор HTML, JS, React и Vue" },
    ],
  };
}
