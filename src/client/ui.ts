/**
 * LockBrief — UI Controller.
 * Manipulação do DOM. Segredos revelados usam textContent, nunca innerHTML.
 */

import { t } from "./i18n";

type Screen = "create" | "created" | "reveal" | "revealed" | "unavailable" | "error";
export type ProtectionMode = "key" | "password";

const screens: Record<Screen, HTMLElement | null> = {
  create: null,
  created: null,
  reveal: null,
  revealed: null,
  unavailable: null,
  error: null,
};

let currentScreen: Screen = "create";

type IconName =
  | "arrowLeft"
  | "check"
  | "clock"
  | "copy"
  | "eye"
  | "eyeOff"
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
    eyeOff: '<path d="m3 3 18 18"/><path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a18.4 18.4 0 0 1-2.2 2.8"/><path d="M6.6 6.6C4 8.3 2 12 2 12s3.5 6 10 6c1.7 0 3.2-.4 4.5-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
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
  window.addEventListener("resize", autoSizeLinkFields);
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
        <section class="screen" id="screenError" hidden></section>
        <div id="liveStatus" class="sr-only" role="status" aria-live="polite"></div>
        <div class="loading-overlay" id="loadingOverlay" role="status" aria-live="polite" hidden>
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
        <li class="info-item"><span class="info-flat-icon">${icon("key", "icon")}</span><div><strong>Senha automática no fragmento</strong><p>A senha automática fica no link ou em campo separado, nunca no servidor.</p></div></li>
        <li class="info-item"><span class="info-flat-icon">${icon("fileLock", "icon")}</span><div><strong>Leitura controlada</strong><p>Escolha destruir após a primeira leitura ou manter até expirar.</p></div></li>
        <li class="info-item"><span class="info-flat-icon">${icon("clock", "icon")}</span><div><strong>Expiração automática</strong><p>Segredos expirados deixam de ficar disponíveis no banco ativo.</p></div></li>
        <li class="info-item"><span class="info-flat-icon">${icon("shield", "icon")}</span><div><strong>Sem contas ou cookies</strong><p>Sem contas, cookies, analytics ou logs de conteúdo.</p></div></li>
      </ul>
      <div class="info-divider"></div>
      <div class="info-technical">
        <h3 class="info-subtitle">Senhas</h3>
        <ul class="tech-list">
          <li><strong>Senha automática:</strong> 256 bits, incluída no link. Sem ela não é possível descriptografar.</li>
          <li><strong>Senha manual:</strong> definida por você no momento da criação. Camada extra de proteção. O servidor nunca a recebe.</li>
        </ul>
      </div>
      <div class="info-divider"></div>
      <div class="info-technical">
        <h3 class="info-subtitle">Tecnologia</h3>
        <ul class="tech-list">
          <li>AES-GCM-256 no navegador</li>
          <li>Fragmento de URL (#) para senha automática</li>
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
  screens.error = document.getElementById("screenError")!;
}

// ── Screen Management ──────────────────────────────────────────
export function showScreen(name: Screen): void {
  Object.values(screens).forEach(s => s && (s.hidden = true));
  const el = screens[name];
  if (el) {
    el.hidden = false;
    currentScreen = name;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    focusScreenHeading(name);
    if (name === "created") requestAnimationFrame(autoSizeLinkFields);
  }
}

export function getCurrentScreen(): Screen {
  return currentScreen;
}

