# LockBrief — Comportamento Observável

## Terminologia de interface

“Senha automática” é a chave aleatória de 256 bits que pode ir no link; “Senha manual” é a senha adicional definida pela pessoa. A documentação técnica mantém “chave” quando descreve o material criptográfico.

## Modos de tela

### Tela Criar
- Formulário dividido em blocos: Mensagem, Proteção, Expiração e Leitura.
- Título principal: "Crie um segredo seguro.", sem subtítulo introdutório abaixo.
- Bloco Mensagem com textarea (64 KB máximo em bytes UTF-8, validado antes de criptografar; excesso preserva o texto e mostra a validação do campo), contador de bytes ao vivo e microcopy compacto "Criptografia local." alinhado na mesma linha quando houver largura disponível.
- O contador usa o mesmo limite do servidor (`TextEncoder().encode(...).byteLength`), não unidades UTF-16. O `maxlength` de 65.536 permanece apenas como teto de code units.
- O campo de mensagem usa o título visível "Mensagem" como nome acessível (`aria-labelledby`); não exibe o texto visual "Segredo" acima do textarea.
- Bloco Proteção com controle segmentado para escolher entre senha automática e senha manual. Os grupos usam `aria-labelledby`, roving tabindex e navegação por setas.
- Senha automática é o modo padrão mais forte. O resultado exibe link completo, link sem senha e senha automática separada.
- Senha manual permite que a pessoa digite a própria senha ou clique em "Gerar senha" para receber uma sugestão local. Escolher o modo não preenche o campo automaticamente; senha vazia mostra erro inline e não envia.
- A sugestão gerada combina 7 palavras de uma lista local de 72 com um sufixo de 3 dígitos (≈53 bits de entropia) e nunca sai do navegador. A sugestão é selecionada no campo para que digitar substitua o valor. O resultado exibe link completo e senha.
- Não existe fluxo de criação com senha automática separada e senha manual ao mesmo tempo.
- Bloco Expiração com TTL (1h/1d/1 semana).
- Toggle "Destruir após leitura" (ativado por padrão), com nome acessível, label clicável e alvo de 44x44 CSS px.
- Ao desativar "Destruir após leitura", a interface confirma que o segredo deixará de ficar disponível no banco ativo apenas no prazo de expiração e poderá ser visualizado sem limite nesse intervalo.
- Botão "Criar link seguro" com ícone de cadeado, estado de carregamento, `aria-busy` e anúncio "Processando..." em região viva.
- Ao submeter: criptografia local, envio ao Worker e redirecionamento para a tela de resultado.
- Whitespace do segredo é preservado exatamente como digitado.
- Texto vazio, excesso de bytes ou senha vazia mostram erro inline, `aria-invalid` e foco no campo.
- Em falha de criação (429, rede, erro interno), o rascunho permanece no formulário oculto e a tela de erro oferece retorno para tentar novamente. Em sucesso, o textarea e o campo de senha são limpos antes de a tela ser ocultada.

### Tela Criado (sem senha)
- Exibe 3 cards: Link completo, Link sem senha e Senha automática.
- O card Link completo exibe o badge discreto "Recomendado" ao lado do título, na cor de acento do tema.
- Senhas com aspas e caracteres especiais são exibidas literalmente, sem criar atributos HTML.
- Cada card tem explicação de uso, campo somente leitura com contraste reforçado e botão de copiar com ícone plano. O feedback "Copiado" só aparece depois que `navigator.clipboard.writeText` resolve; em falha, o campo é selecionado e a interface informa "Não foi possível copiar".
- No desktop, o botão Copiar fica no cabeçalho do card e o campo de link usa a largura total do card. No mobile, o botão fica abaixo do campo, com fundo discreto em tons de cinza do site e hover mais claro, sem o azul neon.
- Em valores longos, o campo somente leitura ajusta a altura ao conteúdo e quebra linha, sem cortar a última linha no mobile.
- Exibe aviso de que a senha automática ou a senha manual só existe naquela tela e deve ser copiada antes de sair. `beforeunload` e o clique em "Criar novo segredo" pedem confirmação.
- `Escape` não navega nas telas Criar/Criado; ele só atua em Revelar/Revelado.
- Exibe resumo local da configuração: expiração, leitura e proteção usada. O resumo não contém segredo, senha automática, senha manual, `rawId`, `idHash` ou payload.
- Botão "Criar novo segredo" com ícone de adição e confirmação de perda da cópia visível.

