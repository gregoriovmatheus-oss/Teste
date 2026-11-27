/**
 * animals.js — fábrica de bichos e bonecos em anime cel-shaded (R09; toon + contorno via toy.js) (mesma cara em todas as cenas).
 *
 *   import { createAnimal, face } from "./assets/lib/blocks/animals.js";
 *   const leao = createAnimal("leao", { fase: 0.3 });   scene.add(leao.group);
 *   leao.update(t, { passo: 1.6 })      // passo = passadas/s (0 = parado). Andar = balanço senoidal.
 *   face(leao.group, dx, dz)             // vira o bicho para a direção (dx, dz) no chão
 *
 * Tipos: humano, leao, girafa, elefante, macaco, passaro, aguia, rato, coelho, baleia, golfinho, polvo, zebra,
 *        rinoceronte, peixe. Todos olham para +x, pés em y = 0 (aquáticos: centro em y = 0).
 * Opções do update: passo, pescoco (girafa/zebra: abaixa o pescoço, rad), amp (amplitude da perna), voa (bater de asas/s), sobe (macaco escalando, 0/1),
 *   cabeca (inclinação extra), tromba (0..1 enrola), nada (nadar/s), salto (coelho pulando).
 * Opções de criação: cor, cor2 (humano: camisa/calça; pássaro/peixe: corpo), cabelo, fase.
 */
import * as THREE from "../three.module.js";
import { M, SPH, mesh, PAL } from "./toy.js";

const _cap = new Map();
function capGeo(r, len) {
  const k = r.toFixed(3) + "/" + len.toFixed(3);
  if (!_cap.has(k)) {
    const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 6, 14);
    g.translate(0, -len / 2, 0);
    _cap.set(k, g);
  }
  return _cap.get(k);
}
const _cone = new Map();
function coneGeo(r, h) {
  const k = r + "/" + h;
  if (!_cone.has(k)) { const g = new THREE.ConeGeometry(r, h, 14); g.translate(0, h / 2, 0); _cone.set(k, g); }
  return _cone.get(k);
}
const TORUS = new THREE.TorusGeometry(1, 0.07, 8, 28);

function blob(p, c, s, pos, rough = 0.7) { const m = mesh(SPH, c, p, rough); m.scale.set(...s); m.position.set(...pos); return m; }
function piv(p, pos, rz = 0) { const g = new THREE.Group(); g.position.set(...pos); g.rotation.z = rz; p.add(g); return g; }
function limb(p, pos, len, r, c, rz = 0) { const g = piv(p, pos, rz); mesh(capGeo(r, len), c, g); g.userData.len = len; return g; }
function cone(p, c, r, h, pos, rz = 0, rx = 0) { const m = mesh(coneGeo(r, h), c, p); m.position.set(...pos); m.rotation.z = rz; m.rotation.x = rx; return m; }
// olhos realistas (R10): globo escuro brilhante, pequeno, com um reflexo de luz. Humanos têm esclera discreta. Olham para +x.
const OLHO = () => M(0x17120f, 0.12);
const BRILHO = () => M(0xffffff, 0.2, { emissive: 0xffffff, emissiveIntensity: 0.6 });
function eyes(p, x, y, z, r = 0.06, humano = false) {
  const R = humano ? r * 1.25 : r * 1.05;
  for (const s of [1, -1]) {
    if (humano) blob(p, 0xf4efe6, [R * 0.5, R * 0.7, R * 0.8], [x - R * 0.1, y, s * z]);
    const ir = mesh(SPH, humano ? M(0x3b2618, 0.2) : OLHO(), p, 0.15, false);
    ir.scale.set(R * 0.55, R * (humano ? 0.6 : 0.8), R * (humano ? 0.5 : 0.8)); ir.position.set(x + R * (humano ? 0.25 : 0.05), y, s * z);
    const h1 = mesh(SPH, BRILHO(), p, 0.2, false); h1.scale.setScalar(R * 0.14); h1.position.set(x + R * 0.5, y + R * 0.3, s * z + s * R * 0.1);
  }
}
// anel (listra) em volta de um elipsoide de raios (ry, rz) no plano yz, na posição x
function ring(p, c, x, ry, rz, th = 1, rotX = 0) {
  const m = mesh(TORUS, c, p, 0.7);
  m.rotation.y = Math.PI / 2; m.position.x = x; m.scale.set(ry, rz, th);
  if (rotX) m.rotation.x = rotX;
  return m;
}

