# LockBrief: compartilhamento seguro de segredos efêmeros

Envie senhas, tokens, chaves de API ou qualquer informação sensível com criptografia no navegador. No cliente oficial e não modificado, o backend recebe apenas o envelope criptografado; a senha automática (chave de 256 bits) e a senha manual nunca chegam ao servidor.

**Versão estável atual:** 1.2.2, publicada em 07/11/2026. **Release anterior:** 1.2.1.

<p align="left">
  <a href="https://lockbrief-demo.vitorgfaustino.workers.dev/" target="_blank" rel="noopener noreferrer">
    <img src="assets/demo-button.svg" alt="Acessar demonstração pública do LockBrief" width="420">
  </a>
</p>

---

## Por que usar o LockBrief?

| Problema comum | Solução LockBrief |
|---|---|
| Enviar senha por e-mail/WhatsApp → fica no histórico para sempre | Link de **leitura única**: o envelope deixa o banco ativo após ser entregue |
| Compartilhar `.env` ou token por chat → exposto em logs | Criptografia **AES-GCM-256 no navegador**: o backend normal não recebe o texto |
| Ferramentas corporativas cobram por usuário | **Zero custo**: roda no plano gratuito da Cloudflare |
| Medo de vazamento de dados do servidor | O banco guarda apenas o envelope criptografado e metadados mínimos |

---

## Modos de uso e deploy

Escolha o caminho que combina com o seu momento:

| Situação | Opção |
|---|---|
| Quero começar rápido, sem usar o terminal | **1. Deploy Button (recomendado)** |
| Quero testar no meu computador | **2. Executar localmente** |
| Já tenho uma instalação e quero atualizar | **3. Atualizar instalação existente** |
| Quero publicar a cada `git push` | **4. Workers Builds/GitHub** |
| Quero controle total da configuração | **5. CLI manual** |

### 1. Deploy Button (1 clique, recomendado)

**Método recomendado e mais fácil para começar.** Você faz o deploy pela Cloudflare, sem usar o terminal e sem instalar nada no computador.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/vitorgfaustino/lockbrief)

1. Clique no botão e entre ou crie sua conta Cloudflare.
2. Siga as telas para autorizar a criação do Worker e do banco D1.
3. Aguarde o deploy terminar e abra a URL `workers.dev` mostrada no painel.

O Deploy Button usa Workers Builds. A Cloudflare pode criar um repositório na sua conta GitHub ou GitLab com a configuração do projeto. Se isso acontecer, mantenha esse repositório privado: ele pode conter o `database_id` real do seu banco. Um ID não é uma senha, mas também não deve ficar público.

O deploy publica uma URL `workers.dev` e deixa as Preview URLs desativadas. Se quiser testar mudanças sem afetar a produção, faça uma instalação separada.

Quer o código-fonte público? Mantenha um repositório separado, sem IDs reais. Veja [`docs/LICENCA.md`](docs/LICENCA.md).

### 2. Executar localmente

Use esta opção para testar o projeto no seu computador antes de publicar.

Você precisa do Node.js 22.12 ou mais novo e do npm 10.9 ou mais novo. No terminal, rode:

```bash
git clone https://github.com/vitorgfaustino/lockbrief.git
cd lockbrief
npm ci
npm run dev-init
npm run build
npm run dev
```

Abra `http://localhost:8787`.

### 3. Atualizar instalação existente

Já tem uma instalação do LockBrief? Siga o runbook: [`docs/ATUALIZACAO.md`](docs/ATUALIZACAO.md).

A atualização vem sempre do repositório oficial:

```text
https://github.com/vitorgfaustino/lockbrief.git
```

Esse repositório é só a fonte do código. Não abra PR, branch ou push nele.

Se o seu repositório operacional for outro, configure o remoto `upstream`:

```bash
git remote add upstream https://github.com/vitorgfaustino/lockbrief.git
git remote -v
```

Se o remoto já existir, confirme com `git remote -v` que ele aponta para o endereço acima.

O bloco abaixo só vale para uma cópia limpa do repositório, sem alterações locais e com `wrangler.toml` público:

```bash
git fetch upstream --tags --prune
git merge-base HEAD upstream/main
git merge-base --is-ancestor HEAD upstream/main
git merge --ff-only upstream/main
npm ci
npm run dev-init
npm run build
npm run typecheck
npm test
```

Não altere `wrangler.local.toml`, `.dev.vars`, `.env*`, `database_id` real, o binding D1 `DB`, variables ou secrets. Se o `wrangler.toml` local tiver IDs reais, trate o arquivo como configuração de produção e preserve.

Se a atualização com `git merge --ff-only` falhar, pare. Não use merge forçado, rebase, reset ou push. Siga o fluxo de [`docs/ATUALIZACAO.md`](docs/ATUALIZACAO.md) ou peça ajuda.

