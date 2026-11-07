# LockBrief — Especificação Funcional (FUNCTIONAL)

## Terminologia de interface

“Senha automática” é a chave aleatória de 256 bits que pode ir no link; “Senha manual” é a senha adicional definida pela pessoa. A API, o envelope e o código continuam usando `key`/`password` tecnicamente.

## Rotas

| Método | Rota | Descrição | Status |
|---|---|---|---|
| GET | `/` | Serve HTML da aplicação | 200 |
| GET | `/privacidade` | Serve política pública de privacidade | 200 |
| GET | `/robots.txt` | Desencoraja indexação e crawling | 200 |
| POST | `/api/store` | Armazena envelope criptografado | 201 ou 429 |
| POST | `/api/info` | Retorna metadados sem consumir segredo | 200, 404 ou 429 |
| POST | `/api/fetch` | Consome e retorna envelope criptografado | 200, 404 ou 429 |
| GET | `/api/health` | Health check (conectividade D1) | 200 ou 503 |

## Assets estáticos e PWA

Estes caminhos são publicados pelo diretório `[assets]` do Wrangler e devem ser servidos como Static Assets da Cloudflare quando o deploy usa `dist`:

| Rota | Origem no build | Finalidade |
|---|---|---|
| GET `/client.js` | `dist/client.js` | Cliente TypeScript empacotado |
| GET `/styles.css` | `dist/styles.css` | CSS da interface |
| GET `/manifest.webmanifest` | `dist/manifest.webmanifest` | Manifesto PWA |
| GET `/sw.js` | `dist/sw.js` | Service worker PWA com escopo `/` |
| GET `/assets/*` | `dist/assets/*` | Logo, favicons e ícones PWA |

O service worker é online-first. Ele só intercepta `GET` de assets públicos conhecidos e ignora navegações, `/`, `/api/*` e qualquer método diferente de `GET`.

## API: POST /api/store

### Request
```json
{
  "idHash": "<string, base64url, 43 chars>",
  "payload": "<string, envelope JSON>",
  "ttl": 3600,
  "oneTime": true
}
```

### Validações
1. Content-Type deve conter `application/json`
2. Body ≤ 100 KB, aplicado durante a leitura do stream e antecipadamente quando `Content-Length` estiver presente
3. JSON válido
4. `idHash` string base64url de 43 caracteres
5. `payload` string JSON válida, envelope v1 legado ou v2 com `{v, alg, iv, ciphertext, kdf, salt, kdfParams}` e campos binários em base64url canônico; o ciphertext inclui no mínimo a tag AES-GCM de 128 bits
6. `ttl` ∈ {3600, 86400, 604800}
7. `oneTime` é opcional; qualquer valor diferente de `false` vira leitura única
8. `idHash` não pode existir no banco (erro genérico em duplicata)

### Responses
- `201` + `{ "ok": true }`
- `400` + `{ "error": "invalid_request" }`
- `404` + `{ "error": "not_available" }` (colisão de idHash)
- `429` + `{ "error": "invalid_request" }` e `Retry-After: 60`

## API: POST /api/fetch

### Request
```json
{
  "idHash": "<string, base64url, 43 chars>"
}
```

### Comportamento condicional (one_time)

| `one_time` | Comportamento |
|---|---|
| `1` (padrão) | Leitura única: `DELETE ... RETURNING encrypted_payload`. Segredo removido na mesma instrução que retorna o envelope. |
| `0` | Leitura múltipla: apenas `SELECT`. Segredo permanece até expiração. |

### Fluxo transacional (one_time = 1)
1. Validar request e `idHash`
2. Tentar `DELETE FROM secrets WHERE one_time = 1 ... RETURNING encrypted_payload`
3. Se sucesso: retornar payload já removido do D1
4. Fallback, se a tentativa principal lançar erro em runtime (RETURNING não suportado, falha transitória ou resposta ambígua): `UPDATE` → verificar `meta.changes = 1` → `SELECT` pelo token → `DELETE` condicionado ao mesmo token. O fallback só entrega se ainda conseguir consumir a linha; erro após consumo permanece fail-closed.
5. Se nenhum resultado: tentar `SELECT WHERE one_time = 0` (multi-leitura)
6. Se nenhum resultado: erro genérico

### Responses
- `200` + `{ "payload": "<string>" }`
- `404` + `{ "error": "not_available" }`
- `429` + `{ "error": "invalid_request" }` e `Retry-After: 60`

