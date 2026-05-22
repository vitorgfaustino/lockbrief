/**
 * POST /api/info — Retorna metadados do segredo sem consumi-lo.
 *
 * Retorna { oneTime: boolean, expiresAt: number } ou 404.
 * Nao revela o payload nem consome o registro.
 */

import type { Env } from "../router";
import { safeParseJSON } from "../lib/json";
import { validateIdHash } from "../lib/validation";
import { badRequest, notAvailable } from "../lib/errors";
import { nowUnixSeconds } from "../lib/timestamps";
import { ErrorResult } from "../lib/errors";

export async function handleInfo(request: Request, env: Env): Promise<Response> {
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
    `SELECT one_time, expires_at FROM secrets
     WHERE id_hash = ?1 AND expires_at > ?2`
  )
    .bind(idHash, now)
    .first<{ one_time: number; expires_at: number }>();

  if (!row) {
    return jsonError(notAvailable());
  }

  return new Response(JSON.stringify({
    oneTime: row.one_time === 1,
    expiresAt: row.expires_at,
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function jsonError(err: ErrorResult): Response {
  return new Response(JSON.stringify({ error: err.error }), {
    status: err.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
