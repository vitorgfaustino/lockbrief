/**
 * Abuse Controls — contencao em memoria sem persistencia.
 *
 * Regras:
 * - Sem D1 para rate limit (minimizacao de dados).
 * - Contadores efemeros no escopo global do isolate.
 * - Cold start reseta — aceitavel para MVP.
 * - Circuit breaker global contra surtos.
 */

const STORE_LIMIT = 30;      // por janela
const STORE_WINDOW = 60;     // segundos
const STORE_GLOBAL_MAX = 300; // circuit breaker por janela
const FETCH_LIMIT = 60;
const FETCH_WINDOW = 60;

let storeCount = 0;
let storeResetAt = 0;
let fetchCount = 0;
let fetchResetAt = 0;

function now(): number {
  return Math.floor(Date.now() / 1000);
}

export function checkStoreAllowed(): boolean {
  const t = now();
  if (t >= storeResetAt) {
    storeCount = 0;
    storeResetAt = t + STORE_WINDOW;
  }
  if (storeCount >= STORE_GLOBAL_MAX) return false; // circuit breaker
  if (storeCount >= STORE_LIMIT) return false;
  storeCount++;
  return true;
}

export function checkFetchAllowed(): boolean {
  const t = now();
  if (t >= fetchResetAt) {
    fetchCount = 0;
    fetchResetAt = t + FETCH_WINDOW;
  }
  if (fetchCount >= FETCH_LIMIT) return false;
  fetchCount++;
  return true;
}
