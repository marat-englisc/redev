import { SANDBOX_TEMPLATES, type SandboxEnvironment } from "@codesandbox/sandpack-react";
import type { LessonSnippet } from "./shared";

/** Среды Sandpack, которые используются в песочнице. */
export type SandboxTemplate = "static" | "vanilla" | "vanilla-ts" | "react-ts";

export type ProjectId = "html" | "js" | "ts" | "react" | "canvas" | "lesson";

export interface Starter {
  id: ProjectId;
  label: string;
  hint: string;
  template: SandboxTemplate;
  activeFile: string;
  files: Record<string, string>;
}

/** Служебные файлы шаблона (package.json, tsconfig, public/index.html) с нормализованными путями. */
export function templateBase(template: SandboxTemplate): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, file] of Object.entries(SANDBOX_TEMPLATES[template].files)) {
    out[path.startsWith("/") ? path : `/${path}`] = (file as { code: string }).code;
  }
  return out;
}

export function templateEnvironment(template: SandboxTemplate) {
  return SANDBOX_TEMPLATES[template].environment as SandboxEnvironment;
}

const HTML_FILES = {
  "/index.html": `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Песочница</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="page">
      <h1>Карточки</h1>
      <p class="lead">Меняйте разметку и стили — превью обновится сразу.</p>

      <ul class="cards">
        <li class="card">
          <span class="card__tag">CSS</span>
          <h2>Grid</h2>
          <p>Двумерная раскладка: строки и колонки.</p>
        </li>
        <li class="card">
          <span class="card__tag">CSS</span>
          <h2>Flexbox</h2>
          <p>Одномерная раскладка вдоль главной оси.</p>
        </li>
        <li class="card card--accent">
          <span class="card__tag">HTML</span>
          <h2>Семантика</h2>
          <p>header, main, article, nav — смысл, а не только вид.</p>
        </li>
      </ul>

      <button class="button" id="theme">Сменить тему</button>
    </main>
    <script src="/script.js"></script>
  </body>
</html>
`,
  "/styles.css": `:root {
  --bg: #ffffff;
  --fg: #111111;
  --muted: #6b7280;
  --border: #e5e7eb;
  --accent: #111111;
}

.dark {
  --bg: #111111;
  --fg: #f5f5f5;
  --muted: #9ca3af;
  --border: #2a2a2a;
  --accent: #f5f5f5;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: var(--bg);
  color: var(--fg);
  transition: background 0.2s, color 0.2s;
}

.page { max-width: 880px; margin: 0 auto; padding: 48px 24px; }
.lead { color: var(--muted); }

.cards {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  transition: transform 0.2s;
}
.card:hover { transform: translateY(-4px); }
.card h2 { margin: 12px 0 8px; font-size: 20px; }
.card p { margin: 0; color: var(--muted); }
.card--accent { background: var(--accent); color: var(--bg); }
.card--accent p { color: inherit; opacity: 0.7; }

.card__tag {
  font: 600 11px/1 ui-monospace, monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.button {
  margin-top: 24px;
  padding: 10px 16px;
  border: 1px solid var(--fg);
  border-radius: 6px;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
}
`,
  "/script.js": `document.getElementById("theme").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});
`,
};

const JS_FILES = {
  "/index.html": `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>JavaScript</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="index.js"></script>
  </body>
</html>
`,
  "/index.js": `import "./styles.css";
import { formatPrice, sum } from "./utils/math.js";
import { renderList } from "./ui.js";

const cart = [
  { title: "Клавиатура", price: 4990 },
  { title: "Мышь", price: 1990 },
  { title: "Коврик", price: 790 },
];

const total = sum(cart.map((item) => item.price));
console.log("Итого:", total);  // смотрите вкладку «Консоль»

document.getElementById("app").innerHTML = \`
  <h1>Корзина</h1>
  \${renderList(cart)}
  <p class="total">Итого: \${formatPrice(total)}</p>
\`;
`,
  "/utils/math.js": `export const sum = (numbers) => numbers.reduce((acc, n) => acc + n, 0);

export const formatPrice = (value) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(value);
`,
  "/ui.js": `import { formatPrice } from "./utils/math.js";

export function renderList(items) {
  return \`<ul>\${items
    .map((item) => \`<li><span>\${item.title}</span><b>\${formatPrice(item.price)}</b></li>\`)
    .join("")}</ul>\`;
}
`,
  "/styles.css": `body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; }
ul { list-style: none; padding: 0; max-width: 360px; }
li { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
.total { font-weight: 600; }
`,
};

