/**
 * doissois.js — peças do vídeo "E se a Terra tivesse dois sóis?" (R10 doc + R11 lowpoly). Tudo determinístico.
 *
 *   AZUL, LARANJA, fontes()                 paleta doc e carga das fontes do canvas
 *   brilho(cor, tam, tipo, op)              sprite aditivo ("suave" | "raios" | "disco")
 *   estrela(S, {r, tipo, halo, pos})        sol com shader; tipo "amarelo" | "vermelho"; .set(L, t)
 *   estrelas(S, {n, r, seed, tam})          campo de estrelas (Points); .set(alfa, t)
 *   await terraDupla({raio})                Terra NASA iluminada por DOIS sóis: u.s1/u.s2 (direção), u.c1/u.c2 (cor·intensidade),
 *                                           u.seco (oceano evaporado), u.vapor (névoa branca), u.atmo, u.luzes. aim(lon, lat)
 *   gigante(raio, seed)                     planeta gasoso com faixas (Kepler-16b)
 *   anel(r, cor, op, tubo)                  órbita (toro fino aditivo)
 *   seta(cor), feixe(S, cor)                seta 3D .apontar(a, b, r);  feixe de luz .de(a, b, raio, alfa)
 *   proj(v, cam), txt(ctx, ...), etq(ctx, txt, v3, cam, a, o)   textos 2D; etq prende o rótulo ao ponto 3D e o mantém em y 640–1000, x ≤ 940
 *   sombraPlanar(L)                         Matrix4 que achata um objeto no chão (y = 0) ao longo da direção da luz L
 *   barato(obj)                             troca a esfera padrão do toy.js por uma de poucos triângulos (silhuetas distantes, sombras)
 *   ceuTex(cores)                           textura de céu em degradê (lista de [pos, cor])
 *   quarto(S, LP)                           R11: quarto com janela (z = 1.8), céu, morros e os dois sóis (f01/f13)
 */
import * as THREE from "../three.module.js";
import { mulberry32, clamp, lerp } from "../kit.js";
import { SPH } from "./toy.js";

export const AZUL = "#7cc8ff", LARANJA = "#ff8a4c";
export async function fontes() {
  try { await Promise.all(['600 40px "JetBrains Mono"', '300 40px "Inter"', '600 40px "Inter"', '800 40px "Inter"'].map((f) => document.fonts.load(f))); } catch (e) { /* fallback */ }
}

/* ---------- brilhos ---------- */
const _tex = {};
export function glowTex(tipo = "suave") {
  if (_tex[tipo]) return _tex[tipo];
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  if (tipo === "raios") {
    const r = mulberry32(31); g.translate(128, 128);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + r() * 0.2, L = 60 + r() * 68, w = 1 + r() * 3;
      const gr = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
      gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.strokeStyle = gr; g.lineWidth = w; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.stroke();
    }
  } else {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    if (tipo === "disco") { gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,0.26)"); gr.addColorStop(1, "rgba(255,255,255,0)"); }
    else { gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.12, "rgba(255,255,255,0.7)"); gr.addColorStop(0.35, "rgba(255,255,255,0.18)"); gr.addColorStop(1, "rgba(255,255,255,0)"); }
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (_tex[tipo] = t);
}
export function brilho(cor, tam, tipo = "suave", op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(tipo), color: cor, transparent: true, opacity: op,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  s.scale.setScalar(tam);
  return s;
}

