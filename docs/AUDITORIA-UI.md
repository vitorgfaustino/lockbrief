# LockBrief — auditoria de UI (Impeccable + antislop)

**Data:** 2026-11-06
**Commit:** `507a1a3`
**Versão auditada:** `1.2.1` (correções entregues na `1.2.2`)
**Escopo:** fluxo criar → criado → revelar → revelado, estados de erro/indisponível, página de privacidade, viewports 360/768/1280, teclado, foco, contraste, movimento reduzido e texto a 200%.
**Natureza:** auditoria somente leitura. As correções aprovadas foram aplicadas em entrega separada e estão resumidas na seção 12.

---

## 1. Resumo executivo

- **Impeccable audit:** **13/20 — Acceptable** (Acessibilidade 2/4, Performance 3/4, Theming 3/4, Responsive 2/4, Integridade 3/4).
- **antislop AFTER:** **24 achados** (20 Hard Gate/HIGH, 2 Purpose-Gate/MEDIUM, 2 Quality Lock/LOW); **Delivery Gate FAIL no estado auditado**. A seção 12 registra as correções aplicadas e a verificação pós-correção.
- **Cruzamento:** **0 P0, 7 P1, 15 grupos de P2 e 8 grupos de P3** (a lista consolidada está na seção 5).
- **Top 5 P1:** switch de leitura única sem nome/label/alvo; contraste de `--text-faint`/placeholder; perda da única cópia no Criado (`Escape` + clipboard + saída); copy contraditório no pós-fetch; estados de erro operacionais tratados como “segredo indisponível”.
- **O que está bom:** fluxo de três artefatos, confirmação honesta de leitura única, política de privacidade, foco visível, performance 0.99, sem overflow horizontal no estado padrão.

**Veredito curto:** o fluxo principal é completável e a base técnica é boa (Lighthouse 0.99 de performance, sem overflow horizontal nos estados normais, foco visível consistente, política de privacidade forte). O que impede o produto de estar pronto para uma divulgação mais ampla é a combinação de **acessibilidade incompleta no controle mais importante**, **contraste abaixo do documentado**, **perda silenciosa de dados em atalhos e falhas operacionais** e **estados de revelação que não reconhecem que o segredo já saiu do servidor**.

Não há P0: nenhum caminho principal está bloqueado para todos os usuários. Há um conjunto de P1 que atinge a promessa central do produto — o segredo chega (ou não) a quem precisa, sem perda silenciosa.

> **Status:** este documento registra o estado **auditado**, antes das correções. As correções aprovadas e a verificação pós-correção estão na seção 12. Onde o texto diz que um controle “não tem” nome ou que um contraste “está abaixo”, leia como diagnóstico da auditoria, não como estado atual.
>
> **Terminologia atual da UI:** “Senha automática” substitui “Chave automática”; “Senha manual” substitui “Senha humana”. Onde este relatório histórico diz “chave” para o artefato de interface, leia “senha automática”. A documentação técnica mantém “chave” para o material criptográfico.

---

## 2. Como a auditoria foi executada

Quatro passadas independentes sobre a mesma base de evidências:

1. **Impeccable — Assessment A (design review).** Contexto isolado, sem detector e sem resultados de axe. Avaliou especificidade, heurísticas de Nielsen, carga cognitiva, jornada emocional, forças, problemas prioritários, personas e perguntas provocativas.
2. **Impeccable — Assessment B (detector + browser evidence).** Contexto isolado, sem o relatório A. Rodou o detector Impeccable nos arquivos-fonte, Lighthouse, inspeção de browser via Chrome headless/CDP e cruzou axe, layout, console, teclado e movimento.
3. **Impeccable — auditoria técnica (`audit`).** Contexto isolado, sem os relatórios A/B. Avaliou acessibilidade, performance, theming, responsive e integridade de implementação, com score 0-4 por dimensão.
4. **antislop — modo AFTER.** Contexto isolado, sem os resultados do Impeccable. Aplicou as 40 regras, os tiers e o Delivery Gate, com achados numerados e regra violada.

A separação foi deliberada: cada skill tem uma natureza diferente (crítica de design vs. filtro normativo) e, no mesmo contexto, uma ancora a outra. As passadas A e B do Impeccable também não viram os resultados uma da outra, como a própria skill exige.

### 2.1 Evidências coletadas

- 25 screenshots de estados reais em 360/768/1280, incluindo criação, carregamento, criado (senha automática/manual), revelar (única/multi), prompt de senha manual, erro de senha manual, erro de senha automática, revelado, indisponível e privacidade.
- `axe-core` em 11 estados, com violações e incompletos por estado.
- Medições de layout: overflow horizontal, alvos de toque, dimensões de viewport, texto a 200%.
- Auditoria de teclado: ordem de Tab, foco visível, outline/borda/box-shadow.
- Auditoria de movimento: `prefers-reduced-motion` e comparação de durações.
- Console, page errors e request failures.
- Lighthouse mobile simulado: performance 0.99, acessibilidade 0.94–0.95, boas práticas 1.00, SEO 0.66 (intencional).
- Detector Impeccable nos arquivos-fonte: 1 advisory (`codex-grid-background`); 0 erros.
- Testes dirigidos de erro: `/api/store` 429, `/api/store` falha de rede, `/api/info` 429, clipboard negado.

### 2.2 Limitações

