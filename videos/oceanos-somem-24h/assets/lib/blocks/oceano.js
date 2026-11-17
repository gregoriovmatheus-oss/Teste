/**
 * oceano.js — peças do vídeo "E se os oceanos sumissem por 24 h" (R10, PBR realista, tudo determinístico).
 *
 *   ruido(x, z, s) / fbm(x, z, oitavas, s)      ruído de valor 2D com seed (-1..1)
 *   terreno({ w, d, sx, sz, cx, cz, alt(x,z), cor(x,z,y,c) })  -> Mesh (heightfield com cores por vértice)
 *   globoSeco(scene, { det })  -> { earth, agua, setAgua(k), atmo, cristas(prog), raio(lon,lat) }
 *       Terra com relevo do fundo do mar (plataforma, talude, planície abissal, dorsais, fossas).
 *       setAgua(1) = oceano cheio (esfera azul cobre as bacias); setAgua(0) = seco (o nível desce e revela o relevo).
 *   espaco(st, { solDir })      transforma o palco do toy.js em espaço: fundo preto, estrelas, Sol com halo, luz fraca.
 *   relogio(ctx, horas, {...})  relógio de 24 h (HUD 2D, canto superior direito). horaEm(tGlobal) dá a hora da história.
 *   etiqueta(ctx, cam, pos, texto, {...})  rótulo 2D preso a um ponto 3D (ponto + linha + caixa).
 *   coral(seed, tipo, cor) -> { group, branquear(k) }   peixe(cor) -> { group, tail }
 *   texPonto()  textura redonda suave para Points.
 */
import * as THREE from "../three.module.js";
import { mulberry32, clamp, lerp, ease, smoothstep } from "../kit.js";
import { LAND } from "./globe.js";
import { TOON } from "./toy.js";

const D2R = Math.PI / 180;

/* ---------- ruído ---------- */
function hash(i, j, s) {
  let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function ruido(x, z, s = 1) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return lerp(lerp(hash(i, j, s), hash(i + 1, j, s), u), lerp(hash(i, j + 1, s), hash(i + 1, j + 1, s), u), v) * 2 - 1;
}
export function fbm(x, z, o = 4, s = 1) {
  let a = 0.5, f = 1, sum = 0;
  for (let k = 0; k < o; k++) { sum += a * ruido(x * f, z * f, s + k * 17); a *= 0.5; f *= 2.03; }
  return sum;
}

/* ---------- terreno (heightfield) ---------- */
const _c = new THREE.Color(), _c2 = new THREE.Color();
export function mistura(c, a, b, k) { c.setHex(a); _c2.setHex(b); return c.lerp(_c2, clamp(k)); }
export function terreno({ w = 400, d = 400, sx = 80, sz = 80, cx = 0, cz = 0, alt, cor, rough = 0.95, metal = 0 }) {
  const g = new THREE.PlaneGeometry(w, d, sx, sz);
  g.rotateX(-Math.PI / 2);
  g.translate(cx, 0, cz);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = alt(x, z);
    p.setY(i, y);
    cor(x, z, y, c);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, TOON({ vertexColors: true, roughness: rough, metalness: metal }));
  m.receiveShadow = true; m.castShadow = true;
  return m;
}

/* ---------- textura de ponto (Points) ---------- */
let _pt = null;
export function texPonto() {
  if (_pt) return _pt;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.45, "rgba(255,255,255,0.65)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  _pt = new THREE.CanvasTexture(c); _pt.colorSpace = THREE.SRGBColorSpace;
  return _pt;
}

