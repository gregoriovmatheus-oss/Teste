/**
 * hiber.js — peças do vídeo "E se os seres humanos conseguissem hibernar?" (lote 3).
 *
 *   await HIBER.prepara()                       // fontes doc (Inter / JetBrains Mono) + tipografia doc nos rótulos. Chame no início da cena.
 *   HIBER.txt(ctx, s, x, y, o)  HIBER.proj(v3, cam)  HIBER.vis(st)  HIBER.painel(ctx, x, y, w, h, a)
 *   const n = HIBER.neve(S, { n, x, y, z, seed, tam, vel }); n.update(t, vento)          // flocos (Points) caindo, determinístico
 *   const q = HIBER.quarto(S, { mk, estacao: "inverno" | "primavera" })                   // quarto (cama, janela, calendário, abajur)
 *        q.cal.set(m)  (m contínuo: 0 = DEZEMBRO … 3 = MARÇO; a fração vira a folha)   q.neve?.update(t)
 *   HIBER.urso(mk) / HIBER.lemure(mk) / HIBER.marmota(mk)   → { g, respira(t, k) }       // bichos dormindo, enrolados (frente +x)
 *   HIBER.baoba(mk, seed) → { g, oco: Vector3 }   HIBER.pinheiro(mk, s, neve)
 *   HIBER.ecg(ph)  forma de onda do eletro (ph = fase em batidas)
 *   HIBER.capsula(mk, A) → { g, luz }   (cápsula de hibernação com tripulante deitado)
 *   HIBER.nave(mk) → { g, motor }       HIBER.marte(raio) → Mesh
 *   HIBER.placa(txt, { w, h, fundo, cor, tam }) → Mesh (placa com texto, CanvasTexture)
 *   HIBER.glowTex()
 * Convenção: chão y = 0; tudo determinístico (só t e mulberry32).
 */
import * as THREE from "../three.module.js";
import { M, SPH, roundBox } from "./toy.js";
import { createAnimal } from "./animals.js";
import { mulberry32, clamp, lerp, ease, range } from "../kit.js";

export const AZUL = "#7cc8ff", LARANJA = "#ff8a4c";

/* ---------- fontes + tipografia doc ---------- */
const FONTES = [["Inter", 300, "inter-latin-300-normal"], ["Inter", 600, "inter-latin-600-normal"], ["Inter", 800, "inter-latin-800-normal"],
  ["JetBrains Mono", 600, "jetbrains-mono-latin-600-normal"], ["JetBrains Mono", 400, "jetbrains-mono-latin-400-normal"]];
let _prep = null;
export function prepara() {
  if (_prep) return _prep;
  if (!document.getElementById("hiber-css")) {
    const s = document.createElement("style"); s.id = "hiber-css";
    s.textContent = FONTES.map(([f, w, a]) => `@font-face { font-family: "${f}"; font-weight: ${w}; font-style: normal; font-display: block; src: url("assets/fonts/${a}.woff2") format("woff2"); }`).join("\n") + `
      html body .rot-t { font-family: "Inter", sans-serif; font-weight: 300; font-size: 80px; line-height: 1.1; color: #fff; text-transform: none; letter-spacing: -0.01em;
        -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6); }
      html body .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }
      html body .rot-t .o { font-weight: 800; color: #ff8a4c; }
      html body .rot-t .p { font-size: 60px; }
      html body .rot-t .k { display: inline-block; font-family: "JetBrains Mono", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }
      html body .rot-t .n { font-family: "JetBrains Mono", monospace; font-weight: 600; color: #7cc8ff; }`;
    document.head.appendChild(s);
  }
  _prep = Promise.all(FONTES.map(([f, w]) => document.fonts.load(`${w} 40px "${f}"`).catch(() => null))).then(() => true);
  return _prep;
}

