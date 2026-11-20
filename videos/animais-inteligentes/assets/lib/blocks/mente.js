/**
 * mente.js — peças do vídeo "E se os animais fossem tão inteligentes quanto os humanos?".
 * Bichos que faltam em animals.js (corvo, cão, vaca, galinhas instanciadas), cérebros de pontos (neurônios),
 * palcos (diagrama escuro, fundo do mar), skyline barato com janelas acesas e texto 2D no canvas (rótulos presos ao 3D).
 *
 *   const c = MENTE.corvo();  S.add(c.group);  c.update(t, { cabeca, vira, inclina, bico, voa, corpo })
 *   c.ponta                    Object3D na ponta do bico (getWorldPosition para prender o arame)
 *   const d = MENTE.cao();     d.update(t, { passo, cabeca, vira, cauda, orelha })
 *   const v = MENTE.vaca();    v.update(t, { passo, cabeca })
 *   const g = MENTE.galinhas(S, { n, seed, area: [x0, x1, z0, z1] });  g.update(t)
 *   const b = MENTE.cerebro(S, { tipo: "humano"|"elefante"|"corvo", pontos: { cortex, cerebelo }, seed });
 *        b.update(t, { fill: { cortex: 0..1, cerebelo: 0..1 }, cor: { cortex, cerebelo }, pisca, casca })
 *   MENTE.palcoDiagrama(st)    fundo escuro + grade azul + poeira (cenas de diagrama)
 *   MENTE.mar(st, { fundo })   água: céu degradê, raios de luz, neve marinha. Devolve { update(t) }
 *   MENTE.skyline(S, { n, seed, raio })  prédios instanciados com janelas acesas (material .win, emissiveIntensity)
 *   MENTE.glow(cor, s)         sprite aditivo (brilho)
 *   await MENTE.fontes()       garante Inter / JetBrains Mono no canvas
 *   MENTE.proj(v3, cam)        posição 3D -> [x, y] em px (1080x1920)
 *   MENTE.texto(ctx, { x, y, k, v, u, a, tam, alin, cor })   kicker mono azul + valor Inter 800 em degradê
 * Convenção: bichos olham para +x, pés em y = 0 (como animals.js).
 */
import * as THREE from "../three.module.js";
import { M, mesh } from "./toy.js";
import { mulberry32, clamp, lerp, ease } from "../kit.js";

const rg = (t, a, b) => clamp((t - a) / (b - a));
const S16 = new THREE.SphereGeometry(1, 16, 12);
const S10 = new THREE.SphereGeometry(1, 10, 8);
const _cap = new Map();
function capGeo(r, len) {
  const k = r.toFixed(3) + "/" + len.toFixed(3);
  if (!_cap.has(k)) { const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 4, 10); g.translate(0, -len / 2, 0); _cap.set(k, g); }
  return _cap.get(k);
}
const CONE = (() => { const g = new THREE.ConeGeometry(1, 1, 12); g.translate(0, 0.5, 0); return g; })();
function blob(p, c, s, pos, geo = S16) { const m = mesh(geo, c, p); m.scale.set(...s); m.position.set(...pos); return m; }
function piv(p, pos, rz = 0) { const g = new THREE.Group(); g.position.set(...pos); g.rotation.z = rz; p.add(g); return g; }
function limb(p, pos, len, r, c, rz = 0) { const g = piv(p, pos, rz); mesh(capGeo(r, len), c, g); return g; }

/* ---------- brilho ---------- */
let _gt = null;
export function glowTex() {
  if (_gt) return _gt;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  _gt = new THREE.CanvasTexture(c); return _gt;
}
export function glow(cor = 0x7cc8ff, s = 1, op = 1) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: cor, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
  sp.scale.setScalar(s); return sp;
}

