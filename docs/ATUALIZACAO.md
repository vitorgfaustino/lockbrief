# LockBrief — Atualizacao de Instalacoes Existentes

## Objetivo

Este documento e o runbook operacional para atualizar uma instancia existente do LockBrief sem quebrar configuracao local, bindings reais ou valores definidos no painel da Cloudflare.

Use este documento quando o pedido for:

- `Atualizar o Projeto`
- `pull latest version`
- atualizar uma instancia criada por Deploy Button
- atualizar um fork ou repositorio operacional privado
- sincronizar uma instalacao local com o projeto oficial

## Fonte oficial

O upstream oficial do LockBrief e:

```text
https://github.com/vitorgfaustino/lockbrief.git
```

Regra: toda atualizacao de produto deve buscar esse upstream antes de alterar codigo local.

O upstream oficial e somente fonte de leitura para atualizacao. Ele nao e destino operacional do usuario e nao deve receber push, branch ou Pull Request durante o fluxo de atualizacao.

Pull Requests externos no upstream oficial nao sao aceitos neste projeto. A IA nunca deve sugerir "abrir PR no upstream" como proximo passo. Feedback para o projeto deve ir por Issue.

`origin` nao e fonte confiavel para atualizar o produto. Em instalacoes reais, `origin` pode ser:

- fork do operador
- repositorio operacional privado
- repositorio conectado ao Workers Builds
- repositorio gerado pelo Deploy Button

Use `origin` para push somente depois de confirmar que ele e o destino operacional correto.

## Valores protegidos

A atualizacao de codigo nao deve alterar automaticamente:

- `wrangler.local.toml`
- `.dev.vars`
- `.env*`
- `database_id` real
- binding D1 `DB`
- bloco `[[d1_databases]]` com valores reais
- variables e secrets no dashboard da Cloudflare
- routes, dominio proprio, workers.dev, preview URLs e cron da instancia
- repositorio operacional gerado pelo Deploy Button quando ele contiver IDs reais

No repositorio fonte oficial, `wrangler.toml` e template publico. Em repositorios operacionais gerados pelo Deploy Button ou conectados ao Workers Builds, o `wrangler.toml` local pode conter IDs reais ou configuracao provisionada. Nesse caso, ele tambem e valor protegido durante atualizacao.

Nunca copie o template publico por cima de `wrangler.local.toml` ou de um `wrangler.toml` operacional.

## Classificacao obrigatoria

Antes de aplicar qualquer mudanca, classifique a instalacao:

| Classificacao | Sinais | Regra de atualizacao |
|---|---|---|
| `fonte_publica` | checkout do upstream oficial ou fork sem valores reais; `wrangler.toml` contem o placeholder `00000000-0000-0000-0000-000000000000` | `wrangler.toml` pode acompanhar o upstream porque continua sendo template |
| `deploy_wrangler_local` | deploy manual usa `wrangler.local.toml`; `wrangler.toml` continua publico | preserve `wrangler.local.toml` e reconcilie mudancas de deploy manualmente |
| `operacional_versionado` | repo gerado pelo Deploy Button ou usado por Workers Builds; `wrangler.toml` tem `database_id` real, routes, dominio, cron, preview URLs ou outros valores provisionados | preserve `wrangler.toml` local por padrao; nao substitua pelo upstream |
| `historico_incompativel` | `git merge-base HEAD upstream/main` nao retorna ancestral comum, ou fast-forward nao e possivel | use overlay protegido ou handoff; nao force historico |

Sinais de parada imediata:

- `wrangler.local.toml`, `.dev.vars` ou `.env*` aparecem como arquivos rastreados pelo Git
- `wrangler.toml` contem `database_id` real em repositorio publico
- o repositorio operacional precisa continuar publico, mas contem IDs reais
- a atualizacao exige mudar binding, secret, variable, route, dominio ou D1 remoto

## Pergunta obrigatoria sem atrito

Antes de atualizar, a IA deve descobrir pelo contexto como a instancia publica. Pergunte somente quando nao for possivel inferir com seguranca.

Sinais que permitem inferir:

- existe `wrangler.local.toml`: provavel deploy local com Wrangler
- `origin` aponta para repositorio operacional do usuario: provavel Workers Builds/GitHub ou Deploy Button
- `wrangler.toml` contem `database_id` real ou valores provisionados: trate como `operacional_versionado`
- o usuario mencionou Deploy Button, Workers Builds, GitHub ou Wrangler local no pedido

