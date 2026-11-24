/**
 * deserto.js — peças do vídeo "E se todos os desertos virassem florestas?" (lote 4). Tudo determinístico.
 *
 *   AZUL, LARANJA, VERDE, await prepara()     fontes doc (Inter / JetBrains Mono)
 *   proj(v3, cam) -> [x, y, z]   vis(st)      projeção na tela 1080×1920; visibilidade fora do dip
 *   txt / painel / etq / titulo               textos 2D doc (etq fica em y 640–1000, x ≤ 940)
 *   glowTex / brilho(cor, tam, tipo, op)      sprite aditivo ("suave" | "raios")
 *   altura(x, z, amp)                         relevo de dunas (mesma fórmula do chão e das árvores)
 *   dunas(S, mk, {tam, seg, amp, areia, verde, seed}) -> {m, h(x,z), pintar(f)}   chão com cor por vértice;
 *                                             pintar(f(x,z) -> 0..1) mistura areia → verde
 *   floresta(S, mk, {n, area, seed, h, tipo, alt, cor, detalhe}) -> {pos, crescer(f), cor(f)}  árvores em InstancedMesh;
 *                                             crescer(f(x,z,i) -> escala 0..1)
 *   terraVerde(TERRA) -> E                    Terra NASA com desertos detectados no shader: E.u.realce (laranja),
 *                                             E.u.verde (vira floresta), E.u.calor (brilho quente), E.u.faixa (Muralha Verde 0..1)
 *   poeiraArco(E, {n, de, ate, seed}) -> {pts, update(t, cabeca, alfa)}  rio de poeira do Saara à Amazônia (Points)
 *   viajante(LP) -> p                         pessoa R11 de f01/f13: lenço na cabeça, linho, cachecol
 *   camelo(LP), feneco(LP), escorpiao(LP)     bichos do deserto no acabamento R11
 *   guardaAbas(p)                             devolve a função que repõe abas/mechas (chame depois de p.reset())
 */
import * as THREE from "../three.module.js";
import { mulberry32, clamp, lerp } from "../kit.js";

export const VERDE = "#8fe08a";
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
export function placa(txt, { w = 1.6, h = 0.5, fundo = "#f3efe6", cor = "#1b1f2a", tam = 92, borda = null, px = 512, emis = 0 } = {}) {
  const c = document.createElement("canvas"); c.width = px; c.height = Math.round(px * h / w);
  const g = c.getContext("2d"); g.fillStyle = fundo; g.fillRect(0, 0, c.width, c.height);
  if (borda) { g.strokeStyle = borda; g.lineWidth = c.height * 0.06; g.strokeRect(c.height * 0.05, c.height * 0.05, c.width - c.height * 0.1, c.height - c.height * 0.1); }
  g.fillStyle = cor; g.textAlign = "center"; g.textBaseline = "middle";
  const linhas = txt.split("\n"), lh = c.height / (linhas.length + 0.6);
  let t = tam; g.font = `800 ${t}px "Inter", sans-serif`;
  while (linhas.some((l) => g.measureText(l).width > c.width * 0.86) && t > 10) { t -= 2; g.font = `800 ${t}px "Inter", sans-serif`; }
  linhas.forEach((l, i) => g.fillText(l, c.width / 2, c.height / 2 + (i - (linhas.length - 1) / 2) * Math.min(lh, t * 1.1)));
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.8, emissive: emis ? 0xffffff : 0x000000, emissiveMap: emis ? tx : null, emissiveIntensity: emis }));
}