- O browser integrado do harness retornou `browser.disconnected` nas sessões dos subagentes. A inspeção visual usou screenshots oficiais e uma sessão auxiliar de Chrome headless via CDP; não houve aba visível no Review pane.
- Sem leitor de tela real (VoiceOver/NVDA), sem dispositivo móvel real, sem Safari/Firefox. Os achados de ARIA/foco vêm de axe, árvore de acessibilidade e teclado.
- O contraste foi calculado a partir dos tokens CSS e de aproximações de fundo sólido; o fundo tem gradiente/grade, e o axe marcou `color-contrast` como `incomplete`. Os valores de 2.54–2.66:1 e 3.03:1 são suficientemente baixos para resistir à variação do gradiente, mas não são uma amostragem de pixels.
- O detector via URL retorna 403 por causa do bot filter intencional; por isso, o detector foi rodado nos arquivos-fonte.
- Lighthouse é laboratório (mobile simulado em localhost), não campo.
- O 404 de `POST /api/info` no estado indisponível é esperado; não é erro de asset.

---

## 3. Placar e leitura por skill

### 3.1 Impeccable — Assessment A

- **Especificidade:** parcialmente específico. O ciclo de vida do segredo é autoral; a moldura visual (dark + ciano + vidro + grade + mono) é de categoria.
- **Nielsen:** 24/40 — Acceptable (60%).
- **Carga cognitiva:** moderada; 3 de 8 verificações falham (foco único, hierarquia visual, divulgação progressiva).
- **Jornada emocional:** o pico é o clique de revelar; o fim não fecha com a sensação de cuidado.
- **Forças:** handoff de três artefatos, confirmação honesta de leitura única, telas de indisponibilidade e privacidade.
- **P1:** pós-fetch sem mudança de estado; tela única de falha para criação/429/rede; cópia que mente e Criado sem guarda; senha sugerida concatenada; toggle sem nome/alvo/label.

### 3.2 Impeccable — Assessment B

- **Lighthouse:** 0.99 / 0.94–0.95 / 1.00 / 0.66; FCP 0.8–1.0 s, LCP 1.4 s, TBT 0 ms, CLS 0.079.
- **Detector:** 1 advisory (`codex-grid-background`, `styles.css:74`), 0 erros.
- **P1:** switch sem nome acessível e label inerte; contraste real de `--text-faint` 2.54–2.66:1 e placeholder 3.03:1; `Escape` global apaga link/chave/rascunho.
- **P2:** 200% de texto corta “Senha humana” em 360; prompt de senha sem foco/Enter/erro anunciado; radiogroups sem nome/setas; senha concatenada; submit vazio silencioso; cópia sem anúncio e com falso sucesso; foco perdido nas transições.
- **P3:** `aria-label` em div genérica; scroll suave ignora reduced motion; logo com tagline embutida + CLS + 50 KiB; contador UTF-16 vs UTF-8; meta Apple deprecated/overlay morto.

### 3.3 Impeccable — auditoria técnica

- **Score:** 13/20 — Acceptable. Acessibilidade 2/4; Performance 3/4; Theming 3/4; Responsive 2/4; Integridade 3/4.
- **Achados:** 18 — P0 0, P1 5, P2 9, P3 4.
- **P1:** switch sem nome/label; contraste de `--text-faint`/placeholder; texto a 200% em 360 corta “Senha humana”; foco/status não anunciados em transições e erros; `Escape` na tela Criado descarta link/chave/senha.
- **Falsos positivos refutados:** foco visível funciona; 40x22 e links de 16px não violam 2.5.8 pela exceção de espaçamento; o kill global de 0.01ms não é falha por si; o CLS 0.079 não vem do logo; o Lighthouse não absolve o contraste (axe `incomplete`).
- **Leitura:** a arquitetura de privacidade é específica do produto; o que falta é execução de estados e semântica, não um novo mundo visual.

### 3.4 antislop — modo AFTER

- **Modo:** AFTER, `session override`. Delivery Gate **FAIL**.
- **Achados:** 24 — 20 Hard Gate (HIGH), 2 Purpose-Gate (MEDIUM), 2 Quality Locks (LOW).
- **O que o antislop adiciona ao Impeccable:** em dash em copy de interface (R-02); “O que o servidor não vê” vs “não persiste” (R-36); kicker “Privacidade” duplicando o H1 (R-09); badge verde “Expirado” (R-27); link completo cortado no textarea mobile (R-03); “nota” vs “segredo” (R-31); dose de vidro/sombra/brilho (R-10/R-12/R-13).
- **O que o antislop não viu:** o clipping de “Senha humana” a 200% em 360 (faltou a captura mobile); o CLS não é atribuível ao logo; a WCAG 2.5.8 tem exceção de espaçamento para o toggle de 40x22.
- **Não é achado para o antislop:** grid de fundo (R-07, identidade documentada), dark mode fixo (R-21), acento ciano (R-01/R-29), tipografia de sistema/mono (R-06), ícones próprios (R-04), cards de link (R-14 são campos, não features), links inline do rodapé (exceção 2.5.8), painel “Como funciona” (C-3 onboarding real).
- **Conclusão do antislop:** a identidade não precisa de redesign; o problema é execução de contraste, alvos, nomes, estados, cópia e claims.

---

## 4. Matriz cruzada

A matriz completa está na seção 4. Legenda de concordância:

- **Ambos:** as duas famílias de skill chegaram ao mesmo problema por caminhos independentes. Sinal forte; priorizar.
- **Só Impeccable:** problema de UX, hierarquia, estado ou acessibilidade que o antislop não cobre.
- **Só antislop:** padrão de slop/identidade que o Impeccable trata como advisory ou decisão de marca.
- **Conflito:** as recomendações divergem; a resolução está na seção 6.

