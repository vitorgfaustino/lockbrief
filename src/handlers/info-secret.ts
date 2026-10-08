/**
 * POST /api/info — Retorna metadados do segredo sem consumi-lo.
 *
 * Retorna { oneTime: boolean, expiresAt: number, requiresPassword: boolean } ou 404.
 * Nao revela payload, envelope, chave, senha nem consome o registro.
 */

import type { Env } from "../router";
import { safeParseJSON } from "../lib/json";
import { validateEnvelope, validateIdHash } from "../lib/validation";
import { badRequest, notAvailable, tooManyRequests } from "../lib/errors";
import { nowUnixSeconds } from "../lib/timestamps";
import { ErrorResult } from "../lib/errors";
import { checkInfoAllowed, checkResourceAllowed } from "../lib/abuse-controls";
import { JSON_HEADERS } from "../lib/headers";
import { readTextBodyWithLimit } from "../lib/request-body";

const MAX_BODY_BYTES = 2048;

export async function handleInfo(request: Request, env: Env): Promise<Response> {
  if (!(await checkInfoAllowed(env))) {
    return jsonError(tooManyRequests());
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return jsonError(badRequest());
  }

  const bodyResult = await readTextBodyWithLimit(request, MAX_BODY_BYTES);
  if (!bodyResult.ok) {
    return jsonError(badRequest());
  }
  const bodyText = bodyResult.text;

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

  if (!(await checkResourceAllowed(env, "info", idHash))) {
    return jsonError(tooManyRequests());
  }

  const now = nowUnixSeconds();

  const row = await env.DB.prepare(
    `SELECT one_time, expires_at, encrypted_payload FROM secrets
     WHERE id_hash = ?1 AND expires_at > ?2 AND consumed_at IS NULL`
  )
    .bind(idHash, now)
    .first<{ one_time: number; expires_at: number; encrypted_payload: string }>();

  if (!row) {
    return jsonError(notAvailable());
  }

  const payloadParsed = safeParseJSON(row.encrypted_payload);
  if (!payloadParsed.ok || !validateEnvelope(payloadParsed.data)) {
    return jsonError(notAvailable());
  }

  const kdf = payloadParsed.data.kdf;
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
    headers: {
      ...JSON_HEADERS,
      ...(err.status === 429 ? { "Retry-After": "60" } : {}),
    },
  });
}