Se precisar perguntar, use uma unica pergunta curta:

```text
Como voce publica o projeto?
```

Opcoes aceitas:

1. `Somente executar local`
2. `Deploy local com Wrangler`
3. `Workers Builds/GitHub`
4. `Deploy Button`
5. `Primeira publicacao`

Essa resposta define se a atualizacao termina na validacao local, em handoff de GitHub/Cloudflare ou em deploy manual com `wrangler.local.toml`.

Para usuario leigo, apresente as opcoes assim:

- "So uso localmente"
- "Publico pelo Wrangler no meu computador"
- "O GitHub publica pela Cloudflare"
- "Usei o botao Deploy da Cloudflare"
- "Ainda e a primeira publicacao"

Nao pergunte ao usuario se prefere merge, overlay, branch de atualizacao ou PR quando o caminho seguro puder ser decidido pela IA.

## Experiencia esperada para usuario leigo

O pedido `Atualizar o Projeto` autoriza a IA a executar a atualizacao local segura e as validacoes locais. Ele nao autoriza push, deploy remoto, mudanca no dashboard da Cloudflare, troca de binding, troca de `database_id` ou substituicao de configuracao operacional.

Durante a atualizacao, a IA deve:

- explicar em uma frase o que esta fazendo antes de comandos sensiveis
- usar classificacoes tecnicas internamente e traduzir o resultado no resumo
- preservar `wrangler.toml` operacional sem transformar isso em decisao dificil para o operador
- criar branch local `backup/...` somente como ponto de rollback antes de overlay protegido
- nao criar branch de trabalho `update/...` por padrao
- nao oferecer PR para o upstream oficial
- perguntar apenas quando houver risco real ou decisao de publicacao

Depois da validacao, a IA deve dizer claramente:

- se a atualizacao ficou apenas local
- se existe commit pendente
- se algum push foi feito
- se algum deploy foi feito
- qual e o proximo passo seguro para o metodo de publicacao detectado

## Fluxo seguro

1. Verifique a arvore de trabalho e o contexto Git:

```bash
git status --short
git branch --show-current
git remote -v
```

Se `git status --short` mostrar mudancas locais que nao fazem parte da atualizacao, pare e peca decisao do operador. Nao use stash automatico quando houver chance de conter segredo, `.env`, `.dev.vars`, `wrangler.local.toml` ou `wrangler.toml` operacional.

2. Confirme ou crie o remoto `upstream`:

```bash
git remote get-url upstream
```

Se o remoto nao existir:

```bash
git remote add upstream https://github.com/vitorgfaustino/lockbrief.git
```

Se `upstream` existir e apontar para outro lugar, pare e peca confirmacao antes de alterar o remoto.

3. Busque o upstream oficial:

```bash
git fetch upstream --tags --prune
```

4. Revise a atualizacao antes de aplicar:

```bash
git diff --name-only HEAD..upstream/main
git log --oneline HEAD..upstream/main
```

Nao cole no chat saidas que contenham IDs reais, tokens, secrets, dominios privados ou dados operacionais sensiveis.

5. Verifique se a atualizacao pode ser fast-forward:

```bash
git merge-base HEAD upstream/main
git merge-base --is-ancestor HEAD upstream/main
```

Interprete assim:

- se `git merge-base HEAD upstream/main` nao retornar um commit, os historicos nao tem ancestral comum
- se `git merge-base --is-ancestor HEAD upstream/main` retornar sucesso, fast-forward pode ser possivel
- se o comando retornar falha, mas ha ancestral comum, o repositorio divergiu
- se `wrangler.toml` for operacional e aparecer no diff, nao aplique fast-forward sem preservar esse arquivo

6. Para repositorio `fonte_publica` com fast-forward seguro, aplique:

```bash
git merge --ff-only upstream/main
```

Se o fast-forward falhar, pare o caminho de merge. Nao use `git reset --hard`, `git checkout --`, `git clean`, rebase automatico, merge com conflito, `--allow-unrelated-histories`, `git push --force` ou `git push --force-with-lease` para forcar a atualizacao.

7. Para repositorio `operacional_versionado` ou `historico_incompativel`, use overlay protegido em vez de merge forçado.

Se o operador pediu `Atualizar o Projeto`, considere autorizado aplicar este overlay local seguro quando todas as condicoes abaixo forem verdadeiras:

