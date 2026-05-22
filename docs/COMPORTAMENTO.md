# LockBrief — Comportamento Observável

## Modos de tela

### Tela Criar
- Formulário com textarea (64 KB máximo), contador de caracteres ao vivo.
- Linha com TTL (1h/1d/1 semana) e campo opcional de senha adicional.
- Toggle "Destruir após leitura" (ativado por padrão).
- Botão "Criar link seguro" com ícone de cadeado e estado de carregamento.
- Ao submeter: criptografia local, envio ao Worker e redirecionamento para a tela de resultado.
- Whitespace do segredo é preservado exatamente como digitado.

### Tela Criado (sem senha)
- Exibe 3 cards: Link completo, Link sem chave e Chave.
- Cada card tem explicação de uso e botão de copiar com ícone plano e feedback "Copiado".
- Botão "Criar novo segredo" com ícone de adição.

### Tela Criado (com senha)
- Exibe 2 cards: Link completo e Senha.
- Descrição adaptada: a senha precisa seguir por outro canal e não é enviada ao servidor.

### Tela Revelar (leitura única — oneTime=true)
- Detectada automaticamente quando a URL contém fragmento `#v1.`.
- Fragmento removido da barra com `history.replaceState`.
- Título: "Este segredo só pode ser revelado uma vez."
- Aviso de irreversibilidade (vermelho).
- Se o link não contém a chave, exibe campo para colar a chave e aviso de destruição.
- Botão "Revelar agora" com ícone de visualização.
- Botão "Cancelar" com ícone de retorno.

### Tela Revelar (multi-leitura — oneTime=false)
- Título: "Revele o segredo" (sem aviso de destruição).
- Badge verde com contador regressivo ao vivo: "Expira em Xh Ymin".
- Subtítulo: "Este segredo pode ser acessado novamente até a expiração."
- Sem avisos de destruição.
- Botão "Revelar agora" com ícone de visualização.

### Fluxo de validação de chave
1. Ao clicar em "Revelar agora", o cliente chama `/api/fetch`.
2. Em leitura única, o fetch pode consumir o segredo antes da validação local da chave.
3. Se a chave estiver malformada ou incorreta, o envelope fica em memória para retry local quando houver payload retornado.
4. Mensagem "Chave incorreta. Verifique e tente novamente." — campo de chave reabilitado.
5. Se o link completo veio com chave errada, o campo de chave aparece para correção.
6. Retry usa o envelope em memória — nunca faz novo fetch.

### Fluxo de validação de senha
1. Após o fetch, se o envelope exige senha (`kdf !== "none"`), o campo "Senha necessária" aparece dinamicamente.
2. Botão "Descriptografar" na primeira tentativa de senha.
3. Senha incorreta: mensagem "Senha incorreta. Tente novamente." + botão "Tentar novamente" (vermelho).
4. Retry usa o envelope em memória — nunca faz novo fetch.
5. Para multi-leitura (oneTime=false), não há aviso de destruição no campo de senha.

### Tela Revelado (leitura única — oneTime=true)
- Título: "Segredo revelado."
- Subtítulo: "Este segredo foi removido do servidor. Guarde-o com segurança."
- Aviso vermelho: "Depois de sair desta tela, o segredo não poderá ser recuperado."
- `beforeunload` ativo para evitar saída acidental.
- Segredo exibido em `textContent` (monospace), botão "Copiar" com ícone plano.

### Tela Revelado (multi-leitura — oneTime=false)
- Título: "Segredo revelado."
- Subtítulo: "Este segredo pode ser acessado novamente até a expiração."
- Badge verde com contador regressivo ao vivo.
- Sem aviso de destruição, sem `beforeunload`.
- Segredo exibido em `textContent`, botão "Copiar".

### Tela Indisponível
- Mensagem genérica única: "Não foi possível abrir este segredo. Para proteger a privacidade, o LockBrief não informa a causa exata."
- Sem distinção entre expirado, consumido, inexistente, chave/senha incorreta.
- Exibe orientações genéricas sobre causas possíveis sem revelar o estado real do segredo.
- Inclui a possibilidade de tentativa anterior em leitura única com chave/senha incorreta seguida de fechamento da aba antes da correção local.
- Exibe nota de privacidade informando que nenhum conteúdo em texto claro foi enviado ao servidor.
- Botão "Voltar ao início" com ícone de casa.

## Consistência visual

- Botões principais usam ícones planos alinhados à função: cadeado para criar, olho para revelar, cópia para copiar, casa para voltar, adição para novo segredo.
- Cards usam raio máximo de 8px e espaçamento consistente entre desktop e mobile.
- A interface evita efeitos decorativos pesados; o fundo usa textura discreta e o acento ciano fica restrito a foco, ações e informação técnica.
- Em mobile, botões podem quebrar linha internamente e o botão de copiar segredo deixa de sobrepor a área de texto.

## Estados de erro do servidor

| Código | Significado | Mensagem pública |
|---|---|---|
| 400 | Validação de formato (idHash, TTL, envelope, body) | `invalid_request` |
| 404 | Segredo indisponível (não existe, expirou, consumido, colisão) | `not_available` |
| 429 | Abuse control / throttle | `invalid_request` |
| 500 | Erro interno | `invalid_request` |

## Sanitização

- Todo conteúdo descriptografado vai para o DOM via `textContent`, nunca `innerHTML`.
- Segredos com HTML/JS são exibidos como texto plano.

## Atalhos de teclado

- `Escape` na tela de revelação → retorna à página inicial.
- Navegação por Tab segue ordem visual.
- Foco visível (`:focus-visible`) em todos elementos interativos.

## Acessibilidade

- `aria-label` em todos os botões e controles.
- `role="switch"`, `role="radiogroup"`, `role="radio"` nos controles customizados.
- Labels associados a inputs via `for`/`id`.
- `prefers-reduced-motion` respeitado.
- Contraste mínimo 4.5:1 em todo o texto.
- Botões com altura mínima de 44px em mobile.

## Responsividade

- **Desktop (>=960px)**: duas colunas (formulário + painel informativo).
- **Tablet (640-959px)**: uma coluna, painel abaixo.
- **Mobile (<640px)**: cards com padding reduzido, botões 44px+, texto ajustado.
