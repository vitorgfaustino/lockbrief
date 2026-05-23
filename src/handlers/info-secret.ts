/**
 * POST /api/info — Retorna metadados do segredo sem consumi-lo.
 *
 * Retorna { oneTime: boolean, expiresAt: number, requiresPassword: boolean } ou 404.
 * Nao revela payload, envelope, chave, senha nem consome o registro.
 */

import type { Env } from "../router";
import { safeParseJSON } from "../lib/json";
import { isRecord, validateIdHash } from "../lib/validation";
import { badRequest, notAvailable, tooManyRequests } from "../lib/errors";
import { nowUnixSeconds } from "../lib/timestamps";
import { ErrorResult } from "../lib/errors";
import { checkInfoAllowed } from "../lib/abuse-controls";
import { JSON_HEADERS } from "../lib/headers";

export async function handleInfo(request: Request, env: Env): Promise<Response> {
  if (!checkInfoAllowed()) {
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

  const row = await env.DB.prepare(
    `SELECT one_time, expires_at, encrypted_payload FROM secrets
     WHERE id_hash = ?1 AND expires_at > ?2`
  )
    .bind(idHash, now)
    .first<{ one_time: number; expires_at: number; encrypted_payload: string }>();

  if (!row) {
    return jsonError(notAvailable());
  }

  const payloadParsed = safeParseJSON(row.encrypted_payload);
  if (!payloadParsed.ok || !isRecord(payloadParsed.data)) {
    return jsonError(notAvailable());
  }

  const kdf = payloadParsed.data.kdf;
  if (kdf !== "none" && kdf !== "PBKDF2-SHA256+HKDF-SHA256") {
    return jsonError(notAvailable());
  }
  const requiresPassword = kdf !== "none";

  return new Response(JSON.stringify({
    oneTime: row.one_time === 1,
    expiresAt: row.expires_at,
    requiresPassword,
  }), {
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
