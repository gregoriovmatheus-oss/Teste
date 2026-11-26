/**
 * idade.js — peças do vídeo "E se todos parassem de envelhecer aos 25?" (lote 5). Tudo determinístico.
 *   AZUL, LARANJA, await prepara()               fontes doc
 *   proj / txt / painel / tag / titulo / numero  textos 2D doc (copiados de quatro.js)
 *   lista(ctx, itens, x, y, {...})               lista de itens com risco animado (f02/f03)
 *   brilho(cor, tam, tipo, op)                   sprite aditivo
 *   heroi(LP, {...}) -> p                        protagonista R11 de 25 anos (mesmo rosto em todo o vídeo)
 *   bolo(LP, {num}) -> {g, update(t)}            bolo com vela de número "25" e chamas
 *   hidra(LP) / rato(LP) -> {root, update(t)}    bichos que quase não envelhecem (silhuetas)
 *   palcoDoc(T, canvas, {...}) -> st             palco R10 escuro de estúdio
 */
import * as THREE from "../three.module.js";
import { mulberry32, clamp, lerp } from "../kit.js";

export const AZUL = "#7cc8ff", LARANJA = "#ff8a4c";

/* ---------- fontes + tipografia doc ---------- */
const FONTES = [["Inter", 300, "inter-latin-300-normal"], ["Inter", 600, "inter-latin-600-normal"], ["Inter", 800, "inter-latin-800-normal"],
  ["Inter", 300, "inter-latin-ext-300-normal"], ["Inter", 800, "inter-latin-ext-800-normal"],
  ["JetBrains Mono", 600, "jetbrains-mono-latin-600-normal"], ["JetBrains Mono", 400, "jetbrains-mono-latin-400-normal"]];
let _prep = null;
export function prepara() {
  if (_prep) return _prep;
  if (!document.getElementById("des-css")) {
    const s = document.createElement("style"); s.id = "des-css";
    s.textContent = FONTES.map(([f, w, a]) => `@font-face { font-family: "${f}"; font-weight: ${w}; font-style: normal; font-display: block; src: url("assets/fonts/${a}.woff2") format("woff2"); }`).join("\n");
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
  if (sombra) { ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 16; ctx.shadowOffsetY = 2; }
  ctx.fillText(s, x, y);
  ctx.restore();
}
export function painel(ctx, x, y, w, h, a = 1, { borda = AZUL } = {}) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a) * 0.8; ctx.fillStyle = "rgba(6,10,18,0.82)";
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
  ctx.globalAlpha = Math.min(1, a) * 0.9; ctx.strokeStyle = borda; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
// etiqueta mono presa a um ponto 3D (fio fino até o ponto), sempre em y 640–1000 e x 80–940
export function etq(ctx, s, v, cam, a = 1, { cor = AZUL, tam = 26, dy = -120, dx = 0 } = {}) {
  if (a <= 0.003) return;
  const [x, y, z] = proj(v, cam); if (z > 1) return;
  const ly = clamp(y + dy, 660, 990), lx = clamp(x + dx, 120, 900);
  ctx.save(); ctx.globalAlpha = Math.min(1, a) * 0.85; ctx.strokeStyle = cor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(lx, ly + (ly < y ? 22 : -22)); ctx.stroke();
  ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.283); ctx.fill(); ctx.restore();
  ctx.save(); ctx.font = `600 ${tam}px "JetBrains Mono", monospace`; ctx.letterSpacing = `${(0.22 * tam).toFixed(1)}px`;
  const w = ctx.measureText(s).width + 36; ctx.restore();
  painel(ctx, lx - w / 2, ly - 24, w, 48, a, { borda: cor });
  txt(ctx, s, lx, ly + 1, { tam, cor: "#fff", a, esp: 0.22, sombra: false });
}