| ID | Achado | Impeccable | antislop | Concordância | Sev. |
|---|---|---|---|---|---|
| U-01 | Switch de leitura única sem nome/label; alvo 40x22 | A/B/C P1 | AS-02/03 (R-03/R-39) | ambos | **P1** |
| U-02 | Contraste `--text-faint` 2.54–2.66:1; placeholder 3.03:1 | A/B/C P1 | AS-04/05 (R-25) | ambos | **P1** |
| U-03 | Criado sem proteção da única cópia; Escape/clipboard/saída | A/B/C P1 | AS-10/11 (R-32/R-27) | ambos | **P1** |
| U-04 | Pós-fetch mantém copy “antes do clique”; Cancelar não cancela | A P1 | AS-08 (R-27) | ambos | **P1** |
| U-05 | Criação/429/rede caem em “Segredo indisponível”; rascunho perdido; `/api/info` 429 perde o link | A P1 + teste dirigido | R-27 (D não testou o caso) | A + teste | **P1** |
| U-06 | Foco/status não anunciados; prompt de senha sem foco/Enter | B/C P1 | AS-14/15 (R-32/R-39) | ambos | **P1** |
| U-07 | Texto a 200% em 360 corta “Senha humana” | B P2, C P1 | D não viu (lacuna) | B/C | **P1** |
| U-08 | Senha sugerida concatenada ao digitar | A P1; B/C P2; D HIGH | AS-13 (R-38) | ambos | **P2 alta** |
| U-09 | Revelar em branco enquanto `/api/info` responde | A/C P2 | AS-06 (R-27) | ambos | **P2** |
| U-10 | Loading do CTA sem texto/`aria-busy`; disabled parece ativo | C P2 | AS-07 (R-27/R-39) | ambos | **P2** |
| U-11 | Radiogroups sem nome e sem setas | B/C P2 | AS-03 (R-39) | ambos | **P2** |
| U-12 | Região do segredo sem nome; “Mensagem” vs “Segredo” | C P2 | AS-03 (R-39) | ambos | **P2** |
| U-13 | Submit vazio silencioso | A/B/C P2/P3 | AS-12 (R-26) | ambos | **P2** |
| U-14 | Link completo corta a 4ª linha no textarea 360 | A/B não viram | AS-09 (R-03) | só antislop | **P2** |
| U-15 | Badge “Expirado” continua verde e CTA ativo | não testado | AS-17 (R-27) | só antislop | **P2** |
| U-16 | Reduced motion não desliga scroll; loading perde texto | B/C P2 | AS-16 (R-39) | ambos | **P2** |
| U-17 | Contador UTF-16 vs limite UTF-8 | B/C P2 | não citado | Impeccable | **P2** |
| U-18 | “Sem rastreamento”/“não vê” vs “não persiste” | A P3 | AS-19 (R-36) | ambos | **P2** |
| U-19 | Vidro/sombra/brilho acima do dose cap; shell de categoria | A/C | AS-22 (R-10/12/13) | ambos | **P2** |
| U-20 | Falta `DESIGN.md`; docs prometem 44px/4.5:1/aria-label/Escape | context/B/C | R-31 OPEN; R-37 PASS | ambos | **P2** |
| U-21 | Segmentos 40px/toggle 22px; 2.5.8 não violado pela exceção | B/C P2 | AS-02 (R-03) | ambos | **P2** |
| U-22 | Logo com tagline ilegível/duplicada; sem dimensões; 51,6 KiB | A/B/C | AS-20/23 (R-40/R-31) | ambos | **P2/P3** |
| U-23 | `aria-label` em div genérica no indisponível | B P3 | não citado | Impeccable | **P3** |
| U-24 | Meta Apple deprecated; overlay morto; sem `aria-busy` | B/C P3 | AS-07 (R-27) | ambos | **P3** |
| U-25 | Em dash no título/aria-label/copy | — | AS-01 (R-02) | só antislop | **P3\*** |
| U-26 | “Nota” e “segredo” como sinônimos | — | AS-24 (R-31) | só antislop | **P3** |
| U-27 | Kicker “Privacidade” duplica o H1 | A shell genérico | AS-21 (R-09) | ambos | **P3** |
| U-28 | Rodapé órfão; check em falha; copiar sobre texto | A P3 | AS-18 (R-03) | ambos | **P3** |
| U-29 | Drift de tokens de ciano/`theme-color` | C P3 | não citado | Impeccable | **P3** |
| U-30 | 4 blurs grandes; fundo fixo; CSS bloqueante; minify off | C P3 | AS-22 (R-10) | ambos | **P3** |
| U-31 | Código morto; strings fora do i18n; timer sem limpeza | C P3 | não citado | Impeccable | **P3** |
| U-32 | Grid de fundo advisory | B/C P3 | R-07 PASS | conflito | **P3** |

\* Em dash: o antislop marca Hard Gate HIGH; o cruzamento trata como P3 de higiene de copy porque o texto é voz existente do produto. O mantenedor decide se troca.

---

## 5. Achados por prioridade

### P1 — corrigir antes de release

#### P1-01 — Switch “Destruir após leitura” sem nome acessível, label inerte e alvo 40x22

**Evidência:** axe `button-name` critical em 360/768/1280; árvore de acessibilidade com `role=switch, name=""`; clicar no label não alterna; medidas 40x22; `ui.ts:213-218`; `styles.css:505-518`.

**Impacto:** o controle que define leitura única vs multi-leitura não é identificável por leitor de tela, tem alvo pequeno para toque e promete uma interação no label que não existe.

**Correção:** `id` no label + `aria-labelledby`; linha inteira clicável; alvo ≥44x44; se possível, checkbox nativo estilizado. Testar com VoiceOver/NVDA e teclado.

**Aceite:** axe 0 `button-name`; nome acessível “Destruir após leitura”; clique no texto alterna; alvo ≥44x44; `Space` alterna.

#### P1-02 — Contraste de `--text-faint` e placeholder abaixo de 4.5:1

**Evidência:** `#475569` sobre `#030712` = 2.66:1, sobre card = 2.54:1; placeholder a 55% = 3.03:1; axe `color-contrast` incomplete; `docs/COMPORTAMENTO.md:156` promete 4.5:1.

