# Identidade do canal: banner, foto e o que olhar na referência

## Medidas do YouTube

| | Tamanho | O que o público vê |
|---|---|---|
| Banner | 2560×1440, até 6 MB | TV: o banner inteiro. Computador: a faixa de 2560×423 do meio (menos, em janela estreita). Tablet: 1855×423. Celular: 1546×423 |
| Área segura do banner | 1546×423 no centro (x de 507 a 2053, y de 508 a 931) | a única parte que todo aparelho mostra: o nome, a frase e a marca vão aqui |
| Foto de perfil | 800×800, até 4 MB | cortada em círculo; 98 px na página do canal, 40 px nos comentários e ao lado de cada vídeo no feed |

O `gerar_identidade.mjs` já renderiza nessas medidas, passa para JPG o que passar do limite e avisa quando um elemento marcado com `data-seguro` sai da área segura ou encosta na borda do círculo.

## O que anotar na referência

1. **O conjunto**: o que banner, foto e thumbs têm em comum (cor, tipografia, traço, um elemento repetido). É o que faz alguém reconhecer o canal sem ler o nome.
2. **Banner**: o que fica na área segura (nome, frase, rosto, um objeto), o que só aparece na TV, a paleta em hex aproximado, a tipografia (peso, caixa alta, contorno).
3. **Foto**: o tipo (rosto, logotipo, sigla, mascote, objeto), se ainda é reconhecível a 40 px, e se some em fundo escuro ou em fundo claro.
4. **Thumbs** (`thumbs.png`, da mais vista para a menos vista): o que as três mais vistas têm em comum que as últimas não têm. É o ponto 4 de "O que anotar ao analisar a original" em `<video>/references/thumb.md`.
5. **Títulos** (`videos.md`): a fórmula dos mais vistos, o comprimento, o uso de números, perguntas e nomes próprios.
6. **Tema e promessa**: do que o canal fala e o que o espectador ganha, em uma frase. A descrição em `canal.json` ajuda.
7. **O que é deles e não vem junto**: nome, logotipo, mascote, rosto, frase de efeito, a mesma composição do banner. Leva-se o mecanismo e a paleta como ponto de partida; o desenho é novo.

## Como o nosso fica

- **Uma marca só**, simples, que se repete na foto, no banner e em toda thumb (as cantoneiras do modelo são um exemplo). É ela que o perfil descreve em "Marca nas thumbs".
- **Uma cor de destaque**. O resto preto e branco, como os vídeos do motor; a cor marca o que importa.
- **Foto**: uma sigla de uma ou duas letras, ou um ícone simples, grande e no centro. Nada de texto pequeno. O fundo do YouTube é escuro ou claro conforme o tema do usuário, então a foto precisa de contorno nos dois: o anel na cor de destaque do modelo resolve.
- **Banner**: o nome grande e a frase do canal na área segura. O que fica fora dela é decoração e pode ser cortado sem prejuízo.
- **Texto** na língua principal do canal, com todos os acentos. O nome do canal não se traduz.

## Conferir (na `previa.png`)

- O nome e a frase aparecem inteiros no recorte do celular?
- A foto a 40 px ainda é reconhecível, em fundo escuro e em fundo claro?
- Banner e foto parecem do mesmo canal, e combinam com a marca que as thumbs vão ter?
- Nada da referência que não é nosso: nome, logotipo, mascote, a mesma composição.
- Acentos certos?

## Prompts para o Gemini

Em `identidade/prompts.md`, um bloco para o banner e um para a foto, cada um com quatro partes:

1. **Anexe, nesta ordem**: as imagens e o papel de cada uma. Em geral: o `banner.png` (ou `avatar.png`) que o script gerou, como composição, texto e cores; o banner (ou a foto) da referência, só como estilo de ilustração.
2. **Prompt**: em inglês, que é onde o Gemini segue composição e texto com mais precisão. Um bloco de código só, pronto para colar.
3. **Texto na imagem**: as palavras exatas, com acentos.
4. **Se vier errado**: duas ou três frases de correção para colar na mesma conversa (texto escrito errado, texto fora da área central, copiou algo da referência).

Todo prompt diz, com estas palavras ou equivalentes:

- **Banner**: "YouTube channel banner, 16:9, 2560x1440. All text and the main element must stay inside the central 1546x423 area; the rest is background that can be cropped."
- **Foto**: "YouTube profile picture, square 800x800, will be cropped to a circle and shown at 40 px. One bold element in the center, nothing important near the edges."
- Que as imagens anexadas são referência de composição e estilo e que o desenho é novo, sem logotipo, nome ou personagem da referência.
- O texto exato entre aspas e "no other text".
- A cor de destaque em hex e a marca do canal.

## Conferir uma imagem pronta

Para ver no recorte uma imagem que veio do Gemini (ou de qualquer lugar), salve-a em `identidade/`, crie `banner_gemini.html` (ou `avatar_gemini.html`) a partir do modelo, apague o texto e a marca, ponha a imagem em `<img id="imagem" src="...">` sem o filtro de brilho, e rode o script. A prévia mostra a imagem nos recortes de TV, computador e celular, e o PNG gerado já sai no tamanho certo para subir.
