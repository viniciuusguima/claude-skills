# Motor de animação: API e regras de estilo

`motor.js` desenha o fundo (degradê, grade de pontos, bokeh, vinheta), faz a transição entre cenas
(fade de 0,28 s na entrada e 0,25 s na saída, zoom lento de 3,5%) e chama a sua função de cena a cada
quadro. Você só escreve `cenas.js`. Exemplo completo: `<skill>/template/cenas_exemplo.js`.

## Contrato de uma cena

```js
nomeDaCena(lt, d, k) { ... }
```
- `lt`: segundos desde o início da cena (0 → d).
- `d`: duração visual da cena (vai até o começo da próxima fala; inclui o respiro).
- `k`: momento em que a fala desta cena termina. Sincronize marcos com frações de `k`:
  `seg(lt, k * 0.55, k * 0.95)` = animação que acontece quando a fala chega à segunda metade.
  Para achar a fração de uma palavra, conte caracteres: a palavra na posição 40 de uma frase de 80
  caracteres cai perto de `k * 0.5`.

`M.W`, `M.H`, `M.CX`, `M.CY`, `M.FLOOR` dão as dimensões (1920×1080 ou 1080×1920) e a altura do chão.

## Regras (o porquê importa)

- **Determinismo**: nada de `Math.random()` nem `Date.now()` dentro das cenas. O render salta para
  qualquer `t`; aleatoriedade faria cada quadro diferente e o vídeo tremer. Use `rng(semente)` uma
  vez, no topo da fábrica (veja o labirinto `MZ` no exemplo).
- **Alpha multiplica, nunca atribui**: o motor aplica o fade da cena em `ctx.globalAlpha`. Dentro da
  cena use `ctx.globalAlpha *= a` (com `save/restore`); `= a` apagaria o fade e a cena "piscaria".
  As funções de desenho já recebem `alpha` e respeitam isso.
- **Sempre `ctx.save()`/`ctx.restore()`** em volta de `translate/scale/rotate/setLineDash`.
- **Uma ideia por cena, um elemento principal**: o olho do espectador precisa de um foco. Elementos
  secundários em `alpha` 0,4–0,7.
- **Algo muda a cada ~1 s**: entrada com `pop`/`eOut`, contadores subindo, ponteiro girando, flip.
  Cena parada por mais de 2 s parece travada.
- **Legibilidade no celular**: no horizontal, `label` ≥ 13 px e texto principal ≥ 34 px; no
  vertical, `label` ≥ 20 px e texto principal ≥ 48 px. Nada importante a menos de 80 px da borda
  (no vertical, deixe livres os 250 px de baixo e os 150 px de cima, onde ficam a interface e a
  legenda do TikTok).
- **Paleta**: só branco com alpha sobre preto. O brilho (`glow`) marca o que importa; se tudo
  brilha, nada se destaca.

## Funções disponíveis (desestruture de `M`)

### Tempo e easing
| Função | Uso |
|---|---|
| `seg(t, a, b)` | 0→1 enquanto t vai de a até b (com clamp). A base de tudo. |
| `eOut(p)`, `eIn(p)`, `eInOut(p)` | curvas cúbicas |
| `eBack(p)` | passa do ponto e volta (entrada com "pulo") |
| `pop(t, inicio, dur = 0.35)` | atalho: `eBack(seg(t, inicio, inicio + dur))`, ótimo como escala de entrada |
| `lerp(a, b, p)`, `clamp(v, min = 0, max = 1)` | |
| `rng(semente)` | gerador pseudoaleatório determinístico: `const r = rng(42); r()` |
| `brl(n)` | `"R$ 718.055"` |
| `M.t()` | tempo global (para movimentos contínuos entre cenas encadeadas) |

### Desenho
| Função | O que desenha |
|---|---|
| `text(str, x, y, size, {weight, align, base, spacing, alpha, color, glow, mono})` | texto (Segoe UI); `glow` = blur do brilho |
| `label(str, x, y, {size = 15, alpha = 0.55, align})` | rótulo HUD em caixa alta e espaçado |
| `panel(x, y, w, h, {alpha, r = 14, glow, lw, ticks = true})` | painel com borda e cantoneiras |
| `pill(str, x, y, {size = 16, filled = true, alpha})` | etiqueta arredondada (preenchida = destaque) |
| `spotlight(x, a, {floor = FLOOR, wt, wb})` | holofote vindo do topo até o chão |
| `pawn(x, yPes, escala, {alpha, gray, cap, glow, bob})` | o boneco. `gray` = coadjuvante, `cap` = capelo de formatura, `bob` = pulinho (px) |
| `chao(a, x0, x1, y = FLOOR)` | linha de chão com degradê |
| `xMark(x, y, s, a, lw)` / `check(x, y, s, a)` | X de erro / ✓ |
| `icon(nome, x, y, s, a)` | `caixa`, `camiseta`, `lampada`, `lampadaCheia`, `interrogacao` |
| `gear(x, y, r, dentes, rotacao, a)` | engrenagem de contorno |
| `digit(d, x, y, w, h, a)` / `number2(n, x, y, w, h, a, fantasma)` | display de 7 segmentos (2 dígitos) |
| `rrect(x, y, w, h, r)` | só o caminho; depois `ctx.fill()`/`ctx.stroke()` |
| `glow(blur, a)` / `noGlow()` | liga/desliga brilho para desenho manual com `ctx` |
| `wa(a)` | `"rgba(255,255,255,a)"` |

Para formas que não existem (gráfico, moeda, seta curva, celular...), desenhe direto com `ctx`
mantendo o padrão: contorno branco 2–4 px, preenchimento `wa(0.03–0.06)`, brilho só no foco.
Se uma forma se repetir em várias cenas, crie a função no topo de `cenas.js` (como `etiqueta` no exemplo).

## Metáforas visuais prontas no exemplo

Use como ponto de partida (estão em `cenas_exemplo.js`, procure pelo id):

| id no exemplo | Metáfora | Serve para |
|---|---|---|
| `abertura` | dois bonecos, escada surgindo, contador de dinheiro | contraste + resultado |
| `fila` | fila numa seta de progresso, um fica para trás | crença comum / comparação social |
| `nota` | círculo com nota caindo, prova com X | punição por erro |
| `inversao` | painel que vira (flip) mostrando a regra nova | virada de regra |
| `placar` | placar 7 segmentos, um lado apaga | o que conta × o que não conta |
| `labirinto` | ponto explorando labirinto, X nos becos | tentativa e erro |
| `negocio` / `produtos` | notebook com loja, cartas de produto | exemplo de negócio |
| `aprendizado` | peças voando para um quadro | aprender com tentativas |
| `custo` | medidor que dispara quando o boneco para | custo de desistir |
| `maquina` | esteira: X entra, INFO sai | transformar erro em informação |
| `chutam` | dois lados: roleta de "?" × torre de blocos | quem chuta × quem constrói |
| `licoes` / `perfeito` | cartas virando lâmpadas, boneco numa bolha | quantidade × perfeccionismo |
| `escola` / `final` | etiqueta de preço que vira + cartão final | fechamento com frase citável |

Termine sempre com um cartão final: a frase-chave do vídeo grande, com o boneco sob o holofote.
Aproveite os ~3 s de `OUTRO` depois da última fala.
