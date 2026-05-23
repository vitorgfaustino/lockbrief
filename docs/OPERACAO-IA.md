# LockBrief — Operacao Guiada por IA

## Objetivo

Orientar agentes de IA a operar o LockBrief sem adivinhar dados, sem ultrapassar checkpoints manuais da Cloudflare e sem expor configuracao operacional.

`AI-START.md` continua sendo a entrada unica. Este documento e o contrato operacional de apoio para intencoes aceitas, limites de automacao e pontos de parada.

## Regras canonicas

- leia `AI-START.md` primeiro
- use `docs/ATUALIZACAO.md` para qualquer pedido de atualizacao
- em repositorio fonte, preserve `wrangler.toml` como template publico
- em repositorio gerado pelo Deploy Button ou conectado ao Workers Builds com IDs reais, preserve `wrangler.toml` como configuracao operacional
- preserve `wrangler.local.toml` como configuracao privada local
- preserve `.dev.vars`, `.env*`, IDs reais, bindings, variables e secrets do operador
- trate `https://github.com/vitorgfaustino/lockbrief.git` como upstream oficial
- trate o upstream oficial como fonte de leitura para atualizacao; nao ofereca PR, branch ou push para esse repositorio
- PRs externos no upstream oficial nao sao aceitos; se houver feedback para o projeto, oriente abrir Issue
- nao assuma que `origin` e o upstream oficial
- em Workers Builds/GitHub e Deploy Button, trate o dashboard da Cloudflare ou o repositorio operacional privado como origem dos valores reais
- em deploy local via Wrangler, use `wrangler.local.toml` para valores reais de D1
- nao crie D1 remoto, altere binding, publique Worker ou mude dashboard sem confirmacao explicita
- nao recrie `plan.md` sem pedido explicito do mantenedor
- nao resolva `unrelated histories` com `--allow-unrelated-histories`, rebase automatico, `reset --hard` ou push com `--force`/`--force-with-lease`

## Protocolo padrao

1. confirmar que a pasta atual e a raiz correta do projeto
2. classificar a intencao do usuario
3. ler o estado do Git antes de qualquer atualizacao
4. descobrir como o projeto publica e perguntar somente se nao for inferivel
5. classificar se `wrangler.toml` e template publico ou configuracao operacional
6. verificar se `HEAD` e `upstream/main` permitem fast-forward
7. executar apenas etapas automatizaveis e reversiveis
8. parar em checkpoints manuais
9. validar com `npm run dev-init`, `npm run build`, `npm run typecheck` e `npm test` quando houver atualizacao de codigo
10. revisar documentacao correspondente quando comportamento, deploy, operacao ou seguranca mudar
11. explicar o proximo passo operacional em linguagem simples

## Intencoes aceitas

| Chave | Frases aceitas | O que pode automatizar | Onde parar |
|---|---|---|---|
| `executar_local` | `Executar o Projeto`, `Iniciar o Projeto`, `rodar local` | `npm install`, `npm run dev-init`, build, typecheck, testes e dev server | antes de criar D1 remoto ou publicar Worker |
| `continuar_configuracao` | `Continuar configuracao`, `retomar setup` | revisar estado atual e executar o proximo passo local seguro | em qualquer checkpoint de Cloudflare, GitHub ou segredo |
| `atualizar_projeto` | `Atualizar o Projeto`, `pull latest version` | fluxo de `docs/ATUALIZACAO.md`, dependencias, fast-forward seguro ou overlay protegido e validacao local | antes de sobrescrever mudancas locais, substituir `wrangler.toml` operacional, alterar bindings ou fazer push/deploy |
| `aplicar_migrations` | `Aplicar migrations`, `rodar migrations` | migrations locais; remotas somente com metodo confirmado | se o banco alvo, ambiente ou binding estiver indefinido |
| `auditar_estado_operacional` | `Auditar estado operacional`, `check status` | revisar Git, docs, configs publicas e pendencias de deploy | antes de acessar ou alterar valores privados |
| `publicar_wrangler_local` | `Publicar com Wrangler local`, `deploy manual` | build, migration remota privada e deploy com `wrangler.local.toml` | antes de criar D1 remoto ou editar `wrangler.local.toml` sem confirmacao |
| `publicar_workers_builds` | `Publicar por Workers Builds/GitHub`, `auto deploy GitHub` | orientar painel, validar comandos e preparar push | antes de configurar dashboard ou expor IDs em repositorio publico |
| `publicar_deploy_button` | `Deploy Button`, `botao da Cloudflare` | revisar template publico e orientar pos-deploy | antes de decidir privacidade do repositorio gerado |

