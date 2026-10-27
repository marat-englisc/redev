"use client";

import { useTheme } from "next-themes";
import { vue } from "@codemirror/lang-vue";
import type { SandpackCodeEditor } from "@codesandbox/sandpack-react";
import { darkTheme, lightTheme } from "./theme";

/** Подсветка .vue: редактор Sandpack из коробки знает только JS/TS, HTML и CSS. */
export const ADDITIONAL_LANGUAGES: NonNullable<React.ComponentProps<typeof SandpackCodeEditor>["additionalLanguages"]> = [
  { name: "vue", extensions: ["vue"], language: vue() },
];

/** Тема Sandpack, синхронная с темой сайта. */
export function useSandpackSiteTheme() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "light" ? lightTheme : darkTheme;
}

export function IconButton({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 md:size-7"
    >
      {children}
    </button>
  );
}
