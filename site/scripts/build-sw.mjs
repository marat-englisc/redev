// Генерирует service worker для офлайн-режима по готовому статическому экспорту (out/).
// Запускается после `next build` (см. "build" в package.json).
import { generateSW } from "workbox-build";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

const { count, size, warnings } = await generateSW({
  globDirectory: "out",
  // Заранее кешируем оболочку приложения: скрипты, стили, шрифты, главную, повторение, статистику,
  // настройки, песочницу и данные карточек — этого хватает, чтобы повторять карточки без сети.
  // Уроки (≈2000 страниц, сотни мегабайт) не предзагружаются: они кешируются при открытии
  // или скачиваются разделами в настройках.
  globPatterns: [
    "_next/static/**/*.{js,css,woff2}",
    "index.html",
    "{review,stats,settings,sandbox,offline}/index.html",
    "404.html",
    "cards.json",
    "search-index.json",
    "manifest.webmanifest",
    "icons/*.png",
    "apple-icon.png",
    "favicon.ico",
  ],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  modifyURLPrefix: { "": `${base}/` },
  swDest: "out/sw.js",
  directoryIndex: "index.html",
  // ?_rsc=… — служебный параметр клиентской навигации Next.js
  ignoreURLParametersMatching: [/^_rsc$/, /^utm_/],
  // у файлов в _next/static хеш уже в имени
  dontCacheBustURLsMatching: /\/_next\/static\//,
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  // новая версия ждёт, пока пользователь нажмёт «Обновить» (components/pwa.tsx)
  skipWaiting: false,
  runtimeCaching: [
    {
      // страницы: свежая версия из сети, без сети — из кеша, а если страницы нет — /offline/
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "redev-pages", // то же имя использует «Скачать для офлайна» (src/lib/offline.ts)
        networkTimeoutSeconds: 4,
        precacheFallback: { fallbackURL: `${base}/offline/index.html` },
      },
    },
    {
      // RSC-данные для мягких переходов Next.js между уже открытыми страницами
      urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.endsWith(".txt"),
      handler: "NetworkFirst",
      options: {
        cacheName: "redev-rsc",
        networkTimeoutSeconds: 4,
        matchOptions: { ignoreSearch: true },
        expiration: { maxEntries: 600 },
      },
    },
  ],
});

for (const w of warnings) console.warn("[sw]", w);
console.log(`[sw] out/sw.js: precache ${count} файлов, ${(size / 1024 / 1024).toFixed(1)} МБ`);
