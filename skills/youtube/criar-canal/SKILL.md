---
name: criar-canal
description: Monta um canal novo do YouTube parecido com um canal de referência — olha a home da referência (banner, foto de perfil, thumbs mais vistas, títulos, descrição), define a identidade do canal novo (tema, língua, voz, tom, cor de destaque, marca das thumbs), gera o banner 2560×1440 e a foto de perfil 800×800 em PNG, escreve prompts para versões ilustradas no Gemini (Nano Banana), sugere descrição e palavras-chave, e grava o perfil do canal que a skill recriar-video-youtube usa em todo vídeo. Use quando o usuário chamar /criar-canal com o nome de um canal (ex.: "/criar-canal bitacora de vuelo"), pedir para "criar um canal", "montar o canal", "fazer o banner e a foto do canal", "identidade do canal", ou quiser refazer o banner ou a foto de um canal que já existe, mesmo sem dizer "skill".
argument-hint: "<nome do canal> [link do canal de referência]"
---

# Criar canal do YouTube

`/criar-canal <nome do canal>` monta um canal novo parecido com um canal de referência. A entrega:

- **Perfil do canal**: `<skill>/canais/<slug>.md`. É dele que a recriar-video-youtube tira tema, tom, voz, marca das thumbs, pasta dos projetos, etiqueta do Trello e pasta do Drive. Sem perfil, não há vídeo para o canal.
- **Banner** (`banner.png`, 2560×1440) e **foto de perfil** (`avatar.png`, 800×800), prontos para subir no YouTube Studio, e `previa.png` com os dois como o público vê, ao lado da referência.
- **Prompts para o Gemini** (`prompts.md`): versões ilustradas do banner e da foto, para quando o usuário quiser algo além da versão tipográfica.
- **Textos do canal** (`textos.md`): descrição, palavras-chave e sugestões de @, na língua do canal.

Caminhos:

- `<skill>`: a pasta desta skill. Os perfis ficam em `<skill>/canais/`; o modelo, em `<skill>/template/canal.md`.
- `<video>`: `<skill>/../recriar-video-youtube`, a skill que usa o perfil. Dela vêm as línguas e vozes (`<video>/references/linguas.md`), as regras de thumbnail (`<video>/references/thumb.md`) e o Trello e o Drive (`<video>/references/publicar.md`).
- `<slug>`: o nome em minúsculas, sem acento, com hífens (`Bitácora de Vuelo` → `bitacora-de-vuelo`).
- `<pasta do canal>`: `E:/Projetos/<slug>/`. Os vídeos do canal ficam em subpastas dela; o trabalho desta skill fica em `<pasta do canal>/identidade/`.

## Primeiro: o nome, a referência e a língua

O nome vem junto com o comando. Escreva-o como vai aparecer no YouTube, com maiúsculas e acentos (`bitacora de vuelo` → `Bitácora de Vuelo`); se não tiver certeza da grafia, pergunte junto com o resto.

Antes de qualquer outra coisa, veja se `<skill>/canais/<slug>.md` já existe:

- **Existe**: o canal já foi criado. Leia o perfil e faça só o que falta (banner e foto, se o perfil diz que ainda não foram feitos; os itens de "A definir" que esta skill resolve, como canal de referência e @) ou o que o usuário pediu. Não recrie o perfil do zero.
- **Não existe**: pergunte numa mensagem só o que o pedido não trouxe:
  1. **Canal de referência**: o link ou o @ do canal do YouTube que o novo vai seguir. Sem referência, pergunte o tema e siga o estilo do motor dos vídeos (preto e branco, holofote).
  2. **Língua principal** do canal (espanhol, português, inglês ou outra). Cada vídeo pode sair em outra língua; a recriar-video-youtube pergunta a cada vídeo.

## Fluxo

### 1. Olhar a home da referência
```bash
python <skill>/scripts/referencia_canal.py "<link ou @>" --saida E:/Projetos/<slug>/identidade/referencia
```
Grava o banner e a foto da referência, a grade das thumbs mais vistas, a lista dos vídeos recentes e os dados do canal. Abra com Read `banner.jpg`, `avatar.jpg` e `thumbs.png`, e leia `canal.json` e `videos.md`.

Se o navegador embutido estiver disponível, abra também a home do canal (`preview_start` com o link) e tire um screenshot: é como o público vê o conjunto (banner recortado, foto, nome, as seções da página). Sem navegador, siga só com os arquivos.

