/**
 * sonho.js — peças do vídeo "E se você pudesse controlar seus sonhos?" (lote 6). Tudo determinístico (t + mulberry32).
 *   AZUL, LARANJA, await prepara()               fontes doc
 *   proj / txt / painel / tag / titulo / numero  textos 2D doc (de idade.js)
 *   brilho(cor, tam, tipo, op)                   sprite aditivo
 *   palcoDoc(T, canvas, {...}) -> st             palco R10 escuro de estúdio
 *   heroi(LP, {...}) -> p                        quem sonha (mesmo rosto em todo o vídeo)
 *   cama(LP, {...}) -> {g, topo, cabeceira}      cama (cabeceira em -z); deitado(LP, p, t, pos, o) põe a pessoa deitada nela
 *   nuvem(LP, {seed, cor, n}) -> Group           nuvem fofa facetada
 *   ilhaSonho(S, LP, CI, {zMax}) -> {g, update} céu onírico roxo-azul + nuvens + luzes flutuando (f01/f05/f08/f13)
 *   lua(cor, raio) -> Group                      lua com halo
 *   notas(S, {...}) -> {update(t)}               notas musicais luminosas subindo
 *   contarDedos(p, lado, n, k)                   estica n dedos (0–4) e dobra o resto
 *   dedoExtra(p, lado) -> Group                  sexto dedo (escala 0 → 1 quando "no sonho, ele muda")
 *   embaralha(s, k, seed)                        texto que embaralha (k 0 → igual, 1 → todo trocado)
 *   fantasma(p, cor, op)                         deixa a pessoa translúcida e brilhante (o "eu do sonho")
 *   cerebro(S, {...}) -> {group, update}         cérebro de pontos com casca fresnel (de animais-inteligentes/mente.js)
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


/* ---------- personagens ---------- */
export function heroi(LP, { roupa = "pijama", camisa = 0x6f8fb8, seed = 7, ...o } = {}) {
  return LP.pessoa({ seed, roupa, camisa, jaqueta: camisa, calca: camisa, pele: 0xd09a74, cabelo: 0x2a1a10, barba: false, iris: 0x3a5a7a, cabeloTipo: "cacheado", ...o });
}
// deixa a pessoa translúcida e brilhante (clone de sonho)
export function fantasma(p, cor = 0x8fc8ff, op = 0.45) {
  p.root.traverse((o) => { if (!o.isMesh) return; const m = o.material.clone(); m.transparent = true; m.opacity = op; m.depthWrite = false;
    if (m.emissive) { m.emissive.set(cor); m.emissiveIntensity = 0.9; } m.color && m.color.lerp(new THREE.Color(cor), 0.6); o.material = m; o.castShadow = false; });
}

/* ---------- cama ---------- */
export function cama(LP, { len = 2.1, larg = 1.05, alt = 0.5, lencol = 0xe8e4f0, coberta = 0x4a5a9a, madeira = 0x5a4030, brilha = 0 } = {}) {
  const g = new THREE.Group(), cx = (w, h, d, c, x, y, z, r = 0.8, ex = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), LP.mat(c, r, ex)); m.position.set(x, y, z); g.add(m); return m; };
  cx(larg + 0.08, alt - 0.18, len + 0.06, madeira, 0, (alt - 0.18) / 2, 0, 0.6);
  cx(larg, 0.18, len, lencol, 0, alt - 0.09, 0, 0.9);
  const cab = cx(larg + 0.1, 0.7, 0.08, madeira, 0, alt + 0.1, -len / 2 - 0.04, 0.6);
  const trav = new THREE.Mesh(LP.facetado(2, (v) => { v.y *= 0.35; v.z *= 0.6; }, 3, 0.04), LP.mat(0xf6f2fa, 0.95)); trav.scale.set(0.36, 0.36, 0.36); trav.position.set(0, alt + 0.06, -len / 2 + 0.28); g.add(trav);
  const cob = cx(larg + 0.04, 0.06, len * 0.62, coberta, 0, alt + 0.02, len * 0.18, 0.95, brilha ? { emissive: coberta, emissiveIntensity: brilha } : {});
  return { g, topo: alt, cabeceira: cab, coberta: cob, travesseiro: trav, len };
}
// pessoa deitada de barriga para cima; pos = pés (cabeça vai para -z, ~1,6 m); o.ergue 0–1 levanta a cabeça do travesseiro
export function deitado(LP, p, t, pos, o = {}) {
  LP.ator(p, t, { pose: "deitado", ...o });
  if (o.ergue) { p.coluna.rotation.x += 0.28 * o.ergue; p.pescoco.rotation.x += 0.25 * o.ergue; p.cab.rotation.x += 0.2 * o.ergue; }   // cabeça erguida no travesseiro
  p.root.position.set(...pos); p.root.rotation.set(-Math.PI / 2, 0, 0); p.root.updateMatrixWorld(true);
}

