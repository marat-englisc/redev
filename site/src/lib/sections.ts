/**
 * Метаданные разделов для фильтров на главной.
 * Ключ — название папки раздела без номера (как в дереве контента),
 * поэтому перенумерация разделов ничего не ломает.
 * Новый раздел без записи попадёт в категорию «Прочее».
 */

export const CATEGORIES = [
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "gamedev", label: "GameDev" },
  { id: "tools", label: "DevOps и инструменты" },
  { id: "cs", label: "Computer Science" },
  { id: "career", label: "Карьера" },
  { id: "other", label: "Прочее" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const LANGUAGES = [
  { id: "html-css", label: "HTML / CSS" },
  { id: "js", label: "JavaScript" },
  { id: "ts", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "sql", label: "SQL" },
  { id: "glsl", label: "GLSL" },
  { id: "shell", label: "Shell" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

interface SectionMeta {
  categories: CategoryId[];
  languages: LanguageId[];
}

const META: Record<string, SectionMeta> = {
  "Web технологии": { categories: ["frontend", "backend"], languages: ["js"] },
  HTML: { categories: ["frontend"], languages: ["html-css"] },
  CSS: { categories: ["frontend"], languages: ["html-css"] },
  JavaScript: { categories: ["frontend"], languages: ["js"] },
  TypeScript: { categories: ["frontend", "backend"], languages: ["ts"] },
  Python: { categories: ["backend", "tools"], languages: ["python"] },
  React: { categories: ["frontend"], languages: ["js", "ts"] },
  Next: { categories: ["frontend", "backend"], languages: ["ts"] },
  Node: { categories: ["backend"], languages: ["js", "ts"] },
  Nest: { categories: ["backend"], languages: ["ts"] },
  SQL: { categories: ["backend"], languages: ["sql"] },
  Vue: { categories: ["frontend"], languages: ["js", "ts"] },
  Nuxt: { categories: ["frontend", "backend"], languages: ["ts"] },
  Docker: { categories: ["tools", "backend"], languages: ["shell"] },
  Linux: { categories: ["tools", "backend"], languages: ["shell"] },
  Тестирование: { categories: ["tools", "frontend"], languages: ["js", "ts"] },
  "Алгоритмы и структуры данных": { categories: ["cs"], languages: ["js"] },
  SEO: { categories: ["frontend"], languages: ["html-css"] },
  "Frontend System Design": { categories: ["frontend", "cs"], languages: ["ts"] },
  "Сборка и инструменты": { categories: ["tools", "frontend"], languages: ["js", "ts"] },
  "Задачи с лайвкодинга": { categories: ["career", "frontend"], languages: ["js", "ts"] },
  "Поведенческое интервью": { categories: ["career"], languages: [] },
  Agile: { categories: ["career"], languages: [] },
  Игры: { categories: ["gamedev", "frontend"], languages: ["js", "ts", "glsl"] },
};

export function sectionMeta(title: string): SectionMeta {
  return META[title] ?? { categories: ["other"], languages: [] };
}
