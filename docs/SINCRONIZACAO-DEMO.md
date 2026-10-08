# Releases e sincronização segura da demo

## Responsabilidades e estado

`vitorgfaustino/lockbrief` é fonte pública, CI e releases; não tem produção, credenciais ou D1 remoto. `vitorgfaustino/lockbrief-demo` é uma instalação privada que consome releases e conserva sua operação Cloudflare. Outros operadores continuam usando Deploy Button, Workers Builds ou procedimento manual sem depender da demo.

O toolkit em `tools/upstream-sync/` está implementado e testado localmente. Seus YAMLs são templates inativos; não há workflow de sincronização instalado no upstream. A preparação privada está em branch local separada, sem push/PR/merge. v1.2.1 ainda é candidata; o controlador de produção não a incorpora enquanto não existir release estável publicada.

## Política de overlay

O estado privado `.lockbrief/upstream.json` registra `repository`, `tag` e SHA completo da release incorporada. Bootstrap só pode registrar uma referência após comparar o código existente com ela; não inventar estado para contornar conflitos. `.lockbrief/sync-policy.json` registra `protectedPaths` adicionais, por nome de arquivo ou prefixo terminado em `/`, depois de inventário humano das personalizações.

O controlador consulta exclusivamente releases do upstream oficial, ignora drafts/prereleases e escolhe maior semver estável. Resolve as tags em Git, confere que a tag anterior continua no SHA registrado, impede downgrade e exige ancestralidade. Publicação reconfirma a tag e que a release escolhida ainda é a mais recente.

Compara snapshots anterior/novo com a árvore da demo. Diferenças locais desconhecidas, inclusive arquivos extras ou sem mudança upstream, bloqueiam o overlay. Adições, remoções e modos acompanham a release. Manifesto, lockfile e engines precisam concordar. Symlinks, submódulos, caminhos inseguros, reestruturações arquivo/diretório e arquivos privados no snapshot bloqueiam. Checkout deve estar limpo.

Preserva integralmente `wrangler.toml`, `.github/`, `.lockbrief/`, `tools/upstream-sync/`, configurações `.env*`/`.dev.vars*`/Wrangler privadas, `dist`, `node_modules` e `.wrangler`. O template público mudar exige revisão manual; qualquer mudança em migrations também bloqueia, mesmo se o operador proteger esse caminho. Proteger manifesto, lockfile ou `.npmrc` exige reconciliação manual. O controlador/workflows privados não atualizam a si mesmos automaticamente; revisar versões futuras separadamente.

Antes e depois do overlay verifica conteúdo/modos dos arquivos protegidos. Em erro de aplicação restaura os arquivos tocados e estado anterior. Arquivos ignorados não são copiados nem apagados. O build da instalação substituirá `dist`: converter personalizações exclusivas nele em fontes antes de atualizar.

## Bootstrap privado — checkpoint humano

1. Publicar primeiro o commit upstream após aprovação; obter CI verde para seu SHA, só então criar tag nova e release estável. Não mover tags anteriores.
2. Inventariar a instalação real, dashboard, arquivos ignorados e `dist`; guardar backup privado dos arquivos e configurações. A inspeção GitHub não consegue verificar arquivos que nunca foram enviados ao Git. Não registrar esses valores no upstream.
3. Confirmar Workers Builds: produção somente após merge em `main`, builds/previews de branches e PRs desabilitados para branches de sync. Um simples push privado pode acionar Cloudflare conforme o dashboard. Nenhuma escrita remota de bootstrap/PR é autorizada antes dessa confirmação. Não adicionar deploy concorrente em Actions.
4. Criar branch local `codex/prepare-release-sync` a partir da main privada limpa. Copiar `tools/upstream-sync/` da release revisada. Instalar templates como `.github/workflows/upstream-sync.yml` e `sync-ci.yml`.
5. Arquivar CI legada e fechamento de PR externo em `.lockbrief/*.yml.disabled` no bootstrap privado, após revisão. A CI antiga usa Wrangler operacional no dry-run e não valida PRs do bot; o fechamento herdado pode fechar a PR do bot. Não reaproveitar esses fluxos. A nova CI privada usa sandbox público e dispatch no SHA.
6. Registrar estado inicial confirmado, por exemplo v1.2.0 no commit público `bb3bad7ddb565d54a601d10ee58c2f5d2f9b6d4b`, e política explícita. Preservar Wrangler privado byte a byte. Revisar diff antes de commit/push. O bootstrap deve estar na main privada para aceitar dispatch; esse merge também depende de aprovação e do escopo Cloudflare confirmado.
7. A base 1.2.0 conserva dependências antigas com advisories altos atuais. O bootstrap sozinho não corrige o produto nem deve ser anunciado com CI verde. Depois da release estável, preparar sua atualização, validar integralmente e revisar antes de merge. Alternativamente combinar bootstrap e primeira atualização estável em uma entrega privada manual revisada, validar o produto isoladamente e instalar o dispatcher na main antes de habilitar automação futura.
8. Nas configurações Actions privadas, permitir criação de PR pelo `GITHUB_TOKEN`; configurar variável `SYNC_PR_WRITES_APPROVED=true` apenas após os passos anteriores. Configurar ambiente `demo-sync` e reviewers se disponível no plano. Sem suporte a regras de proteção, manter o despacho e merge sob controle humano; não alegar enforcement que não existe.

