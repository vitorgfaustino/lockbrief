/**
 * Validacoes de entrada: formato, tamanho, TTL, envelope.
 * Nunca revela qual validacao falhou em producao.
 */

import {
  CURRENT_HKDF_INFO,
  CURRENT_PBKDF2_ITERATIONS,
  ENVELOPE_ALGORITHM,
  Envelope,
  PASSWORD_KDF,
} from "./envelope-format";

const B64URL_RE = /^[A-Za-z0-9_-]{43}$/;
const B64URL_VALUE_RE = /^[A-Za-z0-9_-]+$/;
const B64URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const IDHASH_LENGTH = 43; // SHA-256 em base64url sem padding
const MAX_BODY_BYTES = 102400; // 100 KB
const MAX_PAYLOAD_BYTES = 102400;

const ALLOWED_TTLS = new Set([3600, 86400, 604800]);

function isBase64urlValue(value: string): boolean {
  if (!B64URL_VALUE_RE.test(value)) return false;

  const remainder = value.length % 4;
  if (remainder === 1) return false;
  if (remainder === 0) return true;

  const lastValue = B64URL_ALPHABET.indexOf(value[value.length - 1]);
  // Sem padding: sobram 2 bits uteis quando remainder=2 e 4 quando remainder=3.
  return remainder === 2
    ? (lastValue & 0b1111) === 0
    : (lastValue & 0b0011) === 0;
}

export interface ValidationError {
  error: "invalid_request" | "not_available";
  status: 400 | 404;
}

export function validateIdHash(idHash: unknown): idHash is string {
  return typeof idHash === "string"
    && B64URL_RE.test(idHash)
    && idHash.length === IDHASH_LENGTH
    && isBase64urlValue(idHash);
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
export function validateEnvelope(envelope: unknown): envelope is Envelope {
  if (!isRecord(envelope)) return false;

  const v = envelope.v;
  const alg = envelope.alg;
  const iv = envelope.iv;
  const ciphertext = envelope.ciphertext;
  const kdf = envelope.kdf;
  const salt = envelope.salt;

  // Versao e algoritmo
  if (v !== 1 && v !== 2) return false;
  if (alg !== ENVELOPE_ALGORITHM) return false;

  // IV: 12 bytes = 16 chars base64url sem padding
  if (typeof iv !== "string" || iv.length !== 16 || !isBase64urlValue(iv)) return false;

  // AES-GCM com tag de 128 bits produz no minimo 16 bytes = 22 chars base64url.
  if (typeof ciphertext !== "string" || ciphertext.length < 22 || !isBase64urlValue(ciphertext)) return false;

  // KDF
  if (kdf !== "none" && kdf !== PASSWORD_KDF) return false;

  // Salt: obrigatorio com KDF, null sem KDF
  if (kdf === "none") {
    if (salt !== null) return false;
  } else {
    if (typeof salt !== "string" || salt.length !== 22 || !isBase64urlValue(salt)) return false; // 16 bytes = 22 chars base64url
  }

  if (v === 2) {
    const kdfParams = envelope.kdfParams;
    if (kdf === "none") {
      if (kdfParams !== null) return false;
    } else {
      if (!isRecord(kdfParams)) return false;
      if (Object.keys(kdfParams).length !== 2) return false;
      if (kdfParams.iterations !== CURRENT_PBKDF2_ITERATIONS) return false;
      if (kdfParams.hkdfInfo !== CURRENT_HKDF_INFO) return false;
    }
  }

  return true;
}