const B = {};

B.humano = (o) => {
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  const cam = o.cor ?? PAL.tijolo, cal = o.cor2 ?? 0x3f5677, cab = o.cabelo ?? 0x4a3226;
  const legs = [limb(body, [0, 0.88, 0.11], 0.88, 0.1, cal), limb(body, [0, 0.88, -0.11], 0.88, 0.1, cal)];
  blob(body, cam, [0.2, 0.36, 0.27], [0, 1.2, 0]);
  const arms = [limb(body, [0, 1.47, 0.3], 0.66, 0.075, cam), limb(body, [0, 1.47, -0.3], 0.66, 0.075, cam)];
  for (const a of arms) blob(a, PAL.pele, [0.08, 0.08, 0.08], [0, -0.66, 0]);
  const head = piv(body, [0, 1.72, 0]);
  blob(head, PAL.pele, [0.2, 0.22, 0.2], [0, 0.04, 0]);
  blob(head, cab, [0.21, 0.15, 0.21], [-0.03, 0.14, 0]);
  if (o.mulher) blob(head, cab, [0.1, 0.2, 0.2], [-0.13, -0.05, 0]);
  eyes(head, 0.17, 0.06, 0.07, 0.03, true);
  return { g, body, head, legs, arms, legAmp: 0.55, bob: 0.06 };
};

B.leao = () => {
  const Y = 0xc99a58, J = 0x7a4826;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, Y, [0.95, 0.48, 0.46], [0, 1.0, 0]);
  const legs = [[0.6, 0.27], [0.6, -0.27], [-0.62, 0.27], [-0.62, -0.27]].map(([x, z]) => {
    const l = limb(body, [x, 0.9, z], 0.9, 0.15, Y); blob(l, 0xf6d9a8, [0.16, 0.08, 0.17], [0.04, -0.88, 0]); return l;
  });
  const head = piv(body, [1.0, 1.38, 0]);
  blob(head, J, [0.36, 0.56, 0.6], [-0.08, 0, 0]);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; blob(head, J, [0.18, 0.18, 0.18], [-0.12, Math.sin(a) * 0.5, Math.cos(a) * 0.52]); }
  blob(head, Y, [0.36, 0.34, 0.34], [0.16, 0, 0]);
  blob(head, 0xf6d9a8, [0.17, 0.13, 0.2], [0.44, -0.12, 0]);
  blob(head, 0x3a2a2a, [0.06, 0.05, 0.08], [0.6, -0.04, 0], 0.4);
  for (const s of [1, -1]) blob(head, Y, [0.08, 0.1, 0.1], [0.05, 0.32, s * 0.22]);
  eyes(head, 0.42, 0.1, 0.14, 0.05);
  const tail = limb(body, [-0.9, 1.15, 0], 0.85, 0.05, Y, -0.9);
  blob(tail, J, [0.1, 0.13, 0.1], [0, -0.85, 0]);
  return { g, body, head, legs, tail, legAmp: 0.5, bob: 0.05 };
};

B.girafa = () => {
  const Y = PAL.amarelo, S = 0xb5532a;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, Y, [0.9, 0.55, 0.45], [0, 2.2, 0]);
  const legs = [[0.55, 0.22], [0.55, -0.22], [-0.55, 0.22], [-0.55, -0.22]].map(([x, z]) => {
    const l = limb(body, [x, 2.0, z], 2.0, 0.11, Y); blob(l, 0x5a3a2a, [0.12, 0.08, 0.12], [0, -1.97, 0]); return l;
  });
  const neck = limb(body, [0.65, 2.45, 0], 2.1, 0.16, Y, Math.PI - 0.4);
  const head = piv(neck, [0, -2.1, 0], -(Math.PI - 0.4));
  blob(head, Y, [0.38, 0.2, 0.2], [0.18, 0, 0]);
  blob(head, 0xf6d9a8, [0.16, 0.13, 0.15], [0.48, -0.04, 0]);
  for (const s of [1, -1]) {
    const o = limb(head, [0, 0.12, s * 0.08], 0.3, 0.035, S, Math.PI); blob(o, S, [0.06, 0.06, 0.06], [0, -0.3, 0]);
    blob(head, Y, [0.06, 0.04, 0.12], [-0.05, 0.12, s * 0.2]);
  }
  eyes(head, 0.25, 0.1, 0.13, 0.045);
  // manchas
  for (let i = 0; i < 18; i++) {
    const a = i * 2.4, b = ((i * 0.618) % 1) * 2 - 1;
    const x = b * 0.75, rr = Math.sqrt(1 - (x / 0.9) ** 2);
    blob(body, S, [0.12, 0.12, 0.12], [x, 2.2 + Math.sin(a) * 0.53 * rr, Math.cos(a) * 0.43 * rr]);
  }
  for (let i = 0; i < 9; i++) { const a = i * 2.1; blob(neck, S, [0.07, 0.09, 0.07], [Math.sin(a) * 0.13, -0.3 - i * 0.18, Math.cos(a) * 0.13]); }
  const tail = limb(body, [-0.85, 2.4, 0], 0.8, 0.03, Y, -0.35);
  blob(tail, S, [0.06, 0.1, 0.06], [0, -0.8, 0]);
  return { g, body, head, legs, neck, tail, legAmp: 0.32, bob: 0.06 };
};

