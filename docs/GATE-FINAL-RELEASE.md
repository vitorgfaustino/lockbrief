# Gate Final de Release — 08/10/2026

## Resultado e custódia

Candidata de manutenção **v1.2.1**, preparada localmente sobre a fonte pública `bb3bad7` (v1.2.0). Alterações da auditoria anterior foram confrontadas com código e testes; novos assets do mantenedor foram preservados. Entrega inclui commit local coerente; consultar `git log -1` para seu SHA final. **Publicação bloqueada até aprovação humana e CI do commit final.** Nenhuma nova tag foi criada.

Não houve push, PR remoto, merge remoto, release, deploy Cloudflare, criação de recurso ou migration remota. A fonte oficial continua exclusivamente código/distribuição, sem conexão operacional Cloudflare. O teste privado usou cópias temporárias, em branches separadas, sem modificar main privada.

## A — Auditoria final

Revisados consumo único atômico e fallback com `meta.changes`/token, metadados após consumo, logs agregados de cleanup, headers/cache confidenciais, allowlist de envelopes antes do KDF, falhas de rede sem refetch consumidor, limite UTF-8, escaping de senha, atualização transacional de output, PWA por conteúdo e dependências/lockfile. Não foram alterados AES-GCM/PBKDF2/HKDF, envelopes v1/v2, links, API, TTL, migrations distribuídas, Wrangler público ou AGPL-3.0.

| Gate reexecutado nesta entrega | Evidência |
|---|---|
| Instalação limpa | Snapshots macOS arm64, Node 22.23.2/npm 10.9.2 e Node 24.18.1/npm 11.16.0, sem node_modules/dist/estado D1 anteriores. Um gate adicional usou npm 10.9.8; o mínimo 10.9.2 foi depois verificado em nova instalação limpa |
| Dependências | `npm ci` sem scripts, com opcionais, sem force/legacy-peer-deps; `npm audit --audit-level=high`: zero vulnerabilidades conhecidas nos dois runtimes |
| Tipos e frontend | Typecheck completo Worker/cliente e build aprovados nas duas instalações |
| Integração | **57/57** em quatro arquivos, incluindo seis concorrentes com uma entrega, fallback real local, sobra consumida, vetor v1 independente, envelopes v2, upgrade de schema com dados preservados e repetição pelo ledger |
| Logs e falhas seguras | Falha D1 sintética contendo payload/id foi injetada: resposta genérica, no-store e somente mensagens fixas de store/cleanup; nenhum conteúdo sensível nos logs da aplicação |
| PWA/build | **5/5** testes de cache público, fallback da versão ativa, invalidação/determinismo, preservação em erro e remoção de output obsoleto |
| Sincronizador | **17/17** testes com Git real local: adição/remoção/modo, preservação, conflito, schema, tag/SHA/downgrade, histórico, lock incoerente, symlink/travessia, rollback de aplicação, API indisponível, ambiente isolado e publisher/dispatch simulados |
| Migrations CLI | `dev-init` local duas vezes: 0001/0002 aplicadas e depois nenhuma pendente; nenhuma migration nova |
| Wrangler | `deploy --dry-run`, ambos os runtimes: Worker 36,70 KiB, gzip 9,51 KiB, assets/D1/rate limiters empacotados, sem publicação |
| Distribuição | Gate do template/arquivos privados, manifesto/lockfile, `git diff --check`; Wrangler público, migrations e LICENSE idênticos ao baseline. Busca pelo ID D1 privado em todos os arquivos públicos: zero ocorrências, sem imprimir esse ID |
| Chrome atual | Criação, consumo único, multi-leitura, senha incorreta/correta sem refetch, chave separada, escaping, Unicode, limite UTF-8 e falhas de rede aprovados |
| Clientes legados | JavaScript recompilado dos tags oficiais 1.1.1 e 1.2.0, mantido como cliente antigo contra o Worker atual: criação v1/v2 com senha, abertura pelo cliente atual, URL legada e consumo único aprovados |
| PWA real | Chrome com cache legado removido, nove assets públicos, ícones HTTP 200, viewport 390px sem overflow e inspeção visual |
| Demo | Detecção real somente de leitura: release estável v1.2.0, tag resolvida para `bb3bad7…`, sem conflitos e já incorporada. Ensaio explícito com snapshot local da candidata passou dez gates e preservou Wrangler byte a byte; repetição posterior retornou já atualizado |