/* ---------- vulcão ---------- */
const hash3 = (x, y, z, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + s * 13.3) * 43758.5453; return v - Math.floor(v); };
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
export function altura(x, z, amp = 1) {
  const a = 0.17 * z + 0.9 * Math.sin(0.055 * x) + 0.3 * Math.sin(0.13 * x + 0.05 * z);
  const c = 1 - Math.abs(Math.sin(a));
  return amp * (1.5 * c * c + 0.55 * Math.sin(0.06 * z + 0.04 * x + 1.0) + 0.25 * Math.sin(0.21 * x - 0.11 * z));
}
export function dunas(S, mk, { tam = 120, seg = 72, amp = 1, areia = 0xd8a25e, verde = 0x356b2a, seed = 1, centro = [0, 0], plano = 0 } = {}) {
  const geo = new THREE.PlaneGeometry(tam, tam, seg, seg); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, n = p.count, H = new Float32Array(n);
  const h = (x, z) => altura(x, z, amp) * (plano ? clamp((Math.hypot(x, z) - plano) / (plano * 2), 0.15, 1) : 1);
  for (let i = 0; i < n; i++) { const x = p.getX(i) + centro[0], z = p.getZ(i) + centro[1]; const y = h(x, z); p.setXYZ(i, x, y, z); H[i] = y; }
  geo.computeVertexNormals();
  const cor = new Float32Array(n * 3); geo.setAttribute("color", new THREE.BufferAttribute(cor, 3));
  const A = new THREE.Color(areia), V = new THREE.Color(verde), nr = geo.attributes.normal, c = new THREE.Color();
  const m = new THREE.Mesh(geo, mk(0xffffff, 0.95, { vertexColors: true })); m.receiveShadow = true; S.add(m);
  function pintar(f = null) {
    for (let i = 0; i < n; i++) {
      const x = p.getX(i), z = p.getZ(i), r = hs(Math.round(x * 3), Math.round(z * 3)), ny = nr.getY(i);
      c.copy(A).multiplyScalar(0.82 + 0.22 * clamp(H[i] / (2 * amp + 1e-3), 0, 1) + 0.06 * r - 0.25 * (1 - ny));
      const g = f ? clamp(f(x, z, i)) : 0;
      if (g > 0) { const v = 0.75 + 0.45 * hs(Math.round(x * 1.3) + seed, Math.round(z * 1.3)); c.lerp(new THREE.Color(V.r * v, V.g * v, V.b * v), g); }
      cor[i * 3] = c.r; cor[i * 3 + 1] = c.g; cor[i * 3 + 2] = c.b;
    }
    geo.attributes.color.needsUpdate = true;
  }
  pintar(null);
  return { m, h, pintar };
}

