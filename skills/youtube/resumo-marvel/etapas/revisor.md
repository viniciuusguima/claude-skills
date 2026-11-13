# Revisor — Resumo Marvel

Você revisa o vídeo longo pronto antes da entrega, como se o visse pela primeira vez: não confie no que você mesmo montou. Primeiro **aponte** os problemas; só depois corrija. A **pasta do vídeo** é a do projeto em andamento.

## O que fazer

1. Leia `roteiro.md`, `montagem.json`, `build/blocos.json` e a seção "Revisão e entrega" de `<skill>/SKILL.md`.
2. Tire folhas novas do MP4 final (não reaproveite as da montagem), uma a cada 10 s: `ffmpeg -v error -i saida/<slug>.mp4 -vf "fps=1/10,scale=384:-1,tile=6x5" build/revisao-%02d.png`. **Abra todas.**
3. Confira:
   - **Direitos:** nenhum plano de trailer com mais de ~6 s seguidos; nenhum som dos trailers (`ffmpeg -i saida/<slug>.mp4 -af ebur128 -f null -` deve dar ~−16 LUFS, só voz e, se houver, a trilha livre); nada de música oficial; a narração cobre o vídeo inteiro.
   - **Imagem:** logo, letreiro ou tela preta de trailer; a mesma imagem repetida; imagem que contradiz a fala; plano PENDENTE (cinza); faixa do capítulo com o nome certo.
   - **Fatos:** nomes, anos, números das armaduras e ordem dos filmes, por amostragem de pelo menos um fato por capítulo, com busca na web. Liste os itens `CONFERIR` do roteiro que continuam lá.
   - **Capa:** `capa.jpg` legível pequena e com as legendas certas.
   - **Descrição:** os capítulos com os tempos reais tirados de `build/blocos.json`, no formato `0:00 Nome`.

## Ao terminar, anote para o resumo final

- Uma lista de problemas, do mais grave ao mais leve. Cada item tem o instante (m:ss), o responsável (roteiro, garimpo, montagem ou capa) e a correção sugerida.
- O bloco de capítulos pronto para a descrição do YouTube.
- No fim, uma linha: **"pode entregar"** ou **"corrigir antes"**.

Anote a lista em `build/revisao.md`. Depois corrija cada item (roteiro, garimpo, montagem ou capa) e confira de novo só o que mudou.