B.elefante = () => {
  const C = 0x8f8b86, E = 0x7f7a74;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [1.45, 1.1, 1.0], [0, 2.1, 0]);
  const legs = [[0.8, 0.5], [0.8, -0.5], [-0.8, 0.5], [-0.8, -0.5]].map(([x, z]) => {
    const l = limb(body, [x, 1.45, z], 1.45, 0.32, C); blob(l, 0xe9e2d6, [0.3, 0.07, 0.3], [0, -1.42, 0]); return l;
  });
  const head = piv(body, [1.45, 2.55, 0]);
  blob(head, C, [0.72, 0.72, 0.68], [0, 0, 0]);
  const ears = [1, -1].map((s) => { const e = piv(head, [-0.15, 0.1, s * 0.62]); blob(e, E, [0.14, 0.65, 0.55], [0, 0, s * 0.3]); blob(e, 0xa08884, [0.08, 0.48, 0.38], [0.08, 0, s * 0.3]); return e; });
  eyes(head, 0.55, 0.15, 0.32, 0.06);
  const trunk = [];
  let p = piv(head, [0.6, -0.2, 0], 0.15);
  for (let i = 0; i < 7; i++) {
    const r = 0.22 - i * 0.022;
    mesh(capGeo(r, 0.36), C, p);
    trunk.push(p);
    p = piv(p, [0, -0.3, 0], 0);
  }
  for (const s of [1, -1]) cone(head, 0xf7f1e3, 0.08, 0.6, [0.5, -0.45, s * 0.3], -2.0);
  const tail = limb(body, [-1.4, 2.4, 0], 0.8, 0.05, C, -0.3);
  return { g, body, head, legs, trunk, ears, tail, legAmp: 0.3, bob: 0.07 };
};

B.macaco = () => {
  const C = 0x8a5a3c, F = 0xf2c9a0;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  const legs = [limb(body, [0, 0.55, 0.15], 0.55, 0.09, C), limb(body, [0, 0.55, -0.15], 0.55, 0.09, C)];
  for (const l of legs) blob(l, F, [0.12, 0.05, 0.08], [0.05, -0.54, 0]);
  blob(body, C, [0.3, 0.38, 0.28], [0, 0.85, 0]);
  blob(body, F, [0.2, 0.26, 0.2], [0.13, 0.82, 0]);
  const arms = [limb(body, [0, 1.08, 0.3], 0.78, 0.075, C), limb(body, [0, 1.08, -0.3], 0.78, 0.075, C)];
  for (const a of arms) blob(a, F, [0.09, 0.09, 0.09], [0, -0.78, 0]);
  const head = piv(body, [0.02, 1.38, 0]);
  blob(head, C, [0.28, 0.27, 0.28], [0, 0, 0]);
  blob(head, F, [0.18, 0.2, 0.22], [0.15, -0.02, 0]);
  blob(head, F, [0.13, 0.09, 0.15], [0.27, -0.1, 0]);
  for (const s of [1, -1]) { blob(head, C, [0.06, 0.11, 0.11], [0, 0.03, s * 0.3]); blob(head, F, [0.03, 0.07, 0.07], [0.02, 0.03, s * 0.32]); }
  eyes(head, 0.28, 0.04, 0.08, 0.04);
  const tail = limb(body, [-0.25, 0.6, 0], 0.7, 0.04, C, -1.2);
  const t2 = limb(tail, [0, -0.7, 0], 0.4, 0.04, C, 1.6);
  return { g, body, head, legs, arms, tail, t2, legAmp: 0.6, bob: 0.06 };
};