/* ---------- 2D ---------- */
const _pv = new THREE.Vector3();
export function proj(v, cam) { cam.updateMatrixWorld(); _pv.copy(v).project(cam); return [(_pv.x + 1) * 540, (1 - _pv.y) * 960, _pv.z]; }
export function vis(st) { const T = st.T || 0, D = st.D || 1e9; return 1 - Math.min(1, Math.max(1 - T / 0.17, 1 - (D - T) / 0.12, 0)) * 0.85; }
export function txt(ctx, s, x, y, { tam = 40, cor = "#fff", fonte = "mono", peso = 600, al = "center", a = 1, esp = 0.06, sombra = true, base = "middle" } = {}) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.font = `${peso} ${tam}px ${fonte === "mono" ? '"JetBrains Mono", monospace' : '"Inter", sans-serif'}`;
  ctx.letterSpacing = `${(esp * tam).toFixed(1)}px`;
  ctx.textAlign = al; ctx.textBaseline = base; ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = cor;
  if (sombra) { ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 2; }
  ctx.fillText(s, x, y);
  ctx.restore();
}
// painel de instrumento (vidro escuro + filete azul)
export function painel(ctx, x, y, w, h, a = 1, { borda = AZUL } = {}) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a) * 0.78; ctx.fillStyle = "rgba(6,10,18,0.82)";
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
  ctx.globalAlpha = Math.min(1, a) * 0.9; ctx.strokeStyle = borda; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
// eletrocardiograma: P, QRS, T numa batida (ph em batidas)
export function ecg(ph) {
  const u = ph - Math.floor(ph), g = (c, s) => Math.exp(-((u - c) * (u - c)) / (2 * s * s));
  return 0.12 * g(0.1, 0.025) - 0.14 * g(0.185, 0.008) + 1.0 * g(0.2, 0.009) - 0.28 * g(0.218, 0.009) + 0.22 * g(0.42, 0.04);
}

/* ---------- texturas ---------- */
let _glow = null;
export function glowTex() {
  if (_glow) return _glow;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,0.45)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); _glow = new THREE.CanvasTexture(c); return _glow;
}
export function placa(txt, { w = 1.6, h = 0.5, fundo = "#f3efe6", cor = "#1b1f2a", tam = 92, borda = "#c0392b", px = 512 } = {}) {
  const c = document.createElement("canvas"); c.width = px; c.height = Math.round(px * h / w);
  const g = c.getContext("2d"); g.fillStyle = fundo; g.fillRect(0, 0, c.width, c.height);
  if (borda) { g.strokeStyle = borda; g.lineWidth = c.height * 0.06; g.strokeRect(c.height * 0.05, c.height * 0.05, c.width - c.height * 0.1, c.height - c.height * 0.1); }
  g.fillStyle = cor; g.textAlign = "center"; g.textBaseline = "middle";
  const linhas = txt.split("\n"), lh = c.height / (linhas.length + 0.6);
  let t = tam; g.font = `800 ${t}px "Inter", sans-serif`;
  while (linhas.some((l) => g.measureText(l).width > c.width * 0.86) && t > 10) { t -= 2; g.font = `800 ${t}px "Inter", sans-serif`; }
  linhas.forEach((l, i) => g.fillText(l, c.width / 2, c.height / 2 + (i - (linhas.length - 1) / 2) * Math.min(lh, t * 1.1)));
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.8 }));
  return m;
}

