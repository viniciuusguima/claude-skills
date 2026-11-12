# Thumbnail: o que analisar e como fazer a nossa

Lido pelo analista de thumb e pelo designer de thumb. A thumbnail e o título são vistos juntos e decidem o clique antes de qualquer segundo do vídeo, por isso são analisados e criados como um par.

A imagem final é gerada pelo usuário no Gemini (Nano Banana). O nosso trabalho é o **prompt**: o texto que ele cola no Gemini junto com as imagens de referência que anexa.

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
5. **A receita visual**, com precisão de quem vai descrever a imagem para outra pessoa desenhar: composição (proporções, ângulos, onde fica cada elemento), estilo de ilustração (traço, sombreamento, nível de detalhe), paleta em hex aproximado, tipografia (peso, contorno, cor).
6. **O que é dela e não vem junto**: logotipos, nome e pintura da companhia, personagens, rostos. Leva-se a receita e o mecanismo; o desenho é novo.

## Os prompts

Sempre **duas variantes**, para o usuário escolher ou testar uma contra a outra no YouTube:

- **A, a receita da original**: a mesma composição e o mesmo estilo da thumb de referência, com o nosso texto, o nosso objeto e a marca do canal.
- **B, outra aposta**: outro momento do vídeo ou o texto como protagonista, para descobrir se o canal ganha com algo diferente da fórmula.

Cada variante vai em `saida/thumb_prompts.md` com quatro partes:

1. **Anexe, nesta ordem**: as imagens que o usuário põe no Gemini e o papel de cada uma ("imagem 1: composição e estilo", "imagem 2: o avião"). Use os arquivos que existem no projeto: `referencia/thumb_original.jpg`, as fotos em `referencia/fotos/` e, quando o canal já tiver thumbs publicadas, uma delas para manter a identidade.
2. **Prompt**: em inglês, que é onde o Gemini segue composição e texto com mais precisão. Um bloco de código só, pronto para colar.
3. **Texto na imagem**: as palavras em espanhol, exatamente como devem aparecer, com acentos e `¿` `¡`.
4. **Se vier errado**: duas ou três frases de correção para colar na mesma conversa do Gemini, para as falhas mais prováveis (palavra escrita errada, texto pequeno demais, copiou o logotipo ou o nome da companhia da referência).

Todo prompt diz, com estas palavras ou equivalentes:

- Formato 16:9, 1280×720, thumbnail de YouTube.
- Que as imagens anexadas são referência de composição e estilo, e que o desenho é novo: pintura, nome da companhia e logotipos trocados ou removidos.
- O texto exato entre aspas, em maiúsculas, e "no other text". Acento é onde o gerador mais erra; peça para conferir cada letra.
- A marca do canal (`canal.md`): o destaque na cor do canal em hex e as três cantoneiras na mesma cor, nos cantos superior esquerdo, inferior esquerdo e superior direito.
- O canto inferior direito (cerca de 220×100 px) livre de texto e do elemento principal: o YouTube cobre essa área com a duração do vídeo.
- Alto contraste e um foco só, legível em tamanho pequeno.

## Conferir a imagem gerada

O usuário salva o que o Gemini gerou como `saida/thumb_a.png` e `saida/thumb_b.png`. Para ver no tamanho do feed:
```bash
ffmpeg -v error -y -i saida/thumb_a.png -vf scale=168:-1 build/thumb_a_168.png
```
Abra a miniatura de 168 px com Read e responda:

- Dá para ler o texto inteiro, com os acentos certos?
- O elemento principal ainda é reconhecível ou virou um borrão?
- O canto inferior direito está livre?
- Sobrou algo da referência que não é nosso: logotipo, nome da companhia, a mesma pintura?
- Thumb + título, lidos juntos, abrem uma pergunta?

O YouTube aceita até 2 MB. Se passar, converta para JPG (`ffmpeg -i thumb_a.png -q:v 3 thumb_a.jpg`).

## Thumb por código (só quando o usuário pedir)

Se o usuário quiser a thumb pronta sem passar pelo Gemini, ela sai em HTML no estilo do vídeo (fundo preto, branco, cor de destaque, cantoneiras): `thumb_a.html` e `thumb_b.html` na pasta do projeto, cópias de `template/thumb.html`.
```bash
node <skill>/scripts/gerar_thumb.mjs --quadro 12.5,48          # quadros do vídeo -> build/quadro_*.png, para usar em <img id="imagem">
node <skill>/scripts/gerar_thumb.mjs --titulo "<o título>"    # -> saida/thumb_a.png, saida/thumb_b.png, build/thumb_previa.png
```
A prévia mostra cada thumb em 320 e 168 px, em fundo escuro e claro, ao lado da original; confira com a lista acima.
