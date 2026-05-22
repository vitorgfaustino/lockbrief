/**
 * LockBrief — Testes de integração (Worker + D1).
 *
 * Cobertura:
 * - GET / retorna HTML com security headers
 * - GET /privacidade retorna página de privacidade
 * - GET /api/health com e sem D1
 * - POST /api/store cria segredo com validações
 * - POST /api/info retorna metadados sem consumir
 * - POST /api/fetch consome segredo (leitura única)
 * - POST /api/fetch em segredo multi-leitura (não consome)
 * - POST /api/fetch 404 para segredo inexistente/expirado
 * - Erros genéricos e validações
 */

import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src/index";

// ── D1 Migration Setup ──────────────────────────────────────────
beforeAll(async () => {
  // Aplica migrations no D1 de teste
  const migrations = [
    `CREATE TABLE IF NOT EXISTS secrets (
      id_hash          TEXT PRIMARY KEY,
      encrypted_payload TEXT NOT NULL,
      expires_at       INTEGER NOT NULL,
      created_at       INTEGER NOT NULL,
      consumed_at      INTEGER,
      consume_token    TEXT,
      one_time         INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE INDEX IF NOT EXISTS idx_secrets_expires_at ON secrets (expires_at)`,
    // Add locked_at if migration 0002 was applied
    `ALTER TABLE secrets ADD COLUMN locked_at INTEGER`,
  ];

  for (const sql of migrations) {
    try {
      await (env as any).DB.prepare(sql).run();
    } catch {
      // Coluna ou tabela ja existe — ignorar
    }
  }
});

// Helper: executa uma requisição contra o Worker
async function fetchWorker(path: string, init?: RequestInit): Promise<Response> {
  const req = new Request(`http://localhost${path}`, init);
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env as any, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

// Helper: gera um idHash válido (base64url SHA-256 de 32 bytes aleatórios)
function randomIdHash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const bin = String.fromCharCode(...Array.from(bytes));
  const base64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  // Hash via SHA-256
  // Para teste, usamos um hex mock válido
  return base64.substring(0, 43).padEnd(43, "A");
}

