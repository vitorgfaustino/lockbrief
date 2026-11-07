# AGENTS.md

Este repositorio usa documentacao viva. Qualquer agente que altere codigo, plano, arquitetura, fluxo de produto ou operacao deve tratar a documentacao como parte obrigatoria da entrega.

## Regras mandatorias

1. `plan.md` nao e documento canonico deste repositorio. Sua ausencia nao e bloqueio e o arquivo nao deve ser recriado sem pedido explicito do mantenedor.
2. Nenhuma mudanca relevante de comportamento, seguranca, fluxo, API, deploy ou arquitetura pode ser entregue sem revisar a documentacao correspondente.
3. Mudancas de codigo e mudancas de documentacao devem acontecer na mesma entrega sempre que o comportamento esperado mudar.
4. Quando houver divergencia entre codigo e docs, o agente deve corrigir a divergencia ou explicitar o bloqueio. Nao deixar inconsistencias silenciosas.
5. Se um fluxo ainda for prototipo ou stub, a documentacao deve dizer isso explicitamente. Nao documentar comportamento futuro como se ja estivesse implementado.
6. Se uma decisao reduzir privacidade, aumentar coleta de dados ou enfraquecer garantias criptograficas, atualizar obrigatoriamente `docs/PRIVACIDADE.md` e `docs/SEGURANCA.md`.
7. Se uma mudanca afetar o comportamento observado pelo usuario, atualizar obrigatoriamente `docs/COMPORTAMENTO.md`.
8. Se uma mudanca afetar rotas, validacoes, limites, estados, contratos ou dependencias tecnicas, atualizar obrigatoriamente `docs/FUNCIONAL.md`.
9. Se uma mudanca afetar bootstrap, ambiente, deploy, migracao ou operacao, atualizar obrigatoriamente `docs/IMPLANTACAO.md`.
10. README deve continuar honesto sobre o estado atual do repositorio. Se ainda existe prototipo ou trecho nao pronto para producao, isso precisa continuar explicito.

## Regra de ouro para GitHub e Cloudflare

- Nenhum segredo real, token, chave, `database_id` real, valor de `.dev.vars`, arquivo `.env`, arquivo `wrangler.local.toml` ou configuracao operacional privada pode ir para o GitHub.
- `wrangler.toml` e somente um template publico para o codigo-fonte, CI, Workers Builds e Deploy Button. Ele deve conter apenas nomes publicos, placeholders e configuracoes nao sensiveis.
- Em repositorios operacionais gerados pelo Deploy Button ou conectados ao Workers Builds, o `wrangler.toml` local pode ter sido atualizado pela Cloudflare com IDs reais. Nesse contexto, trate o `wrangler.toml` local como configuracao operacional protegida e nao substitua pelo template do upstream.
- Valores reais de deploy manual ficam em `wrangler.local.toml`, que e ignorado pelo Git.
- Valores reais de deploy via painel ficam no dashboard da Cloudflare, em bindings, variables ou secrets conforme o tipo.
- Se o Deploy Button criar ou atualizar um repositorio GitHub com IDs reais de recursos provisionados, esse repositorio deve ser tratado como operacional. Se a politica for nao publicar IDs, mantenha esse repositorio privado ou remova os IDs antes de qualquer publicacao.
- Se uma mudanca exigir dado operacional real para funcionar, documente o passo manual; nao simule nem grave o valor no repositorio.

## Operacao guiada por IA e atualizacao

