'use strict';
// Video "E se o Sol explodisse?": espaco (Sol, Terra, Lua), praia e abrigo subterraneo.
const SOL = {
  DUR: ROTEIRO.DUR, T: ROTEIRO.T,                 // tempos e textos ficam em js/sol_roteiro.js
  SUN: new V3(-0.333, 0.616, -0.714).normalize(), // direcao do Sol no ceu da praia
  ENT: { x: 4, z: 17.6 },                          // entrada da passagem subterranea
  EARTH: new V3(2000, 0, 0),
};
function beachH(x, z) { return clamp((z + 12) * 0.045, -1.2, 1.35) + 0.04 * fbm(x * 0.3, z * 0.3) * sstep(-10, -4, z); }

// ---------------------------------------------------------------- bracos em primeira pessoa

// ---------------------------------------------------------------- espaco
function buildSpace(scene) {
  scene.background = new THREE.Color(0x02030a);
  const r = mulberry32(12);
  const sp = [];
  for (let i = 0; i < 2600; i++) { const u = r() * 2 - 1, a = r() * 6.2832, q = Math.sqrt(1 - u * u), R = 6000; sp.push(Math.cos(a) * q * R, u * R, Math.sin(a) * q * R); }
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xdde6ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.85 }));
  stars.frustumCulled = false; scene.add(stars);
  const colorize = (geo, fn) => { const p = geo.attributes.position, c = [], v = new V3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); const k = fn(v); c.push(k.r, k.g, k.b); } geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return geo; };
  // Sol
  const s1 = col(0xff9a18), s2 = col(0xfff0a0), s3 = col(0xc8560c);
  const sun = new THREE.Mesh(colorize(new THREE.IcosahedronGeometry(10, 7), v => { const n = fbm(v.x * 3 + v.y * 1.7, v.z * 3 - v.y * 2.1); return n < -0.42 ? s3.clone() : s1.clone().lerp(s2, clamp(0.5 + n, 0, 1)); }),
    new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true }));
  scene.add(sun);
  const add = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), new THREE.MeshBasicMaterial(Object.assign({ color: 0xffd9a0, side: THREE.DoubleSide }, add))); scene.add(shell);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 72), new THREE.MeshBasicMaterial(Object.assign({ color: 0xfff2d8, side: THREE.DoubleSide }, add))); scene.add(ring);
  const ND = 2600, dd = new Float32Array(ND * 4), dpos = new Float32Array(ND * 3);
  for (let i = 0; i < ND; i++) { const u = r() * 2 - 1, a = r() * 6.2832, q = Math.sqrt(1 - u * u); dd[i * 4] = Math.cos(a) * q; dd[i * 4 + 1] = u; dd[i * 4 + 2] = Math.sin(a) * q; dd[i * 4 + 3] = 6 + r() * r() * 70; }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const debris = new THREE.Points(dgeo, new THREE.PointsMaterial(Object.assign({ color: 0xffc070, size: 2.6, sizeAttenuation: false }, add))); debris.frustumCulled = false; scene.add(debris);
  // Terra, atmosfera, luzes das cidades e Lua
  const earth = new THREE.Group(); scene.add(earth);
  const oc = col(0x1b4f93), oc2 = col(0x2767ad), l1 = col(0x3f8a3c), l2 = col(0x9a8a52), ice = col(0xeef4fa);
  const landAt = v => fbm(v.x * 1.7 + v.y * 0.8, v.z * 1.7 - v.y * 1.1) + 0.35 * fbm(v.x * 4.3 + 3, v.z * 4.3 + v.y * 3) > -0.05;
  const globeMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const globe = new THREE.Mesh(colorize(new THREE.IcosahedronGeometry(8, 9), v => Math.abs(v.y) > 0.88 ? ice.clone() : landAt(v) ? l1.clone().lerp(l2, 0.5 + 0.5 * fbm(v.x * 6, v.z * 6 + v.y * 4)) : oc.clone().lerp(oc2, 0.5 + 0.5 * fbm(v.x * 5, v.y * 5 + v.z))), globeMat);
  earth.add(globe);
  const atmoMat = new THREE.MeshBasicMaterial(Object.assign({ color: 0x4a9cff, side: THREE.BackSide, opacity: 0.3 }, add));
  const atmo = new THREE.Mesh(new THREE.IcosahedronGeometry(8.35, 5), atmoMat); earth.add(atmo);
  const cp = [], v0 = new V3();
  for (let i = 0; i < 2500 && cp.length < 1500; i++) { const u = r() * 1.5 - 0.75, a = r() * 6.2832, q = Math.sqrt(1 - u * u); v0.set(Math.cos(a) * q, u, Math.sin(a) * q); if (v0.x > 0.05 && landAt(v0) && r() < 0.6) cp.push(v0.x * 8.03, v0.y * 8.03, v0.z * 8.03); }
  const cgeo = new THREE.BufferGeometry(); cgeo.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
  const cities = new THREE.Points(cgeo, new THREE.PointsMaterial({ color: 0xffc66a, size: 2.4, sizeAttenuation: false, transparent: true })); earth.add(cities);
  const m1 = col(0x9a9da3), m2 = col(0x6f7278);
  const moon = new THREE.Mesh(colorize(new THREE.IcosahedronGeometry(2.2, 5), v => m1.clone().lerp(m2, clamp(0.5 + fbm(v.x * 4, v.y * 4 + v.z * 3) * 1.3, 0, 1))), new THREE.MeshLambertMaterial({ vertexColors: true }));
  scene.add(moon);
  const sunL = new THREE.DirectionalLight(0xffffff, 1.3); sunL.position.set(-1, 0.12, 0.25); scene.add(sunL);
  const amb = new THREE.AmbientLight(0x1a2438, 0.6); scene.add(amb);
  const moonL = new THREE.PointLight(0xdfe8ff, 0, 200); scene.add(moonL);
  // frente de plasma + cauda da atmosfera
  const ftex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), rr = mulberry32(5);
    g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) { const x = rr() * 256, y = rr() * 256, s = 14 + rr() * 46, gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, `rgba(255,${150 + Math.floor(rr() * 100)},${40 + Math.floor(rr() * 110)},0.5)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - s, y - s, s * 2, s * 2); }
    return new THREE.CanvasTexture(c); })();
  const front = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshBasicMaterial(Object.assign({ map: ftex, side: THREE.DoubleSide, opacity: 0.75 }, add)));
  front.rotation.y = Math.PI / 2; scene.add(front);
  const NT = 1100, tb = new Float32Array(NT * 3), tpos = new Float32Array(NT * 3); for (let i = 0; i < NT * 3; i++) tb[i] = r();
  const tgeo = new THREE.BufferGeometry(); tgeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3));
  const tailMat = new THREE.PointsMaterial(Object.assign({ color: 0xff9a50, size: 2.6, sizeAttenuation: false, opacity: 0.8 }, add));
  const tail = new THREE.Points(tgeo, tailMat); tail.frustumCulled = false; scene.add(tail);
  // nebulosa (restos do Sol), orbita antiga e trajetoria em linha reta
  const neb = new THREE.Group(); scene.add(neb);
  const nt = glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.35)');
  [[0, 0, 0, 120, 0xfff0d0, 0.9], [18, 4, -10, 230, 0xff7a30, 0.55], [-30, -6, 20, 260, 0xff4a70, 0.4], [10, 10, 30, 330, 0x7a50ff, 0.25], [-12, -4, -34, 300, 0xff9a40, 0.35], [40, 2, 8, 200, 0xffc070, 0.3]].forEach(([x, y, z, s, c, o]) => {
    const spr = new THREE.Sprite(new THREE.SpriteMaterial(Object.assign({ map: nt, color: c, opacity: o }, add))); spr.position.set(x, y, z); spr.scale.set(s, s, 1); neb.add(spr);
  });
  const dash = (pts, color, opacity) => { const g2 = new THREE.BufferGeometry().setFromPoints(pts); const ln = new THREE.Line(g2, new THREE.LineDashedMaterial({ color, dashSize: 7, gapSize: 6, transparent: true, opacity })); ln.computeLineDistances(); scene.add(ln); return ln; };
  const orbit = dash(Array.from({ length: 181 }, (_, i) => new V3(Math.cos(i / 180 * 6.2832) * 150, 0, Math.sin(i / 180 * 6.2832) * 150)), 0x7f95c8, 0.6);
  const path = dash([new V3(150, 0, 0), new V3(150, 0, 520)], 0xf0503c, 0.9);
  const scorch = new THREE.Color(0.8, 0.52, 0.36), white = new THREE.Color(1, 1, 1), E = SOL.EARTH, T = SOL.T;

  function update(t, seg, cam) {
    stars.position.copy(cam.position);
    const isSun = seg === 'sun', isMoon = seg === 'moon', isShock = seg === 'shock', isDrift = seg === 'drift';
    // Sol e explosao
    const b = Math.max(0, t - T.boom);
    sun.visible = isSun && b < 2.4; shell.visible = ring.visible = debris.visible = isSun && t > T.boom;
    if (isSun) {
      const pre = sstep(0.9, T.boom, t);
      sun.rotation.y = t * 0.08; sun.scale.setScalar(t < T.boom ? 1 - 0.1 * pre + 0.015 * Math.sin(t * 40) * pre : 1 + 3.2 * (1 - Math.exp(-b * 2.2)));
      sun.material.opacity = t < T.boom ? 1 : Math.exp(-b * 1.6);
      shell.scale.setScalar(10 + b * 34); shell.material.opacity = 0.42 * Math.exp(-b * 1.1);
      ring.scale.setScalar(12 + b * 62); ring.material.opacity = 0.7 * Math.exp(-b * 0.9); ring.quaternion.copy(cam.quaternion);
      for (let i = 0; i < ND; i++) { const d = 9 + dd[i * 4 + 3] * b; dpos[i * 3] = dd[i * 4] * d; dpos[i * 3 + 1] = dd[i * 4 + 1] * d; dpos[i * 3 + 2] = dd[i * 4 + 2] * d; }
      dgeo.attributes.position.needsUpdate = true; debris.material.opacity = Math.min(1, b * 3) * Math.exp(-b * 0.35);
    }
    // Terra
    earth.visible = !isSun; moon.visible = isMoon || isShock; cities.visible = isMoon;
    front.visible = isShock; tail.visible = isShock && t > T.hit; neb.visible = orbit.visible = path.visible = isDrift;
    if (isMoon || isShock) {
      earth.position.copy(E); earth.scale.setScalar(1); earth.rotation.y = 0.5 + t * 0.01;
      if (isMoon) moon.position.set(E.x + 19, 27, -14); else moon.position.set(E.x + 46, 7, 9);
      const fl = isMoon ? sstep(T.moon, T.moon + 0.25, t) : 1;
      sunL.intensity = isMoon ? 1.3 + 3 * fl : 1.5; sunL.color.setRGB(1, 1, 1); amb.intensity = 0.6;
      moonL.position.copy(moon.position); moonL.intensity = isMoon ? 2.6 * fl : 0;
      const k = isShock ? sstep(T.hit, T.hit + 1.6, t) : 0;
      globeMat.color.copy(white).lerp(scorch, k);
      atmoMat.color.setRGB(lerp(0.29, 1, k), lerp(0.61, 0.5, k), lerp(1, 0.2, k)); atmoMat.opacity = lerp(0.3, 0.75, Math.sin(Math.PI * k)) * (1 - 0.8 * sstep(T.hit + 1.6, T.hit + 3.4, t)); atmo.scale.setScalar(1 + 0.12 * k);
      if (isShock) {
        front.position.set(E.x + lerp(-150, 190, (t - T.shock - 0.3) / 5.4), 0, 0); front.rotation.x = t * 0.15;
        const tt = Math.max(0, t - T.hit);
        for (let i = 0; i < NT; i++) { const u = (tb[i * 3] + tt * 0.45) % 1, a = tb[i * 3 + 1] * 6.2832, rad = (5 + u * 16) * (0.6 + 0.6 * tb[i * 3 + 2]); tpos[i * 3] = E.x + 4 + u * 80; tpos[i * 3 + 1] = Math.cos(a) * rad; tpos[i * 3 + 2] = Math.sin(a) * rad; }
        tgeo.attributes.position.needsUpdate = true; tailMat.opacity = 0.85 * Math.min(1, tt * 1.5) * (1 - 0.6 * sstep(T.hit + 2, T.drift, t));
      }
    } else if (isDrift) {
      earth.position.set(150, 0, lerp(10, 230, (t - T.drift) / (T.back - T.drift))); earth.scale.setScalar(3); earth.rotation.y = t * 0.05;
      globeMat.color.copy(scorch); atmoMat.opacity = 0.06; atmo.scale.setScalar(1);
      sunL.intensity = 1.5; sunL.color.setRGB(1, 0.7, 0.5); amb.intensity = 1.4; moonL.intensity = 0;
      neb.children.forEach((s, i) => { s.material.rotation = t * 0.02 * (i % 2 ? 1 : -1); });
    }
    return { moonPos: moon.position, earthPos: earth.position };
  }
  return { update };
}

// ---------------------------------------------------------------- praia
function buildBeach(scene) {
  const T = SOL.T, r = mulberry32(90);
  scene.background = new THREE.Color(0xbfe0f2); scene.fog = new THREE.Fog(0xbfe0f2, 90, 700);
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0xd9c79a, 0.85); scene.add(hemi);
  const sunL = new THREE.DirectionalLight(0xfff2d6, 0.9); sunL.position.copy(SOL.SUN).multiplyScalar(100); scene.add(sunL);
  const mk = () => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  const matSand = mk(), matBurn = mk(), matStatic = mk();
  const BS = new Builder(), BB = new Builder(), B = new Builder();
  // areia
  const sand = col(0xe6cd94), wet = col(0xb9a274);
  for (let x = -72; x < 72; x += 3) for (let z = -15; z < 18; z += 1.5) {
    const p = (px, pz) => ({ x: px, y: beachH(px, pz), z: pz }), a = p(x, z), b = p(x + 3, z), c = p(x + 3, z + 1.5), d = p(x, z + 1.5);
    const cc = wet.clone().lerp(sand, sstep(-11, -7.5, z + 0.75)).multiplyScalar(0.94 + 0.12 * hash2(x * 3, z * 7));
    BS.quad({ ...a, c: cc }, { ...b, c: cc }, { ...c, c: cc }, { ...d, c: cc });
  }
  // muro do calcadao com a entrada da passagem subterranea
  const conc = col(0xbdb8ae), concD = col(0x8f8b83), dark = col(0x050505), E = SOL.ENT, top = 4.2;
  const wall = (x0, x1, y0, y1, c) => B.quad({ x: x0, y: y0, z: 18, c }, { x: x1, y: y0, z: 18, c }, { x: x1, y: y1, z: 18, c: conc }, { x: x0, y: y1, z: 18, c: conc });
  wall(-72, E.x - 1.4, 1.0, top, concD); wall(E.x + 1.4, 72, 1.0, top, concD); wall(E.x - 1.4, E.x + 1.4, 3.7, top, conc);
  B.quad({ x: E.x - 1.4, y: 1.2, z: 18.6, c: dark }, { x: E.x + 1.4, y: 1.2, z: 18.6, c: dark }, { x: E.x + 1.4, y: 3.7, z: 18.6, c: dark }, { x: E.x - 1.4, y: 3.7, z: 18.6, c: dark });
  for (const s of [-1, 1]) B.geo(new THREE.BoxGeometry(0.25, 2.6, 0.7), M(E.x + s * 1.5, 2.4, 18.2), concD);
  B.geo(new THREE.BoxGeometry(3.4, 0.25, 0.8), M(E.x, 3.8, 18.15), concD);
  B.quad({ x: -72, y: top, z: 18, c: conc }, { x: 72, y: top, z: 18, c: conc }, { x: 72, y: top, z: 32, c: concD }, { x: -72, y: top, z: 32, c: concD });
  for (let x = -70; x <= 70; x += 2.5) B.limb({ x, y: top, z: 18.2 }, { x, y: top + 1.0, z: 18.2 }, 0.05, 0.05, concD, concD, 4);
  B.limb({ x: -70, y: top + 1.0, z: 18.2 }, { x: 70, y: top + 1.0, z: 18.2 }, 0.05, 0.05, concD, concD, 4);
  // predios ao fundo
  const pastel = [0xf2d9b8, 0xe8b9a0, 0xbcd9e8, 0xf0e6c8, 0xd9c0e0, 0xc8e0c0];
  for (let x = -66; x < 70; x += 11 + r() * 6) {
    const w = 8 + r() * 4, h = 6 + r() * 12, c = col(pastel[Math.floor(r() * 6)]), win = col(0x5f7f9a);
    B.geo(new THREE.BoxGeometry(w, h, 8), M(x, top + h / 2, 36), c);
    for (let fy = 1.6; fy < h - 1; fy += 2.6) for (let fx = -w / 2 + 1.2; fx < w / 2 - 0.8; fx += 1.9) B.quad({ x: x + fx, y: top + fy, z: 31.95, c: win }, { x: x + fx + 1, y: top + fy, z: 31.95, c: win }, { x: x + fx + 1, y: top + fy + 1.3, z: 31.95, c: win }, { x: x + fx, y: top + fy + 1.3, z: 31.95, c: win });
  }
  // coqueiros, guarda-sois, toalhas, posto de salva-vidas
  const emit = [], trunk = col(0x8a6b45), lf1 = col(0x3f9a3a), lf2 = col(0x2f7f32);
  function palm(x, z, h, lean) {
    const y = z >= 18 ? top : beachH(x, z), p1 = { x: x + lean * 0.35, y: y + h * 0.5, z }, c = { x: x + lean, y: y + h, z };
    B.limb({ x, y: y - 0.2, z }, p1, 0.24, 0.19, trunk, trunk, 5); B.limb(p1, c, 0.19, 0.14, trunk, trunk, 5);
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * 6.2832 + r(), dx = Math.cos(a), dz = Math.sin(a), wx = -dz * 0.34, wz = dx * 0.34, col1 = k % 2 ? lf1 : lf2;
      const m = { x: c.x + dx * 1.7, y: c.y + 0.45, z: c.z + dz * 1.7 }, tip = { x: c.x + dx * 3.4, y: c.y - 1.0, z: c.z + dz * 3.4, c: lf2 };
      BB.quad({ x: c.x - wx, y: c.y, z: c.z - wz, c: col1 }, { x: c.x + wx, y: c.y, z: c.z + wz, c: col1 }, { x: m.x + wx, y: m.y, z: m.z + wz, c: col1 }, { x: m.x - wx, y: m.y, z: m.z - wz, c: col1 });
      BB.tri({ x: m.x - wx, y: m.y, z: m.z - wz, c: col1 }, { x: m.x + wx, y: m.y, z: m.z + wz, c: col1 }, tip);
    }
    emit.push({ x: c.x, y: c.y, z: c.z, s: 1.5, t0: T.flash + 2.4 + r() * 2.5 });
  }
  [[-6.5, 7, 6.5, 1.2], [9, 11, 7.5, -1.4], [-12, 13.5, 6, 0.8], [13.5, 5, 7, 1.6], [-2.5, 15, 5.5, -0.9], [-22, 9, 7, 1.0], [24, 12, 6.5, -1.2]].forEach(p => palm(p[0], p[1], p[2], p[3]));
  for (let x = -60; x <= 60; x += 13) if (Math.abs(x - E.x) > 5) palm(x + r() * 3, 22 + r() * 3, 6 + r() * 2, (r() - 0.5) * 2);
  const uc = [[0xe04a3a, 0xf5efe0], [0x2f7fd0, 0xf5efe0], [0xf2b632, 0xe9703a], [0x2fa58a, 0xf5efe0]];
  [[-3.5, -3.5], [5, -1.5], [-9, 1.5], [10.5, -5], [7, 4.5], [-16, -5.5]].forEach(([x, z], i) => {
    const y = beachH(x, z), c = uc[i % 4];
    B.limb({ x, y, z }, { x: x + 0.15, y: y + 2.1, z }, 0.035, 0.035, col(0xf0f0f0), col(0xf0f0f0), 4);
    coneTree(BB, x + 0.15, y + 1.85, z, 1.55, 0.55, col(c[0]), col(c[1]), 8);
    const tw = col([0x3a8fd0, 0xe85a70, 0xf0c040, 0x60c090][i % 4]); B.quad({ x: x + 0.4, y: y + 0.03, z: z + 0.2, c: tw }, { x: x + 1.3, y: y + 0.03, z: z + 0.2, c: tw }, { x: x + 1.3, y: y + 0.04, z: z + 2.0, c: tw }, { x: x + 0.4, y: y + 0.04, z: z + 2.0, c: tw });
    emit.push({ x: x + 0.15, y: y + 1.9, z, s: 0.9, t0: T.flash + 1.6 + r() * 3 });
  });
  { const x = -13, z = -2.5, y = beachH(x, z), wd = col(0xf2ede2), rd = col(0xd8402f);
    for (const [ax, az] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) B.limb({ x: x + ax * 1.1, y, z: z + az * 1.1 }, { x: x + ax * 0.9, y: y + 2.4, z: z + az * 0.9 }, 0.07, 0.07, wd, wd, 4);
    B.geo(new THREE.BoxGeometry(2.4, 0.15, 2.4), M(x, y + 2.4, z), wd); BB.geo(new THREE.BoxGeometry(2.2, 1.5, 2.0), M(x, y + 3.2, z), wd); coneTree(BB, x, y + 3.95, z, 1.9, 0.8, rd, rd, 4);
    emit.push({ x, y: y + 4.2, z, s: 1.2, t0: T.flash + 3.2 });
  }
  const mSand = BS.mesh(matSand), mBurn = BB.mesh(matBurn), mStatic = B.mesh(matStatic);
  for (const m of [mSand, mBurn, mStatic]) { m.frustumCulled = false; scene.add(m); }
  // placa da passagem
  const sign = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#1f5f3a'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#fff'; g.font = '600 46px "Segoe UI", Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PASSAGEM SUBTERRÂNEA', 256, 50);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.48), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })); m.position.set(E.x, 4.0, 17.72); m.rotation.y = Math.PI; scene.add(m); return m; })();
  // mar
  const wg = new THREE.PlaneGeometry(520, 420, 70, 56); wg.rotateX(-Math.PI / 2); wg.translate(0, 0, -219);
  { const p = wg.attributes.position, c = [], n1 = col(0x3fc1c9), n2 = col(0x1f7fb0), n3 = col(0x16578f); for (let i = 0; i < p.count; i++) { const z = p.getZ(i), k = z > -60 ? n1.clone().lerp(n2, sstep(-12, -60, z)) : n2.clone().lerp(n3, sstep(-60, -260, z)); c.push(k.r, k.g, k.b); } wg.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); }
  const seaMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.35, metalness: 0.05 });
  const sea = new THREE.Mesh(wg, seaMat); sea.frustumCulled = false; scene.add(sea);
  // ceu de dia, ceu em chamas, nuvens, estrelas e nebulosa
  const dg = new THREE.SphereGeometry(900, 24, 40); { const p = dg.attributes.position, c = [], a = col(0xb9e2f5), b = col(0x4f9fe0), d = col(0x2a6fc8); for (let i = 0; i < p.count; i++) { const e = p.getY(i) / 900, k = e < 0.02 ? a : e < 0.35 ? a.clone().lerp(b, (e - 0.02) / 0.33) : b.clone().lerp(d, Math.min(1, (e - 0.35) / 0.5)); c.push(k.r, k.g, k.b); } dg.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); }
  const dome = new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })); dome.renderOrder = -10; scene.add(dome);
  const hot = new THREE.Mesh(new THREE.SphereGeometry(880, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff3d2, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0 })); hot.renderOrder = -9; scene.add(hot);
  const clouds = new THREE.Group(); { const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, fog: false }), cg = new THREE.IcosahedronGeometry(1, 2);
    for (let i = 0; i < 26; i++) { const cx = (r() - 0.5) * 1300, cz = -250 - r() * 500, cy = 110 + r() * 90; for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(cg, cm), s = 18 + r() * 26; m.position.set(cx + (r() - 0.5) * 60, cy + r() * 8, cz + (r() - 0.5) * 30); m.scale.set(s * 1.5, s * 0.55, s); clouds.add(m); } } } scene.add(clouds);
  const sp = []; for (let i = 0; i < 1800; i++) { const u = r(), a = r() * 6.2832, q = Math.sqrt(1 - u * u); sp.push(Math.cos(a) * q * 850, u * 850, Math.sin(a) * q * 850); }
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xdde6ff, size: 2.2, sizeAttenuation: false, fog: false })); stars.frustumCulled = false; scene.add(stars);
  const neb = new THREE.Group(), nt = glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.3)');
  [[0, 0, 90, 0xfff0d8, 0.9], [30, 20, 260, 0xff7a38, 0.5], [-40, -10, 330, 0xff4a78, 0.35], [10, -30, 420, 0x7a58ff, 0.22]].forEach(([x, y, s, c, o]) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: nt, color: c, opacity: o, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.position.copy(SOL.SUN).multiplyScalar(800).add(new V3(x, y, 0)); m.scale.set(s, s, 1); neb.add(m); });
  scene.add(neb);
  // fogo e vapor
  const NF = emit.length * 9, fire = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.26), new THREE.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), NF);
  fire.frustumCulled = false; scene.add(fire);
  const NS = 70, steam = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }), NS), sb = [];
  for (let i = 0; i < NS; i++) sb.push([(r() - 0.5) * 160, -16 - r() * r() * 150, r(), 0.5 + r()]);
  steam.frustumCulled = false; scene.add(steam);
  const d = new THREE.Object3D(), cA = new THREE.Color(), cB = new THREE.Color();
  const mixC = (m, a, b, k) => m.setRGB(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k));

  function update(t, heat, after) {
    dome.visible = !after; hot.visible = !after && heat > 0.01; hot.material.opacity = heat * 0.8;
    clouds.visible = !after && t < T.flash + 0.05; stars.visible = neb.visible = after; sign.visible = true;
    if (after) { scene.background.setRGB(0.008, 0.012, 0.03); scene.fog.color.setRGB(0.02, 0.03, 0.06); scene.fog.near = 40; scene.fog.far = 420; }
    else { mixC(scene.fog.color, [0.75, 0.88, 0.95], [1, 0.95, 0.82], heat); scene.background.copy(scene.fog.color); scene.fog.near = 90; scene.fog.far = lerp(700, 260, heat); }
    sunL.intensity = after ? 0.3 : 0.9 + 1.0 * heat; sunL.color.setRGB(1, after ? 0.62 : 0.95, after ? 0.5 : 0.84);
    hemi.intensity = after ? 0.8 : 0.85 + 0.15 * heat; hemi.color.setHex(after ? 0x56699c : 0xcfe8ff); hemi.groundColor.setHex(after ? 0x0b0f18 : 0xd9c79a);
    const burn = after ? 1 : sstep(T.flash + 2.2, T.flash + 9, t);
    mixC(matBurn.color, [1, 1, 1], [0.1, 0.085, 0.07], burn);
    mixC(matSand.color, [1, 1, 1], after ? [0.95, 1.05, 1.25] : [1.0, 0.93, 0.78], after ? 1 : heat);
    mixC(matStatic.color, [1, 1, 1], after ? [0.6, 0.66, 0.8] : [1.0, 0.93, 0.8], after ? 1 : heat);
    mixC(seaMat.color, [1, 1, 1], after ? [1.25, 1.5, 1.7] : [1.25, 1.2, 1.05], after ? 1 : heat * 0.8); seaMat.roughness = after ? 0.6 : 0.35;
    const p = wg.attributes.position, amp = after ? 0 : 0.13 + 0.12 * heat;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, after ? 0.05 + 0.1 * hash2(Math.round(x), Math.round(z)) : amp * (Math.sin(x * 0.33 + t * 1.3) * Math.cos(z * 0.29 + t * 1.05) + 0.5 * Math.sin((x + z) * 0.8 + t * 2.1)) * sstep(-10, -22, z) + 0.03 * Math.sin(x * 0.9 + t * 2)); }
    p.needsUpdate = true;
    let n = 0;
    for (const e of emit) for (let k = 0; k < 9; k++, n++) {
      const on = !after && t > e.t0 && t < T.shelter + 0.5, u = (t * 1.25 + k * 0.371 + e.x) % 1, g = on ? Math.min(1, (t - e.t0) * 0.7) : 0;
      d.position.set(e.x + Math.sin(k * 7 + t * 3.1) * 0.5 * e.s, e.y - 0.3 + u * 2.6 * e.s, e.z + Math.cos(k * 5 + t * 2.7) * 0.5 * e.s);
      d.scale.setScalar(Math.max(0.0001, e.s * (1 - u) * 2.1 * g)); d.rotation.set(t * 3 + k, t * 2 + k * 2, 0); d.updateMatrix(); fire.setMatrixAt(n, d.matrix);
    }
    fire.instanceMatrix.needsUpdate = true; fire.visible = !after;
    const sv = after ? 0 : sstep(T.flash + 3.2, T.flash + 6.5, t);
    for (let i = 0; i < NS; i++) { const s = sb[i], u = (t * 0.22 * s[3] + s[2]) % 1; d.position.set(s[0] + u * 6, 0.5 + u * 26, s[1]); d.scale.setScalar(Math.max(0.0001, (1.5 + u * 7) * sv)); d.rotation.set(0, 0, 0); d.updateMatrix(); steam.setMatrixAt(i, d.matrix); }
    steam.instanceMatrix.needsUpdate = true; steam.visible = sv > 0.01; steam.material.opacity = 0.3 * sv;
  }
  return { update };
}

// ---------------------------------------------------------------- abrigo (passagem subterranea)
function buildShelter(scene) {
  scene.background = new THREE.Color(0x030405); scene.fog = new THREE.Fog(0x030405, 4, 26);
  const amb = new THREE.AmbientLight(0x30343c, 0.5); scene.add(amb);
  const B = new Builder(), c1 = col(0x74767a), c2 = col(0x56585c), c3 = col(0x3e4044), pipe = col(0x6a4a3a), W2 = 1.6, HH = 2.7;
  // escada: da abertura (z=-6.2, y=2.6) ate o piso (z=0, y=0)
  for (let k = 0; k < 13; k++) { const z0 = -6.2 + k * 0.477, y = 2.6 - k * 0.2; B.geo(new THREE.BoxGeometry(W2 * 2, 0.2, 0.48), M(0, y - 0.1, z0 + 0.24), k % 2 ? c1 : c2); }
  const sideWall = s => { B.quad({ x: s * W2, y: -0.2, z: -6.4, c: c2 }, { x: s * W2, y: -0.2, z: 16, c: c3 }, { x: s * W2, y: HH + 2.8, z: 16, c: c3 }, { x: s * W2, y: HH + 2.8, z: -6.4, c: c1 }); };
  sideWall(-1); sideWall(1);
  B.quad({ x: -W2, y: 0, z: 0, c: c2 }, { x: W2, y: 0, z: 0, c: c2 }, { x: W2, y: 0, z: 16, c: c3 }, { x: -W2, y: 0, z: 16, c: c3 });
  B.quad({ x: -W2, y: HH, z: -0.6, c: c2 }, { x: W2, y: HH, z: -0.6, c: c2 }, { x: W2, y: HH, z: 16, c: c3 }, { x: -W2, y: HH, z: 16, c: c3 });
  B.quad({ x: -W2, y: HH, z: -0.6, c: c2 }, { x: W2, y: HH, z: -0.6, c: c2 }, { x: W2, y: 5.3, z: -6.4, c: c1 }, { x: -W2, y: 5.3, z: -6.4, c: c1 });
  B.quad({ x: -W2, y: 0, z: 16, c: c3 }, { x: W2, y: 0, z: 16, c: c3 }, { x: W2, y: HH, z: 16, c: c3 }, { x: -W2, y: HH, z: 16, c: c3 });
  B.quad({ x: -W2, y: 5.0, z: -6.4, c: c1 }, { x: W2, y: 5.0, z: -6.4, c: c1 }, { x: W2, y: 5.4, z: -6.4, c: c1 }, { x: -W2, y: 5.4, z: -6.4, c: c1 });
  for (const s of [-1, 1]) B.limb({ x: s * 1.25, y: HH - 0.18, z: -0.4 }, { x: s * 1.25, y: HH - 0.18, z: 16 }, 0.07, 0.07, pipe, pipe, 6);
  B.geo(new THREE.BoxGeometry(0.45, 0.08, 2.2), M(-1.3, 0.48, 7), col(0x5a4634)); for (const z of [6.1, 7.9]) B.geo(new THREE.BoxGeometry(0.4, 0.46, 0.1), M(-1.3, 0.23, z), c3);
  const mesh = B.mesh(); mesh.frustumCulled = false; scene.add(mesh);
  // abertura para o lado de fora
  const outMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const out = new THREE.Mesh(new THREE.PlaneGeometry(W2 * 2, 2.5), outMat); out.position.set(0, 3.8, -6.35); scene.add(out);
  const outL = new THREE.PointLight(0xffe2b0, 2, 22); outL.position.set(0, 3.6, -5.6); scene.add(outL);
  // lampadas e placa
  const lamps = [3.5, 10].map(z => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.22), new THREE.MeshBasicMaterial({ color: 0xfff6e0, fog: false })); m.position.set(0, HH - 0.04, z); scene.add(m); const l = new THREE.PointLight(0xfff0d0, 0.9, 9); l.position.set(0, HH - 0.3, z); scene.add(l); return { m, l }; });
  { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#0d3f22'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#5dff9a'; g.font = '700 58px "Segoe UI", Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ABRIGO', 128, 50);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.42), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), fog: false })); m.position.set(1.58, 1.9, 2.2); m.rotation.y = -Math.PI / 2; scene.add(m); }
  function update(t, after) {
    const T = SOL.T;
    if (after) { outMat.color.setRGB(0.05, 0.07, 0.14); outL.color.setRGB(0.45, 0.55, 0.9); outL.intensity = 0.5; lamps.forEach(L => { L.m.material.color.setRGB(0.05, 0.05, 0.05); L.l.intensity = 0; }); amb.intensity = 0.35; return; }
    const fl = 0.8 + 0.2 * Math.sin(t * 31) * Math.sin(t * 7.3);
    outMat.color.setRGB(1, 0.93 * fl, 0.72 * fl); outL.color.setRGB(1, 0.85, 0.6); outL.intensity = 3.2 * fl; amb.intensity = 0.5;
    lamps.forEach((L, i) => { const dead = t > T.shelter + 4.2 + i * 0.25, fk = dead ? 0 : (t > T.shelter + 2.6 ? ((Math.sin(t * 47 + i * 2) > -0.2) ? 1 : 0.15) : 1); L.m.material.color.setRGB(fk, 0.96 * fk, 0.88 * fk); L.l.intensity = 0.9 * fk; });
  }
  return { update };
}
