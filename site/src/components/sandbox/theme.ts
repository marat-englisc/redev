import type { SandpackTheme } from "@codesandbox/sandpack-react";

/**
 * Интерфейс песочницы берёт цвета из CSS-переменных сайта (монохром),
 * а подсветка синтаксиса — палитры One Light / One Dark, как в уроках (Shiki).
 */
const ui: SandpackTheme["colors"] = {
  // surface1 задаётся hex-ом в каждой теме (= --background сайта): по нему Sandpack определяет светлый/тёмный режим
  surface1: "var(--background)",
  surface2: "var(--border)",
  surface3: "var(--muted)",
  disabled: "var(--faint)",
  base: "var(--muted-foreground)",
  clickable: "var(--muted-foreground)",
  hover: "var(--foreground)",
  accent: "var(--foreground)",
  error: "var(--foreground)",
  errorSurface: "var(--muted)",
  warning: "var(--foreground)",
  warningSurface: "var(--muted)",
};

const font: SandpackTheme["font"] = {
  body: "var(--font-geist-sans), system-ui, sans-serif",
  mono: "var(--font-geist-mono), ui-monospace, monospace",
  size: "13px",
  lineHeight: "21px",
};

export const lightTheme: SandpackTheme = {
  colors: { ...ui, surface1: "#ffffff" },
  syntax: {
    plain: "#383a42",
    comment: { color: "#a0a1a7", fontStyle: "italic" },
    keyword: "#a626a4",
    definition: "#4078f2",
    punctuation: "#383a42",
    property: "#e45649",
    tag: "#e45649",
    static: "#986801",
    string: "#50a14f",
  },
  font,
};

export const darkTheme: SandpackTheme = {
  colors: { ...ui, surface1: "#040404" },
  syntax: {
    plain: "#abb2bf",
    comment: { color: "#7f848e", fontStyle: "italic" },
    keyword: "#c678dd",
    definition: "#61afef",
    punctuation: "#abb2bf",
    property: "#e06c75",
    tag: "#e06c75",
    static: "#d19a66",
    string: "#98c379",
  },
  font,
};
