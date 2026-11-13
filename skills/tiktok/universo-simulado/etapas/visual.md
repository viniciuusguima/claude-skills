# Visual — Universo Simulado

Você constrói as cenas 3D, a câmera, o marcador e os efeitos de um vídeo do UNIVERSO SIMULADO a partir de um roteiro pronto. A **pasta de trabalho** e o **slug** são os do vídeo. O roteiro está em `<pasta>/js/<slug>_roteiro.js`, e os comentários acima de `T` são o seu briefing.

## O que fazer

1. Leia `<skill>/SKILL.md` (passos 2 a 4), `<skill>/references/api.md` e o roteiro. Quando precisar de um efeito parecido (explosão, fogo, céu estrelado, planeta, corredor, passos, mãos), abra o arquivo `sol_*` correspondente em `<skill>/assets/projeto/js/` e adapte.
2. Se a pasta não tem `server.py` e `js/studio.js`, copie o **conteúdo** de `<skill>/assets/projeto/` para ela, sem sobrescrever nada que exista.
3. Crie `<slug>.html` (a partir de `modelo.html`: título, `max` do controle = `ROTEIRO.DUR` e os quatro scripts, com o roteiro antes do world), `js/<slug>_world.js` e `js/<slug>_main.js`. No HTML, aponte para `js/<slug>_audio.js`. Se ele ainda não existir, crie um provisório que só devolve `makeSfx(DUR).finish()`; o sonoplasta substitui depois.
4. Tudo depende só de `t`: nada de `Math.random()` nem de estado entre quadros (use `mulberry32`, `hash2` e `kf`). Título, legendas e cartão vêm de `ROTEIRO`; não copie textos para o `_main.js`.
5. Confira e ajuste, em 2 ou 3 rodadas:
   - `node <skill>/scripts/video.mjs checar <slug>` até sair sem erros;
   - `node <skill>/scripts/video.mjs folha <slug> trecho1=t,t,t,t,t,t trecho2=...`, com 8 a 10 folhas cobrindo o vídeo inteiro, incluindo os instantes logo antes e logo depois de cada corte e de cada impacto. **Abra cada imagem**;
   - procure de propósito os defeitos da lista do passo 4 do SKILL.md (clarão que apaga tudo, cena escura, objeto tapando a câmera, câmera atravessando parede, assunto fora do quadro de ~46°, mãos gigantes, texto ilegível, objeto distante minúsculo);
   - corrija e refaça só as folhas afetadas.

## Ao terminar, anote para o resumo final

- Os arquivos criados.
- A lista das folhas finais (`debug/*.png`) com os instantes de cada uma.
- O que você ainda acha fraco e não conseguiu resolver.

Nesta etapa, não mexa no `_roteiro.js`: se um tempo não funcionar na imagem, anote qual e por quê e decida depois. Também não mexa no `_audio.js` definitivo, que é da etapa seguinte. Exportar o vídeo e mexer no Trello e no Drive ficam para o passo 6.
