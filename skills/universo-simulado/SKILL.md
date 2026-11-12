---
name: universo-simulado
description: Produz do zero um vídeo vertical completo (MP4 1080×1920, 60–75 s, PT-BR) do canal UNIVERSO SIMULADO a partir de uma única ideia — simulação 3D low-poly em primeira pessoa, legendas com uma palavra em vermelho, marcador na tela, trilha e efeitos sintetizados, cartão final "DRAMATIZAÇÃO". Use sempre que o usuário der uma ideia ou tema de vídeo ("faz um vídeo de e se a Lua caísse", "como sobreviver a um tsunami", "próximo vídeo: buraco negro", "quero um vídeo sobre...", "faz outro"), pedir um vídeo para TikTok/Shorts/Reels nesse estilo, ou pedir para ajustar ou refazer um vídeo já feito com esta skill — mesmo que ele não diga "skill" nem o nome do canal.
---

# Universo Simulado

O usuário diz só a ideia. Você entrega o MP4 pronto, sem perguntas no caminho: escreve o roteiro, monta as cenas 3D, a câmera, as legendas, o som, confere os quadros, exporta, sobe no Google Drive, deixa o card do Trello pronto para postar e envia o arquivo. No final, conta em poucas linhas as escolhas que fez e o que não foi verificado.

Por que sem perguntas: o usuário já decidiu o formato (abaixo) e pediu para não ser consultado a cada vídeo. Só pare para perguntar se a ideia for ambígua a ponto de dar dois vídeos totalmente diferentes.

## Formato fixo

- Vertical 1080×1920, 30 fps, 60 a 75 segundos, tudo em português do Brasil.
- Simulação 3D low-poly (cores chapadas, sem texturas), quase sempre em primeira pessoa, com as mãos aparecendo quando faz sentido.
- Título nos primeiros ~4 s ("E se...?" / "Como sobreviver a...") sobre a imagem mais forte do vídeo.
- Legendas curtas em serifa branca, com **uma** palavra em vermelho por legenda (a palavra que carrega o susto ou o número).
- Marcador à esquerda (título pequeno, valor grande, estado): um contador, temperatura, altitude, velocidade, distância. Ele dá a sensação de simulação; troque de grandeza quando a cena muda.
- Som: música de tensão, passos, respiração, gritos, impactos e ambiente, tudo sintetizado. Silêncio curto antes do grande impacto.
- Cartão final: "DRAMATIZAÇÃO", título, um fato real que põe a história em contexto, uma pergunta para os comentários e o nome do canal **UNIVERSO SIMULADO**.

## Como funciona por dentro

Tudo roda numa página local: three.js r128 desenha a cena, um canvas 2D põe texto por cima, WebCodecs + mp4-muxer gravam o MP4 e o áudio é gerado em JavaScript. Não há arquivos de mídia. Precisa de Python (servidor local), Node e Chrome ou Edge instalados: o script `scripts/video.mjs` desta skill abre a página num Chrome headless e faz a checagem, as folhas de quadros, a medição do som e a exportação pela linha de comando, sem o painel do navegador. Na primeira vez num PC, rode `npm install` na pasta da skill.

A pasta `assets/projeto/` desta skill é o projeto pronto:

| Arquivo | Para quê |
|---|---|
| `server.py` | Servidor local; também grava o MP4 e as folhas de quadros que a página envia |
| `js/util.js`, `js/kit.js`, `js/studio.js`, `js/sfx.js` | Peças comuns. **Não edite**; a referência está em `references/api.md` |
| `modelo.html`, `js/modelo_roteiro.js`, `js/modelo_world.js`, `js/modelo_main.js`, `js/modelo_audio.js` | Vídeo mínimo de 12 s que funciona. É o ponto de partida de todo vídeo novo |
| `sol.html`, `js/sol_*.js` | Vídeo completo de 70 s ("E se o Sol explodisse?"). Exemplo de qualidade final: três cenários, cortes, clarões, espaço, mãos, trilha |

Cada vídeo tem cinco arquivos: `<slug>.html` e, em `js/`, `<slug>_roteiro.js` (só tempos e textos: o objeto `ROTEIRO` com duração, trechos `T`, título, legendas, cartão final e texto do post), `<slug>_world.js` (cenas 3D), `<slug>_main.js` (câmera, mãos, marcador, efeitos) e `<slug>_audio.js` (trilha). O roteiro fica separado para que trocar uma frase ou um tempo não exija mexer no código das cenas.

