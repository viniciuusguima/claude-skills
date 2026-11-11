// motor.js — motor de animação reutilizável (não edite por vídeo; as cenas ficam em cenas.js).
// render(ctx, t) é determinístico: o mesmo t sempre gera o mesmo quadro.
// Formato vem de window.TIMELINE.formato: "horizontal" (1920x1080) ou "vertical" (1080x1920).
(() => {
  let W = 1920, H = 1080, CX = W / 2, CY = H / 2, FLOOR = 720;
  const FONT = "'Segoe UI', 'Inter', Arial, sans-serif";
  const MONO = "Consolas, 'Cascadia Mono', monospace";
  function configurar() {
    const vert = (window.TIMELINE && window.TIMELINE.formato) === "vertical";
    W = vert ? 1080 : 1920; H = vert ? 1920 : 1080; CX = W / 2; CY = H / 2;
    FLOOR = Math.round(H * (vert ? 0.62 : 0.667));
  }
  configurar();

  // ---------- utilidades ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = p => 1 - Math.pow(1 - p, 3);
  const eIn = p => p * p * p;
  const eInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const eBack = p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
  const pop = (t, a, d = 0.35) => eBack(seg(t, a, a + d));
  function rng(seed) {
    return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  }
  const brl = n => "R$ " + Math.round(n).toLocaleString("pt-BR");

  let ctx;
  const wa = a => `rgba(255,255,255,${clamp(a)})`;

  // ---------- primitivas ----------
  function glow(blur, a = 0.9) { ctx.shadowColor = wa(a); ctx.shadowBlur = blur; }
  function noGlow() { ctx.shadowBlur = 0; ctx.shadowColor = "transparent"; }

  function text(str, x, y, size, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 700} ${size}px ${o.mono ? MONO : FONT}`;
    ctx.textAlign = o.align || "center";
    ctx.textBaseline = o.base || "middle";
    ctx.letterSpacing = (o.spacing || 0) + "px";
    ctx.fillStyle = o.color || wa(o.alpha ?? 1);
    if (o.glow) glow(o.glow, o.glowA ?? 0.8);
    ctx.fillText(str, x, y);
    ctx.restore();
  }
  function label(str, x, y, o = {}) { text(str.toUpperCase(), x, y, o.size || 15, { weight: 600, spacing: 4, alpha: o.alpha ?? 0.55, align: o.align }); }

  function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function panel(x, y, w, h, o = {}) {
    const a = o.alpha ?? 1;
    ctx.save();
    rrect(x, y, w, h, o.r ?? 14);
    ctx.fillStyle = `rgba(255,255,255,${0.035 * a})`;
    ctx.fill();
    if (o.glow) glow(o.glow, 0.5 * a);
    ctx.strokeStyle = wa(0.6 * a);
    ctx.lineWidth = o.lw || 2;
    ctx.stroke();
    noGlow();
    // cantoneiras HUD
    ctx.strokeStyle = wa(0.9 * a); ctx.lineWidth = 2;
    const c = 10, m = -6;
    [[x + m, y + m, 1, 1], [x + w - m, y + m, -1, 1], [x + m, y + h - m, 1, -1], [x + w - m, y + h - m, -1, -1]].forEach(([px, py, sx, sy]) => {
      if (o.ticks === false) return;
      ctx.beginPath(); ctx.moveTo(px, py + c * sy); ctx.lineTo(px, py); ctx.lineTo(px + c * sx, py); ctx.stroke();
    });
    ctx.restore();
  }

  function pill(str, x, y, o = {}) {
    ctx.save();
    ctx.font = `700 ${o.size || 16}px ${FONT}`; ctx.letterSpacing = "3px";
    const w = ctx.measureText(str).width + 40, h = (o.size || 16) * 2.1;
    rrect(x - w / 2, y - h / 2, w, h, h / 2);
    if (o.filled !== false) { glow(20, 0.6); ctx.fillStyle = wa(o.alpha ?? 1); ctx.fill(); noGlow(); }
    else { ctx.strokeStyle = wa(o.alpha ?? 1); ctx.lineWidth = 2; ctx.stroke(); }
    ctx.restore();
    text(str, x, y + 1, o.size || 16, { weight: 800, spacing: 3, color: o.filled !== false ? `rgba(0,0,0,${o.alpha ?? 1})` : wa(o.alpha ?? 1) });
  }

  function spotlight(x, a = 1, o = {}) {
    if (a <= 0) return;
    const floor = o.floor ?? FLOOR, top = -40, wt = o.wt ?? 26, wb = o.wb ?? 190;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(0, top, 0, floor);
    g.addColorStop(0, wa(0.20 * a)); g.addColorStop(0.7, wa(0.06 * a)); g.addColorStop(1, wa(0.015 * a));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - wt, top); ctx.lineTo(x + wt, top); ctx.lineTo(x + wb, floor); ctx.lineTo(x - wb, floor); ctx.closePath(); ctx.fill();
    const r = ctx.createRadialGradient(x, floor, 0, x, floor, wb * 1.3);
    r.addColorStop(0, wa(0.22 * a)); r.addColorStop(1, wa(0));
    ctx.fillStyle = r;
    ctx.save(); ctx.translate(x, floor); ctx.scale(1, 0.18); ctx.beginPath(); ctx.arc(0, 0, wb * 1.3, 0, Math.PI * 2); ctx.restore(); ctx.fill();
    ctx.restore();
  }

  // boneco "peão": pés em (x, y)
  function pawn(x, y, s = 1, o = {}) {
    const a = o.alpha ?? 1;
    if (a <= 0) return;
    const shade = o.gray ? 150 : 255;
    ctx.save();
    ctx.translate(x, y - (o.bob || 0));
    ctx.scale(s, s);
    if (!o.gray && o.glow !== false) glow(28, 0.75 * a);
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${a})`;
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.bezierCurveTo(-30, -12, -22, -20, -16, -40);
    ctx.bezierCurveTo(-12, -55, -20, -62, -14, -68);
    ctx.lineTo(14, -68);
    ctx.bezierCurveTo(20, -62, 12, -55, 16, -40);
    ctx.bezierCurveTo(22, -20, 30, -12, 30, 0);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -88, 18, 0, Math.PI * 2); ctx.fill();
    noGlow();
    if (o.cap) {
      ctx.fillStyle = `rgba(${shade - 90},${shade - 90},${shade - 90},${a})`;
      ctx.strokeStyle = `rgba(${shade},${shade},${shade},${a})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-30, -104); ctx.lineTo(0, -116); ctx.lineTo(30, -104); ctx.lineTo(0, -93); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(22, -104); ctx.lineTo(24, -86); ctx.stroke();
      ctx.beginPath(); ctx.arc(24, -84, 3, 0, Math.PI * 2); ctx.fillStyle = `rgba(${shade},${shade},${shade},${a})`; ctx.fill();
    }
    ctx.restore();
  }

  function xMark(x, y, s, a = 1, lw = 4) {
    ctx.save(); ctx.strokeStyle = wa(a); ctx.lineWidth = lw; ctx.lineCap = "round"; glow(12, 0.6 * a);
    ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
    ctx.restore();
  }
  function check(x, y, s, a = 1) {
    ctx.save(); ctx.strokeStyle = wa(a); ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; glow(12, 0.6 * a);
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s, y - s * 0.7); ctx.stroke();
    ctx.restore();
  }

  function icon(name, x, y, s, a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = wa(a); ctx.fillStyle = wa(a); ctx.lineWidth = 3 / s * Math.max(1, s * 0.9); ctx.lineJoin = "round"; ctx.lineCap = "round";
    glow(10, 0.5 * a);
    ctx.beginPath();
    if (name === "caixa") {
      ctx.moveTo(-26, -14); ctx.lineTo(0, -28); ctx.lineTo(26, -14); ctx.lineTo(26, 18); ctx.lineTo(0, 32); ctx.lineTo(-26, 18); ctx.closePath();
      ctx.moveTo(-26, -14); ctx.lineTo(0, 0); ctx.lineTo(26, -14); ctx.moveTo(0, 0); ctx.lineTo(0, 32); ctx.stroke();
    } else if (name === "camiseta") {
      ctx.moveTo(-12, -28); ctx.lineTo(-34, -18); ctx.lineTo(-26, -2); ctx.lineTo(-18, -6); ctx.lineTo(-18, 30); ctx.lineTo(18, 30); ctx.lineTo(18, -6); ctx.lineTo(26, -2); ctx.lineTo(34, -18); ctx.lineTo(12, -28);
      ctx.quadraticCurveTo(0, -18, -12, -28); ctx.stroke();
    } else if (name === "lampada") {
      ctx.arc(0, -8, 20, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(9, 16); ctx.lineTo(-9, 16); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, 23); ctx.lineTo(8, 23); ctx.moveTo(-5, 30); ctx.lineTo(5, 30); ctx.stroke();
    } else if (name === "lampadaCheia") {
      ctx.arc(0, -8, 20, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(9, 16); ctx.lineTo(-9, 16); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-8, 23); ctx.lineTo(8, 23); ctx.moveTo(-5, 30); ctx.lineTo(5, 30); ctx.stroke();
    } else if (name === "interrogacao") {
      ctx.font = `800 52px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", 0, 0);
    }
    ctx.restore();
  }

  function gear(x, y, r, teeth, rot, a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = wa(a); ctx.lineWidth = 3; glow(10, 0.5 * a);
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const ang = (i / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.22;
      const a1 = ang - Math.PI / (teeth * 2) * 0.6, a2 = ang + Math.PI / (teeth * 2) * 0.6;
      ctx.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr); ctx.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr);
    }
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // display de 7 segmentos
  const SEGS = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
  function digit(d, x, y, w, h, a = 1) {
    const t = w * 0.16, on = SEGS[d] || "";
    const S = {
      a: [x + t, y, w - 2 * t, t, true], d: [x + t, y + h - t, w - 2 * t, t, true], g: [x + t, y + h / 2 - t / 2, w - 2 * t, t, true],
      f: [x, y + t * 0.6, t, h / 2 - t * 0.9, false], b: [x + w - t, y + t * 0.6, t, h / 2 - t * 0.9, false],
      e: [x, y + h / 2 + t * 0.3, t, h / 2 - t * 0.9, false], c: [x + w - t, y + h / 2 + t * 0.3, t, h / 2 - t * 0.9, false],
    };
    ctx.save();
    for (const k of "abcdefg") {
      const [sx, sy, sw, sh] = S[k];
      const lit = on.includes(k);
      ctx.fillStyle = lit ? wa(a) : wa(0.06);
      if (lit) glow(22, 0.9 * a); else noGlow();
      rrect(sx, sy, sw, sh, t / 2); ctx.fill();
    }
    ctx.restore();
  }
  function number2(n, x, y, w, h, a = 1, ghost = false) {
    const s = String(Math.max(0, Math.min(99, n))).padStart(2, "0");
    digit(ghost ? 8 : +s[0], x, y, w, h, ghost ? 0.07 : a);
    digit(ghost ? 8 : +s[1], x + w * 1.35, y, w, h, ghost ? 0.07 : a);
  }

  // ---------- fundo ----------
  let bgDots, vignette, BOKEH;
  function prepFundo() {
    bgDots = document.createElement("canvas"); bgDots.width = W; bgDots.height = H;
    const g = bgDots.getContext("2d"); g.fillStyle = "rgba(255,255,255,0.05)";
    for (let y = 24; y < H; y += 48) for (let x = 24; x < W; x += 48) { g.beginPath(); g.arc(x, y, 1.4, 0, Math.PI * 2); g.fill(); }
    vignette = document.createElement("canvas"); vignette.width = W; vignette.height = H;
    const v = vignette.getContext("2d");
    const big = Math.max(W, H), small = Math.min(W, H);
    const r = v.createRadialGradient(CX, CY, small * 0.25, CX, CY, big * 0.6);
    r.addColorStop(0, "rgba(0,0,0,0)"); r.addColorStop(1, "rgba(0,0,0,0.85)");
    v.fillStyle = r; v.fillRect(0, 0, W, H);
    const R0 = rng(7);
    BOKEH = Array.from({ length: 16 }, () => ({ x: R0() * W, y: R0() * H, r: 50 + R0() * 120, a: 0.02 + R0() * 0.035, sp: 0.2 + R0() * 0.5, ph: R0() * 6 }));
  }
  function fundo(t) {
    ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(CX, CY - 80, 0, CX, CY, Math.max(W, H) * 0.6);
    g.addColorStop(0, "#151515"); g.addColorStop(1, "#050505");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(bgDots, 0, 0);
    for (const b of BOKEH) {
      const x = b.x + Math.sin(t * b.sp * 0.3 + b.ph) * 40, y = b.y + Math.cos(t * b.sp * 0.25 + b.ph) * 30;
      const r = ctx.createRadialGradient(x, y, 0, x, y, b.r);
      r.addColorStop(0, wa(b.a)); r.addColorStop(0.7, wa(b.a * 0.7)); r.addColorStop(1, wa(0));
      ctx.fillStyle = r; ctx.beginPath(); ctx.arc(x, y, b.r, 0, Math.PI * 2); ctx.fill();
    }
  }
  // linha de chão com degradê nas pontas
  function chao(a = 1, x0 = W * 0.135, x1 = W * 0.865, y = FLOOR) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, wa(0)); g.addColorStop(0.5, wa(0.35 * a)); g.addColorStop(1, wa(0));
    ctx.fillStyle = g; ctx.fillRect(x0, y, x1 - x0, 2);
  }

  // ---------- render ----------
  const FADE_IN = 0.28, FADE_OUT = 0.25;
  let TG = 0, CENAS = null, fabrica = null;
  const ouvintesCtx = [];

  function cenaEm(t) {
    const cs = window.TIMELINE.cenas;
    for (let i = 0; i < cs.length; i++) {
      const ini = i === 0 ? 0 : cs[i].inicio;
      if (t < cs[i].fim || i === cs.length - 1) return { c: cs[i], i, ini };
    }
  }

  // placeholder para cenas ainda não escritas: mostra o id e o texto
  function cenaFaltando(c, lt) {
    text(`cena "${c.id}" não existe em cenas.js`, CX, CY - 40, 34, { weight: 700, alpha: 0.8 });
    text(c.texto || "", CX, CY + 20, 24, { weight: 400, alpha: 0.5 });
  }

  function render(c2d, t) {
    ctx = c2d;
    ouvintesCtx.forEach(f => f(ctx));
    if (!bgDots) prepFundo();
    if (!CENAS) CENAS = fabrica ? fabrica(M) : {};
    ctx.save();
    noGlow(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    fundo(t);
    const { c, i, ini } = cenaEm(t);
    const lt = t - ini, d = c.fim - ini, k = c.fala + (c.inicio - ini);
    TG = t;
    const cs = window.TIMELINE.cenas, last = i === cs.length - 1;
    // "continua": true no roteiro = a cena entra sem corte (sem fade e sem zoom entre as duas)
    const semEntrada = i === 0 || !!c.continua;
    const semSaida = !last && !!cs[i + 1].continua;
    const fIn = semEntrada ? 1 : eOut(seg(lt, 0, FADE_IN));
    const fOut = last ? 1 - seg(t, window.TIMELINE.total - 0.9, window.TIMELINE.total) : semSaida ? 1 : 1 - seg(lt, d - FADE_OUT, d);
    const alpha = Math.min(fIn, fOut);
    const zoom = 1 + 0.035 * eInOut(seg(lt, 0, d)) * (semSaida || c.continua ? 0 : 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(CX, CY); ctx.scale(zoom, zoom); ctx.translate(-CX, -CY);
    const fn = CENAS[c.id];
    if (fn) fn(lt, d, k); else cenaFaltando(c, lt);
    ctx.restore();
    ctx.drawImage(vignette, 0, 0);
    ctx.restore();
  }

  // API exposta para cenas.js
  const M = {
    get W() { return W; }, get H() { return H; }, get CX() { return CX; }, get CY() { return CY; }, get FLOOR() { return FLOOR; },
    FONT, MONO,
    t: () => TG,
    onCtx: f => { ouvintesCtx.push(f); if (ctx) f(ctx); },
    clamp, lerp, seg, eOut, eIn, eInOut, eBack, pop, rng, brl, wa,
    glow, noGlow, text, label, rrect, panel, pill, spotlight, pawn, xMark, check, icon, gear, digit, number2, chao,
  };

  window.Motor = {
    cenas: f => { fabrica = f; CENAS = null; },
    render, cenaEm,
    get W() { return W; }, get H() { return H; },
  };
})();