- nao ha mudancas locais nao relacionadas que possam ser sobrescritas
- `wrangler.toml` operacional sera preservado
- `wrangler.local.toml`, `.dev.vars`, `.env*` e `.wrangler/` serao preservados
- nao ha conflito conceitual em `src/`, migrations, `package.json`, scripts ou docs
- a atualizacao nao exige novo binding, secret, variable, route, dominio ou D1 remoto

Fluxo recomendado no repositorio operacional atual:

```bash
git branch "backup/lockbrief-pre-update-$(date +%Y%m%d-%H%M%S)"
```

Essa branch e apenas rollback local. Ela nao e uma branch de trabalho para validacao, nao deve se chamar `update/...` por padrao e nao deve ser enviada automaticamente ao GitHub quando o repositorio operacional contem IDs reais.

Use um sufixo unico se a branch ja existir.

```bash
tmp_dir=$(mktemp -d /tmp/lockbrief-upstream.XXXXXX)
git worktree add --detach "$tmp_dir" upstream/main
rsync -a \
  --exclude='.git' \
  --exclude='.git/' \
  --exclude='wrangler.toml' \
  --exclude='wrangler.local.toml' \
  --exclude='.dev.vars' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='.wrangler/' \
  --exclude='dist/' \
  "$tmp_dir"/ ./
git worktree remove "$tmp_dir"
git status --short
```

Regras do overlay:

- nao use `--delete`
- continue na branch atual; nao crie branch de trabalho `update/...` salvo se o operador pedir explicitamente
- nao copie `.git`
- nao copie `wrangler.local.toml`, `.dev.vars`, `.env*`, `.wrangler/` ou `dist/`
- nao copie `wrangler.toml` quando ele for operacional
- se o `wrangler.toml` atual ainda for template publico, ele pode ser atualizado pelo upstream, mas somente depois de confirmar que nao ha valores reais
- remova arquivos obsoletos apenas de forma explicita, apos revisar o diff
- se houver conflito conceitual em `src/`, migrations, `package.json`, scripts ou docs, pare e entregue handoff

8. Reconcilie `wrangler.toml` manualmente quando necessario.

Compare o template novo do upstream com a configuracao operacional sem colar valores sensiveis no chat:

```bash
git show upstream/main:wrangler.toml
```

Em `wrangler.toml` operacional, preserve:

- `database_id` real
- `database_name` real, quando estiver ligado a uma instancia existente
- binding D1 usado pela instancia
- routes, dominios, workers.dev e preview URLs escolhidos pelo operador
- variables, secrets referenciados, observabilidade e cron configurados para a instancia

Aplique do upstream apenas mudancas entendidas e seguras, como ajuste de `compatibility_date`, `main`, `migrations_dir`, assets, cron ou observabilidade. Se o upstream exigir novo binding, secret, variable, migration remota, route ou alteracao de D1, pare e entregue handoff manual.

9. Valide localmente:

```bash
npm install
npm run dev-init
npm run build
npm run typecheck
npm test
```

## Quando o upstream altera `wrangler.toml`

No repositorio fonte oficial, uma alteracao em `wrangler.toml` e alteracao no template publico.

Em repositorio operacional, essa alteracao nao e permissao para sobrescrever a configuracao que esta publicando o Worker.

Quando isso acontecer:

1. revise o diff do `wrangler.toml`
2. identifique se mudou Worker, D1, assets, cron, `workers_dev`, `preview_urls` ou observabilidade
3. descubra se o arquivo local e template publico ou configuracao operacional versionada
4. mantenha `wrangler.local.toml` intacto
5. mantenha `wrangler.toml` operacional intacto ate revisar impacto
6. replique algo na configuracao privada somente depois de entender o impacto operacional
7. se houver duvida sobre `database_id`, binding, route, cron, workers.dev, preview URL ou secret, faca handoff manual

Proibido durante atualizacao:

- substituir `database_id` real por placeholder
- substituir arquivo operacional inteiro pelo template do upstream
- resolver divergencia de historico com `--allow-unrelated-histories`
- publicar com `git push --force` ou `git push --force-with-lease` para alinhar `main`

## Publicacao depois da atualizacao

### Somente executar local

Pare apos:

```bash
npm run dev-init
npm run build
npm run typecheck
npm test
```

Nao crie D1 remoto e nao publique Worker.

### Deploy local com Wrangler

Use a configuracao privada:

```bash
npm run d1:migrate:remote:private
npx wrangler deploy --config wrangler.local.toml
```

