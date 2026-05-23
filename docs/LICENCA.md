# LockBrief — Licença AGPL-3.0 e Repositórios Operacionais

Este documento explica como a licença AGPL-3.0 se aplica ao LockBrief em termos operacionais. Ele não substitui revisão jurídica. O texto normativo é o arquivo [`LICENSE`](../LICENSE).

## Regra central

O LockBrief é distribuído sob AGPL-3.0. A licença permite usar, copiar, estudar, modificar, hospedar e redistribuir o software, inclusive comercialmente, desde que as condições da licença sejam respeitadas.

A diferença principal entre AGPL e licenças permissivas é o uso em rede. Se uma versão modificada do LockBrief for disponibilizada para usuários por rede, esses usuários devem ter uma forma clara e gratuita de receber o código-fonte correspondente dessa versão.

## Quem tem obrigações

| Papel | Obrigação principal |
|---|---|
| Usuário final que só abre ou cria segredos em uma instância | Não precisa publicar código por apenas usar o serviço. |
| Operador que hospeda o LockBrief sem modificar | Deve manter os avisos de licença e oferecer acesso ao código-fonte correspondente da versão operada. Um link para o repositório/tag oficial é suficiente quando a instância roda exatamente o upstream. |
| Operador que modifica código, CSS, assets, textos, rotas, build, deploy ou comportamento e oferece a instância por rede | Deve disponibilizar aos usuários o código-fonte correspondente da versão modificada sob AGPL-3.0. |
| Pessoa que redistribui cópias, imagens, builds ou forks | Deve preservar copyright, licença, avisos de ausência de garantia e fornecer o código-fonte correspondente. |
| Pessoa que modifica apenas para uso privado, sem redistribuir e sem disponibilizar a usuários por rede | Pode manter a modificação privada enquanto esse limite for mantido. |

## O que pode fazer

- Usar o LockBrief para fins pessoais, internos, educacionais ou comerciais.
- Hospedar a própria instância.
- Cobrar por hospedagem, suporte, consultoria, operação ou garantia adicional.
- Modificar código, estilos, textos, fluxos, rotas, documentação, scripts e assets do projeto.
- Criar um fork público ou privado.
- Reempacotar a aplicação, desde que o código-fonte correspondente continue disponível conforme a AGPL-3.0.
- Integrar o LockBrief com sistemas externos, desde que a separação técnica e jurídica dessas integrações não esconda uma obra derivada fechada. Integrações acopladas dentro do mesmo Worker ou do mesmo código distribuído devem ser tratadas como parte do trabalho coberto.

## O que não pode fazer

- Transformar uma versão modificada do LockBrief em serviço fechado sem oferecer o código-fonte correspondente aos usuários desse serviço.
- Redistribuir uma versão modificada com licença proprietária incompatível ou restrições extras que removam direitos dados pela AGPL-3.0.
- Remover avisos de copyright, licença ou ausência de garantia.
- Fingir que uma versão modificada é a versão oficial sem identificar as mudanças.
- Usar segredos, tokens, credenciais ou configuração operacional real como se fossem parte obrigatória do código-fonte público.
- Colocar dados de usuários, conteúdo de segredos, logs sensíveis, `.env`, `.dev.vars`, `wrangler.local.toml` ou `database_id` real em repositório público para tentar cumprir a licença.

## Uso em rede e oferta de código-fonte

Quando uma instância modificada é acessível por navegador, API ou outro meio de rede, a forma prática de cumprir a AGPL-3.0 é manter uma oferta clara de código-fonte na própria interface ou em local equivalente.

No LockBrief, o rodapé das páginas públicas exibe o link **Código AGPL-3.0**. Operadores que modificarem o projeto devem apontar esse link para o código-fonte correspondente da instância que estão rodando.

Formas aceitáveis de disponibilização:

- repositório público apontando para o commit, tag ou branch usado em produção;
- arquivo `.tar.gz` ou `.zip` com o código-fonte correspondente, disponível por URL estável;
- repositório privado acessível a todos os usuários da instância, quando a instância for interna e restrita;
- página de compliance que explique onde obter o código-fonte sem custo.

Para instância pública na internet, prefira repositório público ou pacote de fonte público. Para instância privada, o acesso pode ser restrito aos próprios usuários da instância, desde que todos eles consigam obter o código-fonte correspondente.

## O que entra no código-fonte correspondente

Publique tudo que for necessário para estudar, modificar, gerar e executar a versão modificada sem depender de arquivos privados do operador:

- `src/`, `migrations/`, `package.json`, `package-lock.json`, scripts de build e testes;
- CSS, imagens, ícones e demais assets do projeto, quando forem parte da versão modificada;
- documentação que descreve comportamento, API, segurança, privacidade, deploy e atualização;
- `wrangler.toml` como template público com placeholders e nomes de bindings;
- exemplos fictícios de variáveis, quando existirem;
- instruções para criar recursos próprios na Cloudflare.

