import { env, applyD1Migrations } from "cloudflare:test";
import { expect, it } from "vitest";

it("atualiza schema 0001 com envelope legado preservando bytes e leitura única padrão", async () => {
  // D1 isolado deste arquivo; nenhum banco operacional é acessado.
  await env.DB.exec("DROP TABLE secrets; DROP TABLE d1_migrations;");
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS.slice(0, 1));
  const payload = JSON.stringify({ v: 1, alg: "AES-GCM-256", iv: "CQkJCQkJCQkJCQkJ", ciphertext: "AAAAAAAAAAAAAAAAAAAAAA", kdf: "none", salt: null });
  await env.DB.prepare("INSERT INTO secrets (id_hash, encrypted_payload, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind("A".repeat(43), payload, 9999999999, 1).run();
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  expect(await env.DB.prepare("SELECT encrypted_payload, one_time, consumed_at FROM secrets").first())
    .toEqual({ encrypted_payload: payload, one_time: 1, consumed_at: null });
  const history = await env.DB.prepare("SELECT name FROM d1_migrations ORDER BY name").all();
  expect(history.results.map(row => row.name)).toEqual(env.TEST_MIGRATIONS.map(m => m.name));
});