### Tela Criado (com senha)
- Exibe 2 cards: Link completo e Senha manual.
- O Link completo também recebe o badge "Recomendado" e o mesmo layout de cópia do modo sem senha.
- Descrição adaptada: a senha precisa seguir por outro canal e não é enviada ao servidor.
- Exibe o mesmo aviso de cópia única, a mesma confirmação de saída e o mesmo feedback real de cópia.
- Exibe resumo local da configuração: expiração, leitura e proteção usada. O resumo não contém segredo, senha automática, senha manual, `rawId`, `idHash` ou payload.

### Tela Revelar (leitura única — oneTime=true)
- Detectada automaticamente quando a URL contém fragmento `#v1.`.
- O `v1` do fragmento identifica o formato do link e permanece igual; ele é independente do envelope criptográfico v2 armazenado.
- Enquanto `/api/info` responde, a coluna mostra o overlay "Processando..." com `role="status"`; a tela não fica em branco.
- Fragmento removido da barra com `history.replaceState` imediatamente após o parse, antes de `/api/info`. O retry de 429/rede usa o `rawId` e a chave mantidos apenas em memória; recarregar a página nesse estado perde o link. Fragmento inválido também é removido da barra antes de a tela de criação aparecer.
- Título: "Este segredo só pode ser revelado uma vez."
- A tela inicial é sempre uma confirmação e nunca solicita senha automática ou manual.
- A tela informa se será necessário ter a senha automática ou a senha manual em mãos depois da confirmação.
- Aviso de irreversibilidade (vermelho): ao clicar em "Revelar mensagem", o segredo é removido do servidor.
- Botão "Revelar mensagem" com ícone de visualização.
- Botão "Cancelar" com ícone de retorno.
- O botão "Cancelar" usa listener externo compatível com a CSP e retorna à página inicial sem consumir o segredo.
- Depois do fetch, o card muda para "Mensagem localizada. Falta descriptografar.", o aviso vira "Em leitura única, o segredo já foi removido do banco ativo. Não feche esta tela até concluir." e o botão passa a ser "Sair e perder o acesso", com confirmação. Enquanto o envelope de leitura única estiver apenas em memória, `beforeunload` também pede confirmação.
- A troca de tela move o foco para o `h1`; erros usam `role="alert"`.

### Tela Revelar (multi-leitura — oneTime=false)
- Título: "Revele o segredo" (sem aviso de destruição).
- Badge verde com contador regressivo ao vivo: "Expira em Xh Ymin".
- Subtítulo: "Este segredo pode ser acessado novamente até a expiração."
- Sem avisos de destruição.
- A tela inicial é sempre uma confirmação e nunca solicita senha automática ou manual.
- Botão "Revelar mensagem" com ícone de visualização.
- Se o contador chegar a zero, o badge vira neutro "Expirado" e o botão de revelar é desabilitado.
- Depois do fetch, o card também muda para "Mensagem localizada. Falta descriptografar." e o requisito real; o segredo continua disponível até a expiração.

### Fluxo de validação da senha automática
1. Ao abrir o link, o cliente chama `/api/info` para obter metadados sem consumir o segredo.
2. Antes de qualquer consumo, a pessoa confirma a ação clicando em "Revelar mensagem".
3. Ao clicar em "Revelar mensagem", o cliente chama `/api/fetch`.
4. Em leitura única, o fetch pode consumir o segredo antes da validação local da senha automática.
5. Se a senha automática estiver malformada ou incorreta, o envelope fica em memória para retry local quando houver payload retornado.
6. Mensagem "Senha automática incorreta. Verifique e tente novamente." — campo de senha automática reabilitado e focado; o card já mostra o estado pós-fetch.
7. Se o link completo veio com senha automática errada, o campo de senha automática aparece para correção.
8. Retry usa o envelope em memória — nunca faz novo fetch.
9. Em erro, o campo recebe `aria-invalid` e `aria-describedby`; a mensagem usa `role="alert"`.