/* ---------- neve ---------- */
export function neve(S, { n = 900, x = [-6, 6], y = [0, 6], z = [-6, 2], seed = 5, tam = 0.05, vel = 0.6, cor = 0xffffff, op = 0.9 } = {}) {
  const r = mulberry32(seed), P = new Float32Array(n * 3), J = [];
  for (let i = 0; i < n; i++) J.push([x[0] + r() * (x[1] - x[0]), r(), z[0] + r() * (z[1] - z[0]), 0.6 + r() * 0.8, r() * 6.28, 0.6 + r() * 1.2]);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3));
  const m = new THREE.PointsMaterial({ map: glowTex(), color: cor, size: tam, transparent: true, opacity: op, depthWrite: false, sizeAttenuation: true });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; S.add(pts);
  const h = y[1] - y[0];
  function update(t, vento = 0.15, k = 1) {
    for (let i = 0; i < n; i++) {
      const [x0, o, z0, v, ph, f] = J[i];
      let yy = o * h - t * vel * v * k; yy = ((yy % h) + h) % h;
      P[i * 3] = x0 + Math.sin(t * f + ph) * 0.12 + vento * t; P[i * 3 + 1] = y[0] + yy; P[i * 3 + 2] = z0 + Math.cos(t * f * 0.7 + ph) * 0.08;
    }
    g.attributes.position.needsUpdate = true;
  }
  update(0);
  return { pts, update, mat: m };
}

/* ---------- calendário de parede ---------- */
const MESES = ["DEZEMBRO", "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL"];
function folhaTex(i) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 320; const g = c.getContext("2d");
  g.fillStyle = "#f4f0e8"; g.fillRect(0, 0, 256, 320);
  g.fillStyle = i === 3 ? "#3f8f5a" : "#b8392f"; g.fillRect(0, 0, 256, 78);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `800 ${MESES[i].length > 8 ? 30 : 36}px "Inter", sans-serif`; g.fillText(MESES[i], 128, 42);
  g.fillStyle = "#2a2d36"; g.font = `600 17px "Inter", sans-serif`;
  for (let d = 0; d < 31; d++) { const cx = 26 + (d % 7) * 34, cy = 106 + Math.floor(d / 7) * 40; g.globalAlpha = d % 7 === 6 ? 0.5 : 0.85; g.fillText(String(d + 1), cx, cy); }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function calendario() {
  const g = new THREE.Group(), tex = MESES.map((_, i) => folhaTex(i));
  const geo = new THREE.PlaneGeometry(0.42, 0.525); geo.translate(0, -0.2625, 0);   // pivô no topo
  const base = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex[1], roughness: 0.85 }));
  const folha = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex[0], roughness: 0.85, side: THREE.DoubleSide }));
  folha.position.z = 0.004; g.add(base, folha);
  const arame = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.02), M(0x8a8f98, 0.3, { metalness: 0.8 })); arame.position.set(0, 0.005, 0.01); g.add(arame);
  function set(m) {
    m = clamp(m, 0, 3); const i = Math.floor(Math.min(m, 2.9999)), f = m >= 3 ? 1 : m - i;
    if (m >= 3) { base.material.map = tex[3]; folha.visible = false; return; }
    folha.visible = true; folha.material.map = tex[i]; base.material.map = tex[i + 1];
    folha.rotation.x = -ease.inOutCubic(f) * 2.9; folha.material.opacity = 1;
  }
  set(0);
  return { g, set };
}