describe("LockBrief Worker", () => {
  // ── GET / ─────────────────────────────────────────────────────
  describe("GET /", () => {
    it("retorna HTML com status 200", async () => {
      const res = await fetchWorker("/");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");
    });

    it("inclui headers de segurança", async () => {
      const res = await fetchWorker("/");
      expect(res.headers.get("X-Frame-Options")).toBe("DENY");
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(res.headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
      expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
      expect(res.headers.get("Content-Security-Policy")).toContain("object-src 'none'");
      expect(res.headers.get("Content-Security-Policy")).toContain("frame-src 'none'");
    });

    it("contem elementos da interface", async () => {
      const res = await fetchWorker("/");
      const html = await res.text();
      expect(html).toContain("LockBrief");
      expect(html).toContain("app-header");
      expect(html).toContain("app-footer");
      expect(html).toContain("Privacidade");
    });
  });

  // ── GET /privacidade ──────────────────────────────────────────
  describe("GET /privacidade", () => {
    it("retorna página de privacidade", async () => {
      const res = await fetchWorker("/privacidade");
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Política de Privacidade");
    });
  });

  // ── GET /api/health ───────────────────────────────────────────
  describe("GET /api/health", () => {
    it("retorna status ok com db connected", async () => {
      const res = await fetchWorker("/api/health");
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.status).toBe("ok");
      expect(data.db).toBe("connected");
    });
  });

  // ── POST /api/store ───────────────────────────────────────────
  describe("POST /api/store", () => {
    const validPayload = JSON.stringify({ v: 1, alg: "AES-GCM-256", iv: "abcdefghijklmnop", ciphertext: "encrypted_data_here", kdf: "none", salt: null });
    const validBody = { idHash: "", payload: validPayload, ttl: 3600 };

    it("cria segredo com dados validos", async () => {
      const body = { ...validBody, idHash: randomIdHash() };
      const res = await fetchWorker("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      expect(res.status).toBe(201);
      const data = await res.json() as any;
      expect(data.ok).toBe(true);
    });

    it("rejeita idHash com formato invalido (400)", async () => {
      const res = await fetchWorker("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash: "invalido", payload: validPayload, ttl: 3600 }),
      });
      expect(res.status).toBe(400);
    });

    it("rejeita TTL fora da allowlist (400)", async () => {
      const res = await fetchWorker("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash: randomIdHash(), payload: validPayload, ttl: 999 }),
      });
      expect(res.status).toBe(400);
    });

    it("rejeita metodo GET (404)", async () => {
      const res = await fetchWorker("/api/store");
      expect(res.status).toBe(404);
    });

    it("rejeita payloads muito grandes (400)", async () => {
      const big = "x".repeat(200000);
      const res = await fetchWorker("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash: randomIdHash(), payload: JSON.stringify({ v: 1, alg: "AES-GCM-256", iv: big, ciphertext: big, kdf: "none", salt: null }), ttl: 3600 }),
      });
      expect(res.status).toBe(400);
    });
  });

  // ── POST /api/fetch ───────────────────────────────────────────
  describe("POST /api/fetch (leitura unica)", () => {
    it("consome segredo e retorna payload", async () => {
      const idHash = randomIdHash();
      const payload = JSON.stringify({ v: 1, alg: "AES-GCM-256", iv: "abcdefghijklmnop", ciphertext: "encrypted_data_here", kdf: "none", salt: null });

      // Store
      await fetchWorker("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash, payload, ttl: 3600 }),
      });

      // Fetch
      const res = await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.payload).toBe(payload);
    });

    it("retorna 404 para segredo ja consumido", async () => {
      const idHash = randomIdHash();
      const payload = JSON.stringify({ v: 1, alg: "AES-GCM-256", iv: "abcdefghijklmnop", ciphertext: "encrypted_data_here", kdf: "none", salt: null });

      await fetchWorker("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash, payload, ttl: 3600 }),
      });

      // Primeiro fetch (consome)
      await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
      });

      // Segundo fetch (deve falhar)
      const res = await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
      });
      expect(res.status).toBe(404);
    });

    it("retorna 404 para segredo inexistente", async () => {
      const res = await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash: randomIdHash() }),
      });
      expect(res.status).toBe(404);
    });

    it("retorna erro generico (nao revela estado)", async () => {
      const res = await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash: randomIdHash() }),
      });
      const data = await res.json() as any;
      expect(data.error).toBe("not_available");
    });

    it("oneTime=true: fetch consome e segundo fetch retorna 404 (simula fechar navegador)", async () => {
      const idHash = randomIdHash();
      const payload = JSON.stringify({ v: 1, alg: "AES-GCM-256", iv: "abcdefghijklmnop", ciphertext: "encrypted_data_here", kdf: "none", salt: null });

      // Store com oneTime=true (default)
      await fetchWorker("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash, payload, ttl: 3600 }),
      });

      // Primeiro fetch (simula usuario digitando chave — certa ou errada)
      const res1 = await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
      });
      expect(res1.status).toBe(200);

      // Segundo fetch (simula reabrir navegador apos fechar)
      const res2 = await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
      });
      expect(res2.status).toBe(404);
    });
  });

  // ── POST /api/info ────────────────────────────────────────────
  describe("POST /api/info", () => {
    it("retorna metadados sem consumir o segredo", async () => {
      const idHash = randomIdHash();
      const payload = JSON.stringify({ v: 1, alg: "AES-GCM-256", iv: "abcdefghijklmnop", ciphertext: "encrypted_data_here", kdf: "none", salt: null });

      await fetchWorker("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash, payload, ttl: 3600 }),
      });

      // Info (não consome)
      const res = await fetchWorker("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.oneTime).toBe(true); // default
      expect(typeof data.expiresAt).toBe("number");

      // Ainda pode ser consumido
      const fetchRes = await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
      });
      expect(fetchRes.status).toBe(200);
    });

    it("oneTime=false: fetch nao consome, segundo fetch retorna 200", async () => {
      const idHash = randomIdHash();
      const payload = JSON.stringify({ v: 1, alg: "AES-GCM-256", iv: "abcdefghijklmnop", ciphertext: "encrypted_data_here", kdf: "none", salt: null });

      await fetchWorker("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash, payload, ttl: 3600, oneTime: false }),
      });

      // Primeiro fetch
      const res1 = await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
      });
      expect(res1.status).toBe(200);

      // Segundo fetch (simula reabrir navegador) — ainda disponivel
      const res2 = await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
      });
      expect(res2.status).toBe(200);
    });

    it("retorna 404 para segredo inexistente", async () => {
      const res = await fetchWorker("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash: randomIdHash() }),
      });
      expect(res.status).toBe(404);
    });
  });

  // ── Erros genéricos ───────────────────────────────────────────
  describe("Erros genericos", () => {
    it("todas as rotas desconhecidas retornam 404", async () => {
      const res = await fetchWorker("/rota-inexistente");
      expect(res.status).toBe(404);
    });

    it("POST /api/fetch sem body JSON retorna 400", async () => {
      const res = await fetchWorker("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "nao e json",
      });
      expect(res.status).toBe(400);
    });
  });
});
