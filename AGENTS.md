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
- Nao assuma que `origin` aponta para o projeto oficial; ele pode ser fork, repositorio operacional privado, Workers Builds ou repositorio gerado pelo Deploy Button.
- Preserve `wrangler.local.toml`, `.dev.vars`, `.env*`, bindings D1, `database_id`, variables, secrets, routes, configuracoes reais do dashboard e `wrangler.toml` operacional quando ele contiver IDs reais ou configuracao provisionada.
- Nao copie `wrangler.toml` por cima de `wrangler.local.toml`.
- Nao substitua `wrangler.toml` operacional pelo `wrangler.toml` do upstream sem revisao manual do impacto em D1, routes, dominio, cron, workers.dev, preview URLs e observabilidade.
- Se `git merge --ff-only upstream/main` falhar por historicos divergentes ou `unrelated histories`, nao use `--allow-unrelated-histories`, `reset --hard`, rebase automatico nem push com `--force` ou `--force-with-lease`; siga o fluxo de overlay protegido de `docs/ATUALIZACAO.md` ou entregue handoff manual.
- Se a atualizacao exigir alterar binding, secret, variable, route, dominio, D1 remoto ou repositorio operacional com IDs reais, pare e entregue handoff manual.

## Matriz de sincronizacao

- Produto e UX:
  atualizar `docs/COMPORTAMENTO.md`
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

## Estado inicial reconhecido

- O sistema real esta implementado em `src/` (Worker + D1 + cliente TypeScript).
- Typecheck (`tsc --noEmit`) passa limpo no codigo do Worker.
- Build do cliente funciona via `npm run build` (alias de `npm run build:client`, esbuild → `dist/client.js`).
- `npm run dev-init` cria banco D1 local e aplica migrations.
- `npm test` executa 26 testes de integracao (Vitest + Cloudflare pool workers).
- CI configurado: typecheck, build, testes, git diff --check.
- Issue templates e PR template configurados para repositorio publico.
- Os documentos deste repositorio evoluem junto com o codigo.