B.passaro = (o) => {
  const C = o.cor ?? 0x4f9bd9;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [0.24, 0.17, 0.17], [0, 0.28, 0]);
  blob(body, 0xf7e9cf, [0.17, 0.11, 0.13], [0.06, 0.22, 0]);
  const head = piv(body, [0.2, 0.42, 0]);
  blob(head, C, [0.13, 0.13, 0.13], [0, 0, 0]);
  cone(head, PAL.amarelo, 0.045, 0.14, [0.11, -0.01, 0], -Math.PI / 2);
  eyes(head, 0.08, 0.04, 0.08, 0.025);
  const wings = [1, -1].map((s) => { const w = piv(body, [0, 0.33, s * 0.12]); blob(w, new THREE.Color(C).multiplyScalar(0.8).getHex(), [0.17, 0.03, 0.24], [-0.04, 0, s * 0.2]); return w; });
  blob(body, C, [0.14, 0.03, 0.08], [-0.28, 0.33, 0]);
  const legs = [limb(body, [0, 0.12, 0.05], 0.12, 0.015, PAL.amarelo), limb(body, [0, 0.12, -0.05], 0.12, 0.015, PAL.amarelo)];
  return { g, body, head, legs, wings, legAmp: 0.4, bob: 0.02, aveRot: "x" };
};

B.aguia = () => {
  const C = 0x6b4a32, W = 0xf6f1e8;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [0.5, 0.26, 0.28], [0, 0.6, 0]);
  const head = piv(body, [0.5, 0.75, 0]);
  blob(head, W, [0.2, 0.18, 0.18], [0, 0, 0]);
  const bk = cone(head, PAL.amarelo, 0.07, 0.24, [0.15, -0.02, 0], -Math.PI / 2 - 0.25);
  eyes(head, 0.13, 0.05, 0.1, 0.03);
  const wings = [1, -1].map((s) => {
    const w = piv(body, [0, 0.68, s * 0.2]);
    blob(w, C, [0.45, 0.07, 0.75], [-0.05, 0, s * 0.68]);
    const tip = piv(w, [0, 0, s * 1.35]);
    blob(tip, 0x553a28, [0.38, 0.06, 0.65], [-0.12, 0, s * 0.5]);
    w.userData.tip = tip;
    return w;
  });
  blob(body, W, [0.28, 0.04, 0.2], [-0.6, 0.62, 0]);
  const legs = [limb(body, [0.05, 0.42, 0.1], 0.3, 0.04, PAL.amarelo), limb(body, [0.05, 0.42, -0.1], 0.3, 0.04, PAL.amarelo)];
  return { g, body, head, legs, wings, legAmp: 0.3, bob: 0.03, aveRot: "x" };
};

B.rato = () => {
  const C = 0xaaa6b2, P = 0xeba4a8;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [0.2, 0.12, 0.12], [0, 0.13, 0]);
  const head = piv(body, [0.18, 0.17, 0]);
  blob(head, C, [0.12, 0.09, 0.09], [0.03, 0, 0]);
  blob(head, C, [0.07, 0.05, 0.05], [0.13, -0.02, 0]);
  blob(head, P, [0.02, 0.02, 0.02], [0.2, -0.01, 0]);
  for (const s of [1, -1]) { blob(head, C, [0.02, 0.07, 0.07], [-0.02, 0.09, s * 0.07]); blob(head, P, [0.012, 0.05, 0.05], [-0.01, 0.09, s * 0.075]); }
  eyes(head, 0.1, 0.03, 0.05, 0.018);
  const legs = [[0.1, 0.07], [0.1, -0.07], [-0.1, 0.07], [-0.1, -0.07]].map(([x, z]) => limb(body, [x, 0.07, z], 0.07, 0.025, P));
  const tail = limb(body, [-0.18, 0.12, 0], 0.3, 0.012, P, -1.2);
  const t2 = limb(tail, [0, -0.3, 0], 0.25, 0.01, P, 0.6);
  return { g, body, head, legs, tail, t2, legAmp: 0.7, bob: 0.015 };
};

