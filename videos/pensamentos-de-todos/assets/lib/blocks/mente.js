/**
 * mente.js — peças do vídeo "E se você pudesse ouvir os pensamentos de todos?" (lote 2).
 *
 *   const v = MENTE.vagao(S, st, { len: 20 });   v.update(t, vel)      // vagão de metrô à noite (túnel correndo nas janelas)
 *   const p = MENTE.povo(S, lugares, { seed });  p.update(t, o)        // gente barata instanciada (sem rosto), em pé/sentada/andando
 *        lugares = [{ x, z, ry, sent, h, vx, vz }]; p.cabeca(i, t) → Vector3 (topo da cabeça); p.tinta(i => 0..1)
 *   const f = MENTE.fios(S, n, { seed, np, alt });  f.update(t, i => ({ p: Vector3, a: 0..1, cor: [r,g,b] }))
 *        fios luminosos de pensamento subindo da cabeça + anel de onda expandindo
 *   MENTE.frase(ctx, cam, v3, "TEXTO", a, { cor, tam })                 // fragmento 2D fixado num ponto 3D
 *   MENTE.txt(ctx, s, x, y, o), MENTE.vis(st)                          // texto 2D; fator do "dip" do corte (0..1)
 *   const b = MENTE.barras(S, n, o); b.set(i, x, y, z, h, cor)         // barras de onda instanciadas
 *   const e = MENTE.estadio(S, { n: 80000 }); e.update(t, { onda, caos })  // estádio genérico visto de cima
 *   MENTE.bolhaTex(), MENTE.glowTex(), MENTE.PENS (fragmentos de pensamento)
 * Convenção: chão y = 0. No vagão, x ao longo do carro, z atravessa (bancos em z = ±1.2), teto em y = 2.3.
 * Tudo determinístico: só t e mulberry32(seed).
 */
import * as THREE from "../three.module.js";
import { M } from "./toy.js";
import { mulberry32, clamp, lerp, ease } from "../kit.js";

export const AZUL = "#7cc8ff", LARANJA = "#ff8a4c";
export const PENS = ["ESQUECI A CHAVE", "ELE ME ODEIA?", "PIZZA", "FALTAM 3 ESTAÇÕES", "E O ALUGUEL?", "ESSA MÚSICA DE NOVO",
  "SERÁ QUE ELA VIU?", "TO ATRASADO", "QUE FOME", "NÃO OLHA PRA MIM", "MANDEI O E-MAIL?", "DEZ REAIS", "SAUDADE",
  "QUE CHEIRO É ESSE", "AMANHÃ PROVA", "LIGA PRA MÃE", "R$ 248,90", "TÔ CANSADA", "E SE DER ERRADO?", "LA LA LA"];

const _o = new THREE.Object3D();
const _c = new THREE.Color();
function setM(im, i, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) {
  _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz, "YXZ"); _o.scale.set(sx || 1e-4, sy || 1e-4, sz || 1e-4); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix);
}
function inst(geo, mat, n, parent, sombra = true) {
  const m = new THREE.InstancedMesh(geo, mat, n); m.castShadow = sombra; m.receiveShadow = true; m.count = n;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; parent.add(m); return m;
}

/* ---------- texturas ---------- */
let _glow = null;
export function glowTex() {
  if (_glow) return _glow;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  _glow = new THREE.CanvasTexture(c); _glow.colorSpace = THREE.SRGBColorSpace; return _glow;
}
export function glowSprite(cor, tam, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: cor, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: op }));
  s.scale.setScalar(tam); return s;
}
let _bolha = null;
export function bolhaTex() { // nuvem de pensamento (branca, colorida pelo material)
  if (_bolha) return _bolha;
  const c = document.createElement("canvas"); c.width = 256; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(255,255,255,0.92)"; g.strokeStyle = "rgba(255,255,255,1)"; g.lineWidth = 5;
  const bl = [[128, 96, 58], [78, 104, 40], [178, 104, 40], [104, 66, 38], [154, 68, 36], [100, 124, 34], [156, 126, 34]];
  g.beginPath(); for (const [x, y, r] of bl) { g.moveTo(x + r, y); g.arc(x, y, r, 0, 6.283); } g.fill();
  for (const [x, y, r] of [[112, 184, 16], [98, 218, 10], [90, 242, 6]]) { g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); }
  _bolha = new THREE.CanvasTexture(c); _bolha.colorSpace = THREE.SRGBColorSpace; return _bolha;
}
function tunelTex() { // janela do metrô: túnel escuro com lâmpadas e cabos passando
  const c = document.createElement("canvas"); c.width = 512; c.height = 64;
  const g = c.getContext("2d"), r = mulberry32(404);
  const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "#06080d"); gr.addColorStop(0.5, "#0d1119"); gr.addColorStop(1, "#05060a");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 64);
  g.fillStyle = "rgba(90,100,120,0.35)"; for (let i = 0; i < 3; i++) g.fillRect(0, 14 + i * 9, 512, 1.5);
  for (let x = 20; x < 512; x += 128) {
    const rg = g.createRadialGradient(x, 22, 0, x, 22, 26); const q = r() < 0.5;
    rg.addColorStop(0, q ? "rgba(255,214,150,1)" : "rgba(200,230,255,1)"); rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg; g.fillRect(x - 40, 0, 80, 64);
    g.fillStyle = q ? "rgba(255,200,130,0.9)" : "rgba(210,235,255,0.9)"; g.fillRect(x - 10, 20, 20, 4);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}

