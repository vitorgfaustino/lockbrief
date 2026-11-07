/**
 * LockBrief — Application entry point.
 * Coordena UI, criptografia e chamadas de API.
 */

import { initUI, showScreen, getCurrentScreen, showLoading, hideLoading, renderCreateScreen, renderCreatedScreen, renderRevealScreen, renderKeyPrompt, renderPasswordPrompt, renderRevealedScreen, renderUnavailableScreen, renderErrorScreen, announce, stopCountdownTimer, clearCreateSensitiveInputs, clearRevealSensitiveInputs, ProtectionMode } from "./ui";
import { createEnvelope, openEnvelope, parseFragment, buildLink, base64urlDecode, base64urlEncode, FragmentParts, Envelope } from "./crypto";
import { getLang, t } from "./i18n";

// ── API Helpers ─────────────────────────────────────────────────
type ApiFailure = { ok: false; status: number | null };
type InfoData = { oneTime: boolean; expiresAt: number; requiresPassword: boolean };

const API = {
  async store(
    idHash: string,
    payload: string,
    ttl: number,
    oneTime: boolean
  ): Promise<{ ok: true } | ApiFailure> {
    try {
      const res = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash, payload, ttl, oneTime }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data && typeof data === "object" && (data as { ok?: unknown }).ok === true) {
        return { ok: true };
      }
      return { ok: false, status: res.status };
    } catch {
      return { ok: false, status: null };
    }
  },

  async fetchPayload(idHash: string): Promise<{ ok: true; payload: string } | ApiFailure> {
    try {
      const res = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
      });
      if (!res.ok) return { ok: false, status: res.status };
      const data = await res.json().catch(() => null);
      if (data && typeof data === "object" && typeof (data as { payload?: unknown }).payload === "string") {
        return { ok: true, payload: (data as { payload: string }).payload };
      }
      return { ok: false, status: res.status };
    } catch {
      return { ok: false, status: null };
    }
  },

  async getInfo(idHash: string): Promise<{ ok: true; data: InfoData } | ApiFailure> {
    const controller = new AbortController();
    // Metadados são pequenos; um timeout evita ficar preso no loading
    // depois que o fragmento já foi removido da URL.
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idHash }),
        signal: controller.signal,
      });
      if (!res.ok) return { ok: false, status: res.status };
      const data = await res.json().catch(() => null);
      if (data && typeof data === "object"
        && typeof (data as InfoData).oneTime === "boolean"
        && typeof (data as InfoData).requiresPassword === "boolean"
        && Number.isSafeInteger((data as InfoData).expiresAt)) {
        return { ok: true, data: data as InfoData };
      }
      return { ok: false, status: res.status };
    } catch {
      return { ok: false, status: null };
    } finally {
      window.clearTimeout(timeoutId);
    }
  },
};

function isRateLimit(status: number | null): boolean {
  return status === 429;
}

function showRevealError(status: number | null, onRetry: () => void): void {
  if (isRateLimit(status)) {
    renderErrorScreen("rateLimit", { onRetry });
  } else if (status === null) {
    renderErrorScreen("network", { onRetry });
  } else {
    renderErrorScreen("info", { onRetry });
  }
  showScreen("error");
}

function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  const register = (): void => {
    navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }).catch(() => {});
  };

  if (document.readyState === "complete") {
    register();
    return;
  }

  window.addEventListener("load", register, { once: true });
}

// ── Reveal state — envelope + key stored in memory after first fetch ──
let storedEnvelope: Envelope | null = null;
let storedKeyBytes: Uint8Array<ArrayBuffer> | null = null;
let secretOneTime = true;
let secretExpiresAt = 0;

function hasStoredData(): boolean {
  return storedEnvelope !== null && storedKeyBytes !== null;
}

function clearStoredData(): void {
  storedKeyBytes?.fill(0);
  storedEnvelope = null;
  storedKeyBytes = null;
}

// ── Init ────────────────────────────────────────────────────────
async function main(): Promise<void> {
  initUI();
  getLang();
  registerServiceWorker();

  const hash = window.location.hash;
  if (hash) {
    const parsed = parseFragment(hash);
    // O fragmento pode conter a chave. Remove-o da barra assim que o formato é
    // lido; o retry de /api/info usa apenas os dados em memória.
    history.replaceState(null, "", window.location.pathname + window.location.search);
    if (parsed) {
      await beginReveal(parsed);
      return;
    }
  }

  showScreen("create");
  renderCreateScreen({
    onSubmit: (data) => handleCreate(data.secret, data.ttl, data.password, data.oneTime, data.protection),
  });
}

