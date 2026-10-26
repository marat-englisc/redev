import { SANDBOX_TEMPLATES, type SandboxEnvironment } from "@codesandbox/sandpack-react";
import type { ExampleBlock } from "./shared";

/** Среды Sandpack, которые используются в песочнице. */
export type SandboxTemplate = "static" | "vanilla" | "vanilla-ts" | "react-ts" | "vue-ts" | "test-ts";

export type ProjectId = "html" | "js" | "ts" | "react" | "vue" | "canvas" | "tests" | "react-tests" | "lesson";

export interface Starter {
  id: ProjectId;
  label: string;
  hint: string;
  template: SandboxTemplate;
  /** preview — справа превью страницы, tests — панель запуска тестов */
  mode: "preview" | "tests";
  activeFile: string;
  files: Record<string, string>;
  /** файлы, открытые во вкладках редактора (по умолчанию — только активный) */
  visibleFiles?: string[];
}

/** Служебные файлы шаблона (package.json, tsconfig, public/index.html) с нормализованными путями. */
export function templateBase(template: SandboxTemplate): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, file] of Object.entries(SANDBOX_TEMPLATES[template].files)) {
    const code = (file as { code?: unknown }).code;
    if (typeof code === "string") out[path.startsWith("/") ? path : `/${path}`] = code;
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

const VUE_FILES = {
  "/src/App.vue": `<script setup lang="ts">
import { computed, ref } from "vue";
import TodoItem from "./components/TodoItem.vue";
import { useCounter } from "./composables/useCounter";

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

const todos = ref<Todo[]>([
  { id: 1, title: "Разобрать реактивность", done: true },
  { id: 2, title: "Написать composable", done: false },
]);
const draft = ref("");
const left = computed(() => todos.value.filter((t) => !t.done).length);
const { count, inc, dec } = useCounter(0);

function add() {
  if (!draft.value.trim()) return;
  todos.value.push({ id: Date.now(), title: draft.value.trim(), done: false });
  draft.value = "";
}

function toggle(todo: Todo) {
  todo.done = !todo.done;
}
</script>

<template>
  <main class="app">
    <h1>Vue-песочница</h1>
    <p class="muted">SFC-компоненты, composables и TypeScript.</p>

    <form class="row" @submit.prevent="add">
      <input v-model="draft" placeholder="Новая задача" />
      <button>Добавить</button>
    </form>

    <ul>
      <TodoItem v-for="todo in todos" :key="todo.id" :title="todo.title" :done="todo.done" @toggle="toggle(todo)" />
    </ul>
    <p class="muted">Осталось: {{ left }}</p>

    <section class="row">
      <button @click="dec">−</button>
      <output>{{ count }}</output>
      <button @click="inc">+</button>
    </section>
  </main>
</template>
`,
  "/src/components/TodoItem.vue": `<script setup lang="ts">
defineProps<{ title: string; done: boolean }>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <li :class="{ done }" @click="$emit('toggle')">
    <input type="checkbox" :checked="done" @click.stop="$emit('toggle')" />
    {{ title }}
  </li>
</template>

<style scoped>
li { display: flex; gap: 8px; padding: 6px 0; cursor: pointer; }
.done { color: #9ca3af; text-decoration: line-through; }
</style>
`,
  "/src/composables/useCounter.ts": `import { ref } from "vue";

export function useCounter(initial = 0) {
  const count = ref(initial);
  const inc = () => count.value++;
  const dec = () => count.value--;
  return { count, inc, dec };
}
`,
  "/src/shims-vue.d.ts": `declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
`,
  "/src/styles.css": `body { margin: 0; font-family: system-ui, sans-serif; }
.app { max-width: 520px; padding: 40px 24px; }
.muted { color: #6b7280; }
.row { display: flex; align-items: center; gap: 8px; margin: 16px 0; }
input:not([type]) { flex: 1; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; }
button { padding: 8px 14px; border: 1px solid #111; border-radius: 6px; background: #111; color: #fff; cursor: pointer; }
ul { list-style: none; padding: 0; }
output { min-width: 3ch; text-align: center; font: 600 24px/1 ui-monospace, monospace; }
`,
};

const TESTS_FILES = {
  "/package.json": JSON.stringify({ dependencies: {}, devDependencies: { typescript: "^4.0.0" }, main: "/src/math.ts" }),
  "/src/math.ts": `export const sum = (numbers: number[]) => numbers.reduce((acc, n) => acc + n, 0);

export function clamp(value: number, min: number, max: number) {
  if (min > max) throw new RangeError("min больше max");
  return Math.min(max, Math.max(min, value));
}
`,
  "/src/math.test.ts": `import { clamp, sum } from "./math";

describe("sum", () => {
  test("складывает числа", () => {
    expect(sum([1, 2, 3])).toBe(6);
  });

  test("пустой массив даёт 0", () => {
    expect(sum([])).toBe(0);
  });
});

describe("clamp", () => {
  test.each([
    [5, 0, 10, 5],
    [-5, 0, 10, 0],
    [50, 0, 10, 10],
  ])("ограничивает значение диапазоном", (value, min, max, expected) => {
    expect(clamp(value, min, max)).toBe(expected);
  });

  test("бросает ошибку, если min > max", () => {
    expect(() => clamp(1, 10, 0)).toThrow(RangeError);
  });
});
`,
  "/src/cart.ts": `export interface Product {
  id: number;
  price: number;
}

export interface Api {
  getProduct(id: number): Promise<Product>;
}

export class Cart {
  private items: Product[] = [];

  constructor(private api: Api) {}

  async add(id: number) {
    const product = await this.api.getProduct(id);
    this.items.push(product);
  }

  get total() {
    return this.items.reduce((acc, p) => acc + p.price, 0);
  }
}
`,
  "/src/cart.test.ts": `import { Cart, type Api } from "./cart";

describe("Cart", () => {
  let getProduct: jest.Mock;
  let api: Api;

  beforeEach(() => {
    // мок зависимости: тест не ходит в сеть и проверяет, как вызывали API
    getProduct = jest.fn(async (id: number) => ({ id, price: id * 100 }));
    api = { getProduct };
  });

  test("загружает товар через API", async () => {
    const cart = new Cart(api);
    await cart.add(3);

    expect(getProduct).toHaveBeenCalledTimes(1);
    expect(getProduct).toHaveBeenCalledWith(3);
    expect(cart.total).toBe(300);
  });

  test("ошибка API пробрасывается наружу", async () => {
    getProduct.mockRejectedValueOnce(new Error("Сеть недоступна"));
    const cart = new Cart(api);

    await expect(cart.add(1)).rejects.toThrow("Сеть недоступна");
    expect(cart.total).toBe(0);
  });
});
`,
};

const REACT_TESTS_FILES = {
  "/App.tsx": `import { Counter } from "./Counter";
import { LoginForm } from "./LoginForm";

export default function App() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <Counter initial={0} />
      <hr />
      <LoginForm onSubmit={(data) => alert(JSON.stringify(data))} />
    </main>
  );
}
`,
  "/Counter.tsx": `import { useState } from "react";

export function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = useState(initial);
  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Увеличить</button>
      <button onClick={() => setCount(initial)} disabled={count === initial}>
        Сбросить
      </button>
    </div>
  );
}
`,
  "/Counter.test.tsx": `import { render, screen, fireEvent } from "@testing-library/react";
import { Counter } from "./Counter";

describe("Counter", () => {
  test("показывает начальное значение", () => {
    render(<Counter initial={5} />);
    expect(screen.getByText("Счётчик: 5")).toBeTruthy();
  });

  test("увеличивает значение по клику", () => {
    render(<Counter />);
    fireEvent.click(screen.getByRole("button", { name: "Увеличить" }));
    fireEvent.click(screen.getByRole("button", { name: "Увеличить" }));
    expect(screen.getByText("Счётчик: 2")).toBeTruthy();
  });

  test("кнопка сброса неактивна в начальном состоянии", () => {
    render(<Counter />);
    const reset = screen.getByRole("button", { name: "Сбросить" }) as HTMLButtonElement;
    expect(reset.disabled).toBe(true);
  });
});
`,
  "/LoginForm.tsx": `import { useState, type FormEvent } from "react";

interface Props {
  onSubmit: (data: { email: string }) => void;
}

export function LoginForm({ onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Введите корректный email");
      return;
    }
    setError("");
    onSubmit({ email });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button type="submit">Войти</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
`,
  "/LoginForm.test.tsx": `import { render, screen, fireEvent } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  test("показывает ошибку при некорректном email", () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(screen.getByRole("alert").textContent).toBe("Введите корректный email");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("отправляет данные при корректном email", () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dev@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));

    expect(onSubmit).toHaveBeenCalledWith({ email: "dev@example.com" });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
`,
  "/styles.css": `body { margin: 0; }
button { margin-right: 8px; }
`,
};

/** package.json шаблона с дополнительными зависимостями. */
function withDeps(template: SandboxTemplate, deps: Record<string, string>) {
  const pkg = JSON.parse(templateBase(template)["/package.json"]);
  pkg.dependencies = { ...pkg.dependencies, ...deps };
  return JSON.stringify(pkg, null, 2);
}

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
    mode: "preview",
    activeFile: "/index.html",
    files: withBase("static", HTML_FILES),
  },
  {
    id: "js",
    label: "JavaScript",
    hint: "ES-модули: импорты между файлами",
    template: "vanilla",
    mode: "preview",
    activeFile: "/index.js",
    files: withBase("vanilla", JS_FILES),
  },
  {
    id: "ts",
    label: "TypeScript",
    hint: "Типы, generics и модули",
    template: "vanilla-ts",
    mode: "preview",
    activeFile: "/index.ts",
    files: withBase("vanilla-ts", TS_FILES),
  },
  {
    id: "react",
    label: "React",
    hint: "Компоненты в разных файлах, хуки, TSX",
    template: "react-ts",
    mode: "preview",
    activeFile: "/App.tsx",
    files: withBase("react-ts", REACT_FILES),
  },
  {
    id: "vue",
    label: "Vue",
    hint: "SFC, composables, v-model и TypeScript",
    template: "vue-ts",
    mode: "preview",
    activeFile: "/src/App.vue",
    files: withBase("vue-ts", VUE_FILES),
  },
  {
    id: "canvas",
    label: "Canvas",
    hint: "Игровой цикл и анимация на canvas",
    template: "vanilla-ts",
    mode: "preview",
    activeFile: "/index.ts",
    files: withBase("vanilla-ts", CANVAS_FILES),
  },
  {
    id: "tests",
    label: "Jest",
    hint: "Юнит-тесты: describe/test, моки, async",
    template: "test-ts",
    mode: "tests",
    activeFile: "/src/math.test.ts",
    files: withBase("test-ts", TESTS_FILES, ["/add.ts", "/add.test.ts"]),
  },
  {
    id: "react-tests",
    label: "Testing Library",
    hint: "Тесты React-компонентов: render, screen, события",
    template: "react-ts",
    mode: "tests",
    activeFile: "/Counter.test.tsx",
    files: withBase("react-ts", {
      ...REACT_TESTS_FILES,
      "/package.json": withDeps("react-ts", { "@testing-library/react": "^16.0.0", "@testing-library/dom": "^10.0.0" }),
    }),
  },
];

