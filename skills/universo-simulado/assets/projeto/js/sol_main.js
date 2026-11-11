'use strict';
// "E se o Sol explodisse?": linha do tempo, camera, legendas e marcadores.
const DUR = SOL.DUR, T = SOL.T, PI = Math.PI, E = SOL.ENT, EP = SOL.EARTH;
const studio = makeStudio({ DUR });
const { ctx, W, H, S, rich, label, fade, mkCanvas } = studio;

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
const camera = new THREE.PerspectiveCamera(74, W / H, 0.05, 20000);
const scenes = { space: new THREE.Scene(), beach: new THREE.Scene(), shelter: new THREE.Scene() };
const space = buildSpace(scenes.space), beach = buildBeach(scenes.beach), shelter = buildShelter(scenes.shelter);
const arms = makeArms(); camera.add(arms.group);
const armLamp = new THREE.PointLight(0xffffff, 0.0, 2.5); armLamp.position.set(0, 0.1, -0.2); camera.add(armLamp);
const streaks = new Streaks(700, [14, 16, 14]);

const stairY = z => z < 0 ? 2.6 * clamp(-z / 6.2, 0, 1) : 0;
const RUN0 = 25.0, RUN1 = 30.4;
function camState(t) {
  const s = { scene: 'space', seg: 'sun', x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, look: null, heat: 0, after: false };
  if (t < T.beach) {
    const sh = t > T.boom ? 1.4 * Math.exp(-(t - T.boom) * 1.3) : 0.15 * sstep(1.0, T.boom, t);
    s.x = 0; s.y = 3 - 0.3 * t; s.z = 46 - 1.6 * t; s.look = [sh * wob(t * 21, 1), sh * wob(t * 17, 2), 0];
  } else if (t < T.shelter) {
    s.scene = 'beach'; s.heat = sstep(T.flash, T.flash + 0.15, t);
    const sh = 0.03 * Math.exp(-Math.max(0, t - T.flash) * 0.6) * s.heat + 0.006 * s.heat;
    if (t < T.run) {
      s.x = 0; s.z = 0; s.y = beachH(0, 0) + 1.62;
      s.yaw = kf(t, [[4.6, -0.5], [8, -0.35], [11, 0.1], [14, 0.42], [17, 0.44], [17.6, 0.2], [19.5, -0.7], [21.5, -0.9], [23.2, -0.2], [24.2, 0]]);
      s.pitch = kf(t, [[4.6, -0.02], [9, 0.0], [12, 0.12], [14.5, 0.38], [17, 0.42], [17.5, -0.15], [19.5, -0.08], [21, 0.02], [24.2, -0.05]]);
    } else {
      const u = clamp((t - RUN0) / (RUN1 - RUN0), 0, 1), k = u * u * (3 - 2 * u) * 0.35 + u * 0.65, d = sstep(RUN1, T.shelter, t);
      const bob = 0.06 * sstep(RUN0, RUN0 + 0.5, t), ph = (t - RUN0) * 3.0 * PI;
      s.x = lerp(0, E.x, k); s.z = lerp(0, E.z - 0.4, k) + 1.15 * d; s.y = beachH(s.x, Math.min(s.z, 17)) + 1.62 + bob * Math.abs(Math.sin(ph)) - 0.7 * d;
      s.yaw = kf(t, [[24.2, 0], [25.0, 3.366], [29.8, 3.366], [30.6, PI]]); s.pitch = -0.05 + bob * 0.25 * Math.sin(ph * 2); s.roll = bob * 0.3 * Math.sin(ph);
    }
    s.yaw += sh * wob(t * 19, 2); s.pitch += sh * wob(t * 23, 1);
  } else if (t < T.space2) {
    const z = kf(t, [[31.0, -5.6], [33.3, 1.8]]), sh = 0.012 + 0.02 * Math.exp(-Math.abs(t - 34.2) * 2);
    s.scene = 'shelter'; s.x = 0; s.z = z; s.y = stairY(z) + 1.6 + 0.03 * Math.abs(Math.sin((t - 31) * 2.8 * PI)) * (t < 33.3 ? 1 : 0);
    s.yaw = kf(t, [[31, PI], [33.2, PI], [34.3, 2 * PI]]) + sh * wob(t * 19, 2); s.pitch = kf(t, [[31, -0.38], [33, -0.05], [34.3, 0.22], [36.6, 0.2]]) + sh * wob(t * 23, 1); s.roll = sh * wob(t * 13, 4);
  } else if (t < T.shock) {
    const u = t - T.space2; s.seg = 'moon'; s.x = EP.x + 12 + 0.25 * u; s.y = 10 + 0.1 * u; s.z = 26 - 0.3 * u; s.look = [EP.x + 12, 14, 0];
  } else if (t < T.drift) {
    const sh = 1.2 * Math.exp(-Math.max(0, t - T.hit) * 1.4) * (t > T.hit ? 1 : 0);
    s.seg = 'shock'; s.x = EP.x - 4; s.y = 7; s.z = 36 - 0.5 * (t - T.shock); s.look = [EP.x + sh * wob(t * 21, 1), sh * wob(t * 17, 2), 0];
  } else if (t < T.back) {
    const u = t - T.drift; s.seg = 'drift'; s.x = 40; s.y = 300 - 4 * u; s.z = 340 - 5 * u; s.look = [60, 0, 70];
  } else if (t < T.after) {
    const z = kf(t, [[T.back, 1.6], [T.after, -5.4]]);
    s.scene = 'shelter'; s.after = true; s.x = 0; s.z = z; s.y = stairY(z) + 1.6 + 0.03 * Math.abs(Math.sin((t - T.back) * 2 * PI));
    s.yaw = 0.02 * Math.sin(t * 1.3); s.pitch = kf(t, [[T.back, 0.3], [T.after, 0.12]]);
  } else {
    const k = sstep(T.after, 60.5, t);
    s.scene = 'beach'; s.after = true; s.x = lerp(E.x, 2.5, k); s.z = lerp(E.z - 0.7, 9.5, k); s.y = beachH(s.x, s.z) + 1.62 + 0.025 * Math.abs(Math.sin((t - T.after) * 1.4 * PI)) * (1 - sstep(59.5, 60.5, t));
    s.yaw = kf(t, [[T.after, 0.05], [59, 0.2], [62, 0.43], [66, 0.4]]); s.pitch = kf(t, [[T.after, 0.0], [59, 0.12], [62, 0.36], [66, 0.3]]); s.roll = 0.01 * Math.sin(t * 0.8);
  }
  return s;
}