// ── Reveal metadata (does not consume the secret) ───────────────
async function beginReveal(parsed: FragmentParts): Promise<void> {
  showScreen("reveal");
  showLoading();

  try {
    const rawIdBytes = base64urlDecode(parsed.rawId);
    const digest = await crypto.subtle.digest("SHA-256", rawIdBytes);
    const idHash = base64urlEncode(new Uint8Array(digest));
    const infoResult = await API.getInfo(idHash);

    if (!infoResult.ok) {
      if (infoResult.status === 404) {
        renderUnavailableScreen();
        showScreen("unavailable");
      } else {
        showRevealError(infoResult.status, () => retryReveal(parsed));
      }
      return;
    }

    const info = infoResult.data;
    secretOneTime = info.oneTime;
    secretExpiresAt = info.expiresAt;

    // Um segredo protegido por senha sempre usa o link completo gerado pelo app.
    // Se a senha automática foi removida manualmente do fragmento, nao consumimos o segredo.
    if (info.requiresPassword && !parsed.key) {
      renderUnavailableScreen();
      showScreen("unavailable");
      return;
    }

    renderRevealScreen(!parsed.key, info.requiresPassword, info.oneTime, info.expiresAt, {
      onSubmit: () => handleReveal(parsed),
      onCancel: () => { allowLeave = true; },
    });
  } finally {
    hideLoading();
  }
}

