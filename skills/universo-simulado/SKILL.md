---
name: universo-simulado
description: Produz do zero um vídeo vertical completo (MP4 1080×1920, 60–75 s, PT-BR) do canal UNIVERSO SIMULADO a partir de uma única ideia — simulação 3D low-poly em primeira pessoa, legendas com uma palavra em vermelho, marcador na tela, trilha e efeitos sintetizados, cartão final "DRAMATIZAÇÃO". Use sempre que o usuário der uma ideia ou tema de vídeo ("faz um vídeo de e se a Lua caísse", "como sobreviver a um tsunami", "próximo vídeo: buraco negro", "quero um vídeo sobre...", "faz outro"), pedir um vídeo para TikTok/Shorts/Reels nesse estilo, ou pedir para ajustar ou refazer um vídeo já feito com esta skill — mesmo que ele não diga "skill" nem o nome do canal.
---

# Universo Simulado

O usuário diz só a ideia. Você entrega o MP4 pronto, sem perguntas no caminho: escreve o roteiro, monta as cenas 3D, a câmera, as legendas, o som, confere os quadros, exporta e envia o arquivo. No final, conta em poucas linhas as escolhas que fez e o que não foi verificado.

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

Tudo roda numa página local: three.js r128 desenha a cena, um canvas 2D põe texto por cima, WebCodecs + mp4-muxer gravam o MP4 e o áudio é gerado em JavaScript. Não há arquivos de mídia nem instalação além de Python (servidor local) e um navegador controlável (painel do navegador do app ou Chrome).

A pasta `assets/projeto/` desta skill é o projeto pronto:

| Arquivo | Para quê |
|---|---|
| `server.py` | Servidor local; também grava o MP4 e as folhas de quadros que a página envia |
| `js/util.js`, `js/kit.js`, `js/studio.js`, `js/sfx.js` | Peças comuns. **Não edite**; a referência está em `references/api.md` |
| `modelo.html`, `js/modelo_world.js`, `js/modelo_main.js`, `js/modelo_audio.js` | Vídeo mínimo de 12 s que funciona. É o ponto de partida de todo vídeo novo |
| `sol.html`, `js/sol_*.js` | Vídeo completo de 70 s ("E se o Sol explodisse?"). Exemplo de qualidade final: três cenários, cortes, clarões, espaço, mãos, trilha |

Leia `references/api.md` antes de escrever código: ele lista as funções disponíveis e as convenções de câmera e de tela. Quando precisar de um efeito parecido com algo do vídeo do Sol (explosão, fogo, céu estrelado, planeta, corredor, passos), abra o arquivo `sol_*` correspondente e adapte.

## Passo a passo

### 1. Roteiro (antes de qualquer código)

Decida e anote para você mesmo:

- **Slug** curto sem acento (`lua`, `tsunami`, `buraco_negro`); ele dá nome aos arquivos.
- **Trechos com tempos**, 6 a 10 trechos. A estrutura que funciona: gancho com a imagem mais forte (0–4 s) → calma em primeira pessoa com contagem regressiva → o evento → reação/fuga → consequências em escala maior (às vezes vista de fora, do espaço ou do alto) → cena final quieta → cartão final (últimos ~5 s).
- **Legendas**: 12 a 18, cada uma 2,5 a 3,6 s na tela, frase curta, no presente, falando com "você". Deixe 0,3 a 0,5 s entre elas.
- **Marcador** de cada trecho.
- **Fatos**: números e afirmações das legendas e do cartão final. Se houver busca na web, confira os principais; se não houver, escreva de memória e avise no final que não foram conferidos. O cartão final deve dizer a verdade mesmo quando a premissa é impossível ("o Sol não tem massa para explodir").

Varie o cenário de um vídeo para outro; não reaproveite a praia do Sol só porque já existe.

### 2. Preparar a pasta

Se a pasta de trabalho ainda não tem `server.py` e `js/studio.js`, copie **o conteúdo** de `assets/projeto/` para ela (inclusive `.claude/launch.json`). Se já tem, não sobrescreva: vídeos anteriores moram ali.

