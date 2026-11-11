'use strict';
// Caixa de sons sintetizados. const S = makeSfx(DUR); ...S.hit(2, 1.2)...; return S.finish();
// Todos os tempos em segundos; amp ~0.05 (fundo) a 1.5 (impacto); pan de -1 (esquerda) a 1 (direita).
function makeSfx(DUR, seed = 2024) {
  const sr = 48000, N = Math.ceil(DUR * sr), L = new Float32Array(N), R = new Float32Array(N);
  const rnd = mulberry32(seed), white = () => rnd() * 2 - 1, TAU = Math.PI * 2;
  const saw = x => 2 * (x - Math.floor(x + 0.5)), mf = m => 440 * Math.pow(2, (m - 69) / 12); // mf: nota MIDI -> Hz
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
  // Cama continua de ruido filtrado (mar, vento, fogo, chuva). level: funcao t -> 0..1 (use kf). f: Hz ou funcao t -> Hz.
  function bed(level, f, q = 0.5, amp = 0.5, mod = null) {
    const b1 = BQ('bp', typeof f === 'function' ? f(0) : f, q), b2 = BQ('bp', (typeof f === 'function' ? f(0) : f) * 1.25, q); let lv = 0;
    for (let i = 0; i < N; i++) {
      const t = i / sr;
      if (i % 128 === 0) { lv = level(t); if (typeof f === 'function') { const ff = f(t); b1.set(ff, q); b2.set(ff * 1.25, q); } }
      if (lv <= 0) continue;
      const m = mod ? mod(t) : 1; L[i] += b1.run(white()) * amp * lv * m; R[i] += b2.run(white()) * amp * lv * m;
    }
  }
  // Zumbido grave continuo (espaco, motor, tensao). level: funcao t -> 0..1
  function drone(level, f = 41, amp = 0.22) {
    const sub = BQ('lp', 120, 0.7); let lv = 0;
    for (let i = 0; i < N; i++) { const t = i / sr; if (i % 128 === 0) lv = level(t); if (lv <= 0) continue; const d = (sub.run(white()) * 3 + Math.sin(TAU * f * t) * 0.5 + Math.sin(TAU * f * 1.5 * t) * 0.25) * amp * lv; L[i] += d; R[i] += d; }
  }
  // Silencio rapido (ex.: meio segundo antes de um impacto, para ele bater mais forte)
  function duck(t0, t1, fadeLen = 0.2) { for (let i = Math.floor(t0 * sr); i < Math.floor(t1 * sr) && i < N; i++) { const k = 1 - sstep(t0, t0 + fadeLen, i / sr); L[i] *= k; R[i] *= k; } }
  // Normaliza e satura de leve. Chamar por ultimo; o resultado vai direto para studio.start.
  function finish(drive = 3.0) {
    let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const g = drive / (peak || 1), k = 0.92 / Math.tanh(drive);
    for (let i = 0; i < N; i++) { const f = Math.min(1, i / (0.05 * sr)) * Math.min(1, (N - i) / (0.5 * sr)); L[i] = Math.tanh(L[i] * g) * k * f; R[i] = Math.tanh(R[i] * g) * k * f; }
    return { sr, N, L, R, peak };
  }
  return { sr, N, L, R, rnd, white, TAU, saw, mf, BQ, add, thud, crack, whoosh, rumble, heart, breath, scream, step, strNote, bassNote, drum, hit, bell, tick, gull, bed, drone, duck, finish };
}
