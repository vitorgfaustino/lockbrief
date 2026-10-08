/**
 * LockBrief — Web Crypto API helpers.
 * Toda criptografia ocorre no navegador.
 * O Worker nunca recebe plaintext, chave ou senha.
 */

import {
  CURRENT_HKDF_INFO,
  CURRENT_PBKDF2_ITERATIONS,
  Envelope,
  LEGACY_HKDF_INFO,
  LEGACY_PBKDF2_ITERATIONS,
  PASSWORD_KDF,
} from "../lib/envelope-format";
import { validateEnvelope } from "../lib/validation";

export type { Envelope } from "../lib/envelope-format";

// ── Encoding ───────────────────────────────────────────────────
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ── Base64url (RFC 4648 §5, no padding) ───────────────────────
export function base64urlEncode(bytes: Uint8Array<ArrayBuffer>): string {
  const bin = String.fromCharCode(...Array.from(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ── Random Generation ──────────────────────────────────────────
export function randomBytes(n: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(n));
}

// ── SHA-256 for idHash ─────────────────────────────────────────
export async function sha256(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

export async function computeIdHash(rawId: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await sha256(rawId);
  return base64urlEncode(digest);
}

// ── AES-GCM Encrypt / Decrypt ──────────────────────────────────
async function importAesKey(keyBytes: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptAes(
  plaintext: string,
  key: Uint8Array<ArrayBuffer>
): Promise<{ iv: Uint8Array<ArrayBuffer>; ciphertext: Uint8Array<ArrayBuffer> }> {
  const iv = randomBytes(12);
  const aesKey = await importAesKey(key);
  const plainBytes = encoder.encode(plaintext);
  try {
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plainBytes);
    return { iv, ciphertext: new Uint8Array(encrypted) };
  } finally {
    plainBytes.fill(0);
  }
}

export async function decryptAes(
  iv: Uint8Array<ArrayBuffer>,
  ciphertext: Uint8Array<ArrayBuffer>,
  key: Uint8Array<ArrayBuffer>
): Promise<string> {
  const aesKey = await importAesKey(key);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
  const decryptedBytes = new Uint8Array(decrypted);
  try {
    return decoder.decode(decryptedBytes);
  } finally {
    decryptedBytes.fill(0);
  }
}

// ── PBKDF2-SHA256 ──────────────────────────────────────────────
export async function derivePbkdf2(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations = LEGACY_PBKDF2_ITERATIONS
): Promise<Uint8Array<ArrayBuffer>> {
  const passwordBytes = encoder.encode(password);
  try {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordBytes,
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      keyMaterial,
      256
    );
    return new Uint8Array(derived);
  } finally {
    passwordBytes.fill(0);
  }
}

// ── HKDF-SHA256 ────────────────────────────────────────────────
export async function deriveHkdf(
  ikm: Uint8Array<ArrayBuffer>,
  infoText = LEGACY_HKDF_INFO
): Promise<Uint8Array<ArrayBuffer>> {
  const info = encoder.encode(infoText);
  try {
    const hkdfKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
    const derived = await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info },
      hkdfKey,
      256
    );
    return new Uint8Array(derived);
  } finally {
    info.fill(0);
  }
}

// ── Combined KDF ───────────────────────────────────────────────
export function combineKeys(key: Uint8Array<ArrayBuffer>, kPwd: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const combined = new Uint8Array(64);
  combined.set(key, 0);
  combined.set(kPwd, 32);
  return combined;
}

