# AI-START

Este arquivo é a entrada única para qualquer IA operar o LockBrief v1.0.0 com segurança.

O objetivo dele é permitir que a IA:

- inicie ou execute o projeto localmente sem clone aninhado
- atualize uma instalação existente sem quebrar configuração local
- saiba quando parar e entregar handoff manual ao usuário
- trate corretamente execução local, deploy por IA, Workers Builds/GitHub e Deploy Button
- nunca grave segredos, tokens, IDs reais de recursos ou configuração privada no GitHub

Se a IA recebeu apenas este arquivo, ela deve conseguir orientar ou executar o fluxo operacional sem inventar dados sensíveis nem pular checkpoints importantes.

## Leitura obrigatória

Leia nesta ordem antes de agir:

1. `AGENTS.md`
2. `docs/FUNCIONAL.md`
3. `docs/SEGURANCA.md`
4. `docs/PRIVACIDADE.md`
5. `docs/IMPLANTACAO.md`
6. `docs/COMPORTAMENTO.md`

## Estado atual do produto

LockBrief v1.0.0 é um compartilhador de segredos efêmeros com:

- criptografia AES-GCM-256 no navegador (Web Crypto API)
- derivação de chave com senha adicional via PBKDF2-SHA256 + HKDF-SHA256
- armazenamento no D1 apenas do envelope criptografado (sem plaintext, chave, IP ou user-agent)
- consumo transacional com leitura única (`UPDATE ... RETURNING` ou fallback com `consume_token`)
- expiração controlada por `expires_at` e limpeza via Cron Trigger a cada 30 minutos
- abuse controls em memória no escopo do isolate (sem persistência de IP)
- erros públicos sempre genéricos e indistinguíveis
- interface dark mode com glassmorphism e paleta neon ciano
- links com fragmento `#` para a chave (nunca enviada ao servidor)

O produto não mantém:

- contas de usuário
- login ou autenticação
- IP, user-agent, cookies ou fingerprinting
- analytics ou rastreamento
- histórico nominal de segredos
- painel administrativo
- upload de arquivos
- compartilhamento multi-destinatário
- CLI ou integrações externas

## Regra de ouro

- `wrangler.toml` é o template público versionado. Ele existe para código-fonte, CI, Workers Builds e Deploy Button.
- `wrangler.toml` nunca deve conter `database_id` real, token, secret, variável privada, `.dev.vars` ou dado operacional sensível.
- `wrangler.local.toml` é a configuração privada para deploy manual com valores reais. Ele é ignorado pelo Git e nunca deve ser publicado.
- `.dev.vars`, `.env`, tokens, chaves, secrets e qualquer valor real de operador nunca podem ir para o GitHub.
- O Deploy Button pode criar um repositório operacional na conta do usuário e atualizar a configuração Wrangler com IDs reais de recursos provisionados. Se a política for zero IDs reais no GitHub, esse repositório deve ser privado ou o operador deve usar deploy manual com `wrangler.local.toml`.
- `plan.md` não faz parte do fluxo operacional atual; se estiver ausente, não recriar automaticamente.

## Como interpretar pedidos

Mapeie o pedido do usuário para uma destas intenções antes de agir:

- `Executar o Projeto`
- `Iniciar o Projeto`
- `Continuar configuração do projeto`
- `Atualizar o Projeto`
- `Aplicar migrations`
- `Auditar estado operacional`
- `Publicar com Wrangler local`
- `Publicar por Workers Builds/GitHub`
- `Publicar com o botão da Cloudflare`

Se o pedido vier em linguagem natural, primeiro mapeie para uma dessas intenções antes de executar qualquer ação.

## Perguntas obrigatórias

### Antes de publicação ou atualização

A IA deve sempre perguntar:

`Como você publica o projeto?`

Métodos aceitos:

1. `Somente executar local`
2. `Deploy local com Wrangler`
3. `Workers Builds/GitHub`
4. `Deploy Button`
5. `Primeira publicação`

Essa resposta muda:

- se a migration remota será executada por CLI ou só orientada
- se a atualização depende de `git pull` local, push para GitHub ou configuração de painel
- onde ficam os valores reais de Cloudflare: `wrangler.local.toml`, dashboard ou repositório operacional gerado

### Antes de criar banco D1

`Qual jurisdição para o banco D1? (padrão: sem jurisdição específica)`

Opções:

- sem flag (global)
- `--jurisdiction=eu` (Europa)
- conforme necessidade LGPD do operador