/* ---------- corvo ---------- */
export function corvo({ cor = 0x141419, fase = 0 } = {}) {
  const P = M(cor, 0.32, { metalness: 0.15, envMapIntensity: 0.9 });
  const PB = M(0x0c0c10, 0.25, { metalness: 0.2 });
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  const tronco = piv(body, [0, 0.25, 0], 0.32);
  blob(tronco, P, [0.19, 0.105, 0.1], [0, 0, 0]);
  blob(tronco, P, [0.11, 0.1, 0.095], [0.1, 0.02, 0]);
  const tail = piv(tronco, [-0.17, 0.0, 0], -0.22);
  blob(tail, P, [0.15, 0.016, 0.055], [-0.1, 0, 0]);
  const wings = [1, -1].map((s) => {
    const w = piv(tronco, [0.04, 0.05, s * 0.085]);
    blob(w, P, [0.16, 0.03, 0.06], [-0.07, 0, s * 0.02]);
    const tip = piv(w, [-0.18, 0, s * 0.02]);
    blob(tip, PB, [0.12, 0.012, 0.045], [-0.06, 0, 0]);
    w.userData.tip = tip; return w;
  });
  const neck = piv(body, [0.14, 0.33, 0]);
  blob(neck, P, [0.075, 0.07, 0.065], [0, -0.02, 0]);
  const head = piv(neck, [0.02, 0.04, 0]);
  blob(head, P, [0.078, 0.07, 0.068], [0, 0, 0]);
  blob(head, P, [0.05, 0.03, 0.05], [0.04, 0.035, 0]); // testa
  const bico = mesh(CONE, PB, head); bico.scale.set(0.024, 0.13, 0.02); bico.rotation.z = -Math.PI / 2 - 0.08; bico.position.set(0.05, 0.0, 0);
  const jaw = piv(head, [0.05, -0.012, 0]);
  const bj = mesh(CONE, PB, jaw); bj.scale.set(0.016, 0.11, 0.016); bj.rotation.z = -Math.PI / 2 + 0.05;
  const ponta = new THREE.Object3D(); ponta.position.set(0.175, -0.012, 0); head.add(ponta);
  const olhoM = M(0x241811, 0.08, { metalness: 0.1 });
  const brilho = M(0xffffff, 0.2, { emissive: 0xffffff, emissiveIntensity: 0.5 });
  for (const s of [1, -1]) {
    blob(head, olhoM, [0.017, 0.017, 0.012], [0.035, 0.022, s * 0.056], S10);
    blob(head, brilho, [0.0028, 0.0028, 0.0028], [0.04, 0.03, s * 0.064], S10);
  }
  const legs = [1, -1].map((s) => {
    const l = limb(body, [0.0, 0.17, s * 0.04], 0.165, 0.011, 0x1d1d22);
    for (const a of [-0.5, 0, 0.5]) { const toe = piv(l, [0, -0.16, 0]); toe.rotation.y = a; const tt = mesh(capGeo(0.007, 0.06), 0x1d1d22, toe); tt.rotation.z = -Math.PI / 2; }
    const tr = piv(l, [0, -0.16, 0]); const tt = mesh(capGeo(0.007, 0.04), 0x1d1d22, tr); tt.rotation.z = Math.PI / 2;
    return l;
  });
  function update(t, o = {}) {
    const id = Math.sin(t * 2.3 + fase * 6.28);
    tronco.scale.y = 1 + id * 0.015;
    tronco.rotation.z = 0.32 + (o.corpo ?? 0);
    neck.rotation.z = (o.pescoco ?? 0);
    head.rotation.z = (o.cabeca ?? 0) + id * 0.02;
    head.rotation.y = o.vira ?? 0;
    head.rotation.x = o.inclina ?? 0;
    jaw.rotation.z = -(o.bico ?? 0) * 0.35;
    const v = o.voa ?? 0;
    wings.forEach((w, i) => {
      const s = i ? -1 : 1, fl = v ? Math.sin(t * v * 6.283 + fase * 6) : 0;
      w.rotation.x = v ? s * (0.6 + fl * 0.9) : s * -0.05;
      w.userData.tip.rotation.x = v ? s * Math.sin(t * v * 6.283 + fase * 6 - 0.7) * 0.5 : 0;
    });
    tail.rotation.z = -0.22 + Math.sin(t * 1.7 + fase) * 0.04;
  }
  update(0);
  return { group: g, body, head, neck, tronco, wings, legs, ponta, update };
}