export async function createEnvelope(
  plaintext: string,
  key: Uint8Array<ArrayBuffer>,
  password?: string
): Promise<{ envelope: Envelope; idHash: string; rawIdB64: string }> {
  const rawId = randomBytes(32);
  let rawIdB64: string;
  let idHash: string;
  try {
    rawIdB64 = base64urlEncode(rawId);
    idHash = await computeIdHash(rawId);
  } finally {
    rawId.fill(0);
  }

  let finalKey: Uint8Array<ArrayBuffer> = key;
  let derivedFinalKey: Uint8Array<ArrayBuffer> | null = null;
  let passwordKey: Uint8Array<ArrayBuffer> | null = null;
  let combinedKey: Uint8Array<ArrayBuffer> | null = null;
  let kdf: Envelope["kdf"] = "none";
  let salt: string | null = null;

  try {
    if (password) {
      kdf = PASSWORD_KDF;
      const saltBytes = randomBytes(16);
      try {
        salt = base64urlEncode(saltBytes);
        passwordKey = await derivePbkdf2(password, saltBytes, CURRENT_PBKDF2_ITERATIONS);
        combinedKey = combineKeys(key, passwordKey);
        derivedFinalKey = await deriveHkdf(combinedKey, CURRENT_HKDF_INFO);
        finalKey = derivedFinalKey;
      } finally {
        saltBytes.fill(0);
      }
    }

    const { iv, ciphertext } = await encryptAes(plaintext, finalKey);
    try {
      const common = {
        v: 2 as const,
        alg: "AES-GCM-256" as const,
        iv: base64urlEncode(iv),
        ciphertext: base64urlEncode(ciphertext),
      };
      const envelope: Envelope = kdf === PASSWORD_KDF
        ? {
            ...common,
            kdf,
            salt: salt as string,
            kdfParams: {
              iterations: CURRENT_PBKDF2_ITERATIONS,
              hkdfInfo: CURRENT_HKDF_INFO,
            },
          }
        : { ...common, kdf: "none", salt: null, kdfParams: null };

      return { envelope, idHash, rawIdB64 };
    } finally {
      iv.fill(0);
      ciphertext.fill(0);
    }
  } finally {
    passwordKey?.fill(0);
    combinedKey?.fill(0);
    derivedFinalKey?.fill(0);
  }
}

export async function openEnvelope(
  envelope: Envelope,
  key: Uint8Array<ArrayBuffer>,
  password?: string
): Promise<string> {
  if (!validateEnvelope(envelope)) throw new Error("Invalid envelope");
  let finalKey: Uint8Array<ArrayBuffer> = key;
  let derivedFinalKey: Uint8Array<ArrayBuffer> | null = null;
  let passwordKey: Uint8Array<ArrayBuffer> | null = null;
  let combinedKey: Uint8Array<ArrayBuffer> | null = null;

  try {
    if (envelope.kdf === PASSWORD_KDF) {
      if (!password) throw new Error("Password required");
      if (!envelope.salt) throw new Error("Salt missing");
      const saltBytes = base64urlDecode(envelope.salt);
      try {
        const iterations = envelope.v === 2
          ? envelope.kdfParams.iterations
          : LEGACY_PBKDF2_ITERATIONS;
        const hkdfInfo = envelope.v === 2
          ? envelope.kdfParams.hkdfInfo
          : LEGACY_HKDF_INFO;
        passwordKey = await derivePbkdf2(password, saltBytes, iterations);
        combinedKey = combineKeys(key, passwordKey);
        derivedFinalKey = await deriveHkdf(combinedKey, hkdfInfo);
        finalKey = derivedFinalKey;
      } finally {
        saltBytes.fill(0);
      }
    }

    const iv = base64urlDecode(envelope.iv);
    const ciphertext = base64urlDecode(envelope.ciphertext);
    try {
      return await decryptAes(iv, ciphertext, finalKey);
    } finally {
      iv.fill(0);
      ciphertext.fill(0);
    }
  } finally {
    passwordKey?.fill(0);
    combinedKey?.fill(0);
    derivedFinalKey?.fill(0);
  }
}

// ── URL Fragment ───────────────────────────────────────────────
export interface FragmentParts {
  rawId: string;    // base64url
  key: string | null; // base64url, null if separated
}

export function parseFragment(hash: string): FragmentParts | null {
  const match = hash.match(/^#v1\.([A-Za-z0-9_-]{43})(?:\.([A-Za-z0-9_-]{43}))?$/);
  if (!match) return null;
  return { rawId: match[1], key: match[2] || null };
}

export function buildFragment(rawId: string, key: string): string {
  return `#v1.${rawId}.${key}`;
}

export function buildLink(base: string, rawId: string, key?: string): string {
  const fragment = key ? buildFragment(rawId, key) : `#v1.${rawId}`;
  return `${base}${fragment}`;
}
