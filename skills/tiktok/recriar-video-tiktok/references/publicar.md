# Card no Trello e vídeo no Drive

O usuário acompanha os canais dele num quadro do Trello e posta do iPhone. Cada vídeo é um **card** que anda pelas listas conforme o trabalho avança; no fim, o vídeo vai para o Google Drive em qualidade cheia e o card leva o link e o texto do post. A postagem é sempre do usuário: o seu trabalho termina com o card em "📱 Pronto para postar".

Use o conector do Trello (`trelloWriteCard`, `trelloSearch`) e o do Google Drive (`search_files`). Se um deles não estiver disponível na sessão, faça o vídeo assim mesmo e diga na entrega o que ficou sem atualizar.

## Endereços

Quadro "Produção de Vídeos": https://trello.com/b/0UPaoPtl

| O quê | ID |
|---|---|
| Lista ✍️ Roteiro | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af53025819102f34768b811` |
| Lista 🎬 Produção | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af5302688f9572e498c5d37` |
| Lista 🔍 Revisão | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af5302720bea21b70c66082` |
| Lista 📱 Pronto para postar | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af530283f6917fda331a3b7` |
| Etiqueta verde (Mentalidade TikTok) | `ari:cloud:trello::label/workspace/6462511340407b9d58c8bc49/6af53015ef992c6dbf8a6ac0` |
| Pasta "Mentalidade Tiktok" no Drive | `1-j-ECvUkCBguyhWX1p6x0jLoyTqgpAO6` |

As listas 💡 Ideias e ✅ Publicado são do usuário: ele põe ideias (links para recriar) numa e move para a outra o que já postou.

## O card em cada etapa

| Quando | O que fazer |
|---|---|
| Roteiro escrito (passo 3) | Procure um card com o tema ou o link do vídeo original (`trelloSearch`, `search_cards`); se o usuário já deixou o link em 💡 Ideias, use esse card. Se não houver, crie um em ✍️ Roteiro. Ponha a etiqueta verde e a descrição abaixo. |
| Começou a voz ou as cenas (passo 4) | Mova para 🎬 Produção. |
| Começou a conferir (passo 6) | Mova para 🔍 Revisão. |
| Vídeo no Drive (passo 9) | Preencha o link e o texto do post e mova para 📱 Pronto para postar. |

Atualize o campo **Status** da descrição a cada movimento, em uma frase.

## Descrição do card

```
**Canal:** Mentalidade TikTok
**Status:** <uma frase: em que pé está>

**Original:** <link do vídeo de referência>
**Roteiro (<duração> s):** <a mensagem central em uma ou duas frases> (próprio ou adaptado)

**Vídeo:** <link do Drive, ou "(link do Drive quando ficar pronto)">

---
**Texto do post (copiar no celular):**

<título e hashtags de saida/post.txt, na versão "pronto para colar">
```

## Subir no Drive

O MP4 sobe inteiro pelo **Google Drive para computador**: copie o arquivo para a pasta do canal dentro do Drive do PC, e ele sincroniza sozinho. O conector do Drive e o upload do Claude in Chrome só levam arquivos de até 10 MB, então o envio é sempre pela pasta sincronizada.

1. A letra da unidade muda de um PC para outro: num deles a pasta é `H:\My Drive\Mentalidade Tiktok` (lá a G: é um HD de fotos); no outro é `G:\Meu Drive\Mentalidade Tiktok`. Procure a unidade que tem `My Drive` ou `Meu Drive` na raiz e use essa.
2. Copie `saida/<slug>.mp4` para lá. Num pedido de ajuste, substitua o arquivo de mesmo nome: o Drive guarda como nova versão e o link continua o mesmo.
3. Pegue o link: `search_files` com `title = '<nome do arquivo>' and parentId = '<pasta do canal>'`. Repita a cada ~30 s até o arquivo aparecer com o `fileSize` igual ao do MP4 local; o link é o `viewUrl`.

Sem o Drive no PC, deixe o card em 🔍 Revisão com o caminho do MP4 na descrição e diga ao usuário para arrastar o arquivo para a pasta "Mentalidade Tiktok" do Drive (ou instalar o Google Drive para computador).
