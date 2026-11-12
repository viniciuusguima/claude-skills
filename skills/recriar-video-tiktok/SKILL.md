---
name: recriar-video-tiktok
description: Recria em português (PT-BR), do zero, vídeos curtos de motion graphics/explicativos do TikTok, Reels ou Shorts a partir de um link — extrai a legenda e os quadros de referência, escreve um roteiro próprio no mesmo formato e tema, gera narração com a voz Luana da Cartesia, trilha ambiente, anima as cenas em canvas no estilo minimalista preto e branco (bonecos sob holofote, painéis HUD) e renderiza um MP4 pronto para postar, junto com título e hashtags em português para o post. Use sempre que o usuário mandar um link de vídeo curto (vt.tiktok.com, tiktok.com, instagram reels, youtube shorts) pedindo para "fazer esse vídeo", "recriar", "copiar", "fazer igual em português", "traduzir o vídeo", ou quiser produzir vídeos de mentalidade/motivação/finanças nesse estilo animado, mesmo que não diga "skill" nem "motion graphics".
---

# Recriar vídeo curto em PT-BR

O resultado é um MP4 (1920×1080 ou 1080×1920, 30 fps) gerado 100% por código, com narração neural
pt-BR, trilha sintetizada e animação em canvas sincronizada com a fala, mais o título e as hashtags
em português prontos para o post (`saida/post.txt`). Nada de imagens ou músicas de
terceiros entra no vídeo — só a ideia do original serve de referência.

`<skill>` abaixo é a pasta desta skill (onde está este arquivo).

## Antes de começar: combine 4 coisas com o usuário

Pergunte só o que não estiver claro no pedido; para o resto, use o padrão e diga qual usou.

| Decisão | Padrão |
|---|---|
| Formato | o mesmo do vídeo original (TikTok costuma ser vertical; o exemplo da skill é horizontal) |
| Voz | **Luana**, da Cartesia (`gerar_audio_cartesia.py`, velocidade 1.1), que é a voz do canal. O edge-tts (`gerar_audio.py`) fica de reserva, se a Cartesia falhar |
| Roteiro | **próprio**, no mesmo tema, estrutura e duração do original |
| Pasta | `E:/Projetos/<slug-curto-do-tema>` (ou o diretório de projetos que o usuário usa) |

Sobre o roteiro: o visual, a voz e a música já saem originais. O texto é o que mais pesa em direitos
autorais, e reaproveitá-lo também prende o canal do usuário ao conteúdo de outra pessoa. Por isso o
padrão é escrever um roteiro novo com a mesma mensagem central. Se o usuário pedir explicitamente uma
adaptação fiel/tradução, faça, e lembre em uma linha de dar crédito ao criador original.

## Com agentes (o jeito padrão)

Você, a sessão principal, é quem coordena: roda os scripts, cuida do Trello e do Drive e fala com o usuário. Cada papel é um subagente com o próprio arquivo em `agents/`. Para chamar um agente, use a ferramenta Agent com `subagent_type: "general-purpose"` e um prompt curto: "Você é o <papel> do canal de mentalidade. Leia `<skill>/agents/<papel>.md` e siga. Skill: `<skill>`. Pasta: `<pasta>`." Acrescente o link para o extrator e "adaptação fiel" para o roteirista, se o usuário pediu. `<skill>` é o caminho absoluto desta pasta.

| Ordem | Quem | Faz |
|---|---|---|
| 1 | você | Passo 1 (`novo_projeto.py`). |
| 2 | `extrator` | Passo 2 → `referencia/`. |
| 3 | `roteirista` | Passos 3 e 8 → `roteiro.json` e `saida/post.txt`. Você abre o card em ✍️ Roteiro. |
| 4 | você | Passo 4 (voz Luana e trilha). Card em 🎬 Produção. |
| 5 | `animador` | Passos 5 e 6 → `cenas.js`. |
| 6 | `revisor` | Revisão independente. Card em 🔍 Revisão. Repasse as correções ao dono do arquivo (SendMessage ao animador para `cenas.js`; se o texto mudar, você regenera a voz no passo 4). No máximo duas rodadas. |
| 7 | você | Passos 7 e 9 (render, conferência, Drive, card, entrega). |

O usuário tem limite de uso apertado: um agente por vez, sem refazer o trabalho de um agente para conferir. Num ajuste pequeno, faça você mesmo, sem agentes.

## Fluxo

Cada vídeo também é um **card** no quadro do Trello do usuário, que anda pelas listas junto com o
trabalho e termina com o link do Drive e o texto do post. Leia `references/publicar.md` antes do
passo 3: lá estão os endereços do quadro e da pasta do Drive, o que fazer com o card em cada etapa e
como subir o vídeo.

### 1. Criar a pasta do projeto
```bash
python <skill>/scripts/novo_projeto.py E:/Projetos/<slug> --formato vertical --voz pt-BR-AntonioNeural
```
Copia `index.html` e `motor.js`, cria `roteiro.json` e `cenas.js` vazios e confere dependências
(ffmpeg, node, edge-tts, numpy, puppeteer-core). Se algo faltar, ele lista o comando para instalar.

### 2. Extrair a referência
Leia `references/extracao.md`. Resumo: abra o link no navegador embutido, pegue a legenda
automática pelo JSON da página (não precisa de login) e monte folhas de quadros para ver o estilo e a
sequência de cenas. Salve a transcrição em `referencia/legenda.txt` e anote em
`referencia/notas.md` o que acontece em cada trecho (tempo → visual), porque é isso que guia as cenas.
Anote também a descrição e as hashtags do post original: elas são a base do título e das # em PT do passo 8.

