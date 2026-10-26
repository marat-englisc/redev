import { toast } from "sonner";
import type { ProjectId, SandboxTemplate, Starter } from "./starters";

/** Проект в localStorage: всё, что нужно, чтобы восстановить его после перезагрузки. */
export interface SavedProject {
  template: SandboxTemplate;
  mode?: Starter["mode"];
  files: Record<string, string>;
  activeFile: string;
  label?: string;
  hint?: string;
}

export const PROJECT_KEY = (id: ProjectId) => `refront:sandbox:v1:${id}`;
export const CURRENT_KEY = "refront:sandbox:current";
export const VIEW_KEY = "refront:sandbox:view";

export function readJSON<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast.error("Не удалось сохранить проект: хранилище браузера недоступно или переполнено");
  }
}

export function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Сохраняет проект как «Из урока» и делает его текущим — песочница откроет его при следующей загрузке. */
export function saveAsLessonProject(project: Omit<SavedProject, "label"> & { label?: string }) {
  writeJSON(PROJECT_KEY("lesson"), { label: "Из урока", ...project } satisfies SavedProject);
  writeJSON(CURRENT_KEY, "lesson");
}
