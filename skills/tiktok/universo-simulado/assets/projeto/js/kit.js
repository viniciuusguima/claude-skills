'use strict';
// Pecas prontas para qualquer video: arvores/cones, riscos (chuva, vento, neve, fagulhas), brilho e bracos em primeira pessoa.
function coneTree(B, x, y, z, r, h, c, c2, sides = 6) {
  const top = { x, y: y + h, z, c: c2 || c };
  for (let i = 0; i < sides; i++) {
    const a0 = i / sides * 6.2832, a1 = (i + 1) / sides * 6.2832;
    B.tri({ x: x + Math.cos(a0) * r, y, z: z + Math.sin(a0) * r, c }, { x: x + Math.cos(a1) * r, y, z: z + Math.sin(a1) * r, c }, top);
  }
}
function blobTree(B, x, y, z, rx, ry, c, c2) { // octaedro
  const t = { x, y: y + ry, z, c: c2 || c }, b = { x, y: y - ry * 0.7, z, c };
  const p = [0, 1, 2, 3].map(i => ({ x: x + Math.cos(i * 1.5708 + x) * rx, y, z: z + Math.sin(i * 1.5708 + x) * rx, c }));
  for (let i = 0; i < 4; i++) { B.tri(p[i], p[(i + 1) % 4], t); B.tri(p[(i + 1) % 4], p[i], b); }
}

// ---------------------------------------------------------------- aviao

// Riscos que acompanham a camera. new Streaks(n, [caixaX, caixaY, caixaZ]); a cada quadro: update(t, camera.position, vx, vy, vz, comprimento, opacidade)
class Streaks {
  constructor(n, box) {
    this.n = n; this.box = box;
    const r = mulberry32(55); this.base = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) this.base[i] = r();
    this.pos = new Float32Array(n * 6);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.LineBasicMaterial({ color: 0xc4d2ea, transparent: true, opacity: 0.45, fog: false, depthWrite: false });
    this.obj = new THREE.LineSegments(geo, this.mat); this.obj.frustumCulled = false;
  }
  update(t, cam, vx, vy, vz, len, opacity) {
    const [bx, by, bz] = this.box, sp = Math.hypot(vx, vy, vz) || 1, dx = vx / sp, dy = vy / sp, dz = vz / sp, b = this.base, p = this.pos;
    const wrap = (v, m) => ((v % m) + m) % m;
    for (let i = 0; i < this.n; i++) {
      const x = wrap(b[i * 4] * bx + vx * t, bx) - bx / 2 + cam.x, y = wrap(b[i * 4 + 1] * by + vy * t, by) - by / 2 + cam.y, z = wrap(b[i * 4 + 2] * bz + vz * t, bz) - bz / 2 + cam.z;
      const l = len * (0.5 + b[i * 4 + 3]);
      p[i * 6] = x; p[i * 6 + 1] = y; p[i * 6 + 2] = z; p[i * 6 + 3] = x - dx * l; p[i * 6 + 4] = y - dy * l; p[i * 6 + 5] = z - dz * l;
    }
    this.obj.geometry.attributes.position.needsUpdate = true; this.mat.opacity = opacity; this.obj.visible = opacity > 0.01;
  }
}

// Textura de brilho radial para Sprites (sol, nebulosa, lampada)
function glowTexture(inner, outer) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 1, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
}

// Bracos em primeira pessoa: const arms = makeArms(); camera.add(arms.group);
// arms.set(i, [x,y,z], [rx,ry,rz], visivel) com i=0 esquerdo, 1 direito, em coordenadas da camera (z negativo = para a frente).
function makeArms() {
  const g = new THREE.Group(), shirt = col(0xf2f2ee), skin = col(0xe0aa84), skinD = col(0xc98e6c);
  const arms = [-1, 1].map(s => {
    const a = new THREE.Group(), B = new Builder();
    B.limb({ x: 0, y: 0, z: 0.14 }, { x: 0, y: 0, z: 0.0 }, 0.066, 0.06, shirt, shirt, 6, true);
    B.limb({ x: 0, y: 0, z: 0.0 }, { x: 0, y: 0, z: -0.47 }, 0.05, 0.04, skinD, skin, 6, true);
    B.geo(new THREE.BoxGeometry(0.086, 0.03, 0.1), M(0, 0, -0.52), skin);
    [-0.033, -0.011, 0.011, 0.033].forEach((fx, i) => B.geo(new THREE.BoxGeometry(0.018, 0.02, 0.078 - Math.abs(i - 1.5) * 0.008), M(fx * 1.15, 0, -0.605, 0, -fx * 6, 0), i % 2 ? skin : skinD));
    B.geo(new THREE.BoxGeometry(0.022, 0.022, 0.062), M(-s * 0.058, 0, -0.5, 0, s * 0.7, 0), skinD);
    a.add(B.mesh()); a.rotation.order = 'YXZ'; a.scale.setScalar(0.8); g.add(a);
    return a;
  });
  function set(i, p, r, vis) { const a = arms[i]; a.visible = vis; if (vis) { a.position.set(p[0], p[1], p[2]); a.rotation.set(r[0], r[1], r[2]); } }
  return { group: g, set };
}
