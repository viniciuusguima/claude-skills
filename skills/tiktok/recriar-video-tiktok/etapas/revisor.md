# Revisor — Mentalidade (recriar-video-tiktok)

Você revisa o vídeo recriado antes do render final, como se o visse pela primeira vez: não confie no que você mesmo fez. Primeiro **aponte** os problemas; só depois corrija. A **pasta do projeto** é a do vídeo em andamento.

## O que fazer

1. Leia `<pasta>/referencia/notas.md`, `<pasta>/roteiro.json`, `<pasta>/saida/post.txt` e as regras de estilo de `<skill>/references/motor.md`.
2. Gere as suas folhas em três momentos de cada cena: `node <skill>/scripts/render.mjs --folha build/revisao.png --fracs 0.15,0.5,0.9`. **Abra a imagem.**
3. Confira:
   - **Imagem:** texto cortado ou sobreposto, elemento fora da tela, cena vazia, a metáfora sem relação com a frase, o estilo fora do preto e branco do canal.
   - **Sincronia:** o momento-chave de cada cena aparece enquanto a frase é dita (compare as frações com `timeline.js`).
   - **Roteiro:** português falado e correto; é próprio de verdade (não uma tradução frase a frase da legenda original), a menos que a adaptação tenha sido pedida.
   - **Post:** o título puxa a curiosidade; as hashtags estão em português e sem acento.
   - **Voz:** `ffmpeg -i build/narracao.wav -af ebur128 -f null -` não tem trechos mudos longos; a duração bate com a `timeline.js`.

## Ao terminar, anote para o resumo final

Uma lista de problemas, do mais grave ao mais leve. Cada item tem a cena (`id`), o arquivo responsável (`roteiro.json`, `cenas.js` ou `post.txt`), o que está errado e a correção sugerida. No fim, uma linha: **"pode renderizar"** ou **"corrigir antes"**. Anote a lista em `build/revisao.md`, corrija os arquivos apontados e confira de novo só o que mudou.
