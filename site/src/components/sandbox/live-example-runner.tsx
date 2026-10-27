"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackPreview,
  SandpackProvider,
  SandpackTests,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { ExternalLinkIcon, RotateCcwIcon, TerminalIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { exampleStarter, templateEnvironment, type Starter } from "./starters";
import type { ExampleBlock } from "./shared";
import { saveAsLessonProject } from "./storage";
import { ADDITIONAL_LANGUAGES, IconButton, useSandpackSiteTheme } from "./sandpack-shared";

function Toolbar({ project, onClose, showConsole, toggleConsole }: { project: Starter; onClose: () => void; showConsole: boolean; toggleConsole: () => void }) {
  const { sandpack } = useSandpack();
  const router = useRouter();

  const openInSandbox = () => {
    const files = Object.fromEntries(Object.entries(sandpack.files).map(([path, f]) => [path, f.code]));
    saveAsLessonProject({
      template: project.template,
      mode: project.mode,
      files,
      activeFile: sandpack.activeFile,
      hint: project.hint,
    });
    router.push("/sandbox/");
  };

  return (
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-2 border-b pl-3 pr-1.5 md:h-10 md:pl-4">
      <span className="label py-2">{project.mode === "tests" ? "Тесты · редактируйте код" : "Живой пример · редактируйте код"}</span>
      <div className="flex items-center">
        {project.mode === "preview" && (
          <IconButton label={showConsole ? "Скрыть консоль" : "Показать консоль"} onClick={toggleConsole}>
            <TerminalIcon className={cn("size-3.5", showConsole && "text-foreground")} />
          </IconButton>
        )}
        <IconButton label="Вернуть исходный код" onClick={() => sandpack.resetAllFiles()}>
          <RotateCcwIcon className="size-3.5" />
        </IconButton>
        <IconButton label="Открыть в песочнице" onClick={openInSandbox}>
          <ExternalLinkIcon className="size-3.5" />
        </IconButton>
        <IconButton label="Свернуть" onClick={onClose}>
          <XIcon className="size-3.5" />
        </IconButton>
      </div>
    </div>
  );
}

/** Мини-песочница под блоком кода урока: редактор файлов примера + превью (или тесты) + консоль. */
export function LiveExampleRunner({ blocks, title, onClose }: { blocks: ExampleBlock[]; title?: string; onClose: () => void }) {
  const theme = useSandpackSiteTheme();
  const project = useMemo(() => exampleStarter(blocks, title), [blocks, title]);
  const [showConsole, setShowConsole] = useState(() => blocks.some((b) => /console\.(log|info|warn|error|table)/.test(b.code)));

  return (
    <SandpackProvider
      files={project.files}
      customSetup={{ environment: templateEnvironment(project.template) }}
      theme={theme}
      options={{
        activeFile: project.activeFile,
        visibleFiles: project.visibleFiles,
        recompileMode: "delayed",
        recompileDelay: 500,
      }}
      className="refront-sandbox"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Toolbar project={project} onClose={onClose} showConsole={showConsole} toggleConsole={() => setShowConsole((v) => !v)} />
      <div className="grid md:h-[400px] md:grid-cols-2">
        <div className="h-[280px] min-h-0 min-w-0 overflow-hidden md:h-auto">
          <SandpackCodeEditor
            className="refront-editor"
            style={{ height: "100%" }}
            showTabs
            showLineNumbers
            showInlineErrors
            showRunButton={false}
            additionalLanguages={ADDITIONAL_LANGUAGES}
          />
        </div>
        <div className="flex h-[320px] min-h-0 min-w-0 flex-col overflow-hidden border-t md:h-auto md:border-l md:border-t-0">
          {project.mode === "tests" ? (
            <SandpackTests className="refront-tests" style={{ flex: "1 1 0", minHeight: 0 }} watchMode />
          ) : (
            <SandpackPreview
              className="refront-preview"
              style={{ flex: "1 1 0", minHeight: 0 }}
              showOpenInCodeSandbox={false}
              showRefreshButton
              showOpenNewtab={false}
            />
          )}
          {showConsole && project.mode === "preview" && (
            <div className="h-32 shrink-0 border-t">
              <SandpackConsole className="refront-console" style={{ height: "100%" }} resetOnPreviewRestart />
            </div>
          )}
        </div>
      </div>
    </SandpackProvider>
  );
}
