/**
 * GET /api/health — Health check basico.
 * Verifica conectividade com D1.
 */

import type { Env } from "../router";

export async function handleHealth(_request: Request, env: Env): Promise<Response> {
  try {
    await env.DB.prepare("SELECT 1").run();
    return Response.json({ status: "ok", db: "connected" }, { status: 200 });
  } catch {
    return Response.json({ status: "error", db: "disconnected" }, { status: 503 });
  }
}
