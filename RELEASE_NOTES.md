# Release Notes — LockBrief v1.2.1 (candidata)

Preparada em 08/10/2026; ainda sem publicação, tag ou CI remota. A última release estável consultada é v1.2.0. O commit final deve receber CI aprovada antes da criação de uma nova tag; nenhuma tag existente será reutilizada.

## Correções

Corrige consumo único no fallback D1, metadados após consumo e contabilização de cleanup. Atualiza dependências, fixa versões diretas, bloqueia scripts de instalação e valida Worker e cliente em Node 22/24 e npm 10/11. O build substitui assets somente após sucesso e invalida o cache PWA por conteúdo; novos ícones do mantenedor mantêm aliases das URLs anteriores.

O cliente valida envelopes antes do KDF, trata falhas de rede sem repetir o fetch consumidor, valida o limite UTF-8 e escapa aspas em senha apresentada no resultado. AES-GCM, PBKDF2/HKDF, envelopes v1/v2, links, API, TTL, migrations 0001/0002 e AGPL-3.0 permanecem compatíveis.

## Atualização

Seguir `docs/ATUALIZACAO.md`: preservar Wrangler operacional, D1, bindings, secrets, domínio, rotas e personalizações; reconstruir Worker e assets juntos. Não há migration nova ou binding novo em relação a 1.2.0. Ao partir de 1.1.x, revisar manualmente os rate limiters de 1.2.0. Clientes 1.1.x já abertos continuam sem compreender novos envelopes v2 com senha; recarregar antes de criar/abrir novas notas, preservando a sessão de uma nota já consumida.

Node mínimo 22.12.0 e npm mínimo 10.9.2; manter dependências opcionais. Revisar versões e comandos definidos no Workers Builds. Personalizações somente em `dist` precisam ser reconciliadas com as fontes antes do build.

## Sincronização opcional

`tools/upstream-sync/` fornece controlador e templates privados, sem credenciais da demo no upstream. Consome somente releases estáveis por tag+SHA, preserva configuração operacional, bloqueia conflitos e schema e exige revisão humana de PR/CI/merge. Instalações independentes não dependem dele. Bootstrap e recuperação em `docs/SINCRONIZACAO-DEMO.md`.

## Evidências e pendências

`docs/GATE-FINAL-RELEASE.md` registra os gates finais executados e seus limites. CI Linux, publicação da release, bootstrap/sincronização remota e deploy continuam pendentes de autorização e execução separadas. Não houve deploy ou migration remota nesta preparação.

---

# Release Notes — LockBrief v1.2.0

Data: 2026-08-28

Estado do checkout em 08/10/2026: há correções ainda não lançadas descritas em `CHANGELOG.md` e [`docs/AUDITORIA-UPSTREAM.md`](docs/AUDITORIA-UPSTREAM.md). A seção de validação abaixo registra a entrega histórica de 1.2.0; não é um resultado atual de CI ou deploy. A política atual de instalação bloqueia todos os scripts (`ignore-scripts=true`) em npm 10/11, substituindo a allowlist original.

## Resumo

O LockBrief v1.2.0 fortalece a validação de entrada, a criptografia versionada, a contenção de abuso e a cadeia de fornecimento. A operação foi revisada para permanecer compatível com as limitações do Cloudflare Free, sem depender de WAF pago.

Novas criações usam envelope criptográfico v2. Envelopes v1 produzidos por versões anteriores continuam legíveis, e o formato dos links permanece `#v1` para preservar URLs existentes.

## Destaques de segurança

- Bodies de `/api/store`, `/api/info` e `/api/fetch` são limitados durante a leitura do stream, antes de serem materializados integralmente em memória.
- Campos binários do envelope exigem base64url canônico, e ciphertexts menores que a tag AES-GCM de 128 bits são rejeitados.
- O envelope v2 registra os parâmetros PBKDF2/HKDF aceitos e rejeita custo, domínio HKDF ou versão controlados pelo payload.
- Buffers mutáveis de plaintext, senha derivada, chaves intermediárias, salt, IV e ciphertext são zerados como melhor esforço após o uso.
- Campos sensíveis da interface são limpos após criação, revelação, falha terminal ou saída da página.
- O handler inline incompatível com a CSP foi removido do fluxo de cancelamento da revelação.
- O modelo de confiança documenta que a infraestrutura que entrega o cliente web precisa ser confiável para a integridade do JavaScript.

## Contenção de abuso no Cloudflare Free

