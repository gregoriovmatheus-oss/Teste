/**
 * quatro.js — peças do vídeo "E se os humanos tivessem quatro braços?" (lote 5). Tudo determinístico.
 *
 *   AZUL, LARANJA, await prepara()            fontes doc (Inter / JetBrains Mono)
 *   proj / vis / txt / painel / etq / titulo  textos 2D doc (copiados de deserto.js; etq fica em y 640–1000, x ≤ 940)
 *   glowTex / brilho(cor, tam, tipo, op)      sprite aditivo
 *   heroi(LP, {roupa}) -> p                   protagonista R11 com 4 braços (mesmo rosto em todas as cenas)
 *   baixo(p, LP, [xE,yE,zE], [xD,yD,zD], k)   leva as mãos de baixo (índices 2/3) a pontos locais do corpo (IK)
 *   espreguica(p, k)                          espreguiçar com 4 braços: de cima para o alto, de baixo para os lados
 *   palcoDoc(T, canvas, {...}) -> st          palco R10 escuro de estúdio (chão refletivo, névoa, bloom)
 *   guardaAbas(p)
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

/* ---------- chão de dunas ---------- */
const hs = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
// cristas correndo em x (perpendiculares à câmera que olha para -z): o horizonte fica em camadas

/* ---------- protagonista ---------- */
export function heroi(LP, { roupa = "camiseta", seed = 7, camisa = 0x3e6a8a, jaqueta } = {}) {
  return LP.pessoa({ seed, bracos: 4, roupa, camisa, jaqueta, pele: 0xc08a68, cabelo: 0x2a1a10, barba: 0x2a1a10, iris: 0x4a2c14, cabeloTipo: "topete" });
}
const _a = new THREE.Vector3();
// mãos de baixo num ponto local da pessoa (x à direita do personagem = +x local)
export function baixo(p, LP, e, d, k = 1, { gira = 0 } = {}) {
  p.root.updateMatrixWorld(true);
  if (e) LP.alcancar(p, 2, p.root.localToWorld(_a.set(...e)), k, { polo: new THREE.Vector3(1, -0.4, -0.6), maoGira: gira });
  if (d) LP.alcancar(p, 3, p.root.localToWorld(_a.set(...d)), k, { polo: new THREE.Vector3(-1, -0.4, -0.6), maoGira: gira });
}
// espreguiçar: braços de cima ao alto, de baixo abertos para os lados (leitura clara dos 4)
export function espreguica(p, k, { baixoK = k } = {}) {
  const s = (x) => x * x * (3 - 2 * x), e = s(clamp(k, 0, 1)), eb = s(clamp(baixoK, 0, 1));
  p.coluna.rotation.x += -0.14 * e; p.cab.rotation.x += -0.28 * e;
  p.bracos.forEach((b, i) => {
    if (i < 2) { b.om.rotation.x = lerp(b.om.rotation.x, -2.85, e); b.om.rotation.z = lerp(b.om.rotation.z, b.s * 0.38, e); b.cot.rotation.x = lerp(b.cot.rotation.x, -0.3, e); }
    else { b.om.rotation.x = lerp(b.om.rotation.x, -0.95, eb); b.om.rotation.z = lerp(b.om.rotation.z, b.s * 0.95, eb); b.cot.rotation.x = lerp(b.cot.rotation.x, -0.25, eb); }
    b.dedos.forEach((d) => (d.rotation.x = lerp(d.rotation.x, 0, e)));
  });
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
// anima a cadeia de segmentos de um braço do polvo (ondas), guardando a pose base na 1ª chamada
export function ondaPolvo(o, t, { amp = 1 } = {}) {
  o.bracos.forEach((g0, k) => { let seg = g0.children.find((c) => c.isGroup), j = 0;
    while (seg) { seg.userData.b ??= [seg.rotation.x, seg.rotation.y];
      seg.rotation.x = seg.userData.b[0] + (j ? amp * 0.16 * Math.sin(t * 2.1 - j * 0.7 + k * 1.3) : 0);
      seg.rotation.y = seg.userData.b[1] + amp * 0.1 * Math.sin(t * 1.6 - j * 0.5 + k * 2.1);
      seg = seg.children.find((c) => c.isGroup); j++; } });
}