function retryReveal(parsed: FragmentParts): void {
  void beginReveal(parsed).catch(() => {
    hideLoading();
    showRevealError(null, () => retryReveal(parsed));
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
  try {
    const { envelope, idHash, rawIdB64 } = await createEnvelope(
      secret,
      key,
      password || undefined
    );

    const payload = JSON.stringify(envelope);
    const result = await API.store(idHash, payload, ttl, oneTime);

    if (!result.ok) {
      // Preserva o rascunho: a tela de criação continua no DOM, apenas oculta.
      if (isRateLimit(result.status)) {
        renderErrorScreen("rateLimit", { onRetry: () => showScreen("create") });
      } else if (result.status === null) {
        renderErrorScreen("network", { onRetry: () => showScreen("create") });
      } else {
        renderErrorScreen("create", { onRetry: () => showScreen("create") });
      }
      showScreen("error");
      return;
    }

    const keyB64 = base64urlEncode(key);
    const baseUrl = `${window.location.origin}${window.location.pathname}`.replace(/\/$/, "");
    const linkFull = buildLink(baseUrl, rawIdB64, keyB64);
    const linkshort = `${baseUrl}#v1.${rawIdB64}`;

    clearCreateSensitiveInputs();
    renderCreatedScreen(linkFull, linkshort, keyB64, password, { ttl, oneTime, protection }, {
      onCopy: async (text) => {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          return false;
        }
      },
    });
    showScreen("created");
    announce(t("createdTitle"));
  } catch {
    renderErrorScreen("create", { onRetry: () => showScreen("create") });
    showScreen("error");
  } finally {
    key.fill(0);
  }
}

// ── Reveal Handler (step 1: fetch from server — consome o segredo) ──
// Após este ponto, o envelope e a senha automática (chave) ficam em memória (storedEnvelope/storedKeyBytes).
// Todas as retentativas de senha manual/automática usam esses dados locais.
async function handleReveal(
  fragment: FragmentParts
): Promise<void> {
  // Se já temos dados armazenados de uma tentativa anterior (ex.: usuário
  // digitou senha automática errada e está tentando de novo), usa os dados locais.
  if (hasStoredData()) {
    await tryDecryptWithStoredData();
    return;
  }

  // Primeira tentativa: buscar do servidor — consome o segredo se oneTime=true
  const rawIdBytes = base64urlDecode(fragment.rawId);
  const digest = await crypto.subtle.digest("SHA-256", rawIdBytes);
  const idHash = base64urlEncode(new Uint8Array(digest));

  // IMPORTANTE: o fetch vem ANTES da validação da senha automática.
  // Para oneTime=true, o segredo é consumido no primeiro fetch, independentemente
  // do formato ou valor da senha automática. Isso garante que fechar o navegador após
  // qualquer tentativa invalida o link — o segredo já foi removido do servidor.
  const fetchResult = await API.fetchPayload(idHash);

  if (!fetchResult.ok) {
    if (isRateLimit(fetchResult.status)) {
      // 429 acontece antes do consumo; o retry é seguro e usa o fragmento em memória.
      renderErrorScreen("rateLimit", {
        onRetry: () => {
          showScreen("reveal");
          showLoading();
          void handleReveal(fragment).finally(() => hideLoading());
        },
      });
    } else if (fetchResult.status === 404) {
      renderUnavailableScreen();
      showScreen("unavailable");
    } else {
      // Em falha de transporte, a resposta pode ter sido perdida após o consumo.
      // Não repetir automaticamente é uma decisão de segurança documentada.
      renderErrorScreen("fetch");
    }
    showScreen("error");
    return;
  }

  let envelope: Envelope;
  try {
    envelope = JSON.parse(fetchResult.payload) as Envelope;
  } catch {
    renderUnavailableScreen();
    showScreen("unavailable");
    return;
  }

  // Valida formato da senha automática (só para UX — o fetch já consumiu o segredo).
  const keyStr = fragment.key;
  if (!keyStr || keyStr.length !== 43) {
    storeForRetry(envelope, new Uint8Array(32)); // placeholder
    renderKeyPrompt((key) => handleKeyAttempt(key), secretOneTime);
    return;
  }
  let keyBytes: Uint8Array<ArrayBuffer>;
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

// ── Armazena envelope + senha automática para retry ──────────
function storeForRetry(envelope: Envelope, keyBytes: Uint8Array<ArrayBuffer>): void {
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

// ── Tentativa com senha automática digitada pelo usuário ─────
async function handleKeyAttempt(keyInput: string): Promise<void> {
  if (!keyInput || !hasStoredData()) return;

  let newKeyBytes: Uint8Array<ArrayBuffer>;
  try {
    newKeyBytes = base64urlDecode(keyInput);
  } catch {
    renderKeyPrompt((key) => handleKeyAttempt(key), secretOneTime, t("revealKeyError"));
    return;
  }

  storedKeyBytes!.fill(0);
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
  clearRevealSensitiveInputs();
  renderRevealedScreen(secret, secretOneTime, secretExpiresAt, {
    onCopy: async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    },
  });
  showScreen("revealed");
  announce(t("revealedTitle"));
  clearStoredData();
}

// ── Boot ────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  void main().catch(() => {
    hideLoading();
    clearStoredData();
    clearCreateSensitiveInputs();
    clearRevealSensitiveInputs();
    renderUnavailableScreen();
    showScreen("unavailable");
  });
});

let allowLeave = false;

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const screen = getCurrentScreen();
  if (screen !== "reveal" && screen !== "revealed") return;

  const postFetchOneTime = screen === "reveal"
    && secretOneTime
    && document.getElementById("revealTitle")?.textContent === t("revealPostFetchTitle");
  if (postFetchOneTime) {
    if (!window.confirm(t("leaveLostAccessConfirm"))) return;
    allowLeave = true;
  }
  window.location.href = "/";
});

// Alerta ao sair da tela Criado (única cópia de link/senha automática/senha manual) e do segredo revelado.
window.addEventListener("beforeunload", (e) => {
  if (allowLeave) return;
  const createdVisible = getCurrentScreen() === "created";
  const revealPostFetchOneTime = secretOneTime
    && hasStoredData()
    && getCurrentScreen() === "reveal";
  const revealedOneTime = secretOneTime && document.getElementById("revealedSecretText") !== null;
  if (createdVisible || revealPostFetchOneTime || revealedOneTime) {
    e.preventDefault();
    e.returnValue = "";
  }
});

window.addEventListener("click", (e) => {
  const target = (e.target as HTMLElement).closest(".js-create-new");
  if (!target) return;
  if (!window.confirm(t("createdLeaveConfirm"))) {
    e.preventDefault();
    return;
  }
  allowLeave = true;
});

window.addEventListener("pagehide", () => {
  stopCountdownTimer();
  clearStoredData();
  clearRevealSensitiveInputs();
});
