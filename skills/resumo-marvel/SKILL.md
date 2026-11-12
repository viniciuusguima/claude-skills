---
name: resumo-marvel
description: Produz um vídeo longo (YouTube, 1920×1080, 7 a 20 min, PT-BR) que resume ou explica personagens, armaduras, joias, vilões ou sagas de filmes de super-herói (Marvel, DC) no formato "O ÚNICO resumo de X que você precisa" / "TODAS as armaduras explicadas": capítulos cronológicos de ~2 min, narração por voz da Cartesia, imagens oficiais e trechos curtos de trailers, faixa branca com o nome do capítulo em Comic Sans, capa em grade 3×2. Use sempre que o usuário pedir um vídeo, roteiro, capa ou montagem sobre um herói, vilão, filme ou saga ("faz o vídeo do Thanos", "próximo: trajes do Homem-Aranha", "monta o vídeo das joias", "roteiro do Coringa"), ou pedir ajuste num vídeo desse tipo já feito, mesmo sem dizer "skill".
---

# Resumo Marvel

Vídeos longos para o YouTube no formato do canal de referência The Robot-Man: narração do começo ao fim sobre material oficial (stills e trailers), dividida em capítulos cronológicos, sem introdução. O vídeo abre direto no primeiro capítulo.

Os vídeos moram em `E:\Projetos\rico`, um vídeo por pasta (`rico\<slug>\`). O primeiro, das armaduras do Homem de Ferro, ficou na raiz de `rico`. Cada pasta tem:

```
roteiro.md        roteiro com as marcações de imagem e de cena
narracao.json     opcional: voz e velocidade da Cartesia
imagens/NN-assunto/NN-assunto-K.jpg|png      stills oficiais
cenas/NN - Filme (ano) - Trailer.mp4         trailers oficiais
audio/narracao.wav
montagem.json     linha do tempo: que imagem ou trecho entra em cada intervalo da narração
build/            cache (voz por bloco, pedaços de vídeo, folhas de conferência)
saida/<slug>.mp4  vídeo final
capa.json, capa.jpg
```

Os scripts estão em `<skill>/scripts/` (`<skill>` é a pasta desta skill) e rodam com Python, ffmpeg e Pillow. `alinhar.py` usa também o faster-whisper.

## Passo a passo

### 1. Roteiro

Leia `references/roteiro.md` e escreva o `roteiro.md` com as opções de título, a descrição, a lista de capítulos e o texto de cada capítulo com as marcações `[IMG: …]` e `[CENA: …]`. Mostre o roteiro ao usuário antes de gerar a narração, porque a voz custa créditos. Abra o card no Trello (`references/publicar.md`).

### 2. Material (garimpo)

Leia `references/garimpo.md`. Baixe os stills e os trailers oficiais, salve-os com os nomes do padrão e troque cada marcação descritiva pela do arquivo: `[IMG: Tony martelando]` vira `[IMG 01-mark-1-2]`, e `[CENA: a fuga da caverna]` vira `[CENA 01]`. Marcação que ficar descritiva vira um plano cinza "PENDENTE" na montagem, o que serve para conferir os tempos antes de ter todo o material.

### 3. Narração

```bash
python <skill>/scripts/narrar.py roteiro.md --amostra       # uma frase em build/amostra.wav
python <skill>/scripts/narrar.py roteiro.md --capitulos 1   # teste barato: só o 1º capítulo
python <skill>/scripts/narrar.py roteiro.md                 # tudo -> audio/narracao.wav e o rascunho montagem.json
```

A voz é a da Cartesia (chave em `CARTESIA_API_KEY`, nunca a imprima). A voz padrão é a **Luana**, a mesma do canal de mentalidade. Para outra voz, `--listar [--genero masculine]` e um `narracao.json` com `{"voz": "<id>"}`. Cada bloco fica em cache: mudar uma frase do roteiro e rodar de novo regenera só aquele bloco. Depois de mudar o roteiro, use `--refazer-montagem` (isso descarta ajustes feitos à mão no `montagem.json`).

Se o usuário mandar uma narração gravada ou gerada fora daqui, use `python <skill>/scripts/alinhar.py roteiro.md <audio>`. Ele transcreve o áudio, acha onde cada bloco começa e escreve o mesmo rascunho.

### 4. Montagem

Leia `references/montagem.md`. Resumo:

```bash
python <skill>/scripts/montar.py --folha      # build/folhas/folha-NN.png: um quadro do meio de cada plano
python <skill>/scripts/montar.py --de 120 --ate 240   # só um trecho, em build/trecho.mp4
python <skill>/scripts/montar.py              # vídeo final em saida/<slug>.mp4
```

Abra **todas** as folhas e corrija o `montagem.json`: trecho de trailer que caiu num logo, numa tela preta ou num letreiro; imagem que não combina com a fala; a mesma imagem repetida em sequência; o rótulo no lugar errado. Só os planos alterados são refeitos.

### 5. Capa

`python <skill>/scripts/capa.py capa.json capa.jpg`: seis momentos-chave numa grade 3×2, legendas de uma ou duas palavras em maiúsculas e um círculo ou uma seta vermelha em um ou dois painéis (formato em `references/montagem.md`). Abra a imagem e confira se cada painel é legível pequeno.

### 6. Revisão e entrega

Antes de entregar, confira:

- **Direitos:** a narração cobre o vídeo inteiro; cada trecho de trailer tem poucos segundos; o som dos trailers e a música oficial nunca entram (o `montar.py` já usa só a narração e, se houver, a trilha livre de `musica`).
- **Fatos:** nomes, anos, números das armaduras e ordem dos filmes. Confira na web os que não forem óbvios.
- **Som:** o `montar.py` normaliza a voz para −16 LUFS. Ninguém ouviu antes do usuário: diga isso.

Envie o caminho do MP4 e da capa, os títulos e a descrição com os capítulos (tempos reais: `build/blocos.json` traz o início de cada bloco), e atualize o card.

## Limites

- Use só material oficial (stills de divulgação, trailers de canais oficiais). Imagens geradas por IA de personagens Marvel ficaram ruins e o usuário não quer.
- Não recrie um vídeo específico de outro canal. O formato é a referência, mas o roteiro é próprio.
