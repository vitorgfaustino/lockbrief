import { describe, expect, it } from "vitest";
import {
  base64urlEncode,
  combineKeys,
  createEnvelope,
  deriveHkdf,
  derivePbkdf2,
  encryptAes,
  openEnvelope,
  randomBytes,
} from "../src/client/crypto";
import type { Envelope } from "../src/client/crypto";
import {
  CURRENT_HKDF_INFO,
  CURRENT_PBKDF2_ITERATIONS,
  LEGACY_HKDF_INFO,
  LEGACY_PBKDF2_ITERATIONS,
  PASSWORD_KDF,
} from "../src/lib/envelope-format";

describe("envelopes criptograficos", () => {
  it("cria envelope v2 sem senha e abre o plaintext", async () => {
    const key = randomBytes(32);
    try {
      const { envelope } = await createEnvelope("segredo v2", key);

      expect(envelope.v).toBe(2);
      expect(envelope.kdf).toBe("none");
      if (envelope.v !== 2 || envelope.kdf !== "none") throw new Error("envelope inesperado");
      expect(envelope.kdfParams).toBeNull();
      await expect(openEnvelope(envelope, key)).resolves.toBe("segredo v2");
    } finally {
      key.fill(0);
    }
  });

  it("explicita parametros do KDF v2 e rejeita senha incorreta", async () => {
    const key = randomBytes(32);
    try {
      const { envelope } = await createEnvelope("protegido", key, "senha-correta");

      expect(envelope.v).toBe(2);
      expect(envelope.kdf).toBe(PASSWORD_KDF);
      if (envelope.v !== 2 || envelope.kdf !== PASSWORD_KDF) throw new Error("envelope inesperado");
      expect(envelope.kdfParams).toEqual({
        iterations: CURRENT_PBKDF2_ITERATIONS,
        hkdfInfo: CURRENT_HKDF_INFO,
      });
      await expect(openEnvelope(envelope, key, "senha-correta")).resolves.toBe("protegido");
      await expect(openEnvelope(envelope, key, "senha-incorreta")).rejects.toThrow();
    } finally {
      key.fill(0);
    }
  });

  it("continua abrindo envelope legado v1 com os parametros antigos", async () => {
    const key = randomBytes(32);
    const salt = randomBytes(16);
    const passwordKey = await derivePbkdf2("senha-legada", salt, LEGACY_PBKDF2_ITERATIONS);
    const combined = combineKeys(key, passwordKey);
    const finalKey = await deriveHkdf(combined, LEGACY_HKDF_INFO);

    try {
      const { iv, ciphertext } = await encryptAes("legado", finalKey);
      const envelope: Envelope = {
        v: 1,
        alg: "AES-GCM-256",
        iv: base64urlEncode(iv),
        ciphertext: base64urlEncode(ciphertext),
        kdf: PASSWORD_KDF,
        salt: base64urlEncode(salt),
      };

      await expect(openEnvelope(envelope, key, "senha-legada")).resolves.toBe("legado");
      iv.fill(0);
      ciphertext.fill(0);
    } finally {
      key.fill(0);
      salt.fill(0);
      passwordKey.fill(0);
      combined.fill(0);
      finalKey.fill(0);
    }
  });
});