Se usar uma IA, peça para preservar a configuração, não criar branch `update/...` e explicar o que ficou pendente.

### 4. Workers Builds/GitHub

Use esta opção se você quer que cada `git push` publique uma nova versão automaticamente.

1. No painel da Cloudflare, acesse **Workers & Pages** → **Create** → **Worker** → **Import a repository**.
2. Selecione o repositório do LockBrief.
3. Preencha:
   - **Build command:** `npm run build`
   - **Deploy command:** `npm run deploy`
4. Se o repositório for público, não deixe `database_id` real, tokens ou secrets no código.

### 5. CLI manual com configuração privada

Use esta opção se você quer controle total e prefere manter a configuração fora do Git. Você precisa de uma conta Cloudflare.

```bash
git clone https://github.com/vitorgfaustino/lockbrief.git
cd lockbrief
cp -n wrangler.toml wrangler.local.toml # só na primeira instalação; preserve se já existir
npm ci
npx wrangler d1 create lockbrief
# edite apenas wrangler.local.toml e substitua database_id pelo ID retornado
npm run build
npm run d1:migrate:remote:private
npx wrangler deploy --config wrangler.local.toml
```

O `database_id` real fica só em `wrangler.local.toml`, que o Git ignora. O projeto não cria recursos remotos automaticamente.

---

## Regra de ouro para GitHub

- `wrangler.toml` é um modelo público e não deve conter IDs reais.
- `wrangler.local.toml`, `.dev.vars`, `.env`, tokens, secrets e `database_id` real não podem ir para o GitHub.
- Valores reais ficam no painel da Cloudflare ou em um arquivo local ignorado pelo Git.
- Em repositórios criados pela Cloudflare, o `wrangler.toml` pode conter IDs reais. Mantenha esse repositório privado e não substitua o arquivo pelo modelo público durante a atualização.

---

## Funcionalidades

- **Criptografia local**: AES-GCM-256 no navegador (Web Crypto API). O segredo nunca sai do navegador em texto claro.
- **Senha manual**: uma camada extra de proteção, além da senha automática do link. A derivação usa PBKDF2-SHA256 (210 mil iterações) e HKDF-SHA256.
- **Links antigos continuam funcionando**: novas mensagens usam o formato v2, com parâmetros de criptografia explícitos; links v1 seguem compatíveis.
- **Confirmação antes do consumo**: o link mostra uma etapa de confirmação antes de buscar e apagar a mensagem.
- **Leitura única ou múltipla**: você escolhe se o segredo será apagado no primeiro acesso.
- **Expiração**: o segredo expira em 1 hora, 1 dia ou 1 semana. A limpeza automática roda a cada 30 minutos.
- **Instalável no celular**: funciona como app (PWA) e guarda em cache apenas arquivos públicos.
- **Sem rastreamento próprio**: sem contas, cookies, analytics comportamental ou identificador persistido pela aplicação. A Cloudflare ainda processa metadados técnicos e logs de invocação conforme a configuração da instância.
- **Bloqueio de bots**: crawlers e previews conhecidos são barrados antes de acessar os links.
- **Proteção contra abuso**: limites por rota e por recurso, sem WAF pago e sem armazenar IP.
- **Plano Free**: feito para o plano gratuito, com 100 mil requests/dia, D1 de 500 MB por banco e 5 GB por conta. Reconfirme os limites antes do deploy.
- **Open source**: AGPL-3.0. Você pode auditar, modificar e hospedar o projeto.

---

## FAQ

### O servidor pode ler meu segredo?
No fluxo do cliente oficial e não modificado, **não**. O segredo é criptografado no navegador antes do envio. O backend recebe apenas um envelope AES-GCM-256, que não pode ser aberto sem a senha automática. Essa senha (uma chave de 256 bits) vai no fragmento da URL (`#...`) e não é enviada em requisições HTTP. Ainda assim, o site que entrega o JavaScript precisa ser confiável: um código adulterado poderia capturar dados antes da criptografia.

### O que acontece se eu perder o link?
O segredo é perdido. Não há recuperação, por design. Compartilhe o link com cuidado.

### Dá para usar de graça?
**Sim.** O LockBrief foi feito para o plano gratuito. Em 27 de agosto de 2026, o plano oferecia 100.000 requisições Worker/dia, D1 com 500 MB por banco e 5 GB totais na conta. O operador precisa acompanhar o uso; o projeto não promete que a cota cobre todo tráfego ou ataque.

