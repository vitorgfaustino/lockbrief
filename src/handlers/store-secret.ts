/**
 * POST /api/store — Armazena envelope criptografado.
 *
 * Validacoes fail-fast:
 * 1. Content-Type JSON
 * 2. Body <= 100 KB
 * 3. JSON valido
 * 4. idHash formato base64url 43 chars
 * 5. payload string, envelope com estrutura minima
 * 6. ttl na allowlist
 *
 * Erro generico em todas as falhas.
 */

import type { Env } from "../router";
import { safeParseJSON } from "../lib/json";
import {
  validateIdHash,
  validateTTL,
  validatePayloadLength,
  validateBodyLength,
  validateEnvelope,
  isRecord,
} from "../lib/validation";
import { badRequest, notAvailable, internalError, tooManyRequests } from "../lib/errors";
import { nowUnixSeconds } from "../lib/timestamps";
import { checkStoreAllowed } from "../lib/abuse-controls";
import { ErrorResult } from "../lib/errors";

export async function handleStore(request: Request, env: Env): Promise<Response> {
  // Abuse control
  if (!checkStoreAllowed()) {
    return jsonError(tooManyRequests());
  }

  // Validar Content-Type
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.includes("application/json")) {
    return jsonError(badRequest());
  }

  // Ler body
  const bodyText = await request.text();
  if (!validateBodyLength(bodyText)) {
    return jsonError(badRequest());
  }

  // Parse JSON
  const parsed = safeParseJSON(bodyText);
  if (!parsed.ok) {
    return jsonError(badRequest());
  }

  const body = parsed.data;
  if (!isRecord(body)) {
    return jsonError(badRequest());
  }

  const idHash = body.idHash;
  const payload = body.payload;
  const ttl = body.ttl;
  const oneTime = body.oneTime === false ? 0 : 1; // default 1 (one-time read)

  // Validar idHash
  if (!validateIdHash(idHash)) {
    return jsonError(badRequest());
  }

  // Validar ttl
  if (!validateTTL(ttl)) {
    return jsonError(badRequest());
  }

  // Validar payload
  if (!validatePayloadLength(payload)) {
    return jsonError(badRequest());
  }

  // Validar envelope dentro do payload
  const payloadParsed = safeParseJSON(payload as string);
  if (!payloadParsed.ok || !validateEnvelope(payloadParsed.data)) {
    return jsonError(badRequest());
  }

  // Inserir no D1
  const now = nowUnixSeconds();
  const expiresAt = now + (ttl as number);

  try {
    // Tenta INSERT — se falhar por duplicata, retorna erro generico
    await env.DB.prepare(
      `INSERT INTO secrets (id_hash, encrypted_payload, expires_at, created_at, one_time)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
      .bind(idHash, payload, expiresAt, now, oneTime)
      .run();

    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // Se for violacao de UNIQUE (duplicata), erro generico
    const msg = String(err);
    if (msg.includes("UNIQUE") || msg.includes("SQLITE_CONSTRAINT")) {
      return jsonError(notAvailable());
    }
    console.error("store error:", msg);
    return jsonError(internalError());
  }
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
