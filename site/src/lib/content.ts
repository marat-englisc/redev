import fs from "node:fs";
import path from "node:path";
import type { ContentNode, IndexEntry, NavNode } from "./types";

/**
 * Корень конспекта. По умолчанию — родительская папка проекта сайта
 * (сайт лежит в Frontend/site, уроки — в Frontend/).
 */
export const CONTENT_DIR = path.resolve(
  process.env.CONTENT_DIR ?? path.join(process.cwd(), ".."),
);

const IGNORED = new Set(["site", "node_modules", ".git", ".github", ".obsidian", ".trash", ".claude"]);

const NUM_RE = /^(\d+)\.\s*(.+)$/;

function parseName(name: string) {
  const base = name.replace(/\.md$/i, "");
  const m = base.match(NUM_RE);
  return m ? { num: m[1], title: m[2].trim() } : { num: null, title: base.trim() };
}

/** FNV-1a → base36. Короткий и стабильный ключ для localStorage. */
export function hashId(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "x"
  );
}

const collator = new Intl.Collator("ru", { numeric: true });

function readDir(dir: string, rel: string, slug: string[], stableParts: string[]): ContentNode[] {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith(".") && !IGNORED.has(e.name))
    .filter((e) => e.isDirectory() || /\.md$/i.test(e.name))
    .sort((a, b) => collator.compare(a.name, b.name));

  const used = new Set<string>();
  const nodes: ContentNode[] = [];

  for (const e of entries) {
    const { num, title } = parseName(e.name);
    let seg = num ?? slugify(title);
    if (used.has(seg)) seg = `${seg}-${slugify(title)}`;
    used.add(seg);

    const nodeSlug = [...slug, seg];
    const nodeRel = rel ? `${rel}/${e.name}` : e.name;
    const stable = [...stableParts, title];
    const abs = path.join(dir, e.name);
    const href = `/l/${nodeSlug.join("/")}/`;

    if (e.isDirectory()) {
      const children = readDir(abs, nodeRel, nodeSlug, stable);
      if (!children.length) continue;
      nodes.push({ kind: "folder", id: hashId(stable.join("/")), num, title, href, slug: nodeSlug, rel: nodeRel, children });
    } else {
      nodes.push({ kind: "lesson", id: hashId(stable.join("/")), num, title, href, slug: nodeSlug, rel: nodeRel, children: [], file: abs });
    }
  }
  return nodes;
}

interface ContentIndex {
  root: ContentNode[];
  bySlug: Map<string, ContentNode>;
  byRel: Map<string, ContentNode>;
  lessons: ContentNode[];
  parents: Map<string, ContentNode[]>;
}

let cache: ContentIndex | null = null;
let cachedAt = 0;

/**
 * В dev дерево перечитывается не чаще раза в несколько секунд: новые файлы
 * подхватываются при перезагрузке, но рендер тысячи уроков подряд
 * (например, /cards.json) не сканирует диск на каждый вызов.
 */
const DEV_TTL_MS = 3000;

export function getContent(): ContentIndex {
  if (cache && (process.env.NODE_ENV === "production" || Date.now() - cachedAt < DEV_TTL_MS)) return cache;

  const root = readDir(CONTENT_DIR, "", [], []);
  const bySlug = new Map<string, ContentNode>();
  const byRel = new Map<string, ContentNode>();
  const lessons: ContentNode[] = [];
  const parents = new Map<string, ContentNode[]>();

  const walk = (nodes: ContentNode[], chain: ContentNode[]) => {
    for (const n of nodes) {
      bySlug.set(n.slug.join("/"), n);
      byRel.set(n.rel.normalize("NFC"), n);
      parents.set(n.id, chain);
      if (n.kind === "lesson") lessons.push(n);
      else walk(n.children, [...chain, n]);
    }
  };
  walk(root, []);

  cache = { root, bySlug, byRel, lessons, parents };
  cachedAt = Date.now();
  return cache;
}

export function getNode(slug: string[]) {
  return getContent().bySlug.get(slug.map(decodeURIComponent).join("/"));
}

export function getParents(node: ContentNode) {
  return getContent().parents.get(node.id) ?? [];
}

/** Все уроки внутри узла (рекурсивно). */
export function lessonsOf(node: ContentNode): ContentNode[] {
  if (node.kind === "lesson") return [node];
  return node.children.flatMap(lessonsOf);
}

export function lessonIdsOf(node: ContentNode) {
  return lessonsOf(node).map((l) => l.id);
}

export function toNav(node: ContentNode, depth = Infinity): NavNode {
  return {
    kind: node.kind,
    id: node.id,
    num: node.num,
    title: node.title,
    href: node.href,
    children: node.kind === "folder" && depth > 0 ? node.children.map((c) => toNav(c, depth - 1)) : undefined,
  };
}

export function getNeighbours(node: ContentNode) {
  const { lessons } = getContent();
  const i = lessons.findIndex((l) => l.id === node.id);
  return { prev: i > 0 ? lessons[i - 1] : null, next: i >= 0 && i < lessons.length - 1 ? lessons[i + 1] : null };
}

export function pathTitle(node: ContentNode) {
  return getParents(node)
    .map((p) => p.title)
    .join(" / ");
}

export function getSearchIndex(): IndexEntry[] {
  return getContent().lessons.map((l) => {
    const parents = getParents(l);
    return {
      id: l.id,
      title: l.title,
      href: l.href,
      path: parents.map((p) => p.title).join(" / "),
      section: (parents[0] ?? l).title,
    };
  });
}

export function readLesson(node: ContentNode) {
  return fs.readFileSync(node.file!, "utf8");
}
