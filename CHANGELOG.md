# Changelog

Todas as mudanças notáveis do LockBrief estão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.0.0] — 2026-05-22

### Adicionado
- Criação de segredos com criptografia AES-GCM-256 no navegador (Web Crypto API).
- Leitura única transacional via D1 (`UPDATE ... RETURNING` + fallback com `consume_token`).
- Leitura múltipla opcional (toggle "Destruir após leitura" — `one_time = 0`).
- Senha adicional com PBKDF2-SHA256 (210k iterações) + HKDF-SHA256 (RFC 5869).
- Modo de compartilhamento: Link (Com chave) e Link Seguro (Sem chave).
- Expiração configurável: 1 hora, 1 dia, 1 semana.
- Cleanup automático via Cron Trigger a cada 30 minutos.
- Abuse controls em memória no escopo do isolate (sem persistência de IP).
- Circuit breaker global contra surtos de criação.
- `POST /api/info` — retorna metadados (oneTime, expiresAt) sem consumir o segredo.
- `POST /api/store` — aceita `oneTime` para controlar destruição após leitura.
- `POST /api/fetch` — comportamento condicional: destrutivo (`one_time = 1`) ou apenas SELECT (`one_time = 0`).
- Validação de chave (formato base64url, 43 chars) antes do fetch destrutivo.
- Retry local de chave/senha errada sem re-fetch (envelope em memória).
- Contador regressivo ao vivo em segredos multi-leitura ("Expira em Xh Ymin").
- Interface dark mode com glassmorphism e paleta neon ciano (#44D9FF).
- Página pública de privacidade (`/privacidade`).
- Rodapé com ano dinâmico e versão sincronizada com `package.json`.
- `GET /api/health` — verifica conectividade D1.
- Build do cliente via esbuild (`npm run build:client`).
- `npm run dev-init` — cria banco D1 local e aplica migrations.
- `npm test` — 20 testes de integração (Vitest + `@cloudflare/vitest-pool-workers`).
- CI com typecheck, build, testes e `git diff --check`.
- Issue templates (bug, dúvida) e PR template.
- Auto-close de PRs externos via GitHub Actions.
- `.editorconfig`, `.prettierrc`, `.gitignore` expandido, `.vscode/settings.json`.
- `wrangler.toml` como template público sem IDs reais e `wrangler.local.toml` privado para deploy manual.
- Scripts `build`, `deploy:private` e migrations por binding `DB`, compatíveis com Workers Builds e Deploy Button.
- Deploy manual privado documentado como passos explícitos, sem script de bootstrap remoto, para reduzir risco de criação/publicação acidental de recursos Cloudflare.
- Documentação completa em português: COMPORTAMENTO, FUNCIONAL, SEGURANÇA, PRIVACIDADE, IMPLANTAÇÃO.

### Segurança
- Chave de descriptografia no fragmento `#` da URL (nunca enviada ao servidor).
- CSP restritiva `default-src 'self'`, sem domínios externos. `object-src 'none'`, `frame-src 'none'`, `worker-src 'none'`.
- HSTS, X-Frame-Options: DENY, Referrer-Policy: no-referrer, Cross-Origin-Opener-Policy: same-origin.
- Fontes do sistema (sem Google Fonts) — zero requisições externas.
- Erros públicos sempre genéricos (`not_available`), sem vazar estado do segredo.
- Segredo inserido no DOM via `textContent` (prevenção de XSS).
- Nenhum dado pessoal armazenado (IP, User-Agent, cookies, analytics).
- Disclaimer AGPL-3.0 separando responsabilidade do autor vs operador da instância.
- Política operacional: nenhum `database_id` real, secret, token, `.dev.vars`, `.env` ou `wrangler.local.toml` deve ir para GitHub público.

### Corrigido (durante desenvolvimento)
- Chave malformada agora mostra erro inline "Chave incorreta" em vez da tela genérica "Indisponível".
- `showRevealKeyError` agora foca e seleciona o campo de chave, facilitando correção imediata.
- Senha errada não destrói possibilidade de retry (envelope fica em memória).
- Whitespace no segredo preservado exatamente como digitado (sem `trim()`).
- Link completo com chave errada agora mostra campo para correção.
- Label do link na tela com senha corrigido para "Link (Com chave)".
- Sidebar atualizado: não promete mais "leitura única" como comportamento único.
- `docs/FUNCIONAL.md` documenta `one_time` e `/api/info`.
- `validateEnvelope` agora valida tamanhos exatos: IV (16 chars), salt (22 chars quando KDF ativo).
- `wrangler.toml`: `head_sampling_rate` reduzido de 1 para 0.1 (10%).
- `docs/IMPLANTACAO.md`, `AI-START.md`, `AGENTS.md` e README alinhados aos quatro fluxos: local, IA guiada, Workers Builds/GitHub e Deploy Button.
- Global try/catch no Worker — nunca vaza stack traces do D1.
- Atributos `translate="no" spellcheck="false"` no textarea e pre de revelação.
