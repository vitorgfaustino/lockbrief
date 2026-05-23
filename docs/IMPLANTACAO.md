# LockBrief — Deploy e Operação

## Pré-requisitos

- Node.js `>=22.12.0` para alinhar com Wrangler, Miniflare, Vite e CI.
- Conta Cloudflare.
- Wrangler via dependência do projeto (`npx wrangler`) ou instalação global.

## Política de configuração

O repositório público nunca deve conter configuração operacional real.

| Arquivo/local | Vai para GitHub? | Uso |
|---|---:|---|
| `wrangler.toml` | Sim | Template público para CI, Workers Builds e Deploy Button. Contém placeholder de `database_id`. |
| `wrangler.local.toml` | Não | Configuração privada para deploy manual com `database_id` real. |
| `.dev.vars`, `.env*` | Não | Variáveis e secrets locais, se existirem. |
| Dashboard Cloudflare | Não | Bindings, variables e secrets de uma instância operada pelo usuário. |

`database_id` não é senha, mas é identificador operacional real. Pela regra deste projeto, ele não deve ser publicado em repositório público.

Exceção operacional: um repositório gerado pelo Deploy Button ou conectado ao Workers Builds pode ter `wrangler.toml` atualizado pela Cloudflare com IDs reais. Nesse cenário, o arquivo deve ser tratado como configuração operacional protegida durante atualizações e o repositório deve permanecer privado se a política for não publicar IDs reais.

## Licença AGPL e configuração operacional

A obrigação AGPL-3.0 é disponibilizar o código-fonte correspondente da versão usada ou modificada, não publicar segredos, IDs reais ou configuração operacional privada.

Para uma instância modificada, o operador deve manter uma oferta clara de código-fonte aos usuários. No LockBrief, as páginas públicas exibem o link **Código AGPL-3.0** no rodapé. Se a instância roda um fork ou pacote próprio, esse link deve apontar para o código correspondente dessa instância, não necessariamente para o upstream oficial.

O código-fonte correspondente pode incluir `wrangler.toml` como template com placeholders e instruções para criar recursos próprios. Ele não deve incluir `wrangler.local.toml`, `.dev.vars`, `.env`, tokens, secrets, `database_id` real ou valores reais do dashboard da Cloudflare.

Guia completo: [`docs/LICENCA.md`](LICENCA.md).

## Rotas públicas e previews

O template público mantém `workers_dev = true` para que Deploy Button e Workers Builds entreguem uma URL `workers.dev` imediatamente após o deploy.

O template define `preview_urls = false` para não criar URLs de preview adicionais por padrão. Se o operador quiser previews por branch ou ambiente, deve habilitar isso conscientemente no repositório operacional, não no template público.

## Executar localmente

```bash
npm install
npm run dev-init
npm run build
npm run dev
```

O comando `dev-init` aplica migrations no D1 local usando o binding `DB` e o template público `wrangler.toml`. O banco local fica em `.wrangler/state/`, que é ignorado pelo Git.

Acesse `http://localhost:8787`.

## Atualizar instalação existente

Runbook canônico: `docs/ATUALIZACAO.md`. Esta seção resume o fluxo operacional para deploy e implantação.

O upstream oficial do LockBrief é:

```text
https://github.com/vitorgfaustino/lockbrief.git
```

Use este upstream como fonte de atualização mesmo quando `origin` apontar para um fork, repositório operacional privado, Workers Builds ou repositório gerado pelo Deploy Button.

O upstream oficial não é destino operacional do usuário. Durante atualização, não abra PR, branch ou push para `https://github.com/vitorgfaustino/lockbrief.git`; PRs externos no projeto oficial não são aceitos.

Fluxo seguro:

```bash
git status --short
git branch --show-current
git remote -v
git remote get-url upstream
```

Se o comando `git remote get-url upstream` falhar porque o remoto não existe, crie o remoto canônico:

```bash
git remote add upstream https://github.com/vitorgfaustino/lockbrief.git
```

Depois busque e aplique somente fast-forward:

