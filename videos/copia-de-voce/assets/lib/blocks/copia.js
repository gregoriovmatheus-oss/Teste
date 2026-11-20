/**
 * copia.js — peças do vídeo "E se você acordasse com uma cópia perfeita de você mesmo?" (R10, usa toy.js e animals.js).
 *
 *   fontes()                              await antes do 1º quadro (Inter/JetBrains Mono no canvas)
 *   amanhecer(st, {chave, fundo})        palco interno na luz azul do amanhecer (fundo escuro, luz-chave fria da janela)
 *   estudio(st, {fundo, chao})           palco escuro "de dentro da mente": chão brilhante, névoa, luz de recorte azul
 *   quarto(S)                             quarto: cama de casal, travesseiros, edredom, criados-mudos, janela com feixe,
 *                                          dois celulares (.celA/.celB, .tela(k) desenha a senha); voltado para +z
 *   pessoa({cor, cor2, cabelo})           humano de animals.js com .deitar(x, z, yMat), .olhos(aberto), .olha(yaw), .p (pivô)
 *   fios(S, {n, k, seed})                 fios de memória (Points aditivos) saindo de duas cabeças:
 *                                          .update(t, { A: Vector3, B: Vector3, div: 0..1, a: 0..1, alt })
 *   brilho(cor, tam, op), glowTex()       sprite aditivo
 *   proj(v, cam) -> [x, y, z]             posição na tela (px)
 *   txt(ctx, s, x, y, {...}), pilula(...) texto 2D doc (mono/Inter) com sombra
 *   tag(ctx, cam, pos, texto, {...})      etiqueta de instrumento: ponto no objeto, haste e pílula com texto
 *   vis(st)                                1 durante a cena, cai no dip dos cortes (para o 2D desenhado depois do draw)
 * Cores: AZUL #7cc8ff (diagrama), LARANJA #ff8a4c (anomalia), OURO (neurônios fixos).
 * Tudo determinístico (mulberry32 + t).
 */
import * as THREE from "../three.module.js";
import { mulberry32, clamp, lerp, ease } from "../kit.js";
import { M, SPH, mesh, roundBox } from "./toy.js";
import { createAnimal } from "./animals.js";

export const AZUL = "#7cc8ff", LARANJA = "#ff8a4c", OURO = "#ffc861";

export async function fontes() {
  try { await Promise.all(['600 40px "JetBrains Mono"', '400 40px "JetBrains Mono"', '300 40px "Inter"', '800 40px "Inter"', '600 40px "Inter"'].map((f) => document.fonts.load(f))); } catch (e) { /* fallback */ }
}

/* ---------- brilho ---------- */
const _tex = {};
export function glowTex(tipo = "suave") {
  if (_tex[tipo]) return _tex[tipo];
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (tipo === "ponto") { gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.8)"); gr.addColorStop(0.6, "rgba(255,255,255,0.12)"); gr.addColorStop(1, "rgba(255,255,255,0)"); }
  else { gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); }
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; _tex[tipo] = t; return t;
}
export function brilho(cor, tam, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: cor, transparent: true, opacity: op,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  s.scale.setScalar(tam);
  return s;
}

/* ---------- palcos ---------- */
export function amanhecer(st, { chave = 0x9cc4ff, fundo = 0x081120, forca = 1 } = {}) {
  st.scene.background = new THREE.Color(fundo);
  st.key.color.set(chave); st.key.intensity = 2.6 * forca;
  st.rim.color.set(0x5b7fc4); st.rim.intensity = 0.9 * forca;
  st.hemi.color.set(0x5a74a8); st.hemi.groundColor.set(0x1c1a22); st.hemi.intensity = 0.55 * forca;
  st.scene.environment = null;
  st.bloom = 0.55;
}
export function estudio(st, { fundo = 0x05070d, chao = 0x0b0f18, raio = 14 } = {}) {
  const S = st.scene;
  S.background = new THREE.Color(fundo); S.environment = null;
  if (S.fog) S.fog.color.set(fundo);
  st.key.color.set(0xcfe4ff); st.key.intensity = 1.6;
  st.rim.color.set(0x7cc8ff); st.rim.intensity = 2.2;
  st.hemi.color.set(0x2a3a5c); st.hemi.groundColor.set(0x05060a); st.hemi.intensity = 0.4;
  const c = new THREE.Mesh(new THREE.CircleGeometry(raio, 48), new THREE.MeshStandardMaterial({ color: chao, roughness: 0.32, metalness: 0.6 }));
  c.rotation.x = -Math.PI / 2; c.receiveShadow = true; S.add(c);
  // anel de luz fino no chão (diagrama)
  const anel = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.24, 96), new THREE.MeshBasicMaterial({ color: AZUL, transparent: true, opacity: 0.35, toneMapped: false }));
  anel.rotation.x = -Math.PI / 2; anel.position.y = 0.005; S.add(anel);
  st.bloom = 0.6;
  return { chao: c, anel };
}