- `AI-START.md` e a entrada unica para agentes de IA.
- `docs/OPERACAO-IA.md` define intencoes aceitas, limites de automacao e checkpoints manuais.
- `docs/ATUALIZACAO.md` e o runbook canonico para atualizar instalacoes existentes.
- Para atualizacoes, trate `https://github.com/vitorgfaustino/lockbrief.git` como upstream oficial.
- O upstream oficial e somente fonte de leitura para atualizacao. Nao ofereca abrir PR, branch ou push para `https://github.com/vitorgfaustino/lockbrief.git`; PRs externos nao sao aceitos neste projeto.
- Nao assuma que `origin` aponta para o projeto oficial; ele pode ser fork, repositorio operacional privado, Workers Builds ou repositorio gerado pelo Deploy Button.
- Preserve `wrangler.local.toml`, `.dev.vars`, `.env*`, bindings D1, `database_id`, variables, secrets, routes, configuracoes reais do dashboard e `wrangler.toml` operacional quando ele contiver IDs reais ou configuracao provisionada.
- Nao copie `wrangler.toml` por cima de `wrangler.local.toml`.
- Nao substitua `wrangler.toml` operacional pelo `wrangler.toml` do upstream sem revisao manual do impacto em D1, routes, dominio, cron, workers.dev, preview URLs e observabilidade.
- Se `git merge --ff-only upstream/main` falhar por historicos divergentes ou `unrelated histories`, nao use `--allow-unrelated-histories`, `reset --hard`, rebase automatico nem push com `--force` ou `--force-with-lease`; siga o fluxo de overlay protegido de `docs/ATUALIZACAO.md` ou entregue handoff manual.
- Se a atualizacao exigir alterar binding, secret, variable, route, dominio, D1 remoto ou repositorio operacional com IDs reais, pare e entregue handoff manual.
- A intencao `Atualizar o Projeto` autoriza aplicar passos locais seguros e reversiveis, incluindo backup local e overlay protegido quando nao houver conflito conceitual; nao interrompa para escolhas tecnicas que possam ser inferidas com seguranca.
- Nao crie branch de trabalho `update/...` para validar por padrao. Se precisar de rollback antes de overlay, crie apenas uma branch local `backup/...` apontando para o estado anterior e continue na branch atual.
- Ao terminar uma atualizacao, explique em linguagem simples o que foi preservado, quais validacoes passaram, se existe commit pendente, se houve push/deploy e qual e o proximo passo do operador.

## Matriz de sincronizacao

- Produto e UX:
  atualizar `docs/COMPORTAMENTO.md`
- Direcao visual, identidade, tipografia, cores, densidade, movimento ou acessibilidade visual:
  atualizar `DESIGN.md` e `docs/COMPORTAMENTO.md`
- API, banco, limites, estados e invariantes:
  atualizar `docs/FUNCIONAL.md`
- Criptografia, headers, threat model, abuse controls e falhas seguras:
  atualizar `docs/SEGURANCA.md`
- Minimizacao de dados e impacto de observabilidade:
  atualizar `docs/PRIVACIDADE.md`
- Setup, deploy, migracoes e operacao:
  atualizar `docs/IMPLANTACAO.md`
- Atualizacao de instalacoes existentes:
  atualizar `docs/ATUALIZACAO.md`
- Operacao guiada por IA, intencoes aceitas ou checkpoints:
  atualizar `docs/OPERACAO-IA.md` e `AI-START.md`
- Decisao estrutural ampla ou mudanca de direcao:
  atualizar README, `AI-START.md` e os documentos correspondentes em `docs/`

## Regras de escrita

- Escrever em PT-BR claro e tecnico.
- Preferir texto declarativo: o que existe, o que e permitido, o que e proibido, o que ainda falta.
- Separar claramente `implementado`, `planejado` e `fora de escopo`.
- Nao esconder risco conhecido.
- Nao usar linguagem de marketing dentro dos documentos tecnicos.

## Regras de seguranca documental

- Nao registrar segredos reais, chaves reais, tokens reais ou dados pessoais reais.
- Nao colar capturas de requests contendo payload sensivel.
- Nao introduzir exemplos que contradigam a politica de minimizacao do sistema.

## Checklist minimo por entrega relevante

- O comportamento mudou?
  Atualizar `docs/COMPORTAMENTO.md`.
- Alguma rota, payload, validacao, TTL, limite, estado ou tabela mudou?
  Atualizar `docs/FUNCIONAL.md`.