/* ---------- quarto ---------- */
// cama ao longo de x (cabeceira em x = -1.5), janela atrás da cabeça (centro x = JX), parede do fundo em z = -1.6
export const QUARTO = { JX: -1.0, cabeca: new THREE.Vector3(-1.02, 0.76, -0.55), colchao: 0.55 };
export function quarto(S, { mk = M, estacao = "inverno", neveN = 500 } = {}) {
  const g = new THREE.Group(); S.add(g);
  const parede = mk(estacao === "inverno" ? 0x8e8a86 : 0xb9ad9c, 0.9), piso = mk(0x6a4a32, 0.6), madeira = mk(0x5a3a26, 0.55);
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  // piso e paredes (abertura da janela: x JX±0.75, y 0.85–2.15)
  const JX = QUARTO.JX, J0 = JX - 0.75, J1 = JX + 0.75, Y0 = 0.85, Y1 = 2.15, ZW = -1.6;
  box(8, 0.05, 6, piso, 0, -0.025, 0.5);
  box(J0 + 4, 3, 0.12, parede, (J0 - 4) / 2, 1.5, ZW);
  box(4 - J1, 3, 0.12, parede, (J1 + 4) / 2, 1.5, ZW);
  box(J1 - J0, Y0, 0.12, parede, JX, Y0 / 2, ZW);
  box(J1 - J0, 3 - Y1, 0.12, parede, JX, (3 + Y1) / 2, ZW);
  box(0.12, 3, 6, parede, -3.2, 1.5, 0.5);
  // moldura da janela + cruz
  const mol = mk(0xe8e2d6, 0.5);
  box(J1 - J0 + 0.1, 0.07, 0.16, mol, JX, Y0, ZW + 0.02); box(J1 - J0 + 0.1, 0.07, 0.16, mol, JX, Y1, ZW + 0.02);
  box(0.07, Y1 - Y0, 0.16, mol, J0, (Y0 + Y1) / 2, ZW + 0.02); box(0.07, Y1 - Y0, 0.16, mol, J1, (Y0 + Y1) / 2, ZW + 0.02);
  box(0.05, Y1 - Y0, 0.08, mol, JX, (Y0 + Y1) / 2, ZW); box(J1 - J0, 0.05, 0.08, mol, JX, (Y0 + Y1) / 2 + 0.15, ZW);
  box(J1 - J0 + 0.3, 0.05, 0.22, mol, JX, Y0 - 0.02, ZW + 0.08);   // peitoril
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(J1 - J0, Y1 - Y0), new THREE.MeshStandardMaterial({ color: estacao === "inverno" ? 0xbfd6ee : 0xfff1d8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: estacao === "inverno" ? 0.16 : 0.06, depthWrite: false }));
  vidro.position.set(JX, (Y0 + Y1) / 2, ZW + 0.01); g.add(vidro);
  // cortinas
  const cort = mk(estacao === "inverno" ? 0x3c4d66 : 0xd8c49a, 0.95);
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.9, 0.08), cort); c.position.set(JX + s * 0.98, 1.55, ZW + 0.12); g.add(c); }
  // lá fora: céu (fundo emissivo), chão, árvores, neve
  const cc = document.createElement("canvas"); cc.width = 16; cc.height = 256; const cg = cc.getContext("2d"), gr = cg.createLinearGradient(0, 0, 0, 256);
  if (estacao === "inverno") { gr.addColorStop(0, "#1b2a44"); gr.addColorStop(0.6, "#4f6a8e"); gr.addColorStop(1, "#9fb4cc"); }
  else { gr.addColorStop(0, "#6fa8dc"); gr.addColorStop(0.6, "#bfe0f2"); gr.addColorStop(1, "#fff1c8"); }
  cg.fillStyle = gr; cg.fillRect(0, 0, 16, 256); const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace;
  const ceu = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), new THREE.MeshBasicMaterial({ map: ct, fog: false, toneMapped: false }));
  ceu.position.set(JX, 3, -14); g.add(ceu);
  const fora = mk(estacao === "inverno" ? 0xe6eef6 : 0x6c9a48, 0.9);
  box(30, 0.05, 12, fora, JX, -0.2, -8);
  const r = mulberry32(estacao === "inverno" ? 31 : 32);
  for (let i = 0; i < 9; i++) {
    const x = JX + (i - 4) * 1.6 + (r() - 0.5) * 0.8, z = -5 - r() * 6, s = 0.8 + r() * 0.7;
    const a = estacao === "inverno" ? pinheiro(mk, s, true) : arvoreFlor(mk, s, 40 + i);
    a.position.set(x, -0.2, z); g.add(a);
  }
  // cama
  box(2.3, 0.3, 1.35, madeira, -0.35, 0.22, -0.85);
  box(0.1, 1.05, 1.45, madeira, -1.52, 0.6, -0.85);
  const colchao = new THREE.Mesh(roundBox(2.2, 0.2, 1.3, 0.08), mk(0xe9e4da, 0.9)); colchao.position.set(-0.35, 0.36, -0.85); g.add(colchao);
  const trav = new THREE.Mesh(roundBox(0.55, 0.16, 0.9, 0.07), mk(0xf2efe8, 0.95)); trav.position.set(-1.12, 0.53, -0.8); trav.rotation.z = 0.12; g.add(trav);
  const cob = new THREE.Mesh(roundBox(1.55, 0.36, 1.32, 0.15), mk(estacao === "inverno" ? 0x7a3a3a : 0x8fa8c8, 0.95)); cob.position.set(0.12, 0.52, -0.8); g.add(cob);
  const dobra = new THREE.Mesh(roundBox(0.2, 0.37, 1.34, 0.09), mk(0xeee6d6, 0.9)); dobra.position.set(-0.62, 0.53, -0.8); g.add(dobra);
  // criado-mudo + abajur
  box(0.45, 0.55, 0.42, madeira, -2.0, 0.275, -1.25);
  const ab = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.2, 10, 1, true), mk(0xf2dcb0, 0.8, { emissive: 0xffb860, emissiveIntensity: estacao === "inverno" ? 0.9 : 0.2, side: THREE.DoubleSide }));
  ab.position.set(-2.0, 0.85, -1.25); g.add(ab); box(0.03, 0.22, 0.03, mk(0x30302e, 0.4), -2.0, 0.66, -1.25);
  const lamp = new THREE.PointLight(0xffb066, estacao === "inverno" ? 2.2 : 0.4, 5, 1.6); lamp.position.set(-1.95, 0.95, -1.1); g.add(lamp);
  // calendário à direita da janela
  const cal = calendario(); cal.g.position.set(0.55, 1.95, ZW + 0.075); g.add(cal.g);
  // quadro e tapete
  box(0.6, 0.45, 0.03, mk(0x2d3b4a, 0.6), 1.5, 1.6, ZW + 0.07);
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.015, 24), mk(0x4a5a6e, 0.95)); tap.position.set(0.6, 0.01, 0.4); g.add(tap);
  const nv = estacao === "inverno" && neveN ? neve(S, { n: neveN, x: [JX - 3, JX + 3], y: [-0.2, 4], z: [-5, -1.8], seed: 17, tam: 0.035, vel: 0.35 }) : null;
  return { g, cal, neve: nv, lamp, vidro, ceu };
}

