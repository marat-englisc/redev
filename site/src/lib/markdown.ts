import path from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import { bundledLanguages, bundledLanguagesAlias } from "shiki";
import { visit, SKIP } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import type { Root as MdRoot, RootContent, Blockquote, Paragraph, Text, Heading, Code, Parent } from "mdast";
import type { Root as HRoot, Element } from "hast";
import { getContent } from "./content";
import type { TocItem } from "./types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/* ───────────────────────── remark: Obsidian / GitHub callouts ───────────────────────── */

const CALLOUT_TITLES: Record<string, string> = {
  note: "Кратко",
  tip: "Подсказка",
  info: "Инфо",
  warning: "Внимание",
  caution: "Осторожно",
  danger: "Опасно",
  important: "Важно",
  example: "Пример",
  question: "Вопрос",
  quote: "Цитата",
};

const CALLOUT_RE = /^\[!(\w+)\]([+-]?)[ \t]*([^\n]*)\n?/;

function remarkCallouts() {
  return (tree: MdRoot) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0] as Paragraph | undefined;
      if (!first || first.type !== "paragraph") return;
      const text = first.children[0] as Text | undefined;
      if (!text || text.type !== "text") return;
      const m = text.value.match(CALLOUT_RE);
      if (!m) return;

      const type = m[1].toLowerCase();
      const fold = m[2];
      const title = m[3].trim() || CALLOUT_TITLES[type] || m[1];

      text.value = text.value.slice(m[0].length);
      if (!text.value) first.children.shift();
      // ведущий перенос строки после заголовка каллаута
      const lead = first.children[0];
      if (lead?.type === "break") first.children.shift();
      if (!first.children.length) node.children.shift();

      const foldable = fold === "-" || fold === "+";
      const body = {
        type: "calloutBody",
        data: { hName: "div", hProperties: { className: ["callout-body"] } },
        children: node.children,
      } as unknown as RootContent;
      const head = {
        type: "calloutTitle",
        data: { hName: foldable ? "summary" : "div", hProperties: { className: ["callout-title"] } },
        children: [{ type: "text", value: title }],
      } as unknown as RootContent;

      node.data = {
        hName: foldable ? "details" : "div",
        hProperties: {
          className: ["callout", `callout-${type}`],
          "data-callout": type,
          ...(fold === "+" ? { open: true } : {}),
        },
      } as Blockquote["data"];
      node.children = [head, body] as Blockquote["children"];
    });
  };
}

/* ───────────────────────── remark: языки кода ───────────────────────── */

const LANG_ALIASES: Record<string, string> = { txt: "plaintext", text: "plaintext", plain: "plaintext", sh: "bash", shell: "bash", console: "bash" };

function remarkCodeLang() {
  return (tree: MdRoot) => {
    visit(tree, "code", (node) => {
      let lang = (node.lang ?? "").toLowerCase();
      lang = LANG_ALIASES[lang] ?? lang;
      if (!lang || !(lang in bundledLanguages || lang in bundledLanguagesAlias)) lang = "plaintext";
      node.lang = lang;
    });
  };
}

/* ───────────────────────── remark: живые примеры ───────────────────────── */

const RUN_RE = /(?:^|\s)run(?:=(["']?)([\w-]+)\1)?(?=\s|$)/;
const FILE_RE = /(?:^|\s)file=(["']?)([\w./-]+)\1(?=\s|$)/;

/**
 * Блоки кода с мета-флагом `run` превращаются в живой пример, который запускается прямо в уроке:
 *
 *     ```html run=card        ← блоки с одинаковым именем объединяются в один пример
 *     ```css run=card
 *     ```tsx run              ← без имени — отдельный пример из одного блока
 *     ```ts run=t file=price.ts ← file= кладёт блок в отдельный файл, чтобы работали импорты
 *
 * После последнего блока группы вставляется заглушка с файлами примера; на клиенте её
 * подхватывает LiveExamples и по кнопке поднимает Sandpack.
 */
function remarkLiveExamples() {
  return (tree: MdRoot) => {
    const groups = new Map<string, { blocks: { lang: string; code: string }[]; last: Code; parent: Parent }>();
    let anonymous = 0;

    visit(tree, "code", (node: Code, _index, parent) => {
      const m = node.meta?.match(RUN_RE);
      if (!m || !parent) return;
      const name = m[2] ?? `#${anonymous++}`;
      const group = groups.get(name) ?? { blocks: [], last: node, parent: parent as Parent };
      const file = node.meta?.match(FILE_RE)?.[2];
      group.blocks.push({ lang: node.lang ?? "plaintext", code: node.value, ...(file ? { file } : {}) });
      group.last = node;
      group.parent = parent as Parent;
      groups.set(name, group);
    });

    for (const { blocks, last, parent } of groups.values()) {
      const at = parent.children.indexOf(last as RootContent);
      const data = encodeURIComponent(JSON.stringify({ blocks }));
      parent.children.splice(at + 1, 0, { type: "html", value: `<div class="live-example" data-example="${data}"></div>` } as RootContent);
    }
  };
}

/* ───────────────────────── rehype: ссылки и оглавление ───────────────────────── */

function rehypeLinks(options: { rel: string }) {
  const { byRel } = getContent();
  const dir = path.posix.dirname(options.rel);
  return (tree: HRoot) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = String(node.properties?.href ?? "");
      if (!href) return;
      if (/^(https?:)?\/\//i.test(href)) {
        node.properties.target = "_blank";
        node.properties.rel = ["noopener", "noreferrer"];
        return;
      }
      if (/^(#|mailto:|tel:)/i.test(href)) return;

      const [rawPath, hash] = href.split("#");
      let decoded = rawPath;
      try {
        decoded = decodeURIComponent(rawPath);
      } catch {}
      const target = path.posix.normalize(path.posix.join(dir === "." ? "" : dir, decoded)).normalize("NFC");
      const found = byRel.get(target) ?? byRel.get(target.replace(/\/$/, ""));
      if (found) {
        node.properties.href = `${BASE_PATH}${found.href}${hash ? `#${hash}` : ""}`;
        node.properties.dataInternal = "true";
      } else {
        node.properties.dataBroken = "true";
      }
    });
  };
}

function rehypeToc(this: unknown, options: { out: TocItem[] }) {
  return (tree: HRoot) => {
    visit(tree, "element", (node: Element) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && node.properties?.id) {
        options.out.push({ id: String(node.properties.id), text: hastToString(node).trim(), depth: Number(node.tagName[1]) });
      }
    });
  };
}

/** Таблицы оборачиваем в контейнер с горизонтальным скроллом. */
function rehypeWrapTables() {
  return (tree: HRoot) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrap"] },
        children: [node],
      };
      return SKIP;
    });
  };
}