const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
function poseArms(t, cm) {
  for (let i = 0; i < 2; i++) {
    const s = i ? 1 : -1;
    if (cm.scene === 'beach' && !cm.after && t >= T.flash + 0.1 && t < T.run + 0.4) { // braco esquerdo protegendo os olhos
      const k = sstep(T.flash + 0.1, T.flash + 0.5, t) * (1 - sstep(T.run - 0.3, T.run + 0.4, t));
      arms.set(i, mix3([-0.16, -0.6, -0.05], [-0.24, -0.22, -0.3], k), [0.25 + 0.75 * k + 0.02 * Math.sin(t * 9), -0.62, -0.5], i === 0);
    } else if (cm.scene === 'beach' && !cm.after && t >= T.run + 0.4) { // correndo
      const ph = (t - RUN0) * 3.0 * PI + (i ? PI : 0);
      arms.set(i, [s * 0.2, -0.44, -0.04], [0.12 + 0.34 * Math.sin(ph), s * 0.12, s * 0.2], true);
    } else if (cm.scene === 'beach' && cm.after && t > 59.6) { // maos juntas, tremendo de frio
      const k = sstep(59.6, 61.0, t), sv = 0.012 * Math.sin(t * 41 + i);
      arms.set(i, [s * 0.1, -0.52 + 0.06 * k, -0.2], [-0.3 + 0.55 * k + sv, s * 0.2, s * 0.9 + sv], true);
    } else arms.set(i, null, null, false);
  }
}