/* ---------- vagão ---------- */
export function vagao(S, st, { len = 20, teto = true } = {}) {
  const g = new THREE.Group(); S.add(g);
  const box = (w, h, d, cor, x, y, z, rough = 0.6, extra = null) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof cor === "object" ? cor : M(cor, rough, extra));
    m.position.set(x, y, z); m.castShadow = false; m.receiveShadow = true; g.add(m); return m;
  };
  // piso de vinil com faixas, grade de 1 m opcional (f07)
  const pc = document.createElement("canvas"); pc.width = 64; pc.height = 64; const pg = pc.getContext("2d");
  pg.fillStyle = "#4b4f57"; pg.fillRect(0, 0, 64, 64); pg.fillStyle = "#555a63"; for (let i = 0; i < 64; i += 8) pg.fillRect(i, 0, 3, 64);
  const ptex = new THREE.CanvasTexture(pc); ptex.wrapS = ptex.wrapT = THREE.RepeatWrapping; ptex.repeat.set(len * 2, 6); ptex.colorSpace = THREE.SRGBColorSpace;
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(len, 3.2), new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.5, metalness: 0.05 }));
  piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; g.add(piso);
  const metal = M(0xb9bec6, 0.45, { metalness: 0.5 });
  const cromo = M(0xdfe4ea, 0.18, { metalness: 1 });
  const banco = M(0x2f5a8a, 0.55);
  for (const s of [1, -1]) {
    box(len, 1.0, 0.08, metal, 0, 0.5, s * 1.6);
    box(len, 0.42, 0.08, metal, 0, 2.1, s * 1.6);
    for (let x = -len / 2; x <= len / 2 + 0.01; x += 2.6) box(0.36, 0.95, 0.1, metal, x, 1.42, s * 1.6);
    box(len - 0.4, 0.12, 0.52, banco, 0, 0.46, s * 1.27);
    box(len - 0.4, 0.5, 0.1, banco, 0, 0.78, s * 1.52);
    box(len, 0.06, 0.06, cromo, 0, 1.96, s * 0.72);
  }
  // janelas com o túnel correndo
  const tex = tunelTex(); tex.repeat.set(len / 6, 1);
  const jm = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: false });
  for (const s of [1, -1]) { const j = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.95), jm); j.position.set(0, 1.42, s * 1.64); j.rotation.y = s > 0 ? Math.PI : 0; g.add(j); }
  // teto e luminárias
  if (teto) box(len, 0.06, 3.3, M(0x8d929a, 0.7, { emissive: 0x3a3f48, emissiveIntensity: 1 }), 0, 2.33, 0);
  const lum = M(0xffffff, 0.4, { emissive: 0xeaf4ff, emissiveIntensity: 1.5 });
  if (teto) for (let x = -len / 2 + 0.8; x < len / 2; x += 2.6) for (const s of [1, -1]) box(1.7, 0.04, 0.12, lum, x + 0.5, 2.29, s * 0.55);
  // mastros
  const mg = new THREE.CylinderGeometry(0.028, 0.028, 2.3, 8);
  for (let x = -len / 2 + 1.3; x < len / 2; x += 2.6) for (const s of [1, -1]) { const m = new THREE.Mesh(mg, cromo); m.position.set(x, 1.15, s * 0.72); g.add(m); }
  // fundos
  for (const s of [1, -1]) box(0.1, 2.4, 3.3, metal, s * len / 2, 1.2, 0);
  // grade de 1 m no chão (f07)
  const gl = [];
  for (let x = -len / 2; x <= len / 2; x += 1) gl.push(x, 0.012, -1.0, x, 0.012, 1.0);
  for (let z = -1; z <= 1.001; z += 1) gl.push(-len / 2, 0.012, z, len / 2, 0.012, z);
  const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(gl, 3));
  const gm = new THREE.LineBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0, toneMapped: false, fog: false });
  const grade = new THREE.LineSegments(gg, gm); g.add(grade);
  // luz do vagão: fluorescente fria vindo de cima (a luz-chave atravessa o teto, que não faz sombra)
  st.key.color.set(0xe6efff); st.key.intensity = 1.9; st.rim.color.set(0x7fa8ff); st.rim.intensity = 0.5; st.hemi.intensity = 0.45; st.hemi.color.set(0x9fb8e0); st.hemi.groundColor.set(0x2a2622);
  return {
    group: g, grade: gm, len,
    update(t, vel = 1) { tex.offset.x = -t * 0.9 * vel; },
  };
}

