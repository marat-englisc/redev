export type NodeKind = "folder" | "lesson";

/** Узел дерева контента. Папки — разделы и темы, файлы — уроки. */
export interface ContentNode {
  kind: NodeKind;
  /** Стабильный id (хеш пути без номеров) — ключ прогресса в localStorage. */
  id: string;
  /** Номер из имени файла/папки: «01», «12» или null. */
  num: string | null;
  title: string;
  /** URL без basePath, например /l/01/03/02/ */
  href: string;
  slug: string[];
  /** Путь файла/папки относительно корня конспекта. */
  rel: string;
  children: ContentNode[];
  /** Только для уроков: абсолютный путь к .md */
  file?: string;
}

/** Облегчённый узел для передачи на клиент. */
export interface NavNode {
  kind: NodeKind;
  id: string;
  num: string | null;
  title: string;
  href: string;
  children?: NavNode[];
}

/** Запись поискового индекса (/search-index.json). */
export interface IndexEntry {
  id: string;
  title: string;
  href: string;
  /** «JavaScript / Основы языка» */
  path: string;
  section: string;
}

/** Карточка для интервального повторения (/cards.json). */
export interface CardContent {
  id: string;
  title: string;
  href: string;
  path: string;
  section: string;
  /** id всех папок-предков: для повторения отдельного раздела */
  anc: string[];
  /** HTML вопроса */
  q: string;
  /** HTML краткого ответа */
  a: string;
}

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}