function renderAt(t) {
  const cm = camState(t), sc = scenes[cm.scene];
  if (camera.parent !== sc) sc.add(camera);
  if (streaks.obj.parent !== sc) sc.add(streaks.obj);
  camera.position.set(cm.x, cm.y, cm.z);
  if (cm.look) { camera.rotation.order = 'XYZ'; camera.up.set(0, 1, 0); camera.lookAt(cm.look[0], cm.look[1], cm.look[2]); }
  else { camera.rotation.order = 'YXZ'; camera.rotation.set(cm.pitch, cm.yaw, cm.roll); }
  camera.updateMatrixWorld();
  poseArms(t, cm);
  let info = null;
  if (cm.scene === 'space') {
    info = space.update(t, cm.seg, camera);
    streaks.mat.color.setHex(0xffb060);
    streaks.update(t, camera.position, 70, 4, 0, 7, cm.seg === 'shock' ? 0.6 * sstep(T.hit - 0.3, T.hit + 0.3, t) : 0);
    armLamp.intensity = 0;
  } else if (cm.scene === 'beach') {
    beach.update(t, cm.heat, cm.after);
    if (cm.after) { streaks.mat.color.setHex(0xe8f0ff); streaks.update(t, camera.position, 0.7, -1.6, 0.4, 0.07, 0.75); }
    else { streaks.mat.color.setHex(0xffa040); streaks.update(t, camera.position, 1.5, 3.2, 0.6, 0.16, 0.7 * sstep(T.flash + 2.5, T.flash + 5, t)); }
    armLamp.intensity = cm.after ? 0.4 : 0;
  } else {
    shelter.update(t, cm.after);
    streaks.mat.color.setHex(0xb0a898); streaks.update(t, camera.position, 0.05, -0.5, 0.03, 0.05, 0.45);
    armLamp.intensity = 0;
  }
  renderer.render(sc, camera);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(glCanvas, 0, 0, W, H);
  ctx.setTransform(S, 0, 0, S, 0, 0);
  drawOverlay(t, cm, info);
}