/* ---------- brilhos ---------- */
const _tex = {};
export function glowTex(tipo = "suave") {
  if (_tex[tipo]) return _tex[tipo];
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  if (tipo === "raios") {
    const r = mulberry32(31); g.translate(64, 64);
    for (let i = 0; i < 26; i++) { const a = (i / 26) * 6.283 + r() * 0.2, L = 30 + r() * 34;
      const gr = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.strokeStyle = gr; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.stroke(); }
  } else {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.15, "rgba(255,255,255,0.65)"); gr.addColorStop(0.4, "rgba(255,255,255,0.16)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (_tex[tipo] = t);
}
export function brilho(cor, tam, tipo = "suave", op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(tipo), color: cor, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  s.scale.setScalar(tam); return s;
}
/* ---------- título doc desenhado no canvas (visível já no quadro 0) ---------- */
// linhas: ["E se *todos os vulcões*", ...]  (*…* = palavra-chave em 800 com degradê azul)
export function titulo(ctx, k, linhas, a = 1, { y = 800, tam = 76, kTam = 26 } = {}) {
  if (a <= 0.003) return;
  const lh = tam * 1.12, y0 = y - ((linhas.length - 1) * lh) / 2 + (k ? kTam : 0);
  if (k) txt(ctx, k, 540, y0 - tam * 0.5 - kTam * 1.2, { tam: kTam, cor: AZUL, a, esp: 0.32 });
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.textBaseline = "middle"; ctx.textAlign = "left";
  linhas.forEach((l, i) => {
    const seg = l.split("*").map((s, j) => [s, j % 2 === 1]).filter((x) => x[0]);
    const fonte = (b) => `${b ? 800 : 300} ${tam}px "Inter", sans-serif`;
    let w = 0; seg.forEach(([s, b]) => { ctx.font = fonte(b); w += ctx.measureText(s).width; });
    let x = 540 - w / 2; const yy = y0 + i * lh;
    seg.forEach(([s, b]) => { ctx.font = fonte(b); const sw = ctx.measureText(s).width;
      ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 2;
      if (b) { const gr = ctx.createLinearGradient(x, 0, x + sw, 0); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#9fd6ff"); ctx.fillStyle = gr; } else ctx.fillStyle = "#fff";
      ctx.fillText(s, x, yy); x += sw; });
  });
  ctx.restore();
}
export function guardaAbas(p) {
  const A = (p.abas || []).map((a) => a.rotation.clone()), M = p.mechas ? p.mechas.rotation.clone() : null;
  return () => { (p.abas || []).forEach((a, i) => a.rotation.copy(A[i])); if (M) p.mechas.rotation.copy(M); };
}

/* ---------- palco de dado (R10, estúdio escuro) ---------- */
export function palcoDoc(T, canvas, { fov = 34, ceu = "#05070c", chao = 0x0c1018, exposicao = 1.0 } = {}) {
  const st = T.createToyStage(canvas, { fov, ceu, nevoa: [8, 40], corNevoa: ceu, nuvens: 0, exposicao });
  st.hemi.intensity = 0.25; st.key.intensity = 2.2; st.key.color.set(0xdfe8ff); st.rim.intensity = 1.4; st.rim.color.set(0x7cc8ff); st.sol(0, 0, 8);
  const g = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: chao, roughness: 0.32, metalness: 0.2 }));
  g.rotation.x = -Math.PI / 2; g.receiveShadow = true; st.scene.add(g);
  return st;
}
// etiqueta curta presa a um ponto 3D, sem prender na faixa do título (y 380–1000, x 90–930); seta = pontinho no alvo
export function tag(ctx, s, v, cam, a = 1, { cor = AZUL, dx = 0, dy = -70, tam = 26 } = {}) {
  if (a <= 0.003) return;
  const [x, y, z] = proj(v, cam); if (z > 1) return;
  const ly = clamp(y + dy, 390, 995);
  ctx.save(); ctx.font = `600 ${tam}px "JetBrains Mono", monospace`; ctx.letterSpacing = `${(0.2 * tam).toFixed(1)}px`;
  const w = ctx.measureText(s).width + 32; ctx.restore();
  const lx = clamp(x + dx, 90 + w / 2, 930 - w / 2);
  ctx.save(); ctx.globalAlpha = Math.min(1, a) * 0.85; ctx.strokeStyle = cor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(lx, ly + (ly < y ? 22 : -22)); ctx.stroke();
  ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.fill(); ctx.restore();
  painel(ctx, lx - w / 2, ly - 23, w, 46, a, { borda: cor });
  txt(ctx, s, lx, ly + 1, { tam, cor: "#fff", a, esp: 0.2, sombra: false });
}
// número grande doc no canvas (Inter 800 com degradê), para contadores
export function numero(ctx, s, x, y, a = 1, { tam = 120, cor = null } = {}) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.font = `800 ${tam}px "Inter", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const w = ctx.measureText(s).width; const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, cor || "#ffffff"); g.addColorStop(1, cor || "#9fd6ff"); ctx.fillStyle = g;
  ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 28; ctx.fillText(s, x, y); ctx.restore();
}
/* ---------- lista com risco (itens que somem/ficam) ---------- */
// itens: [[texto, tEntra, tRisca|null]], t = tempo local; x = centro
export function lista(ctx, itens, t, x, y, { tam = 34, lh = 70, cor = "#fff", corRisco = LARANJA, w = 600 } = {}) {
  itens.forEach(([s, t0, tr], i) => {
    const a = clamp((t - t0) / 0.25, 0, 1); if (a <= 0) return; const yy = y + i * lh;
    painel(ctx, x - w / 2, yy - lh * 0.4, w, lh * 0.8, a * 0.9);
    txt(ctx, s, x, yy + 1, { tam, cor, a, esp: 0.14 });
    if (tr != null) { const k = clamp((t - tr) / 0.3, 0, 1); if (k > 0) { ctx.save(); ctx.strokeStyle = corRisco; ctx.lineWidth = 5; ctx.globalAlpha = a;
      ctx.beginPath(); ctx.moveTo(x - w / 2 + 30, yy); ctx.lineTo(x - w / 2 + 30 + (w - 60) * k, yy); ctx.stroke(); ctx.restore(); } }
  });
}

/* ---------- protagonista (25 anos) ---------- */
export function heroi(LP, { roupa = "camiseta", camisa = 0x3e6a8a, seed = 12, ...o } = {}) {
  return LP.pessoa({ seed, roupa, camisa, pele: 0xc89070, cabelo: 0x2a1a10, barba: false, iris: 0x4a2c14, cabeloTipo: "topete", ...o });
}

/* ---------- bolo com vela "25" ---------- */
export function bolo(LP, { num = "25" } = {}) {
  const g = new THREE.Group(), cil = (r, h, c, y, rough = 0.6) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 22), LP.mat(c, rough)); m.position.y = y; g.add(m); return m; };
  cil(0.21, 0.014, 0xf4f0ea, 0.007, 0.3); cil(0.15, 0.11, 0xf6dcc4, 0.07); cil(0.153, 0.022, 0xe2557a, 0.13, 0.35);
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.014, 0), LP.mat([0xff8a4c, 0x7cc8ff, 0xffe066][i % 3], 0.4)); const a = (i / 14) * 6.283; b.position.set(Math.cos(a) * 0.13, 0.145, Math.sin(a) * 0.13); g.add(b); }
  const c = document.createElement("canvas"); c.width = 256; c.height = 200; const x = c.getContext("2d");
  x.font = '800 190px "Inter", sans-serif'; x.textAlign = "center"; x.textBaseline = "middle"; x.lineWidth = 8; x.strokeStyle = "#7a2a10"; x.strokeText(num, 128, 108);
  const gr = x.createLinearGradient(0, 20, 0, 190); gr.addColorStop(0, "#ffb347"); gr.addColorStop(1, "#e8582a"); x.fillStyle = gr; x.fillText(num, 128, 108);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const vela = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.125), new THREE.MeshStandardMaterial({ map: tx, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.5, emissive: 0xff9a50, emissiveMap: tx, emissiveIntensity: 0 }));
  vela.position.y = 0.21; g.add(vela);
  const chamas = [-0.04, 0.04].map((dx) => { const f = brilho(0xffb050, 0.05, "suave", 0.8), n = brilho(0xfff2c0, 0.03, "suave", 1); f.position.set(dx, 0.3, 0.005); n.position.set(dx, 0.293, 0.01); g.add(f, n); return [f, n]; });
  const luz = new THREE.PointLight(0xffa860, 0.7, 3, 2); luz.position.set(0, 0.45, -0.1); g.add(luz);
  return { g, vela, update(t, k = 1) { chamas.forEach(([f, n], i) => { const fl = 1 + 0.12 * Math.sin(t * 17 + i * 2) + 0.08 * Math.sin(t * 29 + i);
    f.scale.set(0.035 * fl * k, 0.06 * fl * k, 1); n.scale.set(0.025 * k, 0.04 * fl * k, 1); f.material.opacity = n.material.opacity = k; }); luz.intensity = 1.2 * k * (1 + 0.1 * Math.sin(t * 13)); } };
}

/* ---------- hidra: pé, corpo-tubo e 6 tentáculos finos que ondulam ---------- */
export function hidra(LP, { cor = 0x9ac46a } = {}) {
  const root = new THREE.Group(), m = LP.mat(cor, 0.45, { transparent: true, opacity: 0.92, emissive: cor, emissiveIntensity: 0.12 });
  const corpo = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.05, 0], [0.035, 0.08], [0.03, 0.3], [0.05, 0.48], [0.055, 0.55], [0.03, 0.6], [0, 0.62]].map(([x, y]) => new THREE.Vector2(x, y)), 10), m);
  root.add(corpo);
  const tent = []; for (let k = 0; k < 6; k++) { const base = new THREE.Group(); base.position.y = 0.58; base.rotation.y = (k / 6) * 6.283; root.add(base);
    let pai = base; const segs = [];
    for (let j = 0; j < 9; j++) { const s = new THREE.Group(); s.position.y = j ? 0.07 : 0; s.rotation.x = j ? 0.12 : 0.95; pai.add(s);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.009 * (1 - j / 11), 0.01 * (1 - j / 11), 0.072, 5), m); c.position.y = 0.036; s.add(c); segs.push(s); pai = s; }
    tent.push(segs); }
  return { root, update(t) { corpo.rotation.z = 0.05 * Math.sin(t * 0.9); tent.forEach((segs, k) => segs.forEach((s, j) => { if (!j) return;
    s.rotation.x = 0.1 + 0.16 * Math.sin(t * 1.7 - j * 0.6 + k * 1.1); s.rotation.z = 0.08 * Math.sin(t * 1.3 - j * 0.5 + k * 2); })); } };
}

/* ---------- rato-toupeira-pelado: corpo de salsicha rosado e enrugado, dentes enormes pra frente, olhos mínimos ---------- */
export function rato(LP, { cor = 0xe9a89a } = {}) {
  const root = new THREE.Group(), m = LP.mat(cor, 0.55, { emissive: 0x803030, emissiveIntensity: 0.06 });
  const corpo = new THREE.Mesh(LP.facetado(3, (v) => { v.z *= 2.3; v.x *= 0.95; v.y *= 0.82; v.multiplyScalar(1 + 0.045 * Math.sin(v.z * 7.5)); if (v.y < -0.4) v.y = -0.4 - (v.y + 0.4) * 0.3; }, 9, 0.05), m);
  corpo.scale.setScalar(0.1); corpo.position.y = 0.085; root.add(corpo);
  const cab = new THREE.Group(); cab.position.set(0, 0.085, 0.215); root.add(cab);
  const cabM = new THREE.Mesh(LP.facetado(2, (v) => { v.z *= 1.35; v.y *= 0.8; if (v.z > 0.6) v.y -= 0.1 * (v.z - 0.6); }, 4, 0.05), m); cabM.scale.setScalar(0.072); cab.add(cabM);
  const nariz = new THREE.Mesh(new THREE.IcosahedronGeometry(0.016, 0), LP.mat(0xd98a80, 0.5)); nariz.position.set(0, 0.0, 0.098); cab.add(nariz);
  const olhos = [1, -1].map((s) => { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.006, 1), LP.mat(0x120808, 0.2)); o.position.set(s * 0.04, 0.022, 0.058); cab.add(o); return o; });
  const dm = LP.mat(0xf2e2b0, 0.3);
  [[0.009, -0.03, 0.1, 0.05, 0.35], [-0.009, -0.03, 0.1, 0.05, 0.35], [0.007, -0.052, 0.095, 0.042, -0.5], [-0.007, -0.052, 0.095, 0.042, -0.5]].forEach(([x, y, z, h, r]) => {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.009, h, 0.006), dm); d.position.set(x, y, z); d.rotation.x = r + 1.2; cab.add(d); });
  const patas = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.05, 5), m); p.position.set(sx * 0.07, 0.025, sz * 0.13); root.add(p);
    const pe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 0.04), LP.mat(0xf0b8b0, 0.6)); pe.position.set(sx * 0.07, 0.005, sz * 0.13 + 0.01); root.add(pe); return [p, pe]; });
  const rabo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.014, 0.12, 5), m); rabo.position.set(0, 0.06, -0.27); rabo.rotation.x = -1.2; root.add(rabo);
  const fio = new THREE.LineBasicMaterial({ color: 0xf6e8e0, transparent: true, opacity: 0.6 }), pts = [];
  [1, -1].forEach((s) => [0, 1, 2].forEach((i) => pts.push(new THREE.Vector3(s * 0.02, 0, 0.09), new THREE.Vector3(s * 0.09, 0.01 - i * 0.015, 0.1 - i * 0.01))));
  cab.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), fio));
  return { root, cab, update(t, andar = 0) { const f = t * 9 * andar; patas.forEach(([p, pe], i) => { const o = 0.012 * Math.sin(f + (i % 3 ? Math.PI : 0)); p.position.z += 0; pe.position.y = 0.005 + Math.max(0, o); });
    cab.rotation.y = 0.18 * Math.sin(t * 1.6); cab.rotation.x = 0.06 * Math.sin(t * 2.3); corpo.scale.y = 0.1 * (1 + 0.03 * Math.sin(t * 5)); } };
}
