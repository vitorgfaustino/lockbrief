# LockBrief — Comportamento Observável

## Modos de tela

### Tela Criar
- Formulário dividido em blocos: Mensagem, Proteção, Expiração e Leitura.
- Título principal: "Crie um segredo seguro.", sem subtítulo introdutório abaixo.
- Bloco Mensagem com textarea (64 KB máximo), contador de caracteres ao vivo e microcopy compacto "Criptografia local." alinhado na mesma linha quando houver largura disponível.
- O campo de mensagem usa label acessível, mas não exibe o texto visual "Segredo" acima do textarea.
- Bloco Proteção com controle segmentado para escolher entre chave automática e senha humana.
- Chave automática é o modo padrão mais forte. O resultado exibe link completo, link sem chave e chave separada.
- Senha humana permite que a pessoa defina a própria senha ou gere uma sugestão localmente no navegador para facilitar digitação ou ditado. O resultado exibe link completo e senha.
- Não existe fluxo de criação com chave separada e senha ao mesmo tempo.
- Bloco Expiração com TTL (1h/1d/1 semana).
- Toggle "Destruir após leitura" (ativado por padrão).
- Ao desativar "Destruir após leitura", a interface confirma que a nota será destruída apenas no prazo de expiração e poderá ser visualizada sem limite nesse intervalo.
- Botão "Criar link seguro" com ícone de cadeado e estado de carregamento.
- Ao submeter: criptografia local, envio ao Worker e redirecionamento para a tela de resultado.
- Whitespace do segredo é preservado exatamente como digitado.

### Tela Criado (sem senha)
- Exibe 3 cards: Link completo, Link sem chave e Chave.
- Cada card tem explicação de uso, campo somente leitura com contraste reforçado e botão de copiar com ícone plano e feedback "Copiado".
- Em valores longos, o campo somente leitura quebra linha para facilitar leitura e conferência no mobile.
- Exibe resumo local da configuração: expiração, leitura e proteção usada. O resumo não contém segredo, chave, senha, `rawId`, `idHash` ou payload.
- Botão "Criar novo segredo" com ícone de adição.

### Tela Criado (com senha)
- Exibe 2 cards: Link completo e Senha.
- Descrição adaptada: a senha precisa seguir por outro canal e não é enviada ao servidor.
- Exibe resumo local da configuração: expiração, leitura e proteção usada. O resumo não contém segredo, chave, senha, `rawId`, `idHash` ou payload.

### Tela Revelar (leitura única — oneTime=true)
- Detectada automaticamente quando a URL contém fragmento `#v1.`.
- Fragmento removido da barra com `history.replaceState`.
- Título: "Este segredo só pode ser revelado uma vez."
- A tela inicial é sempre uma confirmação e nunca solicita chave ou senha.
- A tela informa se será necessário ter a chave ou senha adicional em mãos depois da confirmação.
- Aviso de irreversibilidade (vermelho): ao clicar em "Revelar mensagem", a nota é removida do servidor.
- Botão "Revelar mensagem" com ícone de visualização.
- Botão "Cancelar" com ícone de retorno.

### Tela Revelar (multi-leitura — oneTime=false)
- Título: "Revele o segredo" (sem aviso de destruição).
- Badge verde com contador regressivo ao vivo: "Expira em Xh Ymin".
- Subtítulo: "Este segredo pode ser acessado novamente até a expiração."
- Sem avisos de destruição.
- A tela inicial é sempre uma confirmação e nunca solicita chave ou senha.
- Botão "Revelar mensagem" com ícone de visualização.

### Fluxo de validação de chave
1. Ao abrir o link, o cliente chama `/api/info` para obter metadados sem consumir o segredo.
2. Antes de qualquer consumo, a pessoa confirma a ação clicando em "Revelar mensagem".
3. Ao clicar em "Revelar mensagem", o cliente chama `/api/fetch`.
4. Em leitura única, o fetch pode consumir o segredo antes da validação local da chave.
5. Se a chave estiver malformada ou incorreta, o envelope fica em memória para retry local quando houver payload retornado.
6. Mensagem "Chave incorreta. Verifique e tente novamente." — campo de chave reabilitado.
7. Se o link completo veio com chave errada, o campo de chave aparece para correção.
8. Retry usa o envelope em memória — nunca faz novo fetch.

