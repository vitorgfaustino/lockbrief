/**
 * LockBrief — Web Crypto API helpers.
 * Toda criptografia ocorre no navegador.
 * O Worker nunca recebe plaintext, chave ou senha.
 */

// ── Encoding ───────────────────────────────────────────────────
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ── Base64url (RFC 4648 §5, no padding) ───────────────────────
export function base64urlEncode(bytes: Uint8Array): string {
  const bin = String.fromCharCode(...Array.from(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64urlDecode(str: string): Uint8Array {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ── Random Generation ──────────────────────────────────────────
export function randomBytes(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

// ── SHA-256 for idHash ─────────────────────────────────────────
export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

export async function computeIdHash(rawId: Uint8Array): Promise<string> {
  const digest = await sha256(rawId);
  return base64urlEncode(digest);
}

// ── AES-GCM Encrypt / Decrypt ──────────────────────────────────
async function importAesKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptAes(
  plaintext: string,
  key: Uint8Array
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const iv = randomBytes(12);
  const aesKey = await importAesKey(key);
  const plainBytes = encoder.encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plainBytes);
  return { iv, ciphertext: new Uint8Array(encrypted) };
}

export async function decryptAes(
  iv: Uint8Array,
  ciphertext: Uint8Array,
  key: Uint8Array
): Promise<string> {
  const aesKey = await importAesKey(key);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
  return decoder.decode(decrypted);
}

// ── PBKDF2-SHA256 ──────────────────────────────────────────────
const PBKDF2_ITERATIONS = 210_000;

export async function derivePbkdf2(
  password: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return new Uint8Array(derived);
}

// ── HKDF-SHA256 ────────────────────────────────────────────────
const HKDF_INFO = encoder.encode("lockbrief:v1:kdf");

export async function deriveHkdf(
  ikm: Uint8Array
): Promise<Uint8Array> {
  const hkdfKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: HKDF_INFO },
    hkdfKey,
    256
  );
  return new Uint8Array(derived);
}

// ── Combined KDF ───────────────────────────────────────────────
export function combineKeys(key: Uint8Array, kPwd: Uint8Array): Uint8Array {
  const combined = new Uint8Array(64);
  combined.set(key, 0);
  combined.set(kPwd, 32);
  return combined;
}

// ── Envelope ───────────────────────────────────────────────────
export interface Envelope {
  v: 1;
  alg: "AES-GCM-256";
  iv: string;
  ciphertext: string;
  kdf: "none" | "PBKDF2-SHA256+HKDF-SHA256";
  salt: string | null;
}

export async function createEnvelope(
  plaintext: string,
  key: Uint8Array,
  password?: string
): Promise<{ envelope: Envelope; idHash: string; rawIdB64: string }> {
  const rawId = randomBytes(32);
  const rawIdB64 = base64urlEncode(rawId);
  const idHash = await computeIdHash(rawId);

  let finalKey: Uint8Array;
  let kdf: Envelope["kdf"] = "none";
  let salt: string | null = null;

  if (password) {
    kdf = "PBKDF2-SHA256+HKDF-SHA256";
    const saltBytes = randomBytes(16);
    salt = base64urlEncode(saltBytes);
    const kPwd = await derivePbkdf2(password, saltBytes);
    const combined = combineKeys(key, kPwd);
    finalKey = await deriveHkdf(combined);
  } else {
    finalKey = key;
  }

  const { iv, ciphertext } = await encryptAes(plaintext, finalKey);

  return {
    envelope: {
      v: 1,
      alg: "AES-GCM-256",
      iv: base64urlEncode(iv),
      ciphertext: base64urlEncode(ciphertext),
      kdf,
      salt,
    },
    idHash,
    rawIdB64,
  };
}

export async function openEnvelope(
  envelope: Envelope,
  key: Uint8Array,
  password?: string
): Promise<string> {
  let finalKey: Uint8Array;

  if (envelope.kdf === "PBKDF2-SHA256+HKDF-SHA256") {
    if (!password) throw new Error("Password required");
    if (!envelope.salt) throw new Error("Salt missing");
    const saltBytes = base64urlDecode(envelope.salt);
    const kPwd = await derivePbkdf2(password, saltBytes);
    const combined = combineKeys(key, kPwd);
    finalKey = await deriveHkdf(combined);
  } else {
    finalKey = key;
  }

  const iv = base64urlDecode(envelope.iv);
  const ciphertext = base64urlDecode(envelope.ciphertext);
  return decryptAes(iv, ciphertext, finalKey);
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