/* ---------- sóis ---------- */
const TIPO = {
  amarelo: { borda: [1.0, 0.5, 0.12], centro: [1.0, 0.97, 0.86], halo: 0xffc77a, coroa: 0xffe6b8 },
  vermelho: { borda: [0.9, 0.1, 0.03], centro: [1.5, 0.38, 0.16], halo: 0xff4a24, coroa: 0xff8a60 },
};
export function estrela(S, { r = 1, tipo = "amarelo", halo = 9, pos = [0, 0, 0] } = {}) {
  const P = TIPO[tipo];
  const g = new THREE.Group(); g.position.set(...pos);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uL: { value: 1 }, uT: { value: 0 }, cB: { value: new THREE.Vector3(...P.borda) }, cC: { value: new THREE.Vector3(...P.centro) } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uL, uT; uniform vec3 cB, cC; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ float mu = clamp(dot(vN, vV), 0.0, 1.0); vec3 p = normalize(vP);
        float gr = sin(p.x * 23.0 + uT * 0.7) * sin(p.y * 27.0 - uT * 0.5) * sin(p.z * 25.0 + uT * 0.6);
        vec3 c = mix(cB, cC, pow(mu, 0.45)) * (1.2 + gr * 0.1);
        gl_FragColor = vec4(c * uL, 1.0); }`,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 24), mat); g.add(core);
  const coroa = brilho(P.coroa, r * 3.4), hs = brilho(P.halo, r * halo), raios = brilho(P.coroa, r * halo * 1.3, "raios", 0.5);
  g.add(hs, raios, coroa);
  S.add(g);
  function set(L = 1, t = 0) {
    mat.uniforms.uL.value = L; mat.uniforms.uT.value = t;
    coroa.material.opacity = L; hs.material.opacity = 0.95 * L; raios.material.opacity = 0.5 * L; raios.material.rotation = t * 0.03;
  }
  set(1);
  return { group: g, core, mat, coroa, halo: hs, raios, set, r };
}

/* ---------- estrelas (Points) ---------- */
export function estrelas(S, { n = 2600, r = 600, seed = 7, tam = 3.2 } = {}) {
  const rnd = mulberry32(seed);
  const pos = new Float32Array(n * 3), aS = new Float32Array(n), aC = new Float32Array(n), aP = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
    aS[i] = tam * (0.6 + Math.pow(rnd(), 3.2) * 2.6); aC[i] = rnd(); aP[i] = rnd();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aS", new THREE.BufferAttribute(aS, 1)); geo.setAttribute("aC", new THREE.BufferAttribute(aC, 1)); geo.setAttribute("aP", new THREE.BufferAttribute(aP, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uA: { value: 1 }, uT: { value: 0 } },
    vertexShader: `attribute float aS; attribute float aC; attribute float aP; uniform float uT; varying float vC; varying float vTw;
      void main(){ vC = aC; vTw = 0.78 + 0.22 * sin(uT * (2.0 + aP * 5.0) + aP * 40.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = aS; }`,
    fragmentShader: `uniform float uA; varying float vC; varying float vTw;
      void main(){ vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d, d) * 30.0) * vTw * uA; if (a < 0.004) discard;
        gl_FragColor = vec4(mix(vec3(0.70, 0.80, 1.0), vec3(1.0, 0.88, 0.72), vC) * a, 1.0); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = -1; S.add(pts);
  return { pts, mat, set: (a, t) => { mat.uniforms.uA.value = a; mat.uniforms.uT.value = t; } };
}