**Impacto:** rodapé, tagline, contador e placeholder ficam difíceis de ler para baixa visão. O Lighthouse passou porque o axe não mede o fundo texturizado; não é prova de conformidade.

**Correção:** `--text-faint` para `#7c8ba1` (5.8:1) ou `#94a3b8` (7.5:1); remover `opacity:.55` do placeholder; revalidar com amostragem de pixels.

**Aceite:** todo texto normal ≥4.5:1; placeholder ≥4.5:1; sem regressão no axe.

#### P1-03 — Criado não protege a única cópia: `Escape` global, sem guarda de saída, “Copiar” pode mentir

**Evidência:** B-03/B-10; C P1-05; D AS-10/AS-11; teste dirigido de clipboard; `app.ts:338-342,175-177`; `ui.ts:809-817`.

**Impacto:** a chave/senha só existe naquela tela. Um `Escape`, reload, back ou clique no logo/footer pode descartar a única cópia. Se o clipboard falhar, o botão ainda diz “Copiado”.

**Correção:** limitar `Escape` à tela de revelação; `beforeunload` no Criado enquanto os valores sensíveis estiverem visíveis; confirmar “Criar novo segredo”; `await navigator.clipboard.writeText`; só mostrar “Copiado” no sucesso; em falha, selecionar o campo e instruir cópia manual; `aria-live`.

**Aceite:** Escape no Criado não navega sem confirmação; clipboard negado mostra erro; sucesso só após a promessa; `beforeunload` ativo.

#### P1-04 — Pós-fetch da revelação continua narrando “antes do clique”; “Cancelar” não cancela

**Evidência:** A P1-1; D AS-08; `reveal-password-prompt-1280.png`, `reveal-key-error-1280.png`; `ui.ts:475-514`; `app.ts:207-217`.

**Impacto:** em leitura única, o segredo já saiu do servidor, mas o título, subtítulo e aviso ainda falam no futuro. O botão “Cancelar” navega para `/` e não desfaz o consumo.

**Correção:** re-renderizar o card após o fetch: “Mensagem localizada. Falta descriptografar.”; “O segredo já saiu do servidor. Não feche esta tela.”; remover o aviso de pré-ação; trocar o requisito pelo real; renomear “Cancelar” para “Sair e perder o acesso” com confirmação, ou remover.

**Aceite:** nenhum texto no futuro após o fetch; requisito real visível; Cancelar não sugere desfazer o consumo.

#### P1-05 — Criação, 429 e rede caem em “Segredo indisponível”, com rascunho apagado; `/api/info` 429 perde o link

**Evidência:** teste dirigido de erros (`store429`, `storeNetwork`, `info429`); criação mostra “Não foi possível abrir este segredo” e causas de revelação; rascunho `""`; no `info429`, a URL final perde o hash e não há retry; `app.ts:12-24,104-110,161-165`; docs documentam 429 com retry.

**Impacto:** quem tentou criar recebe o diagnóstico de quem tentou abrir, perde o texto e não recebe “aguarde 60s” nem retry. Um rate limit transitório de 60s em `/api/info` parece indisponibilidade permanente e o link sai da barra de endereço. A opacidade genérica é correta para 404, não para falha operacional.

**Correção:** separar estados: 404 genérico; falha de criação (“Não foi possível criar o link. A mensagem não foi enviada.”) + retry; 429 (“Muitas tentativas. Aguarde 60 segundos.”) com retry; rede (“Sem conexão. Nada foi enviado.”). Em `/api/info`, preservar o hash até a consulta concluir, ou oferecer retry explícito com o link original. Preservar o rascunho em memória para retry explícito, se o produto aceitar.

**Aceite:** 429/rede na criação mostram a mensagem correta e retry; `/api/info` 429 mantém o link e oferece retry; 404 continua genérico; rascunho não é apagado sem aviso.

#### P1-06 — Foco/status não anunciados em transições, prompt de senha e erros

**Evidência:** B-06/B-11; C P1-04; D AS-14/AS-15; após criar/revelar/errar senha, `activeElement` é `BODY`; não há `aria-live`/`role=alert`; o prompt de chave foca, o de senha não; `ui.ts:129-137,618-658`.

**Impacto:** leitores de tela não sabem que a tela mudou, que o link foi criado, que o segredo foi revelado ou que a senha falhou. Teclado precisa tabular desde o topo. O erro de senha é o momento em que a pessoa não pode se perder.

**Correção:** focar o `h1` da nova tela (`tabindex="-1"`); atualizar `document.title`; `role="alert"`/`aria-live` para erros, cópia e loading; focar o input de senha ao abrir e após erro; `aria-invalid` + `aria-describedby`; `aria-busy` no botão; mensagem no submit vazio.

**Aceite:** foco no h1 após cada transição; prompt de senha focado; Enter envia; erro anunciado; submit vazio com mensagem.

#### P1-07 — Texto a 200% em 360 corta “Senha humana”

**Evidência:** B-05; C P1-03; captura em 360 com texto a 200%; card com `scrollWidth 444` vs 360 e `overflow:hidden`; `styles.css` sem `flex-wrap` no segmented control.

**Impacto:** WCAG 1.4.4. Usuários de baixa visão não conseguem ler a opção “Senha humana” no mobile; a escolha de proteção fica ambígua.

**Correção:** permitir quebra/empilhamento do segmented control em larguras estreitas ou trocar por radios empilhados/`<select>`; remover `overflow:hidden` do card ou garantir que o conteúdo nunca exceda a caixa; testar 200% em 360/768/1280.

**Aceite:** nenhum texto clipado a 200% em 360; sem overflow horizontal; controles legíveis e operáveis.

### P2 — próxima passagem

