import type { NextConfig } from "next";

// На GitHub Pages сайт живёт по адресу https://<user>.github.io/<repo>/,
// поэтому basePath задаётся через переменную окружения при сборке в CI.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