/* ---------- Terra com dois sóis ---------- */
const _tl = new THREE.TextureLoader(), _tc = new Map();
function tex(nome) {
  if (!_tc.has(nome)) _tc.set(nome, new Promise((ok, err) => _tl.load(`./assets/img/${nome}`, (t) => { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; ok(t); }, undefined, err)));
  return _tc.get(nome);
}
const VERT = `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FRAG_T2 = `uniform sampler2D dia, noite, agua, nuv; uniform vec3 s1, s2, c1, c2; uniform float seco, vapor, atmo, luzes, nuvens, giro;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW), L1 = normalize(s1), L2 = normalize(s2);
  float n1 = dot(N, L1), n2 = dot(N, L2);
  float l1 = smoothstep(-0.1, 0.35, n1), l2 = smoothstep(-0.1, 0.35, n2);
  vec3 d = texture2D(dia, vUv).rgb; float w = texture2D(agua, vUv).r;
  float b0 = d.b; vec3 fundo = mix(vec3(0.2, 0.15, 0.12), vec3(0.7, 0.58, 0.44), smoothstep(0.16, 0.42, b0));
  vec3 base = mix(d, fundo, w * seco);
  float cl = smoothstep(0.08, 0.85, texture2D(nuv, vUv + vec2(giro, 0.0)).r) * nuvens;
  base = mix(base, vec3(0.97), cl * 0.85);
  vec3 luz = l1 * c1 + l2 * c2;
  vec3 col = base * (0.02 + luz);
  vec3 H1 = normalize(L1 + V), H2 = normalize(L2 + V);
  col += (pow(max(dot(N, H1), 0.0), 60.0) * c1 * step(0.0, n1) + pow(max(dot(N, H2), 0.0), 60.0) * c2 * step(0.0, n2)) * w * (1.0 - seco) * (1.0 - cl) * 0.5;
  float lum = max(dot(l1 * c1, vec3(0.33)), dot(l2 * c2, vec3(0.33)));
  float esc = 1.0 - smoothstep(0.0, 0.18, lum);
  vec3 nt = texture2D(noite, vUv).rgb; float nl = max(max(nt.r, nt.g) - 0.2, 0.0) * 2.4;
  col += vec3(1.0, 0.78, 0.45) * nl * esc * luzes;
  col = mix(col, vec3(0.92, 0.9, 0.88) * (0.06 + luz * 0.95), vapor * (0.35 + 0.65 * smoothstep(0.2, 0.9, texture2D(nuv, vUv * 1.7 + vec2(giro * 3.0, 0.1)).r)));
  float fr = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  col += (vec3(0.3, 0.55, 1.0) * l1 * length(c1) + vec3(1.0, 0.45, 0.3) * l2 * length(c2)) * fr * atmo * 0.6;
  gl_FragColor = vec4(col, 1.0);
}`;
const FRAG_A2 = `uniform vec3 s1, s2, c1, c2; uniform float atmo; varying vec3 vN; varying vec3 vW;
void main(){ vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  float r = 1.0 - abs(dot(N, V)); float g = pow(r, 3.0) * 1.3 + pow(r, 10.0) * 1.6;
  float a1 = smoothstep(-0.35, 0.35, dot(N, normalize(s1))), a2 = smoothstep(-0.35, 0.35, dot(N, normalize(s2)));
  vec3 c = vec3(0.28, 0.55, 1.0) * a1 * length(c1) * 0.8 + mix(vec3(0.28, 0.55, 1.0), vec3(1.0, 0.5, 0.3), 0.6) * a2 * length(c2) * 0.8;
  gl_FragColor = vec4(c * g * atmo, 1.0); }`;
export async function terraDupla({ raio = 1, seg = 96 } = {}) {
  const [dia, noite, agua, nuv] = await Promise.all(["terra-dia.jpg", "terra-noite.jpg", "terra-agua.jpg", "terra-nuvens.jpg"].map(tex));
  dia.wrapS = noite.wrapS = agua.wrapS = nuv.wrapS = THREE.RepeatWrapping;
  const u = { dia: { value: dia }, noite: { value: noite }, agua: { value: agua }, nuv: { value: nuv },
    s1: { value: new THREE.Vector3(1, 0.2, 0.5) }, s2: { value: new THREE.Vector3(-1, 0.1, 0.4) },
    c1: { value: new THREE.Vector3(1.05, 1.0, 0.92) }, c2: { value: new THREE.Vector3(0, 0, 0) },
    seco: { value: 0 }, vapor: { value: 0 }, atmo: { value: 1 }, luzes: { value: 0.9 }, nuvens: { value: 0.85 }, giro: { value: 0 } };
  const group = new THREE.Group(), earth = new THREE.Group(); group.add(earth);
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(raio, seg, seg / 2), new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG_T2 })));
  group.add(new THREE.Mesh(new THREE.SphereGeometry(raio * 1.045, 64, 32), new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG_A2,
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  const D2R = Math.PI / 180;
  const aim = (lon, lat) => { earth.rotation.order = "XYZ"; earth.rotation.y = -(lon + 90) * D2R; earth.rotation.x = lat * D2R; };
  return { group, earth, u, aim, raio };
}

/* ---------- Kepler-16b: gigante gasoso ---------- */
export function gigante(raio = 1, seed = 16) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256;
  const g = c.getContext("2d"), r = mulberry32(seed);
  const cores = ["#c9a27a", "#a87c58", "#e0c49c", "#8c6448", "#d4b08a", "#b58c66", "#7a5a44", "#e8d2ae"];
  let y = 0;
  while (y < 256) { const h = 6 + r() * 22; g.fillStyle = cores[Math.floor(r() * cores.length)]; g.fillRect(0, y, 512, h + 1); y += h; }
  for (let i = 0; i < 900; i++) { const yy = r() * 256, xx = r() * 512; g.fillStyle = `rgba(${r() < 0.5 ? "255,240,220" : "60,40,30"},${0.08 + r() * 0.1})`; g.fillRect(xx, yy, 20 + r() * 80, 1 + r() * 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(raio, 64, 32), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, metalness: 0 }));
  return m;
}

/* ---------- diagramas ---------- */
export function anel(r, cor = 0x7cc8ff, op = 0.6, tubo = null) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tubo ?? r * 0.006, 6, 160), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  m.rotation.x = Math.PI / 2; return m;
}
const _cyl = new THREE.CylinderGeometry(1, 1, 1, 12); _cyl.translate(0, 0.5, 0);
const _cone = new THREE.ConeGeometry(1, 1, 16); _cone.translate(0, 0.5, 0);
export function seta(cor, { emis = 0.8 } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 1, toneMapped: false, fog: false });
  const s = new THREE.Mesh(_cyl, mat), h = new THREE.Mesh(_cone, mat); g.add(s, h);
  const Y = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
  function apontar(a, b, r = 0.05, alfa = 1) {
    d.subVectors(b, a); const L = d.length(); g.visible = L > 1e-3 && alfa > 0.01; if (!g.visible) return;
    mat.opacity = alfa;
    g.position.copy(a); g.quaternion.setFromUnitVectors(Y, d.normalize());
    const hl = Math.min(L * 0.45, r * 5); s.scale.set(r, Math.max(1e-3, L - hl), r); h.position.y = L - hl; h.scale.set(r * 2.6, hl, r * 2.6);
  }
  return { group: g, mat, apontar };
}
export function feixe(S, cor = 0xffd9a0) {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); geo.rotateZ(-Math.PI / 2); geo.translate(0.5, 0, 0);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: new THREE.Color(cor) }, uA: { value: 1 }, uT: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vX; void main(){ vX = position.x; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uC; uniform float uA, uT; varying vec3 vN; varying vec3 vV; varying float vX;
      void main(){ float f = pow(abs(dot(vN, vV)), 1.5); float e = smoothstep(0.0, 0.04, vX) * smoothstep(1.0, 0.9, vX);
        float pulso = 0.75 + 0.25 * sin(vX * 40.0 - uT * 9.0);
        gl_FragColor = vec4(uC * f * 0.4 * e * uA * pulso, 1.0); }` });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; S.add(m);
  const a = new THREE.Vector3(), d = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);
  function de(p, q, r = 0.5, alfa = 1, t = 0) {
    a.copy(p); d.subVectors(q, a); const L = d.length();
    m.visible = L > 1e-3 && alfa > 0.002; m.position.copy(a); m.quaternion.setFromUnitVectors(X, d.normalize()); m.scale.set(Math.max(1e-3, L), r, r);
    mat.uniforms.uA.value = alfa; mat.uniforms.uT.value = t;
  }
  return { mesh: m, mat, de };
}