1. **Senha sugerida concatenada** (A P1; B/C P2; D HIGH): focar e selecionar a sugestão ao entrar no modo, ou deixar o campo vazio com “Usar esta sugestão”; mostrar “senha definida”.
2. **Revelar em branco** enquanto `/api/info` responde: usar o overlay existente com `role="status"`; timeout → indisponível.
3. **Loading do CTA** sem texto/`aria-busy`; disabled parece ativo; reduced motion deixa spinner estático: manter “Processando…” visível, `aria-busy`, `:disabled` com `cursor:not-allowed`.
4. **Radiogroups** sem nome e sem setas: `aria-labelledby` dos h2 + roving tabindex/setas, ou radios nativos.
5. **Região do segredo revelado** sem nome; “Mensagem” visível vs “Segredo” acessível: `aria-labelledby`; alinhar label visível e nome acessível.
6. **Submit vazio silencioso**: erro inline + `aria-invalid`.
7. **Link completo cortado no textarea 360**: autoajustar altura ou usar `div`/`pre` sem altura fixa.
8. **Badge “Expirado” verde** e CTA ativo: trocar para estado neutro/erro, parar timer, desabilitar revelação.
9. **Reduced motion**: `scroll-behavior:auto` e `behavior:"auto"`; manter texto de loading.
10. **Contador UTF-16 vs UTF-8**: contar bytes ou rotular “caracteres” e validar no mesmo unit.
11. **Claim de privacidade**: “O que o servidor não vê” → “O que o servidor não armazena”; separar “não vê” (plaintext/chave/senha) de “não persiste” (IP/User-Agent); qualificar “Sem rastreamento”.
12. **Vidro/sombra/brilho**: reduzir blur a 1–2 superfícies, sombra seletiva, glow em foco/CTA; preservar grid/ciano.
13. **Segmentos 40px/toggle 22px**: alvo 44px + corrigir docs; não declarar violação 2.5.8 (exceção de espaçamento).
14. **`DESIGN.md`**: documentar a direção vigente e as razões; corrigir `COMPORTAMENTO.md` (44px, 4.5:1, aria-label, Escape).
15. **Logo/tagline**: mark sem tagline embutida, tagline como texto, `width`/`height`, WebP/AVIF + `srcset`; não atribuir o CLS ao logo sem medição. *(Resolvido: novo logo completo e mark separados.)*

### P3 — polimento

- Em dash no título/aria-label/copy (antislop HIGH; decisão do mantenedor).
- “Nota” vs “segredo” (padronizar em “segredo”).
- Kicker “Privacidade” duplicando o H1.
- `aria-label` em div genérica no indisponível.
- Meta Apple deprecated; overlay morto; `aria-busy`; strings fora do i18n; timer sem limpeza.
- Separador órfão no rodapé 360; ícone de check em causa de falha; botão copiar sobre texto no desktop.
- Drift de tokens de ciano/`theme-color`; 4 blurs grandes; fundo fixo; CSS bloqueante; minify off.
- Grid de fundo: manter como identidade documentada; não remover por moda.

### O que não é achado (para não “corrigir” o que funciona)

- Dark mode fixo: razão legítima para ferramenta de segurança; não adicionar toggle.
- Acento ciano: identidade documentada; manter.
- Grid de fundo: identidade técnica; documentar a razão; não remover por moda.
- Ícones próprios: relevantes; não trocar por biblioteca.
- Cards de link: são campos de dados, não feature cards.
- Links inline do rodapé: exceção de texto inline da 2.5.8; o problema é contraste, não tamanho.
- Painel “Como funciona”: onboarding real; colapsar nas telas de ação é opcional.
- Mensagem genérica de 404: decisão de privacidade; preservar.
- SEO 0.66: `noindex` intencional; não “corrigir”.
- Lighthouse de contraste: falso negativo; não usar como prova de conformidade.

---

## 6. Onde as skills concordam, divergem e como resolver

**Como ler as severidades.** O antislop classifica por **tier**: Hard Gate = HIGH, Purpose-Gate = MEDIUM, Quality Lock = LOW. O Impeccable classifica por **impacto**: P0 bloqueia, P1 é dificuldade significativa ou violação WCAG AA, P2 tem workaround, P3 é polimento. O cruzamento usa o impacto como critério final: um Hard Gate de copy (em dash) pode ser P3; um P1 do Impeccable sem regra antislop (texto a 200% em 360) continua P1. Isso evita transformar 20 Hard Gates em 20 P1s.

### 6.1 Concordâncias fortes (tratar como prioridade)

1. **O controle de leitura única não está acessível.** Impeccable (A/B) e antislop (R-39/R-32/R-03) apontam o switch de 40x22 sem nome acessível, com label inerte. Não é preferência de estilo; é uma barreira de identificação e operação no controle mais consequente da criação.
2. **O contraste não cumpre o contrato documentado.** Impeccable (A/B) e antislop (R-25) chegam aos mesmos tokens `--text-faint` e placeholder. O axe `incomplete` não é absolvição; a verificação manual encontrou 2.54–2.66:1 e 3.03:1.
3. **A tela de revelar não reconhece o pós-fetch.** Impeccable A e antislop (R-27/R-35) apontam a contradição: o segredo já saiu do servidor, mas o copy continua falando “ao clicar” e o “Cancelar” não cancela.
4. **Falha operacional não é o mesmo que segredo indisponível.** Impeccable A e antislop (R-27) apontam que 429/rede/criação caem na tela de 404, com diagnóstico errado e rascunho apagado.
5. **O handoff do Criado pode perder a única cópia da chave/senha.** Impeccable A/B e antislop (R-26/R-35) apontam o “Copiado” incondicional, a ausência de guarda de saída e o `Escape` global.
6. **A senha sugerida concatenada é uma armadilha de confiança.** Impeccable A/B e antislop (R-26/R-35) concordam; o usuário pode compartilhar uma senha diferente da que pensa.
7. **O shell visual é de categoria, mas a identidade não é o problema.** Impeccable A chama de “moldura intercambiável”; o antislop passa grid, tipografia e paleta, mas reprova a dose de vidro/sombra/brilho. Não é motivo para redesign: é documentar a direção e reduzir o dose cap.

