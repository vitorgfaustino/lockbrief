export const ENVELOPE_ALGORITHM = "AES-GCM-256" as const;
export const PASSWORD_KDF = "PBKDF2-SHA256+HKDF-SHA256" as const;
export const LEGACY_PBKDF2_ITERATIONS = 210_000;
export const CURRENT_PBKDF2_ITERATIONS = 210_000;
export const LEGACY_HKDF_INFO = "lockbrief:v1:kdf";
export const CURRENT_HKDF_INFO = "lockbrief:v2:kdf";

export interface LegacyEnvelope {
  v: 1;
  alg: typeof ENVELOPE_ALGORITHM;
  iv: string;
  ciphertext: string;
  kdf: "none" | typeof PASSWORD_KDF;
  salt: string | null;
}

export interface VersionedPlainEnvelope {
  v: 2;
  alg: typeof ENVELOPE_ALGORITHM;
  iv: string;
  ciphertext: string;
  kdf: "none";
  salt: null;
  kdfParams: null;
}

export interface VersionedPasswordEnvelope {
  v: 2;
  alg: typeof ENVELOPE_ALGORITHM;
  iv: string;
  ciphertext: string;
  kdf: typeof PASSWORD_KDF;
  salt: string;
  kdfParams: {
    iterations: typeof CURRENT_PBKDF2_ITERATIONS;
    hkdfInfo: typeof CURRENT_HKDF_INFO;
  };
}

export type Envelope = LegacyEnvelope | VersionedPlainEnvelope | VersionedPasswordEnvelope;