/* ---------- 2D ---------- */
const _pv = new THREE.Vector3();
export function proj(v, cam) { cam.updateMatrixWorld(); _pv.copy(v).project(cam); return [(_pv.x + 1) * 540, (1 - _pv.y) * 960, _pv.z]; }
const FAM = { mono: '"JetBrains Mono", ui-monospace, "DejaVu Sans Mono", monospace', inter: '"Inter", "Montserrat", sans-serif' };
export function txt(ctx, s, x, y, { tam = 34, cor = "#fff", fonte = "mono", peso = 600, al = "center", a = 1, base = "middle", esp = 0.12 } = {}) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a);
  ctx.font = `${peso} ${tam}px ${FAM[fonte] || FAM.mono}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = (fonte === "mono" ? esp * tam : 0) + "px";
  ctx.textAlign = al; ctx.textBaseline = base;
  ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = tam * 0.4; ctx.shadowOffsetY = tam * 0.06;
  ctx.fillStyle = cor; ctx.fillText(s, x, y); ctx.restore();
}
export function pilula(ctx, x, y, w, h, a = 1, borda = "rgba(124,200,255,0.5)") {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = "rgba(8,10,20,0.62)";
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(16, h * 0.3)); ctx.fill();
  ctx.strokeStyle = borda; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
// etiqueta doc presa a um ponto 3D: ponto + linha-guia + texto mono; o texto fica em y 640–1000 e x 80–940
export function etq(ctx, s, v, cam, a = 1, { cor = AZUL, tam = 30, dy = 0, dx = 0, y0 = 640, y1 = 1000, ponto = true } = {}) {
  if (a <= 0.003) return;
  const [px, py, pz] = proj(v, cam); if (pz > 1) return;
  ctx.save(); ctx.font = `600 ${tam}px ${FAM.mono}`; if ("letterSpacing" in ctx) ctx.letterSpacing = 0.12 * tam + "px";
  const w = ctx.measureText(s).width + 36, h = tam * 1.7;
  const x = Math.min(940 - w / 2, Math.max(80 + w / 2, px + dx)), y = Math.min(y1, Math.max(y0, py + dy));
  ctx.globalAlpha = Math.min(1, a);
  if (ponto && (Math.abs(py - y) > h * 0.6 || Math.abs(px - x) > w * 0.6)) {
    ctx.strokeStyle = cor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y + (py < y ? -h / 2 : h / 2)); ctx.stroke();
    ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "rgba(8,10,20,0.66)"; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 8); ctx.fill();
  ctx.strokeStyle = cor; ctx.globalAlpha = Math.min(1, a) * 0.6; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = Math.min(1, a);
  ctx.fillStyle = cor; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s, x, y + 1);
  ctx.restore();
}

/* ---------- sombra planar (segunda sombra sem segunda luz com shadow map) ---------- */
export function sombraPlanar(L, y = 0.012) {
  const l = L.clone().normalize();
  const m = new THREE.Matrix4();
  m.set(1, -l.x / l.y, 0, 0, 0, 0, 0, y, 0, -l.z / l.y, 1, 0, 0, 0, 0, 1);
  return m;
}
const SPH_LO = new THREE.SphereGeometry(1, 10, 7);
export function barato(obj, mat = null) {
  obj.traverse((m) => { if (m.isMesh) { if (m.geometry === SPH) m.geometry = SPH_LO; if (mat) { m.material = mat; m.castShadow = false; m.receiveShadow = false; } } });
  return obj;
}

/* ---------- céu ---------- */
export function ceuTex(stops) {
  const c = document.createElement("canvas"); c.width = 4; c.height = 512;
  const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 512);
  for (const [p, cor] of stops) gr.addColorStop(p, cor);
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- R11: quarto com janela (f01 e f13) ---------- */
// pessoa na origem olhando +z; parede da janela em z = 1.8 (vão x ±0.95, y 0.8–2.6); lá fora: céu, morros e os dois sóis
export function quarto(S, LP) {
  const parede = LP.mat(0xb89a7c, 0.9), moldura = LP.mat(0xe8e0d2, 0.6), chao = LP.mat(0x6a4a34, 0.7);
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); S.add(b); return b; };
  box(2.2, 3.4, 0.16, parede, -2.05, 1.7, 1.8); box(2.2, 3.4, 0.16, parede, 2.05, 1.7, 1.8);
  box(1.9, 0.8, 0.16, parede, 0, 0.4, 1.8); box(1.9, 0.8, 0.16, parede, 0, 3.0, 1.8);
  box(2.0, 0.06, 0.3, moldura, 0, 0.8, 1.75); box(2.0, 0.07, 0.2, moldura, 0, 2.6, 1.8);
  box(0.07, 1.9, 0.2, moldura, -0.97, 1.7, 1.8); box(0.07, 1.9, 0.2, moldura, 0.97, 1.7, 1.8);
  // janela aberta: folha girada para dentro
  const folha = new THREE.Group(); folha.position.set(-0.95, 1.7, 1.72); S.add(folha);
  const vidro = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.76, 0.02), new THREE.MeshStandardMaterial({ color: 0x9ab8c8, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.25 }));
  vidro.position.x = 0.46; folha.add(vidro);
  for (const [w, h, x, y] of [[0.95, 0.05, 0.46, 0.88], [0.95, 0.05, 0.46, -0.88], [0.05, 1.8, 0.02, 0], [0.05, 1.8, 0.92, 0]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), moldura); f.position.set(x, y, 0); folha.add(f); }
  folha.rotation.y = 1.9;
  box(8, 0.1, 8, chao, 0, -0.05, -1.5);
  box(8, 3.4, 0.16, parede, 0, 1.7, -3.2); box(0.16, 3.4, 6, parede, -3.0, 1.7, -0.6); box(0.16, 3.4, 6, parede, 3.0, 1.7, -0.6);
  // cama desarrumada e abajur ao fundo (viram bokeh)
  box(1.6, 0.45, 2.1, LP.mat(0x5a4a3c, 0.8), -1.6, 0.22, -2.0); box(1.55, 0.18, 1.6, LP.mat(0xd8d2c8, 0.9), -1.6, 0.52, -1.75);
  const cob = new THREE.Mesh(LP.facetado(1, (v) => { v.y *= 0.25; v.x *= 0.85; }, 9, 0.2), LP.mat(0x3d5a80, 0.9)); cob.position.set(-1.55, 0.62, -1.5); cob.scale.set(0.9, 1, 1.0); S.add(cob);
  const ab = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc98a).multiplyScalar(2.2) })); ab.position.set(1.6, 1.0, -2.6); S.add(ab);
  // lá fora: céu (plano), morros facetados e os dois sóis
  const ceuM = new THREE.MeshBasicMaterial({ map: ceuTex([[0, "#2a3f73"], [0.45, "#c9756a"], [0.62, "#ffb86b"], [0.7, "#ffd79a"], [1, "#e8a070"]]), fog: false, toneMapped: true });
  const ceu = new THREE.Mesh(new THREE.PlaneGeometry(160, 70), ceuM); ceu.position.set(0, 14, 60); ceu.rotation.y = Math.PI; S.add(ceu);
  const rr = mulberry32(5);
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(LP.facetado(1, (v) => { v.y = Math.max(v.y, -0.2); }, 30 + i, 0.25), LP.mat([0x2f3f4a, 0x3a4a50, 0x45504c][i % 3], 0.95));
    const s = 6 + rr() * 8; m.scale.set(s * 1.6, s * (0.35 + rr() * 0.3), s); m.position.set(-36 + i * 9 + rr() * 4, -1.5, 30 + rr() * 16); S.add(m);
  }
  const SA = estrela(S, { r: 2.0, tipo: "amarelo", halo: 8, pos: [-3.4, 10.5, 50] });
  const SV = estrela(S, { r: 1.0, tipo: "vermelho", halo: 9, pos: [3.8, 7.8, 50] });
  const noite = estrelas(S, { n: 900, r: 48, seed: 21, tam: 2.6 }); noite.pts.position.set(0, 0, 0);
  noite.set(0, 0);
  return { SA, SV, ceu, ceuM, folha, noite, ab };
}