function focusScreenHeading(name: Screen): void {
  const el = screens[name];
  const heading = el?.querySelector<HTMLElement>("h1");
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

export function announce(message: string): void {
  const live = document.getElementById("liveStatus");
  if (!live) return;
  live.textContent = "";
  window.setTimeout(() => {
    live.textContent = message;
  }, 30);
}

// ── Loading Overlay ────────────────────────────────────────────
export function showLoading(): void {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.hidden = false;
  document.getElementById("appMain")?.setAttribute("aria-busy", "true");
}

export function hideLoading(): void {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.hidden = true;
  document.getElementById("appMain")?.removeAttribute("aria-busy");
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
          <h2 class="form-section-title" id="createMessageTitle">${t("createSectionMessage")}</h2>
          <div class="form-group">
            <textarea id="secretInput" class="form-textarea" rows="6" maxlength="65536"
              placeholder="${t("secretPlaceholder")}" aria-labelledby="createMessageTitle"
              aria-describedby="secretHint secretError" aria-errormessage="secretError"
              translate="no" spellcheck="false" autocomplete="off"></textarea>
            <div class="textarea-meta">
              <span id="charCount" class="char-count">0 / 65.536 ${t("charsCounter")}</span>
              <span class="form-hint" id="secretHint">${t("secretHint")}</span>
            </div>
            <p id="secretError" class="field-error" role="alert" hidden></p>
          </div>
        </div>

        <div class="form-section">
          <h2 class="form-section-title" id="createProtectionTitle">${t("createSectionProtection")}</h2>
          <div class="segmented-control protection-control" role="radiogroup" id="protectionControl" aria-labelledby="createProtectionTitle">
            <button type="button" class="segment-btn active" data-value="key" role="radio" aria-checked="true" tabindex="0">${t("protectionKeyLabel")}</button>
            <button type="button" class="segment-btn" data-value="password" role="radio" aria-checked="false" tabindex="-1">${t("protectionPasswordLabel")}</button>
          </div>
          <input type="hidden" id="protectionValue" value="key">
          <p class="form-hint" id="protectionHint">${t("protectionKeyHint")}</p>
          <div class="form-group password-mode-group" id="passwordModeGroup" hidden>
            <label for="passwordInput" class="form-label">${t("passwordLabel")}</label>
            <div class="password-input-row">
              <input type="text" id="passwordInput" class="form-input" placeholder="${t("passwordPlaceholder")}"
                aria-describedby="passwordHint passwordError" aria-errormessage="passwordError"
                autocomplete="off" translate="no" spellcheck="false">
              <button type="button" class="btn btn-secondary btn-inline" id="generatePasswordBtn">${t("generatePasswordBtn")}</button>
            </div>
            <p class="form-hint hint-inline" id="passwordHint">${t("passwordHint")}</p>
            <p id="passwordError" class="field-error" role="alert" hidden></p>
          </div>
        </div>

        <div class="form-section">
          <h2 class="form-section-title" id="createExpiryTitle">${t("createSectionExpiry")}</h2>
          <div class="segmented-control" role="radiogroup" id="ttlControl" aria-labelledby="createExpiryTitle">
            <button type="button" class="segment-btn active" data-value="3600" role="radio" aria-checked="true" tabindex="0">${t("expires1h")}</button>
            <button type="button" class="segment-btn" data-value="86400" role="radio" aria-checked="false" tabindex="-1">${t("expires1d")}</button>
            <button type="button" class="segment-btn" data-value="604800" role="radio" aria-checked="false" tabindex="-1">${t("expires1w")}</button>
          </div>
          <input type="hidden" id="ttlValue" value="3600">
        </div>

        <div class="form-section">
          <h2 class="form-section-title">${t("createSectionRead")}</h2>
          <div class="toggle-row">
            <span class="toggle-label" id="oneTimeLabel">${t("oneTimeLabel")}</span>
            <button type="button" class="toggle-switch" id="oneTimeToggle" role="switch"
              aria-checked="true" aria-labelledby="oneTimeLabel" aria-describedby="multiReadNotice">
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
  focusScreenHeading("create");
}

function wireCreateEvents(callbacks: CreateScreenCallbacks): void {
  const form = document.getElementById("createForm") as HTMLFormElement;
  const secretInput = document.getElementById("secretInput") as HTMLTextAreaElement;
  const secretError = document.getElementById("secretError") as HTMLElement;
  const charCount = document.getElementById("charCount")!;
  const createBtn = document.getElementById("createBtn") as HTMLButtonElement;
  const oneTimeToggle = document.getElementById("oneTimeToggle") as HTMLButtonElement;
  const oneTimeLabel = document.getElementById("oneTimeLabel") as HTMLElement;
  const oneTimeValue = document.getElementById("oneTimeValue") as HTMLInputElement;
  const ttlValue = document.getElementById("ttlValue") as HTMLInputElement;
  const protectionValue = document.getElementById("protectionValue") as HTMLInputElement;
  const protectionHint = document.getElementById("protectionHint")!;
  const multiReadNotice = document.getElementById("multiReadNotice")!;
  const passwordGroup = document.getElementById("passwordModeGroup")!;
  const passwordInput = document.getElementById("passwordInput") as HTMLInputElement;
  const passwordError = document.getElementById("passwordError") as HTMLElement;
  const generatePasswordBtn = document.getElementById("generatePasswordBtn") as HTMLButtonElement;

  const updateCounter = (): void => {
    charCount.textContent = formatByteCounter(byteLength(secretInput.value));
  };

  // Char counter (bytes UTF-8, matching the server-side limit)
  secretInput.addEventListener("input", () => {
    secretInput.setCustomValidity("");
    updateCounter();
    if (byteLength(secretInput.value) > 65536) {
      setFieldError(secretInput, secretError, t("secretTooLong"));
    } else {
      setFieldError(secretInput, secretError, null);
    }
  });

  passwordInput.addEventListener("input", () => {
    setFieldError(passwordInput, passwordError, null);
  });

  wireSegmentedControl(document.getElementById("ttlControl")!, ttlValue);
  wireSegmentedControl(document.getElementById("protectionControl")!, protectionValue, (value) => {
    const mode = value as ProtectionMode;
    const passwordMode = mode === "password";
    passwordGroup.hidden = !passwordMode;
    protectionHint.textContent = passwordMode ? t("protectionPasswordHint") : t("protectionKeyHint");
  });

  generatePasswordBtn.addEventListener("click", () => {
    passwordInput.value = generateHumanPassword();
    setFieldError(passwordInput, passwordError, null);
    passwordInput.focus();
    passwordInput.select();
    announce(t("passwordGenerated"));
  });

  function wireSegmentedControl(container: HTMLElement, hiddenInput: HTMLInputElement, onChange?: (value: string) => void): void {
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>(".segment-btn"));
    if (buttons.length === 0) return;

    const select = (button: HTMLButtonElement, moveFocus: boolean): void => {
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-checked", active.toString());
        item.tabIndex = active ? 0 : -1;
      });
      const value = button.dataset.value!;
      hiddenInput.value = value;
      if (moveFocus) button.focus();
      if (onChange) onChange(value);
    };

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => select(button, false));
      button.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextIndex = (index + 1) % buttons.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextIndex = (index - 1 + buttons.length) % buttons.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = buttons.length - 1;
        } else if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          select(button, true);
          return;
        } else {
          return;
        }
        event.preventDefault();
        select(buttons[nextIndex], true);
      });
    });

    const initial = buttons.find((button) => button.classList.contains("active")) || buttons[0];
    select(initial, false);
  }

  // One-time toggle: the text label is a real affordance, not decoration.
  oneTimeLabel.addEventListener("click", () => oneTimeToggle.click());
  oneTimeToggle.addEventListener("click", () => {
    const checked = oneTimeToggle.getAttribute("aria-checked") === "true";
    oneTimeToggle.setAttribute("aria-checked", (!checked).toString());
    oneTimeValue.value = (!checked).toString();
    multiReadNotice.hidden = oneTimeValue.value === "true";
    announce(oneTimeValue.value === "true" ? t("oneTimeOn") : t("oneTimeOff"));
  });

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const secret = secretInput.value;
    setFieldError(secretInput, secretError, null);

    if (!secret.trim()) {
      setFieldError(secretInput, secretError, t("secretRequired"));
      secretInput.focus();
      return;
    }
    if (byteLength(secret) > 65536) {
      setFieldError(secretInput, secretError, t("secretTooLong"));
      secretInput.focus();
      return;
    }

    const protection = protectionValue.value as ProtectionMode;
    if (protection === "password" && !passwordInput.value.trim()) {
      setFieldError(passwordInput, passwordError, t("passwordRequired"));
      passwordInput.focus();
      return;
    }
    if (createBtn.disabled) return;

    createBtn.classList.add("is-loading");
    createBtn.disabled = true;
    createBtn.setAttribute("aria-busy", "true");
    createBtn.querySelector<HTMLElement>(".btn-spinner")!.hidden = false;
    announce(t("loadingText"));

    try {
      await callbacks.onSubmit({
        secret,
        ttl: parseInt(ttlValue.value, 10),
        password: protection === "password" ? passwordInput.value.trim() : "",
        oneTime: oneTimeValue.value === "true",
        protection,
      });
    } finally {
      createBtn.classList.remove("is-loading");
      createBtn.disabled = false;
      createBtn.removeAttribute("aria-busy");
      createBtn.querySelector<HTMLElement>(".btn-spinner")!.hidden = true;
    }
  });
}

