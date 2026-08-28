/**
 * Abuse Controls — contencao em camadas sem identificador de cliente.
 *
 * Regras:
 * - Sem D1, IP, cookie ou fingerprint para rate limit.
 * - Contadores efemeros no isolate como fallback imediato.
 * - Bindings do Workers Rate Limiting API quando configurados.
 * - Chaves de recurso sao derivadas de hash e nao reutilizam idHash diretamente.
 */

import type { Env } from "../router";

type RouteName = "store" | "fetch" | "info";

const WINDOW_SECONDS = 60;
const ROUTE_LIMITS: Record<RouteName, number> = {
  store: 30,
  fetch: 60,
  info: 60,
};

interface Counter {
  count: number;
  resetAt: number;
}

const counters: Record<RouteName, Counter> = {
  store: { count: 0, resetAt: 0 },
  fetch: { count: 0, resetAt: 0 },
  info: { count: 0, resetAt: 0 },
};

function now(): number {
  return Math.floor(Date.now() / 1000);
}

function checkMemoryAllowed(route: RouteName): boolean {
  const t = now();
  const counter = counters[route];
  if (t >= counter.resetAt) {
    counter.count = 0;
    counter.resetAt = t + WINDOW_SECONDS;
  }
  if (counter.count >= ROUTE_LIMITS[route]) return false;
  counter.count++;
  return true;
}

async function checkRouteAllowed(env: Env, route: RouteName): Promise<boolean> {
  if (!checkMemoryAllowed(route)) return false;

  const binding = route === "store" ? env.STORE_RATE_LIMITER : env.READ_RATE_LIMITER;
  if (!binding) return true;

  try {
    const outcome = await binding.limit({ key: route });
    return outcome.success;
  } catch {
    // Fail-open somente para o binding: o fallback por isolate ja foi aplicado.
    console.error("abuse: route limiter unavailable");
    return true;
  }
}

async function resourceKey(route: "fetch" | "info", idHash: string): Promise<string> {
  const input = new TextEncoder().encode(`${route}:${idHash}`);
  let digest: Uint8Array | undefined;
  try {
    digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
    return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  } finally {
    input.fill(0);
    digest?.fill(0);
  }
}

export function checkStoreAllowed(env: Env): Promise<boolean> {
  return checkRouteAllowed(env, "store");
}

export function checkFetchAllowed(env: Env): Promise<boolean> {
  return checkRouteAllowed(env, "fetch");
}

export function checkInfoAllowed(env: Env): Promise<boolean> {
  return checkRouteAllowed(env, "info");
}

export async function checkResourceAllowed(
  env: Env,
  route: "fetch" | "info",
  idHash: string
): Promise<boolean> {
  if (!env.RESOURCE_RATE_LIMITER) return true;

  try {
    const outcome = await env.RESOURCE_RATE_LIMITER.limit({
      key: await resourceKey(route, idHash),
    });
    return outcome.success;
  } catch {
    console.error("abuse: resource limiter unavailable");
    return true;
  }
}
