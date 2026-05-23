/**
 * GET / — Serve o cliente HTML com assets embutidos.
 *
 * Em produção, o HTML contém referências a /client.js e /styles.css
 * que são servidos separadamente para CSP sem 'unsafe-inline'.
 */

import { HTML_HEADERS, CSP_HEADER } from "../lib/headers";
import pkg from "../../package.json";

const VERSION = pkg.version;

function renderHtml(): string {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LockBrief — Segredos efêmeros. Controle local.</title>
  <meta name="description" content="Compartilhe segredos que se autodestroem. Criptografia no navegador. Leitura única.">
  <meta name="theme-color" content="#0B1115">
  <meta name="application-name" content="LockBrief">
  <meta name="apple-mobile-web-app-title" content="LockBrief">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/assets/pwa-icon-192.png">
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="shortcut icon" type="image/x-icon" href="/assets/favicon.ico">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>

  <header class="app-header">
    <div class="header-inner">
      <a href="/" class="logo" aria-label="LockBrief — Página inicial">
        <img src="/assets/lockbrief.png" alt="LockBrief" class="logo-img" />
      </a>
      <span class="tagline">Segredos efêmeros. Controle local.</span>
    </div>
  </header>

  <main class="app-main" id="appMain">
  </main>

  <footer class="app-footer">
    <div class="footer-inner">
      <span>${currentYear} · v${VERSION}</span>
      <span class="footer-separator">·</span>
      <a href="/privacidade" class="footer-link">Privacidade</a>
      <span class="footer-separator">·</span>
      <a href="https://github.com/vitorgfaustino/lockbrief" class="footer-link" target="_blank" rel="noopener">Código AGPL-3.0</a>
      <span class="footer-separator">·</span>
      <span>Criado por Vitor Faustino</span>
    </div>
  </footer>

  <script src="/client.js" type="module"></script>
</body>
</html>`;
}

export function handleIndex(_request: Request): Response {
  return new Response(renderHtml(), {
    status: 200,
    headers: {
      ...HTML_HEADERS,
      "Content-Security-Policy": CSP_HEADER,
    },
  });
}
