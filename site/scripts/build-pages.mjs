import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const siteDir = fileURLToPath(new URL("../", import.meta.url));
const repository = process.env.GITHUB_REPOSITORY?.split("/").at(-1) ?? "refront";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ??
  (repository.endsWith(".github.io") ? "" : `/${repository}`);
const env = { ...process.env, NEXT_PUBLIC_BASE_PATH: basePath };

console.log(`GitHub Pages base path: ${basePath || "/"}`);

for (const script of ["node_modules/next/dist/bin/next", "scripts/check-pages.mjs"]) {
  const args = [script, ...(script.includes("/next/") ? ["build"] : [])];
  const result = spawnSync(process.execPath, args, { cwd: siteDir, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
