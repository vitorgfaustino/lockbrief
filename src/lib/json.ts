/**
 * Parsing seguro de JSON.
 * Nunca vaza detalhes do corpo malformado na resposta.
 */

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
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
