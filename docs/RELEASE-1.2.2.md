# Release 1.2.2 — consolidação e gate local

**Status:** candidata local, não publicada. Não existe tag, GitHub Release, deploy Cloudflare ou migration remota desta versão.

**Baseline:** release estável `v1.2.1` no commit `9f605b047d573f48500eefa4020b293b15a39bec`; trabalho consolidado sobre `507a1a3947f217966d662c43877cdf5982e588e5` com as alterações locais da 1.2.2.

## Escopo e inventário

### Código e interface
- `src/client/app.ts`: fluxo de revelação, retry de `/api/info` em memória, timeout de 10 s, remoção imediata do fragmento, guarda de saída pós-fetch e estados de erro.
- `src/client/ui.ts`: telas, acessibilidade, validação inline, feedback de clipboard, contador UTF-8, gerador de senha manual e retry de senha/chave.
- `src/client/i18n.ts`: terminologia “senha automática/manual”, estados pós-fetch, mensagens de erro e textos de confirmação.
- `src/client/styles.css`: contraste, foco, responsividade, estados de erro/cópia, reduced motion e ajustes de layout.
- `src/client/manifest.webmanifest`, `src/client/sw.js`: metadados PWA, ícones e allowlist/versionamento do cache.
- `src/handlers/serve-client.ts`, `src/handlers/privacy-page.ts`: metadados HTML, logo, tema e texto de privacidade.

### Assets
- Novos: `src/client/assets/lockbrief-logo.png`, `src/client/assets/lockbrief-mark.png`.
- Atualizados: `apple-touch-icon.png`, `favicon-96x96.png`, `favicon-alta.png`, `favicon.ico`, `favicon.svg`, `favicon/*`, `logo-alta.png`, `web-app-manifest-192x192.png`, `web-app-manifest-512x512.png`, `favicon/site.webmanifest`.
- Removido da fonte: `src/client/assets/lockbrief.png`; o build mantém `lockbrief.png` como alias de `lockbrief-logo.png` para URLs antigas.

### Build, dependências e distribuição
- `build-client.mjs`: minificação de JS/CSS, novos assets obrigatórios e aliases de compatibilidade.
- `package.json`, `package-lock.json`: versão `1.2.2`, Wrangler 4.158.0, `@cloudflare/vitest-plugin` 1.6.0, Vitest 4.1.12, `@cloudflare/workers-types` 5.20261107.1; remoção do override redundante de `sharp`.

### Testes
- `test/index.spec.ts`: validações de envelope, Content-Type, tipos, stream, `oneTime` fail-closed e campos extras.
- `test/crypto.spec.ts`: vetor v1 fixo, envelopes v2, KDF e parsing de fragmento.
- `test/compatibility.spec.ts`: concorrência, fallback sem RETURNING, erro ambíguo pós-commit e migrations.
- `test/client-password.spec.ts` (novo): entropia e formato da senha manual.
- `test/request-body.spec.ts` (novo): limite de stream independente de `Content-Length` não canônico.

### Documentação
- `AGENTS.md`, `AI-START.md`, `CHANGELOG.md`, `README.md`, `RELEASE_NOTES.md`.
- `DESIGN.md` (novo), `docs/AUDITORIA-UI.md` (novo), `docs/COMPORTAMENTO.md`, `docs/FUNCIONAL.md`, `docs/SEGURANCA.md`, `docs/PRIVACIDADE.md`, `docs/IMPLANTACAO.md`, `docs/ATUALIZACAO.md`, `docs/SINCRONIZACAO-DEMO.md`.
- Este documento registra o gate e a proteção da `main`. `docs/GATE-FINAL-RELEASE.md` permanece histórico da 1.2.1.

## Criptografia: onde cada operação roda

| Operação | Remetente (navegador) | Destinatário (navegador) | Worker/Cloudflare | Build/ferramentas |
|---|---:|---:|---:|---:|
| `rawId`, chave, salt e IV com CSPRNG | Sim | — | — | — |
| SHA-256 para `idHash` | Sim | Sim | — | — |
| PBKDF2-SHA256 210k (modo senha manual) | Sim | Sim | **Não** | — |
| HKDF-SHA256 (composição de chave) | Sim | Sim | **Não** | — |
| AES-GCM-256 cifrar/decifrar | Sim | Sim | **Não** | — |
| SHA-256 para chave de rate limit (`rota:idHash`) | — | — | Sim, por requisição | — |
| SHA-256 do cache PWA | — | — | — | Sim, no build |

O Worker não recebe plaintext, chave, senha manual nem parâmetros de KDF em claro. Ele valida o envelope, persiste o ciphertext, controla TTL/consumo e calcula apenas um SHA-256 efêmero para a chave de rate limit por recurso. Não há PBKDF2, HKDF, AES-GCM ou serviço externo de criptografia no Worker.

### Decisão sobre PBKDF2