B.coelho = () => {
  const C = 0xf3ede4, P = 0xeba4a8;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [0.28, 0.24, 0.22], [0, 0.27, 0]);
  blob(body, 0xffffff, [0.09, 0.09, 0.09], [-0.28, 0.32, 0]);
  const head = piv(body, [0.24, 0.48, 0]);
  blob(head, C, [0.17, 0.16, 0.16], [0, 0, 0]);
  blob(head, P, [0.025, 0.02, 0.025], [0.17, -0.02, 0]);
  const ears = [1, -1].map((s) => { const e = limb(head, [-0.03, 0.12, s * 0.07], 0.36, 0.05, C, Math.PI - 0.25); e.rotation.x = s * 0.15; blob(e, P, [0.02, 0.13, 0.03], [0.035, -0.18, 0]); return e; });
  eyes(head, 0.13, 0.04, 0.09, 0.03);
  const legs = [[0.12, 0.1], [0.12, -0.1], [-0.12, 0.12], [-0.12, -0.12]].map(([x, z], i) => { const l = limb(body, [x, 0.12, z], 0.12, 0.05, C); if (i > 1) blob(l, C, [0.12, 0.04, 0.06], [0.05, -0.1, 0]); return l; });
  return { g, body, head, legs, ears, legAmp: 0.3, bob: 0.02 };
};

B.baleia = () => {
  const C = 0x4f7fa8, Bc = 0xdbe6ea;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [5.5, 1.8, 2.0], [0, 0, 0]);
  blob(body, Bc, [5.0, 1.2, 1.6], [0.4, -0.65, 0]);
  eyes(body, 3.3, -0.2, 1.45, 0.16);
  const tail = piv(body, [-4.8, 0.1, 0]);
  blob(tail, C, [1.8, 0.7, 0.75], [-1.2, 0, 0]);
  const fl = piv(tail, [-2.6, 0, 0]);
  for (const s of [1, -1]) blob(fl, C, [0.8, 0.12, 1.3], [-0.4, 0, s * 1.0]);
  const fins = [1, -1].map((s) => { const f = piv(body, [1.8, -0.9, s * 1.6]); blob(f, C, [0.9, 0.12, 0.5], [-0.4, 0, s * 0.4]); return f; });
  return { g, body, head: null, legs: [], tail, fl, fins, legAmp: 0, bob: 0 };
};

B.golfinho = () => {
  const C = 0x7e9db8, Bc = 0xe6edf0;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [1.15, 0.38, 0.38], [0, 0, 0]);
  blob(body, Bc, [1.0, 0.26, 0.3], [0.1, -0.13, 0]);
  blob(body, C, [0.32, 0.1, 0.11], [1.25, -0.06, 0]);
  cone(body, C, 0.16, 0.45, [-0.1, 0.3, 0], 0.5);
  eyes(body, 0.85, 0.06, 0.24, 0.04);
  const tail = piv(body, [-1.0, 0, 0]);
  blob(tail, C, [0.45, 0.16, 0.16], [-0.3, 0, 0]);
  for (const s of [1, -1]) blob(tail, C, [0.2, 0.04, 0.32], [-0.75, 0, s * 0.22]);
  const fins = [1, -1].map((s) => { const f = piv(body, [0.4, -0.2, s * 0.3]); blob(f, C, [0.22, 0.04, 0.12], [-0.1, 0, s * 0.1]); return f; });
  return { g, body, head: null, legs: [], tail, fins, legAmp: 0, bob: 0 };
};

B.polvo = () => {
  const C = PAL.tijolo;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [0.6, 0.72, 0.6], [0, 1.35, 0]);
  for (const s of [1, -1]) { blob(body, 0xffffff, [0.15, 0.15, 0.15], [0.46, 1.15, s * 0.22], 0.4); blob(body, M(0x1d1b22, 0.25), [0.08, 0.08, 0.08], [0.58, 1.15, s * 0.22]); }
  const tents = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const root = new THREE.Group(); root.position.set(Math.cos(a) * 0.38, 0.8, Math.sin(a) * 0.38); root.rotation.y = -a; body.add(root);
    let p = piv(root, [0, 0, 0], 1.0);
    const segs = [];
    for (let i = 0; i < 6; i++) { mesh(capGeo(0.13 - i * 0.017, 0.3), C, p); segs.push(p); p = piv(p, [0, -0.25, 0], 0); }
    tents.push(segs);
  }
  return { g, body, head: null, legs: [], tents, legAmp: 0, bob: 0 };
};

