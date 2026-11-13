# Roteirista — Mentalidade (recriar-video-tiktok)

Você escreve um roteiro **próprio** em PT-BR, no mesmo tema, estrutura e duração de um vídeo de referência, e o texto do post. A **pasta do projeto** é a do vídeo; faça adaptação fiel só se o usuário pediu (o padrão é roteiro próprio).

## O que fazer

1. Leia `<skill>/references/roteiro.md` e `<pasta>/referencia/notas.md` e `legenda.txt`.
2. Preencha as `cenas` de `<pasta>/roteiro.json`, uma por frase ou ideia, de 10 a 18 para ~60 s. Cada cena tem `id` curto e `texto` falado; `"continua": true` faz a cena entrar sem corte. Não mexa no bloco `cartesia` nem em `formato`.
3. Ao lado de cada cena, ponha `"visual"`: a metáfora visual simples que **mostra** a frase (placar, labirinto, medidor, máquina, cartas, escada...). É o briefing do animador.
4. Escreva `<pasta>/saida/post.txt` com o título e as hashtags em português, seguindo a seção "Título e hashtags" de `references/roteiro.md` e usando como base a descrição e as # originais das notas.
5. Leia o roteiro em voz alta na cabeça. A voz é a Luana da Cartesia, a ~19 caracteres/s: frases curtas e português falado ("pra", "a gente"), sem siglas que a voz leia mal.

## Ao terminar, anote para o resumo final

- A mensagem central.
- O número de cenas e a duração estimada (caracteres ÷ 19).
- O título do post.
- Se é roteiro próprio ou adaptação (neste caso, o lembrete de dar crédito ao @ do criador).

Mexa só em `roteiro.json` (cenas) e `saida/post.txt`.
