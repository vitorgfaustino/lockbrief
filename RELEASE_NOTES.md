# Release Notes — LockBrief v1.1.1

Data: 2026-05-29

## Resumo

Esta versão traz o redesign visual completo do LockBrief. O design foi refinado para uma estética dark premium, hacker-minimalista e com efeito de vidro fosco (glassmorphism), seguindo as especificações do orientador de interface do projeto.

O modelo de segurança principal do aplicativo permanece intocado: a criptografia e a descriptografia ocorrem exclusivamente no navegador (Web Crypto API), e nenhuma chave, segredo em texto plano ou senha adicional é enviada ou armazenada no servidor.

## Principais mudanças (Redesign Visual)

- **Nova Paleta Dark Premium:** A interface agora usa tons profundos de Zinc e Slate 950 como fundo primário (`#030712`), combinados com um glow radial superior ciano neon sutil e uma grade de fundo ultra discreta.
- **Glassmorphism Refinado:** Os cards e painéis receberam bordas semitransparentes de `1px solid rgba(255, 255, 255, 0.08)`, blur de fundo (`backdrop-filter: blur(24px)`) e sombreamento interno reflexivo para simular profundidade física.
- **Arredondamento Lock (Consistency Lock):**
  * Cards principais e painéis de ajuda: `12px` (raio suave e moderno).
  * Inputs, segmented controls e botões: `8px`.
  * Elementos de switch e menores: `6px`.
- **Transições Suaves:** Telas e seções internas agora transitam com uma animação automática de fade-in e slide-up suave de 250ms ao serem unhidden no navegador.
- **Micro-interações Táteis:** Botões de ações primárias/secundárias, toggles e segmented controls agora respondem ao clique com feedback tátil de encolhimento (`scale(0.98)`) e possuem estados de hover com transições de curva spring.
- **Estilos CLI/Código:** As caixas de exibição de segredos revelados e campos readonly (como links gerados) agora utilizam fundo escuro estilo terminal (`#020617`), e os botões de cópia têm feedbacks mais limpos de estado "Copiado".

## Outras atualizações incorporadas

- Suporte completo a PWA instalável no celular e desktop (com Service Worker e manifesto).
- Correção de cálculo dinâmico de ano no rodapé das páginas (calculado no Worker na requisição).
- Links para o código-fonte AGPL-3.0 explícitos e compactos.

## Validação da release

- `npm run typecheck` passou com sucesso.
- `npm run build` compilou com sucesso.
- `npm test` passou com todas as 29 suites de teste validadas.
- Verificação local atestou total integridade da interface e dos fluxos criptográficos de criação/revelação.