B.zebra = () => {
  const C = 0xf4f1ea, K = 0x25242b;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [0.85, 0.45, 0.38], [0, 1.3, 0]);
  for (let i = 0; i < 6; i++) { const x = -0.6 + i * 0.24, f = Math.sqrt(1 - (x / 0.85) ** 2); const r = ring(body, K, x, 0.455 * f, 0.385 * f, 1, (i % 2 ? 0.25 : -0.25)); r.position.y = 1.3; }
  const legs = [[0.55, 0.2], [0.55, -0.2], [-0.55, 0.2], [-0.55, -0.2]].map(([x, z]) => {
    const l = limb(body, [x, 1.1, z], 1.1, 0.09, C);
    for (let j = 0; j < 3; j++) { const r = mesh(TORUS, K, l); r.rotation.x = Math.PI / 2; r.position.y = -0.3 - j * 0.22; r.scale.set(0.095, 0.095, 0.8); }
    blob(l, K, [0.1, 0.07, 0.1], [0, -1.08, 0]);
    return l;
  });
  const neck = limb(body, [0.65, 1.5, 0], 0.75, 0.17, C, Math.PI - 0.75);
  for (let j = 0; j < 3; j++) { const r = mesh(TORUS, K, neck); r.rotation.x = Math.PI / 2; r.position.y = -0.15 - j * 0.2; r.scale.set(0.17, 0.17, 0.8); }
  blob(neck, K, [0.05, 0.38, 0.05], [-0.13, -0.35, 0]);
  const head = piv(neck, [0, -0.75, 0], -(Math.PI - 0.75));
  blob(head, C, [0.36, 0.16, 0.15], [0.2, -0.08, 0]);
  blob(head, K, [0.12, 0.12, 0.13], [0.48, -0.12, 0]);
  for (const s of [1, -1]) cone(head, C, 0.05, 0.18, [0.0, 0.08, s * 0.08]);
  eyes(head, 0.25, 0.0, 0.12, 0.035);
  const tail = limb(body, [-0.8, 1.45, 0], 0.7, 0.03, C, -0.35);
  blob(tail, K, [0.05, 0.1, 0.05], [0, -0.7, 0]);
  return { g, body, head, legs, neck, tail, legAmp: 0.5, bob: 0.06 };
};

B.rinoceronte = () => {
  const C = 0x9c9488;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [1.3, 0.78, 0.72], [0, 1.35, 0]);
  const legs = [[0.75, 0.38], [0.75, -0.38], [-0.75, 0.38], [-0.75, -0.38]].map(([x, z]) => limb(body, [x, 0.95, z], 0.95, 0.24, C));
  const head = piv(body, [1.3, 1.3, 0]);
  blob(head, C, [0.6, 0.4, 0.38], [0.25, -0.12, 0]);
  cone(head, 0xe9e2d6, 0.13, 0.6, [0.68, 0.05, 0], -0.35);
  cone(head, 0xe9e2d6, 0.09, 0.3, [0.35, 0.18, 0], -0.2);
  for (const s of [1, -1]) cone(head, C, 0.07, 0.2, [0.0, 0.2, s * 0.2], 0, s * -0.4);
  eyes(head, 0.42, 0.03, 0.3, 0.04);
  const tail = limb(body, [-1.25, 1.55, 0], 0.5, 0.04, C, -0.3);
  return { g, body, head, legs, tail, legAmp: 0.35, bob: 0.05 };
};

B.peixe = (o) => {
  const C = o.cor ?? PAL.amarelo;
  const g = new THREE.Group(), body = piv(g, [0, 0, 0]);
  blob(body, C, [0.25, 0.13, 0.07], [0, 0, 0]);
  const tail = piv(body, [-0.22, 0, 0]);
  blob(tail, C, [0.1, 0.1, 0.02], [-0.07, 0, 0]);
  eyes(body, 0.15, 0.03, 0.05, 0.02);
  return { g, body, head: null, legs: [], tail, legAmp: 0, bob: 0, peixe: true };
};

export const TIPOS = Object.keys(B);

export function createAnimal(tipo, opts = {}) {
  const a = B[tipo](opts);
  a.tipo = tipo;
  a.fase = opts.fase ?? 0;
  a.group = a.g;
  if (a.head) a.head.userData.rz0 = a.head.rotation.z;
  if (a.neck) a.neck.userData.rz0 = a.neck.rotation.z;
  a.update = (t, o = {}) => animate(a, t, o);
  animate(a, 0, {});
  return a;
}

