'use strict';
// Utilidades: matematica, keyframes, ruido e construtor de malhas low-poly.
const V3 = THREE.Vector3;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const sstep = (a, b, x) => smooth(clamp((x - a) / (b - a), 0, 1));
const col = h => new THREE.Color(h);

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// keys: [[t, v, ease?], ...]; ease da chave de destino: 'l' linear, 'i' ease-in, 'o' ease-out, padrao suave
function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const t0 = keys[i - 1][0], v0 = keys[i - 1][1], t1 = keys[i][0], v1 = keys[i][1], e = keys[i][2];
      let u = (t - t0) / (t1 - t0);
      u = e === 'l' ? u : e === 'i' ? u * u : e === 'o' ? 1 - (1 - u) * (1 - u) : smooth(u);
      return v0 + (v1 - v0) * u;
    }
  }
  return keys[keys.length - 1][1];
}

function hash2(ix, iz) {
  let h = Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = smooth(x - ix), fz = smooth(z - iz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fz) * 2 - 1;
}
function fbm(x, z) {
  return vnoise(x, z) * 0.6 + vnoise(x * 2.1 + 7.3, z * 2.1 - 3.1) * 0.3 + vnoise(x * 4.3 - 11, z * 4.3 + 5) * 0.1;
}
function wob(t, seed) {
  return Math.sin(t * 1.7 + seed) * 0.5 + Math.sin(t * 2.9 + seed * 2.3) * 0.3 + Math.sin(t * 4.3 + seed * 3.7) * 0.2;
}

function M(px, py, pz, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(
    new V3(px, py, pz),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new V3(sx, sy, sz));
}

const MAT = new THREE.MeshStandardMaterial({
  vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0, side: THREE.DoubleSide,
});

// Acumula triangulos coloridos; pontos sao {x,y,z,c}
class Builder {
  constructor() { this.pos = []; this.col = []; }
  tri(a, b, c) {
    for (const p of [a, b, c]) { this.pos.push(p.x, p.y, p.z); this.col.push(p.c.r, p.c.g, p.c.b); }
  }
  quad(a, b, c, d) { this.tri(a, b, c); this.tri(a, c, d); }
  loft(rings, { closed = true, capStart = false, capEnd = false } = {}) {
    for (let i = 0; i < rings.length - 1; i++) {
      const r0 = rings[i], r1 = rings[i + 1], n = r0.length, m = closed ? n : n - 1;
      for (let j = 0; j < m; j++) { const j2 = (j + 1) % n; this.quad(r0[j], r0[j2], r1[j2], r1[j]); }
    }
    if (capStart) this.cap(rings[0], capStart);
    if (capEnd) this.cap(rings[rings.length - 1], capEnd);
  }
  cap(ring, color) {
    const c = { x: 0, y: 0, z: 0, c: color === true ? ring[0].c : color }, n = ring.length;
    for (const p of ring) { c.x += p.x / n; c.y += p.y / n; c.z += p.z / n; }
    for (let j = 0; j < n; j++) {
      const a = ring[j], b = ring[(j + 1) % n];
      this.tri(c, color === true ? a : { ...a, c: c.c }, color === true ? b : { ...b, c: c.c });
    }
  }
  limb(p0, p1, r0, r1, c0, c1, sides = 5, caps = false) {
    const d = new V3(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z).normalize();
    const up = Math.abs(d.y) > 0.9 ? new V3(1, 0, 0) : new V3(0, 1, 0);
    const u = new V3().crossVectors(d, up).normalize(), v = new V3().crossVectors(d, u).normalize();
    const ring = (p, r, c) => {
      const a = [];
      for (let i = 0; i < sides; i++) {
        const an = i / sides * Math.PI * 2, cu = Math.cos(an) * r, sv = Math.sin(an) * r;
        a.push({ x: p.x + cu * u.x + sv * v.x, y: p.y + cu * u.y + sv * v.y, z: p.z + cu * u.z + sv * v.z, c });
      }
      return a;
    };
    c1 = c1 || c0;
    this.loft([ring(p0, r0, c0), ring(p1, r1, c1)], { capStart: caps ? c0 : false, capEnd: caps ? c1 : false });
  }
  geo(geometry, matrix, color) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    const p = g.attributes.position, v = new V3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const c = typeof color === 'function' ? color(v) : color;
      if (matrix) v.applyMatrix4(matrix);
      this.pos.push(v.x, v.y, v.z); this.col.push(c.r, c.g, c.b);
    }
  }
  pyr(x, y, z, s, h, c) {
    const a = { x: x - s, y, z: z - s, c }, b = { x: x + s, y, z: z - s, c }, d = { x: x + s, y, z: z + s, c },
      e = { x: x - s, y, z: z + s, c }, t = { x, y: y + h, z, c };
    this.tri(a, b, t); this.tri(b, d, t); this.tri(d, e, t); this.tri(e, a, t);
  }
  mesh(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals();
    return new THREE.Mesh(g, material || MAT);
  }
}