Crie os arquivos do vídeo novo a partir do modelo: `<slug>.html`, `js/<slug>_world.js`, `js/<slug>_main.js`, `js/<slug>_audio.js`. No HTML troque o título, o `max` do controle de tempo e os três nomes de script. No `main`, o último argumento de `studio.start` é o nome do MP4.

Suba o servidor (`python server.py 8770`, ou a configuração `videos` do `launch.json`; se a porta estiver ocupada, use outra) e abra `http://localhost:<porta>/<slug>.html`.

### 3. Escrever o vídeo

- `_world.js`: os tempos do roteiro em um objeto (`T`), funções de altura do chão e um `buildX(scene)` por cenário, cada um devolvendo `update(t, ...)`.
- `_main.js`: `camState(t)` (onde a câmera está e para onde olha em cada trecho), poses das mãos, `renderAt(t)`, legendas, marcador, efeitos 2D (clarões, cortes), cartão final.
- `_audio.js`: uma função que monta a trilha com `makeSfx` e termina com `S.finish()`.

Tudo é função do tempo `t`: `renderAt(t)` precisa desenhar o mesmo quadro sempre que receber o mesmo `t`, porque a exportação e a conferência pulam no tempo. Por isso nada de `Math.random()` nem de estado acumulado entre quadros; use `mulberry32`, `hash2` e fórmulas em `t`.

### 4. Olhar os quadros e ajustar (a parte que decide a qualidade)

O código quase sempre roda de primeira, mas quase nunca fica bom de primeira. Reserve duas ou três rodadas:

1. Leia os erros do console e rode `renderAt` de 0 até o fim em passos de 0,25 s dentro de um `try` para pegar erros em qualquer trecho.
2. Para cada trecho, grave uma folha de quadros no console da página, `await snap([t1, t2, t3, t4, t5, t6], 'nome')`, e **abra a imagem** `debug/nome.png`. Cubra o vídeo inteiro (umas 8 a 10 folhas), incluindo os instantes logo antes e logo depois de cada corte e de cada impacto.
3. Corrija o que viu, recarregue a página e tire de novo só as folhas afetadas.

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

Ninguém vai ouvir a trilha antes do usuário, então meça. No console: `const a = synthNow()` e calcule o RMS de cada segundo em dB. Critérios: nenhum NaN; duração igual à do vídeo; ambiente por volta de −30 a −22 dB; impactos por volta de −14 a −8 dB; nenhum trecho mudo sem querer (abaixo de −45 dB). Se os trechos calmos estiverem baixos, aumente o `amp` deles ou o `drive` de `finish`.

### 6. Exportar, conferir e entregar

1. No console: `exportVideo('<slug>.mp4')` **sem `await`**, e acompanhe `window.__exp` (`state`: running → audio → saving → done, ou error com `msg`). A exportação leva cerca de um minuto e chamadas ao console costumam ter limite de ~30 s, então consulte em chamadas separadas.
2. Confira o arquivo: busque o MP4 como blob, ponha num `<video>` com `URL.createObjectURL` (o servidor não aceita pedidos parciais, então sem blob o salto no tempo não funciona), verifique duração, 1080×1920 e a presença da faixa de áudio, e desenhe alguns quadros num canvas para olhar.
3. Apague a pasta `debug/`.
4. Envie o arquivo ao usuário e escreva um resumo curto: o que o vídeo mostra em uma ou duas frases, as escolhas que você fez (cenário, duração, fato do cartão final) e, com franqueza, o que não foi verificado — o áudio foi medido e não ouvido; quais fatos não foram conferidos.

## Pedidos de ajuste

Quando o usuário comentar um vídeo pronto ("o grito ficou estranho", "mais tempo na corrida", "troca a frase do final"), edite só os arquivos daquele vídeo, confira os quadros dos trechos alterados, exporte de novo com o mesmo nome e envie. Se o comentário for uma preferência que vale para os próximos vídeos, diga isso ao usuário e ofereça atualizar esta skill.

## Limites

- Faça vídeos originais nesse formato. Não recrie quadro a quadro um vídeo específico de outro canal, nem use personagens, marcas ou músicas de terceiros.
- Sofrimento aparece de forma sugerida (grito, tela, mãos), sem violência gráfica: é dramatização low-poly, e o cartão final sempre traz o contexto real.
