/**
 * POST /api/fetch — Consome segredo.
 *
 * Comportamento condicional baseado em one_time:
 * - one_time = 1 (default): leitura unica — DELETE + RETURNING.
 * - one_time = 0: leitura multipla — apenas SELECT, sem consumir.
 *
 * Erro generico em qualquer falha.
 */

import type { Env } from "../router";
import { safeParseJSON } from "../lib/json";
import { validateIdHash } from "../lib/validation";
import { badRequest, notAvailable, tooManyRequests } from "../lib/errors";
import { nowUnixSeconds } from "../lib/timestamps";
import { checkFetchAllowed } from "../lib/abuse-controls";
import { ErrorResult } from "../lib/errors";
import { JSON_HEADERS } from "../lib/headers";

export async function handleFetch(request: Request, env: Env): Promise<Response> {
  if (!checkFetchAllowed()) {
    return jsonError(tooManyRequests());
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return jsonError(badRequest());
  }

  const bodyText = await request.text();
  if (bodyText.length > 2048) {
    return jsonError(badRequest());
  }

  const parsed = safeParseJSON(bodyText);
  if (!parsed.ok) {
    return jsonError(badRequest());
  }

  const body = parsed.data;
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonError(badRequest());
  }

  const idHash = (body as Record<string, unknown>).idHash;
  if (!validateIdHash(idHash)) {
    return jsonError(badRequest());
  }

  const now = nowUnixSeconds();

  // ── Tentativa 1: Leitura unica (one_time = 1) ─────────────────
  try {
    const oneTimeResult = await fetchOneTime(env, idHash as string, now);
    if (oneTimeResult) return oneTimeResult;
  } catch (_err) {
    // Fallback manual se RETURNING falhar
    const fallback = await fetchOneTimeFallback(env, idHash as string, now);
    if (fallback) return fallback;
  }

  // ── Tentativa 2: Leitura multipla (one_time = 0) ──────────────
  try {
    const multiResult = await fetchMultiRead(env, idHash as string, now);
    if (multiResult) return multiResult;
  } catch (_err) {
    // D1 error — generico
  }

  return jsonError(notAvailable());
}

// ── one_time = 1: DELETE ... RETURNING ─────────────────────────
async function fetchOneTime(
  env: Env,
  idHash: string,
  now: number
): Promise<Response | null> {
  const result = await env.DB.prepare(
    `DELETE FROM secrets
     WHERE id_hash = ?1
       AND consumed_at IS NULL
       AND expires_at > ?2
       AND one_time = 1
     RETURNING encrypted_payload`
  )
    .bind(idHash, now)
    .first<{ encrypted_payload: string }>();

  if (!result) return null;

  return jsonPayload(result.encrypted_payload);
}

// ── one_time = 1 fallback (sem RETURNING) ──────────────────────
async function fetchOneTimeFallback(
  env: Env,
  idHash: string,
  now: number
): Promise<Response | null> {
  const consumeToken = generateToken();

  const updateResult = await env.DB.prepare(
    `UPDATE secrets
     SET consumed_at = ?1, consume_token = ?2
     WHERE id_hash = ?3
       AND consumed_at IS NULL
       AND expires_at > ?4
       AND one_time = 1`
  ).bind(now, consumeToken, idHash, now).run();

  if (updateResult.meta.changed !== 1) return null;

  const row = await env.DB.prepare(
    `SELECT encrypted_payload FROM secrets
     WHERE id_hash = ?1 AND consume_token = ?2`
  ).bind(idHash, consumeToken).first<{ encrypted_payload: string }>();

  if (!row) return null;

  await env.DB.prepare(
    `DELETE FROM secrets WHERE id_hash = ?1`
  ).bind(idHash).run();

  return jsonPayload(row.encrypted_payload);
}

// ── one_time = 0: apenas SELECT, sem consumir ──────────────────
async function fetchMultiRead(
  env: Env,
  idHash: string,
  now: number
): Promise<Response | null> {
  const row = await env.DB.prepare(
    `SELECT encrypted_payload FROM secrets
     WHERE id_hash = ?1
       AND expires_at > ?2
       AND one_time = 0`
  ).bind(idHash, now).first<{ encrypted_payload: string }>();

  if (!row) return null;
  return jsonPayload(row.encrypted_payload);
}

// ── Helpers ────────────────────────────────────────────────────
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...Array.from(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function jsonPayload(payload: string): Response {
  return new Response(JSON.stringify({ payload }), {
    status: 200,
    headers: JSON_HEADERS,
  });
}

function jsonError(err: ErrorResult): Response {
  return new Response(JSON.stringify({ error: err.error }), {
    status: err.status,
    headers: JSON_HEADERS,
  });
}