### Fluxo de validação de senha
1. Ao abrir o link, `/api/info` informa apenas que o envelope exige senha, sem retornar o envelope nem consumir o segredo.
2. A senha nunca aparece antes da confirmação.
3. Após o fetch, se o envelope exige senha (`kdf !== "none"`), o campo "Senha necessária" aparece dinamicamente, já focado.
4. O prompt é um `<form>`; `Enter` envia a senha, além do botão "Descriptografar".
5. Senha incorreta: mensagem "Senha incorreta. Tente novamente." + botão "Tentar novamente" (vermelho), campo focado e `role="alert"`.
6. Retry usa o envelope em memória — nunca faz novo fetch.
7. Para multi-leitura (oneTime=false), não há aviso de destruição no campo de senha.
8. Envelopes v1 existentes continuam compatíveis; novos segredos usam envelope v2 com parâmetros de KDF explícitos. Essa diferença não altera o fluxo visual.

### Tela Revelado (leitura única — oneTime=true)
- Título: "Segredo revelado."
- Subtítulo: "Este segredo foi removido do servidor. Guarde-o com segurança."
- Aviso vermelho: "Depois de sair desta tela, o segredo não poderá ser recuperado."
- `beforeunload` ativo para evitar saída acidental.
- Segredo exibido em `textContent` (monospace), dentro de uma região nomeada "Conteúdo"; botão "Copiar" com ícone plano e feedback real (só "Copiado" após a promessa do clipboard; falha mostra instrução manual).
- Inputs de senha automática e senha manual são limpos ao concluir a revelação ou sair da página; buffers mutáveis da chave automática são zerados como melhor esforço antes de perder a referência.
- A troca para a tela Revealed move o foco para o `h1`.

### Tela Revelado (multi-leitura — oneTime=false)
- Título: "Segredo revelado."
- Subtítulo: "Este segredo pode ser acessado novamente até a expiração."
- Badge verde com contador regressivo ao vivo; ao expirar, vira neutro "Expirado".
- Sem aviso de destruição, sem `beforeunload`.
- Segredo exibido em `textContent`, em região nomeada, com o mesmo feedback real de cópia.

### Tela Indisponível
- Respostas 404 durante `/api/info` ou `/api/fetch` levam ao estado genérico indisponível.
- A aplicação não repete automaticamente o fetch consumidor depois de erro de transporte: a resposta pode ter sido perdida após consumo no servidor.
- Mensagem genérica única: "Não foi possível abrir este segredo. Para proteger a privacidade, o LockBrief não informa a causa exata."
- Sem distinção entre expirado, consumido, inexistente, senha automática/manual incorreta.
- Exibe orientações genéricas sobre causas possíveis sem revelar o estado real do segredo.
- Inclui a possibilidade de tentativa anterior em leitura única com senha automática/manual incorreta seguida de fechamento da aba antes da correção local.
- Exibe nota de privacidade informando que nenhum conteúdo em texto claro foi enviado ao servidor.
- Botão "Voltar ao início" com ícone de casa.

### Tela de erro operacional
- Falhas que não são 404 usam uma tela separada, com mensagem específica e sem listar causas de indisponibilidade do segredo.
- Criação 429: "Muitas tentativas. Aguarde 60 segundos e tente novamente." O botão "Voltar e tentar novamente" reexibe o formulário com o rascunho preservado.
- Criação sem rede: "Sem conexão." com orientação para verificar a conexão. O rascunho também é preservado.
- Criação com erro interno: "Não foi possível criar o link." com aviso de que o envio não foi confirmado; o rascunho é preservado.
- `/api/info` 429, rede ou timeout de 10 s: "Não foi possível consultar o link." O fragmento já foi removido da barra de endereço; "Tentar novamente" repete a consulta com os dados em memória, sem recarregar a página.
- `/api/fetch` 429: "Muitas tentativas." O retry é seguro porque o servidor rejeita antes do consumo; usa o fragmento em memória.
- `/api/fetch` com falha ambígua de transporte: "Não foi possível buscar o segredo." Não repete automaticamente e avisa que a leitura única pode já ter sido consumida.

