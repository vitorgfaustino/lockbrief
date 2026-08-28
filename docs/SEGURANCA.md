# LockBrief — Segurança

## Reportando vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança, **não abra uma issue pública**.

Envie um e-mail para o mantenedor com:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial

## Escopo de segurança

O modelo de segurança do LockBrief assume:

1. **O backend não recebe a chave no fluxo normal**: O Worker e o D1 armazenam e servem o envelope, mas o cliente oficial não envia plaintext, chave ou senha adicional.
2. **O origin é confiável para integridade**: O servidor e a infraestrutura que entregam `client.js`, HTML, service worker e assets precisam fornecer o código oficial sem adulteração. Um origin comprometido pode capturar novos segredos antes da criptografia.
3. **O navegador é confiável**: A criptografia ocorre localmente e a chave é manuseada no navegador do usuário.
4. **O link é o segredo**: Quem possui o link completo possui acesso ao segredo. A senha adicional mitiga parcialmente este risco.
5. **O transporte é seguro**: HTTPS é obrigatório (Cloudflare fornece por padrão).

## Algoritmos utilizados

| Propósito | Algoritmo | Parâmetros |
|---|---|---|
| Criptografia | AES-GCM-256 | IV 96 bits aleatório |
| Hash de ID | SHA-256 | 32 bytes de entrada |
| Derivação de senha | PBKDF2-SHA256 | 210.000 iterações, salt 128 bits; explícito no envelope v2 |
| Combinação de chaves | HKDF-SHA256 | RFC 5869; `lockbrief:v1:kdf` legado ou `lockbrief:v2:kdf` atual |
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
K_final = HKDF-SHA256(key || K_pwd, salt="", info="lockbrief:v2:kdf", 256 bits)
(iv, ciphertext) = AES-GCM-256(K_final, plaintext)
```

Novas criações usam envelope v2 e gravam os parâmetros aceitos em `kdfParams`. O domínio HKDF v2 separa criptograficamente novas derivações do formato legado.

### Compatibilidade de envelopes

- Envelope v1 permanece somente para leitura, com 210.000 iterações e `lockbrief:v1:kdf` implícitos.
- Envelope v2 é usado para novas criações e exige parâmetros explícitos na allowlist.
- O Worker rejeita versões, iterações e domínios HKDF desconhecidos antes de persistir.
- A evolução futura deve criar nova versão/allowlist; não deve reinterpretar um envelope já emitido.
- O fragmento de URL `#v1` tem versionamento próprio e não muda com o envelope v2.

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
`/api/info` possui contenção por isolate e pelo Workers Rate Limiting API, sem usar IP, cookie ou fingerprint. O limite por recurso usa um novo SHA-256 de `rota:idHash` como chave do contador.

## Confirmação antes de consumo

Ao abrir um link válido, o cliente primeiro consulta `/api/info`, que não consome o segredo. A chamada consumidora `/api/fetch` só ocorre quando a pessoa clica em **"Revelar mensagem"**.

Em leitura única (`one_time = 1`), esse clique é o ponto de consumo: o Worker remove o registro ao retornar o envelope criptografado e o navegador faz a validação local de chave ou senha. Se a pessoa fechar a aba depois desse ponto, o segredo pode não ser recuperável, mesmo que ainda falte digitar chave ou senha correta.

## Bloqueio de bots e crawlers

O Worker bloqueia crawlers conhecidos, bots de preview, requisições `HEAD` e sinais explícitos de prefetch/prerender/preview antes das rotas da aplicação.

Esse controle:
- Reduz consultas ao D1 e trabalho de aplicação.
- Não persiste User-Agent nem qualquer metadado do cliente.
- Não substitui proteção na borda da Cloudflare para economia real de Worker requests.

O projeto não pressupõe acesso a WAF pago. Para reduzir contagem no plano gratuito, o operador pode usar somente controles gratuitos que estejam efetivamente disponíveis na conta e na zona. Quando nenhum controle anterior ao Worker estiver disponível, o bloqueio em código continua reduzindo trabalho de aplicação, mas não a contagem da requisição.

## Rate limiting no Worker

O template configura bindings do Workers Rate Limiting API, que não dependem de regra WAF paga. A camada aplica limites por rota e por recurso antes das consultas D1.

Limites conhecidos:

- O contador é local a cada localidade Cloudflare, permissivo e eventualmente consistente.
- A chamada ocorre depois que o Worker iniciou; portanto não evita que a requisição conte na cota do plano Free.
- O limite por rota é coletivo naquela localidade e pode causar bloqueio temporário de usuários legítimos durante surtos.
- Falha do binding é fail-open para preservar disponibilidade, mas o fallback em memória do isolate continua ativo.
- Não é proteção suficiente contra ataque distribuído por várias localidades.

## Segurança da cadeia de fornecimento