### 2. Analisar
Leia `references/identidade.md` inteiro e escreva `identidade/analise.md`, em português, com os pontos de "O que anotar na referência".

### 3. Propor a identidade
Mostre ao usuário, em poucas linhas, e espere o ok:

- tema e promessa do canal, em uma frase;
- língua principal e voz (`<video>/references/linguas.md`);
- tom da narração;
- cor de destaque (hex) e a marca que vai em todas as thumbs, no banner e na foto;
- a frase do banner e a sigla (ou o ícone) da foto;
- o que vem da referência e o que muda.

### 4. Gravar o perfil
Copie `<skill>/template/canal.md` para `<skill>/canais/<slug>.md` e preencha com o que foi aprovado. O que o usuário não decidiu vai para "A definir", com o padrão que vale enquanto isso.

### 5. Banner e foto
Copie `<skill>/template/banner.html` e `<skill>/template/avatar.html` para `identidade/`, troque as cores (`--acento`, `--fundo`, `--texto`), o nome, a frase e a sigla, ajuste a composição ao que a análise pediu, e rode de dentro de `identidade/`:
```bash
node <skill>/scripts/gerar_identidade.mjs
```
Abra `previa.png` com Read e confira com "Conferir" em `references/identidade.md`. Aviso de área segura é erro: corrija e rode de novo.

Para mostrar duas opções, crie `banner_b.html` ou `avatar_b.html`: o script renderiza todo `banner*.html` e `avatar*.html` da pasta.

### 6. Prompts e textos
Escreva `identidade/prompts.md` como em "Prompts para o Gemini" de `references/identidade.md`, e `identidade/textos.md`, na língua do canal:

- **Descrição do canal**: até 1000 caracteres. As duas primeiras linhas dizem o que o canal entrega: são as que aparecem na busca.
- **Palavras-chave**: 10 a 15, como o público busca.
- **@**: duas ou três sugestões curtas, sem acento. O usuário confere no YouTube se estão livres.

### 7. Trello e Drive
Leia `<video>/references/publicar.md`. O canal precisa de uma etiqueta no quadro "Produção de Vídeos" numa cor que nenhum outro canal usa (a lista de quem usa qual cor está lá). O conector do Trello não cria etiquetas: peça ao usuário para criar uma com o nome do canal, pegue o ID com `trelloReadBoard` (`list_labels`), grave no perfil e acrescente a cor à lista do `publicar.md`. Se ele preferir deixar para depois, o perfil fica com a etiqueta em "A definir".

A pasta do canal no Drive é criada no primeiro vídeo, como o `publicar.md` explica. Se o usuário quiser já, crie-a do mesmo jeito e suba `banner.png` e `avatar.png`.

### 8. Entregar
Mande `banner.png`, `avatar.png`, `previa.png` e `prompts.md` com `SendUserFile` e, na mensagem:

1. Onde subir: YouTube Studio → Personalização (foto, banner, nome, @ e descrição ficam lá).
2. A descrição e as palavras-chave em blocos de código separados, para copiar com um clique.
3. Em uma linha, que os prompts servem para gerar no Gemini uma versão ilustrada, se ele quiser.
4. O que ficou em "A definir" no perfil.
5. O próximo passo: `/recriar-video-youtube <link>` escolhendo este canal.

O perfil é um arquivo do repositório de skills: lembre o usuário de commitar `canais/<slug>.md` (ou commite você, se ele pedir), senão o outro PC não vê o canal.

## Quando algo foge do padrão

- **Referência sem banner**: muitos canais não têm. Analise a foto e as thumbs e diga isso na proposta.
- **yt-dlp falha (erro 403)**: atualize (`winget upgrade --id yt-dlp.yt-dlp`) e tente uma vez. Se continuar, use o navegador embutido e peça ao usuário prints do banner e da foto.
- **Motor não encontrado** (`gerar_identidade.mjs` usa o navegador headless e o puppeteer da skill recriar-video-tiktok): instale a recriar-video-tiktok como o README do repositório explica, ou defina `MOTOR_DIR`.
- **Nome que já existe no YouTube**: o YouTube aceita nomes repetidos, mas o @ é único. Avise se a busca mostrar um canal conhecido com o mesmo nome.
- **Mudar o banner ou a foto depois**: edite os HTML em `identidade/`, rode o script de novo e substitua os arquivos no Drive.
- **Usuário traz uma imagem do Gemini**: salve em `identidade/` e confira no recorte como em "Conferir uma imagem pronta", em `references/identidade.md`.
