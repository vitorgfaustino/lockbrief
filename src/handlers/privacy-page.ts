/**
 * GET /privacidade — Página pública de política de privacidade.
 */

import { HTML_HEADERS, CSP_HEADER } from "../lib/headers";
import pkg from "../../package.json";

const VERSION = pkg.version;

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacidade — LockBrief</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script>
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

  <main class="app-main">
    <div class="main-inner">
      <div class="content-column">
        <div class="card">
          <h1 class="card-title">Política de Privacidade</h1>

          <p>O LockBrief foi projetado com <strong>Privacy by Design</strong>. Nenhum dado pessoal é coletado, armazenado ou processado pelo servidor.</p>

          <h2 style="margin-top:24px;font-size:1.125rem;font-weight:700;color:var(--text-primary)">O que o servidor <span style="color:var(--success)">NUNCA</span> acessa</h2>
          <ul style="margin-top:12px;display:flex;flex-direction:column;gap:8px;color:var(--text-secondary);font-size:0.9375rem;list-style:none">
            <li>✅ Conteúdo do segredo em texto claro</li>
            <li>✅ Chave de descriptografia</li>
            <li>✅ Senha adicional</li>
            <li>✅ Endereço IP do usuário</li>
            <li>✅ User-Agent do navegador</li>
            <li>✅ Cookies, sessões ou identificadores de dispositivo</li>
          </ul>

          <h2 style="margin-top:24px;font-size:1.125rem;font-weight:700;color:var(--text-primary)">O que o servidor <span style="color:var(--error)">precisa</span> acessar</h2>
          <ul style="margin-top:12px;display:flex;flex-direction:column;gap:8px;color:var(--text-secondary);font-size:0.9375rem;list-style:none">
            <li>• Um identificador derivado (hash SHA-256) para localizar o segredo</li>
            <li>• O envelope criptografado (AES-GCM-256) armazenado temporariamente</li>
            <li>• O TTL escolhido para controlar a expiração</li>
          </ul>

          <h2 style="margin-top:24px;font-size:1.125rem;font-weight:700;color:var(--text-primary)">Como funciona a criptografia</h2>
          <p style="margin-top:8px;color:var(--text-secondary);font-size:0.9375rem">Toda criptografia e descriptografia acontece <strong>exclusivamente no navegador</strong> usando a Web Crypto API. A chave de descriptografia viaja apenas no fragmento da URL (<code>#...</code>), que não é enviado ao servidor em requisições HTTP.</p>

          <p style="margin-top:12px;color:var(--text-secondary);font-size:0.9375rem">Algoritmos utilizados: AES-GCM-256, PBKDF2-SHA256 (210.000 iterações), HKDF-SHA256 (RFC 5869).</p>

          <h2 style="margin-top:24px;font-size:1.125rem;font-weight:700;color:var(--text-primary)">Retenção de dados</h2>
          <ul style="margin-top:12px;display:flex;flex-direction:column;gap:8px;color:var(--text-secondary);font-size:0.9375rem;list-style:none">
            <li>• Segredos com leitura única são removidos imediatamente após o primeiro acesso.</li>
            <li>• Segredos configurados para múltiplas leituras permanecem até a expiração.</li>
            <li>• Segredos expirados são removidos automaticamente a cada 30 minutos.</li>
            <li>• Nenhum dado persiste após o consumo ou expiração.</li>
          </ul>

          <h2 style="margin-top:24px;font-size:1.125rem;font-weight:700;color:var(--text-primary)">LGPD</h2>
          <p style="margin-top:8px;color:var(--text-secondary);font-size:0.9375rem">Esta aplicação não coleta, armazena ou processa dados pessoais conforme definido pela LGPD. Não há base de dados com informações de titulares, não há identificação de usuários e não há compartilhamento de dados com terceiros.</p>

          <p style="margin-top:12px;color:var(--text-secondary);font-size:0.9375rem">Para exercer direitos previstos na LGPD ou para questões de privacidade, entre em contato pelo GitHub do projeto.</p>

          <div style="margin-top:32px">
            <a href="/" class="btn btn-secondary btn-full">Voltar</a>
          </div>
        </div>
      </div>
    </div>
  </main>

  <footer class="app-footer">
    <div class="footer-inner">
      <span id="footerYear">2026</span> v${VERSION} ·
      <a href="/privacidade" class="footer-link">Privacidade</a> ·
      <span>Criado por <a href="https://github.com/vitorgfaustino/lockbrief" class="footer-link" target="_blank" rel="noopener">Vitor Faustino</a></span>
    </div>
  </footer>
</body>
</html>`;

export function handlePrivacy(_request: Request): Response {
  return new Response(HTML, {
    status: 200,
    headers: {
      ...HTML_HEADERS,
      "Content-Security-Policy": CSP_HEADER,
    },
  });
}
