/**
 * relogio.js — peças do vídeo "E se você enxergasse quanto tempo cada pessoa ainda tem de vida?" (lote 6). Tudo determinístico.
 * Base copiada de ../encontros-restantes/assets/lib/blocks/encontros.js (textos doc, palco R10, selo sobre a cabeça).
 *   AZUL, LARANJA, await prepara()                 fontes doc
 *   proj / txt / painel / tag / etq / titulo / numero / odometro    textos 2D doc
 *   brilho(cor, tam, tipo, op), palcoDoc(T, canvas, {...})       sprite aditivo / palco R10 de estúdio
 *   fmtRelogio(seg) -> [linha grande, linha pequena]   "84 ANOS" + "112d 06:14:52" | "03:00:00"
 *   relogio(ctx, seg, p|vec3, cam, a, {...})       relógio digital flutuando acima da cabeça (y 470–1000, x 90–930), com glitch/borrado
 *   heroi / mae / bebe / senhor / motoboy (LP)     elenco R11 fixo
 *   capacete(LP, p, cor), moto(LP) -> {g, update(t, vel)}, banco(LP), espelho(LP)
 *   multidao(LP, S, lista) / andaMultidao(LP, F, t) figurantes
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


/* ---------- relógio digital sobre a cabeça ---------- */
const p2 = (n) => String(Math.floor(n)).padStart(2, "0");
const ANO = 365.25 * 86400;
export function fmtRelogio(seg) {
  seg = Math.max(0, seg);
  const hms = (s) => `${p2(s / 3600)}:${p2((s / 60) % 60)}:${p2(s % 60)}`;
  if (seg >= ANO) { const a = Math.floor(seg / ANO), r = seg - a * ANO, d = Math.floor(r / 86400); return [`${a} ${a === 1 ? "ANO" : "ANOS"}`, `${String(d).padStart(3, "0")}d ${hms(r - d * 86400)}`]; }
  if (seg >= 86400) { const d = Math.floor(seg / 86400); return [`${d} DIAS`, hms(seg - d * 86400)]; }
  return [hms(seg), ""];
}
const hsh = (x) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); };
const _rh = new THREE.Vector3();
// seg = segundos restantes (o chamador faz seg0 - t para os segundos andarem). linhas = [grande, pequena] substitui o formato.
export function relogio(ctx, seg, alvo, cam, a = 1, { tam = 62, cor = AZUL, numCor = "#ffffff", rotulo = "", glitch = 0, borrado = 0, t = 0, sobe = 0.32, ymin = 470, ymax = 1000, pulso = 0, linhas = null, dx = 0 } = {}) {
  if (a <= 0.003) return;
  if (alvo.cab) alvo.cab.getWorldPosition(_rh).add(new THREE.Vector3(0, sobe, 0)); else _rh.copy(alvo);
  const [x0, y0, z] = proj(_rh, cam); if (z > 1) return;
  let [L1, L2] = linhas || fmtRelogio(seg);
  const emb = (s, k, sal) => [...s].map((c, i) => (/[0-9]/.test(c) && hsh(Math.floor(t * 18) * 7.1 + i * 3.3 + sal) < k ? String(Math.floor(hsh(Math.floor(t * 18) + i * 9.7 + sal) * 10)) : c)).join("");
  if (glitch > 0 || borrado > 0) { const k = Math.max(glitch, borrado); L1 = emb(L1, k, 1); L2 = emb(L2, k, 2); }
  const t2 = Math.round(tam * 0.42), tr = Math.round(tam * 0.27);
  ctx.save(); ctx.font = `600 ${tam}px "JetBrains Mono", monospace`; const w1 = ctx.measureText(L1).width;
  ctx.font = `600 ${t2}px "JetBrains Mono", monospace`; const w2 = L2 ? ctx.measureText(L2).width : 0; ctx.restore();
  const w = Math.max(w1, w2, rotulo ? rotulo.length * tr * 0.82 : 0) + tam * 0.8, h = tam * 1.2 + (L2 ? t2 * 1.3 : 0) + (rotulo ? tr * 1.5 : 0);
  const y = clamp(y0 - h / 2, ymin + h / 2, ymax - h / 2), x = clamp(x0 + dx, 90 + w / 2, 930 - w / 2), s = 1 + 0.1 * pulso;
  const jx = glitch > 0 ? (hsh(Math.floor(t * 24)) - 0.5) * glitch * 26 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y); ctx.translate(0, (1 - Math.min(1, a)) * 26);
  ctx.save(); ctx.globalAlpha = Math.min(1, a) * 0.55; const gr = ctx.createRadialGradient(x, y, 0, x, y, w * 0.8);
  gr.addColorStop(0, cor + "66"); gr.addColorStop(1, cor + "00"); ctx.fillStyle = gr; ctx.fillRect(x - w, y - w, w * 2, w * 2); ctx.restore();
  painel(ctx, x - w / 2 + jx * 0.4, y - h / 2, w, h, a, { borda: cor });
  ctx.save(); ctx.globalAlpha = Math.min(1, a) * 0.85; ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(x - 11, y + h / 2); ctx.lineTo(x + 11, y + h / 2); ctx.lineTo(x, y + h / 2 + 13); ctx.fill(); ctx.restore();
  let yy = y - h / 2 + tam * 0.18;
  if (rotulo) { txt(ctx, rotulo, x, yy + tr * 0.75, { tam: tr, cor, a, esp: 0.3, sombra: false }); yy += tr * 1.5; }
  const linha = (s, tm, yc, c) => {
    if (borrado > 0) { ctx.save(); ctx.filter = `blur(${(borrado * tm * 0.12).toFixed(1)}px)`; txt(ctx, s, x + Math.sin(t * 23) * borrado * 5, yc, { tam: tm, cor: c, a, esp: 0.04, sombra: false }); ctx.restore(); return; }
    if (glitch > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter";
      txt(ctx, s, x + jx - glitch * 7, yc, { tam: tm, cor: "#ff3b3b", a: a * 0.7 * glitch, esp: 0.04, sombra: false });
      txt(ctx, s, x + jx + glitch * 7, yc, { tam: tm, cor: "#3bd6ff", a: a * 0.7 * glitch, esp: 0.04, sombra: false }); ctx.restore(); }
    txt(ctx, s, x + jx, yc, { tam: tm, cor: c, a, esp: 0.04, sombra: false });
  };
  linha(L1, tam, yy + tam * 0.55, numCor); yy += tam * 1.1;
  if (L2) linha(L2, t2, yy + t2 * 0.55, cor);
  if (glitch > 0.05) { ctx.save(); ctx.globalAlpha = Math.min(1, a) * glitch * 0.8; ctx.fillStyle = "#ffffff";   // faixas de glitch
    for (let i = 0; i < 3; i++) { const hy = y - h / 2 + hsh(Math.floor(t * 20) + i * 4.1) * h; ctx.fillRect(x - w / 2 + hsh(i + Math.floor(t * 20) * 2.3) * w * 0.4, hy, w * (0.2 + 0.4 * hsh(i * 7 + Math.floor(t * 20))), 2 + 3 * hsh(i)); } ctx.restore(); }
  ctx.restore();
}

