# Política de Segurança

## Reportar vulnerabilidade

Não abra issue pública com vulnerabilidades, segredos, tokens ou dados pessoais.

Use um canal privado com o mantenedor e inclua:

- descrição objetiva da falha
- passos para reproduzir
- impacto estimado
- versão ou commit testado

## Escopo

Estão no escopo:

- falhas que exponham plaintext, chave ou senha adicional ao Worker
- falhas de consumo único que permitam múltiplas leituras indevidas
- bypass de validações das APIs
- XSS ou execução de HTML/JS dentro do segredo revelado
- vazamento de dados sensíveis por logs, headers, GitHub ou configuração pública

Fora de escopo:

- extensões maliciosas do navegador com permissão sobre a página
- malware no dispositivo do usuário
- links compartilhados com destinatários errados
- instâncias de terceiros alteradas fora do código oficial

## Regra de configuração

Nunca publique:

- `wrangler.local.toml`
- `.dev.vars`
- `.env`
- tokens, chaves ou secrets reais
- `database_id` real de uma instância operacional
- payloads ou capturas contendo segredos

O `wrangler.toml` do repositório é somente template público.
