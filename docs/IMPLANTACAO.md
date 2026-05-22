# LockBrief — Deploy e Operação

## Pré-requisitos

- Node.js 18+
- Conta Cloudflare
- Wrangler CLI (`npm install -g wrangler` ou `npx wrangler`)

## Deploy local (desenvolvimento)

```bash
npm install
npm run dev-init
npm run build:client
npm run dev
```

O comando `dev-init` cria o banco D1 local (SQLite em `.wrangler/state/`) e aplica as migrations automaticamente.

Acesse `http://localhost:8787`.

## Deploy remoto (produção)

### Via script automatizado

```bash
bash setup.sh
```

### Via CLI manual

```bash
# 1. Criar banco D1
npx wrangler d1 create lockbrief
# Anote o database_id retornado

# 2. Atualizar wrangler.toml com o database_id

# 3. Compilar cliente
npm run build:client

# 4. Aplicar migrações
npm run d1:migrate:remote

# 5. Publicar Worker
npm run deploy
```

## Deploy Button

O botão "Deploy to Cloudflare" implanta o Worker automaticamente via Workers Builds.

**Limitação conhecida:** O Deploy Button **não cria o banco D1 automaticamente**. Após o deploy via botão:

1. Clone o repositório forkado
2. Execute `npx wrangler d1 create lockbrief`
3. Copie o `database_id` para `wrangler.toml`
4. Execute `npm run d1:migrate:remote`
5. Execute `npm run deploy`

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `MAX_PAYLOAD_SIZE` | Tamanho máximo do payload em bytes | 102400 (100 KB) |
| `ALLOWED_TTLS` | TTLs permitidos (separados por vírgula) | 3600,86400,604800 |

## Migrações D1

Criar nova migração:
```bash
npx wrangler d1 migrations create lockbrief <nome>
```

Aplicar localmente:
```bash
npm run d1:migrate:local
```

Aplicar remotamente:
```bash
npm run d1:migrate:remote
```

## Cron Triggers

O Worker executa limpeza de segredos expirados a cada 30 minutos via Cron Trigger configurado em `wrangler.toml`:

```toml
[triggers]
crons = ["*/30 * * * *"]
```

## Build do cliente

```bash
npm run build:client
```

Compila `src/client/*.ts` → `dist/client.js`, copia CSS para `dist/styles.css` e publica `src/client/assets/*` em `dist/assets/*` para logo, favicon e demais arquivos estáticos.

## Testes

```bash
npm test
```

Executa 18 testes de integracao com Vitest + `@cloudflare/vitest-pool-workers`. Os testes usam um D1 isolado (Miniflare) — nao afetam o banco de desenvolvimento ou producao.

## Checklist de validacao pos-deploy

- [ ] `GET /` retorna HTML com CSP headers
- [ ] `GET /api/health` retorna `{ status: "ok", db: "connected" }`
- [ ] `GET /privacidade` retorna pagina de privacidade
- [ ] `POST /api/store` com payload valido retorna `201 { ok: true }`
- [ ] `POST /api/fetch` com idHash invalido retorna `404`
- [ ] `POST /api/info` retorna metadados sem consumir
- [ ] Criar segredo e verificar que plaintext nao aparece no DevTools Network
- [ ] Verificar que chave esta apenas no fragmento `#`
- [ ] Testar leitura unica com duas abas simultaneas (apenas uma recebe)
- [ ] Testar leitura multipla (oneTime=false) — mesmo link funciona varias vezes
- [ ] Testar `/api/info` nao consome o segredo
- [ ] Testar retry de chave/senha incorreta sem perder o segredo (oneTime=false)
- [ ] Headers de seguranca presentes: CSP, HSTS, X-Frame-Options, Referrer-Policy
- [ ] Cron de limpeza executando (verificar logs apos 30 min)
- [ ] `npm test` passa com 18/18