As verificações não são pentest, certificação de acessibilidade, matriz de navegadores ou prova contra comprometimento do origin/runner. Linux, APIs de escrita, dispatch real, regras de proteção e deploy não foram executados. A API do publisher foi simulada; o frontend/D1 usou runtime local real. A primeira tentativa de teste Miniflare em sandbox restrito falhou antes dos testes por EPERM de loopback/logs; execução local autorizada com HOME temporário resolveu essa limitação. Expectativas dos testes de erro e fixture de histórico foram ajustadas ao contrato real antes dos gates finais.

## B — Upstream

Versão 1.2.1 é apropriada como manutenção: corrige defeitos sem mudar contratos públicos ou schema. Manifesto e lockfile foram versionados juntos; changelog e notas distinguem candidata e histórico 1.2.0. Commit local contém a entrega; sem push/tag.

| Arquivos/área | Entrega |
|---|---|
| package.json/lock, .npmrc, .node-version, Vitest e tsconfigs | Toolchain fixada, scripts de instalação bloqueados e typecheck do cliente |
| handlers fetch/info/cleanup, cliente app/crypto/ui | Correções de consumo, falhas, validação e logs |
| build-client.mjs, sw.js, manifesto, HTML e assets | Output completo, cache por conteúdo, novos gráficos e aliases legados |
| test/, test-tooling/, scripts/check-distribution.mjs | Regressões, migrations reais, PWA e guardas de distribuição |
| .github/workflows/ci.yml e close-pr.yml | CI matriz somente validação, teste do sync e fechamento externo limitado à fonte oficial |
| tools/upstream-sync/ | Controlador opcional, testes e templates privados inativos |
| README, AI-START, AGENTS, CHANGELOG, RELEASE_NOTES, PRODUCT e docs/ | Documentação viva, atualização protegida, auditoria e separação operacional |

A CI do GitHub sobre o commit final está **pendente**, não verde. Após autorização de push, aguardar ambos os jobs Linux aprovados no SHA final. Só então pedir/executar publicação autorizada de tag nova e release estável; não usar tag prévia ou SHA de snapshot do ensaio.

## C — Demo

Consulta privada confirmou repositório privado, main com ancestralidade comum e **apenas Wrangler diferente** entre as duas mains versionadas, incluindo código, dependências, workflows, assets e docs. Configuração operacional contém D1 provisionado e os bindings públicos esperados; cron/assets/observabilidade estavam coerentes com o template. O nome do Worker tem identidade operacional válida e não precisa ser alterado para acompanhar o nome do repositório.

Bootstrap local preparado na branch `codex/prepare-release-sync` em `/tmp/lockbrief-demo-gate-20261008`, com commit local, sem push. Preserva Wrangler inteiro e main; instala controlador/estado/política/templates privados e arquiva workflows legados incompatíveis com PR do bot ou que usariam Wrangler privado em logs. A cópia de ensaio `/tmp/lockbrief-demo-release121-preview` incorpora somente a candidata local para teste, **não representa uma release estável recebida pela demo**. Ambas são cópias temporárias; conservar localmente antes de descartá-las se forem usadas no handoff.

Não existia checkout operacional da demo disponível para inventariar arquivos ignorados. GitHub não revela `.dev.vars`, `.env`, `wrangler.local.toml` ou personalização exclusiva em `dist` que nunca foi commitada. Essa verificação continua sendo checkpoint manual, sem presumir que tais arquivos estejam ausentes.

Arquitetura implementada em [SINCRONIZACAO-DEMO.md](SINCRONIZACAO-DEMO.md): consulta estável tag/SHA, delta protegido, remoções, conflitos, sandbox público, branch/PR privada sem automerge, dispatch explícito de CI no SHA e rollback local. Sem migration remota ou deploy em Actions. A demo só recebe código estável após a publicação da release oficial.

## D — Segurança operacional e limites