// ── Created Screen ──────────────────────────────────────────────
export interface CreatedScreenCallbacks {
  onCopy: (text: string) => Promise<boolean>;
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
        <div class="result-notice notice-warning">
          ${icon("triangle", "icon")}
          <span>${t("createdWarning")}</span>
        </div>
        ${linkCard(linkFull, t("fullLinkLabel"), t("fullLinkDescPwd"), "linkCopy", "linkInput", true)}
        ${linkCard(password, t("passwordResultLabel"), t("passwordResultDesc"), "pwdCopy", "pwdInput")}
        <div class="result-actions">
          <a href="/" class="btn btn-secondary btn-full js-create-new">${icon("plus")}${t("createNewBtn")}</a>
        </div>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="card">
        <h1 class="card-title">${t("createdTitle")}</h1>
        <p class="card-subtitle">${t("createdSubtitle")}</p>
        ${summary}
        <div class="result-notice notice-warning">
          ${icon("triangle", "icon")}
          <span>${t("createdWarning")}</span>
        </div>
        ${linkCard(linkFull, t("fullLinkLabel"), t("fullLinkDesc"), "fullCopy", "fullInput", true)}
        ${linkCard(linkshort, t("shortLinkLabel"), t("shortLinkDesc"), "shortCopy", "shortInput")}
        ${linkCard(key, t("keyLabel"), t("keyDesc"), "keyCopy", "keyInput")}
        <div class="result-actions">
          <a href="/" class="btn btn-secondary btn-full js-create-new">${icon("plus")}${t("createNewBtn")}</a>
        </div>
      </div>`;
  }

  // Wire copy buttons
  setCopyHandler("fullCopy", "fullInput", callbacks);
  setCopyHandler("shortCopy", "shortInput", callbacks);
  setCopyHandler("keyCopy", "keyInput", callbacks);
  setCopyHandler("linkCopy", "linkInput", callbacks);
  setCopyHandler("pwdCopy", "pwdInput", callbacks);
  requestAnimationFrame(autoSizeLinkFields);
  focusScreenHeading("created");
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

function linkCard(
  value: string,
  label: string,
  desc: string,
  copyId: string,
  inputId: string,
  recommended = false
): string {
  const escapedValue = escapeHtml(value);
  const escapedLabel = escapeHtml(label);
  const multiline = value.length > 40;
  const valueField = multiline
    ? `<textarea id="${inputId}" class="form-textarea form-input-readonly link-output" readonly rows="3" aria-label="${escapedLabel}" translate="no" spellcheck="false">${escapedValue}</textarea>`
    : `<input type="text" id="${inputId}" class="form-input form-input-readonly link-output link-output-single" readonly value="${escapedValue}" aria-label="${escapedLabel}" translate="no" spellcheck="false">`;
  const badge = recommended
    ? `<span class="link-card-badge">${t("recommendedBadge")}</span>`
    : "";

  return `
    <div class="link-card-item">
      <div class="link-card-header">
        <h3 class="link-card-label">${escapedLabel}${badge}</h3>
      </div>
      <button type="button" class="btn btn-ghost btn-copy" id="${copyId}" aria-label="Copiar ${escapedLabel}">
        ${icon("copy")}
        <span class="copy-label">${t("copyBtn")}</span>
      </button>
      <div class="copy-row">
        ${valueField}
      </div>
      <p class="link-card-desc">${escapeHtml(desc)}</p>
    </div>`;
}

function setCopyHandler(btnId: string, inputId: string, callbacks: CreatedScreenCallbacks): void {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const field = document.getElementById(inputId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!field) return;
    const copied = await callbacks.onCopy(field.value);
    if (copied) {
      flashCopyButton(btn);
      announce(t("copiedBtn"));
    } else {
      field.focus();
      field.select();
      flashCopyError(btn);
      announce(t("copyFailed"));
    }
  });
}

function autoSizeLinkFields(): void {
  document.querySelectorAll<HTMLTextAreaElement>("textarea.link-output").forEach((field) => {
    const screen = field.closest<HTMLElement>(".screen");
    if (screen?.hidden) return;
    field.style.height = "auto";
    field.style.minHeight = "0";
    field.style.overflow = "hidden";
    field.style.height = `${field.scrollHeight + 2}px`;
  });
}

// ── Reveal Screen ──────────────────────────────────────────────
export interface RevealScreenCallbacks {
  onSubmit: () => void;
  onCancel?: () => void;
}

export function renderRevealScreen(
  needsKey: boolean,
  requiresPassword: boolean,
  oneTime: boolean,
  expiresAt: number,
  callbacks: RevealScreenCallbacks
): void {
  const el = screens.reveal!;
  stopCountdownTimer();
  const countdownHtml = oneTime ? "" : buildCountdown(expiresAt);
  const requirement = requiresPassword
    ? t("revealRequirementPassword")
    : needsKey
      ? t("revealRequirementKey")
      : t("revealRequirementReady");

  el.dataset.postFetch = "false";
  el.dataset.oneTime = oneTime.toString();
  el.innerHTML = `
    <div class="card">
      <h1 class="card-title" id="revealTitle">${oneTime ? t("revealTitle") : t("revealMultiTitle")}</h1>
      <p class="card-subtitle" id="revealSubtitle">${oneTime ? t("revealSubtitle") : t("revealMultiSubtitle")}</p>
      ${oneTime ? `
      <div class="reveal-warning" id="revealWarning">
        ${icon("triangle", "icon")}
        <span>${t("revealWarning")}</span>
      </div>` : `
      <div class="countdown-badge" id="countdownBadge">
        ${icon("clock", "icon")}
        <span>${countdownHtml}</span>
      </div>`}
      <div class="reveal-requirement" id="revealRequirement">
        ${icon(requiresPassword ? "lock" : needsKey ? "key" : "check", "icon")}
        <span>${requirement}</span>
      </div>
      <div id="revealKeyGroup" hidden>
        <div class="form-group">
          <label for="revealKeyInput" class="form-label">${t("revealKeyLabel")}</label>
          <input type="text" id="revealKeyInput" class="form-input" placeholder="${t("revealKeyPlaceholder")}" autocomplete="off">
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
      <button type="button" class="btn btn-ghost btn-full" id="cancelRevealBtn">${icon("arrowLeft")}${t("cancelBtn")}</button>
    </div>`;

  wireRevealButton(callbacks);
  focusScreenHeading("reveal");

  // Live countdown for multi-read secrets
  if (!oneTime) {
    startCountdownTimer("countdownBadge", expiresAt, () => {
      const badge = document.getElementById("countdownBadge");
      badge?.classList.add("is-expired");
      const revealBtn = document.getElementById("revealBtn") as HTMLButtonElement | null;
      if (revealBtn) revealBtn.disabled = true;
      announce(t("expired"));
    });
  }
}

function updateRevealCardForPostFetch(oneTime: boolean, requiresPassword: boolean): void {
  const screen = screens.reveal;
  if (screen) screen.dataset.postFetch = "true";

  const title = document.getElementById("revealTitle");
  const subtitle = document.getElementById("revealSubtitle");
  const warning = document.getElementById("revealWarning");
  const requirement = document.getElementById("revealRequirement");

  if (title) title.textContent = t("revealPostFetchTitle");
  if (subtitle) subtitle.textContent = oneTime ? t("revealPostFetchSubtitle") : t("revealPostFetchMultiSubtitle");
  if (warning) {
    warning.className = "reveal-warning";
    warning.innerHTML = `${icon("triangle", "icon")}<span>${oneTime ? t("revealPostFetchWarning") : t("revealPostFetchMultiWarning")}</span>`;
  }
  if (requirement) {
    requirement.innerHTML = `${icon(requiresPassword ? "lock" : "key", "icon")}<span>${requiresPassword ? t("revealPostFetchPassword") : t("revealPostFetchKey")}</span>`;
  }

  const cancel = document.getElementById("cancelRevealBtn");
  if (cancel) {
    cancel.innerHTML = `${icon("arrowLeft")}${oneTime ? t("leaveLostAccess") : t("backHomeBtn")}`;
  }
}

function wireRevealButton(callbacks: RevealScreenCallbacks): void {
  const btn = document.getElementById("revealBtn") as HTMLButtonElement | null;
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.classList.add("is-loading");
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.querySelector<HTMLElement>(".btn-spinner")!.hidden = false;
    announce(t("loadingText"));
    try {
      await callbacks.onSubmit();
    } finally {
      btn.classList.remove("is-loading");
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.querySelector<HTMLElement>(".btn-spinner")!.hidden = true;
    }
  });

  document.getElementById("cancelRevealBtn")?.addEventListener("click", () => {
    const screen = screens.reveal;
    const postFetchOneTime = screen?.dataset.postFetch === "true" && screen?.dataset.oneTime === "true";
    if (postFetchOneTime && !window.confirm(t("leaveLostAccessConfirm"))) return;
    callbacks.onCancel?.();
    window.location.href = "/";
  });
}

export function renderKeyPrompt(onSubmit: (keyInput: string) => void, oneTime: boolean, errorMessage?: string): void {
  const keyGroup = document.getElementById("revealKeyGroup");
  if (!keyGroup) return;
  const btn = document.getElementById("revealBtn") as HTMLButtonElement | null;
  if (btn) btn.hidden = true;

  updateRevealCardForPostFetch(oneTime, false);
  keyGroup.hidden = false;
  keyGroup.innerHTML = `
    <div class="form-group animate-fade-in">
      <label for="revealKeyInput" class="form-label">${t("revealKeyLabel")}</label>
      <input type="text" id="revealKeyInput" class="form-input ${errorMessage ? 'input-error' : ''}"
        placeholder="${t("revealKeyPlaceholder")}" autocomplete="off" translate="no" spellcheck="false"
        aria-describedby="revealKeyHint${errorMessage ? " revealKeyError" : ""}"
        ${errorMessage ? 'aria-invalid="true"' : ""}>
      <p class="form-hint" id="revealKeyHint">${t("revealKeyHint")}</p>
      ${oneTime ? `
      <div class="validation-warning">
        ${icon("triangle", "icon")}
        <span>${t("revealKeyWarning")}</span>
      </div>` : ""}
      ${errorMessage ? `<div class="reveal-error" id="revealKeyError" role="alert">${escapeHtml(errorMessage)}</div>` : ""}
      <button type="button" class="btn ${errorMessage ? 'btn-destructive' : 'btn-primary'} btn-full mt-sm" id="retryRevealBtn">
        ${icon(errorMessage ? "refresh" : "key")}
        <span class="btn-text">${errorMessage ? t("revealKeyRetryBtn") : t("revealKeyBtn")}</span>
        <span class="btn-spinner" hidden>
          <svg class="spinner" viewBox="0 0 24 24" width="18" height="18"><circle class="spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/><circle class="spinner-head" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/></svg>
        </span>
      </button>
    </div>`;

  const retryBtn = document.getElementById("retryRevealBtn") as HTMLButtonElement;
  const keyInput = document.getElementById("revealKeyInput") as HTMLInputElement;
  const submit = async (): Promise<void> => {
    retryBtn.classList.add("is-loading");
    retryBtn.disabled = true;
    retryBtn.setAttribute("aria-busy", "true");
    retryBtn.querySelector<HTMLElement>(".btn-spinner")!.hidden = false;
    try {
      await onSubmit(keyInput.value);
    } finally {
      retryBtn.classList.remove("is-loading");
      retryBtn.disabled = false;
      retryBtn.removeAttribute("aria-busy");
      retryBtn.querySelector<HTMLElement>(".btn-spinner")!.hidden = true;
    }
  };

  retryBtn.addEventListener("click", submit);
  keyInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  });
  keyInput.focus();
  if (errorMessage) announce(errorMessage);
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
    errorEl.setAttribute("role", "alert");
    errorEl.textContent = message;
  }
  const keyInput = document.getElementById("revealKeyInput") as HTMLInputElement;
  if (keyInput) {
    keyInput.classList.add("input-error");
    keyInput.setAttribute("aria-invalid", "true");
    keyInput.setAttribute("aria-describedby", "revealKeyHint revealKeyError");
    keyInput.focus();
    keyInput.select();
  }
  announce(message);
  // Troca o botão para vermelho + "Tentar novamente".
  const btn = document.getElementById("revealBtn") as HTMLButtonElement | null;
  if (btn) {
    btn.className = "btn btn-destructive btn-full";
    const textEl = btn.querySelector(".btn-text");
    if (textEl) textEl.textContent = t("revealKeyRetryBtn");
    // Garante que o botão está habilitado para retry.
    btn.classList.remove("is-loading");
    btn.disabled = false;
    const spinner = btn.querySelector<HTMLElement>(".btn-spinner");
    if (spinner) (spinner as HTMLElement).hidden = true;
  }
}

export function renderPasswordPrompt(onSubmit: (password: string) => void, oneTime: boolean, errorMessage?: string): void {
  const extra = document.getElementById("revealExtraFields");
  if (!extra) return;
  const isRetry = !!errorMessage;
  const btnClass = isRetry ? "btn-destructive" : "btn-primary";
  const btnLabel = isRetry ? t("revealPwdRetryBtn") : t("revealPwdBtn");
  updateRevealCardForPostFetch(oneTime, true);

  extra.innerHTML = `
    <form id="revealPasswordForm" class="form-group animate-fade-in" novalidate>
      <label for="revealPwdInput" class="form-label">${t("revealPwdLabel")}</label>
      <input type="password" id="revealPwdInput" class="form-input ${isRetry ? 'input-error' : ''}"
        placeholder="${t("revealPwdPlaceholder")}" autocomplete="off"
        aria-describedby="revealPwdHint${isRetry ? " revealPwdError" : ""}"
        ${isRetry ? 'aria-invalid="true" aria-errormessage="revealPwdError"' : ""}>
      <p class="form-hint" id="revealPwdHint">${t("revealPwdHint")}</p>
      ${oneTime ? `
      <div class="validation-warning">
        ${icon("triangle", "icon")}
        <span>${t("revealPwdWarning")}</span>
      </div>` : ""}
      ${errorMessage ? `<div class="reveal-error" id="revealPwdError" role="alert">${escapeHtml(errorMessage)}</div>` : ""}
      <button type="submit" class="btn ${btnClass} btn-full mt-sm" id="retryRevealBtn">
        ${icon(isRetry ? "refresh" : "key")}
        <span class="btn-text">${btnLabel}</span>
        <span class="btn-spinner" hidden>
          <svg class="spinner" viewBox="0 0 24 24" width="18" height="18"><circle class="spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/><circle class="spinner-head" cx="12" cy="12" r="10" fill="none" stroke-width="2.5"/></svg>
        </span>
      </button>
    </form>`;

  const form = document.getElementById("revealPasswordForm") as HTMLFormElement;
  const retryBtn = document.getElementById("retryRevealBtn") as HTMLButtonElement;
  const passwordInput = document.getElementById("revealPwdInput") as HTMLInputElement;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    retryBtn.classList.add("is-loading");
    retryBtn.disabled = true;
    retryBtn.setAttribute("aria-busy", "true");
    retryBtn.querySelector<HTMLElement>(".btn-spinner")!.hidden = false;
    try {
      await onSubmit(passwordInput.value);
    } finally {
      retryBtn.classList.remove("is-loading");
      retryBtn.disabled = false;
      retryBtn.removeAttribute("aria-busy");
      retryBtn.querySelector<HTMLElement>(".btn-spinner")!.hidden = true;
    }
  });

  const revealBtn = document.getElementById("revealBtn");
  if (revealBtn) revealBtn.hidden = true;
  passwordInput.focus();
  if (errorMessage) announce(errorMessage);
}

// ── Revealed Screen ────────────────────────────────────────────
export function renderRevealedScreen(secret: string, oneTime: boolean, expiresAt: number, callbacks: { onCopy: (text: string) => Promise<boolean> }): void {
  const el = screens.revealed!;
  stopCountdownTimer();
  const countdownId = "revealedCountdown";

  el.innerHTML = `
    <div class="card">
      <h1 class="card-title" id="revealedTitle">${t("revealedTitle")}</h1>
      <p class="card-subtitle">${oneTime ? t("revealedSubtitle") : t("revealedMultiSubtitle")}</p>

