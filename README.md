# LockBrief — Compartilhamento seguro de segredos efêmeros

Envie senhas, tokens, chaves de API ou qualquer informação sensível com segurança real — o servidor **nunca vê** o conteúdo.

[Conhecer a demonstração do sistema](https://lockbrief-demo.vitorgfaustino.workers.dev)

---

## Por que usar o LockBrief?

| Problema comum | Solução LockBrief |
|---|---|
| Enviar senha por e-mail/WhatsApp → fica no histórico para sempre | Link de **leitura única** — o segredo se autodestrói após aberto |
| Compartilhar `.env` ou token por chat → exposto em logs | Criptografia **AES-GCM-256 no navegador** — o servidor nunca vê o texto |
| Ferramentas corporativas cobram por usuário | **Zero custo** — roda no plano gratuito da Cloudflare |
| Medo de vazamento de dados do servidor | **Zero-knowledge** — o servidor armazena apenas envelope criptografado |

---

## Modos de uso e deploy

### 1. Executar localmente

Pré-requisito: Node.js `>=22.12.0`.

```bash
git clone https://github.com/vitorgfaustino/lockbrief.git
cd lockbrief
npm install
npm run dev-init
npm run build
npm run dev
```

Abra `http://localhost:8787`.

### 2. Deploy Button (1 clique)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/vitorgfaustino/lockbrief)

O Deploy Button usa Workers Builds, lê o `wrangler.toml` público do projeto e pode provisionar automaticamente o D1. A Cloudflare pode criar um repositório operacional na sua conta GitHub/GitLab e atualizar a configuração com IDs reais dos recursos criados.

Recomendação importante para produção: mantenha o repositório operacional privado. `database_id` não é senha, mas o repositório gerado pelo deploy pode conter IDs reais de recursos e não deve ficar público em ambiente de produção.

O template publica uma URL `workers.dev` por padrão e mantém Preview URLs desabilitadas para evitar URLs extras sem decisão explícita do operador.

Regra: se você quer um repositório público como fonte, use-o só como fonte. Para operar em produção, mantenha o repositório gerado privado ou use o deploy manual com `wrangler.local.toml`.

### 3. Workers Builds/GitHub

Conecte o repositório ao Cloudflare Workers Builds para publicar a cada `git push`:

1. Acesse Cloudflare Dashboard → **Workers & Pages** → **Create** → **Worker** → **Import a repository**
2. Selecione o repositório LockBrief
3. Configure:
   - **Build command:** `npm run build`
   - **Deploy command:** `npm run deploy`
4. Garanta que o repositório operacional não exponha `database_id` real, tokens ou secrets se ele for público.

### 4. CLI manual com configuração privada

```bash
git clone https://github.com/vitorgfaustino/lockbrief.git
cd lockbrief
cp wrangler.toml wrangler.local.toml
npm install
npx wrangler d1 create lockbrief
# edite somente wrangler.local.toml e substitua database_id pelo ID retornado
npm run build
npm run d1:migrate:remote:private
npx wrangler deploy --config wrangler.local.toml
```

Esse fluxo mantém o `database_id` real apenas em `wrangler.local.toml`, arquivo ignorado pelo Git. O projeto não inclui script de bootstrap remoto para evitar criação/publicação acidental de recursos Cloudflare.

---

## Regra de ouro para GitHub

- `wrangler.toml` é template público e não deve conter IDs reais.
- `wrangler.local.toml`, `.dev.vars`, `.env`, tokens, secrets e `database_id` real não podem ir para o GitHub.
- Valores reais ficam no dashboard da Cloudflare ou em arquivo local ignorado.

---

## Funcionalidades

- **Criptografia local**: AES-GCM-256 via Web Crypto API. O segredo nunca sai do navegador em texto claro.
- **Senha adicional**: PBKDF2-SHA256 (210k iterações) + HKDF-SHA256. Camada extra de proteção.
- **Leitura única ou múltipla**: escolha se o segredo é destruído no primeiro acesso.
- **Expiração**: 1 hora, 1 dia ou 1 semana. Cron de limpeza a cada 30 minutos.
- **Zero rastreamento**: sem contas, cookies, analytics, IP, user-agent.
- **Zero custo**: funciona no plano gratuito da Cloudflare (100k requisições/dia, 5 GB D1 storage).
- **Open source**: AGPL-3.0. Audite, modifique, hospede você mesmo.

---

## FAQ

### O servidor pode ler meu segredo?
**Não.** O segredo é criptografado no seu navegador antes de enviar. O servidor recebe apenas um envelope AES-GCM-256 ilegível sem a chave. A chave viaja no fragmento da URL (`#...`) que **não é enviado ao servidor** em requisições HTTP.

### O que acontece se eu perder o link?
O segredo é perdido. Não há recuperação — por design. Compartilhe o link com cuidado.

### Dá para usar de graça?
**Sim.** O plano gratuito da Cloudflare oferece 100.000 requisições/dia e 5 GB de armazenamento D1. Mais que suficiente para uso pessoal ou em equipe.

### Como funciona a leitura única?
Ao abrir o link, o servidor retorna o envelope criptografado e **remove o registro do banco**. Se alguém tentar abrir o mesmo link depois, receberá "Segredo indisponível". Mesmo que o navegador seja fechado antes de digitar a senha correta — o segredo já foi removido.

### Posso permitir múltiplas leituras?
**Sim.** Desative o toggle "Destruir após leitura" na criação. O segredo permanece acessível até expirar (1h/1d/1semana).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Cloudflare Workers |
| Banco | Cloudflare D1 (SQLite) |
| Criptografia | Web Crypto API (AES-GCM-256, PBKDF2, HKDF) |
| Frontend | TypeScript + CSS (esbuild) |
| Testes | Vitest + @cloudflare/vitest-pool-workers |
| Deploy | Wrangler, Deploy Button, Workers Builds |

---

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/COMPORTAMENTO.md`](docs/COMPORTAMENTO.md) | UX, estados de tela, acessibilidade |
| [`docs/FUNCIONAL.md`](docs/FUNCIONAL.md) | Rotas, API, banco, limites, validações |
| [`docs/SEGURANCA.md`](docs/SEGURANCA.md) | Criptografia, threat model, CSP, extensões |
| [`docs/PRIVACIDADE.md`](docs/PRIVACIDADE.md) | Dados tratados, LGPD, minimização |
| [`docs/IMPLANTACAO.md`](docs/IMPLANTACAO.md) | Deploy local/remoto, D1, CI, checklist |
| [`AI-START.md`](AI-START.md) | Guia para IAs operarem o projeto |
| [`SECURITY.md`](SECURITY.md) | Política para reporte de vulnerabilidades |
| [`RELEASE_NOTES.md`](RELEASE_NOTES.md) | Notas da release atual |

---

## Licença

AGPL-3.0 — veja [LICENSE](LICENSE).

Criado por [Vitor Faustino](https://github.com/vitorgfaustino).
