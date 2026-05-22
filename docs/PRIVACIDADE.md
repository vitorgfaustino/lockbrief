# LockBrief — Privacidade e Minimização de Dados

## Dados tratados

| Dado | Armazenamento | Duração | Finalidade |
|---|---|---|---|
| `id_hash` (SHA-256 do ID) | D1 | Até consumo ou expiração | Identificação do segredo |
| `encrypted_payload` (envelope) | D1 | Até consumo ou expiração | Retorno do segredo criptografado |
| `expires_at` | D1 | Até cleanup | Expiração automática |
| `created_at` | D1 | Até consumo ou expiração | Auditoria técnica interna |
| `consumed_at` | D1 | Até cleanup | Coordenação de consumo único |
| `consume_token` | D1 | Efêmero (durante consumo) | Guarda de corrida transacional |

## Dados NÃO coletados

- IP do usuário
- User-Agent
- Cookies ou tokens de sessão
- Identificadores de dispositivo
- Dados de fingerprinting
- Histórico de navegação
- Analytics de usuário
- E-mail, nome, empresa ou qualquer dado pessoal
- Conteúdo do segredo em texto claro
- Chave de descriptografia
- Senha adicional
- Metadados do segredo (título, remetente, destinatário)

## Base técnica de minimização

- O Worker nunca recebe plaintext, chave ou senha adicional.
- A criptografia é feita exclusivamente no navegador do usuário via Web Crypto API.
- O banco D1 armazena apenas o envelope criptografado e campos estritamente necessários para controle de expiração e consumo.
- Os abuse controls usam contadores em memória, sem persistência.
- A limpeza de segredos expirados é automatizada via Cron Trigger.

## Retenção

- Segredos são removidos do D1 imediatamente após o consumo.
- Segredos não consumidos são removidos na primeira execução do cleanup após expiração.
- Nenhum dado de segredo persiste após o consumo ou expiração.

## Observabilidade

- A aplicação não registra logs de conteúdo, IDs, payloads ou dados de usuário.
- Para prover a rede e bloquear ataques de negação de serviço (DDoS), nosso provedor de infraestrutura (Cloudflare) coleta e processa transitoriamente o endereço IP na camada de borda (Edge), geralmente por 24 a 72 horas, para fins de telemetria de WAF e faturamento. A nossa aplicação, por sua vez, jamais persiste IPs, user-agents ou dados de sessão em bancos de dados.
- A observabilidade do Worker (`observability.enabled = true`) está configurada com `head_sampling_rate = 0.1` (10% das requisições). Isso coleta apenas métricas agregadas de latência e erros, sem incluir corpo de requisição, headers ou payloads. Essa configuração é aceitável sob a política de minimização pois não expõe dados de segredo e permite monitoramento operacional básico.
- Logs operacionais da plataforma Cloudflare (infraestrutura) podem existir conforme a política da Cloudflare, mas não incluem o conteúdo do fragmento de URL (que não é enviado ao servidor) nem o corpo das requisições.

## Configuração operacional e GitHub

- O repositório público não deve conter segredos, tokens, `.dev.vars`, `.env`, `wrangler.local.toml` ou `database_id` real.
- O `wrangler.toml` público contém somente placeholder e configuração não sensível.
- Em deploy manual, o `database_id` real fica em `wrangler.local.toml`, arquivo ignorado pelo Git.
- Em deploy por Cloudflare, valores reais ficam no dashboard ou no repositório operacional gerado. Se esse repositório contiver IDs reais, ele deve ser tratado como dado operacional do operador.

## LGPD

Esta aplicação foi projetada com Privacy by Design:
- Minimização de dados como princípio arquitetural.
- Ausência de dados pessoais identificáveis.
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