/* ---------- celular (tela em canvas) ---------- */
function telaCel() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 512;
  const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  let ult = -1;
  function desenha(k) { // k = dígitos digitados (0..4); 5 = desbloqueado
    if (k === ult) return; ult = k;
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#2a5596"); gr.addColorStop(1, "#0c1a33");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
    g.fillStyle = "#cfe4ff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = '300 64px "Inter", sans-serif'; g.fillText("06:12", 128, 92);
    g.font = '600 15px "JetBrains Mono", monospace'; g.fillStyle = "#7cc8ff"; g.fillText(k >= 5 ? "DESBLOQUEADO" : "DIGITE A SENHA", 128, 150);
    const dig = "4816";
    for (let i = 0; i < 4; i++) {
      const x = 59 + i * 46, on = i < k;
      g.font = '600 40px "JetBrains Mono", monospace';
      g.fillStyle = on ? "#ffffff" : "rgba(207,228,255,0.35)";
      g.fillText(on ? dig[i] : "•", x, 230);
      g.fillRect(x - 16, 262, 32, 3);
    }
    // teclado numérico simples
    g.font = '400 26px "JetBrains Mono", monospace';
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
      const n = r * 3 + q + 1, x = 68 + q * 60, y = 322 + r * 54;
      g.strokeStyle = "rgba(124,200,255,0.35)"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 22, 0, 6.283); g.stroke();
      g.fillStyle = "rgba(207,228,255,0.8)"; g.fillText(String(n), x, y + 1);
    }
    if (k >= 5) { g.fillStyle = "rgba(124,200,255,0.18)"; g.fillRect(0, 0, 256, 512); }
    tex.needsUpdate = true;
  }
  desenha(0);
  return { tex, desenha };
}
export function celular() {
  const g = new THREE.Group();
  mesh(roundBox(0.16, 0.018, 0.32, 0.02), 0x15171c, g, 0.35);
  const T = telaCel();
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.145, 0.29), new THREE.MeshBasicMaterial({ map: T.tex, toneMapped: false }));
  tela.rotation.x = -Math.PI / 2; tela.position.y = 0.0195; g.add(tela);
  const halo = brilho(0x7cc8ff, 0.5, 0.0); halo.position.y = 0.05; g.add(halo);
  return { group: g, tela: (k) => { T.desenha(k); halo.material.opacity = k > 0 ? 0.35 : 0.12; } };
}