### 6.2 Divergências e resolução

| Divergência | Impeccable | antislop | Resolução |
|---|---|---|---|
| Grade de fundo | Advisory; identidade pode aceitar | R-07: grade como default sem propósito é slop | Manter a grade como identidade técnica, mas **escrever o propósito** em `DESIGN.md` e reduzir o contraste da grade se ela competir com o conteúdo. Não remover por moda. |
| Glassmorphism | Parte da moldura de categoria; não é falha funcional | R-10: dose cap de 1-2 elementos; proibido em navbar + cards + sidebar | Reduzir o blur a 1-2 superfícies (por exemplo, header e card principal) ou tornar cards/painel opacos. Preservar a identidade sem o “vidro em tudo”. |
| Acento ciano / botão neon | Aceito como identidade | R-01/R-13: neon blue button/glow como default sem propósito | Manter o ciano, que já tem propósito documentado (foco, ação, informação técnica). Reduzir glow a foco + CTA primário. Não trocar a paleta. |
| “Sem rastreamento” | P3 de confiança | R-36: claim absoluto sem evidência | Qualificar para o que é verificável: “Sem contas, cookies ou analytics” e “sem logs de conteúdo”. A política já explica os metadados Cloudflare. |
| Dark mode fixo | Modo Operate; dark é adequado | R-21: dark default precisa de razão | Manter dark; documentar a razão (ferramenta de segurança, uso noturno, discrição). Não adicionar toggle sem pedido. |
| Em dashes no copy | Não é problema | R-02: proibido em texto escrito pelo agente | P3 de higiene. O copy existente é voz do produto; trocar apenas se o mantenedor quiser. Não é bloqueio. |
| Logo com tagline embutida | P3 de marca; CLS do logo não confirmado | R-23/R-20: ativo de marca e identidade | Resolvido com asset aprovado: `lockbrief-logo.png` (completo) e `lockbrief-mark.png` (favicon/PWA); `width`/`height` explícitos. |
| Texto a 200% em 360 | B/C P1: “Senha humana” cortada | D “não é achado” (sem captura 360) | Prevalecer B/C: a evidência visual direta mostra clipping; P1. |
| Alvos 40/22 e WCAG 2.5.8 | C: não viola 2.5.8 pela exceção de espaçamento; ergonomia e docs | R-03: mínimo 44px | P2: alvo 44px + corrigir docs; não declarar violação 2.5.8 sem teste. |
| “Como funciona” | A: onipresente/obsoleto nas ações | C-3 PASS: onboarding real | P3: colapsar nas telas de ação é opcional; não é falha. |
| Feature cards | A: lista genérica | R-14 PASS: são campos de dados | Não tratar como feature cards; manter a repetição que ajuda a comparar. |
| “Nota” vs “segredo” | Não citado | R-31 LOW | P3 de consistência de copy; padronizar em “segredo”. |
| CLS 0.079 | C: culpado é o footer, não o logo | R-40: logo sem dimensões | P3: dimensões são baratas; medir antes de atribuir a causa. |

### 6.3 O que não fazer

- Não fazer redesign do shell. `PRODUCT.md` fixa preservar identidade, componentes e PT-BR.
- Não adicionar light mode/toggle sem pedido; o dark tem razão de produto.
- Não trocar a paleta ciano/slate; ela tem propósito documentado.
- Não introduzir analytics, contas, cookies ou novas telas.
- Não alterar formato de link/envelope, TTL, criptografia ou fluxo de consumo.
- Não “corrigir” a mensagem genérica de 404; ela é uma decisão de privacidade. O problema é reutilizá-la para 429/rede/criação.

---

## 7. Direção visual e o papel do `DESIGN.md`

O Impeccable context encontrou `PRODUCT.md` e **nenhum `DESIGN.md`**. O antislop considera **R-37 PASS** porque `PRODUCT.md` fixa a identidade vigente, mas deixa **R-31 OPEN** porque as razões de grid, vidro, glow e tipografia não estão escritas. Isso não significa que a UI não tenha identidade: o código e `docs/COMPORTAMENTO.md` já definem dark, acento ciano, cards de 12px, botões/inputs de 8px, textura discreta e uso restrito do ciano. O que falta é um documento que torne essa direção **explícita, estável e auditável**.

Recomendação: criar `DESIGN.md` documentando o mundo vigente, sem redesign:

- Identidade: ferramenta de segurança, efêmera, PT-BR, discreta, técnica.
- Paleta: slate escuro + ciano como acento funcional; status verde/âmbar/vermelho.
- Tipografia: sans para leitura, mono para chaves/links/contadores.
- Superfícies: cards de 12px, inputs/botões de 8px; vidro em dose limitada.
- Textura: grade sutil com propósito (blueprint/terminal), não decoração default.
- Movimento: funcional, curto, respeitando `prefers-reduced-motion`.
- Regras: foco visível, contraste 4.5:1, alvos 44px, estados vazios/carregando/erro.

Isso satisfaz Impeccable (contexto) e antislop (R-31/R-37) sem tocar no visual.

---

## 8. Plano de melhorias

### Fase 0 — Congelar e documentar (0,5–1 dia)

1. Criar `DESIGN.md` com a direção vigente e as razões (seção 7).
2. Registrar no `docs/COMPORTAMENTO.md` o contrato real de acessibilidade **depois** das correções; não declarar 44px/4.5:1/aria-label antes de serem verdade.
3. Congelar o baseline: commit, screenshots, axe, Lighthouse.