## Execução e CI

Schedule semanal faz somente detecção com `contents: read`. `workflow_dispatch` tem modo padrão `detect`. Criar PR exige modo `prepare-pr`, confirmação literal `ESCOPO-CLOUDFLARE-REVISADO` e variável habilitada; usar dispatch somente na main revisada. O job privado de escrita tem `contents: write`, `pull-requests: write`, `actions: write`; não precisa PAT, chave de App ou token Cloudflare. Checkout não persiste credenciais. Token é fornecido somente ao publisher, não ao npm/testes. Nenhum segredo privado é fornecido à fonte pública.

Preparação e CI executam: npm ci sem scripts com opcionais, audit high, typecheck cliente/Worker, build, integração, tooling/PWA, testes do sync, migrations locais duas vezes e Wrangler dry-run. Sandbox copia a árvore candidata, inclui personalizações protegidas de código/assets e injeta somente o template público em uma cópia descartável. Nunca substitui Wrangler operacional, mesmo temporariamente. HOME é isolado, sem credenciais Cloudflare; não executa `--remote`.

PR contém versão anterior/nova, tag/SHA, arquivos adicionados/removidos/modificados, preservações e resultados. Uma branch existente não é reescrita; main remota diferente do planejamento exige refazer o gate. Não cria PR para versão já incorporada. Não há automerge.

O publisher despacha `sync-ci.yml` explicitamente no SHA gerado; CI confirma SHA, pai, árvores completas e preservação operacional, e executa matriz Node 22/npm 10.9.2 e Node 24/npm 11.16.0. Observar as duas execuções aprovadas para esse mesmo SHA antes do merge. Events de push com GITHUB_TOKEN não iniciam workflows novos; eventos de PR desse token podem gerar runs aguardando aprovação. Dispatch evita depender deles, mas PR aberta não equivale a CI ou aprovação. Referência: [GitHub workflow triggers](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

CI/template/testes estão validados localmente; permissões, dispatch e execução Ubuntu não foram homologados no GitHub nesta entrega. Se dispatch falhar após abrir PR, mantê-la sem merge, disparar manualmente para o SHA exato e investigar o erro. Mudanças de configuração operacional, schema e toolkit continuam manuais.

## Falhas e recuperação

| Condição | Ação segura |
|---|---|
| Release indisponível, tag movida ou histórico divergente | Interromper sem overlay/publicação; investigar upstream e estado privado |
| Conflito, schema ou template modificado | Handoff com caminhos e motivo, sem valores operacionais; revisar impacto antes de novo plano |
| Aplicação interrompida com erro | Restaurar arquivos tocados; em morte do processo conservar backup/checkout anterior. Workflow usa checkout descartável, main permanece intacta |
| Instalação, audit ou teste reprovado | Sem PR; candidato local pode permanecer para diagnóstico. Não forçar instalação, ignorar audit ou reutilizar relatório antigo |
| Falha após criação de branch/PR | Sem force/repetição cega; inspecionar artefatos existentes e SHA, fechar PR/branch somente após decisão humana |
| D1 incompatível | Parar antes do merge/deploy; analisar schema e ledger localmente. Não recriar banco nem aplicar migrations remotas pelo sync |
| Build Cloudflare após merge reprovado | Inspecionar logs sanitizados e configuração preservada; não presumir que versão publicada mudou. Recuperação da plataforma requer aprovação operacional |
| Retornar ao código anterior | PR de revert revisada, configuração protegida intacta, CI completa e publicação operacional autorizada; sem reset/force |

Não existe rollback remoto automático. Reverter código não desfaz migrations nem restaura dados. Se schema mudou em intervenção manual, verificar compatibilidade de leitura/escrita e plano de recuperação D1 autorizado antes de retornar Worker. Não apagar D1, ledger, bindings, secrets ou rotas. Rollback de código pode introduzir novamente vulnerabilidade corrigida; documentar motivo e prazo.

## Alternativa manual

Seguir `docs/ATUALIZACAO.md` com upstream oficial como leitura, inventário/backup privado e overlay protegido por delta. Comparar a release anterior incorporada com tag+SHA estável escolhida, reconciliar remoções, conservar a configuração operacional inteira e parar em conflito/schema. Validar em cópia com template público, revisar diff e obter aprovação antes de push/merge/deploy. Não usar main móvel como versão da demo e não usar `--allow-unrelated-histories`, reset hard ou push forçado.

Antes do deploy de uma instalação, confirmar quotas e configuração reais e homologar smoke remoto sob autorização específica. Gates locais demonstram compatibilidade do código; não atestam recursos ou disponibilidade da conta Cloudflare.