      ${!oneTime ? `
      <div class="countdown-badge" id="${countdownId}">
        ${icon("clock", "icon")}
        <span>${buildCountdown(expiresAt)}</span>
      </div>` : ""}

      <div class="secret-display">
        <span class="form-label" id="secretContentLabel">${t("secretContentLabel")}</span>
        <pre id="revealedSecretText" class="secret-text" role="region" aria-labelledby="secretContentLabel" tabindex="0" translate="no" spellcheck="false"></pre>
        <button type="button" class="btn btn-ghost btn-copy btn-copy-secret" id="copySecretBtn" aria-label="${t("copySecretLabel")}">
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

  const copyBtn = document.getElementById("copySecretBtn") as HTMLButtonElement;
  copyBtn.addEventListener("click", async () => {
    const copied = await callbacks.onCopy(secret);
    if (copied) {
      flashCopyButton(copyBtn);
      announce(t("copiedBtn"));
    } else {
      flashCopyError(copyBtn);
      announce(t("copyFailed"));
    }
  });

  focusScreenHeading("revealed");

  // Live countdown para multi-read
  if (!oneTime) {
    startCountdownTimer(countdownId, expiresAt, () => {
      document.getElementById(countdownId)?.classList.add("is-expired");
    });
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
      <div class="unavailable-reasons" role="region" aria-labelledby="unavailableReasonsTitle">
        <h2 id="unavailableReasonsTitle">${t("unavailableReasonsTitle")}</h2>
        <ul>
          <li>${icon("eyeOff", "icon")}<span>${t("unavailableReasonConsumed")}</span></li>
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
  focusScreenHeading("unavailable");
}

// ── Error Screen ───────────────────────────────────────────────
export type ErrorKind = "create" | "rateLimit" | "network" | "info" | "fetch";

export function renderErrorScreen(
  kind: ErrorKind,
  options: { onRetry?: () => void } = {}
): void {
  const el = screens.error!;
  const title = kind === "create"
    ? t("errorCreateTitle")
    : kind === "rateLimit"
      ? t("errorRateLimitTitle")
      : kind === "network"
        ? t("errorNetworkTitle")
        : kind === "fetch"
          ? t("errorFetchTitle")
          : t("errorInfoTitle");
  const text = kind === "create"
    ? t("errorCreateText")
    : kind === "rateLimit"
      ? t("errorRateLimitText")
      : kind === "network"
        ? t("errorNetworkText")
        : kind === "fetch"
          ? t("errorFetchText")
          : t("errorInfoText");
  const retryLabel = kind === "create" ? t("errorCreateRetry") : t("errorRetry");

  el.innerHTML = `
    <div class="card unavailable-card">
      <div class="unavailable-header">
        <div class="unavailable-icon">
          ${icon(kind === "rateLimit" ? "clock" : kind === "network" ? "refresh" : "triangle", "icon")}
        </div>
        <div>
          <h1 class="card-title" id="errorTitle">${title}</h1>
          <p class="unavailable-text">${text}</p>
        </div>
      </div>
      <div class="result-actions">
        ${options.onRetry ? `<button type="button" class="btn btn-primary btn-full" id="errorRetryBtn">${icon("refresh")}${retryLabel}</button>` : ""}
        <a href="/" class="btn btn-secondary btn-full">${icon("home")}${t("backHomeBtn")}</a>
      </div>
    </div>`;

  if (options.onRetry) {
    document.getElementById("errorRetryBtn")?.addEventListener("click", options.onRetry);
  }
  focusScreenHeading("error");
}

// ── Helpers ────────────────────────────────────────────────────
function buildCountdown(expiresAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = expiresAt - now;
  if (remaining <= 0) return t("expired");

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) {
    return `${t("expiresIn")} ${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${t("expiresIn")} ${hours}h ${minutes}min`;
  }
  return `${t("expiresIn")} ${minutes}min`;
}