### Fase 1 — P1/P2 de acessibilidade e perda de dados (1–2 dias)

1. **Switch de leitura única:** `aria-labelledby` para o label, `id` no label, linha inteira clicável, alvo ≥44x44; testar com teclado e leitor de tela.
2. **Contraste:** subir `--text-faint` para `#7c8ba1` (5.8:1) ou `#94a3b8` (7.5:1); remover `opacity:.55` do placeholder; revalidar com axe/amostragem.
3. **Escape:** limitar o handler à tela `reveal`; adicionar guarda de saída no Criado; não apagar rascunho sem confirmação.
4. **Texto a 200% em 360:** permitir `flex-wrap`/empilhamento no segmented control ou trocar por radios empilhados; testar 200%.
5. **Radiogroups:** nome via `aria-labelledby` dos h2; roving tabindex + setas; ou radios nativos.
6. **Foco/Enter:** focar o input de senha ao abrir e após erro; `<form>` ou handler de Enter; `role=alert`/`aria-live`; mover foco para o h1 nas transições.

### Fase 2 — P1 de honestidade de estado e recuperação (1–2 dias)

7. **Pós-fetch:** re-renderizar a tela de revelar com estado “mensagem localizada, falta descriptografar”; remover o aviso de pré-ação; trocar “Cancelar” por “Sair e perder o acesso” com confirmação.
8. **Erros:** separar 404 (genérico), criação (não enviado, rascunho preservado ou limpo com aviso), 429 (aguarde 60s, retry) e rede (sem conexão, nada enviado). Não reutilizar a lista de causas de revelação na criação.
9. **429 em `/api/info`:** não remover o hash antes de saber que o fetch pode prosseguir, ou oferecer retry explícito com o link preservado; orientar “aguarde 60s”.
10. **Copiar:** `await navigator.clipboard.writeText`; só mostrar “Copiado” no sucesso; em falha, selecionar o campo e dizer “Não foi possível copiar”; `aria-live` para o estado.
11. **Senha manual:** não concatenar; ao entrar no modo, focar e selecionar a sugestão, ou deixar o campo vazio com “Usar sugestão”; mostrar “senha definida”.
12. **Guarda de saída do Criado:** `beforeunload` enquanto link/senha automática/senha manual estiverem visíveis; confirmar “Criar novo segredo” e Escape.

### Fase 3 — P2/P3 de polimento (1 dia)

13. **“Como funciona” (opcional):** manter na criação; colapsar nas telas de ação se o teste de uso indicar competição com a tarefa.
14. **Logo:** mark sem tagline embutida, tagline como texto, `width`/`height`/`aspect-ratio`, WebP/AVIF + `srcset`.
15. **Reduced motion:** `scroll-behavior: auto` e `behavior: "auto"` quando `prefers-reduced-motion: reduce`.
16. **Contador:** contar bytes UTF-8 (ou rotular “caracteres” e validar no mesmo unit).
17. **Docs:** corrigir `COMPORTAMENTO.md` (44px, 4.5:1, aria-label, Escape) e atualizar `FUNCIONAL.md` se os estados de erro/retry mudarem.
18. **Meta/overlay:** adicionar `mobile-web-app-capable`; remover o overlay morto ou usá-lo com `role=status`; `aria-busy` nos botões.
19. **Polimento:** separador órfão do rodapé, ícone de check em causa de falha, botão copiar sobre texto no desktop, `aria-label` em div genérica.
20. **Revelar em branco:** usar o overlay existente com `role="status"`; timeout para o estado indisponível.
21. **Loading do CTA:** manter “Processando…” visível, `aria-busy`, `:disabled` com `cursor:not-allowed`.
22. **Região do segredo:** `aria-labelledby`; alinhar “Mensagem” visível e “Segredo” acessível.
23. **Link completo no 360:** autoajustar altura do textarea; evitar corte da última linha.
24. **Badge expirado:** estado neutro/erro, parar timer, desabilitar revelação.
25. **Privacidade:** “O que o servidor não vê” vs “não armazena”; qualificar “Sem rastreamento”.
26. **Vidro/sombra/glow:** reduzir a dose; manter grid/ciano.
27. **Copy:** em dash, “nota” vs “segredo”, kicker “Privacidade”.
28. **Razões no `DESIGN.md`:** registrar grid, vidro, glow, tipografia e dark mode; fechar o R-31.

### Fora de escopo

- Redesign visual, troca de paleta, light mode, novas telas, contas, analytics, mudança de criptografia/envelope/TTL, deploy.

---

## 9. Critérios de aceite e verificação

- axe: 0 violações `critical`/`serious` em home, criado, revelar, revelado, indisponível e privacidade.
- Contraste: todo texto normal ≥4.5:1; placeholder ≥4.5:1; medir com amostragem de pixels ou fundo sólido.
- Teclado: Tab na ordem visual; setas nos radiogroups; Enter no prompt de senha; Escape apenas na revelação; foco visível em todos.
- Leitor de tela: switch com nome; erros anunciados; transições com foco no h1; “Copiado” anunciado.
- Texto a 200% em 360/768/1280: sem clipping, sem overflow horizontal, sem perda de função.
- Estados: criação 429/rede com retry e rascunho preservado; `/api/info` 429 com retry; 404 genérico preservado.
- Clipboard: sucesso só após a promessa; falha com instrução manual.
- `prefers-reduced-motion`: sem animações/transições e sem scroll suave.
- Docs: `COMPORTAMENTO.md`, `FUNCIONAL.md`, `SEGURANCA.md`/`PRIVACIDADE.md` (se aplicável) atualizados no mesmo commit das correções.
- Regressão: `npm run typecheck`, `npm test`, `npm run build`, `npm run test:tooling`; inspeção manual dos fluxos.

