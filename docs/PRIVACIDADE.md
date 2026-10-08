# LockBrief — Privacidade e Minimização de Dados

## Dados tratados

| Dado | Armazenamento | Duração | Finalidade |
|---|---|---|---|
| `id_hash` (SHA-256 do ID) | D1 ativo | Até consumo ou expiração | Identificação do segredo |
| `encrypted_payload` (envelope) | D1 ativo | Até consumo ou expiração | Retorno do segredo criptografado |
| `expires_at` | D1 | Até cleanup | Expiração automática |
| `created_at` | D1 | Até consumo ou expiração | Auditoria técnica interna |
| `consumed_at` | D1 | Até cleanup | Coordenação de consumo único |
| `consume_token` | D1 | Efêmero (durante consumo) | Guarda de corrida transacional |
| `requiresPassword` | Não persistido separadamente | Apenas na resposta de `/api/info` | Indicar se a UI deve preparar campo de senha após confirmação |
| Método, URL, resposta e metadados de invocação | Workers Logs | Amostra e retenção definidas pela plataforma/plano | Observabilidade operacional da instância |
| User-Agent e headers de prefetch | Não persistidos pela aplicação em D1 | Apenas durante a requisição | Bloqueio efêmero de bots, crawlers e previews |
| Hash de `rota:idHash` | Contador gerenciado pelo Workers Rate Limiting API | Janela configurada de 60 segundos; retenção interna é controlada pela Cloudflare | Conter repetição contra uma rota/recurso sem usar IP |
| Assets públicos do PWA | CacheStorage do navegador | Controlado pelo navegador e pelo service worker | Instalação e carregamento de arquivos estáticos |

## Dados NÃO coletados

- IP persistido pela aplicação em D1
- User-Agent persistido
- Cookies ou tokens de sessão
- Identificadores de dispositivo
- Dados de fingerprinting
- Histórico de navegação
- Analytics de usuário
- Segredos ou envelopes no CacheStorage do PWA
- E-mail, nome, empresa ou qualquer dado pessoal
- Conteúdo do segredo em texto claro
- Chave de descriptografia
- Senha adicional
- Metadados do segredo (título, remetente, destinatário)

## Base técnica de minimização

- No cliente oficial e não modificado, o Worker nunca recebe plaintext, chave ou senha adicional.
- A criptografia é feita exclusivamente no navegador do usuário via Web Crypto API.
- O banco D1 armazena apenas o envelope criptografado e campos estritamente necessários para controle de expiração e consumo.
- `/api/info` retorna apenas metadados mínimos (`oneTime`, `expiresAt`, `requiresPassword`) e não retorna payload, envelope, chave, senha ou conteúdo.
- Os abuse controls combinam contadores em memória com o Workers Rate Limiting API. Não usam IP, cookie, conta ou fingerprint; para limites por recurso, enviam ao binding somente SHA-256 de `rota:idHash`.
- O bloqueio de bots usa apenas avaliação efêmera de User-Agent e headers de prefetch/preview, sem armazenamento.
- A limpeza de segredos expirados é automatizada via Cron Trigger.
- A instalação PWA usa CacheStorage apenas para arquivos públicos estáticos (`client.js`, CSS, manifesto, logo, favicons e ícones). HTML, `/api/*`, payloads, envelopes, chaves, senhas e segredos não são cacheados.

## Retenção

- Segredos são removidos do banco D1 ativo imediatamente após o consumo.
- Segredos não consumidos são removidos na primeira execução do cleanup após expiração.
- Sobras criptografadas marcadas como consumidas por fallback são removidas pelo cleanup após margem curta de segurança.
- O aplicativo deixa de acessar o registro depois do consumo ou cleanup. Isso não equivale a apagamento físico imediato de toda cópia da infraestrutura.
- O D1 mantém Time Travel automaticamente. Estados anteriores do banco podem ser restaurados por um operador autorizado por até 7 dias no plano gratuito ou 30 dias no plano pago. Esse histórico contém o envelope criptografado e metadados, não plaintext ou chave.
- A remoção ou expiração de segredos no servidor não depende do cache PWA, porque o service worker não armazena respostas de API nem envelopes.