/* ---------- céu de sonho ---------- */
export function nuvem(LP, { seed = 1, cor = 0xf2e8ff, n = 6, emis = 0.15 } = {}) {
  const g = new THREE.Group(), r = mulberry32(seed), m = LP.mat(cor, 1, { emissive: cor, emissiveIntensity: emis });
  for (let i = 0; i < n; i++) { const b = new THREE.Mesh(LP.facetado(1, () => {}, seed * 7 + i, 0.18), m); const s = 0.5 + r() * 0.6; b.scale.set(s, s * 0.75, s);
    b.position.set((i - (n - 1) / 2) * 0.55 + (r() - 0.5) * 0.3, r() * 0.3 + Math.sin((i / (n - 1)) * Math.PI) * 0.25, (r() - 0.5) * 0.5); g.add(b); }
  return g;
}
export function lua(cor = 0xffe8d0, raio = 1) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(raio, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(1.6), fog: false }));
  g.add(m); const h = brilho(cor, raio * 5, "suave", 0.55); g.add(h); return g;
}
export function ilhaSonho(S, LP, CI, { topo = 0x120a3a, horizonte = 0x7a4aa8, estrelas = 500, nN = 9, seed = 4, orbes = 40, zMax = 99 } = {}) {
  CI.ceu(S, { topo, horizonte, estrelas, seed });
  const g = new THREE.Group(); S.add(g); const r = mulberry32(seed), ns = [];
  for (let i = 0; i < nN; i++) { const a = (i / nN) * 6.283 + r() * 0.5, d = 5 + r() * 9; const c = nuvem(LP, { seed: seed + i, cor: [0xe8d8ff, 0xffd8f0, 0xcfe0ff][i % 3], n: 5 + (i % 3) });
    c.position.set(Math.cos(a) * d, -1.2 + r() * 2.2, Math.min(zMax, Math.sin(a) * d - 3)); c.scale.setScalar(0.9 + r() * 1.4); g.add(c); ns.push([c, r() * 6, c.position.y]); }
  // orbes de luz (sprites aditivos) flutuando
  const ob = []; for (let i = 0; i < orbes; i++) { const s = brilho([0xb08aff, 0x7cc8ff, 0xff9ad8, 0xfff0c0][i % 4], 0.08 + r() * 0.18, "suave", 0.9);
    s.position.set((r() - 0.5) * 8, -0.5 + r() * 4, -1.5 - r() * 6); g.add(s); ob.push([s, r() * 6, s.position.y]); }
  return { g, nuvens: ns, update(t) { ns.forEach(([c, f, y]) => { c.position.y = y + 0.12 * Math.sin(t * 0.4 + f); c.rotation.y = 0.05 * Math.sin(t * 0.2 + f); });
    ob.forEach(([s, f, y]) => { s.position.y = y + 0.25 * Math.sin(t * 0.6 + f); s.material.opacity = 0.55 + 0.4 * Math.sin(t * 1.3 + f * 2); }); } };
}

/* ---------- notas musicais ---------- */
const _nt = {};
function notaTex(ch) {
  if (_nt[ch]) return _nt[ch];
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  x.font = '700 104px "DejaVu Sans", sans-serif'; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = "#fff"; x.shadowColor = "#fff"; x.shadowBlur = 12; x.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (_nt[ch] = t);
}
export function notas(S, { n = 14, origem = [0, 1, 0], sobe = 1.6, largura = 0.6, seed = 5, cores = [0xffd27a, 0x9fd6ff, 0xff9ad8] } = {}) {
  const r = mulberry32(seed), g = new THREE.Group(); g.position.set(...origem); S.add(g); const P = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: notaTex(["♪", "♫", "♩", "♬"][i % 4]), color: new THREE.Color(cores[i % cores.length]).multiplyScalar(1.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    g.add(s); P.push([r(), (r() - 0.5) * largura, (r() - 0.5) * largura * 0.6, 0.6 + r() * 0.7, r() * 6]); }
  return { g, update(t, k = 1) { g.children.forEach((s, i) => { const [f0, x, z, v, ph] = P[i], f = (t * 0.3 * v + f0) % 1;
    s.position.set(x * (0.4 + f) + 0.12 * Math.sin(t * 2 + ph), f * sobe, z); const sc = 0.09 * (0.6 + 0.6 * Math.sin(Math.PI * f)); s.scale.set(sc, sc, 1); s.material.opacity = k * Math.sin(Math.PI * f); s.material.rotation = 0.3 * Math.sin(t * 2 + ph); }); } };
}

