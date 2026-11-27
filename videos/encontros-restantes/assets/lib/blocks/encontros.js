/**
 * encontros.js — peças do vídeo "E se você soubesse quantas vezes ainda vai encontrar cada pessoa?" (lote 6). Tudo determinístico.
 *   AZUL, LARANJA, await prepara()                fontes doc
 *   proj / txt / painel / tag / etq / titulo / numero / lista   textos 2D doc (copiados de idade.js)
 *   brilho(cor, tam, tipo, op), palcoDoc(T, canvas, {...})      sprite aditivo / palco R10 de estúdio
 *   odometro(ctx, v, x, y, {...})                 número que gira como hodômetro (v fracionário = dígito rolando)
 *   sobreCabeca(ctx, v, p|vec3, cam, a, {...})    selo com o número flutuando acima da cabeça (y 560–1000, x 90–930)
 *   heroi / amigo / mae / avo (LP, {...})         elenco R11 fixo (mesmo rosto em todo o vídeo)
 *   mesaCafe(LP, {alt}) -> {g, xic: [..]}         mesa alta de café com 2 xícaras
 *   multidao(LP, S, lista) -> [f]                 figurantes que andam de lado (x) ou ficam parados
 *   pontoOnibus(LP) -> g                          abrigo de ônibus simples (teto, vidro, banco, placa)
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

/* ---------- número que gira (hodômetro) ---------- */
const fmt = (n) => String(Math.max(0, n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
// v pode ser fracionário: a parte fracionária rola os dígitos que mudam entre floor(v) e floor(v)+1
export function odometro(ctx, v, x, y, { tam = 96, a = 1, cor = null, borrado = 0, t = 0, al = "center" } = {}) {
  if (a <= 0.003) return 0;
  const n = Math.floor(v), f = v - n, s0 = fmt(n), s1 = fmt(n + 1), L = Math.max(s0.length, s1.length);
  const A = s0.padStart(L, " "), B = s1.padStart(L, " ");
  ctx.save(); ctx.font = `800 ${tam}px "Inter", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const cw = ctx.measureText("0").width * 1.02, pw = ctx.measureText(".").width * 1.1;
  const larg = [...B].map((c) => (c === "." ? pw : c === " " ? 0 : cw)), W = larg.reduce((s, w) => s + w, 0);
  let xx = al === "center" ? x - W / 2 : x;
  const g = ctx.createLinearGradient(x - W / 2, 0, x + W / 2, 0); g.addColorStop(0, cor || "#ffffff"); g.addColorStop(1, cor || "#9fd6ff");
  ctx.fillStyle = g; ctx.globalAlpha = Math.min(1, a); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.rect(x - W / 2 - 20, y - tam * 0.47, W + 40, tam * 0.94); ctx.clip();
  if (borrado > 0) ctx.filter = `blur(${(borrado * tam * 0.16).toFixed(1)}px)`;
  const e = f < 0.5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f);
  for (let i = 0; i < L; i++) {
    const w = larg[i], cx = xx + w / 2; xx += w; if (!w) continue;
    let c0 = A[i], c1 = B[i];
    if (borrado > 0) { const h = Math.sin((Math.floor(t * 14) + i * 7.3) * 12.9898) * 43758.5453; c0 = c1 = c0 === "." ? "." : String(Math.floor((h - Math.floor(h)) * 10)); }
    if (c0 === c1) ctx.fillText(c0, cx + (borrado ? Math.sin(t * 23 + i) * borrado * 6 : 0), y);
    else { const dy = e * tam * 1.05; ctx.fillText(c0 === " " ? "" : c0, cx, y - dy); ctx.fillText(c1, cx, y + tam * 1.05 - dy); }
  }
  ctx.restore();
  return W;
}
// selo acima da cabeça: alvo = pessoa (usa p.cab) ou vec3 do topo. Pílula escura com borda + número + rótulo mono opcional.
const _h = new THREE.Vector3();
export function sobreCabeca(ctx, v, alvo, cam, a = 1, { tam = 72, borrado = 0, t = 0, cor = AZUL, numCor = null, rotulo = "", sobe = 0.3, ymin = 500, ymax = 1000, pulso = 0 } = {}) {
  if (a <= 0.003) return;
  if (alvo.cab) alvo.cab.getWorldPosition(_h).add(new THREE.Vector3(0, sobe, 0)); else _h.copy(alvo);
  const [x0, y0, z] = proj(_h, cam); if (z > 1) return;
  const y = clamp(y0, ymin, ymax), s = 1 + 0.12 * pulso;
  ctx.save(); ctx.font = `800 ${tam}px "Inter", sans-serif`; const est = ctx.measureText(fmt(Math.floor(v) + 1)).width; ctx.restore();
  const w = Math.max(est + tam * 0.9, rotulo ? rotulo.length * tam * 0.2 + 40 : 0), h = tam * 1.25 + (rotulo ? tam * 0.42 : 0);
  const x = clamp(x0, 90 + w / 2, 930 - w / 2);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y);
  const up = 1 - Math.min(1, a); ctx.translate(0, up * 26);
  // halo suave + pílula
  ctx.save(); ctx.globalAlpha = Math.min(1, a) * 0.5; const gr = ctx.createRadialGradient(x, y, 0, x, y, w * 0.8);
  gr.addColorStop(0, cor + "66"); gr.addColorStop(1, cor + "00"); ctx.fillStyle = gr; ctx.fillRect(x - w, y - w, w * 2, w * 2); ctx.restore();
  painel(ctx, x - w / 2, y - h / 2, w, h, a, { borda: cor });
  ctx.save(); ctx.globalAlpha = Math.min(1, a) * 0.85; ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(x - 12, y + h / 2); ctx.lineTo(x + 12, y + h / 2); ctx.lineTo(x, y + h / 2 + 14); ctx.fill(); ctx.restore();
  const yn = rotulo ? y + tam * 0.2 : y;
  if (rotulo) txt(ctx, rotulo, x, y - h / 2 + tam * 0.36, { tam: Math.round(tam * 0.26), cor, a, esp: 0.3, sombra: false });
  odometro(ctx, v, x, yn, { tam, a, borrado, t, cor: numCor });
  ctx.restore();
}

/* ---------- elenco ---------- */
// A = você (protagonista); B = melhor amigo; mãe; avô (o "número um")
export const heroi = (LP, o = {}) => LP.pessoa({ seed: 12, roupa: "jaqueta", jaqueta: 0x2f4f6f, camisa: 0xe8e2d6, pele: 0xc89070, cabelo: 0x2a1a10, barba: false, iris: 0x4a2c14, cabeloTipo: "topete", ...o });
export const amigo = (LP, o = {}) => LP.pessoa({ seed: 27, roupa: "camiseta", camisa: 0xd9862e, pele: 0x8a5a3e, cabelo: 0x140c08, barba: true, iris: 0x2a180c, cabeloTipo: "cacheado", ...o });
export const mae = (LP, o = {}) => LP.pessoa({ seed: 37, feminina: true, roupa: "casaco", jaqueta: 0x8a4a5a, pele: 0xd9a07e, cabelo: 0x5a3a2a, iris: 0x4a3020, ...o });
export const avo = (LP, o = {}) => LP.pessoa({ seed: 44, idade: "idoso", roupa: "casaco", jaqueta: 0x5a5e66, pele: 0xd0a080, iris: 0x3a5a6a, oculos: true, ...o });

/* ---------- mesa de café ---------- */
export function mesaCafe(LP, { alt = 1.05 } = {}) {
  const g = new THREE.Group(), m = (geo, c, r = 0.6) => new THREE.Mesh(geo, LP.mat(c, r));
  const tampo = m(new THREE.CylinderGeometry(0.42, 0.42, 0.035, 28), 0xf0e8dc, 0.35); tampo.position.y = alt; g.add(tampo);
  const pe = m(new THREE.CylinderGeometry(0.03, 0.03, alt, 8), 0x2a2622, 0.4); pe.position.y = alt / 2; g.add(pe);
  const base = m(new THREE.CylinderGeometry(0.2, 0.22, 0.02, 16), 0x2a2622, 0.4); base.position.y = 0.01; g.add(base);
  const xic = [[-0.16, 0.1], [0.17, -0.06]].map(([x, z]) => { const c = new THREE.Group(); c.position.set(x, alt + 0.018, z); g.add(c);
    const pires = m(new THREE.CylinderGeometry(0.075, 0.06, 0.01, 18), 0xffffff, 0.3); c.add(pires);
    const cup = m(new THREE.CylinderGeometry(0.045, 0.035, 0.07, 16, 1, true), 0xffffff, 0.3); cup.material.side = THREE.DoubleSide; cup.position.y = 0.04; c.add(cup);
    const caf = m(new THREE.CircleGeometry(0.042, 16), 0x3a1e10, 0.2); caf.rotation.x = -Math.PI / 2; caf.position.y = 0.068; c.add(caf);
    const asa = m(new THREE.TorusGeometry(0.02, 0.006, 5, 10, Math.PI * 1.3), 0xffffff, 0.3); asa.position.set(0.05, 0.04, 0); asa.rotation.z = -1.0; c.add(asa); return c; });
  return { g, xic };
}

/* ---------- multidão: [[x, z, seed, cor, vel(0 = parado), dir(±1)]] ---------- */
const PELES = [0xb07c62, 0xd9a07e, 0x7a4e36, 0xe0b898, 0x8a5a3e, 0xc89070];
export function multidao(LP, S, lista) {
  return lista.map(([x, z, seed, cor, vel = 0, dir = 1]) => { const f = LP.figurante({ seed, roupa: cor, pele: PELES[seed % PELES.length], longo: seed % 3 === 0 });
    f.root.position.set(x, 0, z); f.root.rotation.y = vel ? dir * Math.PI / 2 : (seed % 5 - 2) * 0.25; S.add(f.root); f.userData = { x, z, vel, dir, seed }; return f; });
}
export function andaMultidao(LP, F, t) {
  F.forEach((f) => { const u = f.userData; f.reset();
    if (u.vel) { const d = LP.andar(f, t + u.seed * 0.37, { vel: u.vel }); f.root.position.x = u.x + u.dir * d; }
    LP.vida(f, t, { seed: u.seed, balanco: 0.5 }); });
}
/* ---------- abrigo de ônibus ---------- */
export function pontoOnibus(LP) {
  const g = new THREE.Group(), cx = (w, h, d, c, x, y, z, r = 0.6, ex = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), LP.mat(c, r, ex)); m.position.set(x, y, z); g.add(m); return m; };
  cx(2.0, 0.06, 0.9, 0x2a3036, 0, 2.3, -0.1, 0.4);
  [-0.95, 0.95].forEach((x) => cx(0.06, 2.3, 0.06, 0x2a3036, x, 1.15, -0.5, 0.4));
  cx(1.9, 1.6, 0.02, 0x9fc8e0, 0, 1.25, -0.52, 0.05, { transparent: true, opacity: 0.25 });
  cx(1.4, 0.06, 0.36, 0x6a4a34, 0, 0.45, -0.3, 0.6); cx(1.4, 0.45, 0.06, 0x2a3036, 0, 0.22, -0.45, 0.4);
  cx(0.05, 2.6, 0.05, 0x2a3036, 1.25, 1.3, 0.1, 0.4); cx(0.42, 0.42, 0.04, 0x1f5fa8, 1.25, 2.45, 0.1, 0.5, { emissive: 0x1f5fa8, emissiveIntensity: 0.4 });
  return g;
}