### Como funciona a leitura única?
Ao abrir o link, o navegador busca apenas os metadados, sem consumir o segredo. O registro é apagado do banco ativo quando você clica em "Revelar mensagem". Se alguém abrir o mesmo link depois, verá "Segredo indisponível". O clique consome o registro mesmo que o navegador seja fechado antes de digitar a senha correta. O D1 mantém um histórico de Time Travel da Cloudflare por 7 dias no plano gratuito ou 30 dias no pago. Esse histórico contém apenas o envelope criptografado, mas um operador autorizado pode restaurá-lo.

### Posso permitir múltiplas leituras?
**Sim.** Desative o toggle "Destruir após leitura" na criação. O segredo permanece acessível até expirar (1 hora, 1 dia ou 1 semana).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Cloudflare Workers |
| Banco | Cloudflare D1 (SQLite) |
| Criptografia | Web Crypto API (AES-GCM-256, PBKDF2, HKDF) |
| Frontend | TypeScript + CSS (esbuild) |
| Testes | Vitest 4 + @cloudflare/vitest-plugin |
| Deploy | Wrangler, Deploy Button, Workers Builds |

---

## Documentação

Auditoria local e matriz de impacto: [`docs/AUDITORIA-UPSTREAM.md`](docs/AUDITORIA-UPSTREAM.md).

| Documento | Conteúdo |
|---|---|
| [`DESIGN.md`](DESIGN.md) | Direção visual vigente, razões e limites de identidade |
| [`docs/COMPORTAMENTO.md`](docs/COMPORTAMENTO.md) | UX, estados de tela, acessibilidade |
| [`docs/AUDITORIA-UI.md`](docs/AUDITORIA-UI.md) | Auditoria cruzada Impeccable + antislop e plano de correções |
| [`docs/FUNCIONAL.md`](docs/FUNCIONAL.md) | Rotas, API, banco, limites, validações |
| [`docs/SEGURANCA.md`](docs/SEGURANCA.md) | Criptografia, threat model, CSP, extensões |
| [`docs/PRIVACIDADE.md`](docs/PRIVACIDADE.md) | Dados tratados, LGPD, minimização |
| [`docs/IMPLANTACAO.md`](docs/IMPLANTACAO.md) | Deploy local/remoto, D1, CI, checklist |
| [`docs/LICENCA.md`](docs/LICENCA.md) | Obrigações AGPL-3.0, identidade visual e repositórios operacionais |
| [`docs/ATUALIZACAO.md`](docs/ATUALIZACAO.md) | Atualização por upstream oficial, sem alterar bindings |
| [`docs/OPERACAO-IA.md`](docs/OPERACAO-IA.md) | Intenções aceitas, IA guiada e checkpoints |
| [`AI-START.md`](AI-START.md) | Guia para IAs operarem o projeto |
| [`SECURITY.md`](SECURITY.md) | Política para reporte de vulnerabilidades |
| [`RELEASE_NOTES.md`](RELEASE_NOTES.md) | Notas da release atual |
| [`docs/RELEASE-1.2.2.md`](docs/RELEASE-1.2.2.md) | Inventário, gate local e proteção da `main` da 1.2.2 |

---

## Licença

AGPL-3.0. Veja [LICENSE](LICENSE) e [`docs/LICENCA.md`](docs/LICENCA.md).

Se você modificar e operar o LockBrief por rede, ofereça aos usuários o código-fonte correspondente da versão modificada. Isso não exige publicar `wrangler.local.toml`, `.dev.vars`, `.env`, tokens, secrets ou `database_id` real.

Criado por [Vitor Faustino](https://github.com/vitorgfaustino).

## Release atual e demonstração pública

A versão estável atual é a [v1.2.2](https://github.com/vitorgfaustino/lockbrief/releases/tag/v1.2.2), publicada em 07/11/2026. A release anterior é a [v1.2.1](https://github.com/vitorgfaustino/lockbrief/releases/tag/v1.2.1). As mudanças da 1.2.2 estão em [`RELEASE_NOTES.md`](RELEASE_NOTES.md). O inventário e a proteção da `main` estão em [`docs/RELEASE-1.2.2.md`](docs/RELEASE-1.2.2.md). O histórico da 1.2.1 está no [Gate Final](docs/GATE-FINAL-RELEASE.md).

A [demo pública do LockBrief](https://lockbrief-demo.vitorgfaustino.workers.dev/) roda em uma instalação privada, separada deste repositório, com configuração própria na Cloudflare. O [sincronizador opcional](docs/SINCRONIZACAO-DEMO.md) documenta como consumir releases oficiais. Cada instalação de terceiros é independente e atualiza o próprio repositório.

Este repositório é o código-fonte oficial e a base de distribuição. Não tem produção, banco D1 remoto próprio nem conexão operacional com a Cloudflare. Cada operador instala e mantém os próprios recursos. A CI valida localmente e não publica o upstream.