/* ---------- quarto ---------- */
export function quarto(S) {
  const g = new THREE.Group(); S.add(g);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), M(0x4a3a2e, 0.55)); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; g.add(piso);
  const parede = M(0x9aa3b4, 0.9);
  const fundo = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), parede); fundo.position.set(0, 3, -1.75); fundo.receiveShadow = true; g.add(fundo);
  // parede da janela (esquerda) com abertura: 4 painéis em volta do vão
  const px = -3.2, mk = (w, h, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), parede); m.rotation.y = Math.PI / 2; m.position.set(px, y, z); m.receiveShadow = true; g.add(m); };
  mk(8, 1.1, 0.55, 2.2); mk(8, 2.2, 4.9, 2.2); mk(2.6, 2.7, 2.45, -0.45); mk(3.4, 2.7, 2.45, 4.6);
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.7), new THREE.MeshBasicMaterial({ color: 0x8fb8ff, toneMapped: false }));
  vidro.rotation.y = Math.PI / 2; vidro.position.set(px - 0.05, 2.45, 1.85); g.add(vidro);
  for (const z of [0.85, 1.85, 2.85]) { const b = mesh(roundBox(0.08, 2.75, 0.06, 0.02), 0xdfe3ea, g, 0.6); b.position.set(px + 0.02, 2.45, z); }
  const trav = mesh(roundBox(0.08, 0.06, 2.1, 0.02), 0xdfe3ea, g, 0.6); trav.position.set(px + 0.02, 2.45, 1.85);
  // feixe de luz do amanhecer entrando pela janela (aditivo)
  const fm = new THREE.MeshBasicMaterial({ color: 0x6f9be8, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const feixe = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.3, 1.9), fm);
  feixe.position.set(-1.0, 1.55, 1.85); feixe.rotation.z = -0.5; g.add(feixe);
  // cama
  const cama = new THREE.Group(); g.add(cama);
  mesh(roundBox(2.15, 0.36, 2.4, 0.08), 0x3d2f26, cama, 0.6).position.set(0, 0.2, 0);
  mesh(roundBox(2.0, 0.26, 2.25, 0.12), 0xd9dde6, cama, 0.85).position.set(0, 0.5, 0);
  mesh(roundBox(2.2, 1.15, 0.12, 0.05), 0x3d2f26, cama, 0.55).position.set(0, 0.95, -1.2);
  for (const x of [-0.47, 0.47]) mesh(roundBox(0.78, 0.16, 0.46, 0.08), 0xe9ecf2, cama, 0.9).position.set(x, 0.71, -0.86);
  const edredom = mesh(roundBox(2.08, 0.42, 1.5, 0.18), 0x7d8fb0, cama, 0.95); edredom.position.set(0, 0.7, 0.38);
  const dobra = mesh(roundBox(2.1, 0.12, 0.22, 0.06), 0xe9ecf2, cama, 0.9); dobra.position.set(0, 1.0, -0.32);
  // criados-mudos, abajur, celulares
  const cels = [];
  for (const s of [-1, 1]) {
    const cm = mesh(roundBox(0.6, 0.58, 0.48, 0.05), 0x5a4636, g, 0.6); cm.position.set(s * 1.5, 0.29, -0.95);
    const c = celular(); c.group.position.set(s * 1.5 - s * 0.06, 0.6, -0.9); c.group.rotation.y = s * 0.25; g.add(c.group); cels.push(c);
  }
  const ab = new THREE.Group(); ab.position.set(1.62, 0.58, -1.08); g.add(ab);
  mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.32, 16), 0xc9c2b4, ab, 0.4).position.y = 0.16;
  mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.22, 20, 1, true), 0xeee6d6, ab, 0.9).position.y = 0.42;
  // tapete e quadro (sem conteúdo identificável)
  const tap = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), M(0x2f3a52, 1)); tap.rotation.x = -Math.PI / 2; tap.position.set(0, 0.006, 1.9); tap.receiveShadow = true; g.add(tap);
  const q = mesh(roundBox(1.2, 0.8, 0.04, 0.02), 0x2a2420, g, 0.5); q.position.set(0, 2.25, -1.72);
  const qi = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.68), M(0x34476a, 0.9)); qi.position.set(0, 2.25, -1.695); g.add(qi);
  return { g, cama, edredom, celA: cels[0], celB: cels[1], vidro, feixe, abajur: ab };
}

/* ---------- pessoa (a mesma roupa nas duas: a cópia é perfeita) ---------- */
export function pessoa({ cor = 0x5d7290, cor2 = 0x3c4a62, cabelo = 0x3a2a20, fase = 0 } = {}) {
  const h = createAnimal("humano", { cor, cor2, cabelo, fase });
  const p = new THREE.Group(); p.add(h.group);
  // olhos: filhos do pivô da cabeça depois do crânio e do cabelo
  const olhosM = h.head.children.slice(2);
  const palp = [];
  for (const s of [1, -1]) {
    const l = new THREE.Mesh(SPH, M(0x2a1d16, 0.6)); l.scale.set(0.006, 0.004, 0.03); l.position.set(0.198, 0.05, s * 0.07); h.head.add(l); palp.push(l);
  }
  function olhos(ab) { const o = ab > 0.5; olhosM.forEach((m) => (m.visible = o)); palp.forEach((m) => (m.visible = !o)); }
  function deitar(x, z, yMat = 0.78) { // cabeça para -z, rosto para cima; z = posição dos pés
    p.rotation.set(-Math.PI / 2, 0, 0); h.group.rotation.set(0, -Math.PI / 2, 0);
    p.position.set(x, yMat + 0.2, z);
  }
  function emPe(x, z, ry = 0) { p.rotation.set(0, 0, 0); h.group.rotation.set(0, ry, 0); p.position.set(x, 0, z); }
  function olha(yaw = 0, nod = 0) { h.head.rotation.y = yaw; h.head.rotation.x = nod; }
  const _v = new THREE.Vector3();
  function cabeca(y = 0.04, x = 0) { h.head.updateWorldMatrix(true, false); return h.head.localToWorld(_v.set(x, y, 0)).clone(); }
  olhos(0);
  return Object.assign(h, { p, olhos, deitar, emPe, olha, cabeca });
}