---

## 10. O que está funcionando bem (preservar)

- Handoff de três artefatos no Criado: link completo, link sem senha e senha automática, com descrição de canal e cópia.
- Confirmação honesta de leitura única: aviso de irreversibilidade antes do clique, requisito de senha automática/manual, “Cancelar” com peso menor.
- Tela Indisponível e política de privacidade: explicam o risco sem vazar estado.
- Foco visível consistente, ordem de Tab, contraste forte do texto principal.
- Performance: 0.99, TBT 0 ms, LCP 1.4 s, sem terceiros.
- Sem overflow horizontal nos estados normais em 360/768/1280.
- Copy PT-BR específica, sem buzzwords; CTAs “Criar link seguro” e “Revelar mensagem”.
- Paleta limitada e dark mode com razão de produto.
- `textContent` para o segredo; nenhum vazamento em atributo.

---

## 11. Ambiente e validação

- A validação local usou build e servidor local; o servidor foi encerrado ao final.
- A auditoria não fez commit, branch, PR, deploy ou alteração de configuração. As correções foram aplicadas localmente e não foram publicadas.


---

## 12. Correções aplicadas na 1.2.2 e verificação

As correções foram aplicadas em uma entrega local, sem commit, push ou deploy. O estado abaixo é o que foi validado após as mudanças.

### 12.1 P1

- Switch de leitura única com nome acessível, label clicável e alvo de 44x44.
- Contraste de `--text-faint` e placeholder elevado para 4.5:1.
- Tela Criado com aviso de cópia única, `beforeunload`, confirmação de saída e feedback real de clipboard.
- Pós-fetch da revelação com título, aviso, requisito e cancelamento coerentes.
- Criação/429/rede em tela de erro separada; rascunho preservado; retry disponível.
- `/api/info` 429 mantém o hash; `/api/fetch` 429 usa retry seguro; falha ambígua de fetch não repete automaticamente.
- Foco movido para o `h1` nas transições; prompt de senha focado, em `<form>`, com Enter e erros anunciados.
- Texto a 200% em 360 sem clipping; segmentados quebram linha.

### 12.2 P2/P3

- Senha manual sem preenchimento automático silencioso; "Gerar senha" seleciona a sugestão.
- Tela Criado: badge “Recomendado” no Link completo, campo de link em largura total no desktop e Copiar no cabeçalho; no mobile, Copiar abaixo do campo com fundo discreto em cinza e hover distinto.
- Revelar com overlay "Processando..." durante `/api/info`.
- Loading de CTA com `aria-busy` e anúncio em região viva; `:disabled` visível.
- Radiogroups com nome, roving tabindex e setas.
- Região do segredo nomeada; "Mensagem" visível alinhado ao nome acessível.
- Submit vazio com erro inline e `aria-invalid`.
- Link completo com autoajuste de altura no 360.
- Badge multi-leitura com estado "Expirado" neutro e CTA desabilitado.
- Reduced motion com `scroll-behavior: auto`.
- Contador em bytes UTF-8.
- Copy de privacidade: "não vê ou não armazena"; "Sem contas ou cookies".
- Vidro restrito ao header; sombra/glow reduzidos; fundo fixo removido; build minificado.
- Em dash, "nota" e kicker "Privacidade" removidos do texto visível.
- Logo completo (`lockbrief-logo.png`) e mark (`lockbrief-mark.png`) separados; favicon, Apple Touch e ícones PWA usam o mark. O antigo `lockbrief.png` vira alias de compatibilidade no build.
- `DESIGN.md` criado; `COMPORTAMENTO.md`, `FUNCIONAL.md`, `SEGURANCA.md`, `PRIVACIDADE.md`, `README.md` e `AI-START.md` atualizados.

### 12.3 Verificação executada

> Contagem registrada na execução desta auditoria. O hardening pós-auditoria da 1.2.2 ampliou a suíte para 69 testes em seis arquivos; ver `RELEASE_NOTES.md`.

- `npm run typecheck`: passou.
- `npm test`: 57 testes passaram.
- `npm run build`: passou, com JS/CSS minificados.
- `npm run test:tooling`: 5 testes passaram.
- axe: 0 violações em home, criado, revelar, revelado, indisponível, privacidade e erro.
- Lighthouse mobile final: performance 1.00, acessibilidade 1.00, boas práticas 1.00, SEO 0.66 (noindex intencional); FCP 1.0 s, LCP 1.8 s, TBT 0 ms, CLS 0.
- Testes dirigidos: switch 44x44 e nome; label clicável; radiogroups por setas; 200% em 360 sem clipping; senha manual vazia com erro e "Gerar senha" selecionando a sugestão; loading de criação e de `/api/info`; clipboard negado/sucesso; 429/rede de criação com rascunho preservado; 429 de info com hash preservado; pós-fetch de senha automática/manual; retry de senha automática; contador de bytes; badge expirado; reduced motion; 1 superfície de vidro; separadores do rodapé ocultos no mobile.

### 12.4 Pendências explícitas

- O logo foi substituído por `lockbrief-logo.png` (cadeado + wordmark); favicon, Apple Touch e ícones PWA usam `lockbrief-mark.png` (somente o cadeado). O antigo `lockbrief.png` fica como alias no build.
- O painel "Como funciona" foi mantido na criação e nas telas de ação. Colapsá-lo nas ações é uma decisão de produto opcional.
- Não houve teste com leitor de tela real, dispositivo físico, Safari ou Firefox. A verificação de ARIA/foco é por DOM, axe e teclado.
- O antislop Delivery Gate não foi reexecutado em uma nova sessão formal; a verificação técnica pós-correção está acima. Os Hard Gates corrigíveis foram fechados.
