# LockBrief — Direção visual

Este documento registra a direção visual vigente do LockBrief. Ele não propõe redesign: descreve o que já existe, por que existe e quais limites devem ser preservados em correções futuras.

## Modo do produto

**Operate.** O visitante completa uma tarefa: criar, copiar, confirmar a leitura e revelar um segredo. Clareza, previsibilidade e confiança têm prioridade sobre expressão visual. O produto não é uma landing page de marketing.

## Identidade

- Ferramenta de segurança efêmera, discreta e técnica.
- Interface em PT-BR, com vocabulário estável: **segredo**, não “nota”.
- Dark mode fixo, sem toggle. A razão é de produto: uso noturno, discrição e coerência com ferramentas de segurança. Não adicionar tema claro sem decisão explícita do mantenedor.
- A identidade vem do fluxo do segredo — senha automática no fragmento, senha manual local, leitura única, confirmação antes do consumo, retry local — não de ornamentos.

**Terminologia da interface:** “Senha automática” é a chave aleatória de 256 bits que pode ir no link; “Senha manual” é a senha adicional definida pela pessoa. A documentação técnica mantém “chave” quando descreve o material criptográfico.

## Paleta

- Base: slate escuro (`#030712`, `#080e1d`, `#020617`).
- Acento: ciano (`#22d3ee`), reservado para foco, ação primária e informação técnica.
- Estados: verde (`#10b981`) para disponibilidade, âmbar (`#f59e0b`) para atenção, vermelho (`#ef4444`) para erro/destruição.
- Não usar gradientes azul-roxo, arco-íris, neon em excesso ou uma segunda cor de marca. O ciano é o único acento.
- Texto: `#f8fafc` (primário), `#e2e8f0` (secundário), `#94a3b8` (mutado), `#7c8ba1` (faint). O token faint foi elevado para cumprir 4.5:1 nos fundos usados.

## Tipografia

- Sans de sistema para leitura e formulários: reduz dependência externa, mantém legibilidade e combina com o registro utilitário.
- Mono de sistema para senhas automáticas, links, contadores e micro-labels técnicos: sinaliza “dado verificável”, não decoração.
- Títulos usam sans, não mono. Monoespaçado em título grande não faz parte da identidade.
- Não introduzir webfonts externas sem necessidade de produto.

## Superfícies e profundidade

- Cards: raio de 12px, borda de 1px, fundo quase opaco.
- Inputs, botões e blocos de link: raio de 8px.
- Badges e o track do switch podem ser pills; o resto não.
- Vidro (backdrop blur) fica restrito ao header. Cards, painel informativo, rodapé e botão de copiar usam superfícies opacas.
- Sombra é seletiva: um card pode ter sombra curta; o painel informativo não precisa de sombra.
- Glow fica restrito a foco e ao CTA primário. Não empilhar glow em card + botão + badge + ícone + fundo ao mesmo tempo.

## Textura

- O fundo usa grade de 44px em alpha muito baixo e um mesh radial sutil.
- Razão: reforçar a leitura de “ferramenta técnica/blueprint” sem competir com o conteúdo. A grade não é um mapa, canvas ou blueprint funcional; é identidade assumida.
- Se a grade competir com texto ou performance em dispositivo real, reduzir ou remover antes de adicionar outro ornamento.

## Movimento

- Transições curtas de tela e de prompt, com propósito de orientar a mudança de estado.
- Sem parallax, carrossel, loop ambiente ou animação decorativa.
- `prefers-reduced-motion`: sem animações/transições e sem scroll suave. O estado de carregamento continua anunciado por texto em região viva.

## Acessibilidade como contrato

- Todo controle tem nome acessível; o switch de leitura única usa `aria-labelledby` e o texto visível é clicável.
- Alvos de toque: mínimo de 44x44 CSS px nos controles principais; links inline do rodapé seguem a exceção de texto inline da WCAG 2.5.8.
- Contraste mínimo 4.5:1 para texto normal; placeholder incluído.
- Foco visível em todos os elementos interativos.
- Grupos de rádio usam `aria-labelledby`, roving tabindex e setas.
- Texto a 200% em 360px não pode cortar labels; controles segmentados quebram linha.
- Transições de tela movem o foco para o `h1`; erros usam `role="alert"`/`aria-live`.
- O formulário preserva o rascunho em falhas operacionais; o segredo não é limpo sem aviso.

## Estados

- **Criar:** formulário em quatro blocos, erros inline, contador em bytes UTF-8.
- **Criado:** três artefatos (link completo, link sem senha, senha automática) ou dois (link completo, senha manual); aviso de que a senha automática ou manual só existe naquela tela; guarda de saída. O Link completo é o caminho recomendado e recebe um badge discreto; no desktop o Copiar fica no cabeçalho para o campo usar a largura total, no mobile fica abaixo com fundo discreto em cinza.
- **Revelar:** confirmação antes do consumo; após o fetch, o card muda para “Mensagem localizada. Falta descriptografar.” e o cancelamento vira “Sair e perder o acesso”.
- **Revelado:** segredo em `<pre>` com nome acessível, cópia com feedback real e aviso de irreversibilidade em leitura única.
- **Indisponível:** mensagem genérica para 404, sem revelar causa.
- **Erro operacional:** tela separada para criação, 429, rede, consulta de link e falha ambígua de fetch.

## Razões registradas (R-31)

- **Dark fixo:** produto de segurança, uso discreto/noturno e identidade já estabelecida.
- **Ciano:** acento único, ligado a foco, ação e informação técnica.
- **Grade:** textura técnica assumida; não é conteúdo nem decoração aleatória.
- **Mono:** dados verificáveis (senha automática, link, contador), não estética de terminal.
- **Vidro no header:** separa chrome de conteúdo sem transformar todos os cards em vidro.
- **Raios 12/8:** cards maiores, controles menores; consistência entre mobile e desktop.
- **Movimento curto:** orienta mudança de estado; não é espetáculo.

## Marca e ativos

- O logo completo usa `lockbrief-logo.png` (cadeado + wordmark).
- O favicon, o Apple Touch e os ícones PWA usam `lockbrief-mark.png` (somente o cadeado), mantendo a separação entre marca e ícone.
- O asset antigo `lockbrief.png` foi removido da fonte; o build mantém `/assets/lockbrief.png` como alias de compatibilidade para clientes/caches antigos.
- O painel “Como funciona” é onboarding real na criação. Colapsá-lo nas telas de ação é uma decisão de produto opcional, não uma exigência de identidade.

## Fora de escopo

Redesign, troca de paleta, light mode, novas telas de produto, contas, analytics, prova social, FAQ artificial, mudança de criptografia/envelope/TTL ou deploy.