### Antes de publicar com GitHub ou Deploy Button

`O repositório operacional gerado/conectado ficará público ou privado?`

Regra:

- se for público, não gravar `database_id` real, tokens, secrets ou variáveis privadas no GitHub
- se o Deploy Button gerar um repo com IDs reais de recursos, tratar esse repo como operacional e preferir privado
- se a política exigir zero IDs reais no GitHub, usar `wrangler.local.toml` e deploy manual com Wrangler

## Fluxo para executar localmente

Use quando o pedido for `Executar o Projeto`, `Iniciar o Projeto` ou execução local manual.

Antes de qualquer `npm install`, a IA deve descobrir:

1. a pasta atual já é a raiz final do projeto?
2. a pasta atual já possui `.git` do usuário?
3. os arquivos do LockBrief já estão presentes nessa raiz?

Regras:

- se a pasta atual já for a raiz final do usuário com `.git`, nunca criar clone aninhado
- se a IA precisar obter o projeto do upstream, usar origem temporária fora da árvore final
- nunca deixar `.git` do upstream dentro do projeto final do usuário
- se a pasta final já estiver preenchida, ler antes de sobrescrever qualquer coisa

Fluxo:

```bash
npm install
npm run dev-init
npm run typecheck
npm run build
npm test
npm run dev
```

Resultado esperado: aplicação local em `http://localhost:8787`.

O deploy remoto não faz parte deste fluxo. Pare e peça confirmação antes de criar D1 remoto, conectar GitHub ou publicar Worker.

## O que `npm run dev-init` faz

1. Aplica migrations D1 localmente (`wrangler d1 migrations apply DB --local --config wrangler.toml`).
2. Cria/usa o banco SQLite local em `.wrangler/state/`.
3. Usa o `wrangler.toml` público com placeholder, que é suficiente para desenvolvimento local.
4. Não cria banco D1 remoto.
5. Não grava `database_id` real.

## Fluxo para atualizar instalações existentes

Quando o pedido for `Atualizar o Projeto`, a IA deve:

1. rodar `git status --short`
2. identificar mudanças locais que precisam ser preservadas
3. preservar explicitamente:
   - `wrangler.local.toml` (pode conter `database_id` real)
   - `.dev.vars` e `.env*` locais
   - `dist/` gerado localmente, quando o operador depender dele
4. verificar como o projeto publica
5. se estiver seguro, rodar `git pull --ff-only`
6. rodar `npm install`
7. rodar `npm run dev-init`
8. rodar `npm run build`
9. rodar `npm run typecheck`
10. rodar `npm test`
11. aplicar migrations remotas e publicar apenas se o método de deploy permitir

## Modos de publicação

### 1. Wrangler local

Usado quando o operador publica manualmente da própria máquina.

Fluxo recomendado:

```bash
cp wrangler.toml wrangler.local.toml
npm install
npx wrangler d1 create lockbrief
# edite somente wrangler.local.toml e substitua database_id pelo ID retornado
npm run build
npm run d1:migrate:remote:private
npx wrangler deploy --config wrangler.local.toml
```

Regras:

1. criar o D1 remoto apenas após confirmação explícita
2. gravar o `database_id` real somente em `wrangler.local.toml`
3. aplicar migrations com `DB` como binding
4. publicar com `wrangler deploy --config wrangler.local.toml`
5. não usar script de bootstrap remoto automático

Este é o fluxo preferido quando a regra é não colocar nenhum ID operacional no GitHub.

### 2. IA guiada

Usado quando o operador pede: "leia `AI-START.md` e execute o projeto".

Regras:

1. para execução local, a IA pode rodar `npm install`, `npm run dev-init`, `npm run build`, `npm run typecheck`, `npm test` e `npm run dev`
2. para deploy remoto, a IA deve perguntar o método de publicação antes
3. a IA nunca deve escrever valores reais em `wrangler.toml`
4. se for deploy manual, a IA deve usar `wrangler.local.toml`
5. se for GitHub/Deploy Button, a IA deve orientar os passos do painel e avisar sobre repositórios operacionais com IDs reais

### 3. Workers Builds/GitHub

Usado quando o repositório está conectado ao Cloudflare Workers Builds e um `git push` dispara build/deploy.

Configuração inicial no dashboard:

1. Cloudflare Dashboard → Workers & Pages → Create → Worker → Import a repository
2. selecionar o repositório LockBrief
3. Build command: `npm run build`
4. Deploy command: `npm run deploy`

