# Release Notes — LockBrief v1.0.0

Data: 2026-05-22

## Resumo

Primeira release pública do LockBrief: compartilhamento de segredos efêmeros com criptografia no navegador, armazenamento D1 somente do envelope criptografado e suporte a leitura única ou múltipla até expiração.

## Entrega

- Worker Cloudflare com D1, Cron Trigger e assets estáticos.
- Cliente TypeScript com Web Crypto API.
- Criptografia AES-GCM-256 no navegador.
- Senha adicional com PBKDF2-SHA256 e HKDF-SHA256.
- Links com chave no fragmento `#`, nunca enviado ao servidor.
- `POST /api/store`, `POST /api/info`, `POST /api/fetch`, `GET /api/health`.
- Página pública `/privacidade`.
- Documentação técnica em `docs/`.
- CI com typecheck, build, testes e `git diff --check`.
- Deploy por Wrangler local, Workers Builds/GitHub e Deploy Button.

## Segurança e privacidade

- O Worker nunca recebe plaintext, chave de descriptografia ou senha adicional.
- O banco D1 não armazena IP, user-agent, cookies, analytics ou dados pessoais.
- Erros públicos são genéricos para não revelar se um segredo expirou, foi consumido ou nunca existiu.
- `wrangler.toml` é template público sem IDs reais.
- `wrangler.local.toml`, `.dev.vars`, `.env`, tokens, secrets e `database_id` real nunca devem ir para GitHub público.

## Deploy

Fluxos suportados:

1. execução local com `npm run dev-init`, `npm run build` e `npm run dev`
2. deploy manual privado com `wrangler.local.toml` e passos explícitos de D1/migrations/deploy
3. Workers Builds/GitHub com `npm run build` e `npm run deploy`
4. Deploy Button oficial da Cloudflare

Observação: o Deploy Button pode gerar um repositório operacional com IDs reais de recursos provisionados. Se a política do operador for zero IDs reais no GitHub, esse repositório deve ser privado ou o deploy deve ser feito manualmente com `wrangler.local.toml`.

## Validação esperada

- `npm run typecheck`
- `npm run build`
- `npm test` com 20 testes
- `git diff --check`
- `npx wrangler deploy --dry-run --outdir /tmp/lockbrief-dry-run`
