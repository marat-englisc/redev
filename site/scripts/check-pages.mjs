import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = fileURLToPath(new URL("../", import.meta.url));
const outDir = path.join(siteDir, "out");
const repository = process.env.GITHUB_REPOSITORY?.split("/").at(-1) ?? "refront";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ??
  (repository.endsWith(".github.io") ? "" : `/${repository}`);
const contentDir = path.resolve(process.env.CONTENT_DIR ?? path.join(siteDir, ".."));

function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

function exportedFile(href) {
  const pathname = decodeURIComponent(new URL(href, "https://pages.example").pathname);
  assert(pathname === basePath || pathname.startsWith(`${basePath}/`), `Missing base path: ${href}`);
  const relative = pathname.slice(basePath.length).replace(/^\//, "");
  return path.join(outDir, relative, ...(pathname.endsWith("/") || !relative ? ["index.html"] : []));
}

for (const file of ["index.html", "404.html", ".nojekyll", "favicon.ico", "cards.json", "search-index.json", "review/index.html", "stats/index.html", "settings/index.html"]) {
  assert(fs.existsSync(path.join(outDir, file)), `Missing export: ${file}`);
}

const search = JSON.parse(fs.readFileSync(path.join(outDir, "search-index.json"), "utf8"));
const cards = JSON.parse(fs.readFileSync(path.join(outDir, "cards.json"), "utf8"));
// Only numbered content belongs to the course; exclude project docs and build files.
const sourceLessons = fs.readdirSync(contentDir, { withFileTypes: true })
  .filter((entry) => /^\d+\.\s/.test(entry.name))
  .flatMap((entry) => entry.isDirectory() ? filesIn(path.join(contentDir, entry.name)) : [path.join(contentDir, entry.name)])
  .filter((file) => file.endsWith(".md"));
assert(search.length > 0, "The content index is empty");
assert.equal(search.length, sourceLessons.length, "Some source lessons were not exported");
assert.equal(cards.length, search.length, "Some lessons have no review card");
assert.equal(new Set(search.map((entry) => entry.id)).size, search.length, "Duplicate lesson IDs");
const cardsById = new Map(cards.map((card) => [card.id, card]));
for (const lesson of search) {
  assert(fs.existsSync(exportedFile(`${basePath}${lesson.href}`)), `Missing lesson: ${lesson.href}`);
  assert.equal(cardsById.get(lesson.id)?.href, lesson.href, `Missing or mismatched card: ${lesson.href}`);
}

const htmlFiles = filesIn(outDir).filter((file) => file.endsWith(".html"));
let localLinks = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  // Inspect tags only: lesson code samples also contain literal href="/..." text.
  const markup = html.replace(/(<(script|style)\b[^>]*>)[\s\S]*?<\/\2>/gi, "$1");
  for (const [tag] of markup.matchAll(/<[a-z][^>]*>/gi)) {
    for (const [, href] of tag.matchAll(/\b(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
      const target = exportedFile(href.replaceAll("&amp;", "&"));
      assert(fs.existsSync(target), `Broken URL in ${path.relative(outDir, file)}: ${href}`);
      localLinks++;
    }
  }
}
console.log(`Pages export verified: ${sourceLessons.length} lessons, ${cards.length} cards, ${htmlFiles.length} HTML pages, ${localLinks} local URLs (base path: ${basePath || "/"}).`);
