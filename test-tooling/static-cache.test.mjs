import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

function serviceWorker(fetchImpl) {
  const handlers = {};
  const writes = [];
  const deleted = [];
  const current = {
    addAll: async () => {},
    put: async (request) => writes.push(request.url),
    match: async () => new Response("asset atual"),
  };
  const scope = {
    URL,
    fetch: fetchImpl,
    caches: {
      open: async () => current,
      keys: async () => ["lockbrief-static-v1.1.0", "outro-app"],
      delete: async key => deleted.push(key),
      match: () => { throw new Error("Não buscar assets em caches de outras versões"); },
    },
    self: {
      location: { origin: "https://example.test" },
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
      addEventListener: (name, handler) => handlers[name] = handler,
    },
  };
  runInNewContext(readFileSync("dist/sw.js", "utf8"), scope);
  return { handlers, writes, deleted };
}

test("service worker ignora APIs, navegação, POST e origem externa", () => {
  const sw = serviceWorker(() => { throw new Error("Fetch sensível interceptado"); });
  for (const [url, method, mode] of [
    ["https://example.test/api/fetch", "POST", "cors"],
    ["https://example.test/api/info", "GET", "cors"],
    ["https://example.test/", "GET", "navigate"],
    ["https://example.test/client.js", "GET", "navigate"],
    ["https://other.test/client.js", "GET", "cors"],
    ["https://example.test/privacidade", "GET", "cors"],
  ]) {
    sw.handlers.fetch({ request: { url, method, mode }, respondWith: () => assert.fail("Intercepção sensível") });
  }
});

test("offline recupera asset somente do cache atual", async () => {
  const sw = serviceWorker(async () => { throw new Error("offline"); });
  let response;
  sw.handlers.fetch({ request: { url: "https://example.test/client.js", method: "GET", mode: "cors" }, respondWith: value => response = value });
  assert.equal(await (await response).text(), "asset atual");
});

test("ativação remove cache legado e preserva caches de outros apps", async () => {
  const sw = serviceWorker(async () => new Response("public"));
  let work;
  sw.handlers.activate({ waitUntil: value => work = value });
  await work;
  assert.deepEqual(sw.deleted, ["lockbrief-static-v1.1.0"]);
});

test("erro HTTP de asset não entra no cache", async () => {
  const sw = serviceWorker(async () => new Response("erro", { status: 500 }));
  let response;
  sw.handlers.fetch({ request: { url: "https://example.test/client.js", method: "GET", mode: "cors" }, respondWith: value => response = value });
  assert.equal((await response).status, 500);
  assert.deepEqual(sw.writes, []);
});
