# Auditoria local do upstream — 08/10/2026

Esta auditoria registra o candidato anterior ao versionamento. A revisão final, commit de 1.2.1 e preparação da demo estão em [GATE-FINAL-RELEASE.md](GATE-FINAL-RELEASE.md).

## Escopo e resultado

Auditoria da fonte oficial `vitorgfaustino/lockbrief`, inicialmente em `bb3bad7`. A consulta pública de `refs/heads/main` confirmou o mesmo commit durante a auditoria. O checkout começou limpo; os novos assets adicionados pelo mantenedor durante o trabalho foram preservados e suas referências foram integradas após autorização explícita.

Resultado: gates locais aprovados, com correções ainda não lançadas na árvore de trabalho. Não houve commit, push, merge de PR, deploy, criação de recursos, acesso a conta Cloudflare ou alteração de instalação de terceiro. `package.json` continua em 1.2.0; não foi criada uma release nova.

O upstream é exclusivamente fonte e distribuição. Deploy Button, Workers Builds e comandos remotos são destinados às contas independentes dos operadores. Validação local e inspeção da plataforma não equivalem a comprovação de provisionamento remoto.

## Achados e correções

| Área | Evidência anterior | Correção aplicada |
|---|---|---|
| Consumo por fallback | Teste forçando ausência de RETURNING consumiu a linha e recebeu somente 404; `meta.changed` não existe no retorno D1 atual | Usar `meta.changes`; DELETE condicionado ao mesmo token |
| Metadados após consumo | Teste de interrupção do fallback recebeu 200 em `/api/info` para sobra consumida | Excluir `consumed_at IS NOT NULL` |
| Cleanup | Campo incorreto impedia contabilizar remoções | Usar `meta.changes`, com log agregado sem IDs/conteúdo |
| Dependências | Auditoria do lockfile original encontrou seis ocorrências de severidade alta na cadeia de desenvolvimento | Wrangler 4.148.0, plugin Vitest 1.3.7, tipos atualizados e source-map-js corrigido; override restrito de sharp 0.35.5 no Miniflare |
| Instalação | npm mínimo 11 e allowlist por versão não se aplicavam ao npm 10 documentado para Workers Builds | Bloquear todos os scripts de instalação em npm 10/11; exigir engines e usar lockfile com versões diretas fixadas |
| Tipos do cliente | `tsconfig.json` excluía `src/client`; esbuild compilava sem verificar tipos | Configuração DOM própria e inclusão no comando typecheck; tipos de buffers/elementos corrigidos |
| Envelope recebido | O cliente não repetia a allowlist antes do KDF | Validar o envelope antes da derivação, mantendo formatos e parâmetros existentes |
| Falhas de rede | Rejeição de fetch/JSON podia deixar criação ou consulta sem estado terminal | Estado genérico indisponível, limpeza de campos nas falhas terminais e ausência de retry automático do fetch consumidor |
| Formulário | Limite em caracteres permitia exceder 64 KB com Unicode | Validar bytes UTF-8 antes de criptografar e preservar o texto na validação local |
| Senha no resultado | Aspas não eram escapadas em atributo `value` | Escape de aspas; senha com sintaxe de atributo testada no Chrome sem criar atributos extras |
| PWA/build | Cache tinha nome fixo v1.1.0; saída anterior podia conservar arquivos removidos | Cache por hash de conteúdo, fallback restrito à versão ativa e substituição de output completo somente após sucesso |
| Migrations nos testes | Schema duplicado e erros SQL ignorados | Ler migrations reais e aplicar com ledger; testes de upgrade com dados e repetição |
| Documentação | AI-START declarava v1.1.0; runbook ainda dizia ausência de novos bindings ao partir de 1.1.0 | Documentos sincronizados com o estado atual, histórico de release separado das correções não lançadas |

Os novos ícones do mantenedor estão integrados ao HTML e manifesto: Apple Touch 180px, favicon 96px e PWA 192px/512px. Ícones do manifesto usam propósito `any`; não foi presumida área segura maskable. O build mantém aliases para os caminhos antigos e continua copiando assets adicionais de instalações personalizadas. Arquivos-fonte gráficos do mantenedor não foram recriados ou removidos pela auditoria.

## Validação executada

