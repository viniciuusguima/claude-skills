# Thumbnail: o que analisar e como fazer a nossa

Lido pelo analista de thumb e pelo designer de thumb. A thumbnail e o título são vistos juntos e decidem o clique antes de qualquer segundo do vídeo, por isso são analisados e criados como um par.

## Como uma thumbnail ganha o clique

- **Um foco só.** O olho pousa num elemento em menos de um segundo. Thumb com três coisas disputando atenção perde para a que tem uma.
- **Lacuna de curiosidade.** A imagem mostra o momento ou o objeto, o título dá o contexto, e a resposta só existe dentro do vídeo. Uma thumb que já responde à pergunta não precisa do clique.
- **Thumb e título não se repetem.** Se o título diz "72 días en los Andes", a thumb não escreve isso de novo: ela mostra ou diz o que o título não diz ("NADIE VINO").
- **Texto de até três palavras**, enorme. O que não se lê a 168 px de largura não existe.
- **Contraste que sobrevive ao feed.** A thumb aparece em fundo escuro e em fundo claro, ao lado de outras dez. Borda escura some no tema escuro; pouco contraste some nos dois.
- **Promessa que o vídeo paga.** O que a thumb mostra tem que acontecer no vídeo, de preferência nos primeiros 30 segundos. Clique frustrado derruba a retenção, e a retenção derruba o vídeo.

## O que anotar ao analisar a original

1. **O que está nela**: elemento principal, onde fica, quanto do quadro ocupa; texto (quantas palavras, que tamanho, que cor); cores dominantes; rosto ou emoção, se houver.
2. **O mecanismo**: em uma frase, por que alguém clicaria. Que pergunta ela abre? O que o título acrescenta?
3. **No tamanho do feed** (`thumb_original_320.jpg`): o que continua legível e o que some.
4. **O padrão do canal** (`thumbs_canal.png` e `thumbs_canal.md`, ordenadas da mais vista para a menos vista): o que as três mais vistas têm em comum que as últimas não têm? Cor recorrente, enquadramento, tipo de texto, presença de rosto.
5. **O que não pode ser levado**: fotos, rostos, logotipos, a composição exata. Leva-se o mecanismo, não a imagem.

## A nossa thumbnail

O estilo é o do canal (`canal.md`): fundo preto, branco, uma cor de destaque, as três cantoneiras. Dentro disso, sempre **duas variantes** que apostam em coisas diferentes, para o usuário escolher ou testar no próprio YouTube:

- **A, imagem na frente**: um quadro do próprio vídeo (o objeto ou o momento mais forte) ocupando a direita, com uma ou duas palavras à esquerda.
- **B, texto na frente**: duas ou três palavras gigantes, uma delas na cor de destaque, e um elemento gráfico pequeno de apoio.

As duas partem de `thumb_a.html` e `thumb_b.html` na pasta do projeto, cópias de `template/thumb.html`. É HTML e CSS livre dentro de 1280×720: mude tamanhos, posições, acrescente SVG. Mantenha as cantoneiras e a variável `--acento`.

Para usar um quadro do vídeo como imagem:
```bash
node <skill>/scripts/gerar_thumb.mjs --quadro 12.5,48     # -> build/quadro_12.5.png, build/quadro_48.png
```
e na thumb `<img id="imagem" src="build/quadro_12.5.png">`. Escolha o tempo pela `build/folha.png` (cada quadro tem o tempo escrito). Quadro com texto da cena por cima raramente serve; prefira um momento em que só o objeto está na tela e ajuste `object-position` para enquadrar.

Para gerar e conferir:
```bash
node <skill>/scripts/gerar_thumb.mjs --titulo "<o título escolhido>"
```
Sai `saida/thumb_a.png`, `saida/thumb_b.png` e `build/thumb_previa.png`, que mostra cada thumb grande, em 320 px e em 168 px, sobre fundo escuro e claro, com o título embaixo e a original ao lado. Abra a prévia com Read e responda olhando as miniaturas de 168 px, não a grande:

- Dá para ler o texto inteiro?
- O elemento principal ainda é reconhecível ou virou um borrão?
- Texto e imagem se sobrepõem?
- O canto inferior direito (220×100 px) está livre? O YouTube cobre essa área com a duração do vídeo.
- Ao lado da original, a nossa disputa atenção ou some?
- Thumb + título, lidos juntos, abrem uma pergunta?

O script avisa se uma imagem não carregou ou se o conteúdo passou de 1280×720, e troca PNG por JPG sozinho se o arquivo passar de 2 MB, que é o limite do YouTube.
