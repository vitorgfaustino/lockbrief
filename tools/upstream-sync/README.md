# Controlador opcional da demo

Implementado com módulos nativos de Node.js, sem dependência em runtime do Worker. Não participa do provisionamento de instalações independentes. Templates em `workflows/` são inativos no upstream.

O runbook completo está em [`docs/SINCRONIZACAO-DEMO.md`](../../docs/SINCRONIZACAO-DEMO.md).

- `node tools/upstream-sync/cli.mjs detect CHECKOUT`: consulta releases oficiais e apresenta conflitos sem alterar o checkout.
- `node tools/upstream-sync/cli.mjs prepare CHECKOUT /tmp/plano.json`: overlay local e dez gates isolados; não faz commit ou publicação. Usar branch local limpa. Falha de validação mantém o candidato local para diagnóstico, sem PR.
- `publish`: usado somente pelo workflow privado habilitado após revisão operacional; revalida o plano/resultado, verifica main remota, cria branch exclusiva e PR, despacha CI no SHA exato. Não faz merge/deploy. Exige `GH_TOKEN`, `GITHUB_REPOSITORY` e `SYNC_PR_WRITES_APPROVED=true`.
- `ci`: reconstrói o overlay a partir do pai do commit, confirma a árvore completa e preservação operacional e repete os gates. Exige `EXPECTED_SHA`.

`engine.mjs` realiza planejamento, verificação e overlay reversível. `source.mjs` consulta apenas `vitorgfaustino/lockbrief`, pagina releases e confere tags anteriores. `validate.mjs` usa sandbox com Wrangler público e HOME temporário, sem ambiente GitHub/Cloudflare herdado. `publish.mjs` faz chamadas GitHub somente no fluxo explícito de publicação privada.

Testes: `npm run test:sync`. Fixtures Git locais e API simulada; não criam recursos ou PRs reais.