## Observabilidade

- A aplicação não registra logs de conteúdo, IDs, payloads ou dados de usuário. O cleanup pode registrar somente a quantidade agregada de registros removidos, usando `meta.changes`; não registra os registros individuais.
- Logs de erro do Worker usam mensagens genéricas, sem interpolar erro interno do D1.
- A Cloudflare processa IP, dados de roteamento e outros metadados necessários para entregar e proteger o serviço. A duração e os campos disponíveis dependem do produto, plano e configuração do operador; este projeto não promete uma janela fixa de retenção da plataforma.
- O Workers Rate Limiting API mantém contadores internos por localidade. A aplicação configura janela de 60 segundos, não consulta esses contadores e não os copia para D1 ou logs próprios; a retenção técnica interna da plataforma não é controlada pelo LockBrief.
- A observabilidade do Worker (`observability.enabled = true`) usa `head_sampling_rate = 0.1`. Workers Logs pode registrar uma amostra das invocações com método, URL, resposta e metadados relacionados; não se limita a métricas agregadas.
- O código da aplicação não envia conteúdo, `idHash`, payload, senha ou chave para `console.log`. O fragmento `#...` não integra a requisição HTTP e, portanto, não aparece na URL recebida pelo Worker.
- O operador deve revisar a configuração e a retenção real de Workers Logs. Se os logs de invocação não forem necessários, deve desabilitá-los explicitamente no `wrangler.toml` operacional.

## Configuração operacional e GitHub

- O repositório público não deve conter segredos, tokens, `.dev.vars`, `.env`, `wrangler.local.toml` ou `database_id` real.
- O `wrangler.toml` público contém somente placeholder e configuração não sensível.
- Em deploy manual, o `database_id` real fica em `wrangler.local.toml`, arquivo ignorado pelo Git.
- Em deploy por Cloudflare, valores reais ficam no dashboard ou no repositório operacional gerado. Se esse repositório contiver IDs reais, ele deve ser tratado como dado operacional do operador.
- Durante atualização por upstream, `wrangler.toml` operacional com IDs reais deve ser preservado. Não use merge forçado, reset ou push forçado para substituir a configuração operacional pelo template público.

## LGPD

Esta aplicação foi projetada com Privacy by Design:
- Minimização de dados como princípio arquitetural.
- Ausência de contas e de identificadores pessoais persistidos deliberadamente pela aplicação.
- Processamento efêmero sem retenção prolongada.
- Transparência total sobre o que o servidor acessa.

Para questões de privacidade: abra uma issue no GitHub.

## Aviso legal

Este documento descreve a política de privacidade do software LockBrief conforme distribuído pelo autor (Vitor Faustino). O operador de cada instância do LockBrief é o responsável pelo tratamento de dados realizado por meio dela.

O autor do software:
- Não opera instâncias de terceiros.
- Não tem acesso aos dados processados por instâncias operadas por terceiros.
- Não é responsável pelo conteúdo dos segredos compartilhados pelos usuários.
- Disponibiliza o código sob licença AGPL-3.0 "como está", sem garantias.

Operadores de instâncias próprias devem:
- Revisar e adaptar esta política conforme sua jurisdição.
- Garantir conformidade com LGPD e demais legislações aplicáveis.
- Manter transparência sobre o processamento de dados em sua instância.

## Atualizações da fonte

O upstream distribui software e não possui banco D1 remoto ou produção próprios. Esta auditoria não altera coleta, retenção, amostragem de observabilidade ou parâmetros criptográficos. A correção de consumo impede anunciar metadados de sobras já consumidas. O cache PWA continua restrito a arquivos públicos, com versão derivada de seu conteúdo e sem envelopes ou identificadores de segredo.

## Automação de manutenção opcional

O sincronizador da demo não recebe segredos da aplicação, não consulta D1 remoto e não registra valores operacionais do Wrangler. Relatórios incluem versões, SHA, caminhos e resultados de validação; credenciais GitHub privadas não são entregues ao upstream nem aos testes. O sandbox valida código com configuração pública, sem copiar arquivos de ambiente privados. A preparação não altera coleta ou retenção de dados do produto.
