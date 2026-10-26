// Генерирует иконки PWA из SVG: node scripts/generate-icons.mjs
// Результат коммитится в public/icons — при сборке скрипт не нужен.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const out = path.resolve(import.meta.dirname, "../public/icons");
fs.mkdirSync(out, { recursive: true });

/** Логотип как в шапке сайта: «re:» моноширинным шрифтом на чёрном квадрате. */
function svg(size, { padding = 0.18, radius = 0 } = {}) {
  const font = size * (1 - padding * 2) * 0.52;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0b0b0b"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
        font-family="Consolas, 'DejaVu Sans Mono', 'Courier New', monospace" font-weight="700"
        font-size="${font}" letter-spacing="${-font * 0.06}" fill="#ffffff">re:</text>
</svg>`;
}

const icons = [
  { file: "icon-192.png", size: 192, opts: { radius: 192 * 0.18 } },
  { file: "icon-512.png", size: 512, opts: { radius: 512 * 0.18 } },
  // maskable: система сама обрежет форму, поэтому без скругления и с большими полями (safe zone 80%)
  { file: "maskable-512.png", size: 512, opts: { padding: 0.28 } },
];

for (const { file, size, opts } of icons) {
  await sharp(Buffer.from(svg(size, opts))).png().toFile(path.join(out, file));
  console.log("✓", file);
}

// иконка для iOS — по файловой конвенции Next (app/apple-icon.png), чтобы basePath подставился сам
await sharp(Buffer.from(svg(180))).png().toFile(path.resolve(import.meta.dirname, "../src/app/apple-icon.png"));
console.log("✓ apple-icon.png");