## O que não entra no código-fonte público

A AGPL-3.0 exige código-fonte correspondente, não configuração operacional secreta ou dados reais de uma instância.

Não publique:

- `.env`, `.env.*`, `.dev.vars`;
- `wrangler.local.toml`;
- tokens, API keys, senhas, credenciais e secrets;
- `database_id` real, account IDs, namespace IDs e demais identificadores operacionais de produção;
- dados do D1, backups, logs, métricas brutas ou conteúdo de segredos;
- configurações privadas do dashboard da Cloudflare;
- domínios, rotas ou aliases privados quando isso expuser operação sensível.

`database_id` não é senha, mas é identificador operacional real. Pela política deste projeto, ele não deve aparecer em repositório público.

## `wrangler.toml` e repositório aberto

O repositório-fonte aberto deve manter `wrangler.toml` como template público. Ele pode conter:

- nome público do Worker;
- `main`, `compatibility_date`, assets, cron e observabilidade;
- binding D1 `DB`;
- `database_name` genérico;
- `database_id` placeholder, como `00000000-0000-0000-0000-000000000000`.

Ele não deve conter:

- `database_id` real;
- tokens ou secrets;
- valores reais de `.dev.vars` ou `.env`;
- configuração operacional privada do dashboard;
- dados de produção.

Para deploy manual, copie o template para `wrangler.local.toml`, edite apenas esse arquivo com valores reais e publique com:

```bash
npx wrangler deploy --config wrangler.local.toml
```

`wrangler.local.toml` é ignorado pelo Git e não faz parte do repositório público.

Em Workers Builds/GitHub ou Deploy Button, a Cloudflare pode atualizar o `wrangler.toml` do repositório operacional com IDs reais provisionados. Esse repositório operacional deve ser tratado como privado quando contiver IDs reais. Para cumprir a AGPL-3.0, publique uma fonte correspondente sanitizada em outro repositório ou pacote, sem valores reais.

## Topologia recomendada para Deploy Button com modificações

Quando o operador usa o Deploy Button e depois modifica o LockBrief, a topologia recomendada é manter dois espaços separados:

| Espaço | Visibilidade | Conteúdo | Função |
|---|---|---|---|
| Repositório operacional | Privado | Código em produção, `wrangler.toml` provisionado pela Cloudflare, IDs reais e configuração de publicação | Publicar a instância via Workers Builds/Deploy Button |
| Fonte correspondente sanitizada | Público, ou acessível a todos os usuários da instância | Mesmo código modificado, docs, migrations, assets e `wrangler.toml` com placeholders | Cumprir a oferta de código-fonte da AGPL-3.0 |

Essa separação evita publicar `database_id`, routes, IDs de recursos, secrets ou configuração privada, sem fechar o código da versão modificada.

Para uma instância pública modificada, o caminho mais simples é criar um segundo repositório público, por exemplo `lockbrief-minha-versao`, contendo:

- todo o código e assets modificados;
- `LICENSE` preservado;
- changelog ou README indicando que a versão foi modificada;
- `wrangler.toml` sanitizado, com placeholders;
- instruções para criar os próprios recursos Cloudflare.

O repositório operacional privado continua conectado à Cloudflare e recebe os valores reais. O link **Código AGPL-3.0** da instância publicada deve apontar para a fonte sanitizada correspondente, não para o repositório operacional privado.

Não é obrigatório que a fonte correspondente seja um repositório público do GitHub. Também pode ser um pacote `.zip`/`.tar.gz` público ou, em instância interna, um repositório privado acessível a todos os usuários da instância. Para serviço público na internet, o repositório público sanitizado é a forma mais simples de cumprir e auditar.

Fluxo operacional recomendado:

1. Desenvolva a mudança no repositório operacional privado ou em ambiente local.
2. Remova ou substitua valores reais antes de publicar a fonte correspondente.
3. Publique a mesma versão do código em um repositório/pacote sanitizado.
4. Aponte o rodapé da instância para essa fonte correspondente.
5. Preserve no repositório operacional privado o `wrangler.toml` real usado pela Cloudflare.

## Variáveis e secrets do Worker

O LockBrief v1.1.0 não exige secrets de runtime.

Se uma versão futura adicionar variáveis:

- variáveis públicas e não sensíveis podem ser documentadas com nomes e exemplos fictícios;
- variáveis reais de produção devem ficar no dashboard da Cloudflare ou em configuração operacional privada;
- secrets devem ser criados pelo dashboard da Cloudflare ou com `npx wrangler secret put <NOME>`;
- desenvolvimento local pode usar `.dev.vars` ou `.env`, sempre ignorados pelo Git;
- o código-fonte deve documentar nomes, finalidade e formato esperado, nunca valores reais.