- O modo padrão (senha automática de 256 bits) não usa PBKDF2; o modo senha manual usa 210.000 iterações no navegador.
- A senha manual sugerida tem 7 palavras de uma lista de 72 + sufixo de 3 dígitos (≈53,2 bits), reduzindo a eficácia de ataque offline mesmo com 210k.
- Benchmark local Node 24/WebCrypto: mediana de ~25 ms para 210k e ~72 ms para 600k por derivação, sem contar a variabilidade de dispositivos móveis. O custo é do navegador, não do Worker.
- Elevar o parâmetro para 600k exigiria nova versão/allowlist de envelope e coordenaria compatibilidade de clientes; não há ganho operacional no Cloudflare Free e não é necessário para esta manutenção. A decisão é **manter 210k** e preservar envelopes v1/v2 existentes.

## Compatibilidade

- Envelope v1 continua somente leitura, com 210k e `lockbrief:v1:kdf` implícitos.
- Envelope v2 continua com parâmetros explícitos e allowlist; nenhum algoritmo, IV, KDF, link ou TTL foi alterado.
- Links `#v1.<rawId>[.<key>]`, links curtos e links com senha continuam válidos. O fragmento é removido após o parse, antes de `/api/info`, e o retry usa apenas dados em memória.
- Não há migration, binding ou schema novo. Instalações existentes só precisam reconstruir Worker e assets juntos.

## Proteção da branch `main`

### Antes
- `main` sem branch protection clássica (HTTP 404) e sem rulesets.
- Ações permitidas sem exigência de SHA pinning; workflows ativos: CI, Close External PR e Dependabot Updates.
- Checks de CI observados em `main`: `quality (22, 10.9.2)` e `quality (24, 11.16.0)`, ambos do GitHub Actions (`app_id` 15368).

### Aplicado
- Ruleset `Protect main` (`id` 26756036), target `branch`, enforcement `active`, condição `refs/heads/main`.
- Regras: `deletion`, `non_fast_forward`, `pull_request` e `required_status_checks`.
- PR: 0 aprovações obrigatórias, conversas resolvidas, merge/squash/rebase permitidos, sem code owner obrigatório nem aprovação do último push.
- Checks obrigatórios: `quality (22, 10.9.2)` e `quality (24, 11.16.0)` do GitHub Actions, com política de branch atualizada.
- Bypass: somente o mantenedor (`user` 25664638) e somente em PR (`pull_request`), como recuperação administrativa. Push direto e force push continuam bloqueados para esse bypass.

### Verificado
- `GET /repos/vitorgfaustino/lockbrief/rules/branches/main` retorna as quatro regras ativas do ruleset.
- `GET /repos/vitorgfaustino/lockbrief/rulesets/26756036` confirma enforcement, bypass e checks.
- `current_user_can_bypass` = `pull_requests_only`.
- Não foi realizado push de teste. A efetividade contra push direto é inferida das regras ativas; a validação real exige uma operação autorizada futura.

### Pendente
- `sha_pinning_required` continua `false` na política de Actions; os workflows atuais usam SHAs, mas a exigência global não foi ativada nesta entrega.
- Branch protection clássica permanece ausente; o ruleset é a única camada ativa.
- Revisores de environment, `SYNC_PR_WRITES_APPROVED` e execução real de PR/CI não são verificáveis localmente.

## Validação executada

| Gate | Resultado |
|---|---|
| `npm ci` isolado (84 pacotes) | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 69/69 em 6 arquivos |
| `npm run build` | PASS |
| `npm run test:tooling` | PASS — 5/5 |
| `npm run test:sync` | PASS — 17/17 |
| `npm run dev-init` duas vezes | PASS — 0001/0002 e nenhuma pendente |
| `npm run check:distribution` | PASS |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilidades |
| `git diff --check` | PASS |
| Wrangler `deploy --dry-run` | PASS — 36,92 KiB / gzip 9,52 KiB; nenhuma publicação |
| Chromium local (run-2) | PASS — 404/429/500/rede/timeout/inválido/retry; fragmento sempre removido; retry em memória |

O dry-run leu 28 arquivos de `dist` e confirmou D1 DB e os três rate limiters. Nenhuma credencial Cloudflare foi usada.

## Riscos e pendências de publicação

- A CI remota para o commit consolidado ainda não foi executada; os checks obrigatórios do ruleset só serão exercitados em um PR real.
- Tags/releases, deploy Cloudflare, migrations remotas e sincronização da demo permanecem fora desta entrega.
- `npm audit` é temporal; advisories futuros exigem nova execução.
- A matriz de navegadores foi validada apenas em Chromium local; Safari/Firefox e PWA real não foram reexecutados nesta passagem.
- O bypass do mantenedor em PR é intencional para recuperação; qualquer ampliação de bypass deve ser revisada.

## Próximo passo

Revisar os commits locais, executar CI remota em PR autorizado, validar o ruleset em uma operação real de PR e só então decidir tag/release/deploy. Nenhum desses passos foi executado nesta entrega.
