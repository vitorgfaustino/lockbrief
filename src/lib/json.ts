/**
 * Parsing seguro de JSON.
 * Nunca vaza detalhes do corpo malformado na resposta.
 */

import { JSON_HEADERS } from "./headers";

export function safeParseJSON(raw: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    const data = JSON.parse(raw);
    return { ok: true, data };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}

export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}
