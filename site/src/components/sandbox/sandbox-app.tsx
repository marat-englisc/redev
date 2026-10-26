"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackFileExplorer,
  SandpackPreview,
  SandpackProvider,
  SandpackTests,
  UnstyledOpenInCodeSandboxButton,
  useSandpack,
} from "@codesandbox/sandpack-react";
import {
  CodeIcon,
  Columns2Icon,
  ExternalLinkIcon,
  EyeIcon,
  FilePlusIcon,
  FlaskConicalIcon,
  FolderTreeIcon,
  PencilIcon,
  RotateCcwIcon,
  TerminalIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { STARTERS, exampleStarter, templateEnvironment, type ProjectId, type SandboxTemplate, type Starter } from "./starters";
import { LESSON_SNIPPET_KEY, type LessonSnippet } from "./shared";
import { CURRENT_KEY, PROJECT_KEY, VIEW_KEY, readJSON, removeKey, saveAsLessonProject, writeJSON, type SavedProject } from "./storage";
import { ADDITIONAL_LANGUAGES, IconButton, useSandpackSiteTheme } from "./sandpack-shared";
import { useOnline } from "@/lib/offline";

/* ───────────── загрузка проектов ───────────── */

function loadProject(id: ProjectId): Starter | null {
  const saved = readJSON<SavedProject>(PROJECT_KEY(id));
  const starter = STARTERS.find((s) => s.id === id);
  if (saved?.files && Object.keys(saved.files).length) {
    return {
      id,
      label: saved.label ?? starter?.label ?? "Из урока",
      hint: saved.hint ?? starter?.hint ?? "",
      template: saved.template,
      mode: saved.mode ?? starter?.mode ?? "preview",
      activeFile: saved.activeFile,
      files: saved.files,
    };
  }
  return starter ?? null;
}

/** Код, переданный из урока кнопкой ▶, становится проектом «Из урока». */
function takeLessonSnippet(): Starter | null {
  const snippet = readJSON<LessonSnippet>(LESSON_SNIPPET_KEY);
  if (!snippet?.blocks?.length) return null;
  removeKey(LESSON_SNIPPET_KEY);
  const project = exampleStarter(snippet.blocks, snippet.title);
  // сохраняем сразу: в StrictMode инициализатор вызывается дважды
  saveAsLessonProject({
    template: project.template,
    mode: project.mode,
    files: project.files,
    activeFile: project.activeFile,
    hint: project.hint,
  });
  return project;
}

/* ───────────── автосохранение ───────────── */

function AutoSave({ id, template, mode, label, hint }: { id: ProjectId; template: SandboxTemplate; mode: Starter["mode"]; label: string; hint: string }) {
  const { sandpack } = useSandpack();
  const { files, activeFile } = sandpack;

  useEffect(() => {
    const t = setTimeout(() => {
      const plain = Object.fromEntries(Object.entries(files).map(([path, f]) => [path, f.code]));
      writeJSON(PROJECT_KEY(id), { template, mode, files: plain, activeFile, label, hint } satisfies SavedProject);
    }, 400);
    return () => clearTimeout(t);
  }, [files, activeFile, id, template, mode, label, hint]);

  return null;
}

/* ───────────── панель файлов ───────────── */

const PROTECTED = new Set(["/package.json", "/index.html", "/public/index.html", "/index.tsx", "/src/main.ts"]);

function normalizePath(raw: string) {
  const path = raw.trim().replace(/\\/g, "/").replace(/\/{2,}/g, "/");
  return path.startsWith("/") ? path : `/${path}`;
}

function FilePanel() {
  const { sandpack } = useSandpack();
  const { files, activeFile, addFile, deleteFile, openFile } = sandpack;
  const [mode, setMode] = useState<"create" | "rename" | null>(null);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode) inputRef.current?.focus();
  }, [mode]);

  const start = (next: "create" | "rename") => {
    setMode(next);
    setValue(next === "rename" ? activeFile : `${activeFile.slice(0, activeFile.lastIndexOf("/") + 1)}`);
  };

  const submit = () => {
    const path = normalizePath(value);
    if (!mode) return;
    if (path.endsWith("/") || !/\.[a-z0-9]+$/i.test(path)) {
      toast.error("Укажите имя файла с расширением, например components/Card.tsx");
      return;
    }
    if (files[path] && path !== activeFile) {
      toast.error(`Файл ${path} уже существует`);
      return;
    }
    if (mode === "create") {
      addFile(path, "");
      openFile(path);
    } else if (path !== activeFile) {
      const code = files[activeFile].code;
      addFile(path, code);
      openFile(path);
      deleteFile(activeFile);
      toast.message("Файл переименован — не забудьте обновить импорты");
    }
    setMode(null);
  };

  const remove = () => {
    if (PROTECTED.has(activeFile)) {
      toast.error("Этот файл нужен для запуска проекта");
      return;
    }
    if (!confirm(`Удалить ${activeFile}?`)) return;
    deleteFile(activeFile);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b pl-3 pr-1.5">
        <span className="label">Файлы</span>
        <div className="flex items-center">
          <IconButton label="Новый файл" onClick={() => start("create")}>
            <FilePlusIcon className="size-3.5" />
          </IconButton>
          <IconButton label="Переименовать текущий файл" onClick={() => start("rename")}>
            <PencilIcon className="size-3.5" />
          </IconButton>
          <IconButton label="Удалить текущий файл" onClick={remove} disabled={PROTECTED.has(activeFile)}>
            <Trash2Icon className="size-3.5" />
          </IconButton>
        </div>
      </div>
      {mode && (
        <form
          className="border-b p-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setMode(null)}
            onBlur={() => setMode(null)}
            placeholder="/components/Card.tsx"
            className="h-7 w-full rounded-md border bg-background px-2 font-mono text-xs outline-none focus:border-foreground/40"
          />
          <p className="mt-1.5 px-0.5 text-[11px] leading-snug text-muted-foreground">
            Enter — {mode === "create" ? "создать" : "переименовать"}, Esc — отмена. Папки создаются по пути.
          </p>
        </form>
      )}
      <SandpackFileExplorer className="refront-explorer" style={{ flex: "1 1 0", minHeight: 0 }} autoHiddenFiles={false} />
    </div>
  );
}

