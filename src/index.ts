/**
 * LockBrief — Worker Entry Point.
 *
 * Rotas:
 *   GET  /            → HTML
 *   GET  /robots.txt   → Politica de crawlers
 *   POST /api/store   → Store encrypted payload
 *   POST /api/info    → Metadata without consuming
 *   POST /api/fetch   → Consume secret
 *   GET  /api/health  → Health check
 *
 * Cron:
 *   scheduled()       → Cleanup expired secrets
 *
 * Assets:
 *   /client.js        → Bundled client (served via [assets])
 *   /styles.css       → CSS (served via [assets])
 */

import { createRouter, Env } from "./router";
import { handleIndex } from "./handlers/serve-client";
import { handlePrivacy } from "./handlers/privacy-page";
import { handleRobots } from "./handlers/robots";
import { handleStore } from "./handlers/store-secret";
import { handleFetch } from "./handlers/fetch-secret";
import { handleInfo } from "./handlers/info-secret";
import { handleHealth } from "./handlers/health-check";
import { handleCleanup } from "./handlers/cleanup-cron";
import { blockAutomatedRequest } from "./lib/bot-filter";
import { JSON_HEADERS } from "./lib/headers";

const router = createRouter();

// HTML
router.add("GET", "/", handleIndex);
router.add("GET", "/privacidade", handlePrivacy);
router.add("GET", "/robots.txt", handleRobots);

// API
router.add("POST", "/api/store", handleStore);
router.add("POST", "/api/info", handleInfo);
router.add("POST", "/api/fetch", handleFetch);
router.add("GET", "/api/health", handleHealth);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (!(request.method === "GET" && url.pathname === "/robots.txt")) {
        const blocked = blockAutomatedRequest(request);
        if (blocked) return blocked;
      }

      return await router.handle(request, env);
    } catch {
      // Global error boundary — nunca vaza stack traces ou detalhes internos
      return new Response(JSON.stringify({ error: "not_available" }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await handleCleanup(event, env);
  },
};
