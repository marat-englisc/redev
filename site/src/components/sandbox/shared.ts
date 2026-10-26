/** Лёгкие общие константы песочницы — без импорта Sandpack, чтобы не тянуть его в уроки. */

export const LESSON_SNIPPET_KEY = "refront:sandbox:snippet";

export interface ExampleBlock {
  lang: string;
  code: string;
  /** имя файла из мета-строки (```ts run=x file=price.ts) — чтобы работали импорты между блоками */
  file?: string;
}

/** Код из урока: один блок (кнопка ▶) или группа блоков живого примера (```css run=card). */
export interface LessonSnippet {
  blocks: ExampleBlock[];
  title?: string;
}

/** Языки блоков кода, которые можно запустить. */
export const SANDBOX_LANGS = new Set(["html", "css", "js", "javascript", "ts", "typescript", "jsx", "tsx", "vue"]);
