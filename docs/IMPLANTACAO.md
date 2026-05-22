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

## Executar localmente

```bash
npm install
npm run dev-init
npm run build
npm run dev
```

O comando `dev-init` aplica migrations no D1 local usando o binding `DB` e o template público `wrangler.toml`. O banco local fica em `.wrangler/state/`, que é ignorado pelo Git.

Acesse `http://localhost:8787`.

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

Consequência operacional: o repositório fonte do LockBrief permanece limpo, mas o repositório gerado pelo Deploy Button pode conter IDs reais. Se isso violar a política do operador, mantenha esse repositório privado ou use o deploy manual privado com `wrangler.local.toml`.

## Variáveis e secrets

O LockBrief v1.0.0 não exige secrets de runtime.

Os limites de payload e TTL estão definidos no código e documentados em `docs/FUNCIONAL.md`. Não há necessidade de publicar `[vars]` reais no GitHub.

Se uma versão futura adicionar secrets:

1. local: usar `.dev.vars` ou `.env`, ambos ignorados pelo Git
2. produção: usar Cloudflare Dashboard → Settings → Variables and Secrets, ou `wrangler secret put`
3. documentação pública: usar somente nomes e exemplos fictícios

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

## Build do cliente

```bash
npm run build
```

Compila `src/client/*.ts` em `dist/client.js`, copia CSS para `dist/styles.css` e publica `src/client/assets/*` em `dist/assets/*`.

## Testes

```bash
npm test
```

Executa 20 testes de integração com Vitest + `@cloudflare/vitest-pool-workers`. Os testes usam D1 isolado e não afetam bancos de desenvolvimento ou produção.

## Checklist de validação pré-release

- [ ] `git status --short` revisado.
- [ ] Nenhum `wrangler.local.toml`, `.dev.vars`, `.env`, token, secret ou `database_id` real aparece no diff.
- [ ] `wrangler.toml` contém apenas placeholder público.
- [ ] `npm run typecheck` passa.
- [ ] `npm run build` passa.
- [ ] `npm test` passa com 20/20.
- [ ] `npx wrangler deploy --dry-run --outdir /tmp/lockbrief-dry-run` empacota o Worker.
- [ ] `CHANGELOG.md` e `RELEASE_NOTES.md` estão atualizados.

## Checklist de validação pós-deploy

- [ ] `GET /` retorna HTML com CSP headers.
- [ ] `GET /api/health` retorna `{ status: "ok", db: "connected" }`.
- [ ] `GET /privacidade` retorna página de privacidade.
- [ ] `POST /api/store` com payload válido retorna `201 { ok: true }`.
- [ ] `POST /api/fetch` com `idHash` inválido retorna `404`.
- [ ] `POST /api/info` retorna metadados sem consumir.
- [ ] Criar segredo e verificar que plaintext não aparece no DevTools Network.
- [ ] Verificar que chave está apenas no fragmento `#`.
- [ ] Testar leitura única com duas abas simultâneas: apenas uma recebe o envelope.
- [ ] Testar leitura múltipla (`oneTime=false`): mesmo link funciona várias vezes até expirar.
- [ ] Testar `/api/info` sem consumo do segredo.
- [ ] Testar retry de chave/senha incorreta sem novo fetch quando o envelope já está em memória.
- [ ] Headers de segurança presentes: CSP, HSTS, X-Frame-Options, Referrer-Policy.
- [ ] Cron de limpeza executando após 30 minutos.
