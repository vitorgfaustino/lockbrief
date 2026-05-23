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
→ Worker: DELETE ... RETURNING encrypted_payload
→ Navegador: deriva K_final e descriptografa
```

O caminho principal remove e retorna o envelope criptografado em uma única instrução D1. O fallback para runtimes sem `DELETE ... RETURNING` usa `UPDATE` + `consume_token` + `SELECT` + `DELETE`; nesse fallback, uma interrupção extrema entre as etapas pode deixar uma sobra criptografada marcada como consumida até o próximo cleanup.

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
→ Worker: SELECT one_time, expires_at, encrypted_payload
→ Worker: deriva apenas requiresPassword a partir do campo kdf do envelope
→ Navegador: recebe { oneTime, expiresAt, requiresPassword } sem consumir o segredo
→ Este endpoint e usado apenas para exibir a UI correta (avisos/contador/pre-requisitos)
```

`/api/info` nunca retorna payload, envelope, `kdf`, `salt`, `iv`, `ciphertext`, chave, senha ou plaintext.
`/api/info` possui rate limit em memória, sem persistir IP ou qualquer identificador de cliente.

## Confirmação antes de consumo

Ao abrir um link válido, o cliente primeiro consulta `/api/info`, que não consome o segredo. A chamada consumidora `/api/fetch` só ocorre quando a pessoa clica em **"Revelar mensagem"**.

Em leitura única (`one_time = 1`), esse clique é o ponto de consumo: o Worker remove o registro ao retornar o envelope criptografado e o navegador faz a validação local de chave ou senha. Se a pessoa fechar a aba depois desse ponto, o segredo pode não ser recuperável, mesmo que ainda falte digitar chave ou senha correta.

## Bloqueio de bots e crawlers

O Worker bloqueia crawlers conhecidos, bots de preview, requisições `HEAD` e sinais explícitos de prefetch/prerender/preview antes das rotas da aplicação.

Esse controle:
- Reduz consultas ao D1 e trabalho de aplicação.
- Não persiste User-Agent nem qualquer metadado do cliente.
- Não substitui proteção na borda da Cloudflare para economia real de Worker requests.

Para reduzir contagem no plano gratuito, o operador deve configurar regras de segurança da Cloudflare antes do Worker.

## Limites do modelo

1. **Phishing de link**: Se o link for interceptado (ex: ferramenta de ticket, e-mail comprometido), o atacante pode acessar o segredo antes do destinatário legítimo. Use o modo "chave separada" para mitigar.

2. **Senha adicional não validada no servidor**: O servidor não sabe se a senha está correta. Senha incorreta resulta em falha de descriptografia AES-GCM, indistinguível de outros erros.

3. **Browser extension maliciosa**: Extensões com acesso ao DOM podem interceptar o segredo após descriptografia.

4. **Cloudflare como operador**: A Cloudflare opera a infraestrutura. Em caso de comprometimento da plataforma, o envelope criptografado poderia ser acessado, mas não descriptografado sem a chave (que está apenas no fragmento, não enviado ao servidor).

5. **Leitura única não é garantia absoluta**: O caminho principal usa `DELETE ... RETURNING` para reduzir a janela de corrida. O fallback mantém `consume_token`; em falha extrema do runtime, uma sobra criptografada consumida pode persistir até o cleanup.

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

Logs operacionais do Worker também não devem incluir payload, IDs, SQL detalhado ou mensagens internas do banco. Erros de banco são registrados com mensagens genéricas.

## Segurança operacional de configuração

- `wrangler.toml` é template público e deve conter apenas placeholders e configuração não sensível.
- `database_id` real, tokens, secrets, `.dev.vars`, `.env` e `wrangler.local.toml` nunca devem ir para o GitHub.
- Deploy manual com valores reais deve usar `wrangler.local.toml`.
- Deploy via painel deve manter secrets e variáveis reais na Cloudflare, não no repositório público.
- O Deploy Button pode gerar um repositório operacional com IDs reais provisionados pela Cloudflare. Se a política do operador proíbe IDs reais no GitHub, esse repositório deve permanecer privado ou o operador deve usar deploy manual.
- Durante atualização, um `wrangler.toml` operacional com IDs reais não deve ser substituído pelo template do upstream. Histórico Git divergente ou sem ancestral comum deve ser tratado por overlay protegido ou handoff manual, nunca por force push.
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
