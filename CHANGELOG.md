# Changelog

Todas as mudanças notáveis do LockBrief estão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [Não publicado]

### Corrigido
- Ano do rodapé agora é calculado durante a requisição em `/` e `/privacidade`, evitando que runtimes de Worker com data inicial de módulo em epoch exibam `1970`.
- Suíte de integração passou a cobrir o ano do rodapé nas páginas públicas, totalizando 28 testes.

### Documentação
- Fluxo de atualização por IA agora classifica a instalação antes de aplicar mudanças, distinguindo `wrangler.toml` como template público ou configuração operacional versionada.
- Runbook de atualização passou a documentar overlay protegido para repositórios com histórico divergente ou `unrelated histories`, sem `--allow-unrelated-histories`, reset, rebase automático ou push forçado.
- Regras reforçam que `wrangler.toml` operacional de Deploy Button/Workers Builds não deve ser substituído pelo template do upstream.
- Fluxo de atualização de instalações existentes agora exige busca no upstream oficial `https://github.com/vitorgfaustino/lockbrief.git`.
- Orientação para IA e operação reforça que `origin` pode ser repositório operacional e que bindings, `wrangler.local.toml`, `database_id`, variables e secrets não devem ser alterados durante atualização.
- Adicionados `docs/ATUALIZACAO.md` e `docs/OPERACAO-IA.md` como runbooks dedicados para atualização por upstream, operação guiada por IA e checkpoints manuais.

## [1.1.0] — 2026-05-22

### Adicionado
- Fluxo de revelação consciente: links válidos mostram uma confirmação antes de qualquer chamada consumidora.
- Botão **"Revelar mensagem"** como ponto explícito de consumo da nota.
- `POST /api/info` agora retorna também `requiresPassword`, derivado do envelope criptografado, sem retornar payload, KDF, salt, IV, ciphertext, chave, senha ou plaintext.
- Tela de criação reorganizada em blocos: Mensagem, Proteção, Expiração e Leitura.
- Modo de proteção por **chave automática** ou **senha humana**, sem fluxo combinado de chave separada + senha.
- Geração local de senha humana mais fácil de digitar ou ditar, sem envio da senha ao Worker.
- Resumo local na tela de link criado com expiração, leitura e tipo de proteção, sem segredo, chave, senha, `rawId`, `idHash` ou payload.
- Aviso ao desativar **"Destruir após leitura"**, indicando que a nota poderá ser visualizada sem limite até expirar.
- `GET /robots.txt` com `Disallow: /` para desencorajar indexação.

### Alterado
- Links com chave, links sem chave e links com senha sempre passam pela tela inicial de confirmação antes de `/api/fetch`.
- Chave e senha só são solicitadas depois do clique em **"Revelar mensagem"**, usando o envelope já mantido em memória.
- Campo de senha humana deixa claro que o usuário pode definir a própria senha ou usar uma sugestão gerada localmente.
- Controles de Proteção voltaram ao formato segmentado simples para manter estabilidade visual em mobile.
- Campos e botões da tela de resultado receberam ajustes de contraste e leitura mobile sem alterar identidade visual, paleta ou fonte.
- Leitura única agora usa `DELETE ... RETURNING` no caminho principal, removendo e retornando o envelope na mesma instrução D1.
- Respostas JSON agora usam headers de isolamento e `X-Robots-Tag` consistentes.
- Cleanup remove sobras criptografadas marcadas como consumidas por fallback.

### Segurança
- `/api/info` continua não consumindo segredo e agora expõe apenas metadado técnico mínimo para a UX.
- `/api/info` passou a ter rate limit em memória, sem persistir IP ou identificador de cliente.
- Bots, crawlers e previews conhecidos são bloqueados antes das rotas de aplicação.
- `/api/fetch` permanece como único ponto de entrega do envelope criptografado e só é chamado após confirmação explícita.
- Retry local de chave ou senha incorreta continua sem novo fetch.
- Logs de erro do Worker não interpolam mais mensagens internas do D1.
- Nenhum `localStorage`, `sessionStorage`, cookie, analytics, log novo ou coleta de dados pessoais foi adicionado.

### Corrigido
- Botões de copiar na tela **"Link criado com sucesso."** agora exibem feedback visual consistente com o botão de copiar da mensagem revelada.
- Setup de testes não cria mais a coluna fantasma `locked_at`; as migrations reais são usadas no D1 isolado.
- Documentação do CSP foi alinhada ao header real do código.
- Textos e documentação foram alinhados ao novo fluxo de confirmação e ao metadado `requiresPassword`.
- Suíte de integração atualizada para 26 testes, cobrindo `requiresPassword`, não consumo por `/api/info`, headers JSON, bloqueio de bots e rate limit.

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