## API: POST /api/info

Retorna metadados do segredo **sem consumi-lo**. Registros com `consumed_at` preenchido não retornam metadados, inclusive sobras de um fallback interrompido.

### Request
```json
{
  "idHash": "<string, base64url, 43 chars>"
}
```

### Response
- `200` + `{ "oneTime": true, "expiresAt": 1747861200, "requiresPassword": false }`
- `404` + `{ "error": "not_available" }`
- `429` + `{ "error": "invalid_request" }`

Respostas `429` incluem `Retry-After: 60`.

`requiresPassword` é derivado exclusivamente do campo `kdf` dentro do envelope criptografado armazenado. A resposta nunca inclui payload, envelope, `kdf`, `salt`, `iv`, `ciphertext`, chave, senha ou plaintext.

## API: GET /api/health

### Responses
- `200` + `{ "status": "ok", "db": "connected" }`
- `503` + `{ "status": "error", "db": "disconnected" }`

## Scheduled: cleanup

- Frequência: a cada 30 minutos
- Query: `DELETE FROM secrets WHERE expires_at <= ? OR (consumed_at IS NOT NULL AND consumed_at <= ?)`
- Remove segredos expirados e sobras consumidas por fallback após margem curta de segurança.

## Banco D1

### Tabela `secrets`

| Coluna | Tipo | Descrição |
|---|---|---|
| id_hash | TEXT (PK) | SHA-256 do rawId em base64url |
| encrypted_payload | TEXT | Envelope criptográfico JSON |
| expires_at | INTEGER | Unix timestamp (segundos) |
| created_at | INTEGER | Unix timestamp (segundos) |
| consumed_at | INTEGER | Unix timestamp, nullable |
| consume_token | TEXT | Token de guarda transacional, nullable |
| one_time | INTEGER | 1 para leitura única, 0 para multi-leitura |

### Índices
- `idx_secrets_expires_at` em `expires_at`

## Limites

| Artefato | Limite |
|---|---|
| Plaintext | 64 KB |
| Payload criptografado | 100 KB |
| rawId | 32 bytes (43 chars base64url) |
| key | 32 bytes (43 chars base64url) |
| idHash | 43 caracteres base64url |
| Body de `/api/info` e `/api/fetch` | 2 KB, limitado durante a leitura |

## Estados de erro do cliente

- `404` em `/api/info` ou `/api/fetch` mantém a tela genérica de segredo indisponível, sem revelar a causa.
- `429`, falha de rede e erro interno não usam a tela de 404; usam a tela de erro operacional com mensagem específica.
- Falha de criação preserva o rascunho no formulário e oferece retorno para tentar novamente. Sucesso limpa o rascunho.
- `429`, falha de rede ou timeout de 10 s em `/api/info` oferece retry com os dados do fragmento mantidos em memória; a URL já foi limpa e o segredo não foi consumido.
- `429` em `/api/fetch` pode ser repetido usando o fragmento em memória, pois o servidor rejeita antes do consumo.
- Falha ambígua de transporte em `/api/fetch` não é repetida automaticamente: a resposta pode ter sido perdida após o consumo em leitura única.
- O contador de bytes e o limite de 64 KB usam a mesma unidade UTF-8; o `maxlength` de 65.536 code units é apenas um teto superior.

## Versões do envelope criptográfico

| Versão | Criação nova | Leitura | KDF |
|---|---:|---:|---|
| v1 | Não | Sim | Parâmetros legados implícitos: PBKDF2 210.000 e `lockbrief:v1:kdf` |
| v2 | Sim | Sim | Parâmetros explícitos e validados: PBKDF2 210.000 e `lockbrief:v2:kdf` |

No envelope v2, `kdfParams` é `null` quando `kdf = "none"`. Quando há senha, o objeto deve conter exatamente os valores suportados de `iterations` e `hkdfInfo`. Valores arbitrários são rejeitados antes do armazenamento para impedir downgrade, custo computacional controlado por payload ou algoritmos desconhecidos.

A versão do envelope não é a versão do fragmento de link. O fragmento continua em `#v1.<rawId>[.<key>]`; mudar o envelope armazenado não quebra URLs existentes nem envia sua versão ao servidor fora do payload criptográfico.

Nenhuma operação PBKDF2, HKDF ou AES-GCM roda no Worker. O Worker recebe apenas o envelope cifrado, valida a estrutura, persiste no D1, controla TTL/consumo e calcula um SHA-256 efêmero para a chave de rate limit por recurso. Mapa completo e decisão sobre 210k em [SEGURANCA.md](SEGURANCA.md).

