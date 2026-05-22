/**
 * Normalizacao de erros.
 * Erros publicos sao sempre genericos.
 * Erros internos sao registrados apenas no console do Worker
 * e nunca expostos ao cliente.
 */

export type PublicError = "invalid_request" | "not_available";

export interface ErrorResult {
  error: PublicError;
  status: 400 | 404 | 429 | 500 | 503;
}

export function badRequest(): ErrorResult {
  return { error: "invalid_request", status: 400 };
}

export function notAvailable(): ErrorResult {
  return { error: "not_available", status: 404 };
}

export function tooManyRequests(): ErrorResult {
  return { error: "invalid_request", status: 429 };
}

export function serviceUnavailable(): ErrorResult {
  return { error: "invalid_request", status: 503 };
}

export function internalError(): ErrorResult {
  return { error: "invalid_request", status: 500 };
}