### Bots e crawlers
- `robots.txt` informa `Disallow: /` para desencorajar indexação.
- Bots, crawlers e previews de links conhecidos recebem bloqueio `403` antes das rotas da aplicação.
- Usuários reais em navegadores comuns continuam acessando o fluxo normal.
- Este bloqueio reduz uso de D1/CPU dentro do Worker; economia de contagem de Worker requests depende de regras configuradas na borda da Cloudflare.
- Rotas sensíveis também usam limites do Worker por rota e por recurso, sem IP ou cookie. Ao exceder o limite, recebem `429 invalid_request` com `Retry-After: 60`.
- Os limites são compartilhados dentro de cada localidade Cloudflare e podem bloquear temporariamente usuários legítimos durante um surto; não são garantia global exata.

### PWA e instalação no celular
- A aplicação publica manifesto PWA e ícones para permitir instalação pelo fluxo nativo do navegador em celulares e desktops compatíveis.
- O manifesto usa os novos ícones de 192px/512px como `any`, e o HTML referencia Apple Touch de 180px e favicon de 96px. Os caminhos antigos continuam disponíveis como aliases no build para clientes existentes.
- O modo instalado abre o LockBrief em janela standalone, usando `/` como tela inicial.
- O PWA é online-first: criar, consultar metadados e revelar segredos continuam exigindo rede e não existe fila offline.
- Cada build versiona o cache pelo conteúdo dos assets públicos; o service worker limpa caches antigos e usa somente o cache da versão ativa para fallback offline. Abas já abertas continuam com o JavaScript carregado até recarga.
- O service worker usa cache local apenas para arquivos públicos estáticos do app. Ele não cacheia HTML, rotas `/api/*`, envelopes criptografados, payloads, segredos, senhas automáticas ou manuais.
- A instalação não adiciona botão próprio dentro da interface; o usuário usa a ação de instalação oferecida pelo navegador.

## Consistência visual

- Botões principais usam ícones planos alinhados à função: cadeado para criar, olho para revelar, cópia para copiar, casa para voltar, adição para novo segredo.
- Cards usam raio de 12px, enquanto botões e inputs usam raio de 8px, mantendo o espaçamento consistente entre desktop e mobile.
- A interface evita efeitos decorativos pesados; o fundo usa grade sutil com propósito técnico e o acento ciano fica restrito a foco, ações e informação técnica.
- Vidro (backdrop blur) fica restrito ao header. Cards, painel informativo, rodapé e botão de copiar usam superfícies opacas; sombra e glow são seletivos.
- Campos, labels e descrições usam contraste mínimo de 4.5:1, incluindo `--text-faint` e placeholder, sem alterar a paleta visual do projeto.
- Em mobile, campos de resultado ajustam a altura ao conteúdo, quebram linha e mantêm o botão de copiar abaixo do valor quando não houver largura suficiente.
- Em mobile, botões podem quebrar linha internamente e o botão de copiar segredo deixa de sobrepor a área de texto.
- Controles segmentados quebram linha quando o texto é ampliado a 200%, sem cortar labels.
- O rodapé das páginas públicas exibe o ano civil atual calculado pelo Worker durante a requisição, a versão sincronizada com `package.json`, link de privacidade e link explícito "Código AGPL-3.0", centralizado e compacto no mobile, sem depender de script inline no navegador. Separadores são ocultados em telas estreitas para evitar órfãos.
- O rodapé exibe "Criado por Vitor Faustino" como assinatura textual.
- O logo completo usa `lockbrief-logo.png` com `width`/`height` explícitos. Favicon, Apple Touch e ícones PWA usam `lockbrief-mark.png`, somente o cadeado. O antigo `lockbrief.png` permanece como alias de compatibilidade no build.

## Estados de erro do servidor

| Código | Significado | Mensagem pública |
|---|---|---|
| 400 | Validação de formato (idHash, TTL, envelope, body) | `invalid_request` |
| 403 | Bot, crawler ou preview bloqueado | `invalid_request` em rotas JSON; texto genérico em HTML |
| 404 | Segredo indisponível (não existe, expirou, consumido, colisão) | `not_available` |
| 429 | Abuse control / throttle | `invalid_request` |
| 500 | Erro interno | `invalid_request` ou `not_available` na barreira global |

