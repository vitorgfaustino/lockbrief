import { env, applyD1Migrations } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import type { Env } from "../src/router";
import { base64urlEncode, createEnvelope, openEnvelope, randomBytes } from "../src/client/crypto";

function request(route: string, idHash: string, DB = env.DB) {
  return worker.fetch(new Request(`http://localhost/api/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idHash }),
  }), { DB });
}

function withoutReturning(failRead = false): Env["DB"] {
  return new Proxy(env.DB, {
    get(target, property) {
      if (property === "prepare") return (sql: string) => {
        if (sql.includes("RETURNING")) throw new Error("RETURNING unsupported");
        if (failRead && sql.startsWith("SELECT encrypted_payload")) throw new Error("read interrupted");
        return target.prepare(sql);
      };
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

async function seed(oneTime = 1, consumedAt: number | null = null, expiresAt = Math.floor(Date.now() / 1000) + 3600) {
  const idHash = base64urlEncode(randomBytes(32));
  const key = randomBytes(32);
  const { envelope } = await createEnvelope("  conteúdo de teste sintético\n", key);
  const payload = JSON.stringify(envelope);
  await env.DB.prepare(
    "INSERT INTO secrets (id_hash, encrypted_payload, expires_at, created_at, one_time, consumed_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(idHash, payload, expiresAt, 1, oneTime, consumedAt).run();
  return { idHash, key, payload };
}

describe("compatibilidade D1 e consumo", () => {
  it("falha D1 não registra ou retorna detalhes sensíveis e mantém headers de falha segura", async () => {
    const secret = await seed(0);
    const sentinel = "SENSITIVE-SYNTHETIC-DO-NOT-LOG";
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const DB = new Proxy(env.DB, { get(target, property) {
        if (property === "prepare") return () => { throw new Error(sentinel + secret.idHash + secret.payload); };
        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      }});
      const response = await worker.fetch(new Request("http://localhost/api/store", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash: secret.idHash, payload: secret.payload, ttl: 3600, oneTime: false }),
      }), { DB });
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "invalid_request" });
      expect(response.headers.get("Cache-Control")).toContain("no-store");
      await worker.scheduled({} as ScheduledEvent, { DB });
      expect(errorLog.mock.calls).toEqual([["store: db error"], ["cleanup: db error"]]);
      expect(log.mock.calls).toEqual([]);
    } finally { errorLog.mockRestore(); log.mockRestore(); secret.key.fill(0); }
  });

  it("aplica migrations reais duas vezes sem perder registros", async () => {
    const secret = await seed(0);
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
    const row = await env.DB.prepare("SELECT encrypted_payload, one_time FROM secrets WHERE id_hash = ?")
      .bind(secret.idHash).first();
    expect(row).toEqual({ encrypted_payload: secret.payload, one_time: 0 });
    secret.key.fill(0);
  });

  it("retorna somente um envelope em consumo concorrente real", async () => {
    const secret = await seed();
    const responses = await Promise.all(Array.from({ length: 6 }, () => request("fetch", secret.idHash)));
    expect(responses.map(r => r.status).sort()).toEqual([200, 404, 404, 404, 404, 404]);
    const data = await responses.find(r => r.status === 200)!.json() as { payload: string };
    await expect(openEnvelope(JSON.parse(data.payload), secret.key)).resolves.toBe("  conteúdo de teste sintético\n");
    secret.key.fill(0);
  });

  it("fallback sem RETURNING entrega uma vez e remove a linha", async () => {
    const secret = await seed();
    const DB = withoutReturning();
    const responses = await Promise.all(Array.from({ length: 4 }, () => request("fetch", secret.idHash, DB)));
    expect(responses.map(r => r.status).sort()).toEqual([200, 404, 404, 404]);
    expect(await env.DB.prepare("SELECT id_hash FROM secrets WHERE id_hash = ?").bind(secret.idHash).first()).toBeNull();
    secret.key.fill(0);
  });

  it("info não expõe sobras consumidas após interrupção do fallback", async () => {
    const secret = await seed();
    const response = await request("fetch", secret.idHash, withoutReturning(true));
    expect(response.status).toBeGreaterThanOrEqual(400);
    const row = await env.DB.prepare("SELECT consumed_at FROM secrets WHERE id_hash = ?").bind(secret.idHash)
      .first<{ consumed_at: number }>();
    expect(row?.consumed_at).toBeGreaterThan(0);
    expect((await request("info", secret.idHash)).status).toBe(404);
    expect((await request("fetch", secret.idHash)).status).toBe(404);
    secret.key.fill(0);
  });

  it("expiração bloqueia leitura e cleanup preserva multi-leitura válida", async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = await seed(0, null, now - 1);
    const consumed = await seed(1, now - 120);
    const live = await seed(0);
    expect((await request("info", expired.idHash)).status).toBe(404);
    expect((await request("fetch", expired.idHash)).status).toBe(404);
    await worker.scheduled({} as ScheduledEvent, { DB: env.DB });
    for (const item of [expired, consumed]) {
      expect(await env.DB.prepare("SELECT id_hash FROM secrets WHERE id_hash = ?").bind(item.idHash).first()).toBeNull();
    }
    expect((await request("fetch", live.idHash)).status).toBe(200);
    expect((await request("fetch", live.idHash)).status).toBe(200);
    for (const item of [expired, consumed, live]) item.key.fill(0);
  });
});
