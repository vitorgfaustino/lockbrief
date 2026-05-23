/**
 * Build script: bundles client TypeScript into dist/client.js
 * Uses esbuild (zero-config for simple TS bundling).
 *
 * Usage: node build-client.mjs
 */

import * as esbuild from "esbuild";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

mkdirSync("dist", { recursive: true });

// Bundle client TypeScript
const result = await esbuild.build({
  entryPoints: ["src/client/app.ts"],
  bundle: true,
  format: "esm",
  target: "es2022",
  platform: "browser",
  outfile: "dist/client.js",
  minify: false,
  sourcemap: false,
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

if (result.errors.length > 0) {
  console.error("Build failed:", result.errors);
  process.exit(1);
}

// Copy CSS
const css = readFileSync("src/client/styles.css", "utf-8");
writeFileSync("dist/styles.css", css, "utf-8");

// Copy PWA files at the site root so the service worker can use scope "/".
copyFileSync("src/client/manifest.webmanifest", "dist/manifest.webmanifest");
copyFileSync("src/client/sw.js", "dist/sw.js");

// Copy static assets used by the HTML shell (logo, favicon, etc.)
if (existsSync("src/client/assets")) {
  cpSync("src/client/assets", "dist/assets", { recursive: true });
}

console.log("✓ dist/client.js");
console.log("✓ dist/styles.css");
console.log("✓ dist/manifest.webmanifest");
console.log("✓ dist/sw.js");
console.log("✓ dist/assets");