/* ---------- gente barata (instanciada, sem rosto) ---------- */
export const ROUPAS = [0xb83a2e, 0x2f5c8a, 0xe8e2d4, 0x2b2d31, 0xd9a23a, 0x3f6e4a, 0x8a5aa0, 0xe07a5f, 0x5f8fb0, 0x6b6f76, 0x9b2f4f, 0x24486b];
const CALCAS = [0x2c3550, 0x3a3a3e, 0x6b5a48, 0x1e2230, 0x55606e, 0x4a3a30];
const PELES = [0xf2c49b, 0xd9a07a, 0xa8714f, 0x7a4e33, 0xe8b48c, 0x8c5a3c];
const CABELOS = [0x1d1612, 0x3a2618, 0x5a3a22, 0x9a7a52, 0x2a2a2e, 0xb8b2a8];
export function povo(S, L, { seed = 1, bracos = true, leve = false } = {}) {
  if (leve) bracos = false;
  const R = mulberry32(seed), n = L.length;
  const gT = new THREE.CapsuleGeometry(0.19, 0.36, 2, 8);
  const gC = new THREE.SphereGeometry(0.13, 10, 7);
  const gCab = new THREE.SphereGeometry(0.138, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const gP = (() => { const g = new THREE.CapsuleGeometry(0.075, 0.33, 1, 6); g.translate(0, -0.24, 0); return g; })();
  const gB = (() => { const g = new THREE.CapsuleGeometry(0.06, 0.5, 1, 6); g.translate(0, -0.3, 0); return g; })();
  const mk = (r) => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: r });
  const iT = inst(gT, mk(0.8), n, S), iC = inst(gC, mk(0.6), n, S), iH = inst(gCab, mk(0.75), n, S);
  const iP = inst(leve ? new THREE.CapsuleGeometry(0.085, 0.75, 1, 5).translate(0, -0.45, 0) : gP, mk(0.85), n * (leve ? 2 : 4), S), iB = bracos ? inst(gB, mk(0.8), n * 2, S) : null;
  const base = [];
  L.forEach((p, i) => {
    p.h = p.h ?? 0.92 + R() * 0.14; p.ph = R() * 6.28; p.vx = p.vx || 0; p.vz = p.vz || 0;
    const ct = ROUPAS[Math.floor(R() * ROUPAS.length)], cp = CALCAS[Math.floor(R() * CALCAS.length)];
    const cs = PELES[Math.floor(R() * PELES.length)], ch = CABELOS[Math.floor(R() * CABELOS.length)];
    base.push([p.cor ?? ct, cp, cs, ch]);
  });
  const tint = (f) => {
    L.forEach((p, i) => {
      const k = f ? f(i) : 1, [ct, cp, cs, ch] = base[i];
      iT.setColorAt(i, _c.set(ct).multiplyScalar(k)); iC.setColorAt(i, _c.set(cs).multiplyScalar(k)); iH.setColorAt(i, _c.set(ch).multiplyScalar(k));
      for (let j = 0; j < (leve ? 2 : 4); j++) iP.setColorAt(i * (leve ? 2 : 4) + j, _c.set(cp).multiplyScalar(k));
      if (iB) for (let j = 0; j < 2; j++) iB.setColorAt(i * 2 + j, _c.set(ct).multiplyScalar(k * 0.9));
    });
    for (const m of [iT, iC, iH, iP, iB]) if (m && m.instanceColor) m.instanceColor.needsUpdate = true;
  };
  tint();
  const pos = (p, t) => [p.x + p.vx * t, p.z + p.vz * t];
  // o = { anda: bool, olhaBaixo: 0..1, esc: i => escala (0 some) }
  function update(t, o = {}) {
    L.forEach((p, i) => {
      const [x, z] = pos(p, t), h = p.h, k = o.esc ? o.esc(i) : 1;
      const ry = p.ry, fx = Math.sin(ry), fz = Math.cos(ry), sx = Math.cos(ry), sz = -Math.sin(ry);
      const andando = (p.vx || p.vz) && !p.sent;
      const ph = t * 2.0 * Math.hypot(p.vx, p.vz) + p.ph, sw = andando ? Math.sin(ph) * 0.5 : 0;
      const bob = andando ? Math.abs(Math.sin(ph)) * 0.04 : 0, idle = Math.sin(t * 1.4 + p.ph) * 0.02;
      const qy = p.sent ? 0.5 * h : 0.9 * h + bob;           // quadril
      const ty = qy + 0.36 * h, inc = p.sent ? -0.05 : idle;
      setM(iT, i, x, ty, z, k * h, k * h, k * h * 0.8, ry, inc);
      const hy = qy + 0.8 * h, cb = (o.olhaBaixo ?? 0) * 0.3 + Math.sin(t * 0.9 + p.ph) * 0.05;
      const hx = x + fx * cb * 0.15, hz = z + fz * cb * 0.15;
      setM(iC, i, hx, hy, hz, k * h, k * h * 1.08, k * h, ry, cb);
      setM(iH, i, hx - fx * 0.012, hy + 0.012, hz - fz * 0.012, k * h, k * h, k * h, ry, cb - 0.15);
      for (const sd of [0, 1]) {
        const ox = sx * (sd ? 0.09 : -0.09) * h, oz = sz * (sd ? 0.09 : -0.09) * h;
        const a1 = p.sent ? -1.45 : (sd ? sw : -sw), a2 = p.sent ? 0 : (sd ? Math.max(0, -sw) : Math.max(0, sw)) * 0.8;
        // coxa
        _o.position.set(x + ox, qy, z + oz); _o.rotation.set(0, ry, 0, "YXZ"); _o.rotateX(a1); _o.scale.setScalar(k * h || 1e-4); _o.updateMatrix(); iP.setMatrixAt(leve ? i * 2 + sd : i * 4 + sd * 2, _o.matrix);
        if (leve) continue;
        // canela (do joelho)
        const kx = Math.sin(a1) * 0.42 * h, ky = Math.cos(a1) * 0.42 * h;
        _o.position.set(x + ox + fx * -kx, qy - ky, z + oz + fz * -kx); _o.rotation.set(0, ry, 0, "YXZ"); _o.rotateX(a2); _o.scale.setScalar(k * h || 1e-4); _o.updateMatrix(); iP.setMatrixAt(i * 4 + sd * 2 + 1, _o.matrix);
        if (iB) {
          const bx = sx * (sd ? 0.25 : -0.25) * h, bz = sz * (sd ? 0.25 : -0.25) * h;
          const ab = p.sent ? -0.7 : (sd ? -sw : sw) * 0.7 + (p.braco && sd ? -2.6 : 0);
          _o.position.set(x + bx, ty + 0.28 * h, z + bz); _o.rotation.set(0, ry, 0, "YXZ"); _o.rotateX(ab); _o.rotateZ(sd ? -0.08 : 0.08); _o.scale.setScalar(k * h || 1e-4); _o.updateMatrix(); iB.setMatrixAt(i * 2 + sd, _o.matrix);
        }
      }
    });
    for (const m of [iT, iC, iH, iP, iB]) if (m) m.instanceMatrix.needsUpdate = true;
  }
  const _v = new THREE.Vector3();
  function cabeca(i, t, out = new THREE.Vector3()) {
    const p = L[i], [x, z] = pos(p, t), qy = p.sent ? 0.5 * p.h : 0.9 * p.h;
    return out.set(x, qy + 0.8 * p.h + 0.15, z);
  }
  update(0);
  return { L, update, cabeca, tinta: tint, meshes: [iT, iC, iH, iP, iB].filter(Boolean) };
}