- Alguma garantia de seguranca, criptografia, header, abuse control ou mensagem de falha mudou?
  Atualizar `docs/SEGURANCA.md`.
- Alguma coleta, retencao, log, observabilidade ou risco LGPD mudou?
  Atualizar `docs/PRIVACIDADE.md`.
- Algum passo de setup, deploy ou operacao mudou?
  Atualizar `docs/IMPLANTACAO.md`.
- Algum passo de atualizacao por upstream mudou?
  Atualizar `docs/ATUALIZACAO.md`.
- Alguma regra de operacao por IA mudou?
  Atualizar `docs/OPERACAO-IA.md` e `AI-START.md`.
- A decisao altera a direcao do projeto?
  Atualizar README, `AI-START.md` e os documentos correspondentes em `docs/`.
- A direcao visual ou a identidade mudou?
  Atualizar `DESIGN.md` e `docs/COMPORTAMENTO.md`.
- A versao sera preparada?
  Atualizar `package.json`, `package-lock.json`, `CHANGELOG.md`, `RELEASE_NOTES.md`, `README.md` e `AI-START.md`; validar typecheck, testes, build, tooling e `npm audit`.

## Preparacao de versao

- A fonte de verdade da versao e `package.json`; `package-lock.json` deve refletir a mesma versao.
- Atualizar `CHANGELOG.md`, `RELEASE_NOTES.md`, `README.md`, `AI-START.md` e, quando a regra operacional mudar, este `AGENTS.md`.
- Distinguir sempre **candidata local** de **release publicada**. Nao anunciar tag, release ou deploy sem autorizacao e execucao reais.
- Validar antes de entregar: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:tooling`, `npm audit` e smoke local quando o runtime mudar.
- Nao criar tag, release, commit, push ou deploy como parte de “preparar a versao” sem pedido explicito do mantenedor.

## Arquitetura e organizacao

- Worker: `src/index.ts` (entrada e cron), `src/router.ts`, `src/handlers/` (rotas e cleanup) e `src/lib/` (validacao, headers, erros, abuse controls).
- D1: `migrations/0001_create_secrets.sql` e `migrations/0002_add_one_time.sql`; schema e ledger sao lidos nos testes locais.
- Cliente: `src/client/app.ts` (fluxo), `crypto.ts` (Web Crypto), `ui.ts` (DOM), `i18n.ts` (textos), `styles.css`, `sw.js` e assets/PWA.
- Tipos compartilhados: `src/lib/envelope-format.ts` e `src/lib/validation.ts`; o cliente e o Worker usam a mesma allowlist.
- Testes: `test/` (Vitest + plugin Cloudflare, D1 local) e `test-tooling/` (Node test runner); build em `build-client.mjs`; distribuicao em `scripts/check-distribution.mjs`.
- O upstream nao tem dependencias de runtime; o cliente e o Worker usam Web APIs e D1. Nao introduzir servico externo, analytics, cookie, fingerprint ou dependencia criptografica sem decisao explicita.

## Criptografia e compatibilidade

- AES-GCM-256, PBKDF2-SHA256, HKDF-SHA256, IV, salts e CSPRNG rodam no navegador. O Worker nao recebe plaintext, chave ou senha manual e nao executa PBKDF2/HKDF/AES-GCM.
- O Worker calcula apenas SHA-256 efemero para a chave de rate limit por recurso; isso nao e armazenado como identificador de cliente.
- PBKDF2 esta congelado em 210.000 iteracoes. Alterar o custo, o algoritmo, o IV, o dominio HKDF ou os parametros persistidos exige justificativa de seguranca, analise de desempenho, nova versao/allowlist de envelope e testes de retrocompatibilidade.
- Envelopes v1/v2, links `#v1.<rawId>[.<key>]`, links curtos e leitura unica devem continuar funcionando. Nunca reinterpretar silenciosamente um envelope ja emitido.
- Toda mudanca criptografica ou de envelope exige vetores fixos v1/v2 e testes de compatibilidade antes do commit.

