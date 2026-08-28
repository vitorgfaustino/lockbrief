/**
 * Roteador HTTP minimalista.
 * Sem dependencias externas.
 */

import type { D1Database, RateLimit } from "@cloudflare/workers-types";

export type Handler = (
  request: Request,
  env: Env
) => Response | Promise<Response>;

export interface Env {
  DB: D1Database;
  STORE_RATE_LIMITER?: RateLimit;
  READ_RATE_LIMITER?: RateLimit;
  RESOURCE_RATE_LIMITER?: RateLimit;
}

interface Route {
  method: string;
  pattern: RegExp | string;
  handler: Handler;
}

export function createRouter(): {
  add: (method: string, path: string | RegExp, handler: Handler) => void;
  handle: (request: Request, env: Env) => Promise<Response>;
} {
  const routes: Route[] = [];

  function add(method: string, path: string | RegExp, handler: Handler): void {
    routes.push({ method: method.toUpperCase(), pattern: path, handler });
  }

  async function handle(request: Request, env: Env): Promise<Response> {
    const method = request.method.toUpperCase();
    const url = new URL(request.url);
    const pathname = url.pathname;

    for (const route of routes) {
      if (route.method !== method && route.method !== "*") continue;
      let matched: boolean;
      if (typeof route.pattern === "string") {
        matched = route.pattern === pathname;
      } else {
        matched = route.pattern.test(pathname);
      }
      if (matched) {
        return route.handler(request, env);
      }
    }

    return new Response("Not Found", { status: 404 });
  }

  return { add, handle };
}