```bash
git fetch upstream --tags --prune
git diff --name-only HEAD..upstream/main
git log --oneline HEAD..upstream/main
git merge-base HEAD upstream/main
git merge-base --is-ancestor HEAD upstream/main
git merge --ff-only upstream/main
npm install
npm run dev-init
npm run build
npm run typecheck
npm test
```

Se o remoto `upstream` já existir, confirme que ele aponta para `https://github.com/vitorgfaustino/lockbrief.git`. Se apontar para outro lugar, pare e corrija somente com confirmação explícita do operador.

Arquivos e valores protegidos durante atualização:

- `wrangler.toml`, quando for configuração operacional versionada
- `wrangler.local.toml`
- `.dev.vars` e `.env*`
- `database_id` real
- binding D1 `DB` e bloco `[[d1_databases]]`
- variables, secrets, routes, domínio e configurações reais no dashboard da Cloudflare
- repositório operacional gerado pelo Deploy Button, quando contiver IDs reais

Regras:

1. Não use `git pull` cego de `origin` para atualizar o produto. `origin` pode ser operacional.
2. Não copie `wrangler.toml` por cima de `wrangler.local.toml`.
3. Não substitua `wrangler.toml` operacional pelo template do upstream.
4. Não altere bindings, IDs reais, secrets ou variables como parte de uma atualização de código.
5. Não use `git reset --hard`, `git checkout --`, `git clean`, rebase automático, merge com conflito, `--allow-unrelated-histories`, `git push --force` ou `git push --force-with-lease` para "forçar" atualização.
6. Se `git merge --ff-only upstream/main` falhar, resolva como divergência operacional: use o overlay protegido de `docs/ATUALIZACAO.md` quando for seguro, ou faça handoff manual.
7. Se o upstream alterar `wrangler.toml`, trate a mudança como atualização do template público; em repositório operacional, preserve o arquivo local e reflita algo somente depois de revisar impacto em D1, cron, routes, workers.dev e preview URLs.
8. Não crie branch de trabalho `update/...` por padrão; use branch local `backup/...` apenas como rollback antes de overlay protegido.
9. Não ofereça PR para o upstream oficial como próximo passo.

Após validar localmente, publique conforme o método da instância:

- Wrangler local: manter `wrangler.local.toml` e usar `npm run d1:migrate:remote:private` seguido de `npx wrangler deploy --config wrangler.local.toml`.
- Workers Builds/GitHub: fazer commit/push apenas para o repositório operacional correto, depois de confirmar que nenhum ID real será exposto em repositório público.
- Deploy Button: atualizar o repositório gerado buscando o upstream oficial, preservar a configuração provisionada pela Cloudflare e nunca usar force push para reescrever a `main` operacional.

Se a atualização foi feita por IA, o resumo final deve dizer se as mudanças ficaram locais, se há commit pendente, se houve push/deploy e qual é o próximo passo simples para o operador.

## Deploy manual privado com Wrangler

Use este fluxo quando a regra for não gravar nenhum ID operacional no GitHub.

O repositório não inclui script de bootstrap remoto porque criação de D1 e deploy são ações operacionais sensíveis. Execute os passos manualmente:

```bash
cp wrangler.toml wrangler.local.toml
npm install
npx wrangler d1 create lockbrief
# edite somente wrangler.local.toml e substitua database_id pelo ID retornado
npm run build
npm run d1:migrate:remote:private
npx wrangler deploy --config wrangler.local.toml
```

Impacto esperado:

1. `wrangler.local.toml` fica apenas na máquina do operador.
2. O `database_id` real nunca precisa ser salvo em `wrangler.toml`.
3. A criação do D1 remoto exige um comando explícito.
4. A publicação exige um comando explícito separado.
5. O risco de execução acidental de bootstrap remoto é reduzido.

## Workers Builds/GitHub

Use este fluxo quando o repositório estiver conectado ao Cloudflare Workers Builds.

Configuração no painel:

1. Cloudflare Dashboard → Workers & Pages → Create → Worker → Import a repository.
2. Selecione o repositório LockBrief.
3. Configure **Build command** como `npm run build`.
4. Configure **Deploy command** como `npm run deploy`.

O `npm run deploy` executa migrations remotas e publica o Worker usando o `wrangler.toml` do repositório. Esse fluxo só deve ser usado em repositório operacional privado ou em ambiente onde a Cloudflare tenha provisionado/substituído os IDs com segurança.

Se o repositório operacional for público, não faça commit de `database_id` real, secrets ou variáveis privadas.

## Deploy Button

O botão "Deploy to Cloudflare" usa o fluxo oficial da Cloudflare para Workers.

Comportamento esperado:

1. A Cloudflare clona o repositório fonte para a conta GitHub/GitLab do operador.
2. A Cloudflare lê o `wrangler.toml` público para descobrir o Worker, D1, assets e cron.
3. Recursos suportados, incluindo D1, podem ser provisionados automaticamente.
4. A configuração Wrangler do repositório gerado pode ser atualizada com IDs reais dos recursos.
5. Workers Builds executa build/deploy.
6. A URL `workers.dev` é publicada por padrão; Preview URLs ficam desligadas no template público.

Consequência operacional: o repositório fonte do LockBrief permanece limpo, mas o repositório gerado pelo Deploy Button pode conter IDs reais. Se isso violar a política do operador, mantenha esse repositório privado ou use o deploy manual privado com `wrangler.local.toml`.

Regra prática para produção: trate o repositório operacional como privado mesmo que `database_id` não seja uma senha. O risco aqui não é segredo, é exposição de configuração real e de recursos vinculados à instância.

Se o operador modificar uma instância criada pelo Deploy Button, a recomendação é manter o repositório gerado pela Cloudflare como operacional privado e publicar a fonte correspondente em outro repositório ou pacote sanitizado. Esse segundo artefato deve conter o código modificado e um `wrangler.toml` com placeholders, sem `database_id` real, tokens, secrets, routes privadas ou valores do dashboard.

O link **Código AGPL-3.0** da instância deve apontar para essa fonte correspondente sanitizada. Não aponte esse link para o repositório operacional privado se ele contém configuração real.

## Variáveis e secrets

O LockBrief v1.1.0 não exige secrets de runtime.

Os limites de payload e TTL estão definidos no código e documentados em `docs/FUNCIONAL.md`. Não há necessidade de publicar `[vars]` reais no GitHub.

Se uma versão futura adicionar secrets:

1. local: usar `.dev.vars` ou `.env`, ambos ignorados pelo Git
2. produção: usar Cloudflare Dashboard → Settings → Variables and Secrets, ou `wrangler secret put`
3. documentação pública: usar somente nomes e exemplos fictícios

Se uma versão futura adicionar variáveis não sensíveis, documente nomes e exemplos fictícios no código-fonte. Valores reais de produção devem ficar no dashboard da Cloudflare ou em configuração operacional privada quando sua publicação expuser a instância. Secrets nunca devem ser gravados em `wrangler.toml` ou no código-fonte.

## Migrações D1

Criar nova migração:

```bash
npx wrangler d1 migrations create DB <nome>
```

Aplicar localmente:

```bash
npm run d1:migrate:local
```

Aplicar remotamente com configuração privada:

```bash
npm run d1:migrate:remote:private
```

No fluxo Deploy Button/Workers Builds, o script `npm run deploy` usa `DB` como binding para que migrations funcionem mesmo quando o operador escolher outro nome de banco.

## Cron Triggers

O Worker executa limpeza de segredos expirados a cada 30 minutos via Cron Trigger configurado no template Wrangler:

```toml
[triggers]
crons = ["*/30 * * * *"]
```

## Redução de tráfego de bots

O código bloqueia bots, crawlers e previews de links conhecidos assim que a requisição entra no Worker. Esse bloqueio reduz trabalho de aplicação e consultas D1, mas **não impede que a requisição conte como Worker request**.

