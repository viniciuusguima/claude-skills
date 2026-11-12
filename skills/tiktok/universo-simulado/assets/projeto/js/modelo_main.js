'use strict';
// MODELO: copie para js/<slug>_main.js. Linha do tempo: camera, bracos, legendas, marcador e cartao final.
const DUR = ROTEIRO.DUR, T = ROTEIRO.T, PI = Math.PI;
const studio = makeStudio({ DUR });
const { ctx, W, H, S, rich, label, fade, mkCanvas } = studio;

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
const camera = new THREE.PerspectiveCamera(74, W / H, 0.05, 2000);
const scenes = { field: new THREE.Scene() };
const field = buildField(scenes.field);
const arms = makeArms(); camera.add(arms.group);
const streaks = new Streaks(500, [14, 16, 14]);

// Camera em funcao do tempo. yaw 0 olha para -z; frente = (-sin(yaw), 0, -cos(yaw)); pitch positivo olha para cima.
function camState(t) {
  const s = { scene: 'field', x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, look: null, danger: sstep(T.event, T.event + 0.3, t) };
  const walk = sstep(T.walk, T.event, t), bob = 0.05 * (t > T.walk && t < T.event ? 1 : 0), ph = (t - T.walk) * 2 * PI;
  const sh = 0.04 * Math.exp(-Math.max(0, t - T.event) * 1.2) * s.danger; // tremor depois do impacto
  s.z = -18 * walk; s.y = groundH(0, s.z) + 1.62 + bob * Math.abs(Math.sin(ph));
  s.yaw = kf(t, [[0, 0.35], [T.walk, 0], [T.event, 0], [T.event + 0.6, -0.5]]) + sh * wob(t * 19, 2);
  s.pitch = kf(t, [[0, 0.25], [T.walk, 0], [T.event, 0.02], [T.event + 0.5, 0.3]]) + sh * wob(t * 23, 1);
  return s;
}
function poseArms(t, cm) {
  for (let i = 0; i < 2; i++) {
    const s = i ? 1 : -1;
    if (t > T.walk + 0.3 && t < T.card) { const ph = (t - T.walk) * 2 * PI + (i ? PI : 0); arms.set(i, [s * 0.2, -0.44, -0.04], [0.1 + 0.2 * Math.sin(ph), s * 0.12, s * 0.2], true); }
    else arms.set(i, null, null, false);
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
  field.update(t, cm.danger);
  streaks.mat.color.setHex(0xffa040); streaks.update(t, camera.position, 1.5, 3, 0.5, 0.15, 0.6 * cm.danger); // fagulhas so depois do evento
  renderer.render(sc, camera);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(glCanvas, 0, 0, W, H);
  ctx.setTransform(S, 0, 0, S, 0, 0); // daqui em diante tudo e desenhado em coordenadas 720x1280
  drawOverlay(t, cm);
}

function hudState(t) { // [titulo, valor, estado, alfa, cor] ou null
  if (t >= T.walk && t < T.card) { const v = Math.max(0, T.event - t); return ['IMPACTO EM', v.toFixed(1).replace('.', ',') + ' s', t < T.event ? 'CAMINHANDO' : 'AGORA', fade(t, T.walk, T.card, 0.3), v < 1 ? '#ff5a4a' : '#fff']; }
  return null;
}
function drawOverlay(t, cm) {
  const white = Math.exp(-Math.max(0, t - T.event) * 3) * (t > T.event ? 0.8 : 0); // clarao do evento
  if (white > 0.003) { ctx.fillStyle = `rgba(255,252,240,${white})`; ctx.fillRect(0, 0, 720, 1280); }
  ctx.drawImage(studio.vignette, 0, 0, 720, 1280);
  for (const c of [T.walk]) { const d = Math.abs(t - c); if (d < 0.18) { ctx.fillStyle = `rgba(0,0,0,${(1 - d / 0.18) * 0.85})`; ctx.fillRect(0, 0, 720, 1280); } } // corte entre cenas
  if (t < T.card) {
    rich(ROTEIRO.titulo, 360, 330, 62, 660, 1 - sstep(ROTEIRO.tituloSai - 0.5, ROTEIRO.tituloSai, t), 1.2); // titulo
    studio.caps(ROTEIRO.legendas, t);
    const h = hudState(t); if (h) studio.hud(h[0], h[1], h[2], h[3], h[4]);
  } else {
    studio.endCard(t, T.card, { ...ROTEIRO.cartao, channel: 'UNIVERSO SIMULADO', dim: 0.66 });
  }
}
studio.start(renderAt, synthVideo, ROTEIRO.slug + '.mp4');
