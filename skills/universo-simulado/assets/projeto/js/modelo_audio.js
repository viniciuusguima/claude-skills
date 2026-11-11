'use strict';
// MODELO: copie para js/<slug>_audio.js. Trilha inteira sintetizada com a caixa de sons (js/sfx.js).
function synthVideo(DUR) {
  const S = makeSfx(DUR), T = VID.T;
  S.bed(t => kf(t, [[0, 0.6], [T.event, 0.6], [T.event + 0.3, 0.2], [DUR, 0]]), 700, 0.5, 0.5);            // vento
  for (let n = 0; ; n++) { const t = T.walk + 0.2 + n * 0.5; if (t > T.event) break; S.step(t, 0.4, n % 2 ? -0.2 : 0.2, 'sand'); } // passos
  S.duck(T.event - 0.3, T.event);                                                                          // silencio antes do impacto
  S.hit(T.event, 1.3, 55); S.rumble(T.event + 0.1, 2.5, 0.6); S.scream(T.event + 0.4, 0.7, 0.6, 360, 520);  // o evento
  for (const [m, p] of [[57, -0.3], [58, 0.3]]) S.strNote(T.event + 0.2, 2.2, S.mf(m), 0.07, p, { att: 0.3, rel: 0.3, trem: 8 }); // cordas tensas
  [[T.card + 0.5, 69], [T.card + 1.5, 72], [T.card + 2.5, 76]].forEach(([t, m], i) => S.bell(t, S.mf(m), 0.1, i - 1)); // sinos do cartao final
  return S.finish();
}