// ---------------------------------------------------------------- efeitos 2D, legendas e marcadores
const tint = (r, g, b) => mkCanvas(256, 256, c => {
  const gr = c.createRadialGradient(128, 128, 2, 128, 128, 128);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(0.2, `rgba(${r},${g},${b},0.6)`); gr.addColorStop(0.55, `rgba(${r},${g},${b},0.16)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
});
const gWhite = tint(255, 255, 255), gWarm = tint(255, 190, 90), gOrange = tint(255, 120, 30), gCold = tint(190, 215, 255);
const pv = new V3();
function project(x, y, z) { pv.set(x, y, z).project(camera); return pv.z < 1 ? [(pv.x * 0.5 + 0.5) * 720, (-pv.y * 0.5 + 0.5) * 1280] : null; }
function glare(img, p, size, alpha) { if (!p || alpha <= 0.003) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, alpha); ctx.drawImage(img, p[0] - size / 2, p[1] - size / 2, size, size); ctx.restore(); }
const CAPS = [
  [5.0, 8.2, 'A luz do Sol leva *8 minutos* para chegar aqui.'],
  [8.6, 11.8, 'Por 8 minutos e 20 segundos, nada *muda*.'],
  [12.2, 15.8, 'Você olha para um Sol que não *existe* mais.'],
  [17.6, 20.4, 'Então o céu fica *branco*.'],
  [20.8, 24.0, 'O calor chega junto. Tudo começa a *queimar*.'],
  [24.4, 27.4, 'Corra para baixo da *terra*.'],
  [27.8, 30.8, 'Metros de solo e concreto são o único *escudo*.'],
  [31.6, 34.6, 'Lá fora, o mar começa a *ferver*.'],
  [36.9, 40.4, 'No lado da noite, a Lua vira um *farol*.'],
  [41.2, 44.2, 'Horas depois, chega a onda de *plasma*.'],
  [44.6, 47.2, 'Ela arranca a *atmosfera*.'],
  [47.8, 50.6, 'Sem o Sol, a Terra segue em linha *reta*.'],
  [51.0, 53.6, 'A 107 mil km/h, rumo ao *escuro*.'],
  [56.8, 59.8, 'Em uma semana, a superfície *congela*.'],
  [60.2, 63.0, 'Em um ano: 73 graus *negativos*.'],
  [63.3, 65.1, 'Não há mais *amanhecer*.'],
];
function hudState(t) {
  if (t >= T.beach + 0.2 && t < T.flash) {
    const rem = t < 14 ? 3 + 497 * Math.pow(1 - clamp((t - 5) / 9, 0, 1), 2.2) : Math.max(0, 17 - t), sec = Math.ceil(rem - 1e-6);
    return ['A LUZ CHEGA EM', `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, t < 14 ? 'TUDO PARECE NORMAL' : 'ÚLTIMOS SEGUNDOS', sstep(T.beach + 0.2, T.beach + 0.7, t), sec <= 3 ? '#ff5a4a' : '#fff'];
  }
  if (t >= T.flash + 0.3 && t < T.shelter) { const v = Math.round(31 + 150 * Math.pow(sstep(T.flash + 0.3, T.shelter, t), 1.2)); return ['TEMPERATURA', `${v} °C`, 'A EXPLOSÃO CHEGOU', sstep(T.flash + 0.3, T.flash + 0.8, t), v > 50 ? '#ff5a4a' : '#fff']; }
  if (t >= T.shelter && t < T.space2) return ['TEMPERATURA LÁ FORA', `${Math.round(lerp(182, 420, (t - T.shelter) / (T.space2 - T.shelter)))} °C`, 'VOCÊ ESTÁ NO ABRIGO', fade(t, T.shelter, T.space2, 0.3), '#ff5a4a'];
  if (t >= T.space2 && t < T.shock) { const m = Math.round(lerp(250, 4, sstep(T.space2 + 0.3, T.shock, t))); return ['ONDA DE PLASMA EM', `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`, 'LADO DA NOITE', fade(t, T.space2, T.shock, 0.3), '#fff']; }
  if (t >= T.shock && t < T.drift) return ['VELOCIDADE DA ONDA', '10.000 km/s', t < T.hit ? 'CHEGANDO À TERRA' : 'ATMOSFERA ARRANCADA', fade(t, T.shock, T.drift, 0.3), t < T.hit ? '#fff' : '#ff5a4a'];
  if (t >= T.drift && t < T.back) return ['VELOCIDADE DA TERRA', '107.000 km/h', 'SEM ÓRBITA', fade(t, T.drift, T.back, 0.3), '#fff'];
  if (t >= T.after + 0.3 && t < T.card) { const v = Math.round(lerp(8, -73, sstep(T.after + 0.4, 63, t))); return ['TEMPERATURA', `${v < 0 ? '−' : ''}${Math.abs(v)} °C`, t < 58.6 ? 'DIA 1' : t < 61 ? 'SEMANA 1' : 'ANO 1', fade(t, T.after + 0.3, T.card, 0.5), v < 0 ? '#a8d4ff' : '#fff']; }
  return null;
}
function drawOverlay(t, cm, info) {
  let white = 0;
  if (cm.scene === 'space' && cm.seg === 'sun') {
    const p = project(0, 0, 0), pre = sstep(0.9, T.boom, t), b = Math.max(0, t - T.boom);
    if (t < T.boom) { glare(gOrange, p, 720 + 500 * pre, 0.75); glare(gWarm, p, 420 + 240 * pre + 30 * Math.sin(t * 40) * pre, 0.9); }
    else { glare(gWarm, p, 900 + 2600 * (1 - Math.exp(-b * 1.5)), 0.95 * Math.exp(-b * 0.55)); glare(gWhite, p, 500 + 900 * b, Math.exp(-b * 1.1)); white = Math.exp(-b * 3.2); }
  } else if (cm.scene === 'space' && cm.seg === 'moon') {
    const fl = sstep(T.moon, T.moon + 0.25, t), p = project(info.moonPos.x, info.moonPos.y, info.moonPos.z);
    glare(gWhite, p, 240 + 520 * fl, 0.25 + 0.75 * fl); glare(gCold, p, 900 * fl, 0.6 * fl); white = 0.35 * Math.exp(-Math.max(0, t - T.moon) * 3) * (t > T.moon ? 1 : 0);
  } else if (cm.scene === 'space' && cm.seg === 'shock') {
    const b = Math.max(0, t - T.hit), p = project(EP.x, 0, 0);
    if (t > T.hit) { glare(gOrange, p, 700 + 500 * b, 0.9 * Math.exp(-b * 0.7)); white = 0.7 * Math.exp(-b * 4); }
    ctx.fillStyle = `rgba(255,120,40,${0.16 * sstep(T.hit - 0.4, T.hit + 0.2, t) * (1 - 0.6 * sstep(T.hit + 2, T.drift, t))})`; ctx.fillRect(0, 0, 720, 1280);
  } else if (cm.scene === 'beach') {
    const sp = project(cm.x + SOL.SUN.x * 800, cm.y + SOL.SUN.y * 800, cm.z + SOL.SUN.z * 800);
    if (!cm.after) {
      if (cm.heat < 0.01) { glare(gWarm, sp, 520, 0.9); glare(gWhite, sp, 230, 1); }
      else {
        const b = t - T.flash; glare(gWarm, sp, 1700, 0.8); glare(gWhite, sp, 800, 1); white = Math.max(Math.exp(-b * 1.6), 0);
        ctx.fillStyle = 'rgba(255,236,200,0.06)'; ctx.fillRect(0, 0, 720, 1280); ctx.fillStyle = 'rgba(255,150,50,0.07)'; ctx.fillRect(0, 0, 720, 1280);
      }
    } else {
      glare(gOrange, sp, 520, 0.35); glare(gWhite, sp, 60, 0.9);
      ctx.fillStyle = 'rgba(20,40,90,0.14)'; ctx.fillRect(0, 0, 720, 1280);
      for (let k = 0; k < 2; k++) { const u = ((t - 57.2 - k * 0.25) % 2.4) / 1.6; if (u > 0 && u < 1 && t > 57.2) glare(gCold, [360 + 40 * k - 20, 1100 - u * 260], 300 + u * 420, 0.3 * Math.sin(Math.PI * u)); }
    }
  } else if (cm.scene === 'shelter' && !cm.after) {
    ctx.fillStyle = `rgba(255,130,40,${0.05 + 0.03 * Math.sin(t * 31)})`; ctx.fillRect(0, 0, 720, 1280);
  }
  if (white > 0.003) { ctx.fillStyle = `rgba(255,252,240,${Math.min(1, white)})`; ctx.fillRect(0, 0, 720, 1280); }
  ctx.drawImage(studio.vignette, 0, 0, 720, 1280);
  // cortes: escurece rapido nas trocas de cena
  for (const c of [T.beach, T.shelter, T.space2, T.shock, T.drift, T.back, T.after]) { const d = Math.abs(t - c); if (d < 0.18) { ctx.fillStyle = `rgba(0,0,0,${(1 - d / 0.18) * 0.85})`; ctx.fillRect(0, 0, 720, 1280); } }
  if (t < T.card) {
    rich('E se o Sol\n*explodisse*?', 360, 330, 62, 660, 1 - sstep(4.0, 4.5, t), 1.2);
    studio.caps(CAPS, t);
    const h = hudState(t); if (h) studio.hud(h[0], h[1], h[2], h[3], h[4]);
  } else {
    studio.endCard(t, T.card, {
      title: 'SE O SOL EXPLODISSE', fact: 'Calma: o Sol não tem massa para explodir. Daqui a uns 5 bilhões de anos, ele vira uma gigante vermelha.',
      question: 'Onde você passaria os últimos *8 minutos*?', channel: 'UNIVERSO SIMULADO', dim: 0.66,
    });
  }
}
studio.start(renderAt, synthSol, 'sol.mp4');