let countdownTimer: number | null = null;

export function stopCountdownTimer(): void {
  if (countdownTimer !== null) {
    window.clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function startCountdownTimer(elementId: string, expiresAt: number, onExpire?: () => void): void {
  stopCountdownTimer();
  const el = document.getElementById(elementId);
  if (!el) return;

  const span = el.querySelector("span");
  if (!span) return;

  const tick = (): void => {
    const remaining = expiresAt - Math.floor(Date.now() / 1000);
    if (remaining <= 0) {
      span.textContent = t("expired");
      stopCountdownTimer();
      onExpire?.();
      return;
    }
    span.textContent = buildCountdown(expiresAt);
  };
  tick();
  if (expiresAt > Math.floor(Date.now() / 1000)) {
    countdownTimer = window.setInterval(tick, 60000);
  }
}

export const HUMAN_PASSWORD_WORDS = [
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

export const HUMAN_PASSWORD_WORD_COUNT = 7;
export const HUMAN_PASSWORD_SUFFIX_RANGE = 1000;

// 72^7 * 1000 ≈ 2^53.2 bits. Mantenha >= 50 bits ao alterar lista/contagem.
export const HUMAN_PASSWORD_ENTROPY_BITS =
  Math.log2(HUMAN_PASSWORD_WORDS.length) * HUMAN_PASSWORD_WORD_COUNT +
  Math.log2(HUMAN_PASSWORD_SUFFIX_RANGE);

export function generateHumanPassword(): string {
  const words: string[] = [];
  for (let i = 0; i < HUMAN_PASSWORD_WORD_COUNT; i++) {
    words.push(HUMAN_PASSWORD_WORDS[randomIndex(HUMAN_PASSWORD_WORDS.length)]);
  }
  const suffix = randomIndex(HUMAN_PASSWORD_SUFFIX_RANGE).toString().padStart(3, "0");
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

export function flashCopyError(btn: HTMLElement): void {
  btn.classList.add("copy-error");
  const label = btn.querySelector(".copy-label");
  if (label) label.textContent = t("copyFailedBtn");
  setTimeout(() => {
    btn.classList.remove("copy-error");
    if (label) label.textContent = t("copyBtn");
  }, 3000);
}

export function clearCreateSensitiveInputs(): void {
  const secretInput = document.getElementById("secretInput") as HTMLTextAreaElement | null;
  const passwordInput = document.getElementById("passwordInput") as HTMLInputElement | null;
  const secretError = document.getElementById("secretError");
  const passwordError = document.getElementById("passwordError");
  const charCount = document.getElementById("charCount");

  if (secretInput) {
    secretInput.value = "";
    secretInput.removeAttribute("aria-invalid");
    secretInput.removeAttribute("aria-errormessage");
  }
  if (passwordInput) {
    passwordInput.value = "";
    passwordInput.removeAttribute("aria-invalid");
    passwordInput.removeAttribute("aria-errormessage");
  }
  if (secretError) {
    secretError.textContent = "";
    secretError.hidden = true;
  }
  if (passwordError) {
    passwordError.textContent = "";
    passwordError.hidden = true;
  }
  if (charCount) charCount.textContent = formatByteCounter(0);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function formatByteCounter(bytes: number): string {
  return `${bytes.toLocaleString("pt-BR")} / 65.536 ${t("charsCounter")}`;
}

function setFieldError(
  input: HTMLInputElement | HTMLTextAreaElement,
  error: HTMLElement,
  message: string | null
): void {
  if (message) {
    error.textContent = message;
    error.hidden = false;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-errormessage", error.id);
  } else {
    error.textContent = "";
    error.hidden = true;
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-errormessage");
  }
}

export function clearRevealSensitiveInputs(): void {
  const keyInput = document.getElementById("revealKeyInput") as HTMLInputElement | null;
  const passwordInput = document.getElementById("revealPwdInput") as HTMLInputElement | null;

  if (keyInput) keyInput.value = "";
  if (passwordInput) passwordInput.value = "";
}

function escapeHtml(str: string): string {
  // Também protege valores usados em atributos delimitados por aspas.
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