/* ---------- cão ---------- */
export function cao({ cor = 0xc8995c, cor2 = 0xe9d2a8, fase = 0 } = {}) {
  const C = M(cor, 0.85), C2 = M(cor2, 0.85);
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [0.42, 0.19, 0.17], [0, 0.58, 0]);
  blob(body, C2, [0.2, 0.17, 0.15], [0.24, 0.55, 0]);
  const legs = [[0.27, 0.1], [0.27, -0.1], [-0.28, 0.1], [-0.28, -0.1]].map(([x, z]) => {
    const l = limb(body, [x, 0.52, z], 0.5, 0.055, C); blob(l, C2, [0.07, 0.035, 0.06], [0.03, -0.49, 0], S10); return l;
  });
  const neck = piv(body, [0.36, 0.66, 0], -0.5);
  blob(neck, C, [0.1, 0.16, 0.11], [0.0, 0.08, 0]);
  const head = piv(body, [0.46, 0.86, 0]);
  blob(head, C, [0.15, 0.135, 0.125], [0, 0, 0]);
  blob(head, C2, [0.12, 0.065, 0.08], [0.14, -0.05, 0]);
  blob(head, M(0x1b1512, 0.3), [0.03, 0.025, 0.035], [0.255, -0.03, 0], S10);
  const ears = [1, -1].map((s) => { const e = piv(head, [-0.02, 0.07, s * 0.11]); e.rotation.x = s * 0.25; blob(e, M(0xa87a45, 0.85), [0.045, 0.11, 0.035], [-0.01, -0.07, s * 0.015]); return e; });
  const olho = M(0x1a120c, 0.1), br = M(0xffffff, 0.2, { emissive: 0xffffff, emissiveIntensity: 0.9 });
  for (const s of [1, -1]) { blob(head, olho, [0.022, 0.022, 0.016], [0.105, 0.035, s * 0.065], S10); blob(head, br, [0.005, 0.005, 0.005], [0.122, 0.045, s * 0.07], S10); }
  const tail = limb(body, [-0.4, 0.66, 0], 0.34, 0.03, C, -2.2);
  function update(t, o = {}) {
    const f = o.passo ?? 0, ph = t * f * 6.283 + fase * 6.28;
    legs.forEach((L, i) => { const off = ((i % 2) ^ (i >> 1)) * Math.PI; L.rotation.z = f ? Math.sin(ph + off) * 0.45 : 0; });
    body.position.y = f ? Math.abs(Math.sin(ph)) * 0.02 : 0;
    const id = Math.sin(t * 2.0 + fase * 6.28);
    body.scale.y = 1 + id * 0.01;
    head.rotation.z = (o.cabeca ?? 0) + id * 0.03;
    head.rotation.y = o.vira ?? 0;
    head.rotation.x = o.inclina ?? 0;
    tail.rotation.x = Math.sin(t * 9 + fase) * (o.cauda ?? 0.3);
    tail.rotation.z = -2.2 + (o.caudaBaixa ?? 0);
    ears.forEach((e, i) => { e.rotation.x = (i ? -1 : 1) * (0.25 + (o.orelha ?? 0)); });
  }
  update(0);
  return { group: g, body, head, legs, tail, update };
}