Para economizar o plano gratuito contra bots, configure controles antes do Worker na conta Cloudflare:

1. Ative recursos gratuitos/inclusos de mitigação de bots disponíveis para a conta.
2. Crie uma regra de segurança para bloquear User-Agents de crawlers e previews que não precisam acessar a aplicação.
3. Mantenha Preview URLs desativadas quando não forem necessárias.
4. Para produção, prefira domínio controlado e evite divulgar rotas `workers.dev` adicionais.

Não use regras que exijam cookies ou fingerprinting próprio da aplicação. O LockBrief não adiciona cookies, analytics, armazenamento local ou identificação de usuário para diferenciar humanos de bots.

## Build do cliente

```bash
npm run build
```

Compila `src/client/*.ts` em `dist/client.js`, copia CSS para `dist/styles.css`, publica `src/client/assets/*` em `dist/assets/*` e copia os arquivos PWA `src/client/manifest.webmanifest` e `src/client/sw.js` para a raiz de `dist`.

### PWA e Static Assets

`/manifest.webmanifest`, `/sw.js` e `/assets/pwa-icon*.png` devem ser servidos como Static Assets da Cloudflare. Não configure `run_worker_first` para esses caminhos, pois isso faria solicitações de assets invocarem o Worker e consumirem a cota do plano gratuito.

O placeholder principal do ícone fica em `src/client/assets/pwa-icon.png`. Para trocar a identidade visual instalada, substitua também `pwa-icon-192.png` e `pwa-icon-512.png` por PNGs quadrados com as dimensões correspondentes.

## Testes

```bash
npm test
```

Executa 29 testes de integração com Vitest + `@cloudflare/vitest-pool-workers`. Os testes usam D1 isolado e não afetam bancos de desenvolvimento ou produção.

## Checklist de validação pré-release

- [ ] `git status --short` revisado.
- [ ] Nenhum `wrangler.local.toml`, `.dev.vars`, `.env`, token, secret ou `database_id` real aparece no diff.
- [ ] `wrangler.toml` contém apenas placeholder público no repositório fonte, ou foi preservado como configuração operacional privada.
- [ ] `npm run typecheck` passa.
- [ ] `npm run build` passa.
- [ ] `npm test` passa com 29/29.
- [ ] `npx wrangler deploy --dry-run --outdir /tmp/lockbrief-dry-run` empacota o Worker.
- [ ] `CHANGELOG.md` e `RELEASE_NOTES.md` estão atualizados.
- [ ] `AI-START.md`, `docs/ATUALIZACAO.md` e `docs/OPERACAO-IA.md` estão alinhados se houve mudança de atualização, deploy ou operação por IA.

## Checklist de validação pós-deploy

- [ ] `GET /` retorna HTML com CSP headers.
- [ ] `GET /manifest.webmanifest` e `GET /sw.js` são servidos como assets estáticos.
- [ ] `GET /api/health` retorna `{ status: "ok", db: "connected" }`.
- [ ] `GET /privacidade` retorna página de privacidade.
- [ ] `POST /api/store` com payload válido retorna `201 { ok: true }`.
- [ ] `POST /api/fetch` com `idHash` inválido retorna `404`.
- [ ] `POST /api/info` retorna metadados sem consumir.
- [ ] Criar segredo e verificar que plaintext não aparece no DevTools Network.
- [ ] Verificar que chave está apenas no fragmento `#`.
- [ ] Verificar no DevTools/Application que o service worker não cacheia `/api/*` nem HTML.
- [ ] Testar leitura única com duas abas simultâneas: apenas uma recebe o envelope.
- [ ] Testar leitura múltipla (`oneTime=false`): mesmo link funciona várias vezes até expirar.
- [ ] Testar `/api/info` sem consumo do segredo.
- [ ] Testar retry de chave/senha incorreta sem novo fetch quando o envelope já está em memória.
- [ ] Headers de segurança presentes: CSP, HSTS, X-Frame-Options, Referrer-Policy.
- [ ] Cron de limpeza executando após 30 minutos.
