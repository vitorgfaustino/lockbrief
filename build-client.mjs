/** Build local do cliente e assets públicos, sem operação Cloudflare. */
import * as esbuild from "esbuild";
import { createHash } from "node:crypto";
import { copyFileSync, cpSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const assets = [
  "lockbrief.png", "favicon.ico", "favicon-96x96.png", "apple-touch-icon.png",
  "web-app-manifest-192x192.png", "web-app-manifest-512x512.png",
];
const aliases = {
  "favicon.png": "favicon-96x96.png",
  "pwa-icon.png": "web-app-manifest-512x512.png",
  "pwa-icon-192.png": "web-app-manifest-192x192.png",
  "pwa-icon-512.png": "web-app-manifest-512x512.png",
};

// Falha antes de alterar dist quando um arquivo necessário está ausente.
for (const name of assets) readFileSync(`src/client/assets/${name}`);
const stage = mkdtempSync(".lockbrief-build-");
const backup = `${stage}-previous`;
try {
  await esbuild.build({
    entryPoints: ["src/client/app.ts"], bundle: true, format: "esm",
    target: "es2022", platform: "browser", outfile: join(stage, "client.js"),
    minify: false, sourcemap: false,
    define: { "process.env.NODE_ENV": '"production"' },
  });
  copyFileSync("src/client/styles.css", join(stage, "styles.css"));
  copyFileSync("src/client/manifest.webmanifest", join(stage, "manifest.webmanifest"));
  // Preserva também assets adicionais usados por instalações personalizadas.
  cpSync("src/client/assets", join(stage, "assets"), { recursive: true });
  for (const [alias, source] of Object.entries(aliases)) {
    copyFileSync(`src/client/assets/${source}`, join(stage, "assets", alias));
  }

  const swSource = readFileSync("src/client/sw.js", "utf8");
  const staticPaths = [...swSource.matchAll(/^  "(\/[^"]+)",$/gm)].map(match => match[1]);
  const hash = createHash("sha256");
  for (const path of staticPaths) hash.update(path).update(readFileSync(join(stage, path.slice(1))));
  writeFileSync(join(stage, "sw.js"), swSource.replace("__STATIC_CACHE_VERSION__", hash.digest("hex").slice(0, 16)));

  if (existsSync("dist")) renameSync("dist", backup);
  try {
    renameSync(stage, "dist");
  } catch (error) {
    if (existsSync(backup)) renameSync(backup, "dist");
    throw error;
  }
  rmSync(backup, { recursive: true, force: true });
  console.log("✓ dist/client.js, styles.css, manifest.webmanifest, sw.js e assets públicos");
} finally {
  rmSync(stage, { recursive: true, force: true });
}
