# Referência das peças comuns

Ordem dos scripts na página: three.js r128, mp4-muxer, `util.js`, `kit.js`, `studio.js`, `sfx.js`, depois `<slug>_roteiro.js`, `<slug>_world.js`, `<slug>_audio.js`, `<slug>_main.js`. São scripts clássicos (tudo global), então não redeclare com `const` um nome que já existe aqui.

## Convenções

- **Mundo**: metros, y para cima. Olhos em primeira pessoa a ~1,62 m do chão.
- **Câmera**: `PerspectiveCamera(74, 9/16)`. Com `rotation.order = 'YXZ'`, yaw 0 olha para −z; a direção de frente é `(−sin(yaw), 0, −cos(yaw))`; yaw positivo vira à esquerda; pitch positivo olha para cima. Campo de visão: 74° na vertical, ~46° na horizontal.
- **Tela 2D**: depois de `ctx.setTransform(S, 0, 0, S, 0, 0)` tudo é desenhado em 720×1280. Título em y≈330, marcador em x≈46 / y≈520–600, legendas em y≈916.
- **Tempo**: tudo deriva de `t` em segundos. Os inícios dos trechos ficam em `ROTEIRO.T` (`_roteiro.js`); use os mesmos nomes na câmera, nas legendas e no áudio. `ROTEIRO` também traz `DUR`, `slug`, `titulo`, `tituloSai`, `legendas`, `cartao` e `post` (veja `js/modelo_roteiro.js`).
- **Three r128**: sem `CapsuleGeometry`; cores em sRGB simples, sem tone mapping. Use `logarithmicDepthBuffer: true` no renderer quando a mesma cena tiver objetos a 1 m e a milhares de metros (espaço).

## util.js

- `V3`, `clamp(x,a,b)`, `lerp(a,b,t)`, `smooth(t)`, `sstep(a,b,x)` (0→1 suave entre a e b), `col(hex)`.
- `mulberry32(seed)` → função aleatória determinística. `hash2(ix,iz)` → 0..1. `vnoise(x,z)`, `fbm(x,z)` → ruído −1..1. `wob(t, seed)` → oscilação irregular −1..1 (tremor de câmera).
- `kf(t, [[t0,v0],[t1,v1,ease?],...])` → valor interpolado; ease `'l'` linear, `'i'` acelera, `'o'` desacelera, padrão suave.
- `M(px,py,pz, rx,ry,rz, sx,sy,sz)` → matriz para `Builder.geo`.
- `MAT` → material padrão low-poly (cores por vértice, faces chapadas).
- `Builder`: junta triângulos coloridos em uma malha só (rápido de desenhar). Pontos são `{x,y,z,c}` com `c` uma `THREE.Color`.
  - `tri(a,b,c)`, `quad(a,b,c,d)`, `pyr(x,y,z,meiaBase,altura,cor)`
  - `limb(p0,p1,r0,r1,c0,c1,lados=5,tampas=false)` → tronco/cano/braço entre dois pontos
  - `geo(geometry, matriz, cor)` → incorpora qualquer geometria do three (caixa, esfera)
  - `loft(aneis, {closed, capStart, capEnd})`
  - `mesh(material?)` → `THREE.Mesh`. Ponha `mesh.frustumCulled = false` em malhas grandes.
  - Para um grupo mudar de cor ao longo do vídeo (queimar, congelar), dê a ele um Builder e um material próprios e mude `material.color`.

## kit.js

- `coneTree(B, x,y,z, raio, altura, cor, corTopo, lados=6)` → cone (pinheiro, guarda-sol, telhado).
- `blobTree(B, x,y,z, rx, ry, cor, corTopo)` → copa arredondada.
- `new Streaks(n, [caixaX,caixaY,caixaZ])` → riscos em volta da câmera (chuva, neve, vento, fagulhas, velocidade). Adicione `streaks.obj` à cena; a cada quadro `streaks.update(t, camera.position, vx, vy, vz, comprimento, opacidade)`; cor em `streaks.mat.color`.
- `glowTexture(corCentro, corMeio)` → textura de brilho para `THREE.Sprite` com `AdditiveBlending`.
- `makeArms()` → `{group, set}`. `camera.add(arms.group)` e a câmera precisa estar na cena. `arms.set(i, [x,y,z], [rx,ry,rz], visivel)`, i=0 esquerdo, 1 direito, em coordenadas da câmera (−z é para a frente, −y para baixo). Poses que funcionaram:
  - correndo: `[s*0.2, -0.44, -0.04]`, `[0.12 + 0.34*sin(fase), s*0.12, s*0.2]` com `s = i ? 1 : -1`
  - protegendo os olhos (um braço): `[-0.24, -0.22, -0.3]`, `[1.0, -0.62, -0.5]`
  - mãos juntas tremendo: `[s*0.1, -0.46, -0.2]`, `[0.25 + tremor, s*0.2, s*0.9]`

