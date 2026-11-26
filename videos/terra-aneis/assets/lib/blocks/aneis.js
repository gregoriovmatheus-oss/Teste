/**
 * aneis.js — peças do vídeo "E se a Terra tivesse anéis como Saturno?" (lote 5). Tudo determinístico.
 *
 *   AZUL, LARANJA, await prepara()            fontes doc (Inter / JetBrains Mono)
 *   proj(v3, cam)  vis(st)  txt  painel  etq  titulo  brilho  raios2D  numero   2D doc (etq fica em y 640–1000)
 *   anel({Re, r1, r2, op, br, amb, cor, sombraA}) -> {mesh, u, sync}   disco com shader físico: faixas + Cassini, sombra do planeta
 *        no anel (u.uL = direção do Sol), face acesa/escura, opacidade cresce de perfil. u.uRev 0..1 "desenha" o anel; u.uVis some
 *   sombraAnel(raio, A) -> Mesh               casca que escurece o planeta onde o anel faz sombra (mesmos uniforms do anel)
 *   ceuAnel(S, {lat, norte, ...}) -> {A, u, setLat, dirSol, ponto}   o anel no céu visto do chão (geometria real; 1 un = 100 km)
 *   dir(az, el, norte)  chao(S, LP, {...})    direção por azimute/elevação; campo com morros e capim
 *   campoRochas(S, {...}) -> {update(t, vel)}  pedras e gelo do anel (InstancedMesh)
 *   satelite(), foguete(), estacao(), saturno(raio), predioEscala(h)
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
  if (!document.getElementById("aneis-css")) {
    const s = document.createElement("style"); s.id = "aneis-css";
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

/* ---------- anel: shader físico (faixas, divisão de Cassini, sombra da Terra no anel, face acesa/escura, opacidade pela inclinação) ---------- */
const DENS = `
float dens(float x){
  if (x < 0.0 || x > 1.0) return 0.0;
  float b = 0.62 + 0.2 * sin(x * 57.0 + 0.4) + 0.12 * sin(x * 151.0 + 1.3) + 0.08 * sin(x * 311.0 + 2.1);
  b *= smoothstep(0.0, 0.05, x) * (1.0 - smoothstep(0.9, 1.0, x));
  b *= 1.0 - 0.92 * exp(-pow((x - 0.73) / 0.02, 2.0));
  b *= mix(0.45, 1.0, smoothstep(0.08, 0.3, x));
  return clamp(b, 0.0, 1.0);
}`;
function uAnel(o) {
  return { uC: { value: new THREE.Vector3() }, uN: { value: new THREE.Vector3(0, 1, 0) }, uL: { value: new THREE.Vector3(1, 0.3, 0.2).normalize() },
    uRe: { value: o.Re }, uR1: { value: o.r1 }, uR2: { value: o.r2 }, uOp: { value: o.op }, uBr: { value: o.br }, uAmb: { value: o.amb },
    uCor: { value: new THREE.Color(o.cor) }, uSomb: { value: o.sombraA }, uVis: { value: 1 }, uRev: { value: 1 } };
}
const VERT_W = "varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }";
function matAnel(u) {
  return new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: VERT_W,
    fragmentShader: `uniform vec3 uC, uN, uL, uCor; uniform float uRe, uR1, uR2, uOp, uBr, uAmb, uSomb, uVis, uRev; varying vec3 vW; ${DENS}
    void main(){
      vec3 d = vW - uC; float r = length(d); float x = (r - uR1) / (uR2 - uR1); float b = dens(x);
      vec3 e1 = normalize(cross(uN, abs(uN.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))); vec3 e2 = cross(uN, e1);
      float ang = atan(dot(d, e2), dot(d, e1)) / 6.2831853 + 0.5;
      b *= smoothstep(uRev, uRev - 0.04, ang) * (0.92 + 0.08 * sin(ang * 900.0 + x * 40.0));
      if (b <= 0.001) discard;
      vec3 L = normalize(uL); float s = dot(d, L); float perp = length(d - s * L);
      float sh = 1.0 - (1.0 - smoothstep(uRe * 0.97, uRe * 1.03, perp)) * step(s, 0.0);
      vec3 V = normalize(cameraPosition - vW); float vs = dot(V, uN), ls = dot(L, uN);
      float fwd = pow(max(dot(-V, L), 0.0), 8.0);
      float face = vs * ls > 0.0 ? 0.45 + 0.55 * abs(ls) : 0.1 + 0.7 * fwd;
      vec3 gelo = mix(uCor, vec3(0.85, 0.92, 1.0) * length(uCor) * 0.6, 0.35 * sin(x * 23.0) * sin(x * 23.0));
      vec3 col = gelo * (uBr * face * sh + uAmb) * (0.55 + 0.45 * b);
      float tau = uOp * b; float a = 1.0 - exp(-tau / max(abs(vs), 0.03));
      a *= mix(uSomb, 1.0, sh) * uVis;
      gl_FragColor = vec4(col, a);
    }` });
}
// anel(): disco no plano local XY (normal +Z). Ponha como filho de quem dá o eixo; chame sync() depois de mexer (ou antes do draw).
// o: { Re, r1, r2 (mesma unidade), op (opacidade óptica), br (brilho), amb, cor, sombraA (opac. na sombra), seg }
export function anel(o = {}) {
  o = { Re: 1, r1: 1.25, r2: 2.4, op: 0.55, br: 1.6, amb: 0.03, cor: 0xf2e6d2, sombraA: 0.6, seg: 256, ...o };
  const u = uAnel(o);
  const mesh = new THREE.Mesh(new THREE.RingGeometry(o.r1 * 0.995, o.r2 * 1.005, o.seg, 3), matAnel(u));
  mesh.frustumCulled = false; mesh.renderOrder = 2;
  const sync = () => { mesh.updateMatrixWorld(true); mesh.getWorldPosition(u.uC.value); u.uN.value.set(0, 0, 1).transformDirection(mesh.matrixWorld); };
  return { mesh, u, sync };
}
// sombra do anel numa esfera (Terra/Saturno): casca escura por cima, desenhada onde o raio de sol cruza o anel
export function sombraAnel(raio, A, { forca = 0.85, seg = 96 } = {}) {
  const u = { ...A.u, uF: { value: forca } };
  const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, vertexShader: VERT_W,
    fragmentShader: `uniform vec3 uC, uN, uL; uniform float uR1, uR2, uOp, uF, uVis, uRev; varying vec3 vW; ${DENS}
    void main(){
      vec3 L = normalize(uL); float dn = dot(L, uN); if (abs(dn) < 1e-3) discard;
      float t = dot(uC - vW, uN) / dn; if (t <= 0.0) discard;
      vec3 q = vW + L * t; float x = (length(q - uC) - uR1) / (uR2 - uR1); float b = dens(x); if (b <= 0.001) discard;
      float dia = smoothstep(-0.05, 0.25, dot(normalize(vW - uC), L));
      float a = (1.0 - exp(-uOp * b / max(abs(dn), 0.05))) * uF * dia * uVis;
      gl_FragColor = vec4(0.0, 0.0, 0.01, a);
    }` });
  const s = new THREE.Mesh(new THREE.SphereGeometry(raio, seg, seg / 2), m); s.renderOrder = 1; return s;
}

