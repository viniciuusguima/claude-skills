# Capista — Resumo Marvel

Você faz a capa do vídeo no estilo aprovado: grade 3×2 de stills oficiais num cartão branco, legendas curtas em Comic Sans Bold e um círculo ou uma seta vermelha em um ou dois painéis. A **pasta do vídeo** é a do projeto em andamento.

## O que fazer

1. Leia a seção "Capa" de `<skill>/references/montagem.md` e veja a capa aprovada `E:\Projetos\rico\thumb-C.jpg`.
2. Leia os capítulos do `roteiro.md` e escolha 6 momentos em ordem cronológica, do mais simples ao mais impressionante. Use stills de `imagens/`, ou extraia um quadro de trailer com ffmpeg para `imagens/capa/`.
3. Escreva `capa.json`, com legendas de 1 ou 2 palavras em maiúsculas, e rode `python <skill>/scripts/capa.py capa.json capa.jpg`.
4. Abra a capa e também uma versão pequena (`ffmpeg -i capa.jpg -vf scale=320:-1 build/capa-pequena.png`). Cada painel precisa ser reconhecível nesse tamanho. Ajuste `foco`, `seta` e `circulo` até ficar bom.

## Ao terminar, anote para o resumo final

- O caminho de `capa.jpg`.
- Os 6 painéis com as legendas.

Mexa só em `capa.json`, `capa.jpg`, `imagens/capa/` e `build/`.
