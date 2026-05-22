/**
 * GET / — Serve o cliente HTML com assets embutidos.
 *
 * Em producao, o HTML contem referencias a /client.js e /styles.css
 * que sao servidos separadamente para CSP sem 'unsafe-inline'.
 */

import { HTML_HEADERS, CSP_HEADER } from "../lib/headers";
import pkg from "../../package.json";

const VERSION = pkg.version;

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LockBrief — Segredos efêmeros. Controle local.</title>
  <meta name="description" content="Compartilhe segredos que se autodestroem. Criptografia no navegador. Leitura única.">
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="shortcut icon" type="image/x-icon" href="/assets/favicon.ico">
  <link rel="stylesheet" href="/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script>
    // Ano dinamico no rodape
    document.addEventListener("DOMContentLoaded", function () {
      var el = document.getElementById("footerYear");
      if (el) el.textContent = new Date().getFullYear();
    });
  </script>
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
      <span id="footerYear">2026</span> v${VERSION} ·
      <a href="/privacidade" class="footer-link">Privacidade</a> ·
      <span>Criado por <a href="https://github.com/vitorgfaustino/lockbrief" class="footer-link" target="_blank" rel="noopener">Vitor Faustino</a></span>
    </div>
  </footer>

  <script src="/client.js" type="module"></script>
</body>
</html>`;

export function handleIndex(_request: Request): Response {
  return new Response(HTML, {
    status: 200,
    headers: {
      ...HTML_HEADERS,
      "Content-Security-Policy": CSP_HEADER,
    },
  });
}