/* ---------- céu com anel, visto do chão ---------- */
// Observador na origem, chão em y = 0, Terra de raio Re com centro em (0, -Re, 0). Unidade = 100 km (Re = 63.71).
// lat: latitude do observador (negativa = sul). norte: ângulo (rad) do norte em volta do eixo y (0 = norte em -z).
// dirSol(az°, el°) -> direção do Sol no mundo (az a partir do norte, para leste).
export function ceuAnel(S, { lat = -23, norte = 0, Re = 63.71, r1 = 1.25, r2 = 2.4, op = 0.5, br = 2.2, amb = 0.02, cor = 0xf4e8d6, sombraA = 0.25 } = {}) {
  const g = new THREE.Group(); g.rotation.y = norte; S.add(g);
  const A = anel({ Re, r1: r1 * Re, r2: r2 * Re, op, br, amb, cor, sombraA, seg: 384 });
  A.mesh.position.set(0, -Re, 0); g.add(A.mesh);
  const Z = new THREE.Vector3(0, 0, 1), N = new THREE.Vector3();
  const setLat = (l) => { const f = l * Math.PI / 180; N.set(0, Math.sin(f), -Math.cos(f)); A.mesh.quaternion.setFromUnitVectors(Z, N); A.sync(); };
  setLat(lat);
  const dirSol = (az, el, out = new THREE.Vector3()) => { const a = az * Math.PI / 180, e = el * Math.PI / 180;
    out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); return out.applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y); };
  // ponto do anel no céu (raio relativo k em 0..1 entre r1 e r2, ângulo th no plano), útil para mirar câmera
  const ponto = (k, th, out = new THREE.Vector3()) => { const r = (r1 + (r2 - r1) * k) * Re; out.set(Math.cos(th) * r, Math.sin(th) * r, 0); return A.mesh.localToWorld(out); };
  return { g, A, u: A.u, setLat, dirSol, ponto, sync: A.sync };
}
// direção (vec3) a partir de azimute/elevação em graus, no referencial norte = -z girado por `norte`
export function dir(az, el, norte = 0, out = new THREE.Vector3()) { const a = az * Math.PI / 180, e = el * Math.PI / 180;
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).applyAxisAngle(new THREE.Vector3(0, 1, 0), norte); }