Leia `references/api.md` antes de escrever código: ele lista as funções disponíveis e as convenções de câmera e de tela. Quando precisar de um efeito parecido com algo do vídeo do Sol (explosão, fogo, céu estrelado, planeta, corredor, passos), abra o arquivo `sol_*` correspondente e adapte.

Cada vídeo também é um **card** no quadro do Trello do usuário, que anda pelas listas junto com o trabalho e termina com o link do Drive e o texto do post. Leia `references/publicar.md` antes do passo 1: lá estão os endereços do quadro e da pasta do Drive, o que fazer com o card em cada etapa e como subir o vídeo.

## Passo a passo

### 1. Roteiro (antes de qualquer código)

O roteiro é o arquivo `js/<slug>_roteiro.js`: copie `js/modelo_roteiro.js` e preencha. Decida:

- **Slug** curto sem acento (`lua`, `tsunami`, `buraco_negro`); ele dá nome aos arquivos.
- **Trechos com tempos**, 6 a 10 trechos. A estrutura que funciona: gancho com a imagem mais forte (0–4 s) → calma em primeira pessoa com contagem regressiva → o evento → reação/fuga → consequências em escala maior (às vezes vista de fora, do espaço ou do alto) → cena final quieta → cartão final (últimos ~5 s).
- **Legendas**: 12 a 18, cada uma 2,5 a 3,6 s na tela, frase curta, no presente, falando com "você". Deixe 0,3 a 0,5 s entre elas.
- **Marcador** de cada trecho (anote num comentário do roteiro; o código dele fica no `_main.js`).
- **Fatos**: números e afirmações das legendas e do cartão final. Se houver busca na web, confira os principais; se não houver, escreva de memória e avise no final que não foram conferidos. O cartão final deve dizer a verdade mesmo quando a premissa é impossível ("o Sol não tem massa para explodir").
- **Texto do post** no campo `post`, no formato do `references/publicar.md`.

Varie o cenário de um vídeo para outro; não reaproveite a praia do Sol só porque já existe.

Com o roteiro decidido, abra o **card** do vídeo em ✍️ Roteiro, com o resumo e o texto do post.

### 2. Preparar a pasta

Se a pasta de trabalho ainda não tem `server.py` e `js/studio.js`, copie **o conteúdo** de `assets/projeto/` para ela (inclusive `.claude/launch.json`). Se já tem, não sobrescreva: vídeos anteriores moram ali.

Crie os arquivos do vídeo novo a partir do modelo: `<slug>.html`, `js/<slug>_world.js`, `js/<slug>_main.js`, `js/<slug>_audio.js` (o `_roteiro.js` já saiu do passo 1). No HTML troque o título, o `max` do controle de tempo (igual a `ROTEIRO.DUR`) e os quatro nomes de script; o roteiro vem antes do world.

Os scripts de `video.mjs` sobem o servidor sozinhos. Para o usuário assistir com som, suba o servidor (`python server.py 8770`; se a porta estiver ocupada, use outra) e abra `http://localhost:<porta>/<slug>.html` no painel do navegador.

### 3. Escrever o vídeo

Mova o **card** para 🎬 Produção.

- `_world.js`: funções de altura do chão e um `buildX(scene)` por cenário, cada um devolvendo `update(t, ...)`. Os tempos vêm de `ROTEIRO.T`.
- `_main.js`: `camState(t)` (onde a câmera está e para onde olha em cada trecho), poses das mãos, `renderAt(t)`, marcador e efeitos 2D (clarões, cortes). Título, legendas e cartão final são desenhados a partir de `ROTEIRO`, como no modelo; não copie textos para cá.
- `_audio.js`: uma função que monta a trilha com `makeSfx` e termina com `S.finish()`.

Tudo é função do tempo `t`: `renderAt(t)` precisa desenhar o mesmo quadro sempre que receber o mesmo `t`, porque a exportação e a conferência pulam no tempo. Por isso nada de `Math.random()` nem de estado acumulado entre quadros; use `mulberry32`, `hash2` e fórmulas em `t`.

### 4. Olhar os quadros e ajustar (a parte que decide a qualidade)

Mova o **card** para 🔍 Revisão. O código quase sempre roda de primeira, mas quase nunca fica bom de primeira. Reserve duas ou três rodadas:

Todos os comandos rodam na pasta de trabalho (`<skill>` é a pasta desta skill):

