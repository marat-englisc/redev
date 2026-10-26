/** Лёгкие общие константы песочницы — без импорта Sandpack, чтобы не тянуть его в уроки. */

export const LESSON_SNIPPET_KEY = "refront:sandbox:snippet";

export interface LessonSnippet {
  lang: string;
  code: string;
  title?: string;
}

/** Языки блоков кода, которые можно открыть в песочнице. */
export const SANDBOX_LANGS = new Set(["html", "css", "js", "javascript", "ts", "typescript", "jsx", "tsx"]);
