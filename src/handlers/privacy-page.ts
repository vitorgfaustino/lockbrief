/**
 * GET /privacidade — Página pública de política de privacidade.
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
  <title>Privacidade — LockBrief</title>
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
<body class="privacy-page">

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
        <article class="card privacy-document">
          <header class="privacy-hero">
            <span class="privacy-kicker">Privacidade</span>
            <h1 class="privacy-title">Política de Privacidade</h1>
            <p class="privacy-lead">O LockBrief foi projetado com <strong>Privacy by Design</strong>. O servidor não recebe o segredo em texto claro, não recebe a chave de descriptografia e não constrói perfis sobre quem usa o sistema.</p>
          </header>

          <section class="privacy-section" aria-labelledby="privacy-never-title">
            <div class="privacy-section-head">
              <span class="privacy-badge privacy-badge-success">Nunca acessa</span>
              <h2 id="privacy-never-title" class="privacy-section-title">O que o servidor não vê</h2>
            </div>
            <p class="privacy-body">A aplicação foi desenhada para operar com o mínimo de informação possível. Estes dados permanecem fora do alcance do backend durante todo o fluxo normal de uso.</p>
            <ul class="privacy-list privacy-list-success">
              <li class="privacy-list-item">Conteúdo do segredo em texto claro.</li>
              <li class="privacy-list-item">Chave de descriptografia usada para abrir o segredo.</li>
              <li class="privacy-list-item">Senha adicional definida por quem compartilha.</li>
              <li class="privacy-list-item">Endereço IP persistido pela própria aplicação.</li>
              <li class="privacy-list-item">User-Agent persistido, cookies de rastreamento ou identificadores de dispositivo.</li>
            </ul>
          </section>

          <section class="privacy-section" aria-labelledby="privacy-needed-title">
            <div class="privacy-section-head">
              <span class="privacy-badge privacy-badge-danger">Acesso mínimo</span>
              <h2 id="privacy-needed-title" class="privacy-section-title">O que o servidor precisa processar</h2>
            </div>
            <p class="privacy-body">Para localizar, expirar e entregar um envelope criptografado, o backend opera apenas sobre metadados técnicos mínimos e temporários.</p>
            <ul class="privacy-list privacy-list-danger">
              <li class="privacy-list-item">Um identificador derivado, calculado como hash SHA-256, para localizar o registro correto.</li>
              <li class="privacy-list-item">O envelope criptografado armazenado temporariamente até a leitura ou expiração.</li>
              <li class="privacy-list-item">O TTL escolhido para controlar disponibilidade, expiração e limpeza automática.</li>
            </ul>
          </section>

          <section class="privacy-section" aria-labelledby="privacy-crypto-title">
            <div class="privacy-section-head">
              <span class="privacy-badge privacy-badge-neutral">Criptografia local</span>
              <h2 id="privacy-crypto-title" class="privacy-section-title">Como a criptografia funciona</h2>
            </div>
            <p class="privacy-body">Toda a criptografia e a descriptografia acontecem <strong>exclusivamente no navegador</strong>, com Web Crypto API. A chave fica apenas no fragmento da URL, em <code>#...</code>, que não é enviado ao servidor em requisições HTTP.</p>
            <p class="privacy-body">Os algoritmos previstos para o fluxo são AES-GCM-256 para cifragem, PBKDF2-SHA256 com 210.000 iterações para derivação de senha adicional e HKDF-SHA256 para composição final de chave.</p>
          </section>

          <section class="privacy-section" aria-labelledby="privacy-retention-title">
            <div class="privacy-section-head">
              <span class="privacy-badge privacy-badge-accent">Retenção</span>
              <h2 id="privacy-retention-title" class="privacy-section-title">Quanto tempo os dados existem</h2>
            </div>
            <p class="privacy-body">A retenção é estritamente operacional. O sistema existe para manter o envelope apenas pelo tempo necessário para leitura e expiração automática.</p>
            <ul class="privacy-list privacy-list-accent">
              <li class="privacy-list-item">Segredos de leitura única são removidos quando o envelope criptografado é entregue ao navegador.</li>
              <li class="privacy-list-item">Segredos com mais de uma leitura permanecem disponíveis apenas até o prazo de expiração configurado.</li>
              <li class="privacy-list-item">Registros expirados são limpos periodicamente por tarefa automática.</li>
              <li class="privacy-list-item">Depois do consumo ou da expiração, o conteúdo não é recuperável pelo aplicativo.</li>
            </ul>
          </section>

          <section class="privacy-section" aria-labelledby="privacy-lgpd-title">
            <div class="privacy-section-head">
              <span class="privacy-badge privacy-badge-neutral">Conformidade</span>
              <h2 id="privacy-lgpd-title" class="privacy-section-title">LGPD e minimização</h2>
            </div>
            <p class="privacy-body">Esta aplicação não foi desenhada para coletar ou explorar dados pessoais. Não há cadastro, perfil de usuário, histórico nominal, analytics comportamental ou base dedicada à identificação de titulares.</p>
            <p class="privacy-body">Para dúvidas sobre privacidade, uso do software ou exercício de direitos aplicáveis ao operador da instância, o canal de contato permanece o repositório oficial do projeto.</p>
          </section>

          <div class="privacy-actions">
            <a href="/" class="btn btn-secondary privacy-back-link">
              <svg class="icon btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              Voltar ao início
            </a>
          </div>
        </article>
      </div>

      <aside class="info-column">
        <div class="info-panel privacy-side-panel">
          <h2 class="info-title privacy-side-title">Resumo rápido</h2>
          <ul class="info-list privacy-side-list">
            <li class="info-item"><span class="info-bullet"></span><div><strong>Criptografia local</strong><p>O segredo é cifrado antes do envio. O backend recebe apenas um envelope criptografado.</p></div></li>
            <li class="info-item"><span class="info-bullet"></span><div><strong>Chave fora da requisição</strong><p>A chave de descriptografia fica no fragmento do link e não é enviada ao servidor.</p></div></li>
            <li class="info-item"><span class="info-bullet"></span><div><strong>Retenção mínima</strong><p>O registro existe apenas até leitura, expiração ou limpeza automática.</p></div></li>
            <li class="info-item"><span class="info-bullet"></span><div><strong>Sem rastreamento</strong><p>Sem contas, cookies de analytics, fingerprinting ou perfil comportamental.</p></div></li>
          </ul>
          <div class="info-divider"></div>
          <div class="info-technical">
            <h3 class="info-subtitle">Chave e senha</h3>
            <ul class="tech-list privacy-side-tech-list">
              <li><strong>Chave</strong> — gerada automaticamente, necessária para descriptografar o conteúdo.</li>
              <li><strong>Senha adicional</strong> — opcional, definida por quem compartilha, nunca enviada ao backend.</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
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
</body>
</html>`;
}

export function handlePrivacy(_request: Request): Response {
  return new Response(renderHtml(), {
    status: 200,
    headers: {
      ...HTML_HEADERS,
      "Content-Security-Policy": CSP_HEADER,
    },
  });
}
