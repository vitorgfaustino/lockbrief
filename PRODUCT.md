# Contexto de produto

## Register

product

## Usuários e finalidade

Pessoas que compartilham segredos efêmeros por link e operadores que instalam o software em suas próprias contas Cloudflare. Criar, confirmar a leitura e revelar são os fluxos existentes.

## Identidade e limites

Preservar a identidade atual, os componentes e o idioma PT-BR. Esta auditoria corrige falhas funcionais; não introduz redesign, rastreamento, contas, integrações ou novas telas de produto.

## Princípios

- Criptografia no navegador e chave fora das requisições HTTP.
- Confirmação explícita antes do consumo e retry local com o envelope em memória.
- Erros públicos genéricos sem exposição do estado interno.
- Atualizações preservam links, envelopes legados, dados e configuração operacional.
- O upstream distribui código e não opera produção.

## Acessibilidade

Manter labels, foco de teclado, controles existentes, dimensões móveis e preferência de movimento reduzido descritos em `docs/COMPORTAMENTO.md`. A validação funcional não equivale a certificação de acessibilidade.