## Pergunta obrigatoria sem atrito

Antes de publicacao ou atualizacao, a IA deve descobrir pelo contexto como o projeto publica. Se nao conseguir inferir, deve fazer somente esta pergunta:

```text
Como voce publica o projeto?
```

Metodos aceitos:

- `Somente executar local`
- `Deploy local com Wrangler`
- `Workers Builds/GitHub`
- `Deploy Button`
- `Primeira publicacao`

Para usuario leigo, use labels simples:

- "So uso localmente"
- "Publico pelo Wrangler no meu computador"
- "O GitHub publica pela Cloudflare"
- "Usei o botao Deploy da Cloudflare"
- "Ainda e a primeira publicacao"

Nao pergunte ao operador se deve usar merge, overlay, branch ou PR quando o caminho seguro puder ser inferido. Explique a decisao tomada no resumo.

## Atualizacao por IA

Quando a intencao for `atualizar_projeto`, o runbook canonico e `docs/ATUALIZACAO.md`.

A intencao `atualizar_projeto` autoriza a IA a executar passos locais seguros e reversiveis, incluindo validacao local e overlay protegido quando nao houver conflito conceitual. Ela nao autoriza push, deploy remoto, alteracao de dashboard, alteracao de binding ou substituicao de configuracao operacional.

Resumo minimo:

1. verificar `git status --short`, branch e remotos
2. confirmar `upstream` como `https://github.com/vitorgfaustino/lockbrief.git`
3. buscar `upstream` com tags e prune
4. classificar a instalacao e o papel atual de `wrangler.toml`
5. revisar arquivos alterados
6. verificar `git merge-base HEAD upstream/main` e `git merge-base --is-ancestor HEAD upstream/main`
7. aplicar `git merge --ff-only upstream/main` somente em fast-forward seguro
8. criar apenas branch local `backup/...` de rollback antes de overlay protegido
9. usar overlay protegido, sem `wrangler.toml` operacional, quando houver historico incompativel e nao houver conflito conceitual
10. preservar configuracao privada e bindings reais
11. validar localmente
12. publicar apenas pelo metodo confirmado

Regras de experiencia:

- nao crie branch de trabalho `update/...` por padrao
- nao ofereca PR para o upstream oficial
- se a publicacao for Workers Builds/GitHub, o proximo passo normal apos validacao e confirmar commit/push para o `origin` operacional do usuario
- se o usuario pedir explicitamente para validar antes e depois enviar para `main`, valide, explique o resultado e peca somente a confirmacao de commit/push quando ela ainda nao existir
- ao concluir, diga se as mudancas ficaram locais, commitadas, enviadas ao GitHub ou publicadas na Cloudflare

## Checkpoints manuais

A IA deve parar quando a tarefa depender de:

- criacao de D1 remoto
- alteracao de `database_id`
- alteracao de binding, variable, secret, route, dominio ou cron real
- decisao de publicar ou privatizar repositorio operacional
- configuracao do Workers Builds/GitHub no dashboard
- fluxo do Deploy Button no GitHub/GitLab
- revisao juridica ou operacional da politica de privacidade da instancia
- conflito de Git com conflito de conteudo, risco de sobrescrever configuracao protegida ou necessidade de decisao humana
- historico Git sem ancestral comum quando houver conflito conceitual ou risco de sobrescrever configuracao protegida
- necessidade de reconciliar `wrangler.toml` operacional com o template do upstream
- qualquer caminho que dependa de `git push --force` ou `git push --force-with-lease`

## Resultado esperado

Seguindo este contrato, a IA deve conseguir:

- iniciar o projeto sem clone aninhado
- atualizar pelo upstream oficial
- preservar configuracao local e dashboard
- distinguir template publico de configuracao operacional
- validar antes de publicar
- parar antes de qualquer decisao irreversivel ou privada