/* ───────────── код из урока ───────────── */

const LANG_ALIASES: Record<string, string> = { javascript: "js", typescript: "ts" };

const isTestCode = (code: string) => /\b(describe|test|it)(\.\w+)?\s*\(/.test(code) && /\bexpect\s*\(/.test(code);

/** Пакеты, которые уже есть в средах Sandpack или не нужны в браузере. */
const BUILTIN_PACKAGES = new Set(["react", "react-dom", "vue", "vitest", "@jest/globals"]);

/** Голые импорты (`from "zustand"`) → зависимости package.json с версией latest. */
function detectDependencies(code: string) {
  const deps: Record<string, string> = {};
  for (const [, spec] of code.matchAll(/(?:from\s+|import\s*\(?\s*)["']([^"'./][^"']*)["']/g)) {
    const name = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
    if (!BUILTIN_PACKAGES.has(name) && !name.startsWith("node:")) deps[name] = "latest";
  }
  return deps;
}

/** Уроки по тестированию написаны для Vitest; раннер Sandpack совместим с Jest — подменяем vi на jest. */
function vitestToJest(code: string) {
  let out = code.replace(/^\s*import\s+[^;]*from\s+["'](vitest|@jest\/globals)["'];?\s*\n/gm, "");
  if (/\bvi\./.test(out)) out = `const vi = jest;\n${out}`;
  return out;
}

/** jest-dom матчеры (toBeInTheDocument и др.) подключаются отдельным импортом. */
const usesJestDom = (code: string) =>
  /\.(toBeInTheDocument|toHaveTextContent|toBeVisible|toBeDisabled|toBeEnabled|toHaveAttribute|toHaveValue|toBeChecked|toHaveClass|toHaveFocus|toHaveStyle)\(/.test(code);

/** Вставляет фрагмент разметки в полноценный документ (или дополняет готовый документ ссылками). */
function htmlDocument(body: string, { css, script }: { css: boolean; script?: string }) {
  const link = css ? `<link rel="stylesheet" href="/styles.css" />` : "";
  const tag = script ? `<script src="${script}"></script>` : "";
  if (/<html|<!doctype/i.test(body)) {
    let doc = body;
    if (link && !doc.includes("styles.css")) doc = doc.replace(/<\/head>/i, `  ${link}\n  </head>`);
    if (tag && !doc.includes(script!)) doc = doc.replace(/<\/body>/i, `  ${tag}\n  </body>`);
    return doc;
  }
  const indented = body
    .split("\n")
    .map((l) => (l ? `    ${l}` : l))
    .join("\n");
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${link}
  </head>
  <body>
${indented}
    ${tag}
  </body>
</html>
`;
}

/**
 * Собирает проект из блоков кода урока. Среда выбирается по языкам:
 * тесты → test-ts / react-ts, vue → vue-ts, tsx/jsx → react-ts, ts → vanilla-ts, js → vanilla, html/css → static.
 * Блоки с `file=` кладутся в свои файлы, остальные — в стандартные файлы среды.
 */
export function exampleStarter(input: ExampleBlock[], title?: string): Starter {
  const blocks = input.map((b) => ({
    ...b,
    lang: LANG_ALIASES[b.lang.toLowerCase()] ?? b.lang.toLowerCase(),
    code: b.code.replace(/\n$/, "") + "\n",
  }));
  const all = blocks.map((b) => b.code).join("\n");
  const has = (...langs: string[]) => blocks.some((b) => langs.includes(b.lang));
  const tests = blocks.some((b) => b.lang !== "html" && b.lang !== "css" && isTestCode(b.code));
  const deps = detectDependencies(all);

  let template: SandboxTemplate;
  if (tests) template = has("tsx", "jsx") ? "react-ts" : "test-ts";
  else if (has("vue")) template = "vue-ts";
  else if (has("tsx", "jsx")) template = "react-ts";
  else if (has("ts")) template = "vanilla-ts";
  else if (has("js")) template = "vanilla";
  else template = "static";

  const root = template === "vue-ts" ? "/src/" : "/";
  const named = (b: { file?: string }) => (b.file ? root + b.file.replace(/^\.?\//, "") : null);
  const unnamed = (...langs: string[]) => blocks.filter((b) => !b.file && langs.includes(b.lang));
  const join = (list: { code: string }[]) => list.map((b) => b.code).join("\n");

  const files: Record<string, string> = {};
  const fileOfBlock = new Map<(typeof blocks)[number], string>();
  for (const b of blocks) {
    const path = named(b);
    if (path) {
      files[path] = tests ? vitestToJest(b.code) : b.code;
      fileOfBlock.set(b, path);
    }
  }
  const assign = (list: typeof blocks, path: string, code: string) => {
    if (!list.length && !code) return;
    files[path] = code;
    list.forEach((b) => fileOfBlock.set(b, path));
  };
  const cssCode = join(unnamed("css"));

  if (tests) {
    const scripts = unnamed("js", "ts", "tsx", "jsx");
    const testBlocks = scripts.filter((b) => isTestCode(b.code));
    const sources = scripts.filter((b) => !isTestCode(b.code));
    const ext = template === "react-ts" ? "tsx" : "ts";
    const jestDom = usesJestDom(all);
    const header = jestDom ? `import "@testing-library/jest-dom";\n` : "";
    assign(sources, `/example.${ext}`, join(sources));
    assign(testBlocks, `/example.test.${ext}`, header + vitestToJest(join(testBlocks)));
    const extra = { ...deps, ...(jestDom ? { "@testing-library/jest-dom": "^6.0.0" } : {}) };
    if (template === "react-ts") {
      Object.assign(extra, { "@testing-library/react": "^16.0.0", "@testing-library/dom": "^10.0.0" });
      if (!files["/App.tsx"]) files["/App.tsx"] = `export default function App() {\n  return <p>Тесты запускаются в панели справа.</p>;\n}\n`;
    } else {
      files["/package.json"] = JSON.stringify({ dependencies: {}, devDependencies: { typescript: "^4.0.0" }, main: Object.keys(files)[0] ?? "/example.test.ts" });
    }
    files["/package.json"] = withExtraDeps(template, files["/package.json"], extra);
  } else if (template === "vue-ts") {
    const vue = unnamed("vue");
    if (vue.length) assign([vue[0]], "/src/App.vue", vue[0].code);
    vue.slice(1).forEach((b, i) => assign([b], `/src/components/Example${i + 1}.vue`, b.code));
    assign(unnamed("ts", "js"), "/src/example.ts", join(unnamed("ts", "js")));
    assign(unnamed("css"), "/src/styles.css", cssCode);
    files["/package.json"] = withExtraDeps(template, undefined, deps);
  } else if (template === "react-ts") {
    const components = unnamed("tsx", "jsx");
    const code = join(components);
    const app = !code || /export\s+default/.test(code)
      ? code
      : `${code}\nexport default function App() {\n  return <p>Добавьте сюда компонент из примера выше.</p>;\n}\n`;
    assign(components, "/App.tsx", (cssCode ? `import "./styles.css";\n` : "") + app);
    assign(unnamed("css"), "/styles.css", cssCode);
    files["/package.json"] = withExtraDeps(template, undefined, deps);
  } else if (template === "vanilla-ts" || template === "vanilla") {
    const entry = template === "vanilla-ts" ? "/index.ts" : "/index.js";
    const scripts = unnamed("ts", "js");
    assign(unnamed("html"), "/index.html", htmlDocument(join(unnamed("html")) || `<div id="app"></div>\n`, { css: false, script: entry.slice(1) }));
    assign(scripts, entry, (cssCode ? `import "./styles.css";\n` : "") + join(scripts));
    assign(unnamed("css"), "/styles.css", cssCode);
    files["/package.json"] = withExtraDeps(template, undefined, deps);
  } else {
    assign(unnamed("html"), "/index.html", htmlDocument(join(unnamed("html")) || `<p>Пример стилей</p>\n`, { css: Boolean(cssCode) }));
    assign(unnamed("css"), "/styles.css", cssCode);
  }

  const visible = [...new Set(blocks.map((b) => fileOfBlock.get(b)).filter(Boolean) as string[])];
  return {
    id: "lesson",
    label: "Из урока",
    hint: title ?? "Код из урока",
    template,
    mode: tests ? "tests" : "preview",
    // у test-ts в шаблоне есть демо-файлы add.ts/add.test.ts — в примере из урока они не нужны
    files: withBase(template, files, template === "test-ts" ? ["/add.ts", "/add.test.ts"] : []),
    activeFile: visible[0] ?? Object.keys(files)[0],
    visibleFiles: visible,
  };
}

/** package.json среды (или переданный) с дополнительными зависимостями. */
function withExtraDeps(template: SandboxTemplate, pkgJson: string | undefined, deps: Record<string, string>) {
  const pkg = JSON.parse(pkgJson ?? templateBase(template)["/package.json"]);
  pkg.dependencies = { ...pkg.dependencies, ...deps };
  return JSON.stringify(pkg, null, 2);
}