/* ---------- árvores (InstancedMesh) ---------- */
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();
export function floresta(S, mk, { n = 200, area = [[-30, 30], [-60, -5]], seed = 3, h = () => 0, tipo = "copa", alt = [1.6, 3.2], cor = 0x2f6a2a, detalhe = 0, pontos = null, tronco = 0x5a4030 } = {}) {
  const r = mulberry32(seed), pos = [];
  for (let i = 0; i < n; i++) {
    const [x, z] = pontos ? pontos(i, r) : [lerp(area[0][0], area[0][1], r()), lerp(area[1][0], area[1][1], r())];
    pos.push({ x, z, y: h(x, z), a: lerp(alt[0], alt[1], r()), ry: r() * 6.283, v: r(), k: 0 });
  }
  const tg = new THREE.CylinderGeometry(0.05, 0.085, tipo === "acacia" ? 0.8 : 0.6, 5); tg.translate(0, tipo === "acacia" ? 0.4 : 0.3, 0);
  let cg;
  if (tipo === "acacia") { cg = new THREE.IcosahedronGeometry(1, detalhe); cg.scale(0.55, 0.14, 0.5); cg.translate(0, 0.86, 0); }
  else if (tipo === "muda") { cg = new THREE.IcosahedronGeometry(1, detalhe); cg.scale(0.22, 0.3, 0.22); cg.translate(0, 0.62, 0); }
  else { cg = new THREE.IcosahedronGeometry(1, detalhe); cg.scale(0.42, 0.46, 0.42); cg.translate(0, 0.78, 0);
    if (detalhe === 0) { const g2 = new THREE.IcosahedronGeometry(1, 0); g2.scale(0.3, 0.32, 0.3); g2.translate(0.12, 1.05, 0.05); cg = mergeGeo(cg, g2); } }
  const T = new THREE.InstancedMesh(tg, mk(tronco, 0.9), n), C = new THREE.InstancedMesh(cg, mk(0xffffff, 0.85, { flatShading: true }), n);
  T.castShadow = C.castShadow = true; T.receiveShadow = C.receiveShadow = true; T.frustumCulled = C.frustumCulled = false;
  const base = new THREE.Color(cor), cc = new THREE.Color();
  pos.forEach((q, i) => { cc.copy(base).multiplyScalar(0.78 + 0.4 * q.v); cc.offsetHSL((q.v - 0.5) * 0.04, 0, 0); C.setColorAt(i, cc); q.cor = cc.clone(); });
  S.add(T, C);
  function crescer(f) {
    pos.forEach((q, i) => {
      const k = Math.max(0, f(q.x, q.z, i, q)); q.k = k;
      _p.set(q.x, q.y - 0.05, q.z); _q.setFromEuler(_e.set(0, q.ry, 0)); const s = q.a * k;
      _s.set(s, s, s); if (k <= 0.001) _s.set(0, 0, 0);
      _m4.compose(_p, _q, _s); T.setMatrixAt(i, _m4); C.setMatrixAt(i, _m4);
    });
    T.instanceMatrix.needsUpdate = true; C.instanceMatrix.needsUpdate = true;
  }
  function pintar(f) { pos.forEach((q, i) => { C.setColorAt(i, f(q, i, cc.copy(q.cor))); }); C.instanceColor.needsUpdate = true; }
  crescer(() => 1);
  return { pos, T, C, crescer, pintar };
}
function mergeGeo(a, b) {
  const A = a.toNonIndexed ? (a.index ? a.toNonIndexed() : a) : a, B = b.index ? b.toNonIndexed() : b;
  const pa = A.attributes.position.array, pb = B.attributes.position.array, out = new Float32Array(pa.length + pb.length);
  out.set(pa, 0); out.set(pb, pa.length); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(out, 3)); g.computeVertexNormals(); return g;
}