| Gate | Resultado e alcance |
|---|---|
| Baseline original | Typecheck do Worker, build e 48 testes passaram; auditoria atual do npm falhou por advisories altos. Os dois testes adversariais novos falharam antes da correção |
| Instalação limpa | `npm ci` em snapshots sem node_modules/dist: Node 22.23.2/npm 10.9.2 e Node 24.18.1/npm 11.16.0, macOS arm64; scripts de instalação desativados |
| Tipos/build | Worker e cliente aprovados nos dois runtimes; versões compatíveis sem force/legacy-peer-deps |
| Aplicação | 56 testes em quatro arquivos: Worker/D1, envelopes v1/v2, vetor legado fixo independente, concorrência, fallback interrompido, expiração e upgrade de schema |
| Build/PWA | Cinco testes Node: cache por conteúdo e determinismo, recuperação offline na versão atual, exclusão de cache legado, não interceptar conteúdo sensível, preservação do output em falha e remoção de arquivos gerados obsoletos |
| D1 local CLI | `npm run dev-init` aplicou 0001/0002; segunda execução informou nenhuma migration pendente |
| Empacotamento | Wrangler `deploy --dry-run` aprovou Worker, Static Assets, D1 e três bindings de rate limit; nenhuma publicação |
| Dependências | `npm audit --audit-level=high` retornou zero vulnerabilidades conhecidas após a correção do lockfile |
| Distribuição | Gate do template público e arquivos privados rastreados aprovado; manifesto/lockfile sincronizados |
| CI | YAML validado; matriz 22/24, permissões mínimas e SHAs preservados, telemetria Wrangler desativada, somente validação local/dry-run. A nova CI não foi executada no GitHub nesta entrega |
| Chrome local | Criação, consumo único, multi-leitura, senha incorreta/correta com somente um fetch, chave separada, plaintext Unicode/HTML literal, escaping, limite UTF-8 e falhas de rede aprovados; sem pageerror |
| PWA real | Registro em Chrome, cache legado removido, nove assets públicos no cache, ícones com 200 e viewport 390px sem overflow; inspeção visual local |
| Custódia | `git diff --check` aprovado; `wrangler.toml`, migrations distribuídas e LICENSE sem diferença em relação ao commit inicial |

Os testes de integração usam D1 isolado por arquivo, sem bancos de desenvolvimento/produção. A simulação de ausência de RETURNING intercepta apenas essa instrução; UPDATE, SELECT e DELETE do fallback rodam no D1 real local. O teste de migration preserva o envelope byte a byte e o default de leitura única ao evoluir de 0001 para 0002.

Os snapshots reproduzem os arquivos candidatos locais; não são uma nova versão já publicada. Linux está configurado na CI, mas não foi executado localmente. O smoke de Chrome utilizou ferramentas temporárias fora das dependências distribuídas. Não houve matriz de navegadores, certificação de acessibilidade ou pentest independente.

## PRs do Dependabot e falhas de clones

Consultas públicas, sem execução ou merge do código dos PRs:

| PR | Assinatura observada | Interpretação |
|---|---|---|
| [15 — Vitest 5](https://github.com/vitorgfaustino/lockbrief/pull/15) | CI falhou na resolução: Vitest 5.0.3 contra peer `^4.1.0` do pool 0.22.0 | Não usar Vitest 5 com esta integração. O plugin atualizado também declara Vitest 4 como peer |
| [9 — Cloudflare toolchain](https://github.com/vitorgfaustino/lockbrief/pull/9) | CI falhou com `ESTRICTALLOWSCRIPTS` para workerd 1.20260903.1 | Falha da allowlist daquela branch; não prova quebra de build da main original |
| [16 — tipos Node 26](https://github.com/vitorgfaustino/lockbrief/pull/16) | CI chegou à auditoria e falhou por sharp/undici altos | O log não demonstra regressão dos tipos. Esta entrega mantém tipos Node 22 coerentes com o alvo mínimo e corrige a cadeia separadamente |

O PR 6 de checkout também estava aberto; nenhuma atualização major de Action foi incorporada. Actions atuais continuam fixadas por SHA. PRs não foram fechados, comentados ou alterados. Falha de um clone ainda exige seus próprios commit, versões Node/npm, lockfile, logs sanitizados e classificação do Wrangler; nenhum clone operacional foi auditado aqui.

## Impacto para instalações

| Categoria | Impacto |
|---|---|
| Correções na fonte oficial | Código, dependências/lockfile, npm, testes, build/PWA, CI e documentação corrigidos localmente, ainda sem publicação no Git |
| Incorporado ao atualizar | Correções de consumo/metadados, validação e erros do cliente, tipos, ícones, aliases e cache PWA após atualizar fonte/dependências e reconstruir Worker + assets da mesma versão |
| Ajuste manual existente | Preservar Wrangler operacional/privado, D1, secrets, rotas, domínio, cron, observabilidade e dashboard. Revisar Node/npm antigos definidos no painel, comandos de build/deploy, personalizações e eventuais configurações que reativem scripts |
| Somente primeira instalação | Provisionamento independente via Deploy Button/Workers Builds ou criação manual na conta do operador; `.node-version` orienta builds novos. A auditoria não altera recursos nem configura uma conta |
| Migration | Nenhuma migration nova; 0001/0002 intactas. Repetição segura depende do ledger `d1_migrations`; o ALTER TABLE de 0002 não é SQL isoladamente idempotente |

A atualização não exige novo binding, secret ou variável de runtime. Para instalações 1.1.x, os rate limiters introduzidos em 1.2.0 continuam sendo reconciliação manual da configuração protegida; sem eles, o fallback em memória permanece disponível. Não substituir o template inteiro nem trocar namespaces automaticamente.

O overlay deve inventariar e excluir personalizações, inclusive branding, fonte, assets, políticas e scripts. Uma branch de backup protege apenas conteúdo commitado; arquivos ignorados precisam de backup privado próprio. `dist` é gerado e será substituído pelo build: alterações exclusivas nele devem ser reconciliadas com as fontes antes de reconstruir. O runbook foi atualizado para explicitar esses limites.

## Compatibilidade e riscos residuais

- Schema, TTL, API de sucesso, fragmentos `#v1`, envelopes v1/v2, AES-GCM/PBKDF2/HKDF e licença AGPL-3.0 foram preservados. Um vetor v1 independente continua abrindo.
- Um cliente 1.1.x já carregado não passa a compreender envelopes v2 com senha só porque o servidor foi atualizado. Publicar Worker + assets juntos e recarregar sessões antes do uso; não recarregar uma nota de leitura única já consumida enquanto seu envelope for necessário em memória.
- Base criada manualmente com schema equivalente mas sem ledger exige reconciliação manual. Não ignorar erro de coluna duplicada, apagar histórico ou recriar D1.
- Dependências opcionais contêm os binários nativos: `--omit=optional` pode quebrar instalação/build. Não reativar scripts para esconder esse problema.
- O SDK publica Miniflare como dependência de versão alpha; a combinação foi validada localmente. Revisar o override de sharp ao atualizar o SDK e repetir os gates antes de adotá-lo.
- Rate limiting continua local/eventualmente consistente; ataques distribuídos e invocações já contadas não são eliminados. Origin confiável, extensões, clipboard, memória JavaScript e D1 Time Travel continuam nos limites documentados de segurança e privacidade.
- O upstream não atesta quotas/plano, jurisdição, permissões, routes, logs, namespaces ou provisionamento da conta de terceiros. Essas decisões permanecem com cada operador.

## Referências técnicas consultadas

- [Imagem do Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/): npm padrão e seleção de Node por arquivo.
- [Deploy Button](https://developers.cloudflare.com/workers/platform/deploy-buttons/): comandos customizados e migrations por binding.
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/): produção e previews separados.
- [Migração para Vitest plugin](https://developers.cloudflare.com/workers/testing/vitest-integration/migration-guides/migrate-to-vitest-plugin/): renomeação mantendo API/configuração.
- [Retorno D1](https://developers.cloudflare.com/d1/worker-api/return-object/) e [migrations](https://developers.cloudflare.com/d1/reference/migrations/): `meta.changes` e histórico de migrations.
- [npm ignore-scripts](https://docs.npmjs.com/cli/v11/commands/npm-install/): scripts explícitos de build/test continuam disponíveis.

Próximo passo da fonte: revisar o diff candidato, incluindo os assets do mantenedor, e decidir sua publicação Git/release. Nenhum deploy Cloudflare faz parte desse passo.