/* ---------- árvores ---------- */
export function pinheiro(mk = M, s = 1, comNeve = true) {
  const g = new THREE.Group(), verde = mk(0x2c4a36, 0.85), branco = mk(0xf2f6fa, 0.75);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 6), mk(0x4a3626, 0.9)); t.position.y = 0.3; g.add(t);
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.75 - i * 0.18, 1.0, 8), verde); c.position.y = 0.9 + i * 0.55; g.add(c);
    if (comNeve) { const n = new THREE.Mesh(new THREE.ConeGeometry(0.5 - i * 0.13, 0.45, 8), branco); n.position.y = 1.2 + i * 0.55; g.add(n); }
  }
  g.scale.setScalar(s); return g;
}
export function arvoreFlor(mk = M, s = 1, seed = 1) {
  const r = mulberry32(seed), g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.4, 6), mk(0x5a4030, 0.9)); t.position.y = 0.7; g.add(t);
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 + r() * 0.25, 1), mk(i % 2 ? 0xf0b8c8 : 0x7fae58, 0.85)); c.position.set((r() - 0.5) * 0.8, 1.6 + r() * 0.6, (r() - 0.5) * 0.8); g.add(c); }
  g.scale.setScalar(s); return g;
}
export function baoba(mk = M, seed = 1, s = 1) {
  const r = mulberry32(seed), g = new THREE.Group(), casca = mk(0x8a7464, 0.95);
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.05, 5.2, 18, 4), casca); tr.position.y = 2.6; g.add(tr);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.283 + r() * 0.4, l = 1.2 + r() * 1.0;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, l, 6), casca);
    b.position.set(Math.cos(a) * 0.45, 5.2 + l * 0.35, Math.sin(a) * 0.45); b.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(b);
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 + r() * 0.2, 0), mk(0x5d6b34, 0.9)); f.position.set(Math.cos(a) * (0.45 + l * 0.6), 5.2 + l * 0.75, Math.sin(a) * (0.45 + l * 0.6)); g.add(f);
  }
  // oco: buraco escuro na frente (+z), à altura de 1.6
  const oco = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), new THREE.MeshBasicMaterial({ color: 0x0d0805 })); oco.scale.set(1, 1.3, 1); oco.position.set(0, 1.6, 0.93); oco.rotation.x = -0.06; g.add(oco);
  const borda = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.07, 6, 20), casca); borda.scale.set(1, 1.3, 1); borda.position.copy(oco.position); borda.position.z += 0.01; g.add(borda);
  g.scale.setScalar(s);
  return { g, oco: new THREE.Vector3(0, 1.6 * s, 0.93 * s) };
}