### Fluxo de validação de senha
1. Ao abrir o link, `/api/info` informa apenas que o envelope exige senha, sem retornar o envelope nem consumir o segredo.
2. A senha nunca aparece antes da confirmação.
3. Após o fetch, se o envelope exige senha (`kdf !== "none"`), o campo "Senha necessária" aparece dinamicamente.
4. Botão "Descriptografar" na primeira tentativa de senha.
5. Senha incorreta: mensagem "Senha incorreta. Tente novamente." + botão "Tentar novamente" (vermelho).
6. Retry usa o envelope em memória — nunca faz novo fetch.
7. Para multi-leitura (oneTime=false), não há aviso de destruição no campo de senha.

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

### Bots e crawlers
- `robots.txt` informa `Disallow: /` para desencorajar indexação.
- Bots, crawlers e previews de links conhecidos recebem bloqueio `403` antes das rotas da aplicação.
- Usuários reais em navegadores comuns continuam acessando o fluxo normal.
- Este bloqueio reduz uso de D1/CPU dentro do Worker; economia de contagem de Worker requests depende de regras configuradas na borda da Cloudflare.

### PWA e instalação no celular
- A aplicação publica manifesto PWA e ícones para permitir instalação pelo fluxo nativo do navegador em celulares e desktops compatíveis.
- O modo instalado abre o LockBrief em janela standalone, usando `/` como tela inicial.
- O PWA é online-first: criar, consultar metadados e revelar segredos continuam exigindo rede e não existe fila offline.
- O service worker usa cache local apenas para arquivos públicos estáticos do app. Ele não cacheia HTML, rotas `/api/*`, envelopes criptografados, payloads, segredos, chaves ou senhas.
- A instalação não adiciona botão próprio dentro da interface; o usuário usa a ação de instalação oferecida pelo navegador.

## Consistência visual

- Botões principais usam ícones planos alinhados à função: cadeado para criar, olho para revelar, cópia para copiar, casa para voltar, adição para novo segredo.
- Cards usam raio máximo de 8px e espaçamento consistente entre desktop e mobile.
- A interface evita efeitos decorativos pesados; o fundo usa textura discreta e o acento ciano fica restrito a foco, ações e informação técnica.
- Campos, labels e descrições usam contraste suficiente para leitura em fundo escuro sem alterar a paleta visual do projeto.
- Em mobile, campos de resultado usam tamanho de texto maior, podem quebrar linhas internamente e mantêm o botão de copiar abaixo do valor quando não houver largura suficiente.
- Em mobile, botões podem quebrar linha internamente e o botão de copiar segredo deixa de sobrepor a área de texto.
- O rodapé das páginas públicas exibe o ano civil atual calculado pelo Worker durante a requisição, a versão sincronizada com `package.json`, link de privacidade e link explícito "Código AGPL-3.0", centralizado e compacto no mobile, sem depender de script inline no navegador.
- O rodapé exibe "Criado por Vitor Faustino" como assinatura textual.

## Estados de erro do servidor

| Código | Significado | Mensagem pública |
|---|---|---|
| 400 | Validação de formato (idHash, TTL, envelope, body) | `invalid_request` |
| 403 | Bot, crawler ou preview bloqueado | `invalid_request` em rotas JSON; texto genérico em HTML |
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
- **Desktop amplo (>=1180px)**: largura máxima do layout de 1366px, mantendo a coluna principal em 708px e usando o espaço extra para ampliar a sidebar informativa.
- **Tablet (640-959px)**: uma coluna, painel abaixo.
- **Mobile (<640px)**: cards e painel informativo ocupam a largura total da viewport e começam alinhados ao menu, sem espaçamento vertical externo, sem cantos arredondados laterais, mantendo padding interno para evitar texto grudado nas bordas. Botões seguem com 44px+ e texto ajustado.
