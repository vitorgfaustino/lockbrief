/**
 * GET /api/health — Health check basico.
 * Verifica conectividade com D1.
 */

import type { Env } from "../router";
import { jsonResponse } from "../lib/json";

export async function handleHealth(_request: Request, env: Env): Promise<Response> {
  try {
    await env.DB.prepare("SELECT 1").run();
    return jsonResponse({ status: "ok", db: "connected" }, 200);
  } catch {
    return jsonResponse({ status: "error", db: "disconnected" }, 503);
  }
}