## studio.js

`const studio = makeStudio({ DUR })` (opcional `W`, `H`, `FPS`) cuida do canvas da página, dos controles, da prévia com som e da exportação.

- `studio.ctx`, `W`, `H`, `S` (escala para 720×1280), `RED`, `SERIF`, `SANS`, `vignette`, `glow`.
- `rich(texto, cx, cy, tamanho, larguraMax, alfa, entrelinha=1.3)` → texto centralizado em serifa; `*palavra*` sai em vermelho; `\n` quebra linha.
- `label(texto, x, y, tamanho, espacamento, alfa, alinhamento='left', peso=600)` → rótulo em maiúsculas espaçadas.
- `hud(titulo, valor, estado, alfa, cor='#fff')` → marcador da esquerda.
- `caps(lista, t, y=916, tamanho=36)` → legendas; lista de `[inicio, fim, texto]`.
- `fade(t, a, b, d=0.35)` → 0→1→0 com entrada e saída suaves.
- `endCard(t, t0, { title, fact, question, channel, dim, titleSize })` → cartão final a partir de `t0` (reserve ~4,5 s); já faz o fade para preto no fim.
- `mkCanvas(w, h, desenhar)` → canvas auxiliar (gradientes, clarões).
- `start(renderAt, synth, 'arquivo.mp4')` → liga tudo. `synth(DUR)` devolve `{sr, N, L, R}`.

Depois de `start`, no console da página:

- `window.__ready` → página pronta.
- `renderAt(t)` → desenha o quadro do instante t (precisa ser global no `_main.js`).
- `await snap([t1,...], 'nome', larguraCelula=432, alturaCelula=768)` → grava `debug/nome.png` com um quadro por instante, etiquetado.
- `synthNow()` → áudio final `{L, R, N, sr, peak}` para medir.
- `exportVideo('nome.mp4')` → renderiza e salva na pasta do projeto; progresso em `window.__exp` (`state`, `frame`, `total`, `msg`, `bytes`). Se o navegador não codifica AAC (Chrome no Linux), grava `nome.video.mp4` e `nome.audio.wav` e pede ao `server.py` (`POST /mux`) para juntar os dois em `nome.mp4` com o ffmpeg; nessa etapa `state` vale `'muxing'`.

## sfx.js

`const S = makeSfx(DUR)`; chame os sons que quiser e termine com `return S.finish()`. Tempos em segundos; `amp` de ~0,05 (fundo) a ~1,5 (impacto); `pan` de −1 a 1.

Impactos e efeitos:
- `hit(t, amp, raiz=55)` → pancada orquestral (o som do "evento"). `thud(t, amp, f=70, decay=10, pan)` → grave seco. `crack(t, amp, pan)` → estalo. `rumble(t, dur, amp)` → tremor. `whoosh(t, dur, amp, f0, f1)` → varredura de ar (f0→f1 Hz).
- `drum(t, amp, pan)`, `tick(t, amp)` (relógio), `bell(t, f, amp, pan)`, `gull(t, amp, pan)` (gaivota).

Corpo:
- `step(t, amp, pan, tipo)` com tipo `'sand'`, `'stone'` ou `'frost'`. `heart(t, amp)`. `breath(t, dur, amp, inspirando)`. `scream(t, dur, amp, f0, f1, fFim=0.88, pan)` → grito sintetizado; curto (0,5–0,9 s) e em volume moderado soa menos artificial.

Música:
- `mf(notaMidi)` → Hz. `strNote(t, dur, f, amp, pan, {att, rel, trem, cut, glide})` → cordas (trêmulo `trem` 6–9 Hz e intervalos de meio tom dão tensão). `bassNote(t, dur, f, amp)`.
- Perseguição: notas curtas a cada 0,2 s sobre um baixo repetido e `drum` nos tempos pares (veja o trecho "corrida" em `sol_audio.js`).

Fundos contínuos:
- `bed(nivel, f, q=0.5, amp=0.5, mod)` → ruído filtrado; `nivel` é função `t → 0..1` (use `kf`), `f` em Hz ou função de t. Mar ≈ 700 Hz com `mod` lento; vento ≈ 400–600 Hz com q 3–4; fogo ≈ 900–1200 Hz com `mod` rápido; chuva ≈ 3000 Hz.
- `drone(nivel, f=41, amp=0.22)` → zumbido grave (espaço, tensão).
- `duck(t0, t1)` → corta o som entre t0 e t1 (silêncio antes do impacto). Chame depois dos fundos e antes de adicionar o próprio impacto.
- `add(t0, dur, (t, i) => amostra, pan)` e `BQ('lp'|'hp'|'bp', f, q)` → para sons sob medida.
- `finish(drive=3.0)` → normaliza e satura; `drive` maior levanta os trechos calmos.