- Consulta GitHub de branch protection retornou **HTTP 403**, informando necessidade de plano compatível ou repositório público. Não há prova de proteção ativa. Aprovação humana e inspeção dos runs para o SHA exato continuam obrigatórias; não tornar a demo pública para contornar o gate.
- Detecção requer apenas contents read. Job privado de publicação usa contents/PR/actions write com GITHUB_TOKEN; nenhum PAT ou token Cloudflare é necessário. Token não passa aos comandos npm/testes. Schedule apenas detecta.
- Antes de qualquer branch/PR remota privada, confirmar no dashboard que branches/previews não acionam Cloudflare. A variável de habilitação, confirmação no dispatch e ambiente privado não substituem essa revisão. Dashboard/plano/quotas reais não foram consultados nem alterados.
- Wrangler operacional, D1, bindings, secrets, domínio/rotas, cron, observabilidade e personalizações protegidas são preservados. Toolkit, workflows e novas mudanças de template/schema exigem manutenção manual separada.
- Falha de instalação/teste impede PR; falha de dispatch após PR exige run manual no mesmo SHA antes do merge. Branch já existente não é sobrescrita. Main mudando exige novo planejamento; mudanças posteriores também exigem nova revisão de merge.
- Revert de código não reverte migration ou dados. Não há rollback remoto automático; conservar configuração e avaliar compatibilidade de schema antes de recuperação operacional. O processo assume filesystem/runner confiáveis e não oferece isolamento contra um administrador que altere arquivos durante a execução.

Limites de Workers/D1/Static Assets foram reconfirmados documentalmente em 08/10/2026: 100 mil requests/dia e 10 ms CPU, D1 500 MB/banco e 5 GB/conta, 50 queries por invocação, 20 mil assets de até 25 MiB. A saída local tem 24 arquivos e maior asset de 804.183 bytes. Isso demonstra adequação de tamanho, não disponibilidade de quota ou CPU remota. Fontes: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

## E — Impacto e próximos checkpoints

| Categoria | Estado/ação |
|---|---|
| Concluído localmente | Auditoria revisada, 1.2.1 candidata, correções/assets/docs, 79 testes por runtime, gates completos, bootstrap privado e ensaio protegido |
| Commit | Upstream e bootstrap privado preparados em commits locais; conferir HEAD/branch antes de qualquer publicação. Sem commit de atualização estável real na demo |
| Push | Pendente de aprovação explícita do mantenedor, primeiro para a fonte oficial |
| CI | Pendente execução GitHub sobre o commit final; Linux não validado localmente |
| Release | Pendente CI verde e autorização, então tag nova v1.2.1 e release estável, sem mover tags |
| Sync demo | Pendente inventário ignorados/dist, revisão dashboard, aprovação do bootstrap/escrita privada, release publicada, PR e CI integral aprovadas no mesmo SHA, merge humano |
| Deploy Cloudflare | Pendente e separado: exclusivamente instalação operacional após merge autorizado; nenhuma execução nesta entrega |

| Alcance nas instalações | Impacto |
|---|---|
| Correções na fonte | Código, toolchain, build, testes, CI e docs versionados na entrega local |
| Incorporado ao atualizar | Consumo/metadados, cliente, dependências, cache e gráficos após atualizar fonte/dependências e reconstruir Worker+assets juntos |
| Manual em existentes | Preservar configuração/personalizações, inventariar ignorados/dist, revisar Node/npm e comandos do painel; a partir de 1.1.x reconciliar rate limiters de 1.2.0 |
| Só primeira instalação | Provisionamento independente na conta do operador e seleção inicial de runtime; toolkit da demo não é requisito |
| Incompatibilidade/migração | Sem nova migration. SQL 0002 não é isoladamente idempotente; repetição depende do ledger. Schema manual sem ledger exige reconciliação. Cliente 1.1.x antigo não abre novos v2 com senha; manter sessão de nota já consumida e recarregar antes de novos usos |

A aprovação seguinte deve cobrir somente o **push do commit upstream para executar CI**. Release, escrita remota privada, merge e Cloudflare continuam checkpoints posteriores explícitos. O ponto de parada obrigatório do pedido foi respeitado.
