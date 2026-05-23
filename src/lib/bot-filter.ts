/**
 * Bloqueio leve de crawlers e previews antes das rotas de aplicacao.
 *
 * Isso reduz custo de D1/CPU dentro do Worker. Para reduzir requisicoes
 * cobradas pelo plano da Cloudflare, o bloqueio precisa ocorrer no edge
 * antes do Worker, via regras de seguranca da propria conta.
 */

import { JSON_HEADERS } from "./headers";

const BLOCKED_UA_PATTERNS = [
  /\b(bot|crawler|spider|scraper)\b/i,
  /googlebot/i,
  /bingbot/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /slurp/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /facebookexternalhit/i,
  /facebot/i,
  /twitterbot/i,
  /linkedinbot/i,
  /discordbot/i,
  /slackbot/i,
  /telegrambot/i,
  /skypeuripreview/i,
  /headlesschrome/i,
  /scrapy/i,
] as const;

export function blockAutomatedRequest(request: Request): Response | null {
  const url = new URL(request.url);

  if (request.method === "HEAD" || isPrefetchRequest(request)) {
    return blockedResponse(url.pathname);
  }

  const userAgent = request.headers.get("User-Agent") || "";
  if (!userAgent) return null;

  if (BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(userAgent))) {
    return blockedResponse(url.pathname);
  }

  return null;
}

function isPrefetchRequest(request: Request): boolean {
  const purpose = [
    request.headers.get("Purpose"),
    request.headers.get("X-Purpose"),
    request.headers.get("Sec-Purpose"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return purpose.includes("prefetch") || purpose.includes("prerender") || purpose.includes("preview");
}

function blockedResponse(pathname: string): Response {
  if (pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "invalid_request" }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }

  return new Response("Automated request blocked.", {
    status: 403,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
    },
  });
}