const TS_FILES = {
  "/index.html": `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>TypeScript</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="index.ts"></script>
  </body>
</html>
`,
  "/index.ts": `import "./styles.css";
import { createStore } from "./store";
import type { Todo } from "./types";

const store = createStore<Todo[]>([
  { id: 1, title: "Разобрать generics", done: true },
  { id: 2, title: "Потренировать utility types", done: false },
]);

const app = document.getElementById("app")!;

function render(todos: Todo[]) {
  app.innerHTML = \`
    <h1>Задачи</h1>
    <ul>\${todos
      .map((t) => \`<li data-id="\${t.id}" class="\${t.done ? "done" : ""}">\${t.title}</li>\`)
      .join("")}</ul>
    <p>Готово: \${todos.filter((t) => t.done).length} из \${todos.length}</p>
  \`;
}

app.addEventListener("click", (e) => {
  const li = (e.target as HTMLElement).closest("li");
  if (!li) return;
  const id = Number(li.dataset.id);
  store.set((todos) => todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
});

store.subscribe(render);
render(store.get());
`,
  "/store.ts": `type Listener<T> = (state: T) => void;

export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<Listener<T>>();

  return {
    get: () => state,
    set(update: (prev: T) => T) {
      state = update(state);
      listeners.forEach((listener) => listener(state));
    },
    subscribe(listener: Listener<T>) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
`,
  "/types.ts": `export interface Todo {
  id: number;
  title: string;
  done: boolean;
}
`,
  "/styles.css": `body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; }
li { cursor: pointer; padding: 4px 0; }
li.done { text-decoration: line-through; color: #9ca3af; }
`,
};

const REACT_FILES = {
  "/App.tsx": `import { useState } from "react";
import { Button } from "./components/Button";
import { Counter } from "./components/Counter";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  const { theme, toggle } = useTheme();
  const [step, setStep] = useState(1);

  return (
    <main className={\`app \${theme}\`}>
      <h1>React-песочница</h1>
      <p className="muted">Компоненты лежат в разных файлах и импортируются друг в друга.</p>

      <Counter step={step} />

      <div className="row">
        {[1, 5, 10].map((n) => (
          <Button key={n} variant={n === step ? "solid" : "outline"} onClick={() => setStep(n)}>
            Шаг {n}
          </Button>
        ))}
      </div>

      <Button variant="ghost" onClick={toggle}>
        Тема: {theme === "dark" ? "тёмная" : "светлая"}
      </Button>
    </main>
  );
}
`,
  "/components/Button.tsx": `import type { ButtonHTMLAttributes } from "react";

type Variant = "solid" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "solid", className = "", ...props }: ButtonProps) {
  return <button className={\`button button--\${variant} \${className}\`} {...props} />;
}
`,
  "/components/Counter.tsx": `import { useState } from "react";
import { Button } from "./Button";

export function Counter({ step }: { step: number }) {
  const [count, setCount] = useState(0);

  return (
    <section className="counter">
      <Button variant="outline" onClick={() => setCount((c) => c - step)}>−{step}</Button>
      <output>{count}</output>
      <Button variant="outline" onClick={() => setCount((c) => c + step)}>+{step}</Button>
    </section>
  );
}
`,
  "/hooks/useTheme.ts": `import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("theme") === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}
`,
  "/styles.css": `* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }

.app { min-height: 100vh; padding: 40px 24px; background: #fff; color: #111; transition: background 0.2s; }
.app.dark { background: #111; color: #f5f5f5; }
.muted { opacity: 0.6; }
.row { display: flex; gap: 8px; margin: 16px 0; }

.counter { display: flex; align-items: center; gap: 16px; margin-top: 24px; }
.counter output { min-width: 3ch; text-align: center; font: 600 32px/1 ui-monospace, monospace; }

.button { padding: 8px 14px; border-radius: 6px; border: 1px solid currentColor; font: inherit; cursor: pointer; }
.button--solid { background: #111; color: #fff; border-color: #111; }
.dark .button--solid { background: #f5f5f5; color: #111; border-color: #f5f5f5; }
.button--outline { background: transparent; color: inherit; }
.button--ghost { background: transparent; color: inherit; border-color: transparent; text-decoration: underline; }
`,
};