1. `node <skill>/scripts/video.mjs checar <slug>` → erros de carregamento e de `renderAt` de 0 até o fim, a cada 0,25 s.
2. `node <skill>/scripts/video.mjs folha <slug> praia=5,7,9,11,13,15 fuga=24,25.5,27,29,30.5,31.5 ...` → uma folha `debug/<nome>.png` por argumento, com um quadro por instante. **Abra cada imagem.** Cubra o vídeo inteiro (umas 8 a 10 folhas), incluindo os instantes logo antes e logo depois de cada corte e de cada impacto.
3. Corrija o que viu e tire de novo só as folhas afetadas.

Defeitos que apareceram nos vídeos anteriores, para procurar de propósito:

- **Tudo branco no clarão.** Luzes multiplicadas por 5 mais véus 2D por cima apagam a cena. Mantenha as luzes abaixo de ~2× e os véus de tela inteira abaixo de ~0,15 de opacidade depois do primeiro meio segundo; o exagero fica só no instante do impacto.
- **Cena escura demais.** Noite e interior ainda precisam de leitura no celular: luz ambiente suficiente para distinguir chão, horizonte e objetos.
- **Objeto no caminho da câmera.** Uma árvore ou guarda-sol na reta da corrida vira um borrão que tapa a tela. Deixe um corredor livre.
- **Câmera atravessando parede ou chão** no fim de um movimento. Confira o último quadro antes de cada corte.
- **Assunto fora do quadro.** O campo de visão horizontal é de só ~46° (o vertical é 74°): o que está 25° para o lado já saiu. Componha na vertical: um assunto em cima, outro embaixo.
- **Mãos gigantes** ou no meio da tela. Elas ficam no terço de baixo; ajuste posição e rotação até parecerem mãos.
- **Texto ilegível.** Legenda sobre área clara e agitada some; o marcador fica em x≈46, y≈520–600 e as legendas em y≈916 (coordenadas 720×1280), então não ponha o assunto principal aí atrás.
- **Planeta ou objeto distante minúsculo.** Em plano aberto, exagere a escala.

### 5. Medir o som

Ninguém vai ouvir a trilha antes do usuário, então meça: `node <skill>/scripts/video.mjs som <slug>` mostra a duração, as amostras NaN e o RMS de cada segundo em dB, e avisa o que sair dos limites. Critérios: nenhum NaN; duração igual à do vídeo; ambiente por volta de −30 a −22 dB; impactos por volta de −14 a −8 dB; nenhum trecho mudo sem querer (abaixo de −45 dB). Se os trechos calmos estiverem baixos, aumente o `amp` deles ou o `drive` de `finish`.

### 6. Exportar, conferir e entregar

1. `node <skill>/scripts/video.mjs exportar <slug>` → grava `<slug>.mp4` na pasta de trabalho (uns 20 s para 70 s de vídeo) e confere com ffprobe se é 1080×1920, tem áudio e tem a duração do roteiro. Código de saída 1 = algo falhou; leia a mensagem.
2. Olhe alguns quadros do arquivo final: `ffmpeg -v error -i <slug>.mp4 -vf "fps=1/8,scale=270:-1,tile=9x1" -frames:v 1 debug/final.png` e abra a imagem.
3. Apague a pasta `debug/`.
4. Copie o MP4 para a pasta do canal no Drive do PC, pegue o link e mova o **card** para 📱 Pronto para postar (`references/publicar.md`).
5. Envie o arquivo ao usuário e escreva um resumo curto: o que o vídeo mostra em uma ou duas frases, as escolhas que você fez (cenário, duração, fato do cartão final), o link do card e, com franqueza, o que não foi verificado — o áudio foi medido e não ouvido; quais fatos não foram conferidos.

## Pedidos de ajuste

Quando o usuário comentar um vídeo pronto ("o grito ficou estranho", "mais tempo na corrida", "troca a frase do final"), edite só os arquivos daquele vídeo, confira os quadros dos trechos alterados, exporte de novo com o mesmo nome, substitua o arquivo na pasta do Drive (o link do **card** continua valendo) e envie. Se o comentário for uma preferência que vale para os próximos vídeos, diga isso ao usuário e ofereça atualizar esta skill.

## Limites

- Faça vídeos originais nesse formato. Não recrie quadro a quadro um vídeo específico de outro canal, nem use personagens, marcas ou músicas de terceiros.
- Sofrimento aparece de forma sugerida (grito, tela, mãos), sem violência gráfica: é dramatização low-poly, e o cartão final sempre traz o contexto real.
