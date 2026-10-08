# LockBrief — Deploy e Operação

## Pré-requisitos

- Node.js `>=22.12.0` para alinhar com Wrangler, Miniflare, Vite e CI.
- npm `>=10.9.2`; `.npmrc` bloqueia todos os scripts de instalação com `ignore-scripts=true` e exige engines compatíveis. Não omita dependências opcionais: elas contêm os binários de esbuild/workerd para a plataforma.
- Conta Cloudflare apenas para quem instalar uma instância remota própria.
- Wrangler fixado na dependência do projeto (`npx --no-install wrangler`); não depender de instalação global.

## Escopo da fonte oficial

O upstream distribui código e templates públicos; não possui Worker de produção, D1 remoto próprio nem conexão operacional Cloudflare. CI e auditorias do upstream não realizam deploy. Os procedimentos remotos deste documento são para contas independentes dos operadores.

## Política de configuração

O repositório público nunca deve conter configuração operacional real.

| Arquivo/local | Vai para GitHub? | Uso |
|---|---:|---|
| `wrangler.toml` | Sim | Template público para CI, Workers Builds e Deploy Button. Contém placeholder de `database_id` e namespaces públicos reservados para rate limiting. |
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
npm ci
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

Somente em checkout limpo com fast-forward seguro, template público e sem personalizações protegidas, siga o bloco abaixo. Em configuração operacional, use o runbook de overlay protegido:

```bash
git fetch upstream --tags --prune
git diff --name-only HEAD..upstream/main
git log --oneline HEAD..upstream/main
git merge-base HEAD upstream/main
git merge-base --is-ancestor HEAD upstream/main
git merge --ff-only upstream/main
npm ci
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
- bindings `STORE_RATE_LIMITER`, `READ_RATE_LIMITER` e `RESOURCE_RATE_LIMITER`
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
cp -n wrangler.toml wrangler.local.toml # somente na primeira instalação; preservar se já existir
npm ci
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

## Cadeia de fornecimento e CI

A CI aplica os seguintes gates antes de aceitar uma mudança:

1. matriz Node 22/npm 10.9.2 e Node 24/npm 11.16.0, com `npm ci` e scripts de instalação bloqueados;
2. auditoria de dependências com bloqueio em severidade alta ou crítica;
3. verificação de whitespace com `git diff --check`;
4. typecheck do Worker e do cliente, build, testes de integração/criptografia/migrations e cache PWA;
5. migrations D1 locais repetidas, gate do template público no upstream e empacotamento Wrangler `--dry-run`. Nenhum gate executa publicação remota.

As Actions de terceiros são referenciadas por SHA imutável, com a versão legível em comentário. O job de qualidade possui apenas permissão `contents: read`, não persiste credenciais do checkout e é encerrado por timeout. Como o projeto não aceita contribuições externas, esse job executa somente em pushes, PRs do mantenedor e PRs do Dependabot; código de PR externo não entra na etapa `npm ci`.

O Dependabot verifica semanalmente dependências npm e GitHub Actions. PRs criados por `dependabot[bot]` não são fechados pelo workflow de PR externo, mas nenhuma atualização é mesclada ou publicada automaticamente: CI e revisão humana continuam obrigatórias.

Para atualizar dependências, revise as versões compatíveis em `package.json`, execute `npm install` para regenerar o lockfile deliberadamente e revise o diff. Depois valide a combinação candidata:

```bash
npm ci
npm audit --audit-level=high
npm run typecheck
npm run build
npm test
```

Revise `.npmrc`, `package.json` e `package-lock.json` juntos. Dependências diretas estão fixadas; `npm ci` reproduz o lockfile. `ignore-scripts=true` bloqueia todos os lifecycle scripts de instalação em npm 10 e 11. `npm run build`, `npm test` e comandos explicitamente pedidos continuam funcionando. Os binários são fornecidos pelas dependências opcionais da plataforma; não use `--omit=optional`, `--ignore-scripts=false`, `--force`, `--legacy-peer-deps` ou `--dangerously-allow-all-scripts` para ocultar um erro.

`@cloudflare/vitest-plugin` substitui o pacote antigo, mantendo Vitest 4 compatível. Miniflare é transitivo da combinação publicada pela Cloudflare. O override restrito `miniflare → sharp 0.35.5` corrige advisory na biblioteca nativa sem substituir Wrangler/Miniflare por versões incompatíveis. Revisar/remover o override quando o SDK incorporar uma versão corrigida; não usar `npm audit fix --force`.

### Compatibilidade com Workers Builds

A [imagem de build oficial](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/) consultada em 08/10/2026 informa npm 10.9.2 e aceita `.node-version`; o projeto declara Node 22 nesse arquivo. A instalação automática consegue usar a política sem scripts mesmo com npm 10, antes do build. Variáveis `NODE_VERSION` já definidas pelo operador devem ser revisadas caso sejam incompatíveis; não alterá-las automaticamente.

O [Deploy Button](https://developers.cloudflare.com/workers/platform/deploy-buttons/) detecta `build` e `deploy` em `package.json`. Preserve os comandos `npm run build` e `npm run deploy`; migrations usam binding `DB` e `&&` impede publicar após falha. O template público permanece com placeholder. Não usar `npm run deploy` na fonte oficial.

Em Workers Builds, a [configuração de previews](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) é distinta do deploy de produção. Não configurar `npm run deploy` ou migrations remotas como comando de preview: versões enviadas por `versions upload` usam recursos configurados e não isolam automaticamente o D1. Este upstream não habilita nem homologa previews remotos.


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

O LockBrief na versão atual não exige secrets de runtime.

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

A migration `0001` cria tabela/índice se ausentes; `0002` adiciona `one_time` com default 1, preservando os registros antigos como leitura única. A repetição segura é do runner `d1 migrations apply`, que usa `d1_migrations`; o SQL `ALTER TABLE` de `0002` não é idempotente isoladamente. Não editar migrations já distribuídas nem apagar seu histórico. Banco criado manualmente, com `one_time` mas sem ledger, exige inspeção e reconciliação manual; não ignorar erro de coluna duplicada nem recriar o banco. A auditoria atual não acrescenta migration.

## Cron Triggers

O Worker executa limpeza de segredos expirados a cada 30 minutos via Cron Trigger configurado no template Wrangler:

```toml
[triggers]
crons = ["*/30 * * * *"]
```

O cleanup remove registros do banco ativo. O D1 mantém Time Travel automaticamente por até 7 dias no plano gratuito ou 30 dias no pago; o operador deve considerar essa retenção no aviso de privacidade da instância e no controle de acesso à conta Cloudflare.

## Observabilidade e logs

O template público habilita Workers Logs com amostragem de 10%. Logs de invocação podem conter método, URL, resposta e metadados relacionados. O código não registra bodies, `idHash`, payloads, chaves ou senhas, mas o operador deve revisar a retenção e o acesso aos logs no plano contratado.

Quando logs de invocação não forem necessários, desabilite-os na configuração operacional protegida e valide a perda de diagnóstico antes do deploy. Mudanças nessa configuração afetam privacidade e operação e devem ser registradas na política da instância.

## Redução de tráfego de bots

O código bloqueia bots, crawlers e previews de links conhecidos assim que a requisição entra no Worker. Esse bloqueio reduz trabalho de aplicação e consultas D1, mas **não impede que a requisição conte como Worker request**.

O LockBrief não exige WAF pago. O template configura três bindings do Workers Rate Limiting API:

| Binding | Limite | Chave |
|---|---:|---|
| `STORE_RATE_LIMITER` | 30/min | rota `store` |
| `READ_RATE_LIMITER` | 60/min | rota `info` ou `fetch` |
| `RESOURCE_RATE_LIMITER` | 12/min | SHA-256 de `rota:idHash` |

Os números de namespace `1246073101` a `1246073103` são identificadores públicos reservados pelo template, não IDs provisionados nem secrets. Se houver mais de uma instância LockBrief na mesma conta, confirme se elas devem compartilhar contadores; caso contrário, atribua namespaces distintos na configuração operacional protegida.

O Rate Limiting API é local a cada localidade Cloudflare, permissivo e eventualmente consistente. Ele protege D1 e CPU depois que o Worker começou a executar, mas não evita que a requisição conte na cota diária.

No plano Cloudflare Free, recursos, quantidades de regras e nomes do dashboard podem variar por zona, tipo de domínio e evolução da plataforma. Antes de depender de controle adicional de borda, confirme que ele está disponível na conta operacional.

Quando a conta oferecer controles gratuitos antes do Worker:

1. Ative apenas recursos gratuitos/inclusos de mitigação de bots disponíveis para a conta.
2. Se houver regra de segurança gratuita compatível, bloqueie User-Agents de crawlers e previews que não precisam acessar a aplicação.
3. Mantenha Preview URLs desativadas quando não forem necessárias.
4. Para produção, prefira domínio controlado e evite divulgar rotas `workers.dev` adicionais.

Se essas opções não estiverem disponíveis, mantenha os bindings do Worker e o fallback em memória como contenção básica, monitore consumo e trate a ausência de bloqueio anterior ao Worker como risco residual da instância gratuita.

Não use regras que exijam cookies ou fingerprinting próprio da aplicação. O LockBrief não adiciona cookies, analytics, armazenamento local ou identificação de usuário para diferenciar humanos de bots.

Turnstile possui plano gratuito, mas não integra o fluxo padrão atual. Adicioná-lo exigiria widget, secret de validação, alteração de UX e revisão de privacidade; não configure apenas no cliente nem trate o token como validado sem chamada server-side.

## Matriz do Cloudflare Free

Requests/CPU, D1 e quantidade/tamanho de Static Assets reconfirmados em 08/10/2026; itens Logs/WAF mantêm a consulta de 27/08/2026. Eles podem mudar e devem ser reconfirmados antes de uma release:

| Recurso | Limite Free relevante | Impacto no LockBrief |
|---|---:|---|
| Workers requests | 100.000/dia | Toda rota dinâmica que chega ao Worker conta |
| CPU por invocação | 10 ms | Rate limiting e validação devem permanecer leves; PBKDF2 roda no navegador |
| Static Assets | Requests gratuitos; 20.000 arquivos, 25 MiB por arquivo | Não usar `run_worker_first` para assets públicos |
| D1 rows read | 5 milhões/dia | Índice por `id_hash` reduz leitura |
| D1 rows written | 100.000/dia | Não usar D1 como contador por requisição |
| D1 storage | 500 MB por banco; 5 GB por conta | Envelopes expiram em até 7 dias e cleanup é obrigatório |
| D1 queries por invocação | 50 | Fluxos normais ficam muito abaixo desse teto |
| D1 Time Travel | 7 dias | Exclusão do banco ativo não apaga imediatamente o histórico |
| Workers Logs | 200.000 eventos/dia; retenção de 3 dias | Template amostra 10%; operador deve revisar necessidade |
| WAF custom rules em zona Free | Até 5, sem regex | Opcional e aplicável apenas quando houver zona/domínio controlado; não é requisito do Worker |

Fontes operacionais: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Workers Rate Limiting API](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), [WAF custom rules](https://developers.cloudflare.com/waf/custom-rules/) e [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/).

## Homologação no plano Free

Validação local não substitui homologação na conta real. Sem autorização de deploy, a entrega termina nos gates locais e deixa estes itens pendentes:

- confirmar que a conta operacional permanece em Workers Free;
- reconciliar os três bindings no `wrangler.local.toml`, repositório operacional ou dashboard sem substituir D1/routes existentes;
- confirmar que o deploy aceita os bindings e que respostas `429` aparecem após o limite;
- observar consumo de Workers requests, CPU, D1 rows read/write e Workers Logs sem registrar payloads;
- validar criação, envelope v2, abertura de envelope v1, leitura única concorrente e cleanup remoto;
- verificar domínio: em `workers.dev`, não presumir regras WAF de uma zona própria; com domínio controlado, revisar as regras Free disponíveis;
- registrar resultado, data, configuração testada e risco residual. Não publicar account ID, database ID, tokens ou screenshots com dados sensíveis.

## Build do cliente

```bash
npm run build
```

Compila `src/client/*.ts` em `dist/client.js`, copia CSS para `dist/styles.css`, publica `src/client/assets/*` em `dist/assets/*` e gera `dist/manifest.webmanifest` e `dist/sw.js` com cache versionado por conteúdo. O build prepara uma saída temporária e só substitui `dist` após concluir; uma falha preserva a saída anterior. Arquivos gerados obsoletos não permanecem no novo output.

### PWA e Static Assets

`/manifest.webmanifest`, `/sw.js` e `/assets/web-app-manifest-*.png` devem ser servidos como Static Assets da Cloudflare. Não configure `run_worker_first` para esses caminhos, pois isso faria solicitações de assets invocarem o Worker e consumirem a cota do plano gratuito.

O PWA usa `web-app-manifest-192x192.png` e `web-app-manifest-512x512.png`; o HTML usa `apple-touch-icon.png` (180px), `favicon-96x96.png` e `favicon.ico`. Os ícones atuais são declarados com propósito `any`; não presumir área segura de um ícone maskable. O build mantém aliases dos nomes antigos `favicon.png` e `pwa-icon*.png`, sem recriar arquivos-fonte removidos. Assets adicionais de instalações personalizadas continuam sendo copiados; não guardar material privado no diretório público `src/client/assets/`.

## Testes

```bash
npm test
```

Executa a suíte de integração com Vitest 4 + `@cloudflare/vitest-plugin`. As migrations são lidas diretamente de `migrations/`, sem schema duplicado e sem ignorar erros de SQL. Os testes usam D1 isolado e não afetam bancos de desenvolvimento ou produção.

## Checklist de validação pré-release

- [ ] `git status --short` revisado.
- [ ] Nenhum `wrangler.local.toml`, `.dev.vars`, `.env`, token, secret ou `database_id` real aparece no diff.
- [ ] `wrangler.toml` contém apenas placeholder público no repositório fonte, ou foi preservado como configuração operacional privada.
- [ ] Bindings de rate limit foram preservados/reconciliados sem colisão involuntária de namespace na conta.
- [ ] `npm run typecheck` passa.
- [ ] `npm run build` passa.
- [ ] `npm test` e `npm run test:tooling` passam integralmente.
- [ ] `npm run check:distribution` passa no upstream público; não usar esse gate em `wrangler.toml` operacional.
- [ ] `npx wrangler deploy --dry-run --outdir /tmp/lockbrief-dry-run` empacota o Worker.
- [ ] `CHANGELOG.md` e `RELEASE_NOTES.md` estão atualizados.
- [ ] `AI-START.md`, `docs/ATUALIZACAO.md` e `docs/OPERACAO-IA.md` estão alinhados se houve mudança de atualização, deploy ou operação por IA.

## Checklist de validação pós-deploy

- [ ] `GET /` retorna HTML com CSP headers.
- [ ] `GET /manifest.webmanifest` e `GET /sw.js` são servidos como assets estáticos.
- [ ] `GET /api/health` retorna `{ status: "ok", db: "connected" }`.
- [ ] `GET /privacidade` retorna página de privacidade.
- [ ] `POST /api/store` com payload válido retorna `201 { ok: true }`.
- [ ] `POST /api/fetch` com `idHash` inválido retorna `400 invalid_request`.
- [ ] `POST /api/info` retorna metadados sem consumir.
- [ ] Limites de rota/recurso retornam `429 invalid_request` com `Retry-After: 60` sem gravar IP em D1.
- [ ] Um envelope v1 legado e um envelope v2 novo são abertos com sucesso.
- [ ] Criar segredo e verificar que plaintext não aparece no DevTools Network.
- [ ] Verificar que chave está apenas no fragmento `#`.
- [ ] Verificar no DevTools/Application que o service worker não cacheia `/api/*` nem HTML.
- [ ] Testar leitura única com duas abas simultâneas: apenas uma recebe o envelope.
- [ ] Testar leitura múltipla (`oneTime=false`): mesmo link funciona várias vezes até expirar.
- [ ] Testar `/api/info` sem consumo do segredo.
- [ ] Testar retry de chave/senha incorreta sem novo fetch quando o envelope já está em memória.
- [ ] Headers de segurança presentes: CSP, HSTS, X-Frame-Options, Referrer-Policy.
- [ ] Cron de limpeza executando após 30 minutos.

## Publicação da demo e fonte oficial

O upstream não possui implantação. A demo privada consome releases sob [gates próprios](SINCRONIZACAO-DEMO.md); nenhum token Cloudflare ou deploy foi adicionado ao Actions. Antes de push de branch privada, revisar builds/previews do dashboard, pois um push pode iniciar publicação operacional. CI da sincronização usa Wrangler público somente em sandbox descartável e não imprime configuração privada.
