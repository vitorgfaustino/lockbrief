/**
 * Validacoes de entrada: formato, tamanho, TTL, envelope.
 * Nunca revela qual validacao falhou em producao.
 */

const B64URL_RE = /^[A-Za-z0-9_-]{43}$/;
const IDHASH_LENGTH = 43; // SHA-256 em base64url sem padding
const MAX_BODY_BYTES = 102400; // 100 KB
const MAX_PAYLOAD_BYTES = 102400;

const ALLOWED_TTLS = new Set([3600, 86400, 604800]);

export interface ValidationError {
  error: "invalid_request" | "not_available";
  status: 400 | 404;
}

export function validateIdHash(idHash: unknown): idHash is string {
  return typeof idHash === "string" && B64URL_RE.test(idHash) && idHash.length === IDHASH_LENGTH;
}

export function validateTTL(ttl: unknown): ttl is number {
  return typeof ttl === "number" && Number.isInteger(ttl) && ALLOWED_TTLS.has(ttl);
}

export function validatePayloadLength(payload: unknown): boolean {
  if (typeof payload !== "string") return false;
  return new TextEncoder().encode(payload).length <= MAX_PAYLOAD_BYTES;
}

export function validateBodyLength(bodyText: string): boolean {
  return new TextEncoder().encode(bodyText).length <= MAX_BODY_BYTES;
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Validacao do envelope criptografico.
 * Valida estrutura minima e tamanhos esperados.
 * IV: 16 chars base64url = 12 bytes (96 bits).
 * salt: 22 chars base64url = 16 bytes (128 bits) quando kdf != "none".
 * ciphertext: nao vazio.
 */
export function validateEnvelope(envelope: unknown): boolean {
  if (!isRecord(envelope)) return false;

  const v = envelope.v;
  const alg = envelope.alg;
  const iv = envelope.iv;
  const ciphertext = envelope.ciphertext;
  const kdf = envelope.kdf;
  const salt = envelope.salt;

  // Versao e algoritmo
  if (v !== 1) return false;
  if (alg !== "AES-GCM-256") return false;

  // IV: 12 bytes = 16 chars base64url sem padding
  if (typeof iv !== "string" || iv.length !== 16) return false;

  // Ciphertext: deve existir e nao ser vazio
  if (typeof ciphertext !== "string" || ciphertext.length === 0) return false;

  // KDF
  if (kdf !== "none" && kdf !== "PBKDF2-SHA256+HKDF-SHA256") return false;

  // Salt: obrigatorio com KDF, null sem KDF
  if (kdf === "none") {
    if (salt !== null) return false;
  } else {
    if (typeof salt !== "string" || salt.length !== 22) return false; // 16 bytes = 22 chars base64url
  }

  return true;
}