- Três bindings do Workers Rate Limiting API protegem armazenamento, leitura e repetição por recurso.
- Limites padrão: `store` 30/min, `info` e `fetch` 60/min por rota, e 12/min por combinação rota + recurso.
- Respostas limitadas usam `429 invalid_request` e `Retry-After: 60`.
- Nenhum IP, cookie ou fingerprint é persistido. A chave do contador por recurso é um novo SHA-256 de `rota:idHash`.
- Um fallback em memória por isolate permanece ativo quando o binding não está configurado ou fica indisponível.
- O rate limiting ocorre depois que o Worker iniciou, é local por localidade Cloudflare e eventualmente consistente. Ele reduz uso de D1/CPU, mas não impede que a invocação conte na cota diária.
- WAF custom rules e Turnstile continuam opcionais; o fluxo padrão não depende desses recursos.

## Cadeia de fornecimento e CI

- Dependências de build, teste e deploy foram atualizadas e auditadas.
- `allowScripts` e `strict-allow-scripts=true` restringem scripts de instalação às versões revisadas de `esbuild` e `workerd`; `fsevents` permanece explicitamente negado.
- A CI inicializa uma versão fixa do npm, usa instalação reprodutível, executa auditoria de vulnerabilidades e mantém permissões mínimas.
- GitHub Actions são fixadas por SHA imutável e o checkout não persiste credenciais.
- Código de PR externo não é instalado nem executado no job de qualidade. PRs do mantenedor e Dependabot continuam cobertos.
- Dependabot monitora semanalmente dependências npm e GitHub Actions, sem merge ou deploy automático.

## Privacidade e retenção

- A documentação diferencia remoção do banco D1 ativo do histórico gerenciado pelo D1 Time Travel.
- A política pública explica o processamento de metadados de infraestrutura e a amostragem padrão de Workers Logs.
- O código não registra body, payload, `idHash`, chave, senha ou plaintext.
- A zeroização em JavaScript é declarada como melhor esforço: strings e cópias internas do runtime não oferecem garantia de limpeza física imediata.

## Compatibilidade

- Envelopes v1 continuam disponíveis para leitura com os parâmetros legados implícitos.
- Novos segredos usam envelope v2 com parâmetros explícitos.
- Links existentes `#v1.<rawId>[.<key>]` não mudam.
- Clientes 1.1.x em cache não devem ser usados para abrir novos envelopes v2 protegidos por senha; publique Worker e assets da v1.2.0 juntos e valide a atualização do PWA.
- Não há migration D1 nova nesta versão.
- A API mantém os contratos existentes e adiciona `429` às rotas sensíveis quando os limites são excedidos.

## Atualização de instalações existentes

Use [`docs/ATUALIZACAO.md`](docs/ATUALIZACAO.md) como runbook canônico. Antes de atualizar:

1. preserve `wrangler.local.toml`, `.dev.vars`, `.env*`, bindings D1, `database_id`, variables, secrets, routes e domínio;
2. não substitua um `wrangler.toml` operacional pelo template do upstream;
3. reconcilie manualmente `STORE_RATE_LIMITER`, `READ_RATE_LIMITER` e `RESOURCE_RATE_LIMITER` quando a instalação tiver configuração operacional própria;
4. mantenha namespaces distintos quando várias instâncias na mesma conta não devam compartilhar contadores;
5. publique Worker e Static Assets da mesma versão e valide que o service worker não mantém o cliente 1.1.x ativo;
6. execute migrations e deploy somente após revisar a configuração operacional protegida.

## Validação da release

Validações locais concluídas:

- `npm ci` com política estrita de scripts;
- `npm audit --audit-level=high`: 0 vulnerabilidades;
- `npm run typecheck`;
- `npm run build`;
- `npm test`: 48 testes aprovados em 2 arquivos;
- `git diff --check`;
- `wrangler deploy --dry-run` com D1 e os três bindings de rate limit;
- smoke local de home, health check, criação, consulta, consumo único e resposta `429` com `Retry-After: 60`.

## Pendências antes da publicação operacional

Esta preparação não executa deploy nem altera a conta Cloudflare. Antes de publicar uma instalação:

- confirmar o plano Workers Free na conta real;
- reconciliar os bindings sem sobrescrever D1, routes ou configuração operacional;
- validar que a conta aceita os bindings do Rate Limiting API;
- testar envelopes v1/v2, concorrência de leitura única, cleanup e limites no ambiente remoto;
- observar consumo de Workers, CPU, D1 e logs sem registrar material sensível;
- revisar controles gratuitos disponíveis no domínio ou zona, sem presumir WAF pago.

## Risco residual conhecido

- Rate limiting no Worker não é proteção global exata nem economiza a invocação que já chegou ao runtime.
- Ataques distribuídos entre localidades Cloudflare podem superar os limites locais.
- Um origin ou cliente web comprometido pode capturar dados antes da criptografia.
- Senhas humanas fracas continuam sujeitas a tentativa offline contra o envelope criptografado.
- D1 Time Travel pode preservar o envelope removido do banco ativo durante a janela do plano.