function animate(a, t, o) {
  const f = o.passo ?? 0;
  const ph = t * f * Math.PI * 2 + a.fase * 6.283;
  const amp = o.amp ?? a.legAmp;
  a.legs.forEach((L, i) => {
    const off = ((i % 2) ^ (i >> 1)) * Math.PI;
    L.rotation.z = f ? Math.sin(ph + off) * amp : 0;
  });
  const idle = Math.sin(t * 2.2 + a.fase * 6.283);
  a.body.position.y = f ? Math.abs(Math.sin(ph)) * a.bob : 0;
  a.body.rotation.x = f ? Math.sin(ph) * 0.03 : 0;
  a.body.scale.y = 1 + idle * 0.012;
  const pe = o.pescoco ?? 0;
  if (a.neck) a.neck.rotation.z = a.neck.userData.rz0 + pe;
  if (a.head) a.head.rotation.z = a.head.userData.rz0 - pe + (f ? Math.sin(ph * 2) * 0.05 : idle * 0.04) + (o.cabeca ?? 0);
  if (a.arms) {
    const s = o.sobe ?? 0;
    a.arms.forEach((A, i) => {
      const walk = f ? -Math.sin(ph + i * Math.PI) * 0.5 : 0.05;
      const climb = Math.PI - 0.3 + Math.sin(ph + i * Math.PI) * 0.45;
      A.rotation.z = walk * (1 - s) + climb * s;
      A.rotation.x = (i ? 1 : -1) * (0.08 + 0.12 * s);
    });
  }
  if (a.tail) {
    if (a.legs.length) a.tail.rotation.x = Math.sin(t * 3.1 + a.fase * 5) * 0.35;
    else a.tail.rotation.z = Math.sin(t * (o.nada ?? 1) * 6.283 + a.fase * 5) * (a.peixe ? 0.5 : 0.3);
  }
  if (a.fl) a.fl.rotation.z = Math.sin(t * (o.nada ?? 0.5) * 6.283 - 0.8) * 0.35;
  if (a.fins) a.fins.forEach((F, i) => { F.rotation.x = (i ? -1 : 1) * Math.sin(t * 2 + a.fase) * 0.2; });
  if (a.trunk) {
    const c = o.tromba ?? 0;
    a.trunk.forEach((s, i) => { s.rotation.z = (i ? 0.06 + c * 0.35 : 0.1) + Math.sin(t * 2.4 - i * 0.5 + a.fase * 6) * (0.08 + i * 0.012); });
  }
  if (a.ears && a.tipo === "elefante") a.ears.forEach((e, i) => { e.rotation.y = (i ? -1 : 1) * (0.2 + Math.sin(t * 3 + a.fase * 6) * 0.12); });
  if (a.ears && a.tipo === "coelho") a.ears.forEach((e, i) => { e.rotation.x = (i ? -1 : 1) * (0.15 + Math.sin(t * 4 + i) * 0.08); });
  if (a.wings) {
    const v = o.voa ?? 0;
    a.wings.forEach((W, i) => {
      const s = i ? -1 : 1;
      const fl = v ? Math.sin(t * v * 6.283 + a.fase * 6) : 0;
      W.rotation.x = v ? s * fl * 0.75 : s * -0.15;
      if (W.userData.tip) W.userData.tip.rotation.x = v ? s * Math.sin(t * v * 6.283 + a.fase * 6 - 0.7) * 0.4 : 0;
    });
    if (v) a.body.position.y = Math.sin(t * v * 6.283 + a.fase * 6) * 0.04;
  }
  if (a.tents) a.tents.forEach((segs, k) => segs.forEach((s, i) => {
    s.rotation.z = (i === 0 ? 1.0 : -0.12) + Math.sin(t * 1.8 - i * 0.7 + k * 0.8) * (0.15 + i * 0.05);
  }));
  if (a.t2) a.t2.rotation.z = 1.2 + Math.sin(t * 2.5 + a.fase) * 0.3;
  if (o.salto) a.body.position.y = Math.abs(Math.sin(ph)) * o.salto;
}

// vira o grupo para andar na direção (dx, dz) do chão
export function face(g, dx, dz) { g.rotation.y = Math.atan2(-dz, dx); }