/* ---------- espaço: estrelas + Sol com halo, no palco do toy.js ---------- */
export function espaco(st, { solDir = [-0.75, 0.25, 0.6], estrelas = 2200, seed = 5, halo = 1 } = {}) {
  const S = st.scene;
  S.background = new THREE.Color(0x010204);
  S.fog = null; S.environment = null;
  st.hemi.color.setHex(0x30405a); st.hemi.groundColor.setHex(0x000000); st.hemi.intensity = 0.07;
  st.rim.intensity = 0.0;
  st.key.castShadow = false;
  st.key.color.setHex(0xfff2df); st.key.intensity = 3.4;
  const dir = new THREE.Vector3(...solDir).normalize();
  st.key.position.copy(dir).multiplyScalar(50); st.key.target.position.set(0, 0, 0);
  // estrelas: duas camadas (muitas fracas + poucas fortes), seed fixa
  const rs = mulberry32(seed);
  const mk = (n, size, cor) => {
    const sp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rs() * 2 - 1, th = rs() * Math.PI * 2, r = 400;
      sp[i * 3] = r * Math.sqrt(1 - u * u) * Math.cos(th); sp[i * 3 + 1] = r * u; sp[i * 3 + 2] = r * Math.sqrt(1 - u * u) * Math.sin(th);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({ color: cor, size, sizeAttenuation: false, fog: false, map: texPonto(), transparent: true, depthWrite: false }));
    S.add(p); return p;
  };
  mk(estrelas, 2.2, 0xaebdd0); mk(Math.floor(estrelas / 8), 4.0, 0xf2f4ff);
  // Sol: núcleo + halo aditivo
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d"), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, "rgba(255,255,250,1)"); r.addColorStop(0.08, "rgba(255,246,225,1)"); r.addColorStop(0.2, "rgba(255,214,150,0.45)");
  r.addColorStop(0.5, "rgba(255,170,90,0.12)"); r.addColorStop(1, "rgba(255,140,60,0)");
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const sol = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
  sol.position.copy(dir).multiplyScalar(300); sol.scale.setScalar(110 * halo);
  S.add(sol);
  return { dir, sol };
}

/* ---------- Terra com relevo submarino ---------- */
// dorsais meso-oceânicas e fossas (lon, lat), traçado simplificado
export const DORSAIS = [
  [[-15, 72], [-28, 62], [-32, 52], [-37, 40], [-45, 28], [-45, 15], [-35, 5], [-20, -2], [-13, -12], [-14, -25], [-13, -37], [-10, -48], [-2, -54]],
  [[-2, -54], [15, -52], [30, -45], [45, -40], [58, -34], [68, -25]],
  [[68, -25], [67, -12], [65, 0], [60, 10], [55, 13]],
  [[68, -25], [80, -32], [95, -42], [115, -50], [135, -54], [155, -60], [175, -63], [-170, -64], [-150, -60], [-130, -56], [-115, -45]],
  [[-115, -45], [-112, -30], [-110, -15], [-104, 0], [-104, 12], [-108, 20]],
];
export const FOSSAS = [
  [[142.5, 10.5], [145.5, 13.5], [147.5, 17], [146.5, 21], [143, 26]], // Marianas
  [[142, 30], [143, 37], [146, 42], [152, 46], [160, 52]],             // Japão-Kurilas
  [[-72, -42], [-73, -32], [-72, -22], [-77, -12], [-81, -5]],          // Peru-Chile
  [[-170, 52], [-160, 53.5], [-150, 56]],                              // Aleutas
  [[-176, -30], [-174, -22], [-173, -16]],                             // Tonga-Kermadec
];
export const llv = (lon, lat, r = 1) =>
  new THREE.Vector3(r * Math.cos(lat * D2R) * Math.sin(lon * D2R), r * Math.sin(lat * D2R), r * Math.cos(lat * D2R) * Math.cos(lon * D2R));