## Sanitização

- Todo conteúdo descriptografado vai para o DOM via `textContent`, nunca `innerHTML`.
- Segredos com HTML/JS são exibidos como texto plano.
- A limpeza de inputs e buffers reduz a exposição residual, mas JavaScript não fornece garantia de zeroização de strings ou cópias internas do runtime.

## Atalhos de teclado

- `Escape` nas telas Revelar/Revelado → retorna à página inicial, com confirmação quando a leitura única já foi buscada. `Escape` não navega em Criar/Criado/Indisponível/Erro.
- Navegação por Tab segue ordem visual.
- Grupos de rádio usam setas, Home/End e um único tab stop por grupo.
- No prompt de senha, `Enter` envia o formulário.
- Foco visível (`:focus-visible`) em todos elementos interativos.
- Transições de tela movem o foco para o `h1`; erros e status usam `role="alert"`/`aria-live`.

## Acessibilidade

- Todo controle tem nome acessível; labels visíveis são associados via `aria-labelledby`/`for` quando aplicável.
- `role="switch"`, `role="radiogroup"`, `role="radio"` nos controles customizados, com nome e estado.
- O switch de leitura única tem alvo de 44x44 CSS px e label clicável.
- `prefers-reduced-motion` respeitado, incluindo `scroll-behavior: auto`.
- Contraste mínimo 4.5:1 em todo o texto normal, incluindo placeholder, rodapé e contador.
- Botões e controles principais com altura mínima de 44px; links inline do rodapé seguem a exceção de texto inline da WCAG 2.5.8.
- Texto ampliado a 200% em 360px não corta labels; os controles segmentados refluem.
- A região do segredo revelado é nomeada ("Conteúdo") e focável para leitura/scroll por teclado.

## Responsividade

- **Desktop (>=960px)**: duas colunas (formulário + painel informativo).
- **Desktop amplo (>=1180px)**: largura máxima do layout de 1366px, mantendo a coluna principal em 708px e usando o espaço extra para ampliar a sidebar informativa.
- **Tablet (640-959px)**: uma coluna, painel abaixo.
- **Mobile (<640px)**: cards e painel informativo ocupam a largura total da viewport e começam alinhados ao menu, sem espaçamento vertical externo, sem cantos arredondados laterais, mantendo padding interno para evitar texto grudado nas bordas. Botões seguem com 44px+ e texto ajustado.
- **Texto a 200%**: controles segmentados quebram linha, o formulário não cria overflow horizontal e labels permanecem legíveis em 360px.

## Atualização de manutenção 1.2.1

Atualizar Worker e assets juntos incorpora as correções de falha, limite UTF-8 e cache descritas neste documento, sem mudar formato de links/envelopes. Ícones novos mantêm URLs antigas por aliases. O sincronizador opcional da demo não cria um novo fluxo de produto nem requisito para outras instalações; seu processo de PR/CI/merge está no [runbook privado](SINCRONIZACAO-DEMO.md).

## Correções da 1.2.2 (2026-11-07)

- Contraste de `--text-faint` e placeholder elevado para 4.5:1; tokens de ciano antigos consolidados.
- Switch de leitura única nomeado, label clicável e alvo de 44x44.
- Grupos de rádio com nome, roving tabindex e setas.
- Foco movido para o `h1` nas trocas de tela; erros e status anunciados.
- Texto a 200% em 360px sem clipping; segmentados com quebra de linha.
- `Escape` limitado às telas de revelação; proxy de saída adicionado à tela Criado.
- Erros operacionais separados do 404 genérico; rascunho preservado em falha de criação.
- Retry seguro para 429; `/api/info` usa dados em memória após remover o fragmento; falha ambígua de `/api/fetch` não repete automaticamente.
- Feedback de cópia baseado no resultado real do clipboard.
- Senha manual sem preenchimento automático silencioso; sugestão só ao clicar em "Gerar senha".
- Contador em bytes UTF-8; badge expirado deixa de usar verde; reduced motion cobre scroll suave.
- Copy de privacidade distingue "não vê" de "não armazena"; em dash e "nota" removidos do texto visível.
- Direção visual registrada em [`DESIGN.md`](../DESIGN.md).
