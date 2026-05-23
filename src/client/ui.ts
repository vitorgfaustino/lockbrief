/**
 * LockBrief — UI Controller.
 * Manipulação do DOM. Segredos revelados usam textContent, nunca innerHTML.
 */

import { t } from "./i18n";

type Screen = "create" | "created" | "reveal" | "revealed" | "unavailable";
export type ProtectionMode = "key" | "password";

const screens: Record<Screen, HTMLElement | null> = {
  create: null,
  created: null,
  reveal: null,
  revealed: null,
  unavailable: null,
};

let currentScreen: Screen = "create";

type IconName =
  | "arrowLeft"
  | "check"
  | "clock"
  | "copy"
  | "eye"
  | "fileLock"
  | "home"
  | "key"
  | "lock"
  | "plus"
  | "refresh"
  | "shield"
  | "triangle";

function icon(name: IconName, className = "icon btn-icon"): string {
  const paths: Record<IconName, string> = {
    arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/>',
    fileLock: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><rect x="8.5" y="13" width="7" height="5" rx="1"/><path d="M10 13v-1a2 2 0 1 1 4 0v1"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    key: '<circle cx="7.5" cy="14.5" r="3.5"/><path d="M10 12 21 1"/><path d="m16 6 2 2"/><path d="m19 3 2 2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.3"/><path d="M3 12A9 9 0 0 1 18.5 5.7"/><path d="M18 2v4h4"/><path d="M6 22v-4H2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M9 12l2 2 4-5"/>',
    triangle: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  };

  return `<svg class="${className}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

// ── Initialization ─────────────────────────────────────────────
export function initUI(): void {
  createShell();
  cacheScreens();
  showScreen("create");
}

function createShell(): void {
  const main = document.getElementById("appMain")!;
  main.innerHTML = `
    <div class="main-inner">
      <div class="content-column" id="contentColumn">
        <section class="screen" id="screenCreate" hidden></section>
        <section class="screen" id="screenCreated" hidden></section>
        <section class="screen" id="screenReveal" hidden></section>
        <section class="screen" id="screenRevealed" hidden></section>
        <section class="screen" id="screenUnavailable" hidden></section>
        <div class="loading-overlay" id="loadingOverlay" hidden>
          <div class="loading-content">
            <svg class="spinner spinner-large" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
              <circle class="spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/>
              <circle class="spinner-head" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/>
            </svg>
            <p class="loading-text">${t("loadingText")}</p>
          </div>
        </div>
      </div>
      <aside class="info-column">${buildInfoPanel()}</aside>
    </div>
  `;
}

function buildInfoPanel(): string {
  return `
    <div class="info-panel">
      <h2 class="info-title">Como funciona</h2>
      <ul class="info-list">
        <li class="info-item"><span class="info-flat-icon">${icon("lock", "icon")}</span><div><strong>Criptografia local</strong><p>O segredo é criptografado no navegador antes de enviar.</p></div></li>
        <li class="info-item"><span class="info-flat-icon">${icon("key", "icon")}</span><div><strong>Chave no fragmento</strong><p>A chave fica no link ou em campo separado, nunca no servidor.</p></div></li>
        <li class="info-item"><span class="info-flat-icon">${icon("fileLock", "icon")}</span><div><strong>Leitura controlada</strong><p>Escolha destruir após a primeira leitura ou manter até expirar.</p></div></li>
        <li class="info-item"><span class="info-flat-icon">${icon("clock", "icon")}</span><div><strong>Expiração automática</strong><p>Segredos expirados são removidos permanentemente.</p></div></li>
        <li class="info-item"><span class="info-flat-icon">${icon("shield", "icon")}</span><div><strong>Sem rastreamento</strong><p>Sem contas, cookies, analytics ou logs de conteúdo.</p></div></li>
      </ul>
      <div class="info-divider"></div>
      <div class="info-technical">
        <h3 class="info-subtitle">Chave e senha</h3>
        <ul class="tech-list">
          <li><strong>Chave</strong> — automática, 256 bits, incluída no link. Sem ela não é possível descriptografar.</li>
          <li><strong>Senha</strong> — definida por você no momento da criação. Camada extra de proteção. O servidor nunca a recebe.</li>
        </ul>
      </div>
      <div class="info-divider"></div>
      <div class="info-technical">
        <h3 class="info-subtitle">Tecnologia</h3>
        <ul class="tech-list">
          <li>AES-GCM-256 no navegador</li>
          <li>Fragmento de URL (#) para chave</li>
          <li>Expiração configurável</li>
          <li>Sem dependências externas</li>
        </ul>
      </div>
    </div>`;
}

function cacheScreens(): void {
  screens.create = document.getElementById("screenCreate")!;
  screens.created = document.getElementById("screenCreated")!;
  screens.reveal = document.getElementById("screenReveal")!;
  screens.revealed = document.getElementById("screenRevealed")!;
  screens.unavailable = document.getElementById("screenUnavailable")!;
}

// ── Screen Management ──────────────────────────────────────────
export function showScreen(name: Screen): void {
  Object.values(screens).forEach(s => s && (s.hidden = true));
  const el = screens[name];
  if (el) {
    el.hidden = false;
    currentScreen = name;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function getCurrentScreen(): Screen {
  return currentScreen;
}

// ── Loading Overlay ────────────────────────────────────────────
export function showLoading(): void {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.hidden = false;
}

export function hideLoading(): void {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.hidden = true;
}

// ── Create Screen ──────────────────────────────────────────────
export interface CreateScreenCallbacks {
  onSubmit: (data: {
    secret: string;
    ttl: number;
    password: string;
    oneTime: boolean;
    protection: ProtectionMode;
  }) => void;
}

export function renderCreateScreen(callbacks: CreateScreenCallbacks): void {
  const el = screens.create!;
  el.innerHTML = `
    <div class="card card-create">
      <h1 class="card-title">${t("createTitle")}</h1>
      <form id="createForm" novalidate>
        <div class="form-section">
          <h2 class="form-section-title">${t("createSectionMessage")}</h2>
          <div class="form-group">
            <textarea id="secretInput" class="form-textarea" rows="6" maxlength="65536"
              placeholder="${t("secretPlaceholder")}" aria-label="${t("secretLabel")}" translate="no" spellcheck="false" autocomplete="off"></textarea>
            <div class="textarea-meta">
              <span id="charCount" class="char-count">0 ${t("charsCounter")}</span>
              <span class="form-hint">${t("secretHint")}</span>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h2 class="form-section-title">${t("createSectionProtection")}</h2>
          <div class="segmented-control protection-control" role="radiogroup" id="protectionControl">
            <button type="button" class="segment-btn active" data-value="key" role="radio" aria-checked="true">${t("protectionKeyLabel")}</button>
            <button type="button" class="segment-btn" data-value="password" role="radio" aria-checked="false">${t("protectionPasswordLabel")}</button>
          </div>
          <input type="hidden" id="protectionValue" value="key">
          <p class="form-hint" id="protectionHint">${t("protectionKeyHint")}</p>
          <div class="form-group password-mode-group" id="passwordModeGroup" hidden>
            <label for="passwordInput" class="form-label">${t("passwordLabel")}</label>
            <div class="password-input-row">
              <input type="text" id="passwordInput" class="form-input" placeholder="${t("passwordPlaceholder")}" autocomplete="off" translate="no" spellcheck="false">
              <button type="button" class="btn btn-secondary btn-inline" id="generatePasswordBtn">${t("generatePasswordBtn")}</button>
            </div>
            <p class="form-hint hint-inline">${t("passwordHint")}</p>
          </div>
        </div>

        <div class="form-section">
          <h2 class="form-section-title">${t("createSectionExpiry")}</h2>
          <div class="segmented-control" role="radiogroup" id="ttlControl">
            <button type="button" class="segment-btn active" data-value="3600" role="radio" aria-checked="true">${t("expires1h")}</button>
            <button type="button" class="segment-btn" data-value="86400" role="radio" aria-checked="false">${t("expires1d")}</button>
            <button type="button" class="segment-btn" data-value="604800" role="radio" aria-checked="false">${t("expires1w")}</button>
          </div>
          <input type="hidden" id="ttlValue" value="3600">
        </div>

        <div class="form-section">
          <h2 class="form-section-title">${t("createSectionRead")}</h2>
          <div class="toggle-row">
            <label class="toggle-label">${t("oneTimeLabel")}</label>
            <button type="button" class="toggle-switch" id="oneTimeToggle" role="switch" aria-checked="true">
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </button>
          </div>
          <input type="hidden" id="oneTimeValue" value="true">
          <p class="read-mode-notice" id="multiReadNotice" hidden>${t("multiReadNotice")}</p>
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="createBtn">
          ${icon("lock")}
          <span class="btn-text">${t("createCta")}</span>
          <span class="btn-spinner" hidden>
            <svg class="spinner" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle class="spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/>
              <circle class="spinner-head" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/>
            </svg>
          </span>
        </button>
      </form>
    </div>`;

  // Wire events
  wireCreateEvents(callbacks);
}

function wireCreateEvents(callbacks: CreateScreenCallbacks): void {
  const form = document.getElementById("createForm") as HTMLFormElement;
  const secretInput = document.getElementById("secretInput") as HTMLTextAreaElement;
  const charCount = document.getElementById("charCount")!;
  const createBtn = document.getElementById("createBtn") as HTMLButtonElement;
  const oneTimeToggle = document.getElementById("oneTimeToggle") as HTMLButtonElement;
  const oneTimeValue = document.getElementById("oneTimeValue") as HTMLInputElement;
  const ttlValue = document.getElementById("ttlValue") as HTMLInputElement;
  const protectionValue = document.getElementById("protectionValue") as HTMLInputElement;
  const protectionHint = document.getElementById("protectionHint")!;
  const multiReadNotice = document.getElementById("multiReadNotice")!;
  const passwordGroup = document.getElementById("passwordModeGroup")!;
  const passwordInput = document.getElementById("passwordInput") as HTMLInputElement;
  const generatePasswordBtn = document.getElementById("generatePasswordBtn") as HTMLButtonElement;

  // Char counter
  secretInput.addEventListener("input", () => {
    const len = secretInput.value.length;
    charCount.textContent = `${len.toLocaleString("pt-BR")} ${t("charsCounter")}`;
  });

  wireSegmentedControl(document.getElementById("ttlControl")!, ttlValue);
  wireSegmentedControl(document.getElementById("protectionControl")!, protectionValue, (value) => {
    const mode = value as ProtectionMode;
    const passwordMode = mode === "password";
    passwordGroup.hidden = !passwordMode;
    protectionHint.textContent = passwordMode ? t("protectionPasswordHint") : t("protectionKeyHint");
    if (passwordMode && !passwordInput.value) {
      passwordInput.value = generateHumanPassword();
    }
  });

  generatePasswordBtn.addEventListener("click", () => {
    passwordInput.value = generateHumanPassword();
    passwordInput.focus();
    passwordInput.select();
  });

  function wireSegmentedControl(container: HTMLElement, hiddenInput: HTMLInputElement, onChange?: (value: string) => void): void {
    container.querySelectorAll(".segment-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".segment-btn").forEach(b => {
          b.classList.remove("active");
          b.setAttribute("aria-checked", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-checked", "true");
        const value = (btn as HTMLButtonElement).dataset.value!;
        hiddenInput.value = value;
        if (onChange) onChange(value);
      });
    });
  }

  // One-time toggle
  oneTimeToggle.addEventListener("click", () => {
    const checked = oneTimeToggle.getAttribute("aria-checked") === "true";
    oneTimeToggle.setAttribute("aria-checked", (!checked).toString());
    oneTimeValue.value = (!checked).toString();
    multiReadNotice.hidden = oneTimeValue.value === "true";
  });

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const secret = secretInput.value;
    if (!secret.trim()) { secretInput.focus(); return; }

    createBtn.classList.add("is-loading");
    createBtn.disabled = true;
    createBtn.querySelector(".btn-spinner")!.hidden = false;

    const protection = protectionValue.value as ProtectionMode;
    if (protection === "password" && !passwordInput.value.trim()) {
      passwordInput.value = generateHumanPassword();
    }

    await callbacks.onSubmit({
      secret,
      ttl: parseInt(ttlValue.value, 10),
      password: protection === "password" ? passwordInput.value.trim() : "",
      oneTime: oneTimeValue.value === "true",
      protection,
    });

    createBtn.classList.remove("is-loading");
    createBtn.disabled = false;
    createBtn.querySelector(".btn-spinner")!.hidden = true;
  });
}

// ── Created Screen ──────────────────────────────────────────────
export interface CreatedScreenCallbacks {
  onCopy: (text: string) => void;
}

export function renderCreatedScreen(
  linkFull: string,
  linkshort: string,
  key: string,
  password: string,
  config: { ttl: number; oneTime: boolean; protection: ProtectionMode },
  callbacks: CreatedScreenCallbacks
): void {
  const el = screens.created!;
  const hasPassword = password.length > 0;
  const summary = resultSummary(config);

  if (hasPassword) {
    el.innerHTML = `
      <div class="card">
        <h1 class="card-title">${t("createdTitle")}</h1>
        <p class="card-subtitle">${t("createdSubtitlePwd")}</p>
        ${summary}
        ${linkCard(linkFull, t("fullLinkLabel"), t("fullLinkDescPwd"), "linkCopy", "linkInput")}
        ${linkCard(password, t("passwordResultLabel"), t("passwordResultDesc"), "pwdCopy", "pwdInput")}
        <div class="result-actions">
          <a href="/" class="btn btn-secondary btn-full">${icon("plus")}${t("createNewBtn")}</a>
        </div>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="card">
        <h1 class="card-title">${t("createdTitle")}</h1>
        <p class="card-subtitle">${t("createdSubtitle")}</p>
        ${summary}
        ${linkCard(linkFull, t("fullLinkLabel"), t("fullLinkDesc"), "fullCopy", "fullInput")}
        ${linkCard(linkshort, t("shortLinkLabel"), t("shortLinkDesc"), "shortCopy", "shortInput")}
        ${linkCard(key, t("keyLabel"), t("keyDesc"), "keyCopy", "keyInput")}
        <div class="result-actions">
          <a href="/" class="btn btn-secondary btn-full">${icon("plus")}${t("createNewBtn")}</a>
        </div>
      </div>`;
  }

  // Wire copy buttons
  setCopyHandler("fullCopy", "fullInput", callbacks);
  setCopyHandler("shortCopy", "shortInput", callbacks);
  setCopyHandler("keyCopy", "keyInput", callbacks);
  setCopyHandler("linkCopy", "linkInput", callbacks);
  setCopyHandler("pwdCopy", "pwdInput", callbacks);
}

function resultSummary(config: { ttl: number; oneTime: boolean; protection: ProtectionMode }): string {
  return `
    <div class="result-summary">
      <h2 class="result-summary-title">${t("resultSummaryTitle")}</h2>
      <dl class="result-summary-grid">
        <div>
          <dt>${t("summaryExpiresLabel")}</dt>
          <dd>${ttlLabel(config.ttl)}</dd>
        </div>
        <div>
          <dt>${t("summaryReadLabel")}</dt>
          <dd>${config.oneTime ? t("summaryOneTime") : t("summaryMultiRead")}</dd>
        </div>
        <div>
          <dt>${t("summaryProtectionLabel")}</dt>
          <dd>${config.protection === "password" ? t("summaryProtectionPassword") : t("summaryProtectionKey")}</dd>
        </div>
      </dl>
    </div>`;
}

function ttlLabel(ttl: number): string {
  if (ttl === 3600) return t("expires1h");
  if (ttl === 86400) return t("expires1d");
  if (ttl === 604800) return t("expires1w");
  return `${ttl}s`;
}

function linkCard(value: string, label: string, desc: string, copyId: string, inputId: string): string {
  const escapedValue = escapeHtml(value);
  const escapedLabel = escapeHtml(label);
  const multiline = value.length > 40;
  const valueField = multiline
    ? `<textarea id="${inputId}" class="form-textarea form-input-readonly link-output" readonly rows="3" aria-label="${escapedLabel}" translate="no" spellcheck="false">${escapedValue}</textarea>`
    : `<input type="text" id="${inputId}" class="form-input form-input-readonly link-output link-output-single" readonly value="${escapedValue}" aria-label="${escapedLabel}" translate="no" spellcheck="false">`;

  return `
    <div class="link-card-item">
      <div class="link-card-header">
        <h3 class="link-card-label">${escapedLabel}</h3>
      </div>
      <div class="link-card-body">
        <div class="copy-row">
          ${valueField}
          <button type="button" class="btn btn-ghost btn-copy" id="${copyId}" aria-label="Copiar ${escapedLabel}">
            ${icon("copy")}
            <span class="copy-label">${t("copyBtn")}</span>
          </button>
        </div>
        <p class="link-card-desc">${escapeHtml(desc)}</p>
      </div>
    </div>`;
}

function setCopyHandler(btnId: string, inputId: string, callbacks: CreatedScreenCallbacks): void {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener("click", () => {
    const field = document.getElementById(inputId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (field) {
      copyToClipboard(field.value, callbacks.onCopy);
      flashCopyButton(btn);
    }
  });
}

// ── Reveal Screen ──────────────────────────────────────────────
export interface RevealScreenCallbacks {
  onSubmit: () => void;
}

export function renderRevealScreen(
  needsKey: boolean,
  requiresPassword: boolean,
  oneTime: boolean,
  expiresAt: number,
  callbacks: RevealScreenCallbacks
): void {
  const el = screens.reveal!;
  const countdownHtml = oneTime ? "" : buildCountdown(expiresAt);
  const requirement = requiresPassword
    ? t("revealRequirementPassword")
    : needsKey
      ? t("revealRequirementKey")
      : t("revealRequirementReady");

  el.innerHTML = `
    <div class="card">
      <h1 class="card-title">${oneTime ? t("revealTitle") : t("revealMultiTitle")}</h1>
      <p class="card-subtitle">${oneTime ? t("revealSubtitle") : t("revealMultiSubtitle")}</p>
      ${oneTime ? `
      <div class="reveal-warning">
        ${icon("triangle", "icon")}
        <span>${t("revealWarning")}</span>
      </div>` : `
      <div class="countdown-badge" id="countdownBadge">
        ${icon("clock", "icon")}
        <span>${countdownHtml}</span>
      </div>`}
      <div class="reveal-requirement">
        ${icon(requiresPassword ? "lock" : needsKey ? "key" : "check", "icon")}
        <span>${requirement}</span>
      </div>
      <div id="revealKeyGroup" hidden>
        <div class="form-group">
          <label for="revealKeyInput" class="form-label">${t("revealKeyLabel")}</label>
          <input type="text" id="revealKeyInput" class="form-input" placeholder="Cole a chave recebida por outro canal" autocomplete="off">
          <p class="form-hint">${t("revealKeyHint")}</p>
          ${oneTime ? `
          <div class="validation-warning">
            ${icon("triangle", "icon")}
            <span>${t("revealKeyWarning")}</span>
          </div>` : ""}
          <div id="revealKeyError" hidden></div>
        </div>
      </div>
      <div id="revealExtraFields"></div>
      <button type="button" class="btn btn-primary btn-full" id="revealBtn">
        ${icon("eye")}
        <span class="btn-text">${t("revealBtn")}</span>
        <span class="btn-spinner" hidden>
          <svg class="spinner" viewBox="0 0 24 24" width="18" height="18"><circle class="spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/><circle class="spinner-head" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/></svg>
        </span>
      </button>
      <button type="button" class="btn btn-ghost btn-full" onclick="window.location.href='/'">${icon("arrowLeft")}${t("cancelBtn")}</button>
    </div>`;

  wireRevealButton(callbacks);

  // Live countdown for multi-read secrets
  if (!oneTime) {
    startCountdownTimer("countdownBadge", expiresAt);
  }
}

function wireRevealButton(callbacks: RevealScreenCallbacks): void {
  const btn = document.getElementById("revealBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.classList.add("is-loading");
    btn.disabled = true;
    btn.querySelector(".btn-spinner")!.hidden = false;
    await callbacks.onSubmit();
    btn.classList.remove("is-loading");
    btn.disabled = false;
    btn.querySelector(".btn-spinner")!.hidden = true;
  });
}

export function renderKeyPrompt(onSubmit: (keyInput: string) => void, oneTime: boolean, errorMessage?: string): void {
  const keyGroup = document.getElementById("revealKeyGroup");
  if (!keyGroup) return;
  const btn = document.getElementById("revealBtn");
  if (btn) btn.hidden = true;

  keyGroup.hidden = false;
  keyGroup.innerHTML = `
    <div class="form-group animate-fade-in">
      <label for="revealKeyInput" class="form-label">${t("revealKeyLabel")}</label>
      <input type="text" id="revealKeyInput" class="form-input ${errorMessage ? 'input-error' : ''}" placeholder="Cole a chave recebida por outro canal" autocomplete="off" translate="no" spellcheck="false">
      <p class="form-hint">${t("revealKeyHint")}</p>
      ${oneTime ? `
      <div class="validation-warning">
        ${icon("triangle", "icon")}
        <span>${t("revealKeyWarning")}</span>
      </div>` : ""}
      ${errorMessage ? `<div class="reveal-error">${escapeHtml(errorMessage)}</div>` : ""}
      <button type="button" class="btn ${errorMessage ? 'btn-destructive' : 'btn-primary'} btn-full mt-sm" id="retryRevealBtn">
        ${icon(errorMessage ? "refresh" : "key")}
        <span class="btn-text">${errorMessage ? t("revealKeyRetryBtn") : t("revealKeyBtn")}</span>
        <span class="btn-spinner" hidden>
          <svg class="spinner" viewBox="0 0 24 24" width="18" height="18"><circle class="spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/><circle class="spinner-head" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/></svg>
        </span>
      </button>
    </div>`;

  document.getElementById("retryRevealBtn")!.addEventListener("click", async () => {
    const retryBtn = document.getElementById("retryRevealBtn") as HTMLButtonElement;
    retryBtn.classList.add("is-loading");
    retryBtn.disabled = true;
    retryBtn.querySelector(".btn-spinner")!.hidden = false;
    const keyInput = (document.getElementById("revealKeyInput") as HTMLInputElement).value;
    await onSubmit(keyInput);
    retryBtn.classList.remove("is-loading");
    retryBtn.disabled = false;
    retryBtn.querySelector(".btn-spinner")!.hidden = true;
  });

  const keyInput = document.getElementById("revealKeyInput") as HTMLInputElement;
  keyInput.focus();
}

export function showRevealKeyError(message: string): void {
  // Show key input field if it was hidden (full link with wrong key)
  const keyGroup = document.getElementById("revealKeyGroup");
  if (keyGroup && keyGroup.hidden) {
    keyGroup.hidden = false;
  }

  const errorEl = document.getElementById("revealKeyError");
  if (errorEl) {
    errorEl.hidden = false;
    errorEl.className = "reveal-error animate-fade-in";
    errorEl.textContent = message;
  }
  const keyInput = document.getElementById("revealKeyInput") as HTMLInputElement;
  if (keyInput) {
    keyInput.classList.add("input-error");
    keyInput.focus();
    keyInput.select();
  }
  // Troca o botão para vermelho + "Tentar novamente".
  const btn = document.getElementById("revealBtn");
  if (btn) {
    btn.className = "btn btn-destructive btn-full";
    const textEl = btn.querySelector(".btn-text");
    if (textEl) textEl.textContent = t("revealKeyRetryBtn");
    // Garante que o botão está habilitado para retry.
    btn.classList.remove("is-loading");
    btn.disabled = false;
    const spinner = btn.querySelector(".btn-spinner");
    if (spinner) (spinner as HTMLElement).hidden = true;
  }
}

export function renderPasswordPrompt(onSubmit: (password: string) => void, oneTime: boolean, errorMessage?: string): void {
  const extra = document.getElementById("revealExtraFields");
  if (!extra) return;
  const isRetry = !!errorMessage;
  const btnClass = isRetry ? "btn-destructive" : "btn-primary";
  const btnLabel = isRetry ? t("revealPwdRetryBtn") : t("revealPwdBtn");
  extra.innerHTML = `
    <div class="form-group animate-fade-in">
      <label for="revealPwdInput" class="form-label">${t("revealPwdLabel")}</label>
      <input type="password" id="revealPwdInput" class="form-input ${isRetry ? 'input-error' : ''}" placeholder="Digite a senha adicional" autocomplete="off">
      <p class="form-hint">${t("revealPwdHint")}</p>
      ${oneTime ? `
      <div class="validation-warning">
        ${icon("triangle", "icon")}
        <span>${t("revealPwdWarning")}</span>
      </div>` : ""}
      ${errorMessage ? `<div class="reveal-error">${escapeHtml(errorMessage)}</div>` : ""}
      <button type="button" class="btn ${btnClass} btn-full mt-sm" id="retryRevealBtn">
        ${icon(isRetry ? "refresh" : "key")}
        <span class="btn-text">${btnLabel}</span>
        <span class="btn-spinner" hidden>
          <svg class="spinner" viewBox="0 0 24 24" width="18" height="18"><circle class="spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/><circle class="spinner-head" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/></svg>
        </span>
      </button>
    </div>`;

  document.getElementById("retryRevealBtn")!.addEventListener("click", async () => {
    const retryBtn = document.getElementById("retryRevealBtn") as HTMLButtonElement;
    retryBtn.classList.add("is-loading");
    retryBtn.disabled = true;
    retryBtn.querySelector(".btn-spinner")!.hidden = false;
    const password = (document.getElementById("revealPwdInput") as HTMLInputElement).value;
    await onSubmit(password);
    retryBtn.classList.remove("is-loading");
    retryBtn.disabled = false;
    retryBtn.querySelector(".btn-spinner")!.hidden = true;
  });

  const revealBtn = document.getElementById("revealBtn");
  if (revealBtn) revealBtn.hidden = true;
}

// ── Revealed Screen ────────────────────────────────────────────
export function renderRevealedScreen(secret: string, oneTime: boolean, expiresAt: number, callbacks: { onCopy: (text: string) => void }): void {
  const el = screens.revealed!;
  const countdownId = "revealedCountdown";

  el.innerHTML = `
    <div class="card">
      <h1 class="card-title">${t("revealedTitle")}</h1>
      <p class="card-subtitle">${oneTime ? t("revealedSubtitle") : "Este segredo pode ser acessado novamente até a expiração."}</p>

      ${!oneTime ? `
      <div class="countdown-badge" id="${countdownId}">
        ${icon("clock", "icon")}
        <span>${buildCountdown(expiresAt)}</span>
      </div>` : ""}

      <div class="secret-display">
        <label class="form-label">${t("secretContentLabel")}</label>
        <pre id="revealedSecretText" class="secret-text" role="region" tabindex="0" translate="no" spellcheck="false"></pre>
        <button type="button" class="btn btn-ghost btn-copy btn-copy-secret" id="copySecretBtn">
          ${icon("copy")}
          <span class="copy-label">${t("copyBtn")}</span>
        </button>
      </div>

      ${oneTime ? `
      <div class="result-notice notice-danger">
        ${icon("triangle", "icon")}
        <span>${t("revealedDanger")}</span>
      </div>` : ""}

      <div class="result-actions">
        <a href="/" class="btn btn-secondary btn-full">${icon("plus")}${t("createNewBtn")}</a>
      </div>
    </div>`;

  // Set secret via textContent (never innerHTML)
  document.getElementById("revealedSecretText")!.textContent = secret;

  document.getElementById("copySecretBtn")!.addEventListener("click", () => {
    copyToClipboard(secret, callbacks.onCopy);
  });

  // Live countdown para multi-read
  if (!oneTime) {
    startCountdownTimer(countdownId, expiresAt);
  }
}

// ── Unavailable Screen ─────────────────────────────────────────
export function renderUnavailableScreen(): void {
  const el = screens.unavailable!;
  el.innerHTML = `
    <div class="card unavailable-card">
      <div class="unavailable-header">
        <div class="unavailable-icon">
          ${icon("shield", "icon")}
        </div>
        <div>
          <h1 class="card-title">${t("unavailableTitle")}</h1>
          <p class="unavailable-text">${t("unavailableText")}</p>
        </div>
      </div>
      <div class="unavailable-reasons" aria-label="${t("unavailableReasonsTitle")}">
        <h2>${t("unavailableReasonsTitle")}</h2>
        <ul>
          <li>${icon("check", "icon")}<span>${t("unavailableReasonConsumed")}</span></li>
          <li>${icon("clock", "icon")}<span>${t("unavailableReasonExpired")}</span></li>
          <li>${icon("key", "icon")}<span>${t("unavailableReasonLink")}</span></li>
          <li>${icon("refresh", "icon")}<span>${t("unavailableReasonClosedAfterError")}</span></li>
        </ul>
      </div>
      <p class="unavailable-privacy">${t("unavailablePrivacyNote")}</p>
      <div class="result-actions">
        <a href="/" class="btn btn-secondary btn-full">${icon("home")}${t("backHomeBtn")}</a>
      </div>
    </div>`;
}

// ── Helpers ────────────────────────────────────────────────────
function buildCountdown(expiresAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = expiresAt - now;
  if (remaining <= 0) return "Expirado";

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) {
    return `Expira em ${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `Expira em ${hours}h ${minutes}min`;
  }
  return `Expira em ${minutes}min`;
}

function startCountdownTimer(elementId: string, expiresAt: number): void {
  const el = document.getElementById(elementId);
  if (!el) return;

  const span = el.querySelector("span");
  if (!span) return;

  const tick = () => {
    span.textContent = buildCountdown(expiresAt);
  };
  tick();
  setInterval(tick, 60000); // Atualiza a cada minuto
}

function copyToClipboard(text: string, onCopy: (text: string) => void): void {
  onCopy(text);
}

const HUMAN_PASSWORD_WORDS = [
  "alto", "arco", "azul", "barco", "bravo", "brisa", "campo", "canto",
  "carta", "cedro", "claro", "cobre", "coral", "delta", "duna", "eco",
  "faro", "firme", "flora", "fonte", "frase", "gelo", "grade", "honra",
  "ilha", "justo", "lago", "lima", "linha", "livro", "luz", "mapa",
  "marco", "medio", "metal", "metro", "monte", "mural", "nobre", "norte",
  "nuvem", "oliva", "onda", "ordem", "ouro", "pacto", "pedra", "plano",
  "ponte", "porto", "prata", "ponto", "raio", "ramo", "rastro", "rede",
  "rio", "rocha", "rota", "sinal", "solar", "sopro", "terra", "traco",
  "trilha", "uniao", "vale", "vento", "verde", "vila", "vivo", "zona",
] as const;

function generateHumanPassword(): string {
  const words: string[] = [];
  for (let i = 0; i < 5; i++) {
    words.push(HUMAN_PASSWORD_WORDS[randomIndex(HUMAN_PASSWORD_WORDS.length)]);
  }
  const suffix = randomIndex(100).toString().padStart(2, "0");
  return `${words.join("-")}-${suffix}`;
}

function randomIndex(maxExclusive: number): number {
  const range = 0x100000000;
  const limit = range - (range % maxExclusive);
  const value = new Uint32Array(1);

  do {
    crypto.getRandomValues(value);
  } while (value[0] >= limit);

  return value[0] % maxExclusive;
}

export function flashCopyButton(btn: HTMLElement): void {
  btn.classList.add("copied");
  const label = btn.querySelector(".copy-label");
  if (label) label.textContent = t("copiedBtn");
  setTimeout(() => {
    btn.classList.remove("copied");
    if (label) label.textContent = t("copyBtn");
  }, 2000);
}

function escapeHtml(str: string): string {
  // Seguro para conteudo de elemento. Nao usar para montar atributos dinamicos.
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getBaseUrl(): string {
  return `${window.location.origin}${window.location.pathname}`.replace(/\/$/, "");
}
