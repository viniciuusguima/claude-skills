# Montagem

## montagem.json

`narrar.py` (ou `alinhar.py`) escreve um rascunho. Depois disso, ele é o arquivo de trabalho: edite à mão e rode `montar.py` de novo.

```json
{
 "audio": "audio/narracao.wav",
 "saida": "saida/<slug>.mp4",
 "musica": null,
 "volume_musica": 0.08,
 "planos": [
  {"inicio": 0.0, "fim": 2.2, "capitulo": "A CAVERNA", "cartao": "imagens/15-tony-stark/15-tony-stark-1.png"},
  {"inicio": 2.2, "fim": 7.0, "capitulo": "A CAVERNA", "img": "imagens/15-tony-stark/15-tony-stark-1.png"},
  {"inicio": 50.0, "fim": 55.0, "capitulo": "A CAVERNA", "cena": "cenas/01 - Homem de Ferro (2008) - Trailer.mp4", "entrada": 14.61},
  {"inicio": 69.7, "fim": 74.0, "capitulo": "A CAVERNA", "img": "imagens/01-mark-1/01-mark-1-2.jpg", "rotulo": "MARK 1"},
  {"inicio": 80.0, "fim": 84.0, "capitulo": "A CAVERNA", "pendente": "CENA: a fuga da caverna"}
 ]
}
```

- Tempos em segundos da narração. O `fim` de cada plano é ajustado para o `inicio` do próximo, então para mudar um corte basta mexer no `inicio`.
- `cartao`: tela branca com a imagem emoldurada e o nome do capítulo (abre cada capítulo; `null` = só o título).
- `img`: still com zoom lento, que alterna entre aproximar e afastar de um plano para o outro.
- `cena` + `entrada`: trecho do trailer a partir de `entrada` segundos, sem o som. O rascunho escolhe entradas logo depois dos cortes do trailer, pulando os 8% iniciais (logos) e os 10% finais (letreiro e data). **Confira na folha**: trailer tem letreiros e telas pretas no meio.
- `rotulo`: quadro branco embaixo à esquerda com um nome curto ("MARK 1").
- `nota`: texto livre, ignorado na montagem.
- `musica`: caminho de uma trilha **livre** (Biblioteca de Áudio do YouTube), tocada em loop e baixinha. Nunca a trilha do filme.

## Conferir

1. `montar.py --folha` e abra cada `build/folhas/folha-NN.png`. Cada célula mostra `#índice início-fim` e o quadro do meio do plano.
2. Corrija no `montagem.json` (o índice da folha é a posição em `planos`) e rode de novo: só os planos alterados são refeitos.
3. Para ver o movimento ou o som de um trecho, use `--de/--ate` e veja `build/trecho.mp4`.
4. Depois do vídeo final, uma última folha do arquivo pronto: `ffmpeg -v error -i saida/<slug>.mp4 -vf "fps=1/30,scale=384:-1,tile=6x4" -frames:v 1 build/final.png`.

Defeitos para procurar: plano de trailer com logo, letreiro, data de estreia ou tela preta; o mesmo still várias vezes seguidas (falta imagem naquela pasta: garimpe mais); imagem de outra armadura ou de outro filme no lugar errado; o cartão de capítulo com uma imagem fraca.

## Capa (capa.json)

```json
{"paineis": [
  {"img": "imagens/01-mark-1/01-mark-1-4.png", "legenda": "A SUCATA"},
  {"img": "imagens/04-mark-5/04-mark-5-3.jpg", "legenda": "A MALETA", "seta": [0.4, 0.6]},
  {"img": "...", "legenda": "NANOTECH", "circulo": [0.35, 0.45, 0.18]},
  {"img": "...", "legenda": "...", "foco": [0.5, 0.3]}
]}
```

Seis painéis em ordem cronológica, do mais simples ao mais impressionante. `seta` é a ponta da seta e `circulo` é centro x, y e raio, tudo em fração da imagem; `angulo` (graus) muda de onde a seta vem. `foco` escolhe o ponto do recorte. Capas com título grande por cima foram recusadas pelo usuário: o estilo aprovado é só a grade.