function amostra(linhas, passo = 1) {
  const out = [];
  for (const L of linhas) for (let i = 1; i < L.length; i++) {
    let [a0, b0] = L[i - 1], [a1, b1] = L[i];
    if (a1 - a0 > 180) a1 -= 360; else if (a0 - a1 > 180) a1 += 360;
    const n = Math.max(1, Math.ceil(Math.hypot(a1 - a0, b1 - b0) / passo));
    for (let k = 0; k < n; k++) out.push(llv(lerp(a0, a1, k / n), lerp(b0, b1, k / n)));
  }
  return out;
}
function angMin(v, pts) {
  let best = -2;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], d = v.x * p.x + v.y * p.y + v.z * p.z; if (d > best) best = d; }
  return Math.acos(Math.min(1, best)) / D2R;
}
function inPoly(x, y, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
// máscara de terra em 1° + distância até a costa (BFS em graus)
let _grade = null;
function grade() {
  if (_grade) return _grade;
  const W = 360, H = 180, terra = new Uint8Array(W * H), dist = new Float32Array(W * H).fill(1e9);
  const polys = Object.values(LAND), q = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const lon = i - 180 + 0.5, lat = j - 90 + 0.5;
    const t = lat < -66 || polys.some((p) => inPoly(lon, lat, p));
    if (t) { terra[j * W + i] = 1; dist[j * W + i] = 0; q.push(j * W + i); }
  }
  for (let h = 0; h < q.length; h++) {
    const id = q[h], i = id % W, j = (id / W) | 0, d = dist[id] + 1;
    const nb = [[(i + 1) % W, j], [(i + W - 1) % W, j], [i, j + 1], [i, j - 1]];
    for (const [a, b] of nb) { if (b < 0 || b >= H) continue; const k = b * W + a; if (dist[k] > d) { dist[k] = d; q.push(k); } }
  }
  _grade = { terra, dist, W, H };
  return _grade;
}
const _cache = new Map();
export function relevo(lon, lat, ridgePts, trenchPts) {
  const G = grade();
  const i = clamp(Math.floor(lon + 180), 0, 359), j = clamp(Math.floor(lat + 90), 0, 179), id = j * 360 + i;
  if (G.terra[id]) {
    const gelo = lat < -66 || lat > 80;
    const e = clamp(0.35 + 0.5 * fbm(lon * 0.08, lat * 0.08, 3, 3)) * (gelo ? 0.6 : 1);
    return { terra: true, gelo, prof: 0, r: 1.003 + 0.007 * e, dorsal: 0, fossa: 0 };
  }
  const v = llv(lon, lat), dl = G.dist[id];
  let d = 0.06 + 0.84 * smoothstep(0.8, 7, dl);
  d += 0.08 * fbm(lon * 0.2, lat * 0.2, 3, 7) * smoothstep(2, 6, dl);
  const dr = angMin(v, ridgePts), dt = angMin(v, trenchPts);
  const dorsal = Math.exp(-((dr / 5) ** 2)) * smoothstep(2, 7, dl);
  d -= 0.45 * dorsal;
  d += 0.08 * Math.exp(-((dr / 1.1) ** 2)) * smoothstep(2, 7, dl);
  const fossa = Math.exp(-((dt / 2.2) ** 2));
  d += 0.6 * fossa;
  return { terra: false, gelo: lat > 80, prof: d, r: 1 - 0.034 * d, dorsal, fossa };
}
export function globoSeco(scene, { det = 40 } = {}) {
  const ridgePts = amostra(DORSAIS, 1), trenchPts = amostra(FOSSAS, 0.7);
  const geo = new THREE.IcosahedronGeometry(1, det);
  const pos = geo.attributes.position, cols = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3(), cen = new THREE.Vector3(), c = new THREE.Color();
  const info = (x, y, z) => {
    const key = x.toFixed(5) + "," + y.toFixed(5) + "," + z.toFixed(5);
    let o = _cache.get(key);
    if (!o) {
      const lat = Math.asin(clamp(y, -1, 1)) / D2R, lon = Math.atan2(x, z) / D2R;
      o = relevo(lon, lat, ridgePts, trenchPts); _cache.set(key, o);
    }
    return o;
  };
  const rnd = mulberry32(11);
  for (let f = 0; f < pos.count; f += 3) {
    cen.set(0, 0, 0);
    const R = [];
    for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, f + k).normalize(); cen.add(v); R.push(info(v.x, v.y, v.z)); }
    cen.normalize();
    const lat = Math.asin(cen.y) / D2R, lon = Math.atan2(cen.x, cen.z) / D2R;
    const m = relevo(lon, lat, ridgePts, trenchPts), j = rnd() * 0.05;
    if (m.terra) {
      if (m.gelo) c.setHex(0xe9eef2);
      else if (lat > 12 && lat < 33 && lon > -15 && lon < 55) mistura(c, 0xc9a66b, 0xb38d55, j * 6);
      else mistura(c, 0x5b7038, 0x8a7d52, j * 6 + Math.max(0, Math.abs(lat) - 45) / 30);
    } else {
      // fundo exposto: plataforma clara (areia), talude, planície escura; dorsais acinzentadas, fossas quase pretas
      mistura(c, 0xc4a77a, 0x5a4a3c, smoothstep(0.1, 0.85, m.prof));
      c.lerp(_c2.setHex(0xa7a29a), clamp(m.dorsal * 1.1));
      c.lerp(_c2.setHex(0x1f1a17), m.fossa * 0.9);
      c.offsetHSL(0, 0, j - 0.025);
    }
    for (let k = 0; k < 3; k++) {
      v.fromBufferAttribute(pos, f + k).normalize().multiplyScalar(R[k].r);
      pos.setXYZ(f + k, v.x, v.y, v.z);
      cols[(f + k) * 3] = c.r; cols[(f + k) * 3 + 1] = c.g; cols[(f + k) * 3 + 2] = c.b;
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const earth = new THREE.Group();
  earth.rotation.order = "XYZ";
  const solo = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92 }));
  earth.add(solo);
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(0.94, 24, 16), new THREE.MeshBasicMaterial({ color: 0x050403 })));
  const aguaMat = new THREE.MeshStandardMaterial({ color: 0x0d3a6b, roughness: 0.28, metalness: 0.05, transparent: true, opacity: 0.94 });
  const agua = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 48), aguaMat);
  earth.add(agua);
  const setAgua = (k) => {
    const r = lerp(0.93, 1.0016, clamp(k));
    agua.scale.setScalar(r);
    agua.visible = r > 0.95;
  };
  setAgua(1);
  // nuvens finas
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf6f9fc, emissive: 0x9aa8b8, emissiveIntensity: 0.25, roughness: 0.95, flatShading: true, transparent: true, opacity: 0.5 });
  const puff = new THREE.IcosahedronGeometry(1, 1), rc = mulberry32(23), nuvens = [];
  for (let i = 0; i < 120; i++) {
    const lon = rc() * 360 - 180, lat = (rc() * 2 - 1) * 65, p = llv(lon, lat, 1.012 + rc() * 0.004);
    const m = new THREE.Mesh(puff, cloudMat); m.position.copy(p); m.lookAt(p.clone().multiplyScalar(2));
    const s = 0.006 + rc() * 0.016; m.scale.set(s * (1.5 + 2 * rc()), s * (0.5 + rc() * 0.6), s * 0.25); earth.add(m); nuvens.push(m);
  }
  // atmosfera (fresnel aditivo)
  const atmoMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCor: { value: new THREE.Color(0x6fb2ff) }, uForca: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);
      vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCor; uniform float uForca; varying vec3 vN; varying vec3 vV;
      void main(){ float fr = pow(clamp(1.0 - dot(vN, vV), 0.0, 1.0), 2.4); gl_FragColor = vec4(uCor * fr * 1.25 * uForca, 1.0); }`,
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.05, 48, 32), atmoMat);
  scene.add(earth, atmo);
  const raio = (lon, lat) => relevo(lon, lat, ridgePts, trenchPts).r;
  // costura das dorsais (tubos laranja que crescem com prog 0..1)
  let tubos = null;
  const cristas = (prog) => {
    if (!tubos) {
      tubos = DORSAIS.map((L) => {
        const pts = [];
        for (let i = 1; i < L.length; i++) {
          let [a0, b0] = L[i - 1], [a1, b1] = L[i];
          if (a1 - a0 > 180) a1 -= 360; else if (a0 - a1 > 180) a1 += 360;
          for (let k = 0; k < 6; k++) { const lo = lerp(a0, a1, k / 6), la = lerp(b0, b1, k / 6); pts.push(llv(lo, la, raio(lo, la) + 0.006)); }
        }
        const l = L[L.length - 1]; pts.push(llv(l[0], l[1], raio(l[0], l[1]) + 0.006));
        const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, 0.0055, 5, false);
        const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff8a3d }));
        earth.add(m); return m;
      });
    }
    for (const m of tubos) { const n = m.geometry.index.count; m.geometry.setDrawRange(0, Math.floor((n / 6) * clamp(prog)) * 6); m.visible = prog > 0; }
  };
  const aim = (lon, lat) => { earth.rotation.y = -lon * D2R; earth.rotation.x = lat * D2R; };
  return { earth, solo, agua, aguaMat, setAgua, atmo, atmoMat, nuvens, cloudMat, raio, cristas, aim };
}

/* ---------- relógio de 24 h (HUD) ---------- */
// hora da história em função do tempo global do vídeo (s)
export const HORAS = [[5.36, 0], [9.87, 0.2], [35.56, 2.5], [41.57, 4], [47.78, 12], [54.8, 16], [60.55, 22.6], [61.4, 24]];
export function horaEm(g) {
  if (g <= HORAS[0][0]) return 0;
  for (let i = 1; i < HORAS.length; i++) if (g <= HORAS[i][0]) {
    const [a, ha] = HORAS[i - 1], [b, hb] = HORAS[i];
    return lerp(ha, hb, (g - a) / (b - a));
  }
  return 24;
}
export function relogio(ctx, h, { x = 935, y = 292, r = 74, a = 1, brilho = 0 } = {}) {
  if (a <= 0) return;
  const H = clamp(h, 0, 24);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(6,10,18,0.66)";
  ctx.beginPath(); ctx.arc(x, y, r + 16, 0, 6.2832); ctx.fill();
  ctx.lineCap = "round";
  ctx.lineWidth = 9; ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke();
  ctx.strokeStyle = brilho > 0 ? `rgba(255,${197 + 58 * brilho},${107 + 148 * brilho},1)` : "#FFC56B";
  ctx.shadowColor = "rgba(255,197,107,0.8)"; ctx.shadowBlur = 10 + 20 * brilho;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + (H / 24) * 6.2832); ctx.stroke();
  ctx.shadowBlur = 0;
  for (let i = 0; i < 24; i++) {
    const an = -Math.PI / 2 + (i / 24) * 6.2832, l = i % 6 === 0 ? 14 : 6;
    ctx.lineWidth = i % 6 === 0 ? 3 : 1.5; ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * (r - 10), y + Math.sin(an) * (r - 10)); ctx.lineTo(x + Math.cos(an) * (r - 10 - l), y + Math.sin(an) * (r - 10 - l)); ctx.stroke();
  }
  const an = -Math.PI / 2 + (H / 24) * 6.2832;
  ctx.lineWidth = 4; ctx.strokeStyle = "#fff";
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an) * (r - 28), y + Math.sin(an) * (r - 28)); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fill();
  const hh = Math.floor(H), mm = Math.floor((H - hh) * 60);
  ctx.font = '40px "Anton", sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 6;
  ctx.fillText(String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"), x, y + 34);
  ctx.font = '600 19px "Montserrat", sans-serif'; ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("DE 24 HORAS", x, y + r + 36);
  ctx.restore();
}

/* ---------- rótulo preso a um ponto 3D ---------- */
const _v = new THREE.Vector3();
export function tela(cam, pos) {
  _v.copy(pos).project(cam);
  return { x: (_v.x * 0.5 + 0.5) * 1080, y: (-_v.y * 0.5 + 0.5) * 1920, atras: _v.z > 1 };
}
export function etiqueta(ctx, cam, pos, texto, { dx = 70, dy = -50, cor = "#ffffff", destaque = "#7cc8ff", tam = 26, a = 1, ponto = true, sub = null } = {}) {
  if (a <= 0.01) return;
  const p = tela(cam, pos);
  if (p.atras) return;
  ctx.save();
  ctx.globalAlpha = clamp(a);
  const tx = clamp(p.x + dx, 60, 1020), ty = clamp(p.y + dy, 450, 1880);
  ctx.strokeStyle = destaque; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(tx, ty); ctx.stroke();
  if (ponto) { ctx.fillStyle = destaque; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 6.2832); ctx.fill(); }
  ctx.font = `500 ${tam}px "JetBrains Mono", "Menlo", monospace`;
  const w = ctx.measureText(texto).width;
  let w2 = 0;
  if (sub) { ctx.font = `400 ${Math.round(tam * 0.7)}px "JetBrains Mono", "Menlo", monospace`; w2 = ctx.measureText(sub).width; }
  const bw = Math.max(w, w2) + 30, bh = tam + 22 + (sub ? tam * 0.75 : 0);
  const bx = clamp(dx >= 0 ? tx : tx - bw, 30, 1050 - bw), by = ty - bh / 2;
  ctx.fillStyle = "rgba(4,8,16,0.62)";
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
  ctx.fillStyle = destaque; ctx.fillRect(dx >= 0 ? bx : bx + bw - 2, by, 2, bh);
  ctx.fillStyle = cor; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.font = `500 ${tam}px "JetBrains Mono", "Menlo", monospace`;
  ctx.fillText(texto, bx + 15, by + 11 + tam / 2);
  if (sub) { ctx.font = `400 ${Math.round(tam * 0.7)}px "JetBrains Mono", "Menlo", monospace`; ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillText(sub, bx + 15, by + 15 + tam + tam * 0.3); }
  ctx.restore();
}

/* ---------- vida marinha ---------- */
const CAP = new THREE.CapsuleGeometry(1, 2, 3, 8);
CAP.translate(0, 2, 0); // base na origem, cresce para +y (altura total 4 com raio 1)
const BOLA = new THREE.SphereGeometry(1, 14, 10);
const BOLA_P = new THREE.SphereGeometry(1, 10, 7);
const CONE = new THREE.ConeGeometry(1, 1, 8);
let _cer = null;
function cerebro() {
  if (_cer) return _cer;
  const g = new THREE.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.06 * Math.sin(x * 14 + Math.sin(z * 9) * 2) * Math.cos(z * 3);
    p.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals(); _cer = g; return g;
}
export function coral(seed = 1, tipo = "galho", cor = 0xe8743b) {
  const r = mulberry32(seed), group = new THREE.Group();
  const mat = TOON({ color: cor, roughness: 0.8 }), c0 = new THREE.Color(cor);
  const add = (geo, s, p, rot) => { const m = new THREE.Mesh(geo, mat); m.scale.set(...s); m.position.set(...p); if (rot) m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; group.add(m); return m; };
  if (tipo === "galho") {
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.28 + r(), inc = 0.25 + r() * 0.45, h = 0.22 + r() * 0.2;
      const m = add(CAP, [0.11, h, 0.11], [Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08], [Math.sin(a) * inc, 0, -Math.cos(a) * inc]);
      const tip = new THREE.Vector3(0, 4 * h, 0).applyEuler(m.rotation).add(m.position);
      for (let k = 0; k < 2; k++) { const b = a + (k ? 0.6 : -0.6), inc2 = inc + 0.35; add(CAP, [0.08, h * 0.6, 0.08], [tip.x * 0.92, tip.y * 0.92, tip.z * 0.92], [Math.sin(b) * inc2, 0, -Math.cos(b) * inc2]); }
    }
  } else if (tipo === "cerebro") {
    add(cerebro(), [0.9, 0.65, 0.9], [0, -0.05, 0]);
  } else if (tipo === "leque") {
    add(BOLA, [0.9, 1.1, 0.07], [0, 1.0, 0]);
    add(CAP, [0.06, 0.2, 0.06], [0, 0, 0]);
  } else {
    for (let i = 0; i < 5; i++) { const a = r() * 6.28, d = r() * 0.3; add(CAP, [0.13, 0.15 + r() * 0.25, 0.13], [Math.cos(a) * d, 0, Math.sin(a) * d], [(r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4]); }
  }
  const branco = new THREE.Color(0xf1ede3), morto = new THREE.Color(0x9c9a88);
  const branquear = (k, m2 = 0) => { mat.color.copy(c0).lerp(branco, clamp(k)).lerp(morto, clamp(m2)); };
  return { group, mat, branquear };
}
export function peixe(cor = 0xd9a441, seed = 1) {
  const r = mulberry32(seed), group = new THREE.Group(), mat = TOON({ color: cor, roughness: 0.35, metalness: 0.15 });
  const barriga = TOON({ color: 0xe9e4d8, roughness: 0.4 });
  const add = (geo, m, s, p, rot) => { const o = new THREE.Mesh(geo, m); o.scale.set(...s); o.position.set(...p); if (rot) o.rotation.set(...rot); o.castShadow = true; group.add(o); return o; };
  add(BOLA_P, mat, [0.5, 0.2 + r() * 0.05, 0.11], [0, 0, 0]);
  add(BOLA_P, barriga, [0.42, 0.12, 0.1], [0.02, -0.07, 0]);
  const tail = new THREE.Group(); tail.position.set(-0.45, 0, 0); group.add(tail);
  const tc = new THREE.Mesh(CONE, mat); tc.scale.set(0.2, 0.3, 0.03); tc.rotation.z = Math.PI / 2; tc.position.x = -0.1; tail.add(tc);
  add(CONE, mat, [0.16, 0.18, 0.02], [0.02, 0.2, 0], [0, 0, -0.5]);
  add(BOLA_P, TOON({ color: 0x0a0a0a, roughness: 0.1 }), [0.04, 0.04, 0.03], [0.34, 0.04, 0.09]);
  add(BOLA_P, TOON({ color: 0x0a0a0a, roughness: 0.1 }), [0.04, 0.04, 0.03], [0.34, 0.04, -0.09]);
  return { group, tail, mat };
}

/* ---------- espaço documental com terra.js (Terra NASA, céu, Sol) ---------- */
// TERRA = módulo terra.js importado pela cena. solDir = de onde vem a luz. Devolve { E, C, SOL, dir }.
export async function espacoDoc(st, TERRA, { solDir = [-0.8, 0.3, 0.55], solDist = 420, solRaio = 7, via = 0.55 } = {}) {
  const S = st.scene;
  S.background = new THREE.Color(0x000000); S.fog = null; S.environment = null;
  st.hemi.intensity = 0.05; st.key.intensity = 0.0; st.rim.intensity = 0.0; st.key.castShadow = false;
  const C = TERRA.createCeu({ seed: 7, n: 5000, via }); S.add(C);
  const E = await TERRA.createTerra({ raio: 1 }); S.add(E.group);
  const dir = new THREE.Vector3(...solDir).normalize();
  E.sol.copy(dir);
  const SOL = TERRA.createSol({ raio: solRaio, halo: 60 }); SOL.group.position.copy(dir).multiplyScalar(solDist); S.add(SOL.group);
  st.bloom = 0.7;
  return { E, C, SOL, dir };
}
// costura das dorsais sobre a Terra do terra.js (tubos laranja que crescem com prog 0..1)
export function dorsaisTerra(E, { cor = 0xff8a4c, r = 1.004, raio = 0.0045 } = {}) {
  const tubos = DORSAIS.map((L) => {
    const pts = [];
    for (let i = 1; i < L.length; i++) {
      let [a0, b0] = L[i - 1], [a1, b1] = L[i];
      if (a1 - a0 > 180) a1 -= 360; else if (a0 - a1 > 180) a1 += 360;
      for (let k = 0; k < 6; k++) pts.push(E.ponto(lerp(a0, a1, k / 6), lerp(b0, b1, k / 6), r));
    }
    const l = L[L.length - 1]; pts.push(E.ponto(l[0], l[1], r));
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, raio, 5, false), new THREE.MeshBasicMaterial({ color: cor, toneMapped: false }));
    E.earth.add(m); return m;
  });
  return (prog) => { for (const m of tubos) { const n = m.geometry.index.count; m.geometry.setDrawRange(0, Math.floor((n / 6) * clamp(prog)) * 6); m.visible = prog > 0; } };
}