/* ---------- fios de pensamento: partículas subindo + anel de onda ---------- */
export function fios(S, n, { seed = 5, np = 64, alt = 1.0, tam = 0.06, aneis = true, vel = 0.55, abre = 0.16 } = {}) {
  const R = mulberry32(seed), N = n * np;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ map: glowTex(), size: tam, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; S.add(pts);
  const F = Array.from({ length: n }, () => ({ ph: R() * 6.28, dx: (R() - 0.5) * 0.5, dz: (R() - 0.5) * 0.5, v: vel * (0.8 + R() * 0.5), off: R() }));
  const K = Array.from({ length: N }, () => [R(), R() * 6.28, 0.5 + R() * 0.8]);
  let ring = null;
  if (aneis) {
    ring = new THREE.InstancedMesh(new THREE.RingGeometry(0.9, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }), n * 2);
    ring.frustumCulled = false; ring.instanceMatrix.setUsage(THREE.DynamicDrawUsage); S.add(ring);
    for (let i = 0; i < n * 2; i++) ring.setColorAt(i, _c.set(0));
  }
  // fn(i) → { p: Vector3, a, cor: [r,g,b], alt?, tumulto? }
  function update(t, fn) {
    for (let i = 0; i < n; i++) {
      const s = fn(i), f = F[i], a = s.a ?? 1, al = s.alt ?? alt, tu = s.tumulto ?? 0, cor = s.cor || [0.49, 0.78, 1];
      for (let j = 0; j < np; j++) {
        const q = i * np + j, k = K[q];
        const u = ((t * f.v + j / np + f.off + k[0] * 0.015) % 1 + 1) % 1;
        const r = abre * (0.12 + u * 0.9) * (1 + tu * 2.5) * (0.85 + 0.3 * k[0]) + tu * (k[2] - 0.9) * 0.3;
        const w = -t * (1.5 + tu * 5) + f.ph + (j % 3) * 2.094 + u * 7 + tu * k[1];
        pos[q * 3] = s.p.x + Math.sin(w) * r + f.dx * u * al;
        pos[q * 3 + 1] = s.p.y + u * al;
        pos[q * 3 + 2] = s.p.z + Math.cos(w * 0.9) * r + f.dz * u * al;
        const e = a * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (0.55 + 0.45 * Math.sin(t * 7 + k[1]));
        col[q * 3] = cor[0] * e; col[q * 3 + 1] = cor[1] * e; col[q * 3 + 2] = cor[2] * e;
      }
      if (ring) for (let j = 0; j < 2; j++) {
        const u = ((t * 0.7 + j * 0.5 + f.off) % 1 + 1) % 1, rr = 0.12 + u * (0.4 + tu * 0.5);
        setM(ring, i * 2 + j, s.p.x, s.p.y - 0.05 + u * 0.1, s.p.z, rr, rr, rr, 0, -Math.PI / 2);
        const e = a * (1 - u) * 0.4; ring.setColorAt(i * 2 + j, _c.setRGB(cor[0] * e, cor[1] * e, cor[2] * e));
      }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    if (ring) { ring.instanceMatrix.needsUpdate = true; ring.instanceColor.needsUpdate = true; }
  }
  return { update, pts, ring, mat };
}
export const COR = { azul: [0.49, 0.78, 1], laranja: [1, 0.54, 0.3], branco: [1, 0.96, 0.9], cinza: [0.55, 0.6, 0.7] };