/* ---------- fios de memória ---------- */
export function fios(S, { n = 16, k = 46, seed = 5, tam = 0.07, alt = 2.2 } = {}) {
  const r = mulberry32(seed);
  const F = Array.from({ length: n }, () => ({ ph: r() * 6.283, w: 1.2 + r() * 2.2, rad: 0.25 + r() * 0.55, sp: 0.18 + r() * 0.16, inc: (r() - 0.5) * 0.9, h: 0.6 + r() * 0.4 }));
  const N = n * k * 2;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: tam, map: glowTex("ponto"), vertexColors: true, transparent: true, opacity: 1,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, toneMapped: false, fog: false });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; S.add(pts);
  const cA = new THREE.Color(AZUL), cB = new THREE.Color(LARANJA), c = new THREE.Color();
  function update(t, { A, B, div = 0, a = 1, altura = alt, up = [0, 1, 0] } = {}) {
    let i = 0;
    for (const [lado, O] of [[0, A], [1, B]]) {
      const d = lado ? div : 0;
      for (const f of F) {
        for (let j = 0; j < k; j++) {
          const s = ((j / k + t * f.sp) % 1);
          const ph = f.ph + d * (f.inc * 5 + 1.3), rr = f.rad * s * (1 + d * 0.6);
          const ang = ph + s * f.w * 3.14 + t * 0.4;
          const x = Math.cos(ang) * rr + f.inc * s * 0.8 * (1 + d * 2);
          const z = Math.sin(ang) * rr;
          const y = s * altura * f.h * (1 - d * 0.25);
          pos[i * 3] = O.x + x + up[0] * y; pos[i * 3 + 1] = O.y + up[1] * y + (up[1] ? 0 : x * 0); pos[i * 3 + 2] = O.z + z + up[2] * y;
          const fade = Math.sin(Math.PI * s) * a;
          c.copy(cA).lerp(cB, d * (0.35 + 0.65 * ((f.ph * 7) % 1)));
          col[i * 3] = c.r * fade; col[i * 3 + 1] = c.g * fade; col[i * 3 + 2] = c.b * fade;
          i++;
        }
      }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    pts.visible = a > 0.01;
  }
  return { pts, update, mat };
}

/* ---------- 2D ---------- */
const _pv = new THREE.Vector3();
export function proj(v, cam) {
  cam.updateMatrixWorld(); _pv.copy(v).project(cam);
  return [(_pv.x + 1) * 540, (1 - _pv.y) * 960, _pv.z];
}
const FAM = { mono: '"JetBrains Mono", ui-monospace, monospace', inter: '"Inter", sans-serif' };
export function txt(ctx, s, x, y, { tam = 30, cor = "#fff", fonte = "mono", peso = 600, al = "center", a = 1, base = "middle", esp = 0.12 } = {}) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, a);
  ctx.font = `${peso} ${tam}px ${FAM[fonte] || FAM.mono}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = (fonte === "mono" ? esp * tam : 0) + "px";
  ctx.textAlign = al; ctx.textBaseline = base;
  ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = tam * 0.4; ctx.shadowOffsetY = tam * 0.06;
  ctx.fillStyle = cor; ctx.fillText(s, x, y);
  ctx.restore();
}
export function pilula(ctx, x, y, w, h, a = 1, borda = "rgba(124,200,255,0.55)") {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = "rgba(6,9,18,0.66)";
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 6); ctx.fill();
  ctx.strokeStyle = borda; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
// etiqueta de instrumento presa a um ponto 3D
export function tag(ctx, cam, pos, texto, { cor = AZUL, a = 1, dx = 0, dy = -90, tam = 26, sub = null } = {}) {
  if (a <= 0.003) return;
  const [x, y, z] = proj(pos, cam);
  if (z > 1) return;
  const lx = x + dx, ly = y + dy;
  ctx.save(); ctx.globalAlpha = Math.min(1, a);
  ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, 13, 0, 6.283); ctx.globalAlpha = Math.min(1, a) * 0.5; ctx.stroke(); ctx.globalAlpha = Math.min(1, a);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(lx, ly + (dy < 0 ? 26 : -26)); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.font = `600 ${tam}px ${FAM.mono}`; if ("letterSpacing" in ctx) ctx.letterSpacing = 0.12 * tam + "px";
  const w = ctx.measureText(texto).width + tam * 1.4; ctx.restore();
  const hh = sub ? tam * 2.9 : tam * 1.9;
  const cy = ly + (dy < 0 ? -hh / 2 + 26 : hh / 2 - 26);
  pilula(ctx, lx, cy, Math.max(w, sub ? 200 : 0), hh, a, cor === AZUL ? "rgba(124,200,255,0.6)" : cor);
  txt(ctx, texto, lx, sub ? cy - tam * 0.55 : cy, { tam, cor: "#ffffff", a });
  if (sub) txt(ctx, sub, lx, cy + tam * 0.75, { tam: tam * 0.8, cor, a, peso: 400 });
}
export function vis(st) {
  const T = st.T || 0, D = st.D || 1e9;
  const dip = Math.max(1 - T / 0.17, 1 - (D - T) / 0.12, 0);
  return 1 - Math.min(1, dip);
}
export { THREE };