const CANVAS_FILES = {
  "/index.html": `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Canvas</title>
  </head>
  <body>
    <canvas id="game"></canvas>
    <script src="index.ts"></script>
  </body>
</html>
`,
  "/index.ts": `import "./styles.css";
import { Ball } from "./ball";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

function resize() {
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize);
resize();

const balls = Array.from({ length: 12 }, () => new Ball(canvas.clientWidth, canvas.clientHeight));

// клик добавляет новый мяч в точке нажатия
canvas.addEventListener("pointerdown", (e) => {
  balls.push(new Ball(canvas.clientWidth, canvas.clientHeight, e.offsetX, e.offsetY));
});

let last = performance.now();
function loop(now: number) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  for (const ball of balls) {
    ball.update(dt, canvas.clientWidth, canvas.clientHeight);
    ball.draw(ctx);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
`,
  "/styles.css": `html, body { margin: 0; height: 100%; background: #0f172a; }
canvas { display: block; width: 100%; height: 100%; }
`,
  "/ball.ts": `const GRAVITY = 900;

export class Ball {
  x: number;
  y: number;
  vx = (Math.random() - 0.5) * 400;
  vy = (Math.random() - 0.5) * 400;
  r = 8 + Math.random() * 16;
  color = \`hsl(\${Math.random() * 360} 80% 60%)\`;

  constructor(width: number, height: number, x?: number, y?: number) {
    this.x = x ?? Math.random() * width;
    this.y = y ?? Math.random() * height * 0.5;
  }

  update(dt: number, width: number, height: number) {
    this.vy += GRAVITY * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y + this.r > height) { this.y = height - this.r; this.vy *= -0.85; }
    if (this.x - this.r < 0) { this.x = this.r; this.vx *= -1; }
    if (this.x + this.r > width) { this.x = width - this.r; this.vx *= -1; }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
`,
};

function withBase(template: SandboxTemplate, files: Record<string, string>, drop: string[] = []) {
  const base = templateBase(template);
  for (const path of drop) delete base[path];
  return { ...base, ...files };
}

export const STARTERS: Starter[] = [
  {
    id: "html",
    label: "HTML / CSS",
    hint: "Вёрстка: разметка, стили и немного JS",
    template: "static",
    activeFile: "/index.html",
    files: withBase("static", HTML_FILES),
  },
  {
    id: "js",
    label: "JavaScript",
    hint: "ES-модули: импорты между файлами",
    template: "vanilla",
    activeFile: "/index.js",
    files: withBase("vanilla", JS_FILES),
  },
  {
    id: "ts",
    label: "TypeScript",
    hint: "Типы, generics и модули",
    template: "vanilla-ts",
    activeFile: "/index.ts",
    files: withBase("vanilla-ts", TS_FILES),
  },
  {
    id: "react",
    label: "React",
    hint: "Компоненты в разных файлах, хуки, TSX",
    template: "react-ts",
    activeFile: "/App.tsx",
    files: withBase("react-ts", REACT_FILES),
  },
  {
    id: "canvas",
    label: "Canvas",
    hint: "Игровой цикл и анимация на canvas",
    template: "vanilla-ts",
    activeFile: "/index.ts",
    files: withBase("vanilla-ts", CANVAS_FILES),
  },
];

/* ───────────── код из урока ───────────── */

/** Собирает проект «Из урока» под язык блока кода. */
export function snippetStarter(snippet: LessonSnippet): Starter {
  const lang = snippet.lang.toLowerCase();
  const base = { id: "lesson" as const, label: "Из урока", hint: snippet.title ?? "Код из урока" };

  if (lang === "html") {
    const html = /<html|<!doctype/i.test(snippet.code)
      ? snippet.code
      : `<!DOCTYPE html>\n<html lang="ru">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="stylesheet" href="/styles.css" />\n  </head>\n  <body>\n${snippet.code}\n  </body>\n</html>\n`;
    return { ...base, template: "static", activeFile: "/index.html", files: withBase("static", { "/index.html": html, "/styles.css": "" }) };
  }
  if (lang === "css") {
    return {
      ...base,
      template: "static",
      activeFile: "/styles.css",
      files: withBase("static", {
        "/index.html": HTML_FILES["/index.html"].replace('\n    <script src="/script.js"></script>', ""),
        "/styles.css": snippet.code,
      }),
    };
  }
  if (lang === "tsx" || lang === "jsx") {
    const hasDefault = /export\s+default/.test(snippet.code);
    const app = hasDefault
      ? snippet.code
      : `${snippet.code}\n\nexport default function App() {\n  return <p>Добавьте сюда компонент из примера выше.</p>;\n}\n`;
    return { ...base, template: "react-ts", activeFile: "/App.tsx", files: withBase("react-ts", { "/App.tsx": app, "/styles.css": "body { font-family: system-ui, sans-serif; }\n" }) };
  }
  if (lang === "ts" || lang === "typescript") {
    return {
      ...base,
      template: "vanilla-ts",
      activeFile: "/index.ts",
      files: withBase("vanilla-ts", { "/index.ts": snippet.code, "/index.html": TS_FILES["/index.html"], "/styles.css": "" }),
    };
  }
  return {
    ...base,
    template: "vanilla",
    activeFile: "/index.js",
    files: withBase("vanilla", { "/index.js": snippet.code, "/index.html": JS_FILES["/index.html"], "/styles.css": "" }),
  };
}
