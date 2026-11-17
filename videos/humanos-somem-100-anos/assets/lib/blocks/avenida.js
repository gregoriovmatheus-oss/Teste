/**
 * avenida.js — o MESMO local do vídeo "humanos somem 100 anos": uma avenida (rua/predio/carro/arvore de toy.js)
 * com estado de abandono controlado por parâmetros 0..1. Também: multidão instanciada, lobo e cervo.
 *
 *   const av = AVENIDA.avenida(S);            // monta tudo (materiais próprios: não mexe no cache de toy.js)
 *   av.set({ apagao, luzRua, farois, racha, mato, hera, ferrugem, floresta, fenda, neve, sujeira }, t)
 *   av.carrosAndando(t, tFreio)               // f01: carros rodando e freando até a posição parada
 *   av.BASE = { pos, look }                   // enquadramento-base da avenida (mesmo em todas as cenas)
 *   const g = AVENIDA.gente(S, { n, seed });  g.update(t, { modo: "some"|"surge"|"fica", t0, dur, anda })
 *   const l = AVENIDA.fauna("lobo"|"cervo", { fase, chifre }); l.update(t, { passo, cabeca })
 * Convenção: rua ao longo de z (câmera em z+ olhando z−), chão y = 0.
 */
import * as THREE from "../three.module.js";
import { M, SPH, mesh, PAL, predio, rua, carro, arvore } from "./toy.js";
import { mulberry32, clamp, lerp, ease } from "../kit.js";

const rg = (t, a, b) => clamp((t - a) / (b - a));
const BOX = new THREE.BoxGeometry(1, 1, 1);
const SPH_B = new THREE.SphereGeometry(1, 10, 8);
const SPH_L = new THREE.SphereGeometry(1, 7, 5);
const CONE = (() => { const g = new THREE.ConeGeometry(1, 1, 5); g.translate(0, 0.5, 0); return g; })();
const TRONCO = (() => { const g = new THREE.CylinderGeometry(0.16, 0.28, 1, 7); g.translate(0, 0.5, 0); return g; })();

let _glow = null;
export function glowTex() {
  if (_glow) return _glow;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.2, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  _glow = new THREE.CanvasTexture(c); _glow.colorSpace = THREE.SRGBColorSpace;
  return _glow;
}
export function glowMat(cor) {
  return new THREE.SpriteMaterial({ map: glowTex(), color: cor, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0 });
}
function inst(geo, mat, n, parent) {
  const m = new THREE.InstancedMesh(geo, mat, n); m.castShadow = true; m.receiveShadow = true; m.count = n;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); parent.add(m); return m;
}
const _o = new THREE.Object3D();
function setM(im, i, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) {
  _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz); _o.scale.set(sx || 1e-4, sy || 1e-4, sz || 1e-4); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix);
}

