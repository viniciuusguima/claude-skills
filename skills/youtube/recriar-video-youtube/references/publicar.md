# Card no Trello e arquivos no Drive

O usuário acompanha os canais dele num quadro do Trello. Cada vídeo é um **card** que anda pelas listas conforme o trabalho avança; no fim, o vídeo e as thumbnails vão para o Google Drive e o card leva os links e o texto do post. A postagem é sempre do usuário: o seu trabalho termina com o card em "📱 Pronto para postar".

Use o conector do Trello (`trelloWriteCard`, `trelloSearch`) e o do Google Drive (`search_files`). Se um deles não estiver disponível na sessão, faça o vídeo assim mesmo e diga na entrega o que ficou sem atualizar.

## Endereços

Quadro "Produção de Vídeos": https://trello.com/b/0UPaoPtl

| O quê | ID |
|---|---|
| Lista ✍️ Roteiro | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af53025819102f34768b811` |
| Lista 🎬 Produção | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af5302688f9572e498c5d37` |
| Lista 🔍 Revisão | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af5302720bea21b70c66082` |
| Lista 📱 Pronto para postar | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af530283f6917fda331a3b7` |

A etiqueta e a pasta do Drive de cada canal ficam no perfil dele ("Trello e Drive").

Cores já em uso no quadro: azul é Bitácora de Vuelo, verde é Mentalidade TikTok, roxa é Universo Simulado, e a vermelha está em uso. Um canal novo precisa de uma cor livre; quando a etiqueta dele for criada, acrescente-a nesta lista.

O conector do Trello põe e tira etiquetas de cards (`attach_label`), mas não cria nem renomeia etiquetas. Se o usuário quiser outra cor, ele cria a etiqueta no quadro, e você pega o ID novo com `trelloReadBoard` (`list_labels`) e troca no perfil do canal.

As listas 💡 Ideias e ✅ Publicado são do usuário: ele põe ideias (links para recriar) numa e move para a outra o que já postou.

## O card em cada etapa

| Quando | O que fazer |
|---|---|
| Roteiro aprovado (passo 2) | Procure um card com o tema ou o link do vídeo original (`trelloSearch`, `search_cards`); se o usuário já deixou o link em 💡 Ideias, use esse card. Se não houver, crie um em ✍️ Roteiro. Ponha a etiqueta do canal e a descrição abaixo. |
| Começou a voz (passo 3) | Mova para 🎬 Produção. |
| Começou a conferir o conjunto (passo 5) | Mova para 🔍 Revisão. |
| Arquivos no Drive (passo 8) | Preencha os links e o texto do post e mova para 📱 Pronto para postar. |

Atualize o campo **Status** da descrição a cada movimento, em uma frase.

## Descrição do card

```
**Canal:** <nome do canal>
**Língua:** <a língua do projeto>
**Status:** <uma frase: em que pé está>

**Original:** <link do vídeo de referência>
**Roteiro (<duração> min):** <a mensagem central em uma ou duas frases, em português> (próprio ou adaptado)

**Vídeo:** <link do Drive, ou "(link do Drive quando ficar pronto)">
**Prompts da thumb (Gemini):** <link do Drive>  (recomendada: <A ou B>)
**Thumbnail A:** <link do Drive, ou "(a gerar no Gemini)">
**Thumbnail B:** <link do Drive, ou "(a gerar no Gemini)">

---
**Texto do post (copiar no YouTube):**

<o conteúdo de saida/post.txt: título, descrição com capítulos, tags>
```

## Subir no Drive

O MP4 sobe inteiro pelo **Google Drive para computador**: copie os arquivos para a pasta do canal dentro do Drive do PC, e eles sincronizam sozinhos. O conector do Drive só leva arquivos de até 10 MB, então o envio é sempre pela pasta sincronizada.

1. A letra da unidade muda de um PC para outro: num deles a pasta é `H:\My Drive\<Nome do canal>` (lá a G: é um HD de fotos); no outro é `G:\Meu Drive\<Nome do canal>`. Procure a unidade que tem `My Drive` ou `Meu Drive` na raiz e use essa. **No primeiro vídeo a pasta ainda não existe**: crie-a ali, espere sincronizar, pegue o ID com `search_files` (`title = '<Nome do canal>'`) e grave-o no perfil do canal. Se a pasta `identidade/` do canal tiver `banner.png` e `avatar.png`, copie-os para lá também.
2. Copie `saida/<slug>.mp4`, `saida/thumb_prompts.md` e, se o usuário já gerou, `saida/thumb_a.png` e `saida/thumb_b.png` para lá, com o slug no nome dos arquivos da thumb (`<slug>_thumb_prompts.md`, `<slug>_thumb_a.png`) para não sobrescrever os de outro vídeo. Os prompts no Drive deixam o usuário gerar as thumbs no Gemini pelo celular. Num pedido de ajuste, substitua o arquivo de mesmo nome: o Drive guarda como nova versão e o link continua o mesmo.
3. Pegue os links: `search_files` com `title = '<nome do arquivo>' and parentId = '<pasta do canal>'`. Repita a cada ~30 s até o arquivo aparecer com o `fileSize` igual ao do arquivo local; o link é o `viewUrl`.

Sem o Drive no PC, deixe o card em 🔍 Revisão com o caminho dos arquivos na descrição e diga ao usuário para arrastá-los para a pasta do canal no Drive.