O `wrangler.toml` deste projeto usa `keep_vars = true` para preservar valores configurados fora do arquivo durante deploy. Isso ajuda a manter o template público separado da configuração real da instância.

## Identidade visual e marca

A AGPL-3.0 permite modificar a identidade visual que está no código-fonte do projeto:

- cores, CSS, espaçamentos e responsividade;
- logotipo e ícones incluídos no repositório;
- textos da interface;
- nome exibido pela aplicação;
- página de privacidade e rodapé.

Ao publicar ou operar uma versão modificada:

- mantenha a licença AGPL-3.0 e os avisos de copyright;
- marque claramente que a versão foi modificada, com data ou changelog;
- não induza usuários a acreditar que a versão modificada é operada ou endossada pelo mantenedor original;
- aponte o link de código-fonte para o fork, pacote ou repositório correspondente à versão modificada;
- se a alteração visual for ampla, prefira rebranding próprio e use formulação como "baseado no LockBrief".

Este projeto não define uma política de marca separada. A ausência dessa política não transforma a licença de software em autorização irrestrita para uso promocional do nome do autor ou para falsa afiliação.

## Exemplos práticos

### Exemplo 1: deploy sem modificar

Um usuário faz deploy do LockBrief oficial, não muda código, mantém o rodapé e usa `wrangler.local.toml` privado com o `database_id` real.

Resultado: permitido. O código-fonte pode apontar para o repositório oficial/tag usada. O `wrangler.local.toml` e o `database_id` real não devem ser publicados.

### Exemplo 2: mudar cores e logotipo

Um operador troca paleta, logo, textos e nome da aplicação, depois publica a instância para clientes.

Resultado: permitido, mas a versão modificada deve oferecer o código-fonte correspondente sob AGPL-3.0. O rodapé ou página equivalente deve apontar para o fork, pacote ou repositório dessa versão.

### Exemplo 3: adicionar recurso fechado

Uma empresa adiciona painel administrativo ao mesmo Worker, hospeda para clientes e não publica o código do painel.

Resultado: não é compatível com a AGPL-3.0 se o painel fizer parte da obra coberta/modificada. O código correspondente deve ser oferecido aos usuários sob AGPL-3.0 ou a arquitetura/licenciamento precisa ser revista juridicamente.

### Exemplo 4: repositório operacional criado pelo Deploy Button

O Deploy Button cria um repositório na conta do operador e a Cloudflare grava IDs reais no `wrangler.toml`.

Resultado: o repositório operacional deve permanecer privado se a política for não publicar IDs reais. A obrigação de fonte pode ser cumprida com um repositório ou pacote sanitizado que contenha o código real modificado e placeholders para configuração.

### Exemplo 4.1: Deploy Button + modificação visual

O operador usa Deploy Button, deixa o repositório gerado privado, troca logo, cores e textos, e publica a instância para clientes.

Resultado: permitido, desde que os clientes tenham acesso ao código-fonte correspondente da versão modificada. A forma recomendada é manter o repositório operacional privado e criar um repositório público sanitizado com o mesmo código modificado, mas com `wrangler.toml` contendo apenas placeholders. O rodapé da instância deve apontar para esse repositório sanitizado.

### Exemplo 5: instância interna

Uma empresa modifica o LockBrief e disponibiliza apenas para funcionários autenticados.

Resultado: os usuários internos que interagem com a instância devem conseguir obter o código-fonte correspondente. Um repositório privado acessível a esses usuários pode ser suficiente, mas a empresa deve validar isso com sua assessoria jurídica.

## Checklist do operador

- [ ] O rodapé ou página equivalente aponta para o código-fonte correspondente da versão em produção.
- [ ] A licença AGPL-3.0 e o arquivo `LICENSE` foram preservados.
- [ ] Mudanças próprias estão identificadas em changelog, README ou documento equivalente.
- [ ] O repositório público não contém `.env`, `.dev.vars`, `wrangler.local.toml`, token, secret ou `database_id` real.
- [ ] `wrangler.toml` público é apenas template com placeholders.
- [ ] Secrets de produção estão no dashboard da Cloudflare ou foram definidos com `wrangler secret put`.
- [ ] Se o repositório operacional contém IDs reais, ele permanece privado.
- [ ] Usuários da instância conseguem obter o código-fonte correspondente sem custo.

## Referências oficiais

- Texto oficial da AGPL-3.0: <https://www.gnu.org/licenses/agpl-3.0.en.html>
- Configuração Wrangler: <https://developers.cloudflare.com/workers/wrangler/configuration/>
- Secrets em Workers: <https://developers.cloudflare.com/workers/configuration/secrets/>
- Environment variables em Workers: <https://developers.cloudflare.com/workers/configuration/environment-variables/>
- Deploy to Cloudflare Button: <https://developers.cloudflare.com/workers/platform/deploy-buttons/>