/* ---------- vaca ---------- */
export function vaca({ fase = 0, cor = 0xece6dc, mancha = 0x24211f } = {}) {
  const C = M(cor, 0.85), K = M(mancha, 0.85), r = mulberry32(17 + Math.floor(fase * 100));
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [0.78, 0.42, 0.38], [0, 1.08, 0]);
  for (let i = 0; i < 6; i++) { const x = (r() - 0.5) * 1.1, a = r() * 6.28; blob(body, K, [0.22 + r() * 0.12, 0.18, 0.16], [x, 1.1 + Math.sin(a) * 0.26, Math.cos(a) * 0.26]); }
  const legs = [[0.5, 0.2], [0.5, -0.2], [-0.5, 0.2], [-0.5, -0.2]].map(([x, z]) => { const l = limb(body, [x, 0.9, z], 0.88, 0.085, C); blob(l, K, [0.09, 0.06, 0.09], [0, -0.86, 0], S10); return l; });
  const head = piv(body, [0.82, 1.28, 0]);
  blob(head, C, [0.27, 0.19, 0.17], [0.05, 0, 0]);
  blob(head, K, [0.16, 0.12, 0.175], [0.0, 0.05, 0]);
  blob(head, M(0xd99a90, 0.6), [0.11, 0.1, 0.14], [0.27, -0.07, 0]);
  for (const s of [1, -1]) {
    const h = mesh(CONE, M(0xe8dcc0, 0.5), head); h.scale.set(0.03, 0.12, 0.03); h.position.set(-0.05, 0.13, s * 0.12); h.rotation.x = -s * 0.7;
    blob(head, C, [0.05, 0.035, 0.1], [-0.06, 0.06, s * 0.2]);
    blob(head, M(0x17120f, 0.1), [0.025, 0.025, 0.02], [0.15, 0.05, s * 0.13], S10);
  }
  const tail = limb(body, [-0.78, 1.3, 0], 0.7, 0.025, C, -0.25);
  function update(t, o = {}) {
    const f = o.passo ?? 0, ph = t * f * 6.283 + fase * 6.28;
    legs.forEach((L, i) => { const off = ((i % 2) ^ (i >> 1)) * Math.PI; L.rotation.z = f ? Math.sin(ph + off) * 0.35 : 0; });
    head.rotation.z = (o.cabeca ?? 0) + Math.sin(t * 1.4 + fase * 6) * 0.04;
    head.rotation.y = o.vira ?? 0;
    tail.rotation.x = Math.sin(t * 2.2 + fase * 5) * 0.3;
  }
  update(0);
  return { group: g, head, update };
}

/* ---------- galinhas instanciadas (perto) ---------- */
export function galinhas(S, { n = 120, seed = 5, area = [-8, 8, -8, 8], cores = [0xf3ede2, 0xe9dcc6, 0xb8743d] } = {}) {
  const r = mulberry32(seed);
  const gB = new THREE.SphereGeometry(1, 8, 6), gH = new THREE.SphereGeometry(1, 7, 5), gC = new THREE.BoxGeometry(1, 1, 1), gK = new THREE.ConeGeometry(1, 1, 4);
  gK.rotateZ(-Math.PI / 2); gK.translate(0.5, 0, 0);
  const mB = M(0xffffff, 0.9), mR = M(0xc8302a, 0.6), mK = M(0xe0a63a, 0.5), mE = M(0x111111, 0.2);
  const body = new THREE.InstancedMesh(gB, mB, n), head = new THREE.InstancedMesh(gH, mB, n), tail = new THREE.InstancedMesh(gH, mB, n);
  const comb = new THREE.InstancedMesh(gC, mR, n), beak = new THREE.InstancedMesh(gK, mK, n), eye = new THREE.InstancedMesh(gH, mE, n * 2);
  const all = [body, head, tail, comb, beak, eye];
  all.forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; S.add(m); });
  const D = [];
  for (let i = 0; i < n; i++) {
    const c = new THREE.Color(cores[r() < 0.7 ? 0 : r() < 0.6 ? 1 : 2]);
    body.setColorAt(i, c); head.setColorAt(i, c); tail.setColorAt(i, c.clone().multiplyScalar(0.92));
    D.push({ x: lerp(area[0], area[1], r()), z: lerp(area[2], area[3], r()), ry: r() * 6.28, s: 0.85 + r() * 0.3, ph: r() * 10, pf: 0.4 + r() * 0.5 });
  }
  const o = new THREE.Object3D(), b = new THREE.Matrix4(), q = new THREE.Matrix4();
  const set = (im, i, base, x, y, z, sx, sy, sz, rz = 0) => { o.position.set(x, y, z); o.rotation.set(0, 0, rz); o.scale.set(sx, sy, sz); o.updateMatrix(); q.multiplyMatrices(base, o.matrix); im.setMatrixAt(i, q); };
  function update(t, { olha = null } = {}) {
    D.forEach((d, i) => {
      let ry = d.ry + Math.sin(t * 0.5 + d.ph) * 0.3;
      if (olha) ry = lerp(ry, Math.atan2(-(olha[1] - d.z), olha[0] - d.x), olha[2] ?? 1);
      o.position.set(d.x, 0, d.z); o.rotation.set(0, ry, 0); o.scale.setScalar(d.s * 0.32); o.updateMatrix(); b.copy(o.matrix);
      const pk = Math.max(0, Math.sin(t * 6.283 * d.pf + d.ph)) ** 6; // bicando o chão
      const hx = 0.62 + pk * 0.25, hy = 1.55 - pk * 0.9;
      set(body, i, b, 0, 0.85, 0, 0.62, 0.5, 0.45, 0.15);
      set(tail, i, b, -0.55, 1.2, 0, 0.28, 0.45, 0.16, 0.5);
      set(head, i, b, hx, hy, 0, 0.24, 0.26, 0.22);
      set(comb, i, b, hx - 0.02, hy + 0.26, 0, 0.22, 0.16, 0.06);
      set(beak, i, b, hx + 0.18, hy - 0.02, 0, 0.16, 0.08, 0.08);
      set(eye, i * 2, b, hx + 0.12, hy + 0.06, 0.15, 0.04, 0.04, 0.04);
      set(eye, i * 2 + 1, b, hx + 0.12, hy + 0.06, -0.15, 0.04, 0.04, 0.04);
    });
    all.forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  }
  update(0);
  return { update, D, meshes: all };
}