/* ───────────────────────── подсветка кода ───────────────────────── */

/**
 * Две IDE-темы: Shiki пишет цвета обеих в CSS-переменные --shiki-light / --shiki-dark,
 * а globals.css выбирает нужную по классу .dark. Те же цвета использует песочница.
 */
const prettyCode: PrettyCodeOptions = {
  theme: { light: "one-light", dark: "one-dark-pro" },
  keepBackground: false,
  bypassInlineCode: true,
  defaultLang: { block: "plaintext" },
};

/* ───────────────────────── публичное API ───────────────────────── */

function stripTitle(tree: MdRoot) {
  const idx = tree.children.findIndex((n) => n.type === "heading" && (n as Heading).depth === 1);
  if (idx === -1) return null;
  const [h] = tree.children.splice(idx, 1) as Heading[];
  return mdText(h);
}

function mdText(node: unknown): string {
  const n = node as { value?: string; children?: unknown[] };
  if (typeof n.value === "string") return n.value;
  return (n.children ?? []).map(mdText).join("");
}

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkCallouts).use(remarkCodeLang).use(remarkLiveExamples);

async function toHtml(tree: MdRoot, rel: string, toc?: TocItem[]) {
  const proc = unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeLinks, { rel })
    .use(rehypeWrapTables)
    .use(rehypePrettyCode, prettyCode);
  if (toc) proc.use(rehypeToc, { out: toc });
  const hast = await proc.run(tree);
  return unified().use(rehypeStringify).stringify(hast as HRoot);
}

export async function renderLesson(md: string, rel: string) {
  const tree = parser.runSync(parser.parse(md)) as MdRoot;
  const title = stripTitle(tree);
  const toc: TocItem[] = [];
  const html = await toHtml(tree, rel, toc);
  const words = md.split(/\s+/).length;
  return { title, html, toc, minutes: Math.max(1, Math.round(words / 180)) };
}

/**
 * Карточка: вопрос = заголовок + секция «Вопрос», ответ = первый каллаут NOTE
 * (а если его нет — первый абзац).
 */
export async function renderCard(md: string, rel: string) {
  const tree = parser.runSync(parser.parse(md)) as MdRoot;
  const title = stripTitle(tree);

  const nodes = tree.children;
  const qIdx = nodes.findIndex((n) => n.type === "heading" && (n as Heading).depth === 2 && /^вопрос/i.test(mdText(n).trim()));
  const question: RootContent[] = [];
  if (qIdx !== -1) {
    for (let i = qIdx + 1; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.type === "heading" && (n as Heading).depth <= 2) break;
      question.push(n);
    }
  }

  const callout = nodes.find(
    (n) => n.type === "blockquote" && (n.data as { hProperties?: { "data-callout"?: string } })?.hProperties?.["data-callout"] === "note",
  ) as Blockquote | undefined;
  let answer: RootContent[];
  if (callout) {
    const body = callout.children[1] as unknown as { children: RootContent[] };
    answer = body?.children ?? [];
  } else {
    answer = nodes.filter((n) => n.type === "paragraph").slice(0, 2);
  }

  const [q, a] = await Promise.all([
    question.length ? toHtml({ type: "root", children: question }, rel) : Promise.resolve(""),
    toHtml({ type: "root", children: answer }, rel),
  ]);
  return { title, q, a };
}