/* ---------- mãos ---------- */
// estica n dedos (do indicador ao mínimo) e dobra os outros; k mistura
export function contarDedos(p, lado, n, k = 1) {
  const b = p.bracos[lado]; b._fix = true;
  b.dedos.forEach((d, j) => { const alvo = j < n ? 0.02 : 1.5, a2 = j < n ? 0.04 : 1.7; d.rotation.x = lerp(d.rotation.x, alvo, k); d.rotation.z = lerp(d.rotation.z, (j - 1.5) * (j < n ? 0.12 : 0.04), k);
    if (d.userData.f2) d.userData.f2.rotation.x = lerp(d.userData.f2.rotation.x, a2, k); });
}
export function dedoExtra(p, lado) {
  const b = p.bracos[lado], d = b.dedos[3], c = d.clone(true); c.position.x += (d.position.x - b.dedos[2].position.x); c.rotation.z = d.rotation.z + 0.12 * b.s;
  c.scale.setScalar(0.001); b.pulso.add(c); return c;
}
const GLIFOS = "ΛΞΣ#%&@¿?ЖЯ₪∆◊※╳▒";
export function embaralha(s, k, seed = 1) {
  const r = mulberry32(seed); let o = "";
  for (const ch of s) { const lim = r(), g = GLIFOS[Math.floor(r() * GLIFOS.length)]; o += ch !== " " && k > lim ? g : ch; }
  return o;
}

/* ---------- cérebro de pontos (copiado de animais-inteligentes/mente.js) ---------- */
const FRES_V = `varying vec3 vN; varying vec3 vV;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const FRES_F = `uniform vec3 cor; uniform float op; varying vec3 vN; varying vec3 vV;
void main(){ float r = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2); gl_FragColor = vec4(cor * (0.08 + r * 1.2) * op, 1.0); }`;
export function cascaMat(cor = 0x7cc8ff, op = 0.6) {
  return new THREE.ShaderMaterial({ uniforms: { cor: { value: new THREE.Color(cor) }, op: { value: op } }, vertexShader: FRES_V, fragmentShader: FRES_F, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
}
function giroGeo(seed, amp = 0.035, seg = [48, 32]) {
  const g = new THREE.SphereGeometry(1, seg[0], seg[1]), p = g.attributes.position, v = new THREE.Vector3(), r = mulberry32(seed), f = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const w = Math.sin(v.x * 17 + f[0]) * Math.sin(v.y * 15 + f[1]) + Math.sin(v.z * 19 + v.x * 7 + f[2]) * 0.6; v.multiplyScalar(1 + amp * w); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
const FORMA = { cortex: { c: [0, 0.08, 0], r: [0.62, 0.46, 0.5] }, cerebelo: { c: [-0.42, -0.34, 0], r: [0.24, 0.15, 0.32] }, tronco: { c: [-0.12, -0.45, 0], r: [0.08, 0.2, 0.08] } };
export function cerebro(S, { n = 1400, seed = 3, tam = 0.06, cor = 0x7cc8ff, casca = 0x7cc8ff } = {}) {
  const r = mulberry32(seed), group = new THREE.Group(); S.add(group); const pos = [], ord = [];
  for (const nome of ["cortex", "cerebelo"]) { const f = FORMA[nome], m = nome === "cortex" ? n : n * 0.3;
    for (let i = 0; i < m; i++) { let x, y, z, d; do { x = r() * 2 - 1; y = r() * 2 - 1; z = r() * 2 - 1; d = x * x + y * y + z * z; } while (d > 1 || (nome === "cortex" && (d < 0.45 || Math.abs(z) < 0.06)));
      pos.push(f.c[0] + x * f.r[0], f.c[1] + y * f.r[1], f.c[2] + z * f.r[2]); ord.push(r()); } }
  const N = pos.length / 3, geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const col = new Float32Array(N * 3); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: tam, map: glowTex(), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pts.frustumCulled = false; group.add(pts);
  const cascas = ["cortex", "cerebelo", "tronco"].map((nome) => { const f = FORMA[nome], m = new THREE.Mesh(giroGeo(seed + nome.length, nome === "cortex" ? 0.035 : 0.05, nome === "tronco" ? [16, 10] : [48, 28]), cascaMat(casca, 0.55)); m.scale.set(...f.r.map((v) => v * 1.04)); m.position.set(...f.c); group.add(m); return m; });
  const ph = ord.map((o) => o * 37.1), cA = new THREE.Color(), cB = new THREE.Color();
  function update(t, { fill = 1, ativo = 0.3, corB = 0xff8a4c, mix = 0, casca: co = 1 } = {}) {
    cA.set(cor); cB.set(corB); cA.lerp(cB, mix);
    for (let i = 0; i < N; i++) { const on = clamp((fill * 1.08 - ord[i]) / 0.08, 0, 1), fl = 1 - ativo + ativo * (0.5 + 0.5 * Math.sin(t * (4 + 8 * ativo) + ph[i])), v = on * fl;
      col[i * 3] = cA.r * v; col[i * 3 + 1] = cA.g * v; col[i * 3 + 2] = cA.b * v; }
    geo.attributes.color.needsUpdate = true; cascas.forEach((m) => (m.material.uniforms.op.value = 0.55 * co));
  }
  update(0); return { group, pts, cascas, update };
}