/* ---------- Terra com desertos que viram floresta ---------- */
const NOISE = `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
const INS = `vec3 base = mix(d, fundo, w * seco);
  float lum = dot(d, vec3(0.3, 0.59, 0.11));
  float la = (vUv.y - 0.5) * 180.0, lo = (vUv.x - 0.5) * 360.0;
  float des = smoothstep(0.06, 0.15, d.r - d.b) * smoothstep(0.26, 0.42, lum) * (1.0 - smoothstep(0.1, 0.5, w)) * smoothstep(-0.03, 0.03, d.r - d.g);
  des *= 1.0 - smoothstep(52.0, 60.0, abs(la));
  float nz = vnoise(vUv * vec2(90.0, 45.0)) * 0.6 + vnoise(vUv * vec2(320.0, 160.0)) * 0.4;
  base = mix(base, base * vec3(1.25, 0.6, 0.32) + vec3(0.16, 0.05, 0.0), realce * des);
  float gk = smoothstep(nz - 0.08, nz + 0.08, verde * 1.25 - 0.12) * des;
  base = mix(base, mix(vec3(0.05, 0.15, 0.04), vec3(0.14, 0.26, 0.07), nz), gk);
  float cen = 15.0 + 1.6 * sin(lo * 0.09);
  float fx = (1.0 - smoothstep(1.4, 2.4, abs(la - cen))) * smoothstep(-18.0, -16.5, lo) * (1.0 - smoothstep(-17.0 + 60.0 * faixa - 1.5, -17.0 + 60.0 * faixa, lo)) * (1.0 - smoothstep(0.2, 0.6, w));
  base = mix(base, mix(vec3(0.08, 0.30, 0.06), vec3(0.20, 0.44, 0.10), nz), fx * 0.95);`;
export async function terraVerde(TERRA, o = {}) {
  const E = await TERRA.createTerra(o), u = E.u;
  Object.assign(u, { realce: { value: 0 }, verde: { value: 0 }, calor: { value: 0 }, faixa: { value: 0 }, tt: { value: 0 } });
  const m = E.terra.material; m.uniforms = u;
  m.fragmentShader = m.fragmentShader.replace("uniform vec3 sol;", "uniform vec3 sol; uniform float realce, verde, calor, faixa, tt;\n" + NOISE)
    .replace("vec3 base = mix(d, fundo, w * seco);", INS)
    .replace("gl_FragColor = vec4(col, 1.0);", "col += vec3(1.0, 0.3, 0.06) * calor * max(gk, des * 0.6) * (0.28 + 0.12 * sin(tt * 3.0 + nz * 9.0)) * smoothstep(-0.1, 0.3, nl);\n  gl_FragColor = vec4(col, 1.0);");
  m.needsUpdate = true;
  return E;
}

/* ---------- rio de poeira (Saara → Amazônia) ---------- */
export function poeiraArco(E, { n = 2600, de = [8, 19], ate = [-62, -4], seed = 5, cor = 0xffc07a, tam = 0.018, larg = 0.05 } = {}) {
  const P0 = E.ponto(de[0], de[1]).normalize(), P1 = E.ponto(ate[0], ate[1]).normalize();
  const eixo = new THREE.Vector3().crossVectors(P0, P1).normalize(), ang = P0.angleTo(P1);
  const r = mulberry32(seed), D = [];
  for (let i = 0; i < n; i++) D.push([r(), 0.04 + r() * 0.06, (r() - 0.5) * 2, (r() - 0.5) * 2, r()]);
  const geo = new THREE.BufferGeometry(), arr = new Float32Array(n * 3); geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const mat = new THREE.PointsMaterial({ map: glowTex("suave"), color: cor, size: tam, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; E.earth.add(pts);
  const v = new THREE.Vector3(), lat = new THREE.Vector3(), q = new THREE.Quaternion();
  function update(t, cabeca = 1, alfa = 1) {
    mat.opacity = alfa;
    D.forEach((d, i) => {
      const s = (d[0] + t * d[1]) % 1;
      if (s > cabeca) { arr[i * 3] = arr[i * 3 + 1] = arr[i * 3 + 2] = 0; return; }
      q.setFromAxisAngle(eixo, ang * s); v.copy(P0).applyQuaternion(q);
      lat.crossVectors(v, eixo).normalize();
      const w = larg * (0.35 + Math.sin(Math.PI * s)) * (1 + 0.3 * Math.sin(t * 0.7 + i));
      v.addScaledVector(lat, d[2] * w).addScaledVector(eixo, d[3] * w * 0.6).normalize().multiplyScalar(E.raio * (1.012 + 0.05 * Math.sin(Math.PI * s) * (0.6 + 0.4 * d[4])));
      arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z;
    });
    geo.attributes.position.needsUpdate = true;
  }
  update(0, 0, 0);
  return { pts, update, P0, P1 };
}

/* ---------- R11: viajante e bichos do deserto ---------- */
export function viajante(LP, { seed = 21 } = {}) {
  const p = LP.pessoa({ seed, pele: 0x9a6446, cabelo: 0x1a1210, jaqueta: 0xcfc2a4, camisa: 0xeee4cf, calca: 0x7d6e58, barba: 0x2a1a10, iris: 0x3a2414, cachecol: 0xc0662e });
  const lm = LP.matTecido(0xe9dfc8, 0.95);
  const cap = LP.contorno(new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 8, 0, Math.PI * 2, 0, 1.18), lm), 0.02);
  cap.scale.set(0.92, 0.96, 1.0); cap.position.set(0, 0.006, -0.012); cap.rotation.x = -0.32; p.cab.add(cap);
  const faixa = LP.contorno(new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.018, 5, 18), lm), 0.04); faixa.scale.set(0.93, 1, 1.04); faixa.rotation.x = Math.PI / 2 - 0.32; faixa.position.set(0, 0.07, -0.005); p.cab.add(faixa);
  const cauda = LP.contorno(new THREE.Mesh(LP.facetado(1, (v) => { v.y *= 2.2; v.z *= 0.35; }, seed + 5, 0.15), lm), 0.03); cauda.scale.setScalar(0.07); cauda.position.set(0.03, -0.07, -0.14); cauda.rotation.set(0.25, 0, 0.12); p.cab.add(cauda);
  p.lenco = { cap, faixa, cauda };
  return p;
}
export function camelo(LP, { seed = 51, cor = 0xc49660 } = {}) {
  const R = new THREE.Group(), m = LP.mat(cor, 0.9), m2 = LP.mat(new THREE.Color(cor).multiplyScalar(0.75).getHex(), 0.9), F = LP.facetado, C = LP.contorno;
  const corpo = C(new THREE.Mesh(F(1, (v) => { v.z *= 1.5; v.y *= 0.75; }, seed, 0.1), m), 0.02); corpo.scale.setScalar(0.55); corpo.position.y = 1.55; R.add(corpo);
  const corc = C(new THREE.Mesh(F(1, (v) => { v.y = Math.max(-0.3, v.y); }, seed + 1, 0.12), m), 0.03); corc.scale.set(0.34, 0.42, 0.42); corc.position.set(0, 1.95, -0.05); R.add(corc);
  const pesc = new THREE.Group(); pesc.position.set(0, 1.7, 0.7); R.add(pesc);
  const p1 = C(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.8, 6), m), 0.04); p1.position.set(0, 0.25, 0.25); p1.rotation.x = 1.0; pesc.add(p1);
  const cab = new THREE.Group(); cab.position.set(0, 0.62, 0.58); pesc.add(cab);
  const p2 = C(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.5, 6), m), 0.04); p2.position.set(0, -0.12, -0.08); p2.rotation.x = -0.35; cab.add(p2);
  const ca = C(new THREE.Mesh(F(1, (v) => { v.z *= 1.7; v.x *= 0.8; if (v.z > 0.5) v.y *= 0.75; }, seed + 2, 0.1), m), 0.04); ca.scale.setScalar(0.15); ca.position.set(0, 0.15, 0.12); cab.add(ca);
  for (const s of [1, -1]) { const o = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), m2); o.position.set(s * 0.09, 0.28, 0.02); cab.add(o);
    const ol = new THREE.Mesh(new THREE.IcosahedronGeometry(0.022, 0), new THREE.MeshBasicMaterial({ color: 0x140a06 })); ol.position.set(s * 0.1, 0.2, 0.17); cab.add(ol); }
  const pernas = [[0.22, 0.45], [-0.22, 0.45], [0.22, -0.5], [-0.22, -0.5]].map(([x, z], i) => {
    const q = new THREE.Group(); q.position.set(x, 1.35, z); R.add(q);
    const a = C(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.7, 5), m), 0.05); a.position.y = -0.35; q.add(a);
    const j = new THREE.Group(); j.position.y = -0.7; q.add(j);
    const b = C(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.62, 5), m), 0.05); b.position.y = -0.31; j.add(b);
    const pe = new THREE.Mesh(F(0, () => {}, seed + 10 + i, 0.1), m2); pe.scale.set(0.09, 0.04, 0.11); pe.position.y = -0.63; j.add(pe);
    return { q, j };
  });
  const rabo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.4, 4), m2); rabo.position.set(0, 1.45, -0.85); rabo.rotation.x = -0.3; R.add(rabo);
  function andar(t, vel = 1) { pernas.forEach((l, i) => { const a = t * vel * 5 + (i === 0 || i === 2 ? 0 : Math.PI); l.q.rotation.x = 0.35 * Math.sin(a); l.j.rotation.x = 0.3 * Math.max(0, Math.cos(a)); });
    pesc.rotation.x = 0.06 * Math.sin(t * vel * 10); R.children[0].position.y = 1.55 + 0.02 * Math.sin(t * vel * 10); }
  return { root: R, pesc, cab, pernas, andar };
}
export function feneco(LP, { seed = 61, cor = 0xe0b47a, ventre = 0xf4e6cc } = {}) {
  const R = new THREE.Group(), m = LP.mat(cor, 0.9), mv = LP.mat(ventre, 0.9), F = LP.facetado, C = LP.contorno;
  const corpo = C(new THREE.Mesh(F(1, (v) => { v.z *= 1.45; v.y *= 0.85; }, seed, 0.1), m), 0.03); corpo.scale.setScalar(0.12); corpo.position.set(0, 0.17, 0); R.add(corpo);
  const cab = new THREE.Group(); cab.position.set(0, 0.29, 0.15); R.add(cab);
  const ca = C(new THREE.Mesh(F(1, (v) => { v.x *= 1.05; if (v.z > 0.2) { v.x *= 1 - (v.z - 0.2) * 0.6; v.y *= 1 - (v.z - 0.2) * 0.4; v.z += (v.z - 0.2) * 0.9; } }, seed + 1, 0.08), m), 0.03); ca.scale.setScalar(0.085); cab.add(ca);
  const foc = new THREE.Mesh(F(1, (v) => { v.z *= 0.8; }, seed + 2, 0.1), mv); foc.scale.set(0.045, 0.035, 0.05); foc.position.set(0, -0.028, 0.08); cab.add(foc);
  const nar = new THREE.Mesh(new THREE.IcosahedronGeometry(0.014, 0), new THREE.MeshBasicMaterial({ color: 0x140a06 })); nar.position.set(0, -0.012, 0.155); cab.add(nar);
  const orelhas = [1, -1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.05, 0.05, -0.01); cab.add(g);
    const o = C(new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.2, 4), m), 0.04); o.position.y = 0.09; o.scale.z = 0.35; g.add(o);
    const i = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.15, 4), LP.mat(0xe8a68a, 0.9)); i.position.set(0, 0.08, 0.02); i.scale.z = 0.3; g.add(i);
    g.rotation.z = -s * 0.42; return g; });
  const olhos = [1, -1].map((s) => { const o = LP.olhoDe(0.022, 0x2a1a0c, cor); o.g.position.set(s * 0.038, 0.012, 0.062); o.g.rotation.y = s * 0.3; o.abrir(0.75); cab.add(o.g); return o; });
  const pernas = [[0.05, 0.08], [-0.05, 0.08], [0.05, -0.09], [-0.05, -0.09]].map(([x, z]) => { const l = C(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.13, 5), m), 0.06); l.position.set(x, 0.065, z); R.add(l); return l; });
  const cauda = new THREE.Group(); cauda.position.set(0, 0.17, -0.15); R.add(cauda);
  const cm = C(new THREE.Mesh(F(1, (v) => { v.z *= 2.4; }, seed + 3, 0.12), m), 0.03); cm.scale.setScalar(0.05); cm.position.z = -0.09; cm.rotation.x = 0.5; cauda.add(cm);
  const ponta = new THREE.Mesh(F(1, () => {}, seed + 4, 0.1), LP.mat(0x3a2414, 0.9)); ponta.scale.setScalar(0.035); ponta.position.set(0, -0.06, -0.2); cauda.add(ponta);
  function set(t, { triste = 0, olhar = [0, 0] } = {}) {
    orelhas.forEach((g, i) => { const s = i ? -1 : 1; g.rotation.z = -s * lerp(0.42, 1.15, triste) + 0.05 * Math.sin(t * 2.3 + i); g.rotation.x = lerp(0, 0.5, triste); });
    olhos.forEach((o) => { o.abrir(lerp(0.75, 0.45, triste) * (((t * 0.7) % 3) < 0.08 ? 0.1 : 1)); o.olhar(olhar[0], olhar[1] - 0.25 * triste); });
    cab.rotation.x = lerp(0, 0.3, triste) + 0.03 * Math.sin(t * 1.1); cauda.rotation.y = 0.25 * Math.sin(t * 1.7) * (1 - triste);
    corpo.scale.y = 0.12 * (1 + 0.03 * Math.sin(t * 4));
  }
  set(0);
  return { root: R, cab, orelhas, olhos, cauda, set };
}
export function escorpiao(LP, { seed = 71, cor = 0x8a5a26 } = {}) {
  const R = new THREE.Group(), m = LP.mat(cor, 0.45), m2 = LP.mat(new THREE.Color(cor).multiplyScalar(0.7).getHex(), 0.5), F = LP.facetado, C = LP.contorno;
  const corpo = C(new THREE.Mesh(F(1, (v) => { v.z *= 1.8; v.y *= 0.4; }, seed, 0.08), m), 0.03); corpo.scale.setScalar(0.05); corpo.position.y = 0.03; R.add(corpo);
  for (let i = 0; i < 4; i++) for (const s of [1, -1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.003, 0.07, 3), m2); l.position.set(s * 0.05, 0.02, 0.03 - i * 0.025); l.rotation.set(0, 0, s * 1.1); l.rotation.y = s * (0.3 - i * 0.2); R.add(l); }
  const pincas = [1, -1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.03, 0.03, 0.08); R.add(g);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 4), m); b.rotation.x = Math.PI / 2; b.position.z = 0.03; b.rotation.z = s * 0.4; g.add(b);
    const pz = C(new THREE.Mesh(F(1, (v) => { v.z *= 1.6; v.y *= 0.5; }, seed + s, 0.1), m), 0.05); pz.scale.setScalar(0.018); pz.position.set(s * 0.012, 0, 0.07); g.add(pz); return g; });
  const cauda = []; let pai = R;
  for (let j = 0; j < 6; j++) { const g = new THREE.Group(); g.position.set(0, j === 0 ? 0.03 : 0, j === 0 ? -0.09 : -0.028); pai.add(g);
    const sg = C(new THREE.Mesh(F(0, () => {}, seed + 10 + j, 0.1), j === 5 ? m2 : m), 0.05); sg.scale.set(0.013, 0.012, 0.017); sg.position.z = -0.014; g.add(sg); cauda.push(g); pai = g; }
  const fer = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.025, 4), m2); fer.position.set(0, -0.01, -0.03); fer.rotation.x = 2.2; pai.add(fer);
  function update(t, alerta = 0) { cauda.forEach((g, j) => (g.rotation.x = -(0.5 + 0.15 * alerta) - 0.05 * Math.sin(t * 2 + j))); pincas.forEach((g, i) => (g.rotation.y = (i ? 1 : -1) * (0.2 + 0.15 * Math.sin(t * 3 + i)))); }
  update(0);
  return { root: R, cauda, pincas, update };
}
export function raios2D(ctx, x, y, a, { n = 14, seed = 9, cor = "255,222,170", r0 = 40, r1 = 1500, larg = 0.06, giro = 0 } = {}) {
  if (a <= 0.003) return;
  const r = mulberry32(seed); ctx.save(); ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < n; i++) {
    const an = r() * 6.283 + giro, w = larg * (0.4 + r()), L = r1 * (0.5 + r() * 0.5), al = a * (0.12 + r() * 0.18);
    const gr = ctx.createRadialGradient(x, y, r0, x, y, L); gr.addColorStop(0, `rgba(${cor},${al})`); gr.addColorStop(1, `rgba(${cor},0)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, L, an - w, an + w); ctx.closePath(); ctx.fill();
  }
  const h = ctx.createRadialGradient(x, y, 0, x, y, 420); h.addColorStop(0, `rgba(${cor},${0.55 * a})`); h.addColorStop(1, `rgba(${cor},0)`);
  ctx.fillStyle = h; ctx.fillRect(x - 420, y - 420, 840, 840); ctx.restore();
}
