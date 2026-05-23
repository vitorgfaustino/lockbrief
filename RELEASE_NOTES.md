# Release Notes — LockBrief v1.1.0

Data: 2026-05-23

## Resumo

Esta versão consolida o fluxo de abertura segura com confirmação antes do consumo, melhora a experiência visual em desktop/mobile, adiciona suporte PWA instalável no celular e reforça a documentação operacional para AGPL-3.0, Deploy Button, Workers Builds e atualizações por IA.

O modelo de segurança principal não muda: o Worker continua sem receber plaintext, chave de descriptografia ou senha adicional. A criptografia e a descriptografia permanecem no navegador.

## Principais mudanças

- Novo ponto explícito de consumo: **"Revelar mensagem"**.
- `/api/info` retorna apenas `oneTime`, `expiresAt` e `requiresPassword`, sem consumir a nota.
- Chave ou senha só são solicitadas depois da confirmação e depois de `/api/fetch`.
- Tela de criação reorganizada em blocos: Mensagem, Proteção, Expiração e Leitura.
- Proteção por chave automática ou senha humana, sem combinação chave + senha no mesmo segredo.
- Senha humana pode ser definida pelo usuário ou gerada localmente no navegador.
- Tela de resultado inclui resumo local seguro da configuração.
- Botões de copiar na tela de link criado exibem feedback **"Copiado"**.
- Ao desativar **"Destruir após leitura"**, a UI informa que a nota poderá ser lida sem limite até expirar.
- `/api/info` tem rate limit em memória.
- Bots, crawlers e previews conhecidos são bloqueados antes das rotas da aplicação.
- Leitura única usa `DELETE ... RETURNING` no caminho principal para remover e retornar o envelope na mesma instrução.
- Respostas JSON usam headers de isolamento consistentes.

## Visual e experiência

- Home atualizada com o título **"Crie um segredo seguro."**.
- Subtítulo introdutório e label visual **"Segredo"** removidos, mantendo acessibilidade via `aria-label`.
- Microcopy abaixo da mensagem encurtado para **"Criptografia local."**.
- Contador de caracteres e microcopy ajustados para não quebrar de forma estranha em desktop, tablet e mobile.
- Layout mobile usa área de conteúdo full-width alinhada ao menu, sem espaçamento vertical externo e mantendo padding interno.
- Layout desktop amplo usa largura máxima de 1366px, preservando a coluna principal e ampliando a sidebar informativa.
- Rodapé público exibe versão, privacidade, **Código AGPL-3.0** e **Criado por Vitor Faustino** de forma compacta.

## PWA

- Adicionado manifesto PWA para instalação em celulares e desktops compatíveis.
- Adicionado service worker online-first.
- Adicionados ícones PWA quadrados em `src/client/assets/`, incluindo placeholder substituível por logo final.
- `/manifest.webmanifest`, `/sw.js` e ícones PWA são publicados como Static Assets.
- O PWA não adiciona fila offline, push notification, background sync, IndexedDB, `localStorage` ou cookies.
- O service worker não cacheia HTML, `/api/*`, envelopes, payloads, segredos, chaves ou senhas.

## Segurança e privacidade

- O Worker continua sem receber plaintext, chave de descriptografia ou senha adicional.
- A chave continua no fragmento `#...`, que não é enviado em requisições HTTP.
- `requiresPassword` é metadado técnico mínimo derivado do envelope criptografado; ele não revela senha nem conteúdo.
- `/api/fetch` continua sendo o único endpoint que entrega o envelope criptografado.
- Leitura única continua removendo o registro no primeiro fetch confirmado.
- Retentativas de chave ou senha incorretas usam apenas o envelope em memória e não fazem novo fetch.
- O bloqueio de bots avalia User-Agent e headers de prefetch apenas durante a requisição, sem persistência.
- O bloqueio dentro do Worker reduz D1/CPU; economia real de Worker requests exige regras na borda da Cloudflare.
- Logs de erro do Worker usam mensagens genéricas, sem detalhes internos do D1.
- Nenhum dado sensível é armazenado em `localStorage`, `sessionStorage`, cookies ou CacheStorage.
- CacheStorage do PWA fica limitado a assets públicos estáticos.

## AGPL-3.0 e operação

- Adicionado `docs/LICENCA.md` com obrigações AGPL-3.0, limites de uso, identidade visual e oferta de código-fonte.
- Documentado que cumprir AGPL-3.0 não exige publicar `wrangler.local.toml`, `.dev.vars`, `.env`, tokens, secrets ou `database_id` real.
- Documentada a topologia recomendada para Deploy Button com modificações: repositório operacional privado e fonte correspondente sanitizada pública ou acessível aos usuários.
- Fluxo de atualização por IA agora prioriza usuário leigo, faz poucas perguntas e preserva configuração operacional.
- Regras de atualização proíbem sugerir PR, branch ou push para o upstream oficial `https://github.com/vitorgfaustino/lockbrief.git`.
- `wrangler.toml` operacional de Deploy Button/Workers Builds deve ser preservado quando contiver IDs reais.

## Compatibilidade

- Não há migração de D1.
- Não há novo secret, binding ou variável de ambiente.
- O deploy continua usando os mesmos fluxos: local, Wrangler privado, Workers Builds/GitHub e Deploy Button.
- Instâncias existentes podem atualizar código sem alterar tabela, cron, TTL ou limites.
- Para reduzir consumo do plano gratuito por bots, configure regras de segurança da Cloudflare antes do Worker.
- Os novos arquivos PWA devem permanecer como Static Assets; não configure `run_worker_first` para `/manifest.webmanifest`, `/sw.js` ou `/assets/pwa-icon*.png`.

## Validação da release

- `npm run typecheck` passou.
- `npm run build` passou.
- `npm test` passou com 29 testes.
- `git diff --check` passou.
- Verificação local confirmou `GET /`, `GET /manifest.webmanifest` e `GET /sw.js` respondendo com `200`.