/* ---------- elenco ---------- */
export const heroi = (LP, o = {}) => LP.pessoa({ seed: 18, roupa: "jaqueta", jaqueta: 0x34506a, camisa: 0xe8e2d6, pele: 0xc89070, cabelo: 0x2a1a10, barba: false, iris: 0x4a2c14, cabeloTipo: "topete", ...o });
export const mae = (LP, o = {}) => LP.pessoa({ seed: 33, feminina: true, roupa: "casaco", jaqueta: 0x9a5a4a, pele: 0xd9a07e, cabelo: 0x3a2418, iris: 0x4a3020, ...o });
export const bebe = (LP, o = {}) => { const b = LP.pessoa({ seed: 5, idade: "crianca", roupa: "pijama", jaqueta: 0xf2e2a8, camisa: 0xf2e2a8, calca: 0xf2e2a8, pele: 0xe8b898, cabelo: 0x6a4a2a, barba: false, iris: 0x3a5a7a, ...o }); b.root.scale.multiplyScalar(0.6); return b; };
export const senhor = (LP, o = {}) => LP.pessoa({ seed: 44, idade: "idoso", roupa: "casaco", jaqueta: 0x5a5e66, pele: 0xd0a080, iris: 0x3a5a6a, oculos: true, ...o });
export const motoboy = (LP, o = {}) => { const p = LP.pessoa({ seed: 52, roupa: "jaqueta", jaqueta: 0x2a2e36, camisa: 0x3a3e46, pele: 0x8a5a3e, cabelo: 0x140c08, barba: true, iris: 0x2a180c, cabeloTipo: "curto", ...o }); capacete(LP, p); return p; };
export function capacete(LP, p, cor = 0xc8402e) {
  const g = new THREE.Group(); p.cab.add(g); p.capacete = g;
  const casco = new THREE.Mesh(new THREE.SphereGeometry(0.168, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), LP.mat(cor, 0.35)); casco.position.set(0, 0.035, -0.012); casco.rotation.x = -0.42; g.add(casco);
  const faixa = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 5, 22, Math.PI * 1.1), LP.mat(0xf2f0ea, 0.4)); faixa.position.set(0, 0.1, -0.03); faixa.rotation.set(-1.2, 0, Math.PI * -0.05); g.add(faixa);
  return g;
}
/* ---------- moto estilizada (low-poly, anda em +z do grupo) ---------- */
export function moto(LP, { cor = 0x2a6ab0, bau = 0xd8a020 } = {}) {
  const g = new THREE.Group(), m = (geo, c, r = 0.5, ex) => new THREE.Mesh(geo, LP.mat(c, r, ex));
  const rodas = [0.62, -0.58].map((z) => { const r = new THREE.Group(); r.position.set(0, 0.3, z); g.add(r);
    const pn = m(new THREE.TorusGeometry(0.24, 0.07, 8, 18), 0x141416, 0.8); pn.rotation.y = Math.PI / 2; r.add(pn);
    const ar = m(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 10), 0x9aa0a8, 0.3, { metalness: 0.6 }); ar.rotation.z = Math.PI / 2; r.add(ar);
    for (let i = 0; i < 3; i++) { const rr = m(new THREE.BoxGeometry(0.03, 0.3, 0.02), 0x3a3e44, 0.4); rr.rotation.x = (i * Math.PI) / 3; r.add(rr); }
    return r; });
  const quadro = m(new THREE.BoxGeometry(0.1, 0.1, 1.0), 0x2a2c30, 0.4); quadro.position.set(0, 0.45, 0); quadro.rotation.x = 0.12; g.add(quadro);
  const tanque = m(new THREE.DodecahedronGeometry(0.2, 1), cor, 0.25); tanque.scale.set(0.9, 0.7, 1.35); tanque.position.set(0, 0.72, 0.28); g.add(tanque);
  const banco_ = m(new THREE.BoxGeometry(0.26, 0.08, 0.55), 0x18181a, 0.7); banco_.position.set(0, 0.74, -0.18); g.add(banco_);
  const lat = m(new THREE.BoxGeometry(0.24, 0.2, 0.5), cor, 0.3); lat.position.set(0, 0.56, -0.25); g.add(lat);
  const garfo = m(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), 0xb8bcc2, 0.3, { metalness: 0.6 }); garfo.position.set(0, 0.58, 0.55); garfo.rotation.x = -0.35; g.add(garfo);
  const guidao = m(new THREE.CylinderGeometry(0.018, 0.018, 0.66, 6), 0x18181a, 0.4); guidao.rotation.z = Math.PI / 2; guidao.position.set(0, 0.96, 0.44); g.add(guidao);
  const farol = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xfff4d0, emissive: 0xfff0c0, emissiveIntensity: 2.2 })); farol.rotation.x = Math.PI / 2; farol.position.set(0, 0.86, 0.6); g.add(farol);
  const bx = m(new THREE.BoxGeometry(0.46, 0.42, 0.42), bau, 0.55); bx.position.set(0, 1.0, -0.55); g.add(bx);
  const tampa = m(new THREE.BoxGeometry(0.48, 0.04, 0.44), 0x2a2c30, 0.5); tampa.position.set(0, 1.22, -0.55); g.add(tampa);
  const esc = m(new THREE.CylinderGeometry(0.04, 0.05, 0.5, 8), 0x8a8e94, 0.3, { metalness: 0.7 }); esc.rotation.x = Math.PI / 2 - 0.15; esc.position.set(0.16, 0.32, -0.45); g.add(esc);
  const grips = [new THREE.Vector3(0.3, 0.97, 0.44), new THREE.Vector3(-0.3, 0.97, 0.44)];
  return { g, grips, update(t, vel = 1) { rodas.forEach((r) => (r.rotation.x = t * vel * 9)); } };
}
// piloto sentado na moto (root dentro do grupo da moto); chame depois do LP.ator
export function pilotar(LP, p, mt) {
  mt.g.updateMatrixWorld(true);
  [0, 1].forEach((i) => LP.alcancar(p, i, mt.g.localToWorld(mt.grips[i === 0 ? 1 : 0].clone()), 1, { polo: new THREE.Vector3(i ? 1 : -1, -0.5, -0.4) }));
}
/* ---------- banco de praça ---------- */
export function banco(LP) {
  const g = new THREE.Group();
  [[1.5, 0.06, 0.42, 0, 0.46, 0], [1.5, 0.4, 0.05, 0, 0.75, -0.2], [0.06, 0.46, 0.4, -0.7, 0.23, 0], [0.06, 0.46, 0.4, 0.7, 0.23, 0]].forEach(([w, h, d, x, y, z]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), LP.mat(x ? 0x2a2c30 : 0x6a4a34, 0.7)); b.position.set(x, y, z); g.add(b); });
  return g;
}
/* ---------- espelho de parede (moldura + vidro claro) ---------- */
export function espelho(LP, { w = 0.9, h = 1.3 } = {}) {
  const g = new THREE.Group();
  [[w + 0.1, 0.05, 0, h / 2], [w + 0.1, 0.05, 0, -h / 2], [0.05, h, -w / 2, 0], [0.05, h, w / 2, 0]].forEach(([a, b, x, y]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(a, b, 0.05), LP.mat(0xc8b088, 0.35, { metalness: 0.4 })); f.position.set(x, y, 0); g.add(f); });
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.2, depthWrite: false })); g.add(vidro);
  return g;
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
/* ---------- câmera: põe `alvo` no ponto (xtela, ytela) da tela, vendo de `pos` ---------- */
const _m = new THREE.Vector3(), _dr = new THREE.Vector3(), _rt = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
export function mira(cam, pos, alvo, ytela = 760, xtela = 540) {
  cam.position.copy(pos); const d = pos.distanceTo(alvo), th = Math.tan((cam.fov * Math.PI) / 360) * d;
  _dr.copy(alvo).sub(pos).normalize(); _rt.crossVectors(_dr, _up).normalize();
  _m.copy(alvo); _m.y -= ((960 - ytela) / 960) * th; _m.addScaledVector(_rt, -((xtela - 540) / 540) * th * cam.aspect);
  cam.lookAt(_m);
}
export const ANOS = ANO;