Regra de dados:

- o repositório fonte deve manter apenas o `wrangler.toml` público com placeholder
- valores reais devem ficar no dashboard da Cloudflare ou em repositório operacional privado
- se Cloudflare gerar commit com `database_id` real, não publicar esse repositório se a política for zero IDs no GitHub

### 4. Deploy Button

O botão "Deploy to Cloudflare" no README usa o fluxo oficial de Deploy Button da Cloudflare.

Comportamento atual documentado pela Cloudflare:

- clona o repositório fonte para a conta GitHub/GitLab do operador
- lê o `wrangler.toml` do repositório fonte
- provisiona recursos suportados, incluindo D1
- atualiza a configuração Wrangler onde aplicável, inclusive IDs de recursos criados
- usa Workers Builds para build/deploy

Regra de dados:

- o repositório fonte do LockBrief não contém IDs reais
- o repositório gerado pelo Deploy Button pode passar a conter IDs reais de recursos provisionados
- se o operador não quer qualquer ID real no GitHub, deve manter o repo gerado privado ou usar deploy manual com `wrangler.local.toml`

Após o deploy via botão, se for trabalhar localmente:

```bash
git clone <repo-gerado-pelo-deploy-button>
cd lockbrief
npm install
npm run build
npm run dev-init
npm run dev
```

## Checkpoints manuais obrigatórios

A IA deve parar e entregar handoff quando a tarefa depender de:

- criação do banco D1 remoto sem autorização explícita
- configuração do Workers Builds/GitHub no Cloudflare Dashboard
- configuração do Deploy Button no GitHub/GitLab
- decisão sobre domínio próprio vs workers.dev
- revisão da política de privacidade da instância
- decisão sobre jurisdição do banco D1
- decisão sobre deixar privado ou público um repositório operacional com IDs reais

## Arquivos canônicos

- `AGENTS.md`
- `AI-START.md`
- `README.md`
- `package.json`
- `tsconfig.json`
- `wrangler.toml` (template público sem IDs reais)
- `migrations/`
- `src/index.ts`
- `src/router.ts`
- `src/handlers/`
- `src/lib/`
- `src/client/`
- `docs/SEGURANCA.md`
- `docs/PRIVACIDADE.md`
- `docs/IMPLANTACAO.md`
- `docs/FUNCIONAL.md`
- `docs/COMPORTAMENTO.md`
- `build-client.mjs`

`wrangler.local.toml` também é operacionalmente importante quando existir, mas é privado e nunca deve ser versionado.

## Comandos de referência

Setup local completo:

```bash
node --version  # precisa ser >=22.12.0
npm install
npm run dev-init
npm run build
npm run dev
```

Criar D1 remoto manualmente:

```bash
npx wrangler d1 create lockbrief
```

Criar D1 remoto com jurisdição:

```bash
npx wrangler d1 create lockbrief --jurisdiction=eu
```

Aplicar migrations locais:

```bash
npm run d1:migrate:local
```

Aplicar migrations remotas com configuração privada:

```bash
npm run d1:migrate:remote:private
```

Build do cliente:

```bash
npm run build
```

Typecheck:

```bash
npm run typecheck
```

Testes:

```bash
npm test
```

Deploy CLI manual:

```bash
cp wrangler.toml wrangler.local.toml
npx wrangler d1 create lockbrief
# edite somente wrangler.local.toml e substitua database_id pelo ID retornado
npm run build
npm run d1:migrate:remote:private
npx wrangler deploy --config wrangler.local.toml
```

Deploy via Workers Builds/GitHub:

- Build command: `npm run build`
- Deploy command: `npm run deploy`
- manter valores reais fora de repositórios públicos

## Resultado esperado

Se a IA seguir este arquivo corretamente, ela deve conseguir:

- iniciar projetos novos sem clone aninhado
- executar o projeto localmente
- configurar banco D1 local para desenvolvimento
- aplicar migrations corretas
- construir o cliente TypeScript
- validar typecheck e testes antes de publicar
- respeitar o modelo de publicação do usuário
- parar nos checkpoints manuais corretos
- nunca expor plaintext, chave ou senha adicional ao Worker
- nunca criar tabelas ou campos que violem a minimização de dados
- nunca gravar configuração privada no GitHub

---

Versão 1.0.0
Criado por Vitor Faustino — vitorfaustino.com.br
