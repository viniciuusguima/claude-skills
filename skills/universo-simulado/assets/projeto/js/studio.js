'use strict';
// Partes comuns dos videos: texto na tela, marcador (HUD), cartao final, pre-visualizacao e exportacao em MP4.
function makeStudio(cfg) {
  const DUR = cfg.DUR, W = cfg.W || 1080, H = cfg.H || 1920, FPS = cfg.FPS || 30, S = W / 720;
  const view = document.getElementById('view'); view.width = W; view.height = H;
  const ctx = view.getContext('2d');
  const RED = '#f0281e', SERIF = 'Georgia, "Times New Roman", serif', SANS = '"Segoe UI", Arial, sans-serif';
  const mkCanvas = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); return c; };
  const fade = (t, a, b, d = 0.35) => sstep(a, a + d, t) * (1 - sstep(b - d, b, t));
  const vignette = mkCanvas(360, 640, g => {
    const gr = g.createRadialGradient(180, 300, 170, 180, 320, 400);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = gr; g.fillRect(0, 0, 360, 640);
  });
  const glow = mkCanvas(256, 256, g => {
    const gr = g.createRadialGradient(128, 128, 2, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });
  function rich(text, cx, cy, size, maxW, alpha, lh = 1.3) {
    if (alpha <= 0.002) return;
    ctx.save();
    ctx.globalAlpha = alpha; ctx.font = `${size}px ${SERIF}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = size * 0.34; ctx.shadowOffsetY = size * 0.05;
    const toks = []; let red = false;
    for (const part of text.split(/(\*)/)) {
      if (part === '*') { red = !red; continue; }
      for (const w of part.split(/( +|\n)/)) {
        if (w === '') continue;
        if (w === '\n') toks.push({ br: true }); else if (/^ +$/.test(w)) toks.push({ sp: true }); else toks.push({ w, red, width: ctx.measureText(w).width });
      }
    }
    const spW = ctx.measureText(' ').width, lines = [[]]; let lw = 0;
    for (const tk of toks) {
      let cur = lines[lines.length - 1];
      if (tk.br) { lines.push([]); lw = 0; continue; }
      if (tk.sp) { if (lw > 0) { cur.push(tk); lw += spW; } continue; }
      if (lw + tk.width > maxW && lw > 0 && !/^[.,!?:]/.test(tk.w)) { lines.push([]); cur = lines[lines.length - 1]; lw = 0; }
      cur.push(tk); lw += tk.width;
    }
    let y = cy - (lines.length - 1) * size * lh / 2;
    for (const line of lines) {
      while (line.length && line[line.length - 1].sp) line.pop();
      let w = 0; for (const tk of line) w += tk.sp ? spW : tk.width;
      let x = cx - w / 2;
      for (const tk of line) { if (tk.sp) { x += spW; continue; } ctx.fillStyle = tk.red ? RED : '#ffffff'; ctx.fillText(tk.w, x, y); x += tk.width; }
      y += size * lh;
    }
    ctx.restore();
  }
  function label(text, x, y, size, spacing, alpha, align = 'left', weight = 600) {
    if (alpha <= 0.002) return;
    ctx.save();
    ctx.globalAlpha = alpha; ctx.font = `${weight} ${size}px ${SANS}`; ctx.textBaseline = 'middle'; ctx.textAlign = align;
    try { ctx.letterSpacing = spacing + 'px'; } catch (e) { }
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 1;
    ctx.fillStyle = '#fff'; ctx.fillText(text, align === 'center' ? x + spacing / 2 : x, y);
    ctx.restore();
  }
  function hud(title, value, status, alpha, color = '#fff') {
    if (alpha <= 0.002) return;
    label(title, 46, 520, 12, 3.2, alpha * 0.9);
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = `44px ${SERIF}`; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2; ctx.fillText(value, 44, 560); ctx.restore();
    label(status, 46, 598, 10.5, 2.6, alpha * 0.85);
  }
  function caps(list, t, y = 916, size = 36) { for (const [a, b, s] of list) if (t > a - 0.05 && t < b + 0.05) rich(s, 360, y, size, 560, fade(t, a, b, 0.3)); }
  function endCard(t, t0, o) { // o: {title, fact, question, channel, dim}
    const dim = sstep(t0, t0 + 0.8, t) * (o.dim == null ? 0.74 : o.dim);
    ctx.fillStyle = `rgba(4,8,16,${dim})`; ctx.fillRect(0, 0, 720, 1280);
    const a1 = sstep(t0 + 0.4, t0 + 1.1, t), a2 = sstep(t0 + 0.9, t0 + 1.6, t), a3 = sstep(t0 + 1.5, t0 + 2.2, t), a4 = sstep(t0 + 2.0, t0 + 2.7, t);
    label('DRAMATIZAÇÃO', 360, 462, 14, 6, a1 * 0.85, 'center');
    rich(o.title, 360, 536, o.titleSize || 46, 680, a1, 1.3);
    rich(o.fact, 360, 668, 25, 550, a2, 1.35);
    rich(o.question, 360, 800, 28, 600, a3, 1.3);
    if (a4 > 0.002 && o.channel) {
      ctx.save(); ctx.font = `600 13.5px ${SANS}`; try { ctx.letterSpacing = '5px'; } catch (e) { }
      const nw = ctx.measureText(o.channel).width;
      ctx.globalAlpha = a4 * 0.85; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(370 - nw / 2 - 13, 872, 4.5, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      label(o.channel, 370, 872, 13.5, 5, a4 * 0.9, 'center');
    }
    const fout = sstep(DUR - 0.35, DUR - 0.02, t);
    if (fout > 0) { ctx.fillStyle = `rgba(0,0,0,${fout})`; ctx.fillRect(0, 0, 720, 1280); }
  }

  function wavBlob(a) { // áudio {sr, N, L, R} -> WAV PCM 16 bits estéreo
    const N = a.N, buf = new ArrayBuffer(44 + N * 4), dv = new DataView(buf);
    const txt = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    txt(0, 'RIFF'); dv.setUint32(4, 36 + N * 4, true); txt(8, 'WAVE'); txt(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, a.sr, true);
    dv.setUint32(28, a.sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); txt(36, 'data'); dv.setUint32(40, N * 4, true);
    for (let i = 0, o = 44; i < N; i++, o += 4) {
      dv.setInt16(o, Math.round(clamp(a.L[i] || 0, -1, 1) * 32767), true);
      dv.setInt16(o + 2, Math.round(clamp(a.R[i] || 0, -1, 1) * 32767), true);
    }
    return new Blob([buf], { type: 'audio/wav' });
  }

  function start(renderAt, synth, fileName) {
    const ui = { play: document.getElementById('play'), seek: document.getElementById('seek'), time: document.getElementById('time'), exp: document.getElementById('export'), status: document.getElementById('status') };
    let curT = 0, playing = false, lastNow = 0, actx = null, abuf = null, asrc = null, audioData = null;
    const getAudio = () => { if (!audioData) audioData = synth(DUR); return audioData; };
    const stopAudio = () => { if (asrc) { try { asrc.stop(); } catch (e) { } asrc = null; } };
    function startAudio() {
      if (!actx) actx = new AudioContext({ sampleRate: 48000 });
      if (!abuf) { const a = getAudio(); abuf = actx.createBuffer(2, a.N, a.sr); abuf.copyToChannel(a.L, 0); abuf.copyToChannel(a.R, 1); }
      stopAudio(); asrc = actx.createBufferSource(); asrc.buffer = abuf; asrc.connect(actx.destination); asrc.start(0, curT);
    }
    const setT = t => { curT = clamp(t, 0, DUR); ui.seek.value = curT; ui.time.textContent = curT.toFixed(1) + ' s'; renderAt(clamp(curT, 0, DUR - 1e-4)); };
    function tick(now) {
      if (!playing) return;
      curT += (now - lastNow) / 1000; lastNow = now;
      if (curT >= DUR) { curT = DUR; playing = false; stopAudio(); ui.play.textContent = '▶ Reproduzir'; }
      setT(curT); requestAnimationFrame(tick);
    }
    ui.play.onclick = () => {
      playing = !playing; ui.play.textContent = playing ? '⏸ Pausar' : '▶ Reproduzir';
      if (playing) { if (curT >= DUR - 0.05) curT = 0; lastNow = performance.now(); startAudio(); requestAnimationFrame(tick); } else stopAudio();
    };
    ui.seek.max = DUR; ui.seek.oninput = () => { playing = false; stopAudio(); ui.play.textContent = '▶ Reproduzir'; setT(parseFloat(ui.seek.value)); };

    window.__exp = { state: 'idle', frame: 0, total: Math.round(DUR * FPS), msg: '' };
    const yieldNow = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
    // Só quando o navegador não codifica AAC: salva o vídeo mudo e o áudio em WAV; o server.py junta em AAC com o ffmpeg.
    async function juntarComFfmpeg(buf, a, name) {
      const base = name.replace(/\.mp4$/i, ''), video = base + '.video.mp4', audio = base + '.audio.wav';
      const salvar = async (n, body) => { const r = await fetch('/save?name=' + encodeURIComponent(n), { method: 'POST', body }); if (!r.ok) throw new Error(`falha ao salvar ${n}: ${r.status}`); };
      await salvar(video, new Blob([buf], { type: 'video/mp4' }));
      await salvar(audio, wavBlob(a));
      window.__exp.state = 'muxing'; ui.status.textContent = 'Juntando vídeo e áudio (ffmpeg)...';
      const r = await fetch('/mux?' + new URLSearchParams({ video, audio, name }), { method: 'POST' });
      const txt = await r.text();
      if (!r.ok) throw new Error('falha ao juntar vídeo e áudio: ' + txt);
      return parseInt(txt, 10) || 0;
    }
    async function exportVideo(name = fileName) {
      const X = window.__exp; X.state = 'running'; X.msg = ''; X.frame = 0;
      playing = false; stopAudio();
      try {
        const total = X.total;
        // Com AAC (Chrome/Edge no Windows e no Mac) o áudio entra direto no MP4, como sempre.
        // Sem AAC (Chrome no Linux), sai o MP4 sem áudio + um WAV, e o server.py junta os dois com o ffmpeg.
        let aac = false;
        try { aac = (await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 })).supported === true; } catch (e) { }
        const muxer = new Mp4Muxer.Muxer({
          target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H, frameRate: FPS },
          ...(aac ? { audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 48000 } } : {}), fastStart: 'in-memory', firstTimestampBehavior: 'offset',
        });
        let err = null;
        const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { err = e; } });
        venc.configure({ codec: 'avc1.640028', width: W, height: H, bitrate: 7000000, framerate: FPS, latencyMode: 'quality' });
        for (let i = 0; i < total; i++) {
          if (err) throw err;
          renderAt(i / FPS);
          const frame = new VideoFrame(view, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
          venc.encode(frame, { keyFrame: i % 60 === 0 }); frame.close();
          X.frame = i + 1;
          if (i % 5 === 0) ui.status.textContent = `Renderizando ${Math.round((i + 1) / total * 100)}%`;
          while (venc.encodeQueueSize > 6) await yieldNow();
          if (i % 3 === 0) await yieldNow();
        }
        await venc.flush(); venc.close();
        X.state = 'audio'; ui.status.textContent = 'Gerando áudio...'; await yieldNow();
        const a = getAudio();
        if (aac) {
          const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { err = e; } });
          aenc.configure({ codec: 'mp4a.40.2', sampleRate: a.sr, numberOfChannels: 2, bitrate: 192000 });
          const CH = 4800;
          for (let o = 0; o < a.N; o += CH) {
            const n = Math.min(CH, a.N - o), data = new Float32Array(n * 2);
            data.set(a.L.subarray(o, o + n), 0); data.set(a.R.subarray(o, o + n), n);
            const ad = new AudioData({ format: 'f32-planar', sampleRate: a.sr, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(o / a.sr * 1e6), data });
            aenc.encode(ad); ad.close();
            if (aenc.encodeQueueSize > 20) await yieldNow();
          }
          await aenc.flush(); aenc.close();
        }
        if (err) throw err;
        muxer.finalize();
        const buf = muxer.target.buffer;
        X.state = 'saving'; X.bytes = buf.byteLength; ui.status.textContent = 'Salvando arquivo...';
        if (aac) {
          const res = await fetch('/save?name=' + encodeURIComponent(name), { method: 'POST', body: new Blob([buf], { type: 'video/mp4' }) });
          if (!res.ok) throw new Error('falha ao salvar: ' + res.status);
        } else X.bytes = await juntarComFfmpeg(buf, a, name);
        X.state = 'done'; ui.status.textContent = `Pronto: ${name} (${(X.bytes / 1048576).toFixed(1)} MB)`;
      } catch (e) {
        X.state = 'error'; X.msg = String(e && e.stack || e); ui.status.textContent = 'Erro: ' + e;
      }
      setT(curT);
    }
    ui.exp.onclick = () => { if (window.__exp.state !== 'running') exportVideo(); };
    window.exportVideo = exportVideo;
    window.synthNow = getAudio;
    window.snap = async (times, name, cw = 432, chh = 768) => { // depuracao: folha de quadros em debug/
      const c = document.createElement('canvas'); c.width = cw * times.length; c.height = chh; const g = c.getContext('2d');
      times.forEach((t, i) => { renderAt(t); g.drawImage(view, i * cw, 0, cw, chh); g.fillStyle = '#ff0'; g.font = '22px sans-serif'; g.fillText(t.toFixed(2) + 's', i * cw + 8, 26); });
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      const res = await fetch('/save?name=' + encodeURIComponent('debug/' + name + '.png'), { method: 'POST', body: blob });
      renderAt(clamp(curT, 0, DUR - 1e-4));
      return res.status;
    };
    setT(parseFloat(new URLSearchParams(location.search).get('t') || '0'));
    window.__ready = true;
  }
  return { view, ctx, W, H, S, FPS, RED, SERIF, SANS, mkCanvas, fade, vignette, glow, rich, label, hud, caps, endCard, start };
}
