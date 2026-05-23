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

`wrangler.toml` e template publico. `wrangler.local.toml` e configuracao privada. Nunca copie o template publico por cima da configuracao privada.

## Pergunta obrigatoria

Antes de atualizar, a IA deve perguntar ou descobrir:

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

## Fluxo seguro

1. Verifique a arvore de trabalho:

```bash
git status --short
git branch --show-current
git remote -v
```

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

5. Aplique somente fast-forward:

```bash
git merge --ff-only upstream/main
```

Se o fast-forward falhar, pare. Nao use `git reset --hard`, `git checkout --`, `git clean`, rebase automatico ou merge com conflito para forcar a atualizacao.

6. Valide localmente:

```bash
npm install
npm run dev-init
npm run build
npm run typecheck
npm test
```

## Quando o upstream altera `wrangler.toml`

Uma alteracao em `wrangler.toml` e alteracao no template publico, nao permissao para sobrescrever a configuracao privada.

Quando isso acontecer:

1. revise o diff do `wrangler.toml`
2. identifique se mudou Worker, D1, assets, cron, `workers_dev`, `preview_urls` ou observabilidade
3. mantenha `wrangler.local.toml` intacto
4. replique algo na configuracao privada somente depois de entender o impacto operacional
5. se houver duvida sobre `database_id`, binding, route ou secret, faca handoff manual

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
3. faca push somente apos confirmacao do operador

Valores reais de producao devem permanecer no dashboard da Cloudflare ou no repositorio operacional privado, conforme a politica da instancia.

### Deploy Button

O repositorio gerado pelo Deploy Button pode conter IDs reais provisionados pela Cloudflare.

Para atualizar:

1. trabalhe dentro do repositorio gerado
2. configure `upstream` para `https://github.com/vitorgfaustino/lockbrief.git`
3. busque e aplique `upstream/main` com fast-forward quando possivel
4. preserve a configuracao Wrangler provisionada pela Cloudflare
5. mantenha o repositorio gerado privado se ele contiver IDs reais

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
- `git merge --ff-only upstream/main` falhar
- o diff incluir configuracao operacional real
- o operador ainda nao informou o metodo de publicacao
- for necessario criar D1 remoto
- for necessario alterar binding, secret, variable, route, dominio ou dashboard Cloudflare
- o repositorio operacional for publico e contiver IDs reais

## Checklist final

- [ ] `git status --short` revisado.
- [ ] `upstream` aponta para `https://github.com/vitorgfaustino/lockbrief.git`.
- [ ] Nenhum valor real apareceu no diff.
- [ ] `wrangler.local.toml`, `.dev.vars` e `.env*` foram preservados.
- [ ] `npm run dev-init` passou.
- [ ] `npm run build` passou.
- [ ] `npm run typecheck` passou.
- [ ] `npm test` passou.
- [ ] Publicacao remota foi feita apenas pelo metodo confirmado pelo operador.
