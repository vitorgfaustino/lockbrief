# LockBrief — Segurança

## Reportando vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança, **não abra uma issue pública**.

Envie um e-mail para o mantenedor com:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial

## Escopo de segurança

O modelo de segurança do LockBrief assume:

1. **O servidor é honesto mas não confiável**: O servidor armazena e serve dados, mas nunca deve ter acesso ao conteúdo descriptografado.
2. **O navegador é confiável**: A criptografia ocorre localmente e a chave é manuseada apenas no navegador do usuário.
3. **O link é o segredo**: Quem possui o link completo possui acesso ao segredo. A senha adicional mitiga parcialmente este risco.
4. **O transporte é seguro**: HTTPS é obrigatório (Cloudflare fornece por padrão).

## Algoritmos utilizados

| Propósito | Algoritmo | Parâmetros |
|---|---|---|
| Criptografia | AES-GCM-256 | IV 96 bits aleatório |
| Hash de ID | SHA-256 | 32 bytes de entrada |
| Derivação de senha | PBKDF2-SHA256 | 210.000 iterações, salt 128 bits |
| Combinação de chaves | HKDF-SHA256 | RFC 5869, info string "lockbrief:v1:kdf" |
| Geração de aleatórios | crypto.getRandomValues | CSPRNG do navegador |
| Codificação | base64url (RFC 4648 §5) | Sem padding |

## Fluxo criptográfico

### Criação de segredo (sem senha)
```
rawId = random(256 bits)
key   = random(256 bits)
K_final = key
(iv, ciphertext) = AES-GCM-256(K_final, plaintext)
idHash = base64url(SHA-256(rawId))
```

### Criação de segredo (com senha)
```
rawId = random(256 bits)
key   = random(256 bits)
salt  = random(128 bits)
K_pwd = PBKDF2-SHA256(password, salt, 210000, 256 bits)
K_final = HKDF-SHA256(key || K_pwd, salt="", info="lockbrief:v1:kdf", 256 bits)
(iv, ciphertext) = AES-GCM-256(K_final, plaintext)
```

### Leitura de segredo (leitura unica — one_time = 1)
```
idHash = base64url(SHA-256(rawId do link))
→ Worker: UPDATE consumed_at + RETURNING encrypted_payload
→ Worker: DELETE
→ Navegador: deriva K_final e descriptografa
```

### Leitura de segredo (multi-leitura — one_time = 0)
```
idHash = base64url(SHA-256(rawId do link))
→ Worker: SELECT encrypted_payload (sem UPDATE, sem DELETE)
→ Navegador: deriva K_final e descriptografa
→ Segredo permanece no servidor ate expiracao
```

### `/api/info` — metadados sem consumo
```
idHash = base64url(SHA-256(rawId do link))
→ Worker: SELECT one_time, expires_at
→ Navegador: recebe { oneTime, expiresAt } sem consumir o segredo
→ Este endpoint e usado apenas para exibir a UI correta (avisos/contador)
```

## Limites do modelo

1. **Phishing de link**: Se o link for interceptado (ex: ferramenta de ticket, e-mail comprometido), o atacante pode acessar o segredo antes do destinatário legítimo. Use o modo "chave separada" para mitigar.

2. **Senha adicional não validada no servidor**: O servidor não sabe se a senha está correta. Senha incorreta resulta em falha de descriptografia AES-GCM, indistinguível de outros erros.

3. **Browser extension maliciosa**: Extensões com acesso ao DOM podem interceptar o segredo após descriptografia.

4. **Cloudflare como operador**: A Cloudflare opera a infraestrutura. Em caso de comprometimento da plataforma, o envelope criptografado poderia ser acessado, mas não descriptografado sem a chave (que está apenas no fragmento, não enviado ao servidor).

5. **Leitura única não é garantia absoluta**: Duas requisições concorrentes extremamente próximas podem, em teoria, ambas passarem pelo `UPDATE` antes do `DELETE`. O fluxo transacional com `consume_token` reduz este risco a uma janela mínima.

## Cuidados com senha adicional

- A senha adicional nunca é enviada ao Worker.
- O salt da senha fica armazenado no envelope criptografado.
- Sem o salt, mesmo com a senha correta, a descriptografia falha.
- PBKDF2 com 210.000 iterações oferece resistência significativa a brute force offline.

## Política de erro genérico

Todas as falhas públicas de revelação retornam a mesma mensagem:

> "Este segredo não está disponível. Ele pode ter expirado, já ter sido revelado ou o link pode estar incorreto."

Nunca é revelado se o segredo:
- Nunca existiu
- Expirou
- Já foi consumido
- Teve erro de descriptografia (senha incorreta)
- Teve colisão de leitura concorrente

## Segurança operacional de configuração

- `wrangler.toml` é template público e deve conter apenas placeholders e configuração não sensível.
- `database_id` real, tokens, secrets, `.dev.vars`, `.env` e `wrangler.local.toml` nunca devem ir para o GitHub.
- Deploy manual com valores reais deve usar `wrangler.local.toml`.
- Deploy via painel deve manter secrets e variáveis reais na Cloudflare, não no repositório público.
- O Deploy Button pode gerar um repositório operacional com IDs reais provisionados pela Cloudflare. Se a política do operador proíbe IDs reais no GitHub, esse repositório deve permanecer privado ou o operador deve usar deploy manual.
- O template público publica `workers.dev` por padrão, mas mantém Preview URLs desligadas para não expor rotas adicionais sem decisão explícita do operador.

## Limites do navegador (extensões e side-channels)

O LockBrief opera no navegador — o limite de confiança do sistema. Extensões instaladas com permissões sobre a página podem, em teoria:

- Ler o DOM e capturar o segredo após descriptografia.
- Capturar inputs de chave e senha antes do envio.
- Ler o fragmento da URL antes da aplicação removê-lo com `history.replaceState`.
- Acessar a área de transferência (clipboard) após o usuário copiar.

**O que o LockBrief faz para reduzir a exposição:**
- Remove o fragmento da URL o mais cedo possível no carregamento.
- Usa `textContent` (nunca `innerHTML`) para exibir o segredo.
- Atributos `translate="no"` e `spellcheck="false"` no elemento de revelação.
- Buffers `Uint8Array` de chave são sobrescritos com zeros após o uso.
- Nenhum dado sensível é armazenado em `localStorage`, `sessionStorage` ou cookies.

**O que está fora do nosso controle:**
- Extensões com `content_scripts` em `document_start` podem interceptar o fragmento antes de qualquer JavaScript da página executar.
- Keyloggers em nível de sistema operacional.
- Malware com acesso ao processo do navegador.

Estes riscos são inerentes ao modelo de computação no navegador e afetam qualquer aplicação web de segurança, não apenas o LockBrief. Para máxima segurança, recomende que o destinatário abra o link em um perfil de navegador limpo, sem extensões, ou em uma janela anônima/privada.
