/**
 * LockBrief — Application entry point.
 * Coordena UI, criptografia e chamadas de API.
 */

import { initUI, showScreen, renderCreateScreen, renderCreatedScreen, renderRevealScreen, renderKeyPrompt, renderPasswordPrompt, renderRevealedScreen, renderUnavailableScreen, flashCopyButton, ProtectionMode } from "./ui";
import { createEnvelope, openEnvelope, parseFragment, buildLink, base64urlDecode, base64urlEncode, FragmentParts, Envelope } from "./crypto";
import { getLang, t } from "./i18n";

// ── API Helpers ─────────────────────────────────────────────────
const API = {
  async store(idHash: string, payload: string, ttl: number, oneTime: boolean): Promise<boolean> {
    const res = await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idHash, payload, ttl, oneTime }),
    });
    const data = await res.json();
    return data.ok === true;
  },

  async fetchPayload(idHash: string): Promise<string | null> {
    const res = await fetch("/api/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idHash }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.payload || null;
  },

  async getInfo(idHash: string): Promise<{ oneTime: boolean; expiresAt: number; requiresPassword: boolean } | null> {
    const res = await fetch("/api/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idHash }),
    });
    if (!res.ok) return null;
    return res.json();
  },
};

// ── Reveal state — envelope + key stored in memory after first fetch ──
let storedEnvelope: Envelope | null = null;
let storedKeyBytes: Uint8Array | null = null;
let secretOneTime = true;
let secretExpiresAt = 0;

function hasStoredData(): boolean {
  return storedEnvelope !== null && storedKeyBytes !== null;
}

// ── Init ────────────────────────────────────────────────────────
async function main(): Promise<void> {
  initUI();
  getLang();

  const hash = window.location.hash;
  if (hash) {
    const parsed = parseFragment(hash);
    if (parsed) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
      showScreen("reveal");

      // Consulta metadados (oneTime + expiração) sem consumir o segredo.
      const rawIdBytes = base64urlDecode(parsed.rawId);
      const digest = await crypto.subtle.digest("SHA-256", rawIdBytes);
      const idHash = base64urlEncode(new Uint8Array(digest));
      const info = await API.getInfo(idHash);

      if (!info) {
        renderUnavailableScreen();
        showScreen("unavailable");
        return;
      }

      secretOneTime = info.oneTime;
      secretExpiresAt = info.expiresAt;

      // Um segredo protegido por senha sempre usa o link completo gerado pelo app.
      // Se a chave foi removida manualmente do fragmento, nao consumimos a nota.
      if (info.requiresPassword && !parsed.key) {
        renderUnavailableScreen();
        showScreen("unavailable");
        return;
      }

      renderRevealScreen(!parsed.key, info.requiresPassword, info.oneTime, info.expiresAt, {
        onSubmit: () => handleReveal(parsed),
      });
      return;
    }
  }

  showScreen("create");
  renderCreateScreen({
    onSubmit: (data) => handleCreate(data.secret, data.ttl, data.password, data.oneTime, data.protection),
  });
}

// ── Create Handler ──────────────────────────────────────────────
async function handleCreate(
  secret: string,
  ttl: number,
  password: string,
  oneTime: boolean,
  protection: ProtectionMode
): Promise<void> {
  const key = window.crypto.getRandomValues(new Uint8Array(32));
  const { envelope, idHash, rawIdB64 } = await createEnvelope(
    secret,
    key,
    password || undefined
  );

  const payload = JSON.stringify(envelope);
  const success = await API.store(idHash, payload, ttl, oneTime);

  if (!success) {
    renderUnavailableScreen();
    showScreen("unavailable");
    return;
  }

  const keyB64 = base64urlEncode(key);
  const baseUrl = `${window.location.origin}${window.location.pathname}`.replace(/\/$/, "");
  const linkFull = buildLink(baseUrl, rawIdB64, keyB64);
  const linkshort = `${baseUrl}#v1.${rawIdB64}`;

  renderCreatedScreen(linkFull, linkshort, keyB64, password, { ttl, oneTime, protection }, {
    onCopy: (text) => {
      navigator.clipboard.writeText(text).catch(() => {});
    },
  });
  showScreen("created");
}