// janelas: textura de fachada (dia) e de janelas acesas (noite) para o skyline do fundo
let _fac = null;
function fachadaTex() {
  if (_fac) return _fac;
  const mk = (noite) => {
    const c = document.createElement("canvas"); c.width = 64; c.height = 128;
    const g = c.getContext("2d"), r = mulberry32(noite ? 5 : 5);
    g.fillStyle = noite ? "#000" : "#9a9c9f"; g.fillRect(0, 0, 64, 128);
    for (let y = 4; y < 124; y += 10) for (let x = 4; x < 60; x += 9) {
      const v = r();
      g.fillStyle = noite ? (v < 0.62 ? `rgb(255,${190 + Math.floor(v * 60)},${110 + Math.floor(v * 80)})` : "#000") : "#3a4652";
      g.fillRect(x, y, 5, 6);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter;
    return t;
  };
  _fac = [mk(false), mk(true)];
  return _fac;
}

export function avenida(S, { seed = 11, larg = 18, calc = 4 } = {}) {
  const R = mulberry32(seed);
  const root = new THREE.Group(); S.add(root);
  const base = rua({ len: 220, larg, calc, seed: seed + 1, predios: false, arvores: true, chao: 0xb9ae94 });
  root.add(base.group);
  const borda = larg / 2 + calc;           // 13: fim da calçada
  const LOT = [6, 34];                      // estacionamento à esquerda (x < 0), z de 6 a 34
  const av = { root, larg, calc, borda, LOT, buildings: [], BASE: { pos: [2.5, 7.5, 46], look: [0, 5.2, -20] } };

  // ---------- prédios (predio de toy.js, janelas próprias para apagar prédio a prédio) ----------
  const CORES = [0x9c5038, 0xc7b08e, 0xb5afa5, 0x8d8780, 0xae6848, 0xd6c9b0, 0x6c7880, 0xb48748];
  const winGeo = new THREE.BoxGeometry(1.1, 1.5, 0.14);
  const winDark = new THREE.MeshStandardMaterial({ color: 0x27323b, roughness: 0.12, metalness: 0.7, envMapIntensity: 1.2 });
  for (const s of [1, -1]) {
    let z = -108;
    while (z < 62) {
      if (s < 0 && z + 4 > LOT[0] && z < LOT[1]) { z = LOT[1] + 1; continue; }
      const w = 9 + R() * 6, d = 10 + R() * 6, h = 12 + 32 * Math.pow(R(), 1.2) + (z < -40 ? 10 : 0);
      const b = predio({ w, d, h, cor: CORES[Math.floor(R() * CORES.length)], janelas: false });
      b.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      const bx = s * (borda + d / 2 + 0.3), bz = z + w / 2;
      b.position.set(bx, 0, bz);
      root.add(b);
      // janelas: frente (local +z) e laterais (local ±x); 70% "acesas" (material emissivo próprio do prédio)
      const win = new THREE.MeshStandardMaterial({ color: 0x2f3b45, roughness: 0.12, metalness: 0.6, envMapIntensity: 1.2, emissive: 0xffc46a, emissiveIntensity: 0 });
      const pos = [];
      const rows = Math.floor((h - 2.4) / 2.7), cf = Math.floor((w - 1.6) / 2.1), cl = Math.floor((d - 1.6) / 2.1);
      for (let r = 0; r < rows; r++) {
        const y = 1.9 + r * 2.7;
        for (let c = 0; c < cf; c++) pos.push([(c - (cf - 1) / 2) * 2.1, y, d / 2 + 0.03, 0]);
        for (let c = 0; c < cl; c++) for (const sx of [1, -1]) pos.push([sx * (w / 2 + 0.03), y, (c - (cl - 1) / 2) * 2.1, Math.PI / 2]);
      }
      const lit = [], dark = [];
      for (const p of pos) (R() < 0.7 ? lit : dark).push(p);
      for (const [lst, mat] of [[lit, win], [dark, winDark]]) {
        if (!lst.length) continue;
        const im = new THREE.InstancedMesh(winGeo, mat, lst.length); im.receiveShadow = true;
        lst.forEach((p, i) => setM(im, i, p[0], p[1], p[2], 1, 1, 1, p[3]));
        b.add(im);
      }
      av.buildings.push({ g: b, win, s, bx, bz, w, d, h, ordem: R(), fx: bx - s * (d / 2 + 0.05) });
      z += w + 0.5 + R() * 1.0;
    }
  }
  // ---------- skyline do fundo (caixas baratas com janelas em textura) ----------
  const [tDia, tNoite] = fachadaTex();
  av.sky = [];
  for (let i = 0; i < 34; i++) {
    const w = 10 + R() * 12, h = 30 + R() * 55, x = (i / 33 - 0.5) * 200 + (R() - 0.5) * 6, z = -125 - R() * 70;
    const mapa = tDia.clone(); mapa.repeat.set(w / 7, h / 12); mapa.needsUpdate = true;
    const em = tNoite.clone(); em.repeat.set(w / 7, h / 12); em.offset.set(R(), R()); em.needsUpdate = true;
    mapa.offset.copy(em.offset);
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, map: mapa, roughness: 0.85, emissive: 0xffffff, emissiveMap: em, emissiveIntensity: 0 });
    const b = new THREE.Mesh(BOX, m); b.scale.set(w, h, w); b.position.set(x, h / 2, z); b.receiveShadow = true;
    root.add(b); av.sky.push({ m, ordem: R() });
  }
  // ---------- estacionamento (vira floresta) ----------
  const lotM = mesh(new THREE.PlaneGeometry(30, LOT[1] - LOT[0]), 0x4b4c50, root, 0.95); lotM.rotation.x = -Math.PI / 2;
  lotM.position.set(-borda - 15, 0.03, (LOT[0] + LOT[1]) / 2); lotM.castShadow = false;
  const stripes = new THREE.InstancedMesh(BOX, M(0xf1ead6, 0.8), 12); root.add(stripes);
  for (let i = 0; i < 12; i++) setM(stripes, i, -borda - 4 - (i % 2) * 14 - 6, 0.05, LOT[0] + 3 + Math.floor(i / 2) * 4.6, 5.5, 0.03, 0.18);

  // ---------- postes ----------
  const postes = [];
  for (const s of [1, -1]) for (let z = -100; z < 60; z += 17) postes.push([s * (larg / 2 + 0.7), z, s]);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3f454c, roughness: 0.5, metalness: 0.6 });
  poleMat.userData = { c0: poleMat.color.clone(), r0: 0.5, m0: 0.6 };
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const pole = inst(new THREE.CylinderGeometry(0.11, 0.16, 8.4, 6), poleMat, postes.length, root);
  const arm = inst(BOX, poleMat, postes.length, root);
  const lamp = inst(BOX, lampMat, postes.length, root);
  av.lampGlow = [];
  postes.forEach(([x, z, s], i) => {
    setM(pole, i, x, 4.2, z, 1, 1, 1);
    setM(arm, i, x - s * 1.1, 8.3, z, 2.3, 0.14, 0.18);
    setM(lamp, i, x - s * 2.1, 8.15, z, 0.9, 0.18, 0.45);
    const gs = new THREE.Sprite(glowMat(0xffd59a)); gs.scale.setScalar(3.6); gs.position.set(x - s * 2.1, 8.0, z); root.add(gs); av.lampGlow.push(gs);
  });
  // ---------- semáforo (continua trocando de cor sozinho) ----------
  const sem = new THREE.Group(); sem.position.set(larg / 2 + 0.9, 0, 21); root.add(sem);
  mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.6, 8), poleMat, sem).position.y = 2.3;
  const caixa = mesh(new THREE.BoxGeometry(0.7, 1.9, 0.6), 0x1f2226, sem, 0.6); caixa.position.set(0, 5.2, 0.1);
  av.sinais = [0xff3b30, 0xffc12e, 0x3ddc6a].map((c, i) => {
    const m = new THREE.MeshStandardMaterial({ color: 0x222, emissive: c, emissiveIntensity: 0 });
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), m); l.position.set(0, 5.8 - i * 0.6, 0.42); sem.add(l);
    const gsp = new THREE.Sprite(glowMat(c)); gsp.scale.setScalar(1.6); gsp.position.copy(l.position); gsp.position.z += 0.1; sem.add(gsp);
    return { m, gsp };
  });
  // faixa de pedestres
  const zebra = new THREE.InstancedMesh(BOX, M(0xf1ead6, 0.8), 8); root.add(zebra);
  for (let i = 0; i < 8; i++) setM(zebra, i, (i - 3.5) * 2.1, 0.13, 18.5, 1.1, 0.02, 3.2);

  // ---------- carros (carro de toy.js; materiais clonados para enferrujar) ----------
  const CC = [0xb83a2e, 0x2f5c8a, 0xe8e2d4, 0x2b2d31, 0x8a8f96, 0xd9a23a, 0x3f6e4a, 0x6d2b3a];
  // [x, zParado, sentido(+1 vem p/ câmera), rotação extra, vel]
  const LAY = [[-6.6, 30, 1, 0.12], [-2.3, 22, 1, -0.06], [-6.4, 9, 1, 0.3], [-2.4, -4, 1, -0.2], [-6.7, -20, 1, 0.05], [-2.2, -38, 1, 0.1],
    [2.3, 34, -1, -0.15], [6.5, 14, -1, 0.08], [2.2, 2, -1, 0.45], [6.6, -12, -1, -0.1], [2.4, -27, -1, 0.04], [6.5, -46, -1, -0.2]];
  av.carros = LAY.map(([x, z, dir, rot], i) => {
    const c = carro(CC[i % CC.length]); root.add(c);
    c.userData = { x, z, dir, rot, v: 9 + (i % 3) * 1.5, ts: 4.3 + (i % 4) * 0.25 };
    c.position.set(x, 0.12, z); c.rotation.y = (dir > 0 ? 0 : Math.PI) + rot;
    return c;
  });
  for (let i = 0; i < 6; i++) { // estacionados
    const c = carro(CC[(i + 3) % CC.length]); root.add(c);
    c.position.set(-borda - 4 - (i % 2) * 14 - 6 + (i % 2 ? 0 : 0), 0.03, LOT[0] + 5.3 + Math.floor(i / 2) * 9.2); c.rotation.y = Math.PI / 2 * (i % 2 ? 1 : -1);
    av.carros.push(c); c.userData = { estac: true };
  }
  // faróis (sprites aditivos) presos nos carros
  av.farolGlow = [];
  av.carros.forEach((c) => {
    for (const x of [0.65, -0.65]) {
      const f = new THREE.Sprite(glowMat(0xfff1c8)); f.scale.setScalar(2.4); f.position.set(x, 0.85, 2.35); c.add(f); av.farolGlow.push(f);
      const tr = new THREE.Sprite(glowMat(0xff3020)); tr.scale.setScalar(1.3); tr.position.set(x, 0.8, -2.3); c.add(tr); av.farolGlow.push(tr);
    }
  });

  // ---------- clona materiais (a avenida passa a ser dona deles) ----------
  const clones = new Map();
  const fac = [], ferro = [poleMat], vidro = [], farol = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh && o.material === winDark) return;
    if (o.material === poleMat || o.material === lampMat || o.material.emissiveMap) return;
    if (av.buildings.some((b) => b.win === o.material)) return;
    let m = clones.get(o.material);
    if (!m) { m = o.material.clone(); m.userData.c0 = m.color.clone(); m.userData.r0 = m.roughness; clones.set(o.material, m); }
    o.material = m;
  });
  for (const b of av.buildings) b.g.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && !fac.includes(o.material)) fac.push(o.material); });
  for (const c of av.carros) c.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    if (m.emissive && m.emissive.getHex() !== 0 && !farol.includes(m)) farol.push(m);
    else if (m.userData.c0 && m.userData.c0.getHex() === 0xbfe3ee) { if (!vidro.includes(m)) vidro.push(m); }
    else if (!ferro.includes(m) && m.userData.c0 && m.userData.c0.getHex() !== 0x2d2f36) ferro.push(m);
  });
  av.road = base.group.children.find((o) => o.isMesh && o.geometry.type === "ExtrudeGeometry")?.material;
  av.chao = base.group.children[0].material;
  av.calcadas = base.group.children.filter((o) => o.isMesh && o.position.x !== 0).map((o) => o.material);
  av.mats = { fac, ferro, vidro, farol, lampMat };

  // ---------- rachaduras no asfalto + mato nas frestas ----------
  const SEG = [];
  for (let k = 0; k < 70; k++) {
    let x = (R() - 0.5) * (larg - 1.5), z = -70 + R() * 110, a = R() * Math.PI * 2;
    if (k < 10) { x = -5 + R() * 8; z = 14 + R() * 18; }
    const n = 8 + Math.floor(R() * 12), d0 = R() * 0.55;
    for (let j = 0; j < n; j++) {
      a += (R() - 0.5) * 1.2; const L = 0.5 + R() * 1.1;
      let x2 = x + Math.cos(a) * L, z2 = z + Math.sin(a) * L;
      if (Math.abs(x2) > larg / 2 - 0.3) { a = Math.PI - a; x2 = x; }
      SEG.push({ x: (x + x2) / 2, z: (z + z2) / 2, L, a, k: j / n, d0, w: 0.06 + R() * 0.1 * (1 - j / n) });
      x = x2; z = z2;
    }
  }
  const crackMat = new THREE.MeshStandardMaterial({ color: 0x141312, roughness: 1 });
  av.cracks = inst(BOX, crackMat, SEG.length, root); av.cracks.castShadow = false;
  const TUF = SEG.filter((_, i) => i % 2 === 0);
  // tufos nas calçadas e beiras também
  for (let i = 0; i < 160; i++) { const s = R() < 0.5 ? 1 : -1; TUF.push({ x: s * (larg / 2 + R() * calc), z: -80 + R() * 130, k: R(), d0: R() * 0.6, a: R() * 6 }); }
  av.tufos = inst(CONE, M(0xffffff, 0.8), TUF.length * 4, root);
  const verdes = [0x5d8c34, 0x7aa33e, 0x4a7a2e, 0x8fae4a, 0x3e6a28];
  TUF.forEach((p, i) => { for (let j = 0; j < 4; j++) av.tufos.setColorAt(i * 4 + j, new THREE.Color(verdes[(i + j) % 5])); p.s = 0.6 + R() * 0.9; });
  av.SEG = SEG; av.TUF = TUF;

  // ---------- hera nas fachadas + rachaduras nas paredes ----------
  const HERA = [], FEN = [];
  for (const b of av.buildings) {
    const z0 = b.bz - b.w / 2, z1 = b.bz + b.w / 2;
    for (let i = 0; i < 26; i++) { const y = Math.pow(R(), 1.6) * b.h; HERA.push({ x: b.fx - b.s * 0.15, y, z: z0 + R() * b.w, k: y / b.h + R() * 0.25, r: 0.8 + R() * 1.4 }); }
    for (let i = 0; i < 10; i++) HERA.push({ x: b.fx - b.s * 0.15, y: R() * 1.5, z: z0 + R() * b.w, k: R() * 0.15, r: 1 + R() * 1.2 });
    for (let c = 0; c < 2; c++) {
      let y = b.h - 0.5 - R() * 4, z = z0 + 1 + R() * (b.w - 2), a = -Math.PI / 2 + (R() - 0.5) * 0.6; const n = 10 + Math.floor(R() * 10), d0 = R() * 0.4;
      for (let j = 0; j < n && y > 0.5; j++) { a += (R() - 0.5) * 0.9; a = clamp(a, -Math.PI + 0.3, -0.3); const L = 0.6 + R() * 0.9; const y2 = y + Math.sin(a) * L, z2 = z + Math.cos(a) * L; FEN.push({ x: b.fx - b.s * 0.06, y: (y + y2) / 2, z: (z + z2) / 2, L, a, k: j / n, d0 }); y = y2; z = z2; }
    }
  }
  av.hera = inst(SPH_L, M(0xffffff, 0.9), HERA.length, root);
  HERA.forEach((p, i) => av.hera.setColorAt(i, new THREE.Color([0x3f6a2a, 0x557f33, 0x2f5622, 0x6b8f3a][i % 4])));
  av.fendas = inst(BOX, crackMat, FEN.length, root); av.fendas.castShadow = false;
  av.HERA = HERA; av.FEN = FEN;

  // ---------- ferrugem: manchas que se espalham nos carros e postes ----------
  const RUST = [];
  av.carros.forEach((c, ci) => { for (let i = 0; i < 9; i++) RUST.push({ c, lx: (R() - 0.5) * 2.0, ly: 0.75 + R() * 0.55, lz: (R() - 0.5) * 3.8, k: R(), r: 0.35 + R() * 0.45 }); });
  postes.forEach(([x, z]) => { for (let i = 0; i < 3; i++) RUST.push({ wx: x, wy: 0.5 + R() * 6, wz: z, k: R(), r: 0.22 }); });
  av.rust = inst(SPH_L, new THREE.MeshStandardMaterial({ color: 0x8a4a22, roughness: 1 }), RUST.length, root);
  RUST.forEach((p, i) => av.rust.setColorAt(i, new THREE.Color([0x8a4a22, 0x6e3518, 0xa25a28][i % 3])));
  av.RUST = RUST;

  // ---------- floresta: árvores instanciadas (rua, calçada, estacionamento) + árvores-herói (arvore de toy.js) ----------
  const ARV = [];
  const add = (x, z, b, s) => ARV.push({ x, z, b, s, c: Math.floor(R() * 4), r: R() * 6 });
  for (let i = 0; i < 60; i++) { const x = (R() - 0.5) * (larg + 2); let z = -95 + R() * 125; if (z > 16) z -= 40; add(x, z, R() * 0.55, 0.9 + R() * 0.8); }
  for (let i = 0; i < 26; i++) add(-borda - 2 - R() * 26, LOT[0] + R() * (LOT[1] - LOT[0]), R() * 0.5, 1 + R() * 0.7);
  for (let i = 0; i < 24; i++) { const s = R() < 0.5 ? 1 : -1; add(s * (larg / 2 + 0.5 + R() * 3), -95 + R() * 140, R() * 0.6, 0.8 + R() * 0.6); }
  const copaCores = [0x3f6e2c, 0x4f7f34, 0x5a8a3a, 0x36612a];
  av.tronco = inst(TRONCO, M(0x5a4231, 0.9), ARV.length, root);
  av.copa = inst(SPH_B, M(0xffffff, 0.85), ARV.length * 3, root);
  ARV.forEach((p, i) => { for (let j = 0; j < 3; j++) av.copa.setColorAt(i * 3 + j, new THREE.Color(copaCores[(p.c + j) % 4]).multiplyScalar(0.85 + 0.3 * ((p.r * (j + 1)) % 1))); });
  av.ARV = ARV;
  av.herois = [[-11.5, 26, 0.1], [11.2, 33, 0.15], [-1.5, 4, 0.25], [6.5, 12, 0.05], [-11, 40, 0.2], [3.5, -10, 0.3]].map(([x, z, b], i) => {
    const a = arvore(1, PAL.verde, 900 + i); a.position.set(x, 0.12, z); root.add(a); a.userData = { b, s: 2.6 + (i % 3) * 0.5 }; a.visible = false; return a;
  });
  // arbustos cobrindo os carros
  const ARB = [];
  av.carros.forEach((c) => { for (let i = 0; i < 6; i++) ARB.push({ c, lx: (R() - 0.5) * 3.4, lz: (R() - 0.5) * 5.2, k: R(), r: 0.6 + R() * 0.8 }); });
  av.arbusto = inst(SPH_L, M(0xffffff, 0.9), ARB.length, root);
  ARB.forEach((p, i) => av.arbusto.setColorAt(i, new THREE.Color(copaCores[i % 4])));
  av.ARB = ARB;
  // neve/geada (f05): véu branco sobre o asfalto via cor do material

  root.updateMatrixWorld(true);
  av.state = {};
  av.set = (st, t) => aplicar(av, st, t);
  av.carrosAndando = (t, tf, tau) => carrosAndando(av, t, tf, tau);
  av.set({}, 0);
  return av;
}

