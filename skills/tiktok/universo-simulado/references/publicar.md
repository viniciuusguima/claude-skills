# Card no Trello e vídeo no Drive

O usuário acompanha os canais dele num quadro do Trello e posta do iPhone. Cada vídeo é um **card** que anda pelas listas conforme o trabalho avança; no fim, o vídeo vai para o Google Drive em qualidade cheia e o card leva o link e o texto do post. A postagem é sempre do usuário: o seu trabalho termina com o card em "📱 Pronto para postar".

Use o conector do Trello (`trelloWriteCard`, `trelloSearch`) e o do Google Drive (`search_files`). Se um deles não estiver disponível na sessão, faça o vídeo assim mesmo e diga no resumo final o que ficou sem atualizar.

## Endereços

Quadro "Produção de Vídeos": https://trello.com/b/0UPaoPtl

| O quê | ID |
|---|---|
| Lista ✍️ Roteiro | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af53025819102f34768b811` |
| Lista 🎬 Produção | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af5302688f9572e498c5d37` |
| Lista 🔍 Revisão | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af5302720bea21b70c66082` |
| Lista 📱 Pronto para postar | `ari:cloud:trello::list/workspace/6462511340407b9d58c8bc49/6af530283f6917fda331a3b7` |
| Etiqueta roxa (Universo Simulado) | `ari:cloud:trello::label/workspace/6462511340407b9d58c8bc49/6af53015ef992c6dbf8a6ac4` |
| Pasta "Universo Simulado" no Drive | `1o1R3QufKwLBw3ZzDSvCnuKgmNGUDpMLh` |

As listas 💡 Ideias e ✅ Publicado são do usuário: ele põe ideias numa e move para a outra o que já postou.

## O card em cada etapa

| Quando | O que fazer |
|---|---|
| Roteiro decidido (passo 1) | Procure um card com o título do vídeo (`trelloSearch`, `search_cards`); se o usuário já deixou a ideia em 💡 Ideias, use esse card. Se não houver, crie um em ✍️ Roteiro. Ponha a etiqueta roxa e a descrição abaixo. |
| Começou o código (passo 3) | Mova para 🎬 Produção. |
| Começou a olhar quadros (passo 4) | Mova para 🔍 Revisão. |
| Vídeo no Drive (passo 6) | Preencha o link na descrição e mova para 📱 Pronto para postar. |

Atualize o campo **Status** da descrição a cada movimento, em uma frase.

## Descrição do card

```
**Canal:** Universo Simulado
**Status:** <uma frase: em que pé está>

**Roteiro (<duração> s):** <o vídeo em uma ou duas frases>

**Vídeo:** <link do Drive, ou "(link do Drive quando ficar pronto)">

---
**Texto do post (copiar no celular):**

<título do vídeo> <um emoji do tema> <uma frase que puxa a curiosidade, terminando em pergunta>

#universosimulado #esevoce <três hashtags do tema, sem acento>
```

## Subir no Drive

O MP4 exportado (~60 MB) sobe inteiro pelo **Google Drive para computador**: copie o arquivo para a pasta do canal dentro do Drive do PC, e ele sincroniza sozinho. O conector do Drive e o upload do Claude in Chrome só levam arquivos de até 10 MB, e comprimir o vídeo até caber nisso estraga a imagem no celular, então o envio é sempre pela pasta sincronizada.

1. A letra da unidade muda de um PC para outro: num deles a pasta é `H:\My Drive\Universo Simulado` (lá a G: é um HD de fotos); no outro é `G:\Meu Drive\Universo Simulado`. Procure a unidade que tem `My Drive` ou `Meu Drive` na raiz e use essa.
2. Copie `<slug>.mp4` para lá com o título como nome, sem `?` (o Windows não aceita): `E se você fosse enterrado vivo.mp4`. Num pedido de ajuste, substitua o arquivo de mesmo nome: o Drive guarda como nova versão e o link continua o mesmo.
3. Pegue o link: `search_files` com `title = '<nome do arquivo>' and parentId = '<pasta do canal>'`. Repita a cada ~30 s até o arquivo aparecer com o `fileSize` igual ao do MP4 local; o link é o `viewUrl`.

Sem o Drive no PC, deixe o card em 🔍 Revisão com o caminho do MP4 na descrição e diga ao usuário para arrastar o arquivo para a pasta "Universo Simulado" do Drive (ou instalar o Google Drive para computador).
