// cenas.js — as cenas DESTE vídeo. Cada chave = "id" de uma cena do roteiro.json.
// Assinatura: (lt, d, k) => lt = tempo local (s), d = duração visual da cena, k = fim da fala.
// Exemplo completo (vídeo "Quem mais erra", 16:9). Use como referência de estilo e reescreva por vídeo.
Motor.cenas((M) => {
  const { W, H, CX, CY, FLOOR, FONT, MONO, clamp, lerp, seg, eOut, eIn, eInOut, eBack, pop, rng, brl, wa,
    glow, noGlow, text, label, rrect, panel, pill, spotlight, pawn, xMark, check, icon, gear, digit, number2, chao } = M;
  let ctx; M.onCtx(c => (ctx = c));

  // ---------- labirinto (gerado uma vez, semente fixa) ----------
  const MZ = (() => {
    const C = 13, Rw = 7, r = rng(42);
    const walls = Array.from({ length: Rw }, () => Array.from({ length: C }, () => ({ n: 1, s: 1, e: 1, w: 1 })));
    const vis = Array.from({ length: Rw }, () => Array(C).fill(false));
    const dirs = [["n", 0, -1, "s"], ["s", 0, 1, "n"], ["e", 1, 0, "w"], ["w", -1, 0, "e"]];
    const st = [[0, 0]]; vis[0][0] = true;
    while (st.length) {
      const [x, y] = st[st.length - 1];
      const opts = dirs.filter(([, dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < C && ny < Rw && !vis[ny][nx]; });
      if (!opts.length) { st.pop(); continue; }
      const [d, dx, dy, od] = opts[Math.floor(r() * opts.length)];
      walls[y][x][d] = 0; walls[y + dy][x + dx][od] = 0; vis[y + dy][x + dx] = true; st.push([x + dx, y + dy]);
    }
    // exploração DFS (com becos sem saída) do início ao fim
    const goal = [C - 1, Rw - 1], seen = new Set(["0,0"]), stack = [[0, 0]], walk = [[0, 0]], dead = [];
    const r2 = rng(5);
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      if (x === goal[0] && y === goal[1]) break;
      const opts = dirs.filter(([d, dx, dy]) => !walls[y][x][d] && !seen.has(`${x + dx},${y + dy}`));
      if (!opts.length) {
        const isDead = dirs.filter(([d]) => !walls[y][x][d]).length === 1;
        if (isDead) dead.push({ i: walk.length - 1, x, y });
        stack.pop(); if (stack.length) walk.push(stack[stack.length - 1]); continue;
      }
      opts.sort(() => r2() - 0.5);
      const [, dx, dy] = opts[0]; const n = [x + dx, y + dy];
      seen.add(n.join(",")); stack.push(n); walk.push(n);
    }
    return { C, Rw, walls, walk, dead, sol: stack.slice() };
  })();

  // ---------- cenas ----------
  // cada cena: (lt, d, k) => lt = tempo local, d = duração da cena, k = duração da fala
  const CENAS = {
    abertura(lt, d, k) {
      chao(1);
      // aluno nota A+ (esquerda)
      const xl = 720, xr = 1180;
      ctx.save(); ctx.fillStyle = wa(0.05); ctx.strokeStyle = wa(0.35); rrect(xl - 70, FLOOR - 26, 140, 26, 4); ctx.fill(); ctx.stroke(); ctx.restore();
      pawn(xl, FLOOR - 26, 1.05, { gray: true, cap: true, alpha: eOut(seg(lt, 0, 0.4)) });
      panel(xl - 48, FLOOR + 22, 96, 40, { r: 6, ticks: false, alpha: 0.9 }); text("A+", xl, FLOOR + 43, 22, { weight: 800 });
      label("erros: 0", xl, FLOOR + 90);
      // escada surgindo atrás do aluno que erra
      const steps = 6, sp = seg(lt, 0.6, k * 0.95);
      for (let i = 0; i < steps; i++) {
        const a = eOut(seg(sp, i / steps, (i + 1) / steps));
        if (a <= 0) continue;
        ctx.save(); ctx.globalAlpha *=a; ctx.strokeStyle = wa(0.5); ctx.fillStyle = wa(0.04); ctx.lineWidth = 2;
        rrect(xr - 60 + i * 70, FLOOR - 26 - i * 34, 110, 26, 3); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      const climb = eInOut(seg(lt, 0.9, k * 1.0));
      const stepI = climb * (steps - 1);
      const px = xr + stepI * 70 - 5, py = FLOOR - 26 - Math.floor(stepI + 0.0001) * 34 - Math.sin((stepI % 1) * Math.PI) * 18 - (stepI % 1) * 34 * 0;
      spotlight(px, 1, { floor: py, wb: 150 });
      pawn(px, py, 1.1, { alpha: eOut(seg(lt, 0.1, 0.5)) });
      // F + contador de erros
      const errs = Math.floor(seg(lt, 0.4, k * 0.9) * 37);
      panel(xr - 48, FLOOR + 22, 96, 40, { r: 6, ticks: false }); text("F", xr, FLOOR + 43, 22, { weight: 800 });
      label(`erros: ${errs}`, xr, FLOOR + 90, { alpha: 0.8 });
      for (let i = 0; i < 4; i++) {
        const tt = 0.6 + i * 0.55, a = seg(lt, tt, tt + 0.15) * (1 - seg(lt, tt + 0.5, tt + 0.9));
        if (a > 0) xMark(px + 50 + i * 12, py - 120 - seg(lt, tt, tt + 0.9) * 50, 8, a, 3);
      }
      // dinheiro
      const money = eIn(seg(lt, 0.5, d - 0.2)) * 718055;
      const s = 1 + 0.08 * Math.sin(lt * 9) * seg(lt, 0.5, d - 0.2);
      ctx.save(); ctx.translate(CX + 200, 270); ctx.scale(s, s);
      text(brl(money), 0, 0, 92, { weight: 800, glow: 40 });
      ctx.restore();
      pill("QUEM MAIS ERRA", CX + 200, 350, { size: 15, alpha: eOut(seg(lt, 0.8, 1.2)) });
    },

    fila(lt, d, k) {
      const y = 640, a0 = eOut(seg(lt, 0, 0.4));
      label("o que a maioria acredita", CX, 300, { alpha: 0.6 * a0 });
      ctx.save(); ctx.strokeStyle = wa(0.3 * a0); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(CX - 330, 325); ctx.lineTo(CX + 330, 325); ctx.stroke(); ctx.restore();
      // seta de progresso
      const ax = lerp(360, 1560, eOut(seg(lt, 0, 0.8)));
      ctx.save(); ctx.strokeStyle = wa(0.75); ctx.lineWidth = 3; glow(12, 0.6);
      ctx.beginPath(); ctx.moveTo(360, y); ctx.lineTo(ax, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax - 16, y - 10); ctx.lineTo(ax, y); ctx.lineTo(ax - 16, y + 10); ctx.stroke(); ctx.restore();
      for (let i = 0; i < 24; i++) { const tx = 380 + i * 50; if (tx < ax - 20) { ctx.fillStyle = wa(0.25); ctx.fillRect(tx, y + 8, 2, 8); } }
      label("progresso", 1560, y + 40, { alpha: 0.5 });
      const fwd = eInOut(seg(lt, 1.5, d)) * 120;
      for (let i = 0; i < 5; i++) {
        if (i === 3) continue;
        const x = 600 + i * 170 + fwd + Math.sin(lt * 3 + i) * 3;
        pawn(x, y - 2, 0.85, { gray: true, alpha: eOut(seg(lt, 0.1 + i * 0.07, 0.5 + i * 0.07)), bob: Math.abs(Math.sin(lt * 6 + i)) * 4 * seg(lt, 1.5, 1.7) });
      }
      // o que erra: ganha F e fica pra trás
      const back = eInOut(seg(lt, k * 0.55, k * 0.95));
      const hx = lerp(600 + 3 * 170, 470, back);
      spotlight(hx, 0.9, { floor: y });
      pawn(hx, y - 2, 0.9, { alpha: eOut(seg(lt, 0.2, 0.6)) });
      const fa = pop(lt, k * 0.3);
      if (fa > 0) { ctx.save(); ctx.translate(hx, y - 150); ctx.scale(fa, fa); panel(-22, -24, 44, 48, { r: 5, ticks: false }); text("F", 0, 2, 26, { weight: 800 }); ctx.restore(); }
      label(`lugar: ${back > 0.6 ? 5 : 4}º`, hx, y + 40, { alpha: 0.7 * fa });
    },

    nota(lt, d, k) {
      const x = CX, gy = 340;
      const marks = [k * 0.15, k * 0.42, k * 0.62, k * 0.82];
      const nErr = marks.slice(1).filter(m => lt > m).length;
      const grade = "ABCD"[nErr];
      // círculo da nota
      const s0 = pop(lt, 0.05, 0.5);
      ctx.save(); ctx.translate(x, gy); ctx.scale(s0, s0);
      ctx.strokeStyle = wa(0.85); ctx.lineWidth = 4; glow(24, 0.6); ctx.beginPath(); ctx.arc(0, 0, 95, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = wa(0.25); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 118, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - nErr / 4)); ctx.stroke();
      const last = marks[nErr] || 0, bump = nErr ? 1 + 0.25 * (1 - seg(lt, last, last + 0.3)) : 1;
      ctx.scale(bump, bump); text(grade, 0, 6, 120, { weight: 800, glow: 30 });
      ctx.restore();
      label("sua nota", x, gy - 150, { alpha: 0.6 * s0 });
      // indicadores laterais
      for (let i = 0; i < 4; i++) { ctx.fillStyle = wa(i < 4 - nErr ? 0.8 : 0.12); ctx.beginPath(); ctx.arc(x + 160, gy - 45 + i * 30, 5, 0, Math.PI * 2); ctx.fill(); }
      // prova
      const pa = eOut(seg(lt, 0.2, 0.6));
      const px = x - 220, py = 520;
      panel(px, py, 440, 230, { alpha: pa });
      label("prova", px + 30, py + 32, { align: "left", size: 13 });
      for (let i = 0; i < 4; i++) {
        const ly = py + 80 + i * 40;
        ctx.fillStyle = wa(0.35 * pa); ctx.fillRect(px + 30, ly, 230 - (i % 2) * 60, 4);
        ctx.fillStyle = wa(0.15 * pa); ctx.fillRect(px + 30, ly + 12, 150, 3);
        const m = marks[i], a = pop(lt, m, 0.3);
        if (a > 0) { if (i === 0) check(px + 390, ly + 6, 14 * a); else xMark(px + 390, ly + 6, 12 * a, 1); }
        if (i > 0 && lt > m) { const f = seg(lt, m, m + 0.9); text("−1", px + 470, ly + 6 - f * 40, 26, { weight: 800, alpha: 1 - f, align: "left" }); }
      }
    },

    inversao(lt, d, k) {
      const flip = seg(lt, k * 0.42, k * 0.42 + 0.5);
      const sy = Math.abs(Math.cos(flip * Math.PI));
      const depois = flip > 0.5;
      const a = eOut(seg(lt, 0, 0.4));
      ctx.save(); ctx.translate(CX, 470); ctx.scale(1, Math.max(0.02, sy));
      panel(-330, -90, 660, 180, { alpha: a, glow: 18 });
      label(depois ? "mundo real" : "escola", -295, -58, { align: "left", size: 13 });
      ctx.fillStyle = wa(0.5); ctx.fillRect(250, -64, 50, 6);
      text("ERRO", -150, 15, 38, { weight: 800, alpha: a });
      ctx.save(); ctx.strokeStyle = wa(0.7 * a); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-70, 15); ctx.lineTo(0, 15); ctx.moveTo(-12, 5); ctx.lineTo(0, 15); ctx.lineTo(-12, 25); ctx.stroke(); ctx.restore();
      text(depois ? "+1" : "−1", 85, 12, 70, { weight: 800, glow: 26, alpha: a });
      text(depois ? "APRENDIZADO" : "NOTA", 140, 15, 24, { weight: 700, align: "left", alpha: 0.8 * a });
      ctx.restore();
      pill("AS REGRAS SE INVERTEM", CX, 650, { size: 15, alpha: eOut(seg(lt, k * 0.55, k * 0.55 + 0.4)) });
      // setas girando em volta, sinal da inversão
      const r = seg(lt, k * 0.42, k * 0.42 + 0.9);
      if (r > 0 && r < 1) { ctx.save(); ctx.translate(CX, 470); ctx.rotate(r * Math.PI); ctx.strokeStyle = wa(0.4 * Math.sin(r * Math.PI)); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 380, -0.4, 0.4); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 380, Math.PI - 0.4, Math.PI + 0.4); ctx.stroke(); ctx.restore(); }
    },

    placar(lt, d, k) {
      const bx = CX - 300, by = 290, bw = 680, bh = 280;
      const a = eOut(seg(lt, 0, 0.5));
      spotlight(470, 1, { floor: FLOOR + 40 });
      pawn(470, FLOOR + 40, 0.95, { alpha: a });
      // pernas do placar
      ctx.fillStyle = wa(0.4 * a); ctx.fillRect(bx + 120, by + bh, 5, FLOOR + 40 - by - bh); ctx.fillRect(bx + bw - 125, by + bh, 5, FLOOR + 40 - by - bh);
      panel(bx, by, bw, bh, { alpha: a, glow: 12 });
      ctx.fillStyle = wa(0.25 * a); ctx.fillRect(bx + bw / 2 - 1, by + 30, 2, bh - 60);
      const tOff = k * 0.42, tOn = k * 0.6;
      const errosOn = lt < tOff;
      label("erros", bx + bw / 4, by + 42, { alpha: (errosOn ? 0.7 : 0.25) * a });
      label("acertos", bx + 3 * bw / 4, by + 42, { alpha: (lt > tOn ? 0.9 : 0.35) * a });
      const ne = Math.floor(eOut(seg(lt, 0.2, tOff - 0.2)) * 21);
      const dw = 80, dh = 140, dy = by + 85;
      if (errosOn) number2(ne, bx + bw / 4 - dw * 1.17, dy, dw, dh, a);
      else { number2(0, bx + bw / 4 - dw * 1.17, dy, dw, dh, a, true); const f = seg(lt, tOff, tOff + 0.6); text("NÃO CONTA", bx + bw / 4, dy + dh / 2, 30, { weight: 800, alpha: f * 0.9, spacing: 3 }); }
      const na = Math.floor(eOut(seg(lt, tOn + 0.2, d - 0.6)) * 4);
      if (lt > tOn) number2(na, bx + 3 * bw / 4 - dw * 1.17, dy, dw, dh, eOut(seg(lt, tOn, tOn + 0.3)));
      else number2(0, bx + 3 * bw / 4 - dw * 1.17, dy, dw, dh, a, true);
      // pulso no momento que o acerto acende
      const pp = seg(lt, tOn, tOn + 0.8);
      if (pp > 0 && pp < 1) { ctx.save(); ctx.strokeStyle = wa(0.5 * (1 - pp)); ctx.lineWidth = 3; rrect(bx + bw / 2 + 20 - pp * 30, by + 20 - pp * 30, bw / 2 - 40 + pp * 60, bh - 40 + pp * 60, 14); ctx.stroke(); ctx.restore(); }
      label("mundo real", CX + 40, by + bh + 50, { alpha: 0.45 * a });
    },

    labirinto(lt, d, k) {
      const cs = 58, mw = MZ.C * cs, mh = MZ.Rw * cs, ox = CX - mw / 2, oy = 520 - mh / 2;
      const a = eOut(seg(lt, 0, 0.5));
      ctx.save(); ctx.strokeStyle = wa(0.55 * a); ctx.lineWidth = 3; ctx.lineCap = "round"; glow(8, 0.3);
      ctx.beginPath();
      for (let y = 0; y < MZ.Rw; y++) for (let x = 0; x < MZ.C; x++) {
        const w = MZ.walls[y][x], X = ox + x * cs, Y = oy + y * cs;
        if (w.n && !(x === 0 && y === 0)) { ctx.moveTo(X, Y); ctx.lineTo(X + cs, Y); }
        if (w.w && !(x === 0 && y === 0)) { ctx.moveTo(X, Y); ctx.lineTo(X, Y + cs); }
        if (y === MZ.Rw - 1 && w.s) { ctx.moveTo(X, Y + cs); ctx.lineTo(X + cs, Y + cs); }
        if (x === MZ.C - 1 && w.e && y !== MZ.Rw - 1) { ctx.moveTo(X + cs, Y); ctx.lineTo(X + cs, Y + cs); }
      }
      ctx.stroke(); ctx.restore();
      label("entrada", ox - 20, oy - 26, { align: "left", alpha: 0.5 * a, size: 13 });
      label("o que funciona", ox + mw + 30, oy + mh - cs / 2, { align: "left", alpha: 0.6 * a, size: 13 });
      // caminhada
      const n = MZ.walk.length - 1, p = eInOut(seg(lt, 0.4, d - 0.9)) * n;
      const i = Math.floor(p), f = p - i;
      const cxy = ([x, y]) => [ox + x * cs + cs / 2, oy + y * cs + cs / 2];
      ctx.save(); ctx.strokeStyle = wa(0.22); ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
      for (let j = 0; j <= Math.min(i, n); j++) { const [x, y] = cxy(MZ.walk[j]); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
      for (const dd of MZ.dead) if (p >= dd.i) { const [x, y] = cxy([dd.x, dd.y]); xMark(x, y, 10 * pop(p, dd.i, 3), 0.85, 3); }
      const done = seg(lt, d - 0.9, d - 0.5);
      if (done > 0) {
        ctx.save(); ctx.strokeStyle = wa(0.95 * done); ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round"; glow(20, 0.9); ctx.beginPath();
        MZ.sol.forEach((c, j) => { const [x, y] = cxy(c); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore();
      }
      const A = cxy(MZ.walk[Math.min(i, n)]), B = cxy(MZ.walk[Math.min(i + 1, n)]);
      const dx = lerp(A[0], B[0], f), dy = lerp(A[1], B[1], f);
      ctx.save(); glow(30, 1); ctx.fillStyle = wa(1); ctx.beginPath(); ctx.arc(dx, dy, 10, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      label(`tentativas: ${MZ.dead.filter(dd => p >= dd.i).length}`, CX, oy + mh + 50, { alpha: 0.6 * a });
    },

    negocio(lt, d, k) {
      const s = eBack(seg(lt, 0, 0.55));
      ctx.save(); ctx.translate(CX + 80, 470); ctx.scale(s, s);
      // notebook
      panel(-300, -190, 600, 360, { r: 16, glow: 16 });
      ctx.fillStyle = wa(0.5); rrect(-360, 178, 720, 16, 6); ctx.fill();
      label("minha loja online", -260, -150, { align: "left", alpha: 0.8 });
      ctx.fillStyle = wa(0.4); ctx.beginPath(); ctx.arc(250, -150, 5, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const a = eOut(seg(lt, 0.45 + i * 0.15, 0.8 + i * 0.15));
        ctx.save(); ctx.globalAlpha *=a; ctx.setLineDash([8, 6]); ctx.strokeStyle = wa(0.45); ctx.lineWidth = 2; rrect(-255 + i * 175, -100, 150, 170, 10); ctx.stroke(); ctx.restore();
        text("+", -180 + i * 175, -15, 44, { weight: 300, alpha: 0.6 * a });
      }
      label("vendas", -255, 115, { align: "left", size: 12 });
      ctx.save(); ctx.strokeStyle = wa(0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-160, 120); ctx.lineTo(lerp(-160, 255, seg(lt, 0.6, 1.6)), 120); ctx.stroke(); ctx.restore();
      ctx.restore();
      spotlight(420, eOut(seg(lt, 0.2, 0.6)));
      pawn(420, FLOOR, 1, { alpha: eOut(seg(lt, 0.2, 0.6)) });
      label("dia 1", 420, FLOOR + 40, { alpha: 0.6 * seg(lt, 0.4, 0.8) });
    },

    produtos(lt, d, k) {
      const tA = 0.15, tB = k * 0.27, tC = k * 0.46, tQ = k * 0.76;
      const cards = [
        { t: tA, ic: "caixa", nome: "produto 1", v: 0, tag: "NÃO VENDEU" },
        { t: tB, ic: "camiseta", nome: "produto 2", v: 0, tag: "IGNORADO" },
        { t: tC, ic: "lampada", nome: "produto 3", v: 3, tag: "3 VENDAS" },
      ];
      cards.forEach((c, i) => {
        const s = pop(lt, c.t, 0.45);
        if (s <= 0) return;
        const x = CX - 420 + i * 260, y = 470;
        const dim = i === 1 ? 1 - 0.55 * seg(lt, c.t + 0.8, c.t + 1.4) : 1;
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *=dim;
        const tilt = i === 2 ? Math.sin(lt * 2) * 0.03 : 0; ctx.rotate(tilt);
        panel(-100, -140, 200, 280, { r: 14, glow: i === 2 ? 22 : 8 });
        label(c.nome, -80, -112, { align: "left", size: 12 });
        icon(c.ic, 0, -25, 1.5, 0.9);
        ctx.fillStyle = wa(0.2); ctx.fillRect(-80, 60, 160, 2);
        label("vendas", -80, 95, { align: "left", size: 12 });
        const v = i === 2 ? Math.floor(eOut(seg(lt, c.t + 0.6, c.t + 1.8)) * 3) : 0;
        text(String(v), 75, 95, 34, { weight: 800, align: "right", glow: i === 2 && v ? 18 : 0 });
        ctx.restore();
        // carimbo
        const st = i === 0 ? pop(lt, c.t + 0.7, 0.3) : 0;
        if (st > 0) xMark(x, y - 25, 70 * (2 - st), 0.95 * Math.min(1, st), 8);
        const ta = eOut(seg(lt, c.t + 0.9, c.t + 1.3));
        if (ta > 0) pill(c.tag, x, y + 190, { size: 13, filled: i === 2, alpha: ta * (i === 1 ? 0.6 : 1) });
        if (i === 1) { const z = seg(lt, c.t + 1.2, d); for (let j = 0; j < 3; j++) { const zz = (z * 3 + j * 0.33) % 1; if (lt > c.t + 1.2) text("z", x + 70 + zz * 30 + j * 6, y - 150 - zz * 60, 18 + j * 4, { alpha: (1 - zz) * 0.6 }); } }
      });
      const pa = eOut(seg(lt, tQ - 0.6, tQ));
      spotlight(1500, pa);
      pawn(1500, FLOOR, 0.95, { alpha: pa });
      const q = pop(lt, tQ, 0.4);
      if (q > 0) { ctx.save(); ctx.translate(1555, FLOOR - 165); ctx.scale(q, q); icon("interrogacao", 0, 0, 1.1, 1); ctx.restore(); }
    },

    aprendizado(lt, d, k) {
      const ics = ["caixa", "camiseta", "lampada"], tags = ["PREÇO", "PÚBLICO", "DOR REAL"];
      const bx = CX - 210, by = 330, bw = 420, bh = 300;
      const a = eOut(seg(lt, 0, 0.4));
      panel(bx, by, bw, bh, { alpha: a, glow: 12 });
      label("o que as pessoas querem", CX, by - 30, { alpha: 0.7 * a });
      for (let i = 0; i < 3; i++) {
        const cx = 420, cy = 360 + i * 130;
        ctx.save(); ctx.globalAlpha *=a; panel(cx - 60, cy - 50, 120, 100, { r: 10, ticks: false }); ctx.restore();
        icon(ics[i], cx, cy - 4, 0.8, 0.85 * a);
        if (i < 2) xMark(cx + 48, cy - 38, 7, 0.7 * a, 2); else text("3", cx + 46, cy - 36, 16, { weight: 800, alpha: a });
        // peça viaja até o quadro
        const t0 = 0.5 + i * k * 0.24, f = eInOut(seg(lt, t0, t0 + 0.8));
        const tx = bx + 40 + i * 0, ty = by + 40 + i * 85;
        if (lt > t0) {
          const x = lerp(cx + 70, tx, f), y = lerp(cy - 30, ty, f) - Math.sin(f * Math.PI) * 80;
          const w = lerp(60, bw - 80, eOut(seg(lt, t0 + 0.7, t0 + 1.1)));
          ctx.save(); glow(20, 0.8); ctx.fillStyle = wa(f < 1 ? 0.9 : 0.12); rrect(x, y, f < 1 ? 60 : w, 60, 8); ctx.fill(); ctx.restore();
          if (f >= 1) { ctx.save(); ctx.strokeStyle = wa(0.8); ctx.lineWidth = 2; rrect(x, y, w, 60, 8); ctx.stroke(); ctx.restore(); text(tags[i], x + 24, y + 31, 22, { weight: 800, align: "left", spacing: 3, alpha: seg(lt, t0 + 0.9, t0 + 1.2) }); check(x + w - 34, y + 30, 12 * seg(lt, t0 + 1, t0 + 1.3)); }
        }
      }
      spotlight(1500, a); pawn(1500, FLOOR, 0.95, { alpha: a });
      const ideias = [0.5, 0.5 + k * 0.24, 0.5 + k * 0.48].filter(t0 => lt > t0 + 1).length;
      label(`aprendizados: ${ideias}`, 1500, FLOOR + 40, { alpha: 0.7 * a });
    },

    custo(lt, d, k) {
      const tStop = k * 0.62;
      const parado = lt > tStop;
      const gx = CX, gy = 470, r = 210, a = eOut(seg(lt, 0, 0.4));
      ctx.save(); ctx.lineCap = "round";
      ctx.strokeStyle = wa(0.15 * a); ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(gx, gy, r, Math.PI, 0); ctx.stroke();
      for (let i = 0; i <= 20; i++) { const an = Math.PI + (i / 20) * Math.PI; ctx.strokeStyle = wa((i % 5 ? 0.25 : 0.7) * a); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx + Math.cos(an) * (r - 40), gy + Math.sin(an) * (r - 40)); ctx.lineTo(gx + Math.cos(an) * (r - (i % 5 ? 52 : 60)), gy + Math.sin(an) * (r - (i % 5 ? 52 : 60))); ctx.stroke(); }
      const v = parado ? eBack(seg(lt, tStop, tStop + 0.6)) * 0.95 : 0.06 + 0.03 * Math.sin(lt * 7);
      ctx.strokeStyle = wa(0.9 * a); ctx.lineWidth = 26; glow(24, 0.8); ctx.beginPath(); ctx.arc(gx, gy, r, Math.PI, Math.PI + Math.PI * clamp(v, 0, 1)); ctx.stroke(); noGlow();
      const an = Math.PI + Math.PI * v;
      ctx.strokeStyle = wa(a); ctx.lineWidth = 5; glow(12, 0.8); ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(an) * (r - 70), gy + Math.sin(an) * (r - 70)); ctx.stroke();
      ctx.fillStyle = wa(a); ctx.beginPath(); ctx.arc(gx, gy, 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      label("custo do fracasso", gx, gy - r - 50, { alpha: 0.7 * a });
      panel(gx - 90, gy + 25, 180, 54, { r: 27, ticks: false, alpha: a });
      text(parado ? "MÁXIMO" : "QUASE ZERO", gx, gy + 52, parado ? 26 : 20, { weight: 800, spacing: 2, glow: parado ? 20 : 0 });
      // boneco andando e parando
      const walkX = 620 + Math.min(lt, tStop) * 130;
      const bob = parado ? 0 : Math.abs(Math.sin(lt * 9)) * 8;
      spotlight(walkX, a, { floor: FLOOR + 60 });
      pawn(walkX, FLOOR + 60, 0.9, { alpha: a, bob, gray: parado && seg(lt, tStop, tStop + 0.4) > 0.5 });
      label(parado ? "parou" : "continuando", walkX, FLOOR + 100, { alpha: 0.7 * a });
    },

    maquina(lt, d, k) {
      const a = eOut(seg(lt, 0, 0.4));
      const y = 600, mx = CX, mw = 300, mh = 260;
      chao(a, 240, 1680, y);
      // esteira
      ctx.save(); ctx.strokeStyle = wa(0.5 * a); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(340, y); ctx.lineTo(1580, y); ctx.stroke();
      for (let i = 0; i < 30; i++) { const x = 340 + ((i * 44 + lt * 120) % 1240); ctx.fillStyle = wa(0.25 * a); ctx.fillRect(x, y + 6, 14, 3); }
      ctx.restore();
      // caixas X entrando
      for (let i = 0; i < 6; i++) {
        const x = 380 + ((lt * 150 + i * 120) % 720);
        if (x > mx - mw / 2 - 30) continue;
        ctx.save(); ctx.globalAlpha *=a; panel(x - 24, y - 50, 48, 48, { r: 6, ticks: false }); ctx.restore();
        xMark(x, y - 26, 10, 0.9 * a, 3);
      }
      // chips de informação saindo
      for (let i = 0; i < 5; i++) {
        const x = mx + mw / 2 + 30 + ((lt * 150 + i * 130) % 650);
        if (x > mx + mw / 2 + 30 + Math.max(0, lt - 0.6) * 150) continue; // saída começa depois
        ctx.save(); glow(18, 0.8); ctx.fillStyle = wa(0.95 * a); rrect(x - 34, y - 48, 68, 44, 8); ctx.fill(); ctx.restore();
        text("INFO", x, y - 25, 16, { weight: 800, color: `rgba(0,0,0,${a})`, spacing: 2 });
      }
      // máquina
      ctx.save(); ctx.fillStyle = "#0b0b0b"; rrect(mx - mw / 2, y - mh, mw, mh, 16); ctx.fill(); ctx.restore();
      panel(mx - mw / 2, y - mh, mw, mh, { alpha: a, glow: 16 });
      gear(mx - 45, y - 150, 48, 10, lt * 1.6, a);
      gear(mx + 52, y - 110, 32, 8, -lt * 2.4 + 0.2, a);
      ctx.fillStyle = wa(0.6 * a); ctx.fillRect(mx - 20, y - mh - 22, 40, 22);
      const ledOn = Math.floor(lt * 4) % 2;
      ctx.fillStyle = wa(ledOn ? 0.95 : 0.2); ctx.beginPath(); ctx.arc(mx + mw / 2 - 28, y - mh + 26, 6, 0, Math.PI * 2); ctx.fill();
      pill("TENTATIVA → INFORMAÇÃO", mx, y - mh - 70, { size: 14, alpha: eOut(seg(lt, 0.5, 0.9)) });
      // boneco empurrando
      const px = 300;
      spotlight(px, a, { floor: y });
      pawn(px, y, 0.9, { alpha: a, bob: Math.abs(Math.sin(lt * 8)) * 5 });
      label("continua", px, y + 40, { alpha: 0.6 * a });
    },

    chutam(lt, d, k) {
      const tR = k * 0.62;
      const aL = eOut(seg(lt, 0, 0.5)), aR = eOut(seg(lt, tR - 0.4, tR + 0.1));
      // divisória
      ctx.save(); const g = ctx.createLinearGradient(0, 220, 0, 860); g.addColorStop(0, wa(0)); g.addColorStop(0.5, wa(0.35)); g.addColorStop(1, wa(0)); ctx.fillStyle = g; ctx.fillRect(CX - 1, 220, 2, 640); ctx.restore();
      ctx.fillStyle = wa(0.9); ctx.beginPath(); ctx.arc(CX, 540, 5, 0, Math.PI * 2); ctx.fill();
      // esquerda: quem chuta
      label("quem chuta", 560, 250, { alpha: 0.7 * aL });
      const rx = 560, ry = 430;
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(lt * 2.2); ctx.strokeStyle = wa(0.6 * aL); ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      icon("interrogacao", rx, ry, 1.1, aL);
      for (let i = 0; i < 2; i++) {
        const x = 480 + i * 160; pawn(x, FLOOR, 0.8, { gray: true, alpha: aL });
        const q = (lt * 0.8 + i * 0.5) % 1;
        text("?", x + 30, FLOOR - 120 - q * 30, 26, { weight: 800, alpha: aL * (1 - q) * 0.8 });
      }
      // direita: quem constrói
      label("quem constrói", 1360, 250, { alpha: 0.7 * aR });
      const nb = Math.floor(seg(lt, tR, d - 0.3) * 7) + (lt > tR ? 1 : 0);
      for (let i = 0; i < Math.min(nb, 7); i++) {
        const row = i < 3 ? 0 : i < 5 ? 1 : i < 6 ? 2 : 3;
        const col = [0, 1, 2, 0.5, 1.5, 1, 1][i];
        const x = 1290 + col * 72, y = FLOOR - 50 - row * 56;
        const tb = tR + (i / 7) * (d - 0.3 - tR), drop = eOut(seg(lt, tb, tb + 0.25));
        ctx.save(); ctx.globalAlpha *=aR; glow(i === nb - 1 ? 20 : 6, 0.6); ctx.fillStyle = wa(0.85); rrect(x, y - (1 - drop) * 60, 66, 50, 6); ctx.fill(); ctx.restore();
        text("INFO", x + 33, y + 26 - (1 - drop) * 60, 12, { weight: 800, color: `rgba(0,0,0,${aR})`, spacing: 1 });
      }
      spotlight(1180, aR);
      pawn(1180, FLOOR, 0.95, { alpha: aR });
    },

    licoes(lt, d, k) {
      const a = eOut(seg(lt, 0, 0.35));
      spotlight(420, a); pawn(420, FLOOR, 0.95, { alpha: a });
      label("tentativas", CX + 80, 300, { alpha: 0.6 * a });
      let n = 0;
      for (let i = 0; i < 10; i++) {
        const x = CX - 180 + (i % 5) * 110, y = 360 + Math.floor(i / 5) * 130;
        const tf = 0.3 + i * (k * 0.75 - 0.3) / 10, f = seg(lt, tf, tf + 0.3);
        if (f >= 0.5) n++;
        const sx = Math.abs(Math.cos(f * Math.PI));
        ctx.save(); ctx.translate(x + 45, y + 55); ctx.scale(Math.max(0.03, sx), 1);
        ctx.globalAlpha *=a; panel(-45, -55, 90, 110, { r: 10, ticks: false, glow: f >= 0.5 ? 14 : 0 });
        ctx.restore();
        if (f < 0.5) xMark(x + 45, y + 55, 18 * sx, 0.8 * a, 4);
        else icon("lampadaCheia", x + 45, y + 55, 0.9 * sx, a);
      }
      text(String(n), CX + 80, 690, 72, { weight: 800, glow: 30, alpha: a });
      label("lições", CX + 80, 745, { alpha: 0.7 * a });
    },

    perfeito(lt, d, k) {
      const a = eOut(seg(lt, 0, 0.4));
      // esquerda: 10 lições (resumo)
      for (let i = 0; i < 10; i++) icon("lampadaCheia", 360 + (i % 5) * 60, 400 + Math.floor(i / 5) * 80, 0.6, 0.55 * a);
      text("10", 480, 610, 56, { weight: 800, alpha: 0.6 * a });
      label("lições", 480, 655, { alpha: 0.4 * a });
      // direita: histórico perfeito numa bolha
      const ax = 1300, ra = eOut(seg(lt, 0.3, 0.9));
      spotlight(ax, ra);
      ctx.save(); ctx.translate(ax, FLOOR - 70); ctx.rotate(lt * 0.6); ctx.strokeStyle = wa(0.55 * ra); ctx.lineWidth = 3; ctx.setLineDash([14, 10]); glow(16, 0.5); ctx.beginPath(); ctx.arc(0, 0, 130, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = wa(0.03 * ra); ctx.beginPath(); ctx.arc(ax, FLOOR - 70, 128, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      pawn(ax, FLOOR, 0.95, { alpha: ra, cap: true, gray: true });
      panel(ax - 140, 250, 280, 110, { alpha: ra, r: 12 });
      label("histórico perfeito", ax, 280, { alpha: 0.6 * ra, size: 12 });
      text("100%", ax, 325, 44, { weight: 800, alpha: ra });
      const z = seg(lt, k * 0.65, k * 0.65 + 0.5);
      label("lições", ax + 230, FLOOR - 120, { alpha: 0.6 * ra, align: "left" });
      const zs = 1 + 0.3 * Math.sin(z * Math.PI);
      ctx.save(); ctx.translate(ax + 260, FLOOR - 60); ctx.scale(zs, zs); text("0", 0, 0, 80, { weight: 800, glow: z > 0 ? 30 : 0, alpha: ra }); ctx.restore();
    },

    escola(lt, d, k) {
      etiqueta(lt, 0, false);
    },

    final(lt, d, k) {
      const tEnd = k + 0.25;
      if (lt < tEnd + 0.3) {
        const fo = 1 - seg(lt, tEnd, tEnd + 0.3);
        ctx.save(); ctx.globalAlpha *=fo; etiqueta(lt, 1, true); ctx.restore();
      }
      const fa = eOut(seg(lt, tEnd + 0.1, tEnd + 0.8));
      if (fa > 0) {
        ctx.save(); ctx.globalAlpha *=fa;
        chao(1);
        for (let i = 0; i < 5; i++) { ctx.save(); ctx.strokeStyle = wa(0.4); ctx.fillStyle = wa(0.04); ctx.lineWidth = 2; rrect(CX - 260 + i * 90, FLOOR - 30 - i * 40, 130, 30, 3); ctx.fill(); ctx.stroke(); ctx.restore(); }
        const px = CX - 200 + 4 * 90 + 5, py = FLOOR - 30 - 4 * 40;
        spotlight(px, 1.2, { floor: py, wb: 140 });
        pawn(px, py, 1.05, {});
        text("O fracasso só sai caro", CX, 250, 64, { weight: 800, glow: 26 });
        text("quando você para.", CX, 330, 64, { weight: 800, glow: 26, alpha: eOut(seg(lt, tEnd + 0.5, tEnd + 1.1)) });
        ctx.restore();
      }
    },
  };

  // etiqueta de preço usada nas duas últimas cenas
  function etiqueta(lt, flipT, mundo) {
    const a = eOut(seg(lt, 0, 0.4));
    const flip = mundo ? seg(lt, 0, 0.5) : 1;
    const sx = mundo ? Math.abs(Math.cos(flip * Math.PI)) : 1;
    const showMundo = mundo && flip > 0.5;
    const sway = Math.sin(M.t() * 1.6) * 0.04;
    ctx.save(); ctx.translate(CX, 200); ctx.rotate(sway);
    ctx.strokeStyle = wa(0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -200); ctx.lineTo(0, 40); ctx.stroke();
    ctx.translate(0, 40); ctx.scale(Math.max(0.02, sx), 1);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(220, 90); ctx.lineTo(220, 460); ctx.lineTo(-220, 460); ctx.lineTo(-220, 90); ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.04)"; ctx.fill(); glow(22, 0.5); ctx.strokeStyle = wa(0.8 * a); ctx.lineWidth = 3; ctx.stroke(); noGlow();
    ctx.beginPath(); ctx.arc(0, 70, 14, 0, Math.PI * 2); ctx.stroke();
    label(showMundo ? "mundo real" : "escola", 0, 140, { alpha: 0.6 * a });
    text("O PREÇO DE", 0, 200, 22, { weight: 700, spacing: 4, alpha: 0.7 * a });
    if (!showMundo) {
      text("ESTAR", 0, 275, 64, { weight: 800, glow: 22, alpha: a });
      text("ERRADO", 0, 345, 64, { weight: 800, glow: 22, alpha: a });
      const f = pop(lt, 0.8, 0.4);
      if (f > 0 && !mundo) { ctx.save(); ctx.translate(0, 415); ctx.scale(f, f); panel(-24, -22, 48, 44, { r: 5, ticks: false }); text("F", 0, 2, 24, { weight: 800 }); ctx.restore(); }
    } else {
      text("DESCOBRIR O QUE", 0, 268, 40, { weight: 800, glow: 22, alpha: a });
      text("ESTÁ CERTO", 0, 335, 56, { weight: 800, glow: 22, alpha: a });
      const f = pop(lt, 0.7, 0.4);
      if (f > 0) { ctx.save(); ctx.translate(0, 410); ctx.scale(f, f); icon("lampadaCheia", 0, 0, 0.8, 1); ctx.restore(); }
    }
    ctx.restore();
  }


  return CENAS;
});