/* ---------- cérebro de pontos ---------- */
const FRES_V = `varying vec3 vN; varying vec3 vV;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const FRES_F = `uniform vec3 cor; uniform float op; varying vec3 vN; varying vec3 vV;
void main(){ float r = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); gl_FragColor = vec4(cor * (0.08 + r * 1.2) * op, 1.0); }`;
export function cascaMat(cor = 0x7cc8ff, op = 0.6) {
  return new THREE.ShaderMaterial({ uniforms: { cor: { value: new THREE.Color(cor) }, op: { value: op } }, vertexShader: FRES_V, fragmentShader: FRES_F,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide });
}
// elipsoide "enrugado" (giros) para a casca
function giroGeo(seed, amp = 0.035, seg = [48, 32]) {
  const g = new THREE.SphereGeometry(1, seg[0], seg[1]), p = g.attributes.position, v = new THREE.Vector3(), r = mulberry32(seed);
  const f = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const w = Math.sin(v.x * 17 + f[0]) * Math.sin(v.y * 15 + f[1]) + Math.sin(v.z * 19 + v.x * 7 + f[2]) * 0.6;
    v.multiplyScalar(1 + amp * w); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}
const FORMAS = {
  humano: { cortex: { c: [0, 0.08, 0], r: [0.62, 0.46, 0.5], casca: true }, cerebelo: { c: [-0.42, -0.34, 0], r: [0.24, 0.15, 0.32] }, tronco: { c: [-0.12, -0.45, 0], r: [0.08, 0.2, 0.08] } },
  elefante: { cortex: { c: [0.1, 0.1, 0], r: [0.86, 0.56, 0.74], casca: true }, cerebelo: { c: [-0.7, -0.38, 0], r: [0.42, 0.3, 0.6] }, tronco: { c: [-0.3, -0.6, 0], r: [0.12, 0.28, 0.12] } },
  corvo: { cortex: { c: [0.02, 0.02, 0], r: [0.2, 0.14, 0.17], casca: true }, cerebelo: { c: [-0.16, -0.06, 0], r: [0.07, 0.07, 0.07] }, tronco: { c: [-0.1, -0.12, 0], r: [0.035, 0.06, 0.035] } },
};
export function cerebro(S, { tipo = "humano", pontos = { cortex: 600, cerebelo: 600 }, seed = 3, tam = 0.06, cores = { cortex: 0x7cc8ff, cerebelo: 0x7cc8ff }, casca = 0x7cc8ff } = {}) {
  const F = FORMAS[tipo], r = mulberry32(seed);
  const group = new THREE.Group(); S.add(group);
  const reg = {}, pos = [], ord = [];
  for (const nome of ["cortex", "cerebelo"]) {
    const n = pontos[nome] || 0, f = F[nome], a = pos.length / 3;
    for (let i = 0; i < n; i++) {
      let x, y, z, d;
      do { x = r() * 2 - 1; y = r() * 2 - 1; z = r() * 2 - 1; d = x * x + y * y + z * z; } while (d > 1 || (nome === "cortex" && (d < 0.45 || Math.abs(z) < 0.06)));
      pos.push(f.c[0] + x * f.r[0], f.c[1] + y * f.r[1], f.c[2] + z * f.r[2]); ord.push(r());
    }
    reg[nome] = [a, pos.length / 3];
  }
  const N = pos.length / 3;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const col = new Float32Array(N * 3); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: tam, map: glowTex(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  pts.frustumCulled = false; group.add(pts);
  const cascas = [];
  for (const nome of ["cortex", "cerebelo", "tronco"]) {
    const f = F[nome], m = new THREE.Mesh(giroGeo(seed + nome.length, nome === "cortex" ? 0.035 : 0.05, nome === "tronco" ? [16, 10] : [48, 28]), cascaMat(casca, 0.55));
    m.scale.set(...f.r.map((v) => v * 1.04)); m.position.set(...f.c); group.add(m); cascas.push(m);
  }
  const ph = Array.from({ length: N }, () => r() * 6.28);
  const cA = new THREE.Color(), cB = new THREE.Color();
  function update(t, { fill = { cortex: 1, cerebelo: 1 }, cor = {}, brilho = { cortex: 1, cerebelo: 1 }, pisca = 0.35, casca: co = 1 } = {}) {
    for (const nome of ["cortex", "cerebelo"]) {
      const [a, b] = reg[nome], k = fill[nome] ?? 1, bri = brilho[nome] ?? 1;
      cA.set(cor[nome] ?? cores[nome]);
      for (let i = a; i < b; i++) {
        const on = clamp((k * 1.08 - ord[i]) / 0.08);
        const fl = 1 - pisca + pisca * (0.5 + 0.5 * Math.sin(t * 7 + ph[i] * 3));
        const v = on * fl * bri;
        col[i * 3] = cA.r * v; col[i * 3 + 1] = cA.g * v; col[i * 3 + 2] = cA.b * v;
      }
    }
    geo.attributes.color.needsUpdate = true;
    cascas.forEach((m) => { m.material.uniforms.op.value = 0.55 * co; m.visible = co > 0.01; });
  }
  update(0);
  return { group, pts, cascas, reg, update, F };
}

/* ---------- palcos ---------- */
export function palcoDiagrama(st, { grade = true, poeira = 400, seed = 9, y = -1.2 } = {}) {
  const S = st.scene;
  st.hemi.intensity = 0.25; st.key.intensity = 1.2; st.rim.intensity = 0.6;
  if (grade) {
    const gr = new THREE.GridHelper(40, 40, 0x2a5a80, 0x173450); gr.position.y = y;
    gr.material.transparent = true; gr.material.opacity = 0.35; gr.material.depthWrite = false; S.add(gr);
  }
  const r = mulberry32(seed), p = new Float32Array(poeira * 3);
  for (let i = 0; i < poeira; i++) { p[i * 3] = (r() - 0.5) * 16; p[i * 3 + 1] = (r() - 0.3) * 10; p[i * 3 + 2] = (r() - 0.5) * 16; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x5f9fd0, size: 0.035, map: glowTex(), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  S.add(pts);
  return { pts, update(t) { pts.rotation.y = t * 0.02; pts.position.y = Math.sin(t * 0.3) * 0.1; } };
}

export function mar(st, { seed = 4, neve = 900, raios = 7, fundo = -3, cx = 0, cz = 0 } = {}) {
  const S = st.scene, r = mulberry32(seed);
  st.hemi.color.set(0x7fd0ff); st.hemi.groundColor.set(0x0a2a3a); st.hemi.intensity = 0.9;
  st.key.color.set(0xbfe8ff); st.key.intensity = 2.2; st.rim.color.set(0x4fb0e0); st.rim.intensity = 0.8;
  const areia = mesh(new THREE.PlaneGeometry(220, 220, 40, 40), 0x8a8a70, S, 0.95);
  const ap = areia.geometry.attributes.position;
  for (let i = 0; i < ap.count; i++) ap.setZ(i, Math.sin(ap.getX(i) * 0.31) * Math.cos(ap.getY(i) * 0.27) * 0.35 + Math.sin(ap.getX(i) * 1.3 + ap.getY(i)) * 0.06);
  areia.geometry.computeVertexNormals(); areia.rotation.x = -Math.PI / 2; areia.position.set(cx, fundo, cz); areia.castShadow = false;
  for (let i = 0; i < 16; i++) {
    const m = mesh(new THREE.DodecahedronGeometry(1, 0), 0x55605a, S, 0.95); m.scale.set(0.5 + r() * 1.4, 0.3 + r() * 0.8, 0.5 + r() * 1.2);
    const a = r() * 6.28, d = 4 + r() * 22; m.position.set(cx + Math.cos(a) * d, fundo, cz + Math.sin(a) * d); m.rotation.set(r(), r() * 3, r());
  }
  // raios de luz entrando pela superfície
  const c = document.createElement("canvas"); c.width = 32; c.height = 256;
  const gx = c.getContext("2d"), gr = gx.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "rgba(200,240,255,0.9)"); gr.addColorStop(1, "rgba(200,240,255,0)"); gx.fillStyle = gr; gx.fillRect(0, 0, 32, 256);
  const hz = gx.createLinearGradient(0, 0, 32, 0); hz.addColorStop(0, "rgba(0,0,0,1)"); hz.addColorStop(0.5, "rgba(0,0,0,0)"); hz.addColorStop(1, "rgba(0,0,0,1)");
  gx.globalCompositeOperation = "destination-out"; gx.fillStyle = hz; gx.fillRect(0, 0, 32, 256);
  const rt = new THREE.CanvasTexture(c), R = [];
  for (let i = 0; i < raios; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rt, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    m.scale.set(1.5 + r() * 3, 26, 1); m.position.set(cx + (r() - 0.5) * 24, 9, cz - 4 - r() * 14); m.rotation.set(0, (r() - 0.5) * 0.6, 0.25 + (r() - 0.5) * 0.15);
    m.userData.ph = r() * 6; S.add(m); R.push(m);
  }
  const p = new Float32Array(neve * 3), v0 = [];
  for (let i = 0; i < neve; i++) { p[i * 3] = cx + (r() - 0.5) * 24; p[i * 3 + 1] = fundo + r() * 14; p[i * 3 + 2] = cz + (r() - 0.5) * 24; v0.push([p[i * 3], p[i * 3 + 1], p[i * 3 + 2], r()]); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfefff, size: 0.05, map: glowTex(), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  pts.frustumCulled = false; S.add(pts);
  return {
    areia, raios: R, pts,
    update(t) {
      R.forEach((m) => { m.material.opacity = 0.12 + 0.08 * Math.sin(t * 0.9 + m.userData.ph); });
      v0.forEach(([x, y, z, k], i) => { p[i * 3] = x + Math.sin(t * 0.4 + k * 9) * 0.2; p[i * 3 + 1] = fundo + (((y - fundo) - t * (0.08 + k * 0.1)) % 14 + 14) % 14; p[i * 3 + 2] = z; });
      g.attributes.position.needsUpdate = true;
    },
  };
}

/* ---------- skyline barato (janelas acesas por textura) ---------- */
export function skyline(S, { n = 160, seed = 12, cx = 0, cz = 0, raio = 40, hMin = 3, hMax = 22 } = {}) {
  const r = mulberry32(seed);
  const c = document.createElement("canvas"); c.width = 64; c.height = 128;
  const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 8) for (let x = 4; x < 64; x += 8) if (r() < 0.55) { g.fillStyle = r() < 0.8 ? "#ffd08a" : "#cfe6ff"; g.fillRect(x, y, 4, 5); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  const win = new THREE.MeshStandardMaterial({ color: 0x2c3036, roughness: 0.6, metalness: 0.3, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 1.2 });
  const box = new THREE.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const im = new THREE.InstancedMesh(box, win, n); const o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const a = r() * 6.28, d = Math.sqrt(r()) * raio, h = hMin + (hMax - hMin) * Math.pow(r(), 2.2) * (1 - 0.6 * d / raio);
    o.position.set(cx + Math.cos(a) * d, 0, cz + Math.sin(a) * d); o.scale.set(2 + r() * 3, h, 2 + r() * 3); o.rotation.y = r() * 0.3; o.updateMatrix(); im.setMatrixAt(i, o.matrix);
  }
  im.castShadow = false; im.receiveShadow = true; S.add(im);
  return { mesh: im, win };
}

/* ---------- texto 2D no canvas ---------- */
export async function fontes() {
  try { await Promise.all(['300 40px "Inter"', '800 40px "Inter"', '600 40px "JetBrains Mono"', '400 40px "JetBrains Mono"'].map((f) => document.fonts.load(f))); } catch (e) { /* segue com fallback */ }
}
const _v = new THREE.Vector3();
export function proj(v, cam) {
  _v.copy(v).project(cam);
  return [(_v.x * 0.5 + 0.5) * 1080, (-_v.y * 0.5 + 0.5) * 1920, _v.z];
}
// k = kicker (mono azul), v = valor grande (Inter 800 degradê), u = unidade/linha menor (Inter 300)
export function texto(ctx, { x = 540, y = 820, k = "", v = "", u = "", a = 1, tam = 120, alin = "center", corK = "#7cc8ff", grad = ["#ffffff", "#9fd6ff"], linha = false } = {}) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.textAlign = alin; ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 24;
  let yy = y;
  if (k) { ctx.font = '600 26px "JetBrains Mono", monospace'; if ("letterSpacing" in ctx) ctx.letterSpacing = "8px"; ctx.fillStyle = corK; ctx.fillText(k, x, yy); yy += tam * 0.95 + 8; if ("letterSpacing" in ctx) ctx.letterSpacing = "0px"; }
  if (v) {
    ctx.font = `800 ${tam}px "Inter", sans-serif`;
    const w = ctx.measureText(v).width, x0 = alin === "center" ? x - w / 2 : alin === "right" ? x - w : x;
    const gr = ctx.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, grad[0]); gr.addColorStop(1, grad[1]);
    ctx.fillStyle = gr; ctx.fillText(v, x, yy);
  }
  if (u) { ctx.shadowBlur = 18; ctx.font = `300 ${Math.round(tam * 0.36)}px "Inter", sans-serif`; ctx.fillStyle = "#f3efe8"; ctx.fillText(u, x, yy + tam * 0.48); }
  ctx.restore();
}
// linha fina de chamada entre um ponto 3D projetado e o texto
export function chamada(ctx, [x0, y0], [x1, y1], a = 1, cor = "rgba(124,200,255,0.9)") {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = cor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x0, y0, 6, 0, 6.283); ctx.fill(); ctx.restore();
}
export { rg };

/* ---------- versão leve dos bichos de animals.js (menos triângulos: esferas e cápsulas com menos segmentos) ---------- */
const _leve = new Map();
export function leve(root, { esfera = [12, 9], capsula = [3, 8] } = {}) {
  root.traverse((m) => {
    if (!m.isMesh || m.isInstancedMesh) return;
    const g = m.geometry, p = g.parameters || {};
    if (_leve.has(g.uuid)) { m.geometry = _leve.get(g.uuid); return; }
    let n = null;
    if (g.type === "SphereGeometry" && p.widthSegments > esfera[0]) n = new THREE.SphereGeometry(p.radius, esfera[0], esfera[1]);
    else if (g.type === "CapsuleGeometry" && p.radialSegments > capsula[1]) {
      n = new THREE.CapsuleGeometry(p.radius, p.length ?? p.height, capsula[0], capsula[1]);
      g.computeBoundingBox(); n.computeBoundingBox();
      n.translate(0, g.boundingBox.max.y - n.boundingBox.max.y, 0);
    } else if (g.type === "ConeGeometry" && p.radialSegments > 8) {
      n = new THREE.ConeGeometry(p.radius, p.height, 8);
      g.computeBoundingBox(); n.computeBoundingBox(); n.translate(0, g.boundingBox.min.y - n.boundingBox.min.y, 0);
    }
    if (n) { _leve.set(g.uuid, n); _leve.set(n.uuid, n); m.geometry = n; }
  });
  return root;
}