const DEF = { apagao: 0, janelas: 0, luzRua: 0, farois: 0, sinal: 0, racha: 0, mato: 0, hera: 0, ferrugem: 0, floresta: 0, fenda: 0, neve: 0, sujeira: 0, skyline: null };
const _c = new THREE.Color(), _v = new THREE.Vector3();
// aplica o estado de abandono. t = tempo da cena (para piscar luzes e semáforo)
export function aplicar(av, st, t = 0) {
  const s = Object.assign({}, DEF, st);
  // janelas acesas: prédio a prédio conforme "apagao" (com piscada na hora de apagar)
  for (const b of av.buildings) {
    const x = (b.ordem - s.apagao) / 0.05;
    let on = clamp(x);
    if (x > 0 && x < 1) on = Math.sin(t * 47 + b.ordem * 90) > 0 ? 1 : 0.15;
    b.win.emissiveIntensity = s.janelas * on * 1.4;
  }
  const sk = s.skyline ?? s.apagao;
  for (const k of av.sky) { const on = clamp((k.ordem - sk) / 0.04); k.m.emissiveIntensity = s.janelas * on * 1.3; }
  av.mats.lampMat.emissiveIntensity = s.luzRua * 2.2;
  av.lampGlow.forEach((g, i) => { g.material.opacity = s.luzRua * 0.6 * (0.85 + 0.15 * Math.sin(t * 3 + i)); });
  av.mats.farol.forEach((m) => { m.emissiveIntensity = 0.3 + s.farois * 2.5; });
  av.farolGlow.forEach((g) => { g.material.opacity = s.farois * 0.9; });
  // semáforo: ciclo verde 2.0 s, amarelo 0.7 s, vermelho 2.0 s
  const cyc = (t + 1.2) % 4.7, fase = cyc < 2.0 ? 2 : cyc < 2.7 ? 1 : 0;
  av.sinais.forEach((l, i) => { const on = s.sinal * (i === fase ? 1 : 0); l.m.emissiveIntensity = on * 3; l.gsp.material.opacity = on * 0.9; });
  // ferrugem e sujeira
  const fe = s.ferrugem;
  for (const m of av.mats.ferro) { m.color.copy(m.userData.c0).lerp(_c.setHex(0x6b3a1e), fe * 0.75); m.roughness = lerp(m.userData.r0 ?? 0.5, 1, fe); m.metalness = lerp(m.userData.m0 ?? 0, 0.05, fe); }
  for (const m of av.mats.vidro) m.color.copy(m.userData.c0).lerp(_c.setHex(0x55604a), Math.max(fe, s.sujeira) * 0.8);
  for (const m of av.mats.fac) m.color.copy(m.userData.c0).lerp(_c.setHex(0x5d5a4c), s.sujeira * 0.55);
  if (av.road) av.road.color.copy(av.road.userData.c0).lerp(_c.setHex(0xe8eef2), s.neve * 0.8).lerp(_c.setHex(0x4a4f3c), s.sujeira * 0.5);
  if (av.chao) av.chao.color.copy(av.chao.userData.c0).lerp(_c.setHex(0xf2f5f7), s.neve * 0.85).lerp(_c.setHex(0x55703a), Math.max(s.mato, s.floresta) * 0.8);
  for (const m of av.calcadas) m.color.copy(m.userData.c0).lerp(_c.setHex(0xeef2f4), s.neve * 0.8).lerp(_c.setHex(0x6d7550), s.sujeira * 0.6);
  // rachaduras do asfalto crescendo ao longo do traço
  av.SEG.forEach((p, i) => {
    const k = clamp((s.racha * 1.6 - p.d0 - p.k * 0.6) / 0.15);
    setM(av.cracks, i, p.x, 0.125, p.z, p.w * (0.4 + 0.6 * k) + s.floresta * 0.15, 0.02, p.L * k + 0.001, -p.a + Math.PI / 2);
  });
  av.cracks.instanceMatrix.needsUpdate = true;
  // mato brotando nas frestas
  av.TUF.forEach((p, i) => {
    const k = ease.outCubic(clamp((s.mato * 1.6 - p.d0 - p.k * 0.4) / 0.4)) * (1 + s.floresta * 0.25);
    const y = p.x * p.x > (av.larg / 2) ** 2 ? 0.4 : 0.12;
    for (let j = 0; j < 4; j++) { const a = p.a + j * 1.57; setM(av.tufos, i * 4 + j, p.x + Math.cos(a) * 0.05, y, p.z + Math.sin(a) * 0.05, 0.05 * p.s * k, (0.55 + 0.2 * j) * p.s * k, 0.05 * p.s * k, a, 0, 0.25 + 0.12 * j + Math.sin(t * 2 + p.a + j) * 0.05); }
  });
  av.tufos.instanceMatrix.needsUpdate = true; if (av.tufos.instanceColor) av.tufos.instanceColor.needsUpdate = true;
  // hera subindo as fachadas
  av.HERA.forEach((p, i) => {
    const k = ease.outCubic(clamp((s.hera * 1.25 - p.k) / 0.2));
    setM(av.hera, i, p.x, p.y, p.z, 0.18 * k, p.r * k, p.r * 0.9 * k);
  });
  av.hera.instanceMatrix.needsUpdate = true; if (av.hera.instanceColor) av.hera.instanceColor.needsUpdate = true;
  av.FEN.forEach((p, i) => {
    const k = clamp((s.fenda * 1.5 - p.d0 - p.k * 0.5) / 0.12);
    setM(av.fendas, i, p.x, p.y, p.z, 0.06, 0.09 + 0.05 * k, p.L * k + 0.001, 0, -p.a + 0, 0);
  });
  av.fendas.instanceMatrix.needsUpdate = true;
  // manchas de ferrugem se espalhando
  av.RUST.forEach((p, i) => {
    const k = ease.outCubic(clamp((fe * 1.4 - p.k * 0.6) / 0.35));
    if (p.c) { _v.set(p.lx, p.ly, p.lz); p.c.localToWorld(_v); } else _v.set(p.wx, p.wy, p.wz);
    setM(av.rust, i, _v.x, _v.y, _v.z, p.r * k, p.r * 0.45 * k, p.r * k);
  });
  av.rust.instanceMatrix.needsUpdate = true; if (av.rust.instanceColor) av.rust.instanceColor.needsUpdate = true;
  // floresta crescendo
  const fl = s.floresta;
  av.ARV.forEach((p, i) => {
    const k = ease.outCubic(clamp((fl - p.b) / 0.42)) * p.s;
    const sw = Math.sin(t * 0.9 + p.r) * 0.03;
    setM(av.tronco, i, p.x, 0.1, p.z, 1.6 * k, 7 * k, 1.6 * k, 0, 0, sw);
    for (let j = 0; j < 3; j++) {
      const a = p.r + j * 2.1, rr = (j ? 1.4 : 0) * k;
      setM(av.copa, i * 3 + j, p.x + Math.cos(a) * rr + sw * 6 * k, (6.8 + j * 0.9) * k, p.z + Math.sin(a) * rr, (2.6 - j * 0.3) * k, (2.2 - j * 0.2) * k, (2.6 - j * 0.3) * k);
    }
  });
  av.tronco.instanceMatrix.needsUpdate = true; av.copa.instanceMatrix.needsUpdate = true; if (av.copa.instanceColor) av.copa.instanceColor.needsUpdate = true;
  av.herois.forEach((a) => { const k = ease.outCubic(clamp((fl - a.userData.b) / 0.45)); a.visible = k > 0.01; a.scale.setScalar(Math.max(1e-3, k * a.userData.s)); a.rotation.z = Math.sin(t * 0.8 + a.position.x) * 0.02; });
  // árvores da calçada (rua de toy.js) engrossam
  av.ARB.forEach((p, i) => {
    const k = ease.outCubic(clamp((Math.max(s.mato * 0.5, fl) * 1.3 - p.k * 0.5) / 0.4));
    _v.set(p.lx, 0.6, p.lz); p.c.localToWorld(_v);
    setM(av.arbusto, i, _v.x, _v.y, _v.z, p.r * k, p.r * 0.8 * k, p.r * k);
  });
  av.arbusto.instanceMatrix.needsUpdate = true; if (av.arbusto.instanceColor) av.arbusto.instanceColor.needsUpdate = true;
  av.cracks.visible = s.racha > 0; av.tufos.visible = s.mato > 0; av.hera.visible = s.hera > 0; av.fendas.visible = s.fenda > 0;
  av.rust.visible = fe > 0; av.tronco.visible = av.copa.visible = fl > 0; av.arbusto.visible = Math.max(s.mato * 0.5, fl) > 0.05;
  for (const m of [av.hera, av.tufos, av.rust, av.cracks, av.fendas]) m.castShadow = false;
  av.state = s;
}

