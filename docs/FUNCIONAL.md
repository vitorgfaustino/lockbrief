# LockBrief — Especificação Funcional (FUNCTIONAL)

## Rotas

| Método | Rota | Descrição | Status |
|---|---|---|---|
| GET | `/` | Serve HTML da aplicação | 200 |
| GET | `/privacidade` | Serve política pública de privacidade | 200 |
| GET | `/robots.txt` | Desencoraja indexação e crawling | 200 |
| POST | `/api/store` | Armazena envelope criptografado | 201 |
| POST | `/api/info` | Retorna metadados sem consumir segredo | 200, 404 ou 429 |
| POST | `/api/fetch` | Consome e retorna envelope criptografado | 200 |
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
2. Body ≤ 100 KB
3. JSON válido
4. `idHash` string base64url de 43 caracteres
5. `payload` string JSON válida, envelope com `{v, alg, iv, ciphertext, kdf, salt}`
6. `ttl` ∈ {3600, 86400, 604800}
7. `oneTime` é opcional; qualquer valor diferente de `false` vira leitura única
8. `idHash` não pode existir no banco (erro genérico em duplicata)

### Responses
- `201` + `{ "ok": true }`
- `400` + `{ "error": "invalid_request" }`
- `404` + `{ "error": "not_available" }` (colisão de idHash)

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
4. Fallback, se `DELETE ... RETURNING` falhar no runtime: `UPDATE` → `changes()` → `SELECT` pelo token → `DELETE`
5. Se nenhum resultado: tentar `SELECT WHERE one_time = 0` (multi-leitura)
6. Se nenhum resultado: erro genérico

### Responses
- `200` + `{ "payload": "<string>" }`
- `404` + `{ "error": "not_available" }`

## API: POST /api/info

Retorna metadados do segredo **sem consumi-lo**.

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

## Abuse Controls

- Contadores em memória (escopo global do isolate)
- `POST /api/store`: 30 requests/min
- `POST /api/info`: 60 requests/min
- `POST /api/fetch`: 60 requests/min
- Sem persistência de IP ou metadados de cliente
- Bloqueio leve de crawlers e previews conhecidos antes das rotas de aplicação.
- O bloqueio no Worker reduz D1/CPU, mas requisições que chegam ao Worker ainda contam para o plano da Cloudflare.

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
