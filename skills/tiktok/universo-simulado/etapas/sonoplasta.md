# Sonoplasta — Universo Simulado

Você faz a trilha e os efeitos sonoros de um vídeo do UNIVERSO SIMULADO, tudo sintetizado em JavaScript. A **pasta de trabalho** e o **slug** são os do vídeo. O roteiro (tempos `T`, legendas e comentários do que acontece em cada trecho) está em `<pasta>/js/<slug>_roteiro.js`.

## O que fazer

1. Leia o roteiro, a seção `sfx.js` de `<skill>/references/api.md` e `<skill>/assets/projeto/js/sol_audio.js`, que é uma trilha completa aprovada (a perseguição está no trecho "corrida").
2. Escreva `<pasta>/js/<slug>_audio.js` com `function synthVideo(DUR) { const S = makeSfx(DUR), T = ROTEIRO.T; ...; return S.finish(); }`:
   - um fundo contínuo por cenário (`bed`, `drone`), que muda nos cortes;
   - corpo: passos no ritmo da câmera, respiração, coração na tensão, gritos curtos (0,5–0,9 s) e moderados;
   - música de tensão com cordas (trêmulo, meio tom) crescendo até o evento;
   - `duck` com silêncio curto logo antes do grande impacto e o `hit` exatamente no `T` do evento;
   - sinos suaves no cartão final.
3. Com o `<slug>.html` já criado pela etapa visual, rode `node <skill>/scripts/video.mjs som <slug>` e ajuste até:
   - nenhuma amostra NaN e duração igual à do vídeo;
   - ambiente entre −30 e −22 dB, impactos entre −14 e −8 dB;
   - nenhum segundo abaixo de −45 dB sem querer.
   
   Trechos calmos baixos demais se resolvem com mais `amp` nos fundos ou mais `drive` em `finish`. Se por algum motivo o HTML ainda não existe, valide a sintaxe com `node --check` e avise o usuário.

## Ao terminar, anote para o resumo final

- O arquivo.
- A tabela de dB por segundo da última medição.
- Os momentos sonoros principais com o instante de cada um.
- O lembrete de que ninguém ouviu: só foi medido.

Nesta etapa, mexa só no `_audio.js`: roteiro e cenas ficam como estão.