## Validacao local

- Validar em copia isolada quando o worktree tiver alteracoes nao commitadas: `npm ci --ignore-scripts`.
- Gates: `npm run typecheck`, `npm run build`, `npm test`, `npm run test:tooling`, `npm run test:sync`, `npm run check:distribution`, `npm audit --audit-level=high`, `git diff --check` e `wrangler deploy --dry-run` quando disponivel.
- `npm run dev-init` deve ser executado duas vezes para confirmar migrations locais e repeticao pelo ledger.
- Nao remover, enfraquecer ou ocultar teste para obter aprovacao. Falha de gate deve ser corrigida ou registrada como bloqueio.

## Protecao da branch main

- A `main` do upstream usa o ruleset `Protect main`: bloqueia delecao e force push, exige PR, exige os checks `quality (22, 10.9.2)` e `quality (24, 11.16.0)` e permite bypass apenas do mantenedor em PR.
- Nao desativar, afrouxar ou contornar o ruleset sem autorizacao explicita. Nao fazer push direto, force push ou merge remoto para testar protecao.
- Push, tag, GitHub Release, merge remoto, deploy Cloudflare e migration remota exigem autorizacao expressa e separada. Commits locais so devem ser criados quando solicitados.
- Antes de release, confirmar CI verde no commit exato, ruleset ativo, versao em `package.json`/lockfile e ausencia de segredos no diff.

## Estado inicial reconhecido

- Versao candidata atual: `1.2.2` em `package.json`; ultima release estavel documentada: `1.2.1`.
- Dependencias de desenvolvimento: Wrangler 4.158.0, `@cloudflare/vitest-plugin` 1.6.0, Vitest 4.1.12 e `@cloudflare/workers-types` 5.20261107.1; npm 12.2.2 validado com Node 24.18.1; `npm audit` com 0 vulnerabilidades.
- Direcao visual em `DESIGN.md`; auditoria de UI em `docs/AUDITORIA-UI.md`.
- O sistema real esta implementado em `src/` (Worker + D1 + cliente TypeScript).
- Typecheck verifica separadamente o Worker e o cliente com tipos DOM.
- Build do cliente funciona via `npm run build` (alias de `npm run build:client`, esbuild → `dist/client.js`, `dist/styles.css`, assets e arquivos PWA).
- `npm run dev-init` cria banco D1 local e aplica migrations.
- `npm test` executa testes de integracao, criptografia e compatibilidade com Vitest 4 + plugin Cloudflare; `npm run test:tooling` verifica o cache PWA após o build.
- CI configurado: typecheck, build, testes, git diff --check.
- Issue templates e PR template configurados para repositorio publico.
- Os documentos deste repositorio evoluem junto com o codigo.

## Escopo do upstream oficial

- `vitorgfaustino/lockbrief` é somente código-fonte e distribuição: não possui produção, banco D1 remoto próprio ou conexão operacional Cloudflare.
- Não executar deploy do upstream, criar recursos Cloudflare ou modificar instalações de terceiros em auditorias/manutenção da fonte.
- Validar instalação pelo lockfile, typecheck do Worker e cliente, build, testes, migrations locais e empacotamento dry-run.
- CI do upstream não publica produção. Deploy Button, Workers Builds e scripts remotos existem para contas independentes dos operadores.
- Investigar falhas de clones e Dependabot separadamente por commit, runtime, lockfile e configuração operacional.

## Sync opcional da demo

- `docs/SINCRONIZACAO-DEMO.md` define o bootstrap e checkpoints privados. Toolkit/templates públicos não têm credenciais e não são workflows ativos do upstream.
- Não iniciar escrita GitHub privada antes de inventariar ignorados/dist e revisar branches/previews no dashboard Cloudflare. CI local não autoriza release, PR/merge privado ou deploy.
