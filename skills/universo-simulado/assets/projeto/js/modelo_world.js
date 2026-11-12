'use strict';
// MODELO: copie para js/<slug>_world.js. Aqui fica a construcao das cenas 3D; os tempos vem de ROTEIRO (js/<slug>_roteiro.js).
function groundH(x, z) { return 0.25 * fbm(x * 0.08, z * 0.08); }

function buildField(scene) {
  const r = mulberry32(7);
  scene.background = new THREE.Color(0xbfe0f2); scene.fog = new THREE.Fog(0xbfe0f2, 40, 260);
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x8a9a6a, 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d6, 0.9); sun.position.set(-40, 80, -60); scene.add(sun);
  const B = new Builder(), g1 = col(0x6fae4e), g2 = col(0x86bf5a);
  for (let x = -60; x < 60; x += 4) for (let z = -120; z < 20; z += 4) { // chao em quadrados de cor variada
    const p = (px, pz) => ({ x: px, y: groundH(px, pz), z: pz }), c = g1.clone().lerp(g2, hash2(x, z));
    B.quad({ ...p(x, z), c }, { ...p(x + 4, z), c }, { ...p(x + 4, z + 4), c }, { ...p(x, z + 4), c });
  }
  for (let i = 0; i < 60; i++) { // arvores, deixando livre o corredor por onde a camera anda (|x| < 3)
    const x = (r() - 0.5) * 110, z = -115 + r() * 125; if (Math.abs(x) < 3) continue;
    const y = groundH(x, z), h = 3 + r() * 3;
    B.limb({ x, y, z }, { x, y: y + h * 0.4, z }, 0.18, 0.14, col(0x6b4a2f));
    coneTree(B, x, y + h * 0.3, z, 1.3, h, col(0x2f7f3a), col(0x4fa04a));
  }
  const mesh = B.mesh(); mesh.frustumCulled = false; scene.add(mesh);
  function update(t, danger) { // danger 0..1: o ceu escurece e avermelha no evento
    scene.background.setRGB(lerp(0.75, 0.35, danger), lerp(0.88, 0.2, danger), lerp(0.95, 0.18, danger)); scene.fog.color.copy(scene.background);
    hemi.intensity = 0.9 - 0.4 * danger; sun.color.setRGB(1, 0.95 - 0.5 * danger, 0.84 - 0.6 * danger);
  }
  return { update };
}