// ── Reveal Handler (step 1: fetch from server — consome o segredo) ──
// Após este ponto, o envelope e a chave ficam em memória (storedEnvelope/storedKeyBytes).
// Todas as retentativas de senha/chave usam esses dados locais.
async function handleReveal(
  fragment: FragmentParts
): Promise<void> {
  // Se já temos dados armazenados de uma tentativa anterior (ex.: usuário
  // digitou chave errada e está tentando de novo), usa os dados locais.
  if (hasStoredData()) {
    await tryDecryptWithStoredData();
    return;
  }

  // Primeira tentativa: buscar do servidor — consome o segredo se oneTime=true
  const rawIdBytes = base64urlDecode(fragment.rawId);
  const digest = await crypto.subtle.digest("SHA-256", rawIdBytes);
  const idHash = base64urlEncode(new Uint8Array(digest));

  // IMPORTANTE: o fetch vem ANTES da validação da chave.
  // Para oneTime=true, o segredo é consumido no primeiro fetch, independentemente
  // do formato ou valor da chave. Isso garante que fechar o navegador após
  // qualquer tentativa invalida o link — o segredo já foi removido do servidor.
  const payload = await API.fetchPayload(idHash);

  if (!payload) {
    renderUnavailableScreen();
    showScreen("unavailable");
    return;
  }

  let envelope: Envelope;
  try {
    envelope = JSON.parse(payload) as Envelope;
  } catch {
    renderUnavailableScreen();
    showScreen("unavailable");
    return;
  }

  // Valida formato da chave (só para UX — o fetch já consumiu o segredo).
  const keyStr = fragment.key;
  if (!keyStr || keyStr.length !== 43) {
    storeForRetry(envelope, new Uint8Array(32)); // placeholder
    renderKeyPrompt((key) => handleKeyAttempt(key), secretOneTime);
    return;
  }
  let keyBytes: Uint8Array;
  try {
    keyBytes = base64urlDecode(keyStr);
  } catch {
    storeForRetry(envelope, new Uint8Array(32)); // placeholder
    renderKeyPrompt((key) => handleKeyAttempt(key), secretOneTime, t("revealKeyError"));
    return;
  }

  // Armazena para retentativas futuras
  storeForRetry(envelope, keyBytes);

  // Tenta descriptografar
  await tryDecryptWithStoredData();
}

// ── Armazena envelope + chave para retry ─────────────────────
function storeForRetry(envelope: Envelope, keyBytes: Uint8Array): void {
  storedEnvelope = envelope;
  storedKeyBytes = keyBytes;
}

// ── Tenta descriptografar com dados em memória (sem re-fetch) ──
async function tryDecryptWithStoredData(): Promise<void> {
  if (!hasStoredData()) return;
  const envelope = storedEnvelope!;
  const keyBytes = storedKeyBytes!;

  if (envelope.kdf !== "none" && envelope.kdf !== undefined) {
    renderPasswordPrompt((password) => handlePasswordAttempt(password), secretOneTime);
    return;
  }

  try {
    const secret = await openEnvelope(envelope, keyBytes);
    showRevealedSecret(secret);
  } catch {
    renderKeyPrompt((key) => handleKeyAttempt(key), secretOneTime, t("revealKeyError"));
  }
}

// ── Tentativa com chave digitada pelo usuário ──────────────────
async function handleKeyAttempt(keyInput: string): Promise<void> {
  if (!keyInput || !hasStoredData()) return;

  let newKeyBytes: Uint8Array;
  try {
    newKeyBytes = base64urlDecode(keyInput);
  } catch {
    renderKeyPrompt((key) => handleKeyAttempt(key), secretOneTime, t("revealKeyError"));
    return;
  }

  storedKeyBytes = newKeyBytes;
  await tryDecryptWithStoredData();
}

// ── Tentativa com senha ────────────────────────────────────────
async function handlePasswordAttempt(password: string): Promise<void> {
  if (!hasStoredData()) {
    renderUnavailableScreen();
    showScreen("unavailable");
    return;
  }

  try {
    const secret = await openEnvelope(storedEnvelope!, storedKeyBytes!, password || undefined);
    showRevealedSecret(secret);
  } catch {
    renderPasswordPrompt(
      (p) => handlePasswordAttempt(p),
      secretOneTime,
      t("revealPwdError")
    );
  }
}

// ── Exibe o segredo revelado ───────────────────────────────────
function showRevealedSecret(secret: string): void {
  renderRevealedScreen(secret, secretOneTime, secretExpiresAt, {
    onCopy: (text) => {
      navigator.clipboard.writeText(text).catch(() => {});
      const btn = document.getElementById("copySecretBtn");
      if (btn) flashCopyButton(btn);
    },
  });
  showScreen("revealed");
  storedEnvelope = null;
  storedKeyBytes = null;
}

// ── Boot ────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", main);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !window.location.hash) {
    window.location.href = "/";
  }
});

// Alerta ao sair da tela de segredo revelado (apenas leitura única).
window.addEventListener("beforeunload", (e) => {
  if (secretOneTime && (storedEnvelope !== null || document.getElementById("revealedSecretText"))) {
    e.preventDefault();
    e.returnValue = "";
  }
});