## Abuse Controls

- Fallback em memória por isolate: store 30/min, info 60/min e fetch 60/min.
- Workers Rate Limiting API por localidade Cloudflare: store 30/min; info e fetch 60/min por rota.
- Limite adicional de 12/min por combinação rota + recurso em `/api/info` e `/api/fetch`.
- A chave do recurso é SHA-256 de `rota:idHash`; o `idHash` não é reutilizado diretamente como chave do contador.
- Sem persistência de IP ou metadados de cliente
- Bloqueio leve de crawlers e previews conhecidos antes das rotas de aplicação.
- O bloqueio no Worker reduz D1/CPU, mas requisições que chegam ao Worker ainda contam para o plano da Cloudflare.
- O binding é local a cada ponto de presença, eventualmente consistente e permissivo; não é contador global exato nem sistema contábil.
- Se o binding falhar, o código mantém disponibilidade com fallback em memória e registra somente erro genérico.

## Headers de segurança

### HTML (GET /)
- CSP: `default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; frame-src 'none'; frame-ancestors 'none'; manifest-src 'self'; worker-src 'self'; base-uri 'self'; form-action 'self'`
- HSTS: `max-age=31536000; includeSubDomains; preload`
- X-Frame-Options: `DENY`
- Referrer-Policy: `no-referrer`
- Cache-Control: `no-store`
- Cross-Origin-Resource-Policy: `same-origin`
- Cross-Origin-Opener-Policy: `same-origin`
- Permissions-Policy: `camera=(), microphone=(), geolocation=(), payment=()`
- X-Robots-Tag: `noindex, nofollow, noarchive, nosnippet`
- Retry-After: `60` somente em respostas `429`

### JSON (API)
- Content-Type: `application/json; charset=utf-8`
- Cache-Control: `no-store`
- Referrer-Policy: `no-referrer`
- X-Content-Type-Options: `nosniff`
- Cross-Origin-Resource-Policy: `same-origin`
- Cross-Origin-Opener-Policy: `same-origin`
- Permissions-Policy: `camera=(), microphone=(), geolocation=(), payment=()`
- X-Robots-Tag: `noindex, nofollow, noarchive, nosnippet`

### Bots e crawlers
- `GET /robots.txt` retorna `Disallow: /`.
- User-Agents conhecidos de crawlers e bots de preview recebem `403`.
- Requisições `HEAD`, `Purpose: prefetch`, `X-Purpose: preview` ou `Sec-Purpose: prefetch/prerender/preview` recebem `403`.

## Toolchain e compatibilidade de distribuição

- Node.js >=22.12.0, npm >=10.9.2; `.npmrc` exige engines e bloqueia scripts de instalação.
- Dependências diretas fixadas e `package-lock.json` versionado; instalação reproduzida por `npm ci`, com dependências opcionais da plataforma.
- `npm run typecheck` verifica Worker e cliente em configurações próprias; esbuild continua responsável pelo bundle.
- Testes usam Vitest 4 e `@cloudflare/vitest-plugin`, com migrations reais lidas do disco e D1 local isolado por arquivo.
- Build preenche o marcador de cache do service worker com hash dos assets públicos. O fallback offline consulta somente o cache da versão ativa.
- O limite de plaintext no formulário é medido em bytes UTF-8 antes da criptografia; o contador visual também usa bytes UTF-8. O `maxlength` de 65.536 code units permanece como teto superior, não como medida do limite real.
- O cliente valida o envelope antes de derivar chaves; v1/v2 e allowlist de parâmetros permanecem iguais.

Os ícones PWA passam a usar `web-app-manifest-192x192.png`/`512x512.png`, com propósito `any`. Apple Touch usa `apple-touch-icon.png`. O build preserva os URLs legados `favicon.png` e `pwa-icon*.png` como aliases. Assets adicionais continuam publicados e o output é substituído somente após build completo.

## Distribuição por release

A release 1.2.2 conserva schema, migrations 0001/0002, API, TTL e envelopes v1/v2. O controlador opcional em `tools/upstream-sync/` pertence à manutenção do repositório privado e não é binding, rota ou dependência do Worker. Contratos do overlay e limites de automação estão em [SINCRONIZACAO-DEMO.md](SINCRONIZACAO-DEMO.md).
