'use strict';
// Trilha de "E se o Sol explodisse?": explosao, praia, relogio, clarao, fogo, passos, abrigo, espaco e frio.
function synthSol(DUR) {
  const sr = 48000, N = Math.ceil(DUR * sr), L = new Float32Array(N), R = new Float32Array(N), T = SOL.T;
  const rnd = mulberry32(2024), white = () => rnd() * 2 - 1, TAU = Math.PI * 2;
  const saw = x => 2 * (x - Math.floor(x + 0.5)), mf = m => 440 * Math.pow(2, (m - 69) / 12);
  function BQ(type, f, q) {
    let b0, b1, b2, a1, a2, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    const o = {
      set(f, q) {
        const w = TAU * Math.min(f, sr * 0.45) / sr, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q), a0 = 1 + al;
        if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; } else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; } else { b0 = al; b1 = 0; b2 = -al; }
        a1 = -2 * c / a0; a2 = (1 - al) / a0; b0 /= a0; b1 /= a0; b2 /= a0;
      },
      run(x) { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; },
    };
    o.set(f, q); return o;
  }
  function add(t0, len, fn, pan = 0) {
    const s0 = Math.round(t0 * sr), n = Math.round(len * sr), a = (pan + 1) * Math.PI / 4, gl = Math.cos(a) * 1.25, gr = Math.sin(a) * 1.25;
    for (let i = 0; i < n; i++) { const k = s0 + i; if (k < 0) continue; if (k >= N) break; const v = fn(i / sr, i); L[k] += v * gl; R[k] += v * gr; }
  }
  function thud(t0, amp, f = 70, decay = 10, pan = 0) { let ph = 0; add(t0, Math.min(4, 6 / decay), t => { ph += f * (1 + 1.6 * Math.exp(-t * 35)) / sr; return amp * Math.sin(TAU * ph) * Math.exp(-t * decay) * Math.min(1, t / 0.004); }, pan); }
  function crack(t0, amp, pan = 0) { for (let k = 0; k < 5; k++) { const hp = BQ('hp', 1400, 0.8), g = amp * (0.5 + rnd() * 0.5); add(t0 + k * 0.03 + rnd() * 0.02, 0.09, t => hp.run(white()) * Math.exp(-t * 65) * g, pan + (rnd() - 0.5) * 0.5); } thud(t0, amp * 0.8, 150, 22, pan); }
  function whoosh(t0, dur, amp, f0, f1) { const bp = BQ('bp', f0, 0.8); add(t0, dur, (t, i) => { if (i % 64 === 0) bp.set(f0 + (f1 - f0) * (t / dur), 0.8); return bp.run(white()) * amp * 2.2 * Math.sin(Math.PI * Math.min(1, t / dur)); }); }
  function rumble(t0, dur, amp) { const lp = BQ('lp', 160, 0.7), lp2 = BQ('lp', 80, 0.7); add(t0, dur, t => { const w = white(); return amp * (lp.run(w) * 5 + lp2.run(w) * 6) * Math.min(1, t / 0.05) * Math.exp(-t * 3.2 / dur) * (0.65 + 0.35 * Math.sin(t * 15 + Math.sin(t * 4) * 3)); }); }
  function heart(t0, amp) { thud(t0, amp, 82, 17); thud(t0 + 0.17, amp * 0.7, 68, 19); }
  function breath(t0, dur, amp, inhale) { const b1 = BQ('bp', inhale ? 1500 : 1000, 1.2), b2 = BQ('bp', inhale ? 3200 : 2400, 1.5); add(t0, dur, t => { const w = white(), env = Math.pow(Math.sin(Math.PI * Math.min(1, t / dur)), 1.5); return amp * env * (b1.run(w) * 1.6 + b2.run(w) * 0.9); }); }
  function scream(t0, dur, amp, f0, f1, fEnd = 0.88, pan = 0) {
    let ph = 0, jit = 0; const F = [[900, 3.5, 1.0], [1550, 4.5, 1.0], [2800, 5, 0.9], [3700, 6, 0.5]].map(([f, q, g]) => ({ b: BQ('bp', f, q), g }));
    add(t0, dur + 0.12, t => {
      jit += (white() - jit) * 0.01; const u = Math.min(1, t / dur);
      const fc = (f0 + (f1 - f0) * Math.min(1, t / 0.12)) * (1 + (fEnd - 1) * Math.max(0, u - 0.4) / 0.6) * (1 + 0.02 * Math.sin(TAU * 6.5 * t) + jit * 0.25);
      ph += fc / sr; const x = ph % 1; let src = (x < 0.45 ? Math.sin(Math.PI * x / 0.45) : 0) * 2 - 0.6; src *= 1 + 0.35 * Math.sin(Math.PI * ph); src += white() * 0.35;
      let y = src * 0.12; for (const k of F) y += k.b.run(src) * k.g;
      return Math.tanh(y * 3.0) * amp * 0.6 * Math.min(1, t / 0.035) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.1)) * (0.85 + 0.15 * Math.sin(TAU * 11 * t));
    }, pan);
  }
  function step(t0, amp, pan, kind) { // kind: 'sand' | 'stone' | 'frost'
    const lp = BQ('lp', kind === 'stone' ? 500 : 280, 0.8), bp = BQ('bp', kind === 'stone' ? 2600 : kind === 'frost' ? 4200 : 1500, kind === 'frost' ? 0.9 : 0.6);
    const dec = kind === 'frost' ? 14 : kind === 'stone' ? 45 : 22;
    add(t0, 0.3, t => { const w = white(); return amp * (lp.run(w) * 2.6 * Math.exp(-t * 34) + bp.run(w) * (kind === 'stone' ? 0.9 : 1.5) * Math.exp(-t * dec) * Math.min(1, t / 0.004)); }, pan);
    thud(t0, amp * (kind === 'stone' ? 0.5 : 0.7), kind === 'stone' ? 170 : 110, 28, pan);
    if (kind === 'stone') add(t0 + 0.09, 0.25, t => bp.run(white()) * amp * 0.25 * Math.exp(-t * 12), -pan); // eco
  }
  function strNote(t0, dur, f, amp, pan = 0, o = {}) {
    const lp = BQ('lp', o.cut || 2400, 0.7), att = o.att || 0.012, rel = o.rel || 0.07, trem = o.trem || 0, gl = o.glide || 1; let p1 = rnd(), p2 = rnd(), p3 = rnd();
    add(t0, dur + rel, t => { const ff = f * (1 + (gl - 1) * Math.min(1, t / dur)); p1 += ff / sr; p2 += ff * 1.006 / sr; p3 += ff * 0.994 / sr;
      return lp.run(saw(p1) + saw(p2) + saw(p3)) * 0.46 * amp * Math.min(1, t / att) * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / rel)) * (trem ? 0.62 + 0.38 * Math.sin(TAU * trem * t) : 1); }, pan);
  }
  function bassNote(t0, dur, f, amp) { const lp = BQ('lp', 440, 1.0); let p = 0; add(t0, dur, t => { p += f / sr; return amp * Math.min(1, t / 0.008) * Math.exp(-t * 3.2 / dur) * (lp.run(saw(p) * 0.9 + saw(p * 2) * 0.4 + saw(p * 3) * 0.2) + 0.6 * Math.sin(TAU * p)); }); }
  function drum(t0, amp, pan = 0) { thud(t0, amp, 92, 11, pan); const lp = BQ('lp', 1100, 0.7); add(t0, 0.12, t => lp.run(white()) * amp * 0.9 * Math.exp(-t * 38), pan); }
  function hit(t0, amp, root = 55) {
    const lp = BQ('lp', 3000, 0.9), fs = [root, root * 2, root * 3, root * 4, root * 4 * 1.06], ph = fs.map(() => rnd());
    add(t0, 3.6, (t, i) => { if (i % 64 === 0) lp.set(250 + 3200 * Math.exp(-t * 2.0), 0.9); let s = 0; for (let k = 0; k < fs.length; k++) { ph[k] += fs[k] / sr; s += saw(ph[k]); } return lp.run(s) * 0.22 * amp * Math.min(1, t / 0.01) * Math.exp(-t * 1.0); });
    drum(t0, amp * 1.1); const hp = BQ('hp', 3000, 0.7); add(t0, 1.6, t => hp.run(white()) * 0.25 * amp * Math.exp(-t * 2.8));
  }
  function bell(t0, f, amp, pan = 0) { add(t0, 3.2, t => amp * Math.min(1, t / 0.004) * (Math.sin(TAU * f * t) * Math.exp(-t * 1.5) + 0.4 * Math.sin(TAU * f * 2 * t) * Math.exp(-t * 2.4) + 0.2 * Math.sin(TAU * f * 3.01 * t) * Math.exp(-t * 4)), pan); }
  function tick(t0, amp) { add(t0, 0.05, t => (Math.sin(TAU * 2100 * t) * 0.6 + Math.sin(TAU * 3400 * t) * 0.4) * Math.exp(-t * 120) * amp); add(t0 + 0.001, 0.03, t => white() * 0.3 * amp * Math.exp(-t * 260)); }
  function gull(t0, amp, pan) { for (let k = 0; k < 3; k++) { let ph = 0; add(t0 + k * 0.33, 0.26, t => { ph += (2500 - 900 * t / 0.26 + 120 * Math.sin(TAU * 28 * t)) / sr; return Math.sin(TAU * ph) * Math.sin(Math.PI * t / 0.26) * amp * (1 - k * 0.2); }, pan); } }

  const A1 = mf(33), PAT = [0, 0, 3, 0, 7, 0, 3, 2];
  // ---------- 0-4.6: o Sol explode
  strNote(0.1, 1.9, mf(45), 0.09, -0.2, { att: 0.5, rel: 0.05, trem: 6, glide: 0.92 }); strNote(0.1, 1.9, mf(46), 0.08, 0.2, { att: 0.5, rel: 0.05, trem: 7, glide: 0.92 });
  whoosh(0.9, 1.1, 0.5, 2500, 300);
  hit(T.boom, 1.3, 41); thud(T.boom, 1.6, 38, 1.4); crack(T.boom, 1.0); whoosh(T.boom, 2.6, 0.9, 200, 4200); rumble(T.boom + 0.1, 3.6, 0.8);
  // ---------- 4.6-17: praia calma + contagem
  [[5.6, -0.5], [9.4, 0.4], [12.6, -0.2]].forEach(([t, p]) => gull(t, 0.035, p));
  [[5.0, 69], [5.8, 73], [6.6, 76], [7.6, 81], [8.6, 76], [9.6, 73], [10.6, 69], [11.6, 64]].forEach(([t, m], i) => bell(t, mf(m), 0.07 * (1 - i * 0.07), i % 2 ? 0.3 : -0.3));
  for (let t = 5.2, i = 0; t < 14.0; i++) { const u = (t - 5.2) / 8.8; tick(t, 0.12 + 0.2 * u); t += lerp(0.85, 0.11, Math.pow(u, 0.7)); }
  for (const t of [14.0, 15.0, 16.0]) { tick(t, 0.5); heart(t + 0.35, 0.5); }
  strNote(12.0, 4.9, mf(81), 0.035, 0, { att: 2.5, rel: 0.03, trem: 0, cut: 5000, glide: 1.0 });
  // ---------- 17: o clarao
  hit(T.flash, 1.4, 55); thud(T.flash, 1.3, 45, 2.2); whoosh(T.flash, 1.6, 0.9, 400, 5000); rumble(T.flash + 0.2, 5, 0.5);
  add(T.flash, 4.5, t => Math.sin(TAU * 6200 * t) * 0.045 * Math.exp(-t * 0.9));
  scream(17.55, 0.9, 0.7, 360, 540); scream(20.7, 0.55, 0.5, 340, 470);
  for (const [m, p] of [[57, -0.3], [58, 0.3], [64, 0]]) strNote(17.6, 6.4, mf(m), 0.07, p, { att: 0.4, rel: 0.2, trem: 8 + p });
  for (let t = 18.0; t < 24.0; t += 0.5) { bassNote(t, 0.45, A1 * 2, 0.4); }
  for (let t = 19.6; t < 31; t += 0.05 + rnd() * 0.16) { const hp = BQ('hp', 2200, 0.8), g = (0.06 + rnd() * 0.1) * sstep(19.5, 23, t); add(t, 0.04, tt => hp.run(white()) * Math.exp(-tt * 130) * g, rnd() * 1.6 - 0.8); }
  // ---------- 24.2-31: corrida para o abrigo
  for (let n = 0; ; n++) { const t = 25.0 + n / 3.0; if (t > 30.9) break; step(t, 0.55, n % 2 ? -0.25 : 0.25, 'sand'); }
  for (let t = 24.6; t < 30.8; t += 0.67) { breath(t, 0.25, 0.16, true); breath(t + 0.3, 0.3, 0.13, false); }
  for (let i = 0, t = 24.4; t < 30.9; i++, t += 0.2) {
    const k = i % 8; strNote(t, 0.11, mf(57 + PAT[k]), 0.2, k % 2 ? 0.25 : -0.25); bassNote(t, 0.19, A1 * 2, 0.48);
    if (k % 2 === 0) drum(t, 0.5); if (k === 7) drum(t + 0.1, 0.35);
  }
  // ---------- 31-36.6: abrigo
  for (let n = 0; n < 6; n++) step(31.15 + n * 0.36, 0.5, n % 2 ? -0.2 : 0.2, 'stone');
  for (let t = 33.6; t < 36.4; t += 1.1) { breath(t, 0.4, 0.2, true); breath(t + 0.5, 0.5, 0.15, false); }
  rumble(31.2, 5.2, 0.55); rumble(34.0, 2.6, 0.5); crack(35.25, 0.35); thud(33.0, 0.5, 60, 5);
  { let t = 31.2; while (t < 36.4) { heart(t, 0.36); t += 60 / 150; } }
  for (const [m, p] of [[45, -0.3], [52, 0.3]]) strNote(31.4, 5.0, mf(m), 0.06, p, { att: 0.6, rel: 0.3, trem: 5, cut: 1200 });
  // ---------- 36.6-41: lado da noite, a Lua acende
  for (const [m, p] of [[45, -0.3], [57, 0.3], [64, 0]]) strNote(36.7, 4.2, mf(m), 0.05, p, { att: 1.0, rel: 0.4, cut: 1600, trem: 3 });
  hit(T.moon, 0.6, 110); [[T.moon, 88], [T.moon + 0.12, 93], [T.moon + 0.24, 100]].forEach(([t, m], i) => bell(t, mf(m), 0.1, i - 1));
  // ---------- 41-47.4: onda de plasma
  whoosh(41.2, 2.5, 0.5, 300, 4200); for (let t = 41.2; t < 43.5; t += 0.28) bassNote(t, 0.26, A1 * 2, 0.4 + (t - 41.2) * 0.1);
  hit(T.hit, 1.4, 41); thud(T.hit, 1.5, 40, 1.6); rumble(T.hit, 4.0, 0.8); whoosh(T.hit, 3.4, 0.8, 3500, 250);
  for (const [m, p] of [[57, -0.3], [58, 0.3], [63, 0]]) strNote(T.hit + 0.2, 3.4, mf(m), 0.07, p, { att: 0.2, rel: 0.4, trem: 9 + p });
  // ---------- 47.4-53.6: a Terra a deriva
  for (const [m, p] of [[45, -0.4], [52, 0.4], [60, 0], [64, 0.2]]) strNote(47.5, 6.0, mf(m), 0.055, p, { att: 1.5, rel: 0.6, cut: 1500, trem: 2.5 + p });
  for (let t = 48.0; t < 53.4; t += 1.35) bassNote(t, 1.2, A1 * 2, 0.4);
  [[48.4, 76], [50.0, 72], [51.6, 69]].forEach(([t, m], i) => bell(t, mf(m), 0.07, i % 2 ? 0.3 : -0.3));
  // ---------- 53.6-56.2: subindo a escada
  for (let n = 0; n < 5; n++) step(53.9 + n * 0.5, 0.42, n % 2 ? -0.2 : 0.2, 'stone');
  breath(54.0, 0.6, 0.18, true); breath(54.8, 0.7, 0.14, false);
  // ---------- 56.2-65.2: mundo congelado
  for (let n = 0; n < 5; n++) step(56.5 + n * 0.72, 0.4, n % 2 ? -0.2 : 0.2, 'frost');
  for (let t = 57.2; t < 68.6; t += 2.4) { breath(t, 0.8, 0.17, true); breath(t + 0.95, 1.0, 0.13, false); }
  [58.3, 61.4, 63.8, 66.9].forEach((t, i) => crack(t, 0.22, i % 2 ? 0.6 : -0.6));
  { let t = 56.6; while (t < 65) { heart(t, 0.26); t += 60 / 66; } }
  for (const [m, p] of [[45, -0.3], [52, 0.3], [60, 0]]) strNote(56.6, 12.6, mf(m), 0.05, p, { att: 2.0, rel: 0.8, cut: 1300, trem: 3 + p });
  [[57.2, 72], [59.0, 69], [60.8, 64], [62.6, 60], [65.8, 69], [67.0, 72], [68.2, 76]].forEach(([t, m], i) => bell(t, mf(m), 0.1, i % 2 ? 0.3 : -0.3));

  // ---------- camas continuas
  const wv = BQ('bp', 700, 0.5), wv2 = BQ('bp', 900, 0.5), fr = BQ('bp', 900, 0.4), fr2 = BQ('bp', 1200, 0.4), muf = BQ('lp', 6000, 0.7), muf2 = BQ('lp', 6000, 0.7), cw = BQ('bp', 500, 4), cw2 = BQ('bp', 640, 4), sub = BQ('lp', 120, 0.7);
  let wave = 0, fire = 0, cold = 0, slow = 0, spc = 0, buzz = 0;
  for (let i = 0; i < N; i++) {
    const t = i / sr;
    if (i % 128 === 0) {
      wave = kf(t, [[4.6, 0], [5.0, 1], [13.5, 1], [14.0, 0.25], [16.9, 0.2], [T.flash, 0], [17.4, 0.5], [T.shelter, 0.4], [T.shelter + 0.3, 0]]);
      fire = kf(t, [[T.flash, 0], [17.5, 0.35], [21, 0.7], [T.shelter, 1.0], [T.shelter + 0.5, 0.75], [T.space2 - 0.05, 0.75], [T.space2, 0]]);
      cold = kf(t, [[T.after - 0.2, 0], [T.after + 0.6, 1], [DUR - 0.5, 0.8], [DUR, 0]]);
      spc = kf(t, [[0, 0.5], [T.boom, 0.9], [T.beach - 0.05, 0.6], [T.beach, 0], [T.space2, 0], [T.space2 + 0.4, 0.6], [T.back - 0.1, 0.6], [T.back, 0.2], [T.after, 0]]);
      buzz = t > T.shelter && t < T.shelter + 4.2 ? 1 : 0;
      const cut = kf(t, [[T.shelter - 0.1, 6000], [T.shelter + 0.6, 480], [T.space2, 480]]);
      muf.set(cut, 0.7); muf2.set(cut, 0.7);
      slow += (white() - slow) * 0.06; cw.set(430 + 260 * slow + 90 * Math.sin(t * 0.7), 4); cw2.set(600 - 240 * slow + 110 * Math.sin(t * 0.5 + 1), 4);
    }
    const w1 = white(), w2 = white();
    const sw = 0.5 + 0.5 * Math.sin(TAU * 0.17 * t - 1), sw2 = 0.5 + 0.5 * Math.sin(TAU * 0.13 * t + 1);
    let l = wv.run(w1) * 0.5 * wave * (0.25 + sw * sw), r = wv2.run(w2) * 0.5 * wave * (0.25 + sw2 * sw2);
    if (fire > 0) { const f = 1 + 0.3 * Math.sin(TAU * 9 * t + 3 * Math.sin(t * 2.3)); l += muf.run(fr.run(w1) * 1.3 * f) * 0.5 * fire; r += muf2.run(fr2.run(w2) * 1.3 * (2 - f)) * 0.5 * fire; }
    if (cold > 0) { l += cw.run(w1) * 0.5 * cold * (0.6 + 0.4 * Math.sin(t * 0.9)); r += cw2.run(w2) * 0.5 * cold * (0.6 + 0.4 * Math.sin(t * 0.7 + 2)); }
    if (spc > 0) { const d = (sub.run(w1) * 3 + Math.sin(TAU * 41 * t) * 0.5 + Math.sin(TAU * 61.5 * t) * 0.25) * 0.22 * spc; l += d; r += d; }
    if (buzz) { const b = (saw(100 * t) * 0.012 + Math.sin(TAU * 200 * t) * 0.01) * (Math.sin(t * 47) > -0.2 ? 1 : 0.2); l += b; r += b; }
    L[i] += l; R[i] += r;
  }
  // silencio antes do clarao
  for (let i = Math.floor(16.75 * sr); i < Math.floor(T.flash * sr); i++) { const k = 1 - sstep(16.75, 16.95, i / sr); L[i] *= k; R[i] *= k; }
  let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = 3.0 / (peak || 1), k = 0.92 / Math.tanh(3.0);
  for (let i = 0; i < N; i++) { const f = Math.min(1, i / (0.05 * sr)) * Math.min(1, (N - i) / (0.5 * sr)); L[i] = Math.tanh(L[i] * g) * k * f; R[i] = Math.tanh(R[i] * g) * k * f; }
  return { sr, N, L, R, peak };
}