/* ---------- chão: campo com morros facetados no horizonte e tufos de capim ---------- */
export function chao(S, LP, { cor = 0x5a6a3a, morro = 0x3c4a34, seed = 3, tufos = 500, raioTufo = 6, centro = [0, 0], corTufo = null, morros = 14 } = {}) {
  const r = mulberry32(seed), g = new THREE.Group(); S.add(g);
  const pl = new THREE.Mesh(new THREE.CircleGeometry(320, 40), LP.mat(cor, 0.97)); pl.rotation.x = -Math.PI / 2; g.add(pl);
  for (let i = 0; i < morros; i++) {
    const a = (i / morros) * 6.283 + r() * 0.3, d = 70 + r() * 90, m = new THREE.Mesh(LP.facetado(1, () => {}, seed + i * 3, 0.25), LP.mat(new THREE.Color(morro).multiplyScalar(0.8 + r() * 0.4).getHex(), 1));
    m.scale.set(18 + r() * 26, 5 + r() * 9, 14 + r() * 16); m.position.set(Math.cos(a) * d, -2, Math.sin(a) * d); g.add(m);
  }
  if (tufos) {
    const geo = new THREE.ConeGeometry(0.035, 0.22, 3); geo.translate(0, 0.11, 0);
    const im = new THREE.InstancedMesh(geo, LP.mat(corTufo ?? new THREE.Color(cor).multiplyScalar(1.25).getHex(), 0.9), tufos);
    const o = new THREE.Object3D();
    for (let i = 0; i < tufos; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * raioTufo; o.position.set(centro[0] + Math.cos(a) * d, 0, centro[1] + Math.sin(a) * d);
      o.rotation.set((r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5); o.scale.setScalar(0.6 + r() * 1.2); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
    g.add(im);
  }
  return g;
}

/* ---------- espaço: rochas e gelo do anel, satélite, foguete, estação, Saturno ---------- */
export function campoRochas(S, { n = 800, area = [40, 0.6, 14], centro = [0, 0, 0], tam = [0.04, 0.45], seed = 9, cores = [0x8a837a, 0xd8e2ea, 0xb0a594] } = {}) {
  const r = mulberry32(seed);
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, flatShading: true }), n);
  const P = [], c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const s = tam[0] + (tam[1] - tam[0]) * Math.pow(r(), 3);
    P.push({ x: (r() - 0.5) * area[0], y: (r() - 0.5) * area[1] * (1 - 0.6 * s / tam[1]), z: (r() - 0.5) * area[2], s, rx: r() * 6, ry: r() * 6, w: (r() - 0.5) * 1.2, v: 0.7 + r() * 0.6, sx: 0.7 + r() * 0.6 });
    im.setColorAt(i, c.setHex(cores[Math.floor(r() * cores.length)]).multiplyScalar(0.8 + r() * 0.4));
  }
  im.position.set(...centro); S.add(im);
  const o = new THREE.Object3D(), W = area[0];
  const update = (t, vel = 1) => { P.forEach((p, i) => { let x = p.x + vel * p.v * t; x = ((x + W / 2) % W + W) % W - W / 2;
    o.position.set(x, p.y, p.z); o.rotation.set(p.rx + p.w * t, p.ry + p.w * 0.7 * t, 0); o.scale.set(p.s * p.sx, p.s, p.s * 0.9); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.instanceMatrix.needsUpdate = true; };
  update(0); return { im, P, update };
}
const mStd = (c, rough = 0.5, metal = 0.3, emis = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal, emissive: emis ? c : 0x000000, emissiveIntensity: emis });
function texPainel() {
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 64; const g = cv.getContext("2d");
  g.fillStyle = "#0d1a36"; g.fillRect(0, 0, 128, 64); g.strokeStyle = "#5a7ab8"; g.lineWidth = 1.5;
  for (let x = 0; x <= 128; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 64); g.stroke(); }
  for (let y = 0; y <= 64; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let _tp = null;
const matPainel = () => new THREE.MeshStandardMaterial({ map: (_tp ??= texPainel()), roughness: 0.3, metalness: 0.6, side: THREE.DoubleSide });
// satélite genérico: corpo dourado, 2 painéis solares, antena. jato(k) liga o propulsor
export function satelite() {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.7), mStd(0xc8a048, 0.35, 0.8)); g.add(corpo);
  const topo = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.72), mStd(0xd8d8dc, 0.4, 0.5)); topo.position.y = 0.29; g.add(topo);
  for (const s of [1, -1]) {
    const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), mStd(0xaaaaaa)); haste.rotation.z = Math.PI / 2; haste.position.x = s * 0.45; g.add(haste);
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.6), matPainel()); p.position.x = s * 1.35; g.add(p);
  }
  const prato = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 6, 0, 6.283, 0, 1.0), mStd(0xeeeeee, 0.4, 0.2)); prato.material.side = THREE.DoubleSide; prato.rotation.x = Math.PI; prato.position.set(0, -0.2, 0.42); prato.rotation.x = -2.2; g.add(prato);
  const jatoS = brilho(0x9fd6ff, 0.6, "suave", 0); jatoS.position.set(0.3, 0, -0.45); g.add(jatoS);
  return { g, jato: (k) => { jatoS.material.opacity = k; jatoS.scale.setScalar(0.3 + 0.6 * k); } };
}
// foguete genérico (branco, sem marca): corpo, ogiva, aletas e chama
export function foguete() {
  const g = new THREE.Group(), b = mStd(0xeeeeee, 0.45, 0.1);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.2, 14), b); c.position.y = 1.1; g.add(c);
  const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.182, 0.182, 0.25, 14), mStd(0x222630, 0.5, 0.2)); faixa.position.y = 1.6; g.add(faixa);
  const og = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 14), b); og.position.y = 2.47; g.add(og);
  for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.3), mStd(0x30343c)); const a = i * Math.PI / 2; f.position.set(Math.cos(a) * 0.2, 0.2, Math.sin(a) * 0.2); f.rotation.y = -a + Math.PI / 2; g.add(f); }
  const ch = brilho(0xffb060, 1.4, "suave", 1); ch.position.y = -0.35; g.add(ch);
  const ch2 = brilho(0xfff0d0, 0.6, "suave", 1); ch2.position.y = -0.1; g.add(ch2);
  return { g, chama: (k, t = 0) => { const f = 1 + 0.12 * Math.sin(t * 40) + 0.08 * Math.sin(t * 67); ch.scale.set(1.0 * k * f, 2.2 * k * f, 1); ch.position.y = -0.2 - 0.8 * k; ch2.scale.setScalar(0.6 * k); ch.material.opacity = ch2.material.opacity = Math.min(1, k * 1.5); } };
}
// estação espacial genérica: treliça longa, 8 painéis, módulos pressurizados e radiadores
export function estacao() {
  const g = new THREE.Group(), cinza = mStd(0xcfd2d6, 0.45, 0.5), branco = mStd(0xe8e8ea, 0.5, 0.2);
  const tr = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.16, 0.16), cinza); g.add(tr);
  for (const x of [-2.9, -2.2, 2.2, 2.9]) for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 2.4), matPainel()); p.position.set(x, 0, s * 1.35); g.add(p); }
  const mods = [[0, 1.6], [0.0, -1.4], [0.55, 0.3], [-0.55, 0.0]];
  for (const [x, z] of mods) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.3, 12), branco); m.rotation.x = Math.PI / 2; m.position.set(x, -0.25, z * 0.6); g.add(m); }
  const rad = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.5), mStd(0xf4f4f4, 0.6, 0)); rad.position.set(1.1, -0.3, 0.6); g.add(rad);
  return g;
}
// Saturno: esfera com faixas (textura de canvas) e luz própria (direção do Sol em u.uL)
export function saturno(raio = 1, { seed = 4 } = {}) {
  const cv = document.createElement("canvas"); cv.width = 16; cv.height = 512; const g = cv.getContext("2d"), r = mulberry32(seed);
  for (let y = 0; y < 512; y++) { const k = y / 512, v = 0.78 + 0.12 * Math.sin(k * 60 + r() * 0.2) + 0.08 * Math.sin(k * 23) - 0.25 * Math.pow(Math.abs(k - 0.5) * 2, 6);
    const cr = Math.round(232 * v), cg = Math.round(204 * v * (0.97 + 0.05 * Math.sin(k * 40))), cb = Math.round(152 * v * (0.9 + 0.1 * Math.sin(k * 17)));
    g.fillStyle = `rgb(${cr},${cg},${cb})`; g.fillRect(0, y, 16, 1); }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.NoColorSpace;
  const u = { map: { value: tx }, uL: { value: new THREE.Vector3(1, 0.2, 0.4).normalize() } };
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: "varying vec2 vU; varying vec3 vN; void main(){ vU = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform sampler2D map; uniform vec3 uL; varying vec2 vU; varying vec3 vN; void main(){ vec3 c = texture2D(map, vU).rgb; float l = smoothstep(-0.08, 0.6, dot(normalize(vN), normalize(uL))); gl_FragColor = vec4(c * (0.015 + 1.05 * l), 1.0); }" });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(raio, 72, 48), m); mesh.scale.y = 0.9;
  return { mesh, u };
}
// prédio de escala (caixa com janelas acesas), base em y = 0
export function predioEscala(h = 1, { cor = 0x6c7480 } = {}) {
  const cv = document.createElement("canvas"); cv.width = 64; cv.height = 256; const g = cv.getContext("2d"), r = mulberry32(5);
  g.fillStyle = "#3a4048"; g.fillRect(0, 0, 64, 256);
  for (let y = 8; y < 250; y += 14) for (let x = 6; x < 60; x += 12) { g.fillStyle = r() < 0.55 ? "#ffd89a" : "#1c2028"; g.fillRect(x, y, 7, 8); }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.BoxGeometry(h * 0.3, h, h * 0.3), new THREE.MeshStandardMaterial({ color: cor, map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.6, roughness: 0.7 }));
  m.position.y = h / 2; return m;
}
// contador doc: número grande em mono com rótulo
export function numero(ctx, s, x, y, a = 1, { tam = 120, cor = "#fff", sub = "", subCor = AZUL } = {}) {
  txt(ctx, s, x, y, { tam, cor, a, peso: 600, esp: 0.02 });
  if (sub) txt(ctx, sub, x, y + tam * 0.72, { tam: Math.round(tam * 0.26), cor: subCor, a, esp: 0.3 });
}