/* ---------- 2D ---------- */
const _pv = new THREE.Vector3();
export function proj(v, cam) { cam.updateMatrixWorld(); _pv.copy(v).project(cam); return [(_pv.x + 1) * 540, (1 - _pv.y) * 960, _pv.z]; }
const FAM = { mono: '"JetBrains Mono", ui-monospace, monospace', inter: '"Inter", sans-serif' };
export function txt(ctx, s, x, y, { tam = 40, cor = "#fff", fonte = "mono", peso = 600, al = "center", a = 1, esp = 0.06, sombra = true } = {}) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a);
  ctx.font = `${peso} ${tam}px ${FAM[fonte] || FAM.mono}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = (fonte === "mono" ? esp * tam : 0) + "px";
  ctx.textAlign = al; ctx.textBaseline = "middle";
  if (sombra) { ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = tam * 0.4; ctx.shadowOffsetY = tam * 0.05; }
  ctx.fillStyle = cor; ctx.fillText(s, x, y); ctx.restore();
}
// controle de sobreposição: posições já ocupadas no quadro atual (zera quando o relógio global muda)
const _pos = [];
export function quadro() { _pos.length = 0; }   // chame uma vez por quadro, antes das frases
// fragmento de pensamento: pílula escura com borda colorida, texto mono, fio fino até o ponto 3D
export function frase(ctx, cam, v3, s, a, { cor = AZUL, tam = 30, dy = -40, dx = 0, esc = 1, rot = 0, ymin = 490, ymax = 995, linha = true, evita = null } = {}) {
  if (a <= 0.01) return;
  const [px, py, pz] = proj(v3, cam);
  if (pz > 1 || pz < -1) return;
  const T = tam * esc;
  ctx.save(); ctx.font = `600 ${T}px ${FAM.mono}`; if ("letterSpacing" in ctx) ctx.letterSpacing = T * 0.05 + "px";
  const w = ctx.measureText(s).width + T * 1.1, h = T * 1.75;
  let x = clamp(px + dx, w / 2 + 24, 1080 - w / 2 - 24), y = clamp(py + dy - h / 2, ymin, ymax - h / 2);
  for (let k = 0; k < 8; k++) {
    const hit = _pos.find((r) => Math.abs(r[0] - x) < (r[2] + w) / 2 + 6 && Math.abs(r[1] - y) < (r[3] + h) / 2 + 6);
    if (!hit) break;
    y = hit[1] + (y >= hit[1] ? 1 : -1) * ((hit[3] + h) / 2 + 8);
    if (y > ymax - h / 2 || y < ymin) { y = clamp(y, ymin, ymax - h / 2); x = clamp(hit[0] + (x >= hit[0] ? 1 : -1) * ((hit[2] + w) / 2 + 10), w / 2 + 24, 1080 - w / 2 - 24); }
  }
  if (evita && y + h / 2 > evita[0] && y - h / 2 < evita[1]) y = y < (evita[0] + evita[1]) / 2 ? evita[0] - h / 2 : evita[1] + h / 2;
  _pos.push([x, y, w, h]);
  ctx.globalAlpha = Math.min(1, a);
  ctx.strokeStyle = cor; ctx.lineWidth = 2; ctx.globalAlpha = Math.min(1, a) * 0.6;
  if (linha) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y + h / 2); ctx.stroke(); }
  ctx.globalAlpha = Math.min(1, a);
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(0.85 + 0.15 * Math.min(1, a), 0.85 + 0.15 * Math.min(1, a));
  ctx.fillStyle = "rgba(6,9,18,0.72)"; ctx.shadowColor = cor; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h * 0.3); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = cor; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s, 0, 2);
  ctx.restore();
}
// fator do "dip" do corte (o 2D desenhado depois de st.draw também precisa escurecer)
export function vis(st) { const T = st.T || 0, D = st.D || 1e9; return 1 - Math.min(1, Math.max(1 - T / 0.17, 1 - (D - T) / 0.12, 0)) * 0.85; }
// embaralha um texto de forma determinística (k = 0 legível, 1 todo trocado)
export function embaralha(s, k, seed) {
  const r = mulberry32(seed), A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ?!#%&";
  return s.split("").map((ch) => (ch !== " " && r() < k ? A[Math.floor(r() * A.length)] : ch)).join("");
}
// foco: escurece e desfoca tudo fora de um círculo (efeito coquetel)
let _tmp = null;
export function foco(ctx, x, y, r, a) {
  if (a <= 0.01) return;
  if (!_tmp) { _tmp = document.createElement("canvas"); _tmp.width = 540; _tmp.height = 960; }
  const g = _tmp.getContext("2d");
  g.globalCompositeOperation = "copy"; g.filter = `blur(${(6 * a).toFixed(1)}px) brightness(${(1 - 0.6 * a).toFixed(2)}) saturate(${(1 - 0.6 * a).toFixed(2)})`;
  g.drawImage(ctx.canvas, 0, 0, 540, 960); g.filter = "none";
  g.globalCompositeOperation = "destination-out";
  const gr = g.createRadialGradient(x / 2, y / 2, r * 0.3, x / 2, y / 2, r * 0.55);
  gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 540, 960); g.globalCompositeOperation = "source-over";
  ctx.drawImage(_tmp, 0, 0, 1080, 1920);
}

/* ---------- barras instanciadas (forma de onda, medidores) ---------- */
export function barras(S, n, { larg = 0.1, prof = 0.1 } = {}) {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(larg, 1, prof), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false }), n);
  m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); S.add(m);
  for (let i = 0; i < n; i++) { m.setColorAt(i, _c.set(0)); setM(m, i, 0, -99, 0, 1e-4, 1e-4, 1e-4); }
  return {
    mesh: m,
    set(i, x, y, z, h, cor, ry = 0) { setM(m, i, x, y, z, 1, Math.max(1e-3, h), 1, ry); m.setColorAt(i, _c.setRGB(cor[0], cor[1], cor[2])); },
    fim() { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; },
  };
}

/* ---------- estádio genérico (oval, sem marca) com 80 mil torcedores-ponto ---------- */
export function estadio(S, { n = 80000, seed = 77 } = {}) {
  const R = mulberry32(seed), g = new THREE.Group(); S.add(g);
  const A0 = 58, B0 = 40, A1 = 104, B1 = 86, Y0 = 2, Y1 = 30, SEG = 72;
  // arquibancada (superfície inclinada)
  const v = [], idx = [];
  for (let k = 0; k <= SEG; k++) {
    const a = (k / SEG) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    v.push(c * A0, Y0, s * B0, c * A1, Y1, s * B1);
  }
  for (let k = 0; k < SEG; k++) { const i = k * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
  const ag = new THREE.BufferGeometry(); ag.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); ag.setIndex(idx); ag.computeVertexNormals();
  const arq = new THREE.Mesh(ag, M(0x3a3f4a, 0.9, { side: THREE.DoubleSide })); arq.receiveShadow = true; g.add(arq);
  // muro externo e cobertura
  const muro = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, Y1 + 4, SEG, 1, true), M(0xcfd3d8, 0.7, { side: THREE.DoubleSide }));
  muro.scale.set(A1 + 1, 1, B1 + 1); muro.position.y = (Y1 + 4) / 2 - 1; g.add(muro);
  const cob = new THREE.Mesh(new THREE.RingGeometry(0.78, 1.0, SEG, 1), new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.5, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  cob.rotation.x = -Math.PI / 2; cob.scale.set(A1 + 2, B1 + 2, 1); cob.position.y = Y1 + 3.5; g.add(cob);
  // gramado com listras e linhas
  const gc = document.createElement("canvas"); gc.width = 256; gc.height = 170; const gx = gc.getContext("2d");
  for (let i = 0; i < 12; i++) { gx.fillStyle = i % 2 ? "#2f7a3a" : "#367f40"; gx.fillRect(i * 256 / 12, 0, 256 / 12 + 1, 170); }
  gx.strokeStyle = "rgba(255,255,255,0.85)"; gx.lineWidth = 2; gx.strokeRect(10, 10, 236, 150); gx.beginPath(); gx.moveTo(128, 10); gx.lineTo(128, 160); gx.stroke();
  gx.beginPath(); gx.arc(128, 85, 22, 0, 6.283); gx.stroke(); gx.strokeRect(10, 50, 34, 70); gx.strokeRect(212, 50, 34, 70);
  const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
  const gram = new THREE.Mesh(new THREE.PlaneGeometry(96, 64), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.9 }));
  gram.rotation.x = -Math.PI / 2; gram.position.y = 0.6; gram.receiveShadow = true; g.add(gram);
  const pista = new THREE.Mesh(new THREE.CircleGeometry(1, SEG), M(0x4a4038, 0.95)); pista.rotation.x = -Math.PI / 2; pista.scale.set(A0 + 1, B0 + 1, 1); pista.position.y = 0.4; g.add(pista);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M(0x1b1e24, 0.95)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; g.add(chao);
  // torcida: 80 mil pontos na arquibancada
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), P0 = new Float32Array(n * 3), BASE = new Float32Array(n * 3), FX = new Float32Array(n * 2);
  const cores = [[0.85, 0.85, 0.85], [0.9, 0.25, 0.2], [0.95, 0.85, 0.2], [0.2, 0.45, 0.9], [0.95, 0.95, 0.95], [0.25, 0.7, 0.35]];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, s = 0.04 + R() * 0.93, c = Math.cos(a), sn = Math.sin(a);
    const x = c * lerp(A0, A1, s), z = sn * lerp(B0, B1, s), y = lerp(Y0, Y1, s) + 0.7;
    P0[i * 3] = x; P0[i * 3 + 1] = y; P0[i * 3 + 2] = z;
    const cc = cores[Math.floor(R() * cores.length)], b = 0.55 + R() * 0.45;
    BASE[i * 3] = cc[0] * b; BASE[i * 3 + 1] = cc[1] * b; BASE[i * 3 + 2] = cc[2] * b;
    FX[i * 2] = R(); FX[i * 2 + 1] = R() * 6.28;
  }
  pos.set(P0);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ map: glowTex(), size: 1.5, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; g.add(pts);
  // ondas: anéis saindo de lugares da torcida
  const NR = 170, ring = new THREE.InstancedMesh(new THREE.RingGeometry(0.86, 1, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }), NR);
  ring.frustumCulled = false; g.add(ring);
  const RI = Array.from({ length: NR }, () => [Math.floor(R() * n), R()]);
  // refletores
  for (let k = 0; k < 8; k++) { const a = (k / 8) * 6.283 + 0.2; const s = glowSprite(0xfff1d6, 26, 0.9); s.position.set(Math.cos(a) * (A1 - 4), Y1 + 6, Math.sin(a) * (B1 - 4)); g.add(s); }
  // tempestade de partículas por cima
  const NS = 9000, sp = new Float32Array(NS * 3), sc = new Float32Array(NS * 3);
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); sg.setAttribute("color", new THREE.BufferAttribute(sc, 3));
  const sm = new THREE.PointsMaterial({ map: glowTex(), size: 2.4, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
  const storm = new THREE.Points(sg, sm); storm.frustumCulled = false; g.add(storm);
  const SV = Array.from({ length: NS }, () => [Math.floor(R() * n), R(), 0.5 + R(), R() * 6.28]);
  function update(t, { onda = 0, caos = 0, brilho = 1 } = {}) {
    for (let i = 0; i < n; i++) {
      const f = FX[i * 2], ph = FX[i * 2 + 1];
      const pul = onda * (0.5 + 0.5 * Math.sin(t * (3 + f * 5) + ph)), e = brilho * (0.55 + pul * 1.3);
      col[i * 3] = BASE[i * 3] * e + pul * 0.3; col[i * 3 + 1] = BASE[i * 3 + 1] * e + pul * 0.5; col[i * 3 + 2] = BASE[i * 3 + 2] * e + pul * 0.7;
    }
    geo.attributes.color.needsUpdate = true;
    RI.forEach(([j, o], k) => {
      const u = ((t * 0.8 + o) % 1 + 1) % 1, r = 0.5 + u * (3 + caos * 4);
      setM(ring, k, P0[j * 3], P0[j * 3 + 1] + 0.3, P0[j * 3 + 2], r, r, r, 0, -Math.PI / 2);
      const e = onda * (1 - u) * 0.55, lar = k % 3 === 0 ? 1 : 0;
      ring.setColorAt(k, _c.setRGB(lerp(0.49, 1, lar) * e, lerp(0.78, 0.54, lar) * e, lerp(1, 0.3, lar) * e));
    });
    ring.instanceMatrix.needsUpdate = true; ring.instanceColor.needsUpdate = true;
    SV.forEach(([j, o, vv, ph], k) => {
      const u = ((t * 0.25 * vv + o) % 1 + 1) % 1, h = u * 90 * caos, a = ph + t * (0.4 + u) + u * 3;
      const r0 = Math.hypot(P0[j * 3], P0[j * 3 + 2]), r = r0 * (1 - 0.55 * u * caos);
      const a0 = Math.atan2(P0[j * 3 + 2], P0[j * 3]) + u * 2.2 * caos + t * 0.15 * caos;
      sp[k * 3] = Math.cos(a0) * r + Math.sin(a) * 4; sp[k * 3 + 1] = P0[j * 3 + 1] + h; sp[k * 3 + 2] = Math.sin(a0) * r * 0.85 + Math.cos(a) * 4;
      const e = caos * Math.sin(Math.PI * u), lar = k % 2;
      sc[k * 3] = lerp(0.49, 1, lar) * e; sc[k * 3 + 1] = lerp(0.78, 0.54, lar) * e; sc[k * 3 + 2] = lerp(1, 0.3, lar) * e;
    });
    sg.attributes.position.needsUpdate = true; sg.attributes.color.needsUpdate = true;
  }
  return { group: g, update, pts, A1, B1, Y1 };
}


/* ---------- cidade barata: prédios-caixa com janelas em textura (12 triângulos cada) ---------- */
let _fac = null;
function facTex() {
  if (_fac) return _fac;
  const mk = (acesa) => {
    const c = document.createElement("canvas"); c.width = 128; c.height = 128;
    const g = c.getContext("2d"), r = mulberry32(acesa ? 61 : 61);
    g.fillStyle = acesa ? "#000" : "#6d6a66"; g.fillRect(0, 0, 128, 128);
    for (let y = 6; y < 128; y += 16) for (let x = 6; x < 128; x += 16) {
      const v = r();
      g.fillStyle = acesa ? (v < 0.5 ? `rgb(255,${180 + Math.floor(v * 120)},${110 + Math.floor(v * 140)})` : "#000") : "#2b3440";
      g.fillRect(x, y, 9, 10);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  };
  _fac = [mk(false), mk(true)]; return _fac;
}
const CORES_PREDIO = [0x8a6a58, 0xa89c8a, 0x7d7f84, 0x9b8370, 0x6a7078, 0xb3a58e, 0x5c6168];
// lista = [[x, z, w, d, h], ...]; devolve { group, mat(s), luzes(k) }
export function predios(S, lista, { seed = 9, luz = 1 } = {}) {
  const R = mulberry32(seed), g = new THREE.Group(); S.add(g);
  const [dia, noite] = facTex();
  const mats = CORES_PREDIO.map((c) => new THREE.MeshStandardMaterial({ color: c, map: dia, emissiveMap: noite, emissive: 0xffd9a8, emissiveIntensity: luz, roughness: 0.85 }));
  for (const [x, z, w, d, h] of lista) {
    const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv, nr = geo.attributes.normal;
    for (let i = 0; i < uv.count; i++) {
      const ny = Math.abs(nr.getY(i)) > 0.5, nx = Math.abs(nr.getX(i)) > 0.5;
      uv.setXY(i, ny ? 0.02 : uv.getX(i) * (nx ? d : w) / 8, ny ? 0.02 : uv.getY(i) * h / 8);
    }
    const m = new THREE.Mesh(geo, mats[Math.floor(R() * mats.length)]);
    m.position.set(x, h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m);
  }
  return { group: g, mats, luzes(k) { for (const m of mats) m.emissiveIntensity = k; } };
}
// rua à noite: asfalto, calçadas, postes com halo; prédios dos dois lados
export function ruaNoite(S, { len = 120, larg = 10, seed = 21, luz = 1, postes = true } = {}) {
  const R = mulberry32(seed), g = new THREE.Group(); S.add(g);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M(0x24262b, 0.9)); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; g.add(chao);
  const asf = new THREE.Mesh(new THREE.PlaneGeometry(larg, len), M(0x2e3036, 0.55, { metalness: 0.1 })); asf.rotation.x = -Math.PI / 2; asf.position.y = 0.01; asf.receiveShadow = true; g.add(asf);
  for (const s of [1, -1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(4, 0.18, len), M(0x7d7973, 0.85)); c.position.set(s * (larg / 2 + 2), 0.09, 0); c.receiveShadow = true; g.add(c); }
  const L = [];
  for (const s of [1, -1]) { let z = -len / 2; while (z < len / 2) { const w = 7 + R() * 7, d = 9 + R() * 4, h = 10 + R() * 26; L.push([s * (larg / 2 + 4.3 + d / 2), z + w / 2, d, w, h]); z += w + 0.4; } }
  const pr = predios(g, L, { seed: seed + 1, luz });
  const halos = [];
  if (postes) {
    const pg = new THREE.CylinderGeometry(0.07, 0.09, 5.5, 6), pm = M(0x3a3d42, 0.5, { metalness: 0.6 });
    for (const s of [1, -1]) for (let z = -len / 2 + 6; z < len / 2; z += 14) {
      const p = new THREE.Mesh(pg, pm); p.position.set(s * (larg / 2 + 0.6), 2.75, z); g.add(p);
      const h = glowSprite(0xffc98a, 3.2, 0.9); h.position.set(s * (larg / 2 + 0.2), 5.5, z); g.add(h); halos.push(h);
    }
  }
  return { group: g, predios: pr, halos };
}

/* ---------- utilidades de lugar ---------- */
// passageiros do vagão: sentados nos dois bancos + alguns em pé no corredor
export function lugaresVagao({ len = 20, seed = 3, sent = 0.8, emPe = 8, cheio = 1 } = {}) {
  const R = mulberry32(seed), L = [];
  for (const s of [1, -1]) for (let x = -len / 2 + 0.8; x < len / 2 - 0.6; x += 0.62) {
    if (R() > sent) continue;
    L.push({ x: x + (R() - 0.5) * 0.08, z: s * 1.18, ry: s > 0 ? Math.PI : 0, sent: 1 });
  }
  for (let i = 0; i < emPe; i++) {
    const x = -len / 2 + 1 + R() * (len - 2), z = (R() - 0.5) * 1.1 * cheio;
    L.push({ x, z, ry: R() * 6.28, sent: 0, braco: R() < 0.5 });
  }
  return L;
}
export { ease, clamp, lerp };
