# Release Notes — LockBrief v1.1.0

Data: 2026-05-22

## Resumo

Esta release melhora o fluxo de abertura de segredos com uma confirmação obrigatória antes do consumo da nota. O objetivo é deixar explícito quando uma leitura única será destruída, sem expor plaintext, chave, senha ou envelope antes da decisão do usuário.

## Principais mudanças

- Novo ponto explícito de consumo: **"Revelar mensagem"**.
- `/api/info` retorna apenas `oneTime`, `expiresAt` e `requiresPassword`.
- `/api/info` continua não consumindo nota e não retorna payload, KDF, salt, IV, ciphertext, chave, senha ou plaintext.
- Chave ou senha só são solicitadas depois da confirmação e depois de `/api/fetch`.
- Criação reorganizada em blocos: Mensagem, Proteção, Expiração e Leitura.
- Proteção por chave automática ou senha humana, sem combinação chave + senha no mesmo segredo.
- Senha humana pode ser definida pelo usuário ou gerada localmente no navegador.
- Tela de resultado inclui resumo local seguro da configuração.
- Botões de copiar na tela de link criado agora exibem feedback **"Copiado"**.
- Ao desativar **"Destruir após leitura"**, a UI informa que a nota poderá ser lida sem limite até expirar.
- `/api/info` tem rate limit em memória.
- Bots, crawlers e previews conhecidos são bloqueados antes das rotas da aplicação.
- Leitura única usa `DELETE ... RETURNING` no caminho principal para remover e retornar o envelope na mesma instrução.
- Respostas JSON usam headers de isolamento consistentes.

## Segurança e privacidade

- O Worker continua sem receber plaintext, chave de descriptografia ou senha.
- `requiresPassword` é metadado técnico mínimo derivado do envelope criptografado; ele não revela a senha nem o conteúdo.
- `/api/fetch` continua sendo o único endpoint que entrega o envelope criptografado.
- Leitura única continua removendo o registro no primeiro fetch confirmado.
- Retentativas de chave ou senha incorretas usam apenas o envelope em memória e não fazem novo fetch.
- O bloqueio de bots avalia User-Agent e headers de prefetch apenas durante a requisição, sem persistência.
- O bloqueio dentro do Worker reduz D1/CPU; economia real de Worker requests exige regras na borda da Cloudflare.
- Logs de erro do Worker usam mensagens genéricas, sem detalhes internos do D1.
- Nenhum `localStorage`, `sessionStorage`, cookie, analytics, log novo ou coleta de dados pessoais foi adicionado.

## Compatibilidade

- Não há migração de D1.
- Não há novo secret, binding ou variável de ambiente.
- O deploy continua usando os mesmos fluxos: local, Wrangler privado, Workers Builds/GitHub e Deploy Button.
- Instâncias existentes podem atualizar código sem alterar tabela, cron, TTL ou limites.
- Para reduzir consumo do plano gratuito por bots, configure regras de segurança da Cloudflare antes do Worker.

## Validação esperada

- `npm run typecheck`
- `npm run build`
- `npm test` com 26 testes
- `git diff --check`
