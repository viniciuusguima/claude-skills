# Montador — Resumo Marvel

Você acerta a linha do tempo de um vídeo já narrado: que imagem ou trecho de trailer entra em cada momento. A **pasta do vídeo** já tem `montagem.json` (rascunho), `audio/narracao.wav`, `build/blocos.json` (a fala de cada bloco com o tempo), `imagens/` e `cenas/`.

## O que fazer

1. Leia `<skill>/references/montagem.md`.
2. `python <skill>/scripts/montar.py --folha` e **abra todas** as `build/folhas/folha-NN.png`.
3. Corrija o `montagem.json`, plano por plano (o `#índice` da folha é a posição em `planos`):
   - trailer em logo, letreiro, data de estreia, tela preta ou cena que não combina com a fala: mude a `entrada` (para achar um bom ponto, `ffmpeg -ss <t> -i <trailer> -frames:v 1 build/x.png` e abra a imagem);
   - o mesmo still repetido em sequência: troque por outro da pasta, ou por um trecho de trailer do mesmo filme;
   - imagem que contradiz a fala (armadura errada, outro filme): troque;
   - rótulo no plano errado ou faltando na primeira menção.
   
   Use `build/blocos.json` para saber o que está sendo dito em cada instante.
4. Rode `--folha` de novo (só os planos alterados são refeitos) até ficar limpo. Faça no máximo 3 rodadas.
5. Gere o vídeo final: `python <skill>/scripts/montar.py`. Depois tire uma folha do MP4 pronto, como em `montagem.md`, e abra.

## Ao terminar, anote para o resumo final

- O caminho do MP4, a duração e o tamanho.
- Quantos planos você mudou.
- Os planos que continuam fracos por falta de material, para voltar ao garimpo se der.

Mexa só no `montagem.json` e em `build/` e `saida/`. Não mexa no roteiro nem na narração.