/* ───────────── основной экран ───────────── */

type View = "code" | "split" | "preview";

const VIEWS: { id: View; label: string; icon: typeof CodeIcon }[] = [
  { id: "code", label: "Код", icon: CodeIcon },
  { id: "split", label: "Код и превью", icon: Columns2Icon },
  { id: "preview", label: "Просмотр", icon: EyeIcon },
];

const TEST_VIEWS: typeof VIEWS = [
  { id: "code", label: "Код", icon: CodeIcon },
  { id: "split", label: "Код и тесты", icon: Columns2Icon },
  { id: "preview", label: "Тесты", icon: FlaskConicalIcon },
];

function Segmented<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { id: T; label: string; icon?: typeof CodeIcon }[];
}) {
  return (
    <div className="flex h-8 shrink-0 items-center rounded-md border p-0.5">
      {items.map((it) => {
        const Icon = it.icon;
        const active = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            aria-pressed={active}
            title={it.label}
            className={cn(
              "flex h-full items-center gap-1.5 rounded-[4px] px-2.5 text-[12px] whitespace-nowrap transition-colors",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            <span className={cn(Icon && "hidden xl:inline")}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Workspace({ view, showFiles, showConsole, mode }: { view: View; showFiles: boolean; showConsole: boolean; mode: Starter["mode"] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      {showFiles && view !== "preview" && (
        <aside className="h-40 shrink-0 overflow-hidden border-b md:h-auto md:w-56 md:border-b-0 md:border-r">
          <FilePanel />
        </aside>
      )}

      <div className={cn("min-h-0 min-w-0 flex-1 overflow-hidden", view === "preview" && "hidden")}>
        <SandpackCodeEditor
          className="refront-editor"
          style={{ height: "100%" }}
          showTabs
          closableTabs
          showLineNumbers
          showInlineErrors
          showRunButton={false}
          additionalLanguages={ADDITIONAL_LANGUAGES}
        />
      </div>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-t md:border-l md:border-t-0",
          view === "code" && "hidden",
          view === "preview" && "border-0 md:border-0",
        )}
      >
        {mode === "tests" ? (
          // тесты в стиле Jest выполняются прямо в браузере; watch-режим перезапускает их при правках
          <SandpackTests className="refront-tests" style={{ flex: "1 1 0", minHeight: 0 }} watchMode verbose />
        ) : (
          <SandpackPreview
            className="refront-preview"
            style={{ flex: "1 1 0", minHeight: 0 }}
            showNavigator={view === "preview"}
            showOpenInCodeSandbox={false}
            showRefreshButton
            showOpenNewtab={false}
          />
        )}
        {showConsole && (
          <div className="h-48 shrink-0 border-t">
            <SandpackConsole className="refront-console" style={{ height: "100%" }} resetOnPreviewRestart showHeader />
          </div>
        )}
      </div>
    </div>
  );
}

function initialProject(): Starter {
  const savedId = readJSON<ProjectId>(CURRENT_KEY);
  return takeLessonSnippet() ?? (savedId && loadProject(savedId)) ?? STARTERS[0];
}

/** Рендерится только в браузере (dynamic с ssr: false), поэтому localStorage читается прямо в инициализаторах. */
export function SandboxApp() {
  const theme = useSandpackSiteTheme();
  const online = useOnline();
  const [project, setProject] = useState<Starter>(initialProject);
  const [version, setVersion] = useState(0); // смена ключа пересоздаёт SandpackProvider
  const [view, setView] = useState<View>(() => readJSON<View>(VIEW_KEY) ?? "split");
  const [showFiles, setShowFiles] = useState(() => !window.matchMedia("(max-width: 767px)").matches);
  const [showConsole, setShowConsole] = useState(false);

  useEffect(() => writeJSON(CURRENT_KEY, project.id), [project]);

  useEffect(() => writeJSON(VIEW_KEY, view), [view]);

  const tabs = useMemo(() => {
    const list = STARTERS.map((s) => ({ id: s.id, label: s.label }));
    const hasLesson = project.id === "lesson" || Boolean(readJSON(PROJECT_KEY("lesson")));
    return hasLesson ? [...list, { id: "lesson" as ProjectId, label: "Из урока" }] : list;
  }, [project]);

  const switchProject = (id: ProjectId) => {
    const next = loadProject(id);
    if (next) setProject(next);
  };

  const reset = () => {
    if (project.id === "lesson") {
      if (!confirm("Удалить проект «Из урока»?")) return;
      removeKey(PROJECT_KEY("lesson"));
      setProject(STARTERS[0]);
      return;
    }
    if (!confirm(`Вернуть проект «${project.label}» к исходному состоянию? Ваши изменения будут потеряны.`)) return;
    removeKey(PROJECT_KEY(project.id));
    setProject(STARTERS.find((s) => s.id === project.id)!);
    setVersion((v) => v + 1);
    toast.success("Проект сброшен");
  };

  return (
    <SandpackProvider
      key={`${project.id}:${version}`}
      files={project.files}
      customSetup={{ environment: templateEnvironment(project.template) }}
      theme={theme}
      options={{
        activeFile: project.activeFile,
        visibleFiles: project.visibleFiles ?? [project.activeFile],
        recompileMode: "delayed",
        recompileDelay: 500,
        initMode: "immediate",
      }}
      className="refront-sandbox"
      // стили Sandpack (stitches) не в CSS-слоях и перебивают утилиты Tailwind, поэтому раскладка — инлайном
      style={{ display: "flex", flexDirection: "column", flex: "1 1 0", minHeight: 0, overflow: "hidden" }}
    >
      <AutoSave id={project.id} template={project.template} mode={project.mode} label={project.label} hint={project.hint} />

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2 sm:px-6">
        <div className="-mx-1 flex w-full min-w-0 items-center gap-1 overflow-x-auto px-1 no-scrollbar sm:w-auto sm:flex-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchProject(t.id)}
              aria-pressed={project.id === t.id}
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-md border px-3 text-[13px] whitespace-nowrap transition-colors",
                project.id === t.id
                  ? "border-foreground bg-foreground text-background"
                  : "text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
          <span className="ml-2 hidden truncate text-[12px] text-muted-foreground 2xl:inline">{project.hint}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Segmented value={view} onChange={setView} items={project.mode === "tests" ? TEST_VIEWS : VIEWS} />
          <IconButton label={showFiles ? "Скрыть файлы" : "Показать файлы"} onClick={() => setShowFiles((v) => !v)}>
            <FolderTreeIcon className={cn("size-4", showFiles && "text-foreground")} />
          </IconButton>
          <IconButton label={showConsole ? "Скрыть консоль" : "Показать консоль"} onClick={() => setShowConsole((v) => !v)}>
            <TerminalIcon className={cn("size-4", showConsole && "text-foreground")} />
          </IconButton>
          <IconButton label={project.id === "lesson" ? "Удалить проект" : "Сбросить проект"} onClick={reset}>
            <RotateCcwIcon className="size-4" />
          </IconButton>
          <UnstyledOpenInCodeSandboxButton
            title="Открыть в CodeSandbox"
            className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLinkIcon className="size-4" />
          </UnstyledOpenInCodeSandboxButton>
        </div>
      </div>

      {!online && (
        <div className="shrink-0 border-b bg-muted/60 px-4 py-2 text-[13px] text-muted-foreground sm:px-6">
          Нет подключения: код собирается на серверах CodeSandbox, поэтому превью и тесты недоступны. Редактировать файлы можно — всё
          сохранится в браузере.
        </div>
      )}
      <Workspace view={view} showFiles={showFiles} showConsole={showConsole} mode={project.mode} />
    </SandpackProvider>
  );
}
