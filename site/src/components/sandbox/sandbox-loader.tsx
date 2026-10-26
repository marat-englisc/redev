"use client";

import dynamic from "next/dynamic";

/** Sandpack тяжёлый и работает только в браузере — грузим его отдельным чанком только на этой странице. */
export const SandboxLoader = dynamic(() => import("./sandbox-app").then((m) => m.SandboxApp), {
  ssr: false,
  loading: () => <div className="flex flex-1 items-center justify-center label">Загрузка песочницы…</div>,
});