/* ---------- bichos dormindo (enrolados, frente para +x) ---------- */
function bolota(g, m, s, p, r = [0, 0, 0]) { const o = new THREE.Mesh(SPH, m); o.scale.set(...s); o.position.set(...p); o.rotation.set(...r); g.add(o); return o; }
function olhoFechado(g, p, s = 0.05, ry = 0) {
  const o = new THREE.Mesh(new THREE.TorusGeometry(s, s * 0.18, 4, 10, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0a0605 }));
  o.position.set(...p); o.rotation.set(0, Math.PI / 2 + ry, Math.PI); g.add(o); return o;
}
export function urso(mk = M) {
  const g = new THREE.Group(), pelo = mk(0x231b17, 0.95), pelo2 = mk(0x2e241e, 0.95), foc = mk(0x6a5040, 0.85), nariz = mk(0x0b0908, 0.3);
  const corpo = bolota(g, pelo, [1.05, 0.62, 0.72], [0, 0.6, 0]);
  bolota(g, pelo2, [0.62, 0.55, 0.6], [-0.65, 0.55, 0.05]);              // quadril
  const cab = new THREE.Group(); cab.position.set(0.85, 0.45, 0.35); cab.rotation.set(0.15, -0.5, -0.35); g.add(cab);
  bolota(cab, pelo, [0.38, 0.33, 0.34], [0, 0, 0]);
  bolota(cab, foc, [0.24, 0.15, 0.17], [0.3, -0.07, 0]);
  bolota(cab, nariz, [0.06, 0.045, 0.07], [0.52, -0.02, 0]);
  for (const s of [1, -1]) { bolota(cab, pelo, [0.09, 0.11, 0.06], [-0.1, 0.3, s * 0.22]); olhoFechado(cab, [0.25, 0.1, s * 0.15], 0.04); }
  // patas dobradas na frente
  bolota(g, pelo2, [0.5, 0.17, 0.2], [0.75, 0.15, -0.25], [0, 0.2, 0]); bolota(g, pelo2, [0.45, 0.16, 0.2], [0.62, 0.15, 0.4], [0, -0.3, 0]);
  bolota(g, pelo2, [0.45, 0.2, 0.25], [-0.75, 0.18, 0.55], [0, 0.4, 0]);
  return { g, cab, corpo, respira(t, k = 1, bpm = 3) { const b = Math.sin(t * 6.283 * bpm / 60) * 0.025 * k; corpo.scale.set(1.05, 0.62 * (1 + b), 0.72 * (1 + b)); } };
}
export function lemure(mk = M) {
  const g = new THREE.Group(), pelo = mk(0x8c7c6c, 0.95), claro = mk(0xd8ccb8, 0.95), mascara = mk(0x3a2c24, 0.9), nariz = mk(0x161010, 0.3);
  const corpo = bolota(g, pelo, [0.16, 0.13, 0.13], [0, 0.13, 0]);
  bolota(g, claro, [0.12, 0.1, 0.1], [0.04, 0.1, 0.05]);
  const cab = new THREE.Group(); cab.position.set(0.14, 0.12, 0.08); cab.rotation.set(0.25, -0.6, -0.3); g.add(cab);
  bolota(cab, pelo, [0.085, 0.075, 0.08], [0, 0, 0]);
  bolota(cab, claro, [0.05, 0.035, 0.04], [0.065, -0.025, 0]);
  bolota(cab, nariz, [0.012, 0.01, 0.014], [0.11, -0.015, 0]);
  for (const s of [1, -1]) {
    bolota(cab, mascara, [0.03, 0.026, 0.026], [0.06, 0.018, s * 0.035]);
    olhoFechado(cab, [0.088, 0.02, s * 0.035], 0.013);
    bolota(cab, pelo, [0.022, 0.032, 0.014], [-0.03, 0.07, s * 0.05]);
  }
  // cauda gorda (reserva de gordura) enrolada em volta do corpo
  const cauda = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.055, 10, 24, Math.PI * 1.35), mk(0x7a6a5a, 0.95));
  cauda.rotation.set(Math.PI / 2, 0, 0.6); cauda.position.set(-0.02, 0.06, 0); g.add(cauda);
  return { g, cab, corpo, cauda, respira(t, k = 1) { const b = Math.sin(t * 1.3) * 0.03 * k; corpo.scale.set(0.16, 0.13 * (1 + b), 0.13 * (1 + b)); } };
}
export function marmota(mk = M) {
  const g = new THREE.Group(), pelo = mk(0x7a5634, 0.95), esc = mk(0x4a3220, 0.95), nariz = mk(0x161010, 0.3);
  const corpo = bolota(g, pelo, [0.3, 0.24, 0.26], [0, 0.24, 0]);
  const cab = new THREE.Group(); cab.position.set(0.22, 0.17, 0.12); cab.rotation.set(0.3, -0.6, -0.5); g.add(cab);
  bolota(cab, pelo, [0.13, 0.11, 0.12], [0, 0, 0]);
  bolota(cab, esc, [0.07, 0.05, 0.06], [0.09, -0.03, 0]);
  bolota(cab, nariz, [0.018, 0.014, 0.022], [0.155, -0.015, 0]);
  for (const s of [1, -1]) { olhoFechado(cab, [0.1, 0.035, s * 0.06], 0.018); bolota(cab, esc, [0.02, 0.025, 0.018], [-0.03, 0.09, s * 0.07]); }
  const cauda = bolota(g, esc, [0.2, 0.06, 0.07], [-0.12, 0.08, 0.24], [0, -0.8, 0]);
  return { g, cab, corpo, respira(t, k = 1) { const b = Math.sin(t * 1.1) * 0.03 * k; corpo.scale.set(0.3, 0.24 * (1 + b), 0.26 * (1 + b)); } };
}

