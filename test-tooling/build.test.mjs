import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";

test("build invalida cache por conteúdo, remove output obsoleto e preserva dist em falha", () => {
  const fixture = mkdtempSync(join(tmpdir(), "lockbrief-build-test-"));
  const script = resolve("build-client.mjs");
  const build = () => execFileSync(process.execPath, [script], { cwd: fixture, stdio: "pipe" });
  try {
    cpSync("src", join(fixture, "src"), { recursive: true });
    build();
    const first = readFileSync(join(fixture, "dist/sw.js"), "utf8");
    assert.ok(!first.includes("__STATIC_CACHE_VERSION__"));
    build();
    assert.equal(readFileSync(join(fixture, "dist/sw.js"), "utf8"), first);
    writeFileSync(join(fixture, "dist/obsolete.txt"), "obsoleto");
    writeFileSync(join(fixture, "src/client/styles.css"), ":root { color: red; }");
    build();
    const second = readFileSync(join(fixture, "dist/sw.js"), "utf8");
    assert.notEqual(second, first);
    assert.ok(!existsSync(join(fixture, "dist/obsolete.txt")));
    assert.deepEqual(readFileSync(join(fixture, "dist/assets/pwa-icon-192.png")),
      readFileSync(join(fixture, "src/client/assets/web-app-manifest-192x192.png")));
    assert.deepEqual(readFileSync(join(fixture, "dist/assets/logo-alta.png")),
      readFileSync(join(fixture, "src/client/assets/logo-alta.png")));
    rmSync(join(fixture, "src/client/assets/apple-touch-icon.png"));
    assert.throws(build);
    assert.equal(readFileSync(join(fixture, "dist/sw.js"), "utf8"), second);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