- `package-lock.json` é versionado e a CI instala dependências com `npm ci`.
- Scripts de instalação de dependências usam allowlist versionada e modo estrito do npm; versões novas de `esbuild` e `workerd` exigem revisão antes da aprovação, e o script opcional de `fsevents` é negado.
- A CI falha quando `npm audit --audit-level=high` encontra vulnerabilidade alta ou crítica.
- GitHub Actions são fixadas por SHA imutável e executam com permissões explícitas mínimas.
- O checkout da CI não mantém credenciais Git após obter o código.
- A CI não instala nem executa código de PR externo; somente pushes, PRs do mantenedor e Dependabot entram no job de qualidade.
- Dependabot verifica npm e GitHub Actions semanalmente, sem merge ou deploy automático.
- Atualizações ainda exigem revisão humana, porque uma versão sem advisory conhecido pode introduzir regressão ou mudança maliciosa.

## PWA e service worker

O LockBrief pode ser instalado como PWA em navegadores compatíveis. O service worker faz parte do limite de confiança do navegador e existe apenas para permitir a experiência instalada e cachear arquivos públicos estáticos.

Regras de segurança do PWA:

- O service worker não intercepta nem cacheia navegações, `/`, `/api/*`, requisições `POST` ou qualquer resposta de segredo.
- O cache fica limitado a `/client.js`, `/styles.css`, `/manifest.webmanifest`, favicons, logo e ícones PWA.
- Não há push notification, background sync, fila offline, IndexedDB, `localStorage`, cookies ou armazenamento local de envelopes.
- A chave no fragmento `#...` continua fora das requisições HTTP; o service worker não recebe esse fragmento em eventos `fetch`.
- HTML e APIs continuam com `Cache-Control: no-store`.
- A CSP permite `worker-src 'self'` apenas para registrar `/sw.js` no mesmo origin.

Risco residual: se um navegador mantiver assets antigos em cache, uma versão anterior do cliente pode continuar ativa por curto período. O service worker usa estratégia network-first para assets, limpa caches antigos no `activate` e não cacheia respostas sensíveis.

## Limites do modelo

1. **Phishing de link**: Se o link for interceptado (ex: ferramenta de ticket, e-mail comprometido), o atacante pode acessar o segredo antes do destinatário legítimo. Use o modo "chave separada" para mitigar.

2. **Senha adicional não validada no servidor**: O servidor não sabe se a senha está correta. Senha incorreta resulta em falha de descriptografia AES-GCM, indistinguível de outros erros.

3. **Browser extension maliciosa**: Extensões com acesso ao DOM podem interceptar o segredo após descriptografia.

4. **Cloudflare e operador da instância**: O envelope armazenado não é descriptografável sem a chave. Entretanto, quem controla a entrega do cliente web pode adulterar JavaScript futuro e capturar plaintext, chave ou senha antes da criptografia. A arquitetura web não protege contra comprometimento ativo do origin.

5. **Leitura única não é garantia absoluta**: O caminho principal usa `DELETE ... RETURNING` para reduzir a janela de corrida. O fallback mantém `consume_token`; em falha extrema do runtime, uma sobra criptografada consumida pode persistir até o cleanup.

6. **Exclusão lógica e Time Travel**: Consumo e cleanup removem o registro do banco ativo e o tornam indisponível ao aplicativo. O D1 mantém histórico de Time Travel gerenciado pela Cloudflare por até 7 dias no plano gratuito ou 30 dias no pago. Um operador autorizado pode restaurar um estado anterior; o material restaurado continua criptografado.

7. **Rate limiting não global**: Os bindings reduzem abuso dentro de uma localidade, mas não garantem limite global exato nem economizam a invocação que já chegou ao Worker.

## Cuidados com senha adicional

- A senha adicional nunca é enviada ao Worker.
- O salt da senha fica armazenado no envelope criptografado.
- Sem o salt, mesmo com a senha correta, a descriptografia falha.
- PBKDF2 usa custo fixo de 210.000 iterações. Senhas humanas fracas continuam sujeitas a ataque offline contra o envelope; prefira a senha gerada pelo aplicativo ou o modo de chave automática.

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
- Buffers mutáveis `Uint8Array` de chave são sobrescritos com zeros como melhor esforço após o uso ou substituição.
- Strings, cópias internas do runtime, memória já coletada e dados exibidos no DOM não oferecem garantia de zeroização em JavaScript.
- Nenhum dado sensível é armazenado em `localStorage`, `sessionStorage` ou cookies.
- O CacheStorage do PWA armazena apenas assets públicos estáticos e nunca deve conter segredo, envelope, chave, senha ou resposta de API.

**O que está fora do nosso controle:**
- Extensões com `content_scripts` em `document_start` podem interceptar o fragmento antes de qualquer JavaScript da página executar.
- Keyloggers em nível de sistema operacional.
- Malware com acesso ao processo do navegador.

Estes riscos são inerentes ao modelo de computação no navegador e afetam qualquer aplicação web de segurança, não apenas o LockBrief. Para máxima segurança, recomende que o destinatário abra o link em um perfil de navegador limpo, sem extensões, ou em uma janela anônima/privada.