Antes desses comandos, confirme que `wrangler.local.toml` contem os valores reais corretos e continua fora do Git.

### Workers Builds/GitHub

Depois de validar localmente:

1. confirme que nenhum valor real esta no diff
2. confirme que o destino de push e o repositorio operacional correto
3. se as mudancas ainda nao estiverem commitadas, peca confirmacao simples para commit/push na branch operacional atual
4. faca push somente apos confirmacao do operador

Valores reais de producao devem permanecer no dashboard da Cloudflare ou no repositorio operacional privado, conforme a politica da instancia.

Nao ofereca abrir PR no upstream oficial. PR so pode ser mencionado se o operador disser explicitamente que o proprio repositorio operacional usa revisao por PR, e mesmo assim o destino nunca deve ser `https://github.com/vitorgfaustino/lockbrief.git`.

### Deploy Button

O repositorio gerado pelo Deploy Button pode conter IDs reais provisionados pela Cloudflare.

Para atualizar:

1. trabalhe dentro do repositorio gerado
2. configure `upstream` para `https://github.com/vitorgfaustino/lockbrief.git`
3. classifique o repositorio como `operacional_versionado` se o `wrangler.toml` tiver IDs reais ou valores provisionados
4. busque `upstream/main`
5. aplique fast-forward apenas quando isso nao substituir configuracao operacional
6. se houver `unrelated histories` ou divergencia, use overlay protegido e preserve `wrangler.toml`
7. mantenha o repositorio gerado privado se ele contiver IDs reais
8. depois de validar, o proximo passo normal e commit/push para o `origin` operacional do usuario, se ele autorizar

Nao use force push para transformar `main` local em copia direta do upstream. O repositorio gerado e operacional; a atualizacao deve trazer codigo e docs sem apagar a configuracao provisionada.

## Compatibilidade da v1.1.0

Para instancias ja em LockBrief v1.1.0:

- nao ha migration D1 nova
- nao ha novo binding
- nao ha novo secret
- nao ha nova variavel de ambiente obrigatoria
- a atualizacao de codigo nao exige alterar tabela, cron, TTL ou limites

Mesmo assim, sempre leia `CHANGELOG.md` e `RELEASE_NOTES.md` da versao que sera aplicada antes de publicar.

## Handoff obrigatorio

A IA deve parar e entregar instrucoes manuais quando:

- houver alteracao local nao relacionada que possa ser sobrescrita
- `upstream` apontar para outro repositorio
- `git merge --ff-only upstream/main` falhar e o overlay protegido nao for seguro
- `HEAD` e `upstream/main` nao tiverem ancestral comum e o overlay protegido nao for seguro
- o diff incluir configuracao operacional real
- `wrangler.toml` operacional precisar de reconciliacao com o template do upstream
- o operador ainda nao informou o metodo de publicacao
- for necessario criar D1 remoto
- for necessario alterar binding, secret, variable, route, dominio ou dashboard Cloudflare
- o repositorio operacional for publico e contiver IDs reais
- qualquer publicacao exigir `git push --force` ou `git push --force-with-lease`
- o unico caminho restante for abrir PR no upstream oficial

## Checklist final

- [ ] `git status --short` revisado.
- [ ] `upstream` aponta para `https://github.com/vitorgfaustino/lockbrief.git`.
- [ ] Instalacao classificada como `fonte_publica`, `deploy_wrangler_local`, `operacional_versionado` ou `historico_incompativel`.
- [ ] Se houve `unrelated histories`, overlay protegido foi usado ou handoff manual foi entregue.
- [ ] Nenhum valor real apareceu no diff.
- [ ] `wrangler.local.toml`, `.dev.vars`, `.env*` e `wrangler.toml` operacional foram preservados.
- [ ] Nenhum `reset --hard`, `--allow-unrelated-histories`, rebase automatico ou push forçado foi usado.
- [ ] Nenhuma branch de trabalho `update/...` foi criada sem pedido explicito.
- [ ] Nenhum PR para o upstream oficial foi sugerido.
- [ ] `npm run dev-init` passou.
- [ ] `npm run build` passou.
- [ ] `npm run typecheck` passou.
- [ ] `npm test` passou.
- [ ] Publicacao remota foi feita apenas pelo metodo confirmado pelo operador.
- [ ] O resumo final explicou se ha commit pendente, se houve push/deploy e qual e o proximo passo.