// f01: carros rodando e freando até a posição parada (tFreio = quando as pessoas somem)
export function carrosAndando(av, t, tFreio = 3.2, tau = 1.6) {
  for (const c of av.carros) {
    const u = c.userData; if (u.estac) continue;
    const tb = tFreio + (u.ts - 4.3) * 0.5, ts = tb + tau;
    let rest;
    if (t < tb) rest = u.v * (tb - t) + u.v * tau / 2;
    else if (t < ts) rest = (u.v / (2 * tau)) * (ts - t) * (ts - t);
    else rest = 0;
    c.position.z = u.z - u.dir * rest;
    const parado = 1 - clamp(rest / 6);
    c.rotation.y = (u.dir > 0 ? 0 : Math.PI) + u.rot * parado;
    c.position.x = u.x + u.rot * parado * 0.6;
  }
}

/* ---------- multidão instanciada (barata): tronco, cabeça e pernas ---------- */
export function gente(S, { n = 180, seed = 21, larg = 18, calc = 4, zona = [-60, 44], rua = 0.25 } = {}) {
  const R = mulberry32(seed);
  const tor = (() => { const g = new THREE.CapsuleGeometry(0.21, 0.42, 2, 8); return g; })();
  const perna = (() => { const g = new THREE.CapsuleGeometry(0.085, 0.62, 1, 6); g.translate(0, -0.4, 0); return g; })();
  const cab = new THREE.SphereGeometry(0.14, 8, 6);
  const mT = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), mP = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), mC = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const iT = inst(tor, mT, n, S), iP = inst(perna, mP, n * 2, S), iC = inst(cab, mC, n, S);
  const camisas = [0xb83a2e, 0x2f5c8a, 0xe8e2d4, 0x2b2d31, 0xd9a23a, 0x3f6e4a, 0x8a5aa0, 0xe07a5f, 0x5f8fb0, 0xf2f0ea];
  const calcas = [0x2c3550, 0x3a3a3e, 0x6b5a48, 0x1e2230, 0x55606e];
  const peles = [0xf2c49b, 0xd9a07a, 0xa8714f, 0x7a4e33, 0xe8b48c];
  const P = [];
  for (let i = 0; i < n; i++) {
    let x, z, dx, dz;
    if (R() < rua) { x = (R() - 0.5) * (larg - 2); z = zona[0] + R() * (zona[1] - zona[0]); const a = R() * 6.28; dx = Math.cos(a); dz = Math.sin(a); }
    else { const s = R() < 0.5 ? 1 : -1; x = s * (larg / 2 + 0.6 + R() * (calc - 1.2)); z = zona[0] + R() * (zona[1] - zona[0]); dx = 0; dz = R() < 0.5 ? 1 : -1; }
    P.push({ x, z, dx, dz, v: 1.1 + R() * 0.6, ph: R() * 6.28, ordem: R(), h: 0.92 + R() * 0.16, x0: x, z0: z });
    iT.setColorAt(i, new THREE.Color(camisas[Math.floor(R() * camisas.length)]));
    const cp = new THREE.Color(calcas[Math.floor(R() * calcas.length)]); iP.setColorAt(i * 2, cp); iP.setColorAt(i * 2 + 1, cp);
    iC.setColorAt(i, new THREE.Color(peles[Math.floor(R() * peles.length)]));
  }
  // poeira/brilho no instante de sumir/surgir
  const NP = n * 5, pos = new Float32Array(NP * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.PointsMaterial({ color: 0xfff4dc, size: 0.22, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, pm); pts.frustumCulled = false; S.add(pts);
  const PV = Array.from({ length: NP }, () => [R() - 0.5, R() * 1.8, R() - 0.5, 0.6 + R()]);
  // update(t, { modo, t0, dur, anda, olha: [x,z] })
  function update(t, { modo = "fica", t0 = 0, dur = 0.5, anda = false, olha = null, dz = 0, bd = 0.7, sobe = 0, lento = 1 } = {}) {
    let np = 0;
    P.forEach((p, i) => {
      const ti = t0 + p.ordem * dur;
      let k = 1, burst = -1;
      if (modo === "some") { k = t < ti ? 1 : 1 - clamp((t - ti) / (0.08 * lento)); burst = t - ti; }
      if (modo === "surge") { k = t < ti ? 0 : ease.outBack(clamp((t - ti) / 0.25)); burst = t - ti; }
      const tt = anda ? t : 0;
      const x = p.x0 + p.dx * p.v * tt, z = p.z0 + p.dz * p.v * tt + dz;
      let ry = Math.atan2(p.dx, p.dz);
      if (olha) ry = Math.atan2(olha[0] - x, olha[1] - z) + Math.sin(t * 0.7 + p.ph) * 0.5;
      const ph = t * p.v * 2.2 + p.ph, sw = anda ? Math.sin(ph) * 0.5 : Math.sin(t * 1.5 + p.ph) * 0.03;
      const bob = anda ? Math.abs(Math.sin(ph)) * 0.05 : 0, h = p.h * k;
      setM(iT, i, x, (1.18 + bob) * p.h, z, k, h, k, ry);
      setM(iC, i, x, (1.82 + bob) * p.h, z, k, k, k, ry);
      for (const sd of [0, 1]) {
        _o.position.set(x + Math.cos(ry) * (sd ? 0.1 : -0.1), (0.86 + bob) * p.h, z - Math.sin(ry) * (sd ? 0.1 : -0.1));
        _o.rotation.set(0, ry, 0); _o.rotateX(sd ? sw : -sw); _o.scale.set(k || 1e-4, h || 1e-4, k || 1e-4); _o.updateMatrix(); iP.setMatrixAt(i * 2 + sd, _o.matrix);
      }
      if (burst > 0 && burst < bd) {
        const e = ease.outCubic(burst / bd);
        for (let j = 0; j < 5; j++) { const v = PV[i * 5 + j]; pos[np * 3] = x + v[0] * 1.6 * e; pos[np * 3 + 1] = 0.2 + v[1] * (0.6 + e * 0.6) + sobe * e * v[3]; pos[np * 3 + 2] = z + v[2] * 1.6 * e; np++; }
      }
    });
    for (let j = np; j < NP; j++) pos[j * 3 + 1] = -50;
    geo.attributes.position.needsUpdate = true;
    pm.opacity = 0.9; pm.size = 0.22 * (bd > 1 ? 1.4 : 1);
    for (const m of [iT, iP, iC]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }
  return { update, P, meshes: [iT, iP, iC], pts };
}

/* ---------- lobo e cervo (primitivas arredondadas, mesmo estilo de animals.js; olham para +x, pés em y = 0) ---------- */
const _cap = new Map();
function capGeo(r, len) {
  const k = r.toFixed(3) + "/" + len.toFixed(3);
  if (!_cap.has(k)) { const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 3, 8); g.translate(0, -len / 2, 0); _cap.set(k, g); }
  return _cap.get(k);
}
function blob(p, c, s, pos, rough = 0.8) { const m = mesh(SPH_B, c, p, rough); m.scale.set(...s); m.position.set(...pos); return m; }
function piv(p, pos, rz = 0) { const g = new THREE.Group(); g.position.set(...pos); g.rotation.z = rz; p.add(g); return g; }
function limb(p, pos, len, r, c, rz = 0) { const g = piv(p, pos, rz); mesh(capGeo(r, len), c, g); return g; }
function olhos(p, x, y, z, r, cor = 0x17120f) {
  for (const s of [1, -1]) { blob(p, cor, [r * 0.6, r, r], [x, y, s * z], 0.12); blob(p, M(0xffffff, 0.2, { emissive: 0xffffff, emissiveIntensity: 0.6 }), [r * 0.2, r * 0.2, r * 0.2], [x + r * 0.5, y + r * 0.35, s * z]); }
}
export function fauna(tipo, { fase = 0, chifre = true, cor = null } = {}) {
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  let head, legs, tail, legAmp, bob;
  if (tipo === "lobo") {
    const C = cor ?? 0x847b70, E = 0x4e4842, L = 0xd8cfc0;
    blob(body, C, [0.72, 0.3, 0.27], [0, 0.95, 0]);
    blob(body, E, [0.55, 0.16, 0.2], [-0.05, 1.18, 0]);
    blob(body, L, [0.34, 0.27, 0.24], [0.48, 0.92, 0]);
    blob(body, C, [0.3, 0.33, 0.3], [0.5, 1.02, 0]);
    legs = [[0.48, 0.13], [0.48, -0.13], [-0.5, 0.13], [-0.5, -0.13]].map(([x, z]) => { const l = limb(body, [x, 0.86, z], 0.86, 0.07, C); blob(l, L, [0.08, 0.05, 0.07], [0.03, -0.84, 0]); return l; });
    head = piv(body, [0.8, 1.22, 0]);
    blob(head, C, [0.25, 0.2, 0.19], [0, 0, 0]);
    blob(head, L, [0.2, 0.1, 0.11], [0.26, -0.06, 0]);
    blob(head, C, [0.18, 0.08, 0.09], [0.24, 0.0, 0]);
    blob(head, 0x1a1614, [0.05, 0.045, 0.05], [0.44, -0.02, 0], 0.3);
    for (const s of [1, -1]) { const e = mesh(new THREE.ConeGeometry(0.08, 0.22, 6), E, head); e.position.set(-0.06, 0.24, s * 0.1); e.rotation.x = s * -0.2; }
    olhos(head, 0.17, 0.07, 0.1, 0.035, 0xc89a30);
    tail = limb(body, [-0.7, 1.08, 0], 0.7, 0.09, E, -0.6);
    blob(tail, E, [0.12, 0.3, 0.12], [0, -0.45, 0]);
    legAmp = 0.55; bob = 0.05;
  } else {
    const C = cor ?? 0xa06a3c, L = 0xefe2cc, Ch = 0x6a5236;
    blob(body, C, [0.72, 0.34, 0.3], [0, 1.28, 0]);
    blob(body, L, [0.5, 0.14, 0.22], [0, 1.06, 0]);
    legs = [[0.48, 0.14], [0.48, -0.14], [-0.5, 0.14], [-0.5, -0.14]].map(([x, z]) => { const l = limb(body, [x, 1.18, z], 1.18, 0.055, C); blob(l, 0x2e2621, [0.06, 0.05, 0.06], [0.02, -1.16, 0]); return l; });
    const neck = limb(body, [0.55, 1.42, 0], 0.7, 0.12, C, Math.PI - 0.55);
    head = piv(body, [0.92, 2.05, 0]);
    blob(head, C, [0.22, 0.15, 0.14], [0, 0, 0]);
    blob(head, C, [0.2, 0.09, 0.09], [0.22, -0.05, 0]);
    blob(head, 0x1a1614, [0.05, 0.045, 0.05], [0.4, -0.05, 0], 0.3);
    for (const s of [1, -1]) blob(head, C, [0.06, 0.16, 0.08], [-0.08, 0.14, s * 0.15]);
    olhos(head, 0.1, 0.05, 0.11, 0.035);
    if (chifre) for (const s of [1, -1]) {
      const a = limb(head, [-0.02, 0.14, s * 0.07], 0.6, 0.03, Ch, Math.PI + 0.25); a.rotation.x = s * 0.35;
      for (let j = 0; j < 3; j++) { const b = limb(a, [0, -0.18 - j * 0.15, 0], 0.26, 0.022, Ch, -0.9); b.rotation.x = s * -0.2; }
    }
    tail = limb(body, [-0.7, 1.42, 0], 0.22, 0.06, L, -0.8);
    legAmp = 0.45; bob = 0.06;
  }
  const a = { group: g, body, head, legs, tail, fase };
  a.update = (t, o = {}) => {
    const f = o.passo ?? 0, ph = t * f * Math.PI * 2 + fase * 6.283;
    legs.forEach((Lg, i) => { const off = ((i % 2) ^ (i >> 1)) * Math.PI; Lg.rotation.z = f ? Math.sin(ph + off) * legAmp : 0; });
    body.position.y = f ? Math.abs(Math.sin(ph)) * bob : 0;
    const idle = Math.sin(t * 2.1 + fase * 6.283);
    head.rotation.z = (o.cabeca ?? 0) + (f ? Math.sin(ph * 2) * 0.05 : idle * 0.05);
    head.rotation.y = o.vira ?? 0;
    if (tail) tail.rotation.x = Math.sin(t * 3 + fase * 5) * 0.25;
  };
  a.update(0);
  return a;
}