### 3. Escrever o roteiro
Leia `references/roteiro.md`. Preencha `roteiro.json` com uma cena por frase ou ideia (10–18 cenas para
~60 s). Cada cena tem um `id` curto e o `texto` falado; `"continua": true` faz a cena entrar sem corte,
como continuação da anterior.

Com o roteiro escrito, abra o **card** do vídeo em ✍️ Roteiro.

### 4. Gerar voz e trilha
Mova o **card** para 🎬 Produção.
```bash
cd E:/Projetos/<slug>
python <skill>/scripts/gerar_audio_cartesia.py   # voz Luana por cena -> timeline.js, legendas.srt, build/narracao.wav
python <skill>/scripts/gerar_trilha.py     # pad ambiente + ducking + blips -> build/trilha_final.wav
```
O script imprime a duração de cada cena; use esses números ao animar. Ele só regenera a voz das cenas
cujo texto mudou (a chave vem de `CARTESIA_API_KEY`; nunca a imprima). Para mudar voz ou velocidade, ponha
`"cartesia": {"voz": "<id>", "velocidade": 1.1}` no `roteiro.json`; sem esse bloco, usa a Luana.

### 5. Animar as cenas
Leia `references/motor.md` (API e regras de estilo) e abra `<skill>/template/cenas_exemplo.js` para
ver um vídeo inteiro pronto: 16 cenas usando os mesmos recursos que você vai usar. Escreva `cenas.js`
com uma função por `id`. Cada cena deve **mostrar** a frase falada com uma metáfora visual simples
(placar, labirinto, medidor, máquina, cartas, escada...), e os momentos-chave devem bater com a fala
usando `k` (ex.: `k * 0.6` = 60% da fala).

Para vídeos verticais, desenhe pensando em 1080×1920 (`M.W`, `M.H`, `M.CX`, `M.FLOOR` já se ajustam).
Empilhe os elementos na vertical em vez de espalhar para os lados.

### 6. Conferir antes de renderizar
Mova o **card** para 🔍 Revisão.
```bash
node <skill>/scripts/render.mjs --folha build/folha.png --fracs 0.35,0.85
```
Gera uma imagem com cada cena em dois momentos. Abra com a ferramenta Read e procure: texto cortado
ou sobreposto, elementos fora da tela, cena vazia ou apertada demais, placeholder "cena não existe".
Corrija e gere a folha de novo até ficar limpo. Erros de JavaScript aparecem no terminal e o script
para. Para olhar um momento específico, use `--de/--ate` com `--saida build/trecho.mp4` e extraia
quadros com ffmpeg.

Se o usuário quiser assistir antes, abra a prévia com áudio: `preview_start` com o nome `preview`
(o `.claude/launch.json` já vem pronto) ou `python -m http.server 8765` na pasta.

### 7. Renderizar e conferir
```bash
node <skill>/scripts/render.mjs            # -> saida/<slug>.mp4 (≈ 1 min por minuto de vídeo)
```
Depois confira o resultado de verdade, não só a folha:
```bash
ffmpeg -v error -i saida/<slug>.mp4 -vf "fps=1/4,scale=480:-1,tile=4x4" -frames:v 1 build/conferencia.png
ffmpeg -i saida/<slug>.mp4 -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness"
```
O volume deve ficar perto de -15 LUFS.

### 8. Título e hashtags em PT
Escreva `saida/post.txt` com **título** e **hashtags em português**, seguindo a seção "Título e
hashtags" de `references/roteiro.md`. Use como base a descrição e as # do post original, anotadas
na extração. O usuário vai postar o vídeo, então essa parte faz parte da entrega, não é um extra.

### 9. Entregar
Copie o MP4 para a pasta do canal no Drive do PC, pegue o link e mova o **card** para 📱 Pronto para
postar, com o link e o texto de `saida/post.txt` (`references/publicar.md`).

Mande o MP4 com `SendUserFile` e, na mensagem, nesta ordem:
1. **Título** e **hashtags** em blocos de código separados, para copiar com um clique (e a versão
   "pronto para colar", título + # numa linha só).
2. Em poucas linhas: duração/formato, voz usada, se o roteiro é próprio ou adaptado (com o lembrete
   de crédito no segundo caso), que você não ouviu o áudio (vale o usuário assistir uma vez) e como
   mudar uma frase (editar `roteiro.json` → rodar os passos 4 e 7).
3. O link do **card**.

## Quando algo foge do padrão

- **TikTok pede login / não carrega a legenda**: a legenda costuma estar no JSON mesmo com o modal
  de login aberto. Se não houver `subtitleInfos`, peça a transcrição ao usuário ou trabalhe só a partir
  dos quadros e da descrição; não tente logar nem resolver captcha.
- **Instagram/YouTube**: o mesmo fluxo vale; a extração muda (veja `references/extracao.md`).
- **Vídeo original com pessoa falando para a câmera** (não é motion graphics): avise que a skill
  produz no estilo animado e siga; o roteiro funciona igual.
- **Usuário quer outro estilo visual** (cores, fonte): o motor é só canvas; mude as cores em
  `motor.js` do projeto (não no template da skill) e diga que o template continua no preto e branco.
- **Cartesia falha** (sem chave, sem crédito, erro da API): mostre o erro ao usuário (nunca a chave) e,
  se ele concordar, gere com `gerar_audio.py` (edge-tts, `pt-BR-FranciscaNeural`) avisando que não é a Luana.