/* ---------- espaço ---------- */
export function capsula(mk = M, cores = {}) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(roundBox(2.1, 0.45, 0.85, 0.18), mk(0xd8dde4, 0.35, { metalness: 0.5 })); g.add(base);
  const faixa = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.02), mk(0x7cc8ff, 0.3, { emissive: 0x7cc8ff, emissiveIntensity: 2.2 })); faixa.position.set(0, 0.3, 0.43); g.add(faixa);
  const h = createAnimal("humano", { cor: cores.roupa ?? 0xe8eef4, cor2: cores.calca ?? 0xc9d2dc, cabelo: cores.cabelo ?? 0x2a1d16 });
  h.group.rotation.z = -Math.PI / 2; h.group.position.set(-0.95, 0.62, 0); h.group.scale.setScalar(0.95); g.add(h.group);
  h.arms.forEach((a) => (a.rotation.z = 0.05));
  const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.0, 20, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: 0xbfe4ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }));
  tampa.rotation.z = Math.PI / 2; tampa.rotation.x = 0; tampa.position.set(0, 0.45, 0); g.add(tampa);
  const geada = new THREE.Mesh(new THREE.CylinderGeometry(0.425, 0.425, 2.0, 20, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ color: 0x9fd6ff, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  geada.rotation.z = Math.PI / 2; geada.position.copy(tampa.position); g.add(geada);
  return { g, humano: h, tampa, faixa };
}
export function nave(mk = M) {
  const g = new THREE.Group(), metal = mk(0xd9dce2, 0.35, { metalness: 0.6 }), escuro = mk(0x3a3f48, 0.5, { metalness: 0.6 }), ouro = mk(0xc8a050, 0.3, { metalness: 0.9 });
  const cil = (r, l, m, x) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 24), m); o.rotation.z = Math.PI / 2; o.position.x = x; g.add(o); return o; };
  cil(0.55, 2.2, metal, 0.6);                       // habitat (cápsulas)
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), metal); nariz.rotation.z = -Math.PI / 2; nariz.position.x = 1.7; g.add(nariz);
  cil(0.42, 1.0, ouro, -1.0);                       // depósito (comida/água)
  cil(0.12, 1.4, escuro, -2.1);                     // treliça
  cil(0.5, 0.9, metal, -3.2);                       // tanques
  const bocal = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.6, 20, 1, true), escuro); bocal.rotation.z = Math.PI / 2; bocal.position.x = -3.95; g.add(bocal);
  const motor = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0x8fc8ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); motor.scale.set(1.6, 1.6, 1); motor.position.x = -4.35; g.add(motor);
  // painéis solares
  const pm = mk(0x1d3f78, 0.25, { metalness: 0.7, emissive: 0x0a1a3a, emissiveIntensity: 0.3 });
  for (const s of [1, -1]) for (const x of [-1.7, -2.5]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.03, 2.3), pm); p.position.set(x, 0, s * 1.55); g.add(p);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.5), escuro); b.position.set(x, 0, s * 0.3); g.add(b);
  }
  // janelinhas do habitat
  for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.CircleGeometry(0.06, 10), new THREE.MeshBasicMaterial({ color: 0xffd7a0 })); w.position.set(0.0 + i * 0.3, 0.12, 0.551); g.add(w); }
  return { g, motor };
}
export function marte(raio = 1, seed = 4) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256; const x = c.getContext("2d");
  x.fillStyle = "#b8562e"; x.fillRect(0, 0, 512, 256);
  const r = mulberry32(seed);
  for (let i = 0; i < 260; i++) { const px = r() * 512, py = 30 + r() * 196, rr = 6 + r() * 38; x.globalAlpha = 0.1 + r() * 0.22; x.fillStyle = r() < 0.55 ? "#6e2e18" : "#d9824a"; x.beginPath(); x.ellipse(px, py, rr * 1.6, rr, 0, 0, 6.283); x.fill(); }
  x.globalAlpha = 0.9; x.fillStyle = "#f2e8e0"; x.fillRect(0, 0, 512, 10); x.globalAlpha = 0.5; x.fillRect(0, 10, 512, 8); x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.SphereGeometry(raio, 48, 24), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }));
}
export function estrelas(S, { n = 1600, seed = 7, raio = 300 } = {}) {
  const r = mulberry32(seed), P = new Float32Array(n * 3), C = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, a = r() * 6.283, s = Math.sqrt(1 - u * u);
    P.set([Math.cos(a) * s * raio, u * raio, Math.sin(a) * s * raio], i * 3);
    const b = 0.35 + r() * r() * 1.4, q = r(); C.set([b * (q < 0.2 ? 1 : 0.85), b * 0.9, b * (q > 0.8 ? 0.7 : 1)], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(P, 3)); g.setAttribute("color", new THREE.BufferAttribute(C, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, toneMapped: false })); S.add(p); return p;
}

export { ease, clamp, lerp, range, mulberry32 };
