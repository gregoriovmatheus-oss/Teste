// lowpoly.js: estilo R11. Personagens e objetos 3D low-poly facetados (flatShading),
// contorno fino por casco invertido, olhos grandes expressivos. Determinístico (sem Math.random).
import * as THREE from "../three.module.js";
import { sharedRenderer } from "./toy.js";

export const COR = {
  pele: 0xb07c62, peleSombra: 0x8a5a42, cabelo: 0x4a2c18, barba: 0x3e2818,
  jaqueta: 0xd9a21e, camisa: 0x2c3442, jeans: 0x23324f, tenis: 0x1c1c22,
  esclera: 0xf2ede4, iris: 0x6b4423, pupila: 0x0d0805, contorno: 0x120c08,
};

export function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// facetas com variação de tom estável (hash da normal da faceta no espaço do objeto), como pintura
function pintado(m, k = 0.16, pele = false, tecido = false) {
  m.onBeforeCompile = (sh) => {
    if (tecido) sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        { float fr = 1.0 - abs(dot(normal, normalize(vViewPosition))); totalEmissiveRadiance += (diffuseColor.rgb * 0.6 + 0.08) * 0.35 * fr * fr * fr * fr; }`);
    if (pele) sh.fragmentShader = sh.fragmentShader.replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        { float fr = 1.0 - abs(dot(normal, normalize(vViewPosition)));
          totalEmissiveRadiance += diffuseColor.rgb * vec3(1.0, 0.45, 0.35) * (0.04 + 0.4 * fr * fr * fr); }`);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vObj;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
      .replace("#include <normal_fragment_maps>", k <= 0 ? "#include <normal_fragment_maps>" : `#include <normal_fragment_maps>
        { vec3 fn = normalize(cross(dFdx(vObj), dFdy(vObj))); fn *= sign(fn.y + fn.x * 0.37 + fn.z * 0.11 + 1e-4);
          float hz = fract(sin(dot(floor(fn * 9.0 + 0.5), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          diffuseColor.rgb *= 1.0 + (hz - 0.5) * ${k.toFixed(3)}; }`);
  };
  m.customProgramCacheKey = () => "pintado" + k + (pele ? "p" : "") + (tecido ? "t" : "");
  return m;
}
// estilo do personagem: "facetado" (padrão do canal: facetas pintadas) ou "liso" (orgânico). Troque com LOWPOLY.estilo("liso") antes de criar as pessoas.
let ESTILO = "facetado"; export const estilo = (e) => { ESTILO = e; }; const FAC = () => ESTILO === "facetado";
export const matPeleLiso = (c, rough = 0.55) => FAC() ? pintado(new THREE.MeshStandardMaterial({ color: c, roughness: 0.62, metalness: 0, flatShading: true }), 0.1, true) : pintado(new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0 }), 0, true);
export const matCabelo = (c) => FAC() ? pintado(new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0, flatShading: true }), 0.14) : pintado(new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0.05 }), 0, false, true);
export const matPele = (c, rough = 0.62) => pintado(new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, flatShading: true }), 0.1, true);
export const matTecido = (c, rough = 0.85) => pintado(new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, flatShading: FAC() }), FAC() ? 0.16 : 0, false, true);
export const mat = (c, rough = 0.78, extra = {}) => pintado(new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, flatShading: true, ...extra }));
const matContorno = new THREE.MeshBasicMaterial({ color: COR.contorno, side: THREE.BackSide });

// contorno pela normal (casco empurrado ao longo da normal suave): não vaza em áreas côncavas como as órbitas
export function contornoNormal(m, k = 0.012) {
  const g = m.geometry.clone(); liso(g); const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * k, p.getY(i) + n.getY(i) * k, p.getZ(i) + n.getZ(i) * k);
  g.deleteAttribute("color"); const c = new THREE.Mesh(g, matContorno); c.renderOrder = -1; m.add(c); return m;
}
// casco invertido = traço de ilustração
export function contorno(m, k = 0.025) {
  const c = new THREE.Mesh(m.geometry, matContorno);
  c.scale.setScalar(1 + k); c.renderOrder = -1; m.add(c); return m;
}

// esfera facetada deformada por uma função f(v) que move o vértice (vértices repetidos recebem o mesmo deslocamento)
export function facetado(detalhe, f, seed = 1, ruido = 0.025) {
  const g = new THREE.IcosahedronGeometry(1, detalhe);
  const p = g.attributes.position, v = new THREE.Vector3();
  const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 13.3) * 43758.5453; return s - Math.floor(s); };
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = (hash(+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)) - 0.5) * ruido;
    v.multiplyScalar(1 + n); f(v); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}

const gauss = (d2, s) => Math.exp(-d2 / (s * s));
export function liso(g) {
  const p = g.attributes.position; if (!g.attributes.normal) g.computeVertexNormals(); const n = g.attributes.normal, acc = new Map(), k = (i) => `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) { a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2); const f = b.clone().sub(a).cross(c.clone().sub(a));
    for (let j = 0; j < 3; j++) { const key = k(i + j); const v = acc.get(key) || new THREE.Vector3(); v.add(f); acc.set(key, v); } }
  for (let i = 0; i < p.count; i++) { const v = acc.get(k(i)).clone().normalize(); n.setXYZ(i, v.x, v.y, v.z); }
  n.needsUpdate = true; return g;
}

// ===== cabeça R11 (unidades da cabeça: raio ~1, rosto para +z) =====
// crânio esculpido (v6): detalhe 3, mandíbula com ângulo, queixo, maçãs altas, arco das sobrancelhas, ponte do nariz, têmporas e
// boca levemente projetada. fem: mandíbula e arco mais suaves. Variação por seed (largura da mandíbula, queixo, maçãs).
const _crCache = new Map();
function geoCranio(seed, fem = false) {
  const key = seed + (fem ? "f" : "m") + ESTILO; if (_crCache.has(key)) return _crCache.get(key).clone();
  const r = mulberry32(seed * 31 + 7), mand = (fem ? 0.6 : 1) * (0.85 + r() * 0.35), qx = 0.8 + r() * 0.4, mac = 0.8 + r() * 0.4, arco = fem ? 0.45 : 0.9 + r() * 0.3;
  const g = facetado(FAC() ? 2 : 3, (v) => {
    const { x, y, z } = v, ax = Math.abs(x), sx = Math.sign(x) || 1, fr = Math.max(0, z);
    v.x *= 0.82; v.y *= 1.2; v.z *= 0.98;
    // perfil de largura: estreita até o queixo, mas segura a mandíbula (ângulo atrás-embaixo)
    if (y < -0.1) { const k = Math.min(1, (-y - 0.1) / 0.9); v.x *= 1 - 0.46 * k ** 1.25; if (z < 0.2) v.z *= 1 - 0.5 * k; }
    v.x += sx * 0.13 * mand * gauss((ax - 0.62) ** 2 * 7 + (y + 0.58) ** 2 * 14 + (z - 0.15) ** 2 * 5, 0.6);            // ângulo da mandíbula
    if (z > 0.55) v.z = 0.55 + (v.z - 0.55) * 0.6;                                                                       // rosto mais plano
    if (z > 0) {
      v.x += sx * 0.12 * mac * gauss((ax - 0.64) ** 2 * 12 + (y + 0.02) ** 2 * 14, 0.6) * fr; v.z += 0.05 * mac * gauss((ax - 0.5) ** 2 * 14 + (y + 0.05) ** 2 * 16, 0.6);                            // maçãs altas
      v.x -= sx * 0.08 * gauss((ax - 0.62) ** 2 * 10 + (y + 0.38) ** 2 * 16, 0.6) * fr; v.z -= 0.04 * gauss((ax - 0.45) ** 2 * 14 + (y + 0.36) ** 2 * 16, 0.6);                                   // sombra sob a maçã
      v.z -= 0.12 * gauss((ax - 0.32) ** 2 * 18 + (y - 0.1) ** 2 * 22, 0.6);                                              // órbitas
      v.z += 0.05 * gauss(x * x * 2 + (y - 0.45) ** 2 * 18, 0.6);                                                         // testa
      v.z += 0.09 * arco * gauss(x * x * 1.6 + (y - 0.29) ** 2 * 55, 0.6) * (ax < 0.62 ? 1 : 0.4);                       // arco das sobrancelhas
      v.z += 0.05 * gauss(x * x * 70, 0.6) * gauss((y - 0.08) ** 2 * 18, 0.7);                                           // ponte do nariz
      v.z += 0.045 * gauss(x * x * 4 + (y + 0.5) ** 2 * 12, 0.6);                                                         // boca projetada
      v.z += 0.13 * qx * gauss(x * x * 7 + (y + 0.86) ** 2 * 22, 0.6);                                                    // queixo
      if (y < -0.75) v.y -= 0.06 * z;
      if (y < -0.9) v.y = -0.96 - (v.y + 0.96) * 0.3;                                                                    // base do queixo reta
    }
    v.x -= sx * 0.05 * gauss((y - 0.38) ** 2 * 9 + (z - 0.3) ** 2 * 6, 0.6) * (ax > 0.45 ? 1 : 0);                        // têmporas
    if (z < -0.2) v.y += 0.04 * gauss((y - 0.1) ** 2 * 6, 0.7);                                                         // nuca arredondada
  }, seed, FAC() ? 0.03 : 0.004);
  liso(g); _crCache.set(key, g); return g.clone();
}
// nariz esculpido: ponte fina que alarga até a ponta arredondada
function geoNariz(seed, fem) {
  const r = mulberry32(seed * 53 + 2), lg = (fem ? 0.85 : 1) * (0.9 + r() * 0.25), bw = 0.8 + r() * 0.4;
  return facetado(FAC() ? 1 : 2, (v) => { const t = (1 - v.y) / 2;                                                                      // 0 em cima, 1 na ponta
    v.x *= (0.055 + 0.075 * t ** 1.5 + 0.05 * Math.max(0, t - 0.7) / 0.3 * (v.z < 0.3 ? 1 : 0.4)) * bw; v.y *= 0.28 * lg; v.z = v.z * (0.08 + 0.05 * t) + 0.15 * t * t * lg; }, seed + 77, 0.003);
}
function casca(geo, f, fora = 1.05, borda = 0.07, dentro = 0.94) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = Math.min(1, Math.max(0, (f(x, y, z) + borda) / (2 * borda))), e = k * k * (3 - 2 * k), sc = dentro + (fora - dentro) * e;
    p.setXYZ(i, x * sc, y * sc, z * sc); }
  return liso(geo);
}
// casca aberta: só os triângulos com f > 0, afastada do crânio (fora) e descendo até "base" na borda. A borda segue a malha fina (linha limpa, sem serrilhado).
function cascaAberta(geo, f, fora = 1.06, borda = 0.12, base = 1.025) {
  const p = geo.attributes.position, out = [];
  for (let i = 0; i < p.count; i += 3) { let c = 0; for (let j = 0; j < 3; j++) c += f(p.getX(i + j), p.getY(i + j), p.getZ(i + j)); if (c / 3 <= 0) continue;
    for (let j = 0; j < 3; j++) { const x = p.getX(i + j), z = p.getZ(i + j); let y = p.getY(i + j); for (let it = 0; it < 4; it++) { const fv = f(x, y, z); if (fv >= 0) break; y -= fv; }   // borda: sobe o vértice até a linha (contorno liso)
      const k = Math.min(1, Math.max(0, f(x, y, z) / borda)), sc = base + (fora - base) * k * k * (3 - 2 * k); out.push(x * sc, y * sc, z * sc); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3)); return liso(g);
}
// pinta cada vértice com um multiplicador de cor f(x,y,z) -> [r,g,b] (maquiagem natural: rubor, olheira, sombra). Custo zero no render.
function colorir(geo, f) {
  const p = geo.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const m = f(p.getX(i), p.getY(i), p.getZ(i)); c[i * 3] = m[0]; c[i * 3 + 1] = m[1]; c[i * 3 + 2] = m[2]; }
  geo.setAttribute("color", new THREE.BufferAttribute(c, 3)); return geo;
}
const _mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
// mapa de tons da pele (coordenadas do crânio): rubor nas maçãs e no nariz, olheira, testa mais clara, sombra sob o queixo e na nuca, barba azulada
function tonsPele(fem, barba) {
  return (x, y, z) => { const ax = Math.abs(x); let m = [1, 1, 1];
    m = _mix3(m, [1.06, 0.93, 0.91], 0.6 * gauss((ax - 0.5) ** 2 * 7 + (y + 0.18) ** 2 * 9, 0.6) * (z > 0 ? 1 : 0) * (fem ? 1.2 : 1));     // rubor
    m = _mix3(m, [0.88, 0.82, 0.84], 0.4 * gauss((ax - 0.3) ** 2 * 18 + (y + 0.08) ** 2 * 50, 0.6) * (z > 0.3 ? 1 : 0));                       // olheira / órbita
    m = _mix3(m, [0.9, 0.85, 0.85], 0.3 * gauss((ax - 0.18) ** 2 * 30 + (y - 0.24) ** 2 * 60, 0.6) * (z > 0.3 ? 1 : 0));                     // canto interno sob a sobrancelha
    m = _mix3(m, [1.05, 1.04, 1.02], 0.6 * gauss(x * x * 3 + (y - 0.5) ** 2 * 6, 0.6) * (z > 0 ? 1 : 0));                                     // testa
    m = _mix3(m, [1.05, 0.92, 0.9], 0.5 * gauss(x * x * 8 + (y + 0.5) ** 2 * 18, 0.6) * (z > 0.4 ? 1 : 0));                                   // em volta da boca
    if (barba && !fem) m = _mix3(m, [0.86, 0.86, 0.92], 0.55 * Math.min(1, Math.max(0, (-y - 0.35) * 4)) * (z > -0.1 ? 1 : 0));             // sombra de barba
    m = _mix3(m, [0.78, 0.74, 0.76], Math.min(1, Math.max(0, (-y - 0.75) * 3)) * (z < 0.5 ? 1 : 0.4));                                        // sob o queixo
    m = _mix3(m, [0.9, 0.86, 0.86], Math.min(1, Math.max(0, -z - 0.2) * 1.5));                                                                // nuca
    return m; };
}
function recorte(geo, teste, escala = 1) {
  const p = geo.attributes.position, out = [];
  for (let i = 0; i < p.count; i += 3) {
    const t = [0, 1, 2].map((k) => [p.getX(i + k), p.getY(i + k), p.getZ(i + k)]);
    if (t.every((q) => teste(...q))) for (const q of t) out.push(q[0] * escala, q[1] * escala, q[2] * escala);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3)); g.computeVertexNormals(); return g;
}
// íris pintada (v8): centro claro, fibras radiais, anel escuro na borda (limbo) e sombra da pálpebra em cima. Uma textura por cor.
const _irisTex = new Map();
function texIris(cor) {
  if (_irisTex.has(cor)) return _irisTex.get(cor);
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"), C = new THREE.Color(cor).getRGB({}, THREE.SRGBColorSpace);
  const hex = (k) => `rgb(${Math.min(255, C.r * 255 * k) | 0},${Math.min(255, C.g * 255 * k) | 0},${Math.min(255, C.b * 255 * k) | 0})`;
  const r = g.createRadialGradient(128, 128, 20, 128, 128, 128); r.addColorStop(0, hex(1.7)); r.addColorStop(0.4, hex(1.55)); r.addColorStop(0.72, hex(1.15)); r.addColorStop(0.88, hex(0.8)); r.addColorStop(0.96, hex(0.4)); r.addColorStop(1, hex(0.25));
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const rnd = mulberry32(cor % 9973 + 5); g.lineWidth = 1.6;
  for (let k = 0; k < 140; k++) { const a = rnd() * Math.PI * 2, r0 = 22 + rnd() * 20, r1 = 70 + rnd() * 50; g.strokeStyle = rnd() < 0.5 ? hex(1.9) : hex(0.7); g.globalAlpha = 0.12 + rnd() * 0.15;
    g.beginPath(); g.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0); g.lineTo(128 + Math.cos(a + 0.08) * r1, 128 + Math.sin(a + 0.08) * r1); g.stroke(); }
  g.globalAlpha = 1; const sh = g.createLinearGradient(0, 0, 0, 256); sh.addColorStop(0, "rgba(0,0,0,0.4)"); sh.addColorStop(0.35, "rgba(0,0,0,0)"); g.fillStyle = sh; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; _irisTex.set(cor, t); return t;
}
// calota esférica virada para +z (raio R, abertura = fração do raio), com UV plano (para a textura da íris)
function calota(R, frac, seg = 24) {
  const g = new THREE.SphereGeometry(R, seg, 8, 0, Math.PI * 2, 0, Math.asin(frac)); g.rotateX(Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2 * R * frac) + 0.5, p.getY(i) / (2 * R * frac) + 0.5);
  return g;
}
function olhoR11(r, cIris = COR.iris, cPele = COR.pele, cilios = 1) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(colorir(new THREE.SphereGeometry(r, 18, 14), (x, y, z) => { const k = Math.max(0, z / r); const e = 0.62 + 0.38 * k ** 0.7 - 0.12 * Math.max(0, y / r); return [e * 1.02, e * 0.97, e * 0.95]; }), new THREE.MeshStandardMaterial({ color: COR.esclera, roughness: 0.18, vertexColors: true })));   // esclera sombreada nas bordas
  const globo = new THREE.Group(); g.add(globo);
  const iris = new THREE.Mesh(calota(r * 1.004, 0.62), new THREE.MeshStandardMaterial({ map: texIris(cIris), roughness: 0.25 })); globo.add(iris);
  const anel = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial()); anel.visible = false;   // o limbo já está na textura
  const pupG = new THREE.Group(); globo.add(pupG); const pup = new THREE.Mesh(calota(r * 1.008, 0.25, 18), new THREE.MeshBasicMaterial({ color: COR.pupila })); pupG.add(pup);
  // córnea: cúpula transparente e brilhante sobre a íris (reflexo vivo)
  const cor = new THREE.Mesh(new THREE.SphereGeometry(r * 0.66, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.12 }));
  cor.rotation.x = Math.PI / 2; cor.scale.z = 0.35; cor.position.z = r * 0.93; cor.visible = false;
  const bri = new THREE.Mesh(new THREE.CircleGeometry(r * 0.11, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); bri.position.set(r * 0.22, r * 0.24, r * 1.0); globo.add(bri);
  const bri2 = new THREE.Mesh(new THREE.CircleGeometry(r * 0.05, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); bri2.position.set(-r * 0.2, -r * 0.22, r * 0.995); globo.add(bri2);
  // pálpebra de cima: casca lisa de pele, borda grossa (espessura da pálpebra), cílios e sombra que ela projeta no olho
  const pm = matPeleLiso(cPele), sup = new THREE.Group(); g.add(sup);
  sup.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.045, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), pm));
  const borda = new THREE.Mesh(new THREE.TorusGeometry(r * 1.03, r * 0.035, 6, 20, Math.PI), pm); borda.rotation.x = Math.PI / 2; sup.add(borda);
  const cil = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, r * 0.05 * cilios, 4, 20, Math.PI), new THREE.MeshBasicMaterial({ color: 0x120804 })); cil.rotation.x = Math.PI / 2; cil.position.y = r * 0.01; cil.scale.z = 1.6; sup.add(cil);
  if (cilios > 1.2) { const cp = new THREE.Mesh(new THREE.TorusGeometry(r * 1.13, r * 0.05, 3, 12, Math.PI * 0.45), cil.material); cp.rotation.set(Math.PI / 2 - 0.35, 0, -0.05); cp.position.set(-r * 0.02, r * 0.04, 0); sup.add(cp); }   // ponta dos cílios para fora
  const somb = new THREE.Mesh(new THREE.SphereGeometry(r * 1.004, 20, 3, 0, Math.PI * 2, Math.PI / 2, Math.PI * 0.16), new THREE.MeshBasicMaterial({ color: 0x1a0c06, transparent: true, opacity: 0.38, depthWrite: false })); sup.add(somb);
  const inf = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 20, 4, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), pm); const infP = new THREE.Group(); g.add(infP); infP.add(inf);
  const lin = new THREE.Mesh(new THREE.TorusGeometry(r * 1.03, r * 0.025, 3, 16, Math.PI * 0.8), new THREE.MeshBasicMaterial({ color: 0x3a1c12, transparent: true, opacity: 0.5 })); lin.rotation.set(Math.PI / 2 + 0.95, 0, Math.PI * 1.1); infP.add(lin);   // linha d'água / cílios de baixo
  g.scale.set(1.12, 0.92, 1);   // formato amendoado
  return { g, globo, sup, pupila(k) { pup.scale.set(k, k, 1); }, olhar(ax, ay) { globo.rotation.set(-ay, ax, 0); }, baixo(k) { infP.rotation.x = -0.55 * k; }, abrir(k) { sup.rotation.x = k > 0.3 ? -0.25 - 1.15 * k : 0.4 + (-0.595 - 0.4) * (k / 0.3); globo.visible = k > 0.1; } };   // fechado: esconde a íris
}
function cabecaR11({ seed, pele, cabelo, barba, iris = COR.iris, fem = false, cabeloTipo = null, kid = false }) {
  const H = new THREE.Group(), pm = matPeleLiso(pele), pmC = matPeleLiso(pele); pmC.vertexColors = true;
  const cr = new THREE.Mesh(colorir(geoCranio(seed, fem), tonsPele(fem, barba)), pmC); contornoNormal(cr, 0.014); H.add(cr);
  // nariz: pirâmide com aresta para frente + asas
  const nz = new THREE.Mesh(colorir(liso(geoNariz(seed, fem)), (x, y, z) => _mix3([1, 1, 1], [1.1, 0.88, 0.86], Math.min(1, Math.max(0, -y * 3 + 0.2)))), pmC); nz.position.set(0, -0.08, 0.74); H.add(nz);
  const ponta = new THREE.Mesh(liso(facetado(1, (v) => { v.y *= 0.8; }, seed + 78, 0.01)), pm); ponta.scale.set(fem ? 0.062 : 0.074, fem ? 0.05 : 0.058, fem ? 0.055 : 0.062); ponta.position.set(0, -0.3, 0.875); nz.userData.ponta = ponta; H.add(ponta);
  const vr = mulberry32(seed * 13 + 1); const nzk = (fem ? 0.88 : 0.95) + vr() * 0.2; nz.scale.multiplyScalar(nzk); ponta.scale.multiplyScalar(nzk);
  if (kid) { nz.scale.multiplyScalar(0.7); ponta.scale.multiplyScalar(0.78); ponta.position.sub(nz.position).multiplyScalar(0.7).add(nz.position); ponta.position.z += 0.02; }   // criança: nariz curto e arrebitado cr.scale.set((fem ? 0.94 : 1) + (vr() - 0.5) * 0.1, 1 + (vr() - 0.5) * 0.08, 1);
  const nm = new THREE.MeshBasicMaterial({ color: 0x2a120a });
  for (const s of [1, -1]) { const a = new THREE.Mesh(liso(facetado(1, (v) => { v.z *= 0.8; }, seed + s, 0.01)), pm); a.visible = !FAC(); a.scale.set(0.058, 0.042, 0.04); a.position.set(s * (fem ? 0.066 : 0.076), -0.31, 0.765); a.rotation.y = s * 0.4; H.add(a);
    const n = new THREE.Mesh(new THREE.CircleGeometry(0.03, 6), nm); n.scale.set(1.3, 0.6, 1); n.position.set(s * 0.045, -0.365, 0.86); n.rotation.x = Math.PI / 2 + 0.5; H.add(n); }
  // orelhas
  for (const s of [1, -1]) { const o = new THREE.Mesh(liso(facetado(2, (v) => { v.x *= 0.35; v.y *= 1.4; v.z *= 0.68; v.z -= 0.25 * Math.max(0, v.y); }, seed + 9 + s, 0.01)), pm); contorno(o, 0.04); o.scale.setScalar(0.2); o.position.set(s * 0.79, -0.02, -0.1); o.rotation.y = s * 0.25; H.add(o);
    const ci = new THREE.Mesh(liso(facetado(2, (v) => { v.x *= 0.2; v.y *= 1.1; v.z *= 0.45; }, seed + 19 + s, 0.01)), matPeleLiso(new THREE.Color(pele).multiplyScalar(0.72))); ci.scale.setScalar(0.135); ci.position.set(s * 0.862, -0.04, -0.065); ci.rotation.y = s * 0.25; H.add(ci); }
  // bochechas (sobem no sorriso e na dor) e rugas entre as sobrancelhas (raiva/dor)
  const boch = [1, -1].map((s) => { const b = new THREE.Mesh(liso(facetado(2, (v) => { v.z *= 0.5; }, seed + 40 + s, 0.01)), pm); b.scale.set(0.2, 0.13, 0.12); b.position.set(s * 0.38, -0.2, 0.6); H.add(b); return b; });
  const rugas = new THREE.Group(); rugas.position.set(0, 0.27, 0.79); H.add(rugas);
  for (const s of [1, -1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.13, 0.01), new THREE.MeshBasicMaterial({ color: 0x4a2414 })); r.position.x = s * 0.05; r.rotation.z = s * 0.15; rugas.add(r); }
  // rubor (bochechas vermelhas), lágrima (desce do olho), suor (gota na testa)
  const rub = [1, -1].map((s) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.14, 10), new THREE.MeshBasicMaterial({ color: 0xe0504a, transparent: true, opacity: 0, depthWrite: false })); m.position.set(s * 0.42, -0.18, 0.66); m.rotation.y = s * 0.45; H.add(m); return m; });
  const agua = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x335577, emissiveIntensity: 0.3 });
  const lag = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), agua); lag.scale.set(0.8, 1.3, 0.6); H.add(lag);
  const suor = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), agua); suor.scale.set(0.8, 1.3, 0.6); H.add(suor);
  // olhos
  const olhos = [1, -1].map((s) => { const o = olhoR11(0.15 * (fem ? 1.06 : 1), iris, pele, fem ? 1.9 : 1); o.g.position.set(s * 0.32, kid ? 0.06 : 0.1, 0.62); if (kid) o.g.scale.multiplyScalar(1.12); o.g.rotation.y = s * 0.16; H.add(o.g); return o; });
  const vincoM = new THREE.MeshBasicMaterial({ color: 0x3a1a10, transparent: true, opacity: 0.45, depthWrite: false });
  for (const s of [1, -1]) { const v = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.008, 3, 10, Math.PI * 0.8), vincoM); v.position.set(s * 0.32, 0.12, 0.7); v.rotation.set(-0.35, s * 0.16, Math.PI * 0.1); H.add(v);
    const ol = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.007, 3, 8, Math.PI * 0.6), vincoM); ol.position.set(s * 0.32, 0.05, 0.71); ol.rotation.set(0.3, s * 0.16, Math.PI * 1.2); H.add(ol); }
  // sobrancelhas grossas (2 prismas cada)
  const bm = new THREE.MeshStandardMaterial({ color: cabelo, roughness: 0.9, flatShading: FAC() }), somb = [1, -1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * 0.33, 0.36, 0.74); H.add(g);
    const sg = liso(facetado(2, (v) => { const u = (v.x * s + 1) / 2; v.x *= 0.21; v.y *= 0.068 * (1.15 - 0.7 * u ** 1.5) * (fem ? 0.75 : 1); v.z *= 0.045; v.y += 0.035 * Math.sin(Math.PI * u) - 0.03 * u * u; v.z -= 0.04 * u * u; }, seed + 120 + s, 0.003));
    const a = new THREE.Mesh(sg, bm); a.position.x = s * 0.015; contorno(a, 0.05); g.add(a); return g;
  });
  // boca v8: lábios contínuos (uma peça cada) que se deformam por vértice a cada quadro: sorriso sobe os cantos, tristeza desce,
  // abertura desce o lábio de baixo com o maxilar. Interior (cavidade, dentes, língua) cabe sempre no vão entre os lábios.
  const boca = new THREE.Group(); boca.position.set(0, kid ? -0.5 : -0.53, kid ? 0.735 : 0.76); if (kid) boca.scale.setScalar(0.85); H.add(boca);
  const corL = new THREE.Color(pele).lerp(new THREE.Color(fem ? 0xc04a50 : 0xa85a52), fem ? 0.55 : 0.4);
  const lm = new THREE.MeshStandardMaterial({ color: corL, roughness: fem ? 0.3 : 0.45, flatShading: FAC() }), lmI = new THREE.MeshStandardMaterial({ color: corL.clone().multiplyScalar(1.08), roughness: fem ? 0.25 : 0.4, flatShading: FAC() });
  const LW = 0.225, ES = fem ? 0.038 : 0.032, EI = fem ? 0.05 : 0.044;
  const geoLabio = (sd, baixo) => facetado(2, (v) => { const u = Math.abs(v.x), esp = baixo ? 1 - 0.8 * u * u : 0.9 - 0.65 * u * u;
    v.y *= esp; if (!baixo && v.y > 0) v.y += 0.3 * gauss((u - 0.22) ** 2 * 60, 0.6) - 0.18 * gauss(u * u * 150, 0.6); if (baixo && v.y < 0) v.y *= 1.1;
    v.z = v.z * (1 - 0.55 * u * u) - 0.55 * u * u; }, sd, 0.002);
  // malha deformável: guarda a base e os grupos de vértices iguais (para normais suaves a cada quadro)
  const deformavel = (geo, mt) => { const p = geo.attributes.position, base = Float32Array.from(p.array), gr = new Map();
    for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`; if (!gr.has(k)) gr.set(k, []); gr.get(k).push(i); }
    const grupos = [...gr.values()], m = new THREE.Mesh(geo, mt), a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), fn = new Float32Array(p.count * 3);
    m.userData.aplica = (f) => { for (let i = 0; i < p.count; i++) { const o = f(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]); p.setXYZ(i, o[0], o[1], o[2]); }
      p.needsUpdate = true; fn.fill(0);
      for (let i = 0; i < p.count; i += 3) { a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2); b.sub(a); c.sub(a); b.cross(c); for (let j = 0; j < 3; j++) { fn[(i + j) * 3] = b.x; fn[(i + j) * 3 + 1] = b.y; fn[(i + j) * 3 + 2] = b.z; } }
      const n = geo.attributes.normal; for (const g of grupos) { let x = 0, y = 0, z = 0; for (const i of g) { x += fn[i * 3]; y += fn[i * 3 + 1]; z += fn[i * 3 + 2]; } const l = Math.hypot(x, y, z) || 1; for (const i of g) n.setXYZ(i, x / l, y / l, z / l); }
      n.needsUpdate = true; geo.computeBoundingSphere(); };
    return m; };
  const labS = deformavel(geoLabio(seed + 3, false), lm), labI = deformavel(geoLabio(seed + 6, true), lmI); boca.add(labS, labI);
  const cg = document.createElement("canvas"); cg.width = cg.height = 64; { const x = cg.getContext("2d"), r = x.createRadialGradient(32, 40, 2, 32, 32, 32); r.addColorStop(0, "#4a1412"); r.addColorStop(0.6, "#22080a"); r.addColorStop(1, "#100304"); x.fillStyle = r; x.fillRect(0, 0, 64, 64); }
  const abre = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cg) })); abre.position.z = 0.012; boca.add(abre);
  const lingua = new THREE.Mesh(liso(facetado(2, (v) => { v.z *= 0.35; if (v.y > 0.2) v.y = 0.2 + (v.y - 0.2) * 0.3; }, seed + 8, 0.003)), new THREE.MeshStandardMaterial({ color: 0xa8444a, roughness: 0.35 })); lingua.position.z = 0.016; boca.add(lingua);
  const arco = (w, h) => { const g = new THREE.BoxGeometry(w, h, 0.016, 12, 2, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / (w / 2); p.setZ(i, p.getZ(i) - 0.008 * x * x); p.setY(i, p.getY(i) * (1 - 0.3 * x * x)); } g.computeVertexNormals(); return g; };
  const mD = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.3 });
  const dentes = new THREE.Mesh(arco(0.27, 0.05), mD); dentes.position.z = 0.022; boca.add(dentes);
  const dentesI = new THREE.Mesh(arco(0.22, 0.04), mD); dentesI.position.z = 0.018; boca.add(dentesI);
  // sulco nasolabial (aparece no sorriso e na dor)
  const vm = new THREE.MeshBasicMaterial({ color: 0x3a1a10, transparent: true, opacity: 0, depthWrite: false });
  for (const s of [1, -1]) { const sl = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.008, 3, 10, 0.9), vm); sl.position.set(s * 0.06, -0.3, 0.8); sl.rotation.set(0.2, s * 0.5, s > 0 ? -0.25 : Math.PI + 0.25 - 0.9); H.add(sl); }
  // barba por fazer + bigode
  if (barba) {
    const bc = barba === true ? COR.barba : barba;
    const fB = (x, y, z) => Math.min(z + 0.15, -0.3 - 0.25 * Math.max(0, z - 0.3) - y, -Math.min(0.24 - Math.abs(x), y + 0.52, -0.36 - y));
    const st = new THREE.Mesh(casca(geoCranio(seed, fem), fB, 1.03, 0.05), new THREE.MeshStandardMaterial({ color: bc, roughness: 0.95, transparent: true, opacity: 0.93, flatShading: FAC() })); H.add(st);
    const big = new THREE.Mesh(liso(facetado(2, (v) => { v.y *= 0.25; v.y -= 0.12 * v.x * v.x; }, seed + 5, 0.02)), new THREE.MeshStandardMaterial({ color: bc, roughness: 0.95, transparent: true, opacity: 0.85, flatShading: FAC() })); big.scale.set(0.22, 0.065, 0.05); big.position.set(0, -0.445, 0.81); H.add(big);
  }
  // cabelo: casca acima da linha do cabelo + mechas facetadas
  // cabelo v7: casca lisa colada ao crânio + mechas afiladas e curvas que saem do topo e seguem a cabeça (liso, com brilho)
  // tipo: "curto" | "topete" | "cacheado" | "liso" (feminino). Mechas: raiz na casca, ponta afinando, deitadas na direção do penteado.
  const cm = matCabelo(cabelo), rr = mulberry32(seed * 7 + 3), tipo = cabeloTipo || (fem ? "liso" : ["curto", "topete", "cacheado"][seed % 3]);
  const fCab = (x, y, z) => Math.max(y - (0.46 + 0.22 * z - 0.12 * Math.abs(x) - 0.015 * Math.exp(-x * x * 30)), Math.min(-0.25 - z, y + 0.55));   // linha do cabelo: testa = 1/3 do rosto, bico suave no meio
  const capBase = (() => { const e0 = ESTILO; ESTILO = "liso"; const g = geoCranio(seed, fem); ESTILO = e0; return g; })();   // crânio fino (detalhe 3) só para o cabelo
  { const p = capBase.attributes.position, rh = mulberry32(seed * 3 + 1); const memo = new Map(); for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!memo.has(k)) memo.set(k, 1 + (rh() - 0.5) * 0.05); const n = memo.get(k); p.setXYZ(i, p.getX(i) * n, p.getY(i) * n, p.getZ(i) * n); } }
  const cmC = matCabelo(cabelo); cmC.vertexColors = true; cmC.side = THREE.DoubleSide; cmC.roughness = 0.75;   // couro cabeludo fosco: sem faixa cinza de brilho; o brilho fica nas mechas
  const cap = new THREE.Mesh(colorir(cascaAberta(capBase, fCab, tipo === "cacheado" ? 1.09 : 1.06, 0.12), (x, y, z) => { const t = Math.min(1, Math.max(0, (y - 0.2) / 0.9)); const k = 0.6 + 0.3 * t; return [k, k, k * 1.02]; }), cmC); H.add(cap);
  const geoMecha = (sd, lg, larg, curva) => { const g = facetado(2, (v) => { const t = (v.y + 1) / 2; v.x *= larg * (1 - 0.85 * t ** 1.4); v.z *= larg * 0.35 * (1 - 0.6 * t); v.y = t * lg; v.z += curva * t * t * lg; }, sd, 0.004); return liso(g); };
  const P = new THREE.Vector3(), D = new THREE.Vector3(), N = new THREE.Vector3(), X = new THREE.Vector3(), M = new THREE.Matrix4();
  const ponto = (az, ph) => { P.set(0.82 * Math.sin(ph) * Math.sin(az), 1.2 * Math.cos(ph), 0.98 * Math.sin(ph) * Math.cos(az)).multiplyScalar(1.04);
    N.set(P.x / 0.67, P.y / 1.44, P.z / 0.96).normalize(); D.set(0.82 * Math.cos(ph) * Math.sin(az), -1.2 * Math.sin(ph), 0.98 * Math.cos(ph) * Math.cos(az)).normalize(); };
  const mecha = (az, ph, lg, larg, curva, giro) => { ponto(az, ph); D.applyAxisAngle(N, giro).normalize(); X.crossVectors(D, N).normalize(); N.crossVectors(X, D).normalize();
    const m = new THREE.Mesh(geoMecha(seed + 60 + H.children.length, lg, larg, curva), cm); M.makeBasis(X, D, N); m.quaternion.setFromRotationMatrix(M); m.position.copy(P).addScaledVector(N, 0.0); H.add(m); return m; };
  if (tipo === "cacheado") {
    // cachos: caroços achatados contra o couro cabeludo (não saem da silhueta), maiores no topo
    const cg = liso(facetado(FAC() ? 1 : 2, (v) => { v.z *= 0.6; }, seed + 61, 0.12));
    for (let i = 0; i < 70; i++) { const az = rr() * Math.PI * 2, ph = 0.05 + Math.sqrt(rr()) * (Math.cos(az) > 0.3 ? 0.6 : 1.05); ponto(az, ph);
      const c = new THREE.Mesh(cg, cm); const k = (0.13 + rr() * 0.05) * (1.15 - 0.4 * ph); c.scale.setScalar(k); c.position.copy(P).addScaledVector(N, 0.085);
      M.lookAt(new THREE.Vector3(), N, new THREE.Vector3(0, 1, 0)); c.quaternion.setFromRotationMatrix(M); c.rotateZ(rr() * 6.28); H.add(c); }
  } else {
    const n = tipo === "curto" ? 30 : tipo === "topete" ? 26 : 30, lgB = tipo === "curto" ? 0.5 : tipo === "topete" ? 0.7 : 0.85;
    for (let i = 0; i < n; i++) {
      const az = (i / n) * Math.PI * 2 * 1.618 % (Math.PI * 2), frente = Math.max(0, Math.cos(az)), anel = i % 3;
      const ph = 0.1 + anel * 0.22 + rr() * 0.12, lg = lgB * (1 - 0.4 * frente * (tipo === "curto" ? 1 : 0.3)) * (0.85 + rr() * 0.3) * (1 - 0.15 * anel);
      const giro = tipo === "topete" ? -0.9 * frente * Math.sign(Math.sin(az) + 0.3) : (rr() - 0.5) * 0.3 + (tipo === "liso" ? 0 : -0.45 * frente);
      mecha(az, ph, lg, 0.3 + rr() * 0.08, tipo === "topete" ? -0.12 * frente : -0.22, giro);
    }
    if (tipo === "topete") for (let i = 0; i < 4; i++) mecha(-0.3 + i * 0.25, 0.25, 0.7, 0.3, -0.35, -0.9 - i * 0.1);   // topete varrido para o lado
  }
  function rosto(e, olhar) {
    somb.forEach((g, i) => { const s = i ? -1 : 1; g.rotation.z = s * e.br * (e.br > 0 ? 1.3 : 0.95); g.position.y = e.by - 0.03 * Math.max(0, e.br); g.position.x = s * (0.33 - 0.05 * Math.max(0, Math.abs(e.br) - 0.2)); });
    // bo = [largura, abertura 0.3 (fechada) .. 5 (grito)], so = sorriso -1..1, fa = fala (abertura extra da boca, 0..1)
    const w = e.bo[0], ab = Math.max(0, e.bo[1] - 0.6 + 2.6 * (e.fa || 0)), so = e.so || 0, h = 0.042 * ab;
    const sobe = Math.max(0, so) * 0.9 + (e.ab < 0.3 && e.bo[1] > 1.5 ? 0.7 : 0);
    boch.forEach((b) => { b.position.y = -0.22 + 0.08 * sobe; b.position.z = 0.5 + 0.1 * sobe; b.visible = sobe > 0.05; });
    rugas.visible = Math.abs(e.br) > 0.38; rugas.scale.y = Math.min(1, (Math.abs(e.br) - 0.38) * 6);
    olhos.forEach((o) => o.baixo(0.5 * sobe + 0.25 * Math.max(0, e.br - 0.3) + 0.35 * (e.nj || 0)));
    // as = assimetria (dúvida: uma sobrancelha sobe), pu = pupila (1 normal, 1.5 medo/escuro, 0.6 luz forte), ru = rubor 0..1, la = lágrima 0..1, su = suor 0..1, nj = nojo 0..1
    if (e.as) { somb[0].position.y += 0.07 * e.as; somb[0].rotation.z -= 0.2 * e.as; }
    olhos.forEach((o) => o.pupila(e.pu || 1));
    rub.forEach((m) => (m.material.opacity = 0.32 * (e.ru || 0)));
    lag.visible = (e.la || 0) > 0.02; lag.position.set(0.36, 0.0 - 0.45 * (e.la || 0), 0.74 - 0.08 * (e.la || 0));
    suor.visible = (e.su || 0) > 0.02; suor.position.set(-0.5, 0.55 - 0.3 * (e.su || 0), 0.6);
    // lábios: x em -1..1 (canto a canto); so sobe/desce os cantos (curva), ab desce o lábio de baixo; nj levanta um lado do lábio de cima
    const nj = e.nj || 0, sobeS = h * 0.22 + 0.02 * Math.max(0, so - 0.4), desceI = h * 1.25 + 0.016 * Math.max(0, so - 0.3), larg = LW * w * (1 + 0.1 * Math.max(0, so));
    const curva = (x) => so * (so > 0 ? 0.085 : 0.06) * x * x - (so < 0 ? 0 : 0.008 * so);
    labS.userData.aplica((x, y, z) => [x * larg, 0.012 + y * ES + curva(x) + sobeS * (1 - 0.6 * x * x) + nj * 0.03 * Math.max(0, x), z * 0.06 + 0.035]);
    labI.userData.aplica((x, y, z) => [x * larg * (0.9 + 0.04 * ab), -0.012 + y * EI + curva(x) * 1.1 - desceI * (1 - 0.5 * x * x), z * 0.065 + 0.03]);
    boca.rotation.z = 0.08 * nj;
    // vão entre os lábios: de baixo do lábio de cima até o topo do de baixo
    const topo = 0.012 + sobeS - ES * 0.55, fundo = -0.012 - desceI + EI * 0.6, vao = Math.max(0, topo - fundo);
    abre.visible = vao > 0.004; abre.scale.set(larg * 0.86, vao * 0.55 + 0.002, 1); abre.position.y = (topo + fundo) / 2 + 0.01 * Math.max(0, so);
    dentes.visible = abre.visible && (vao > 0.012 || so > 0.4); dentes.scale.set(w * (0.9 + 0.1 * Math.max(0, so)), Math.min(1, vao / 0.03 + 0.4), 1); dentes.position.y = topo - 0.018;
    dentesI.visible = abre.visible && vao > 0.07; dentesI.scale.x = w * 0.95; dentesI.position.y = fundo + 0.016;
    lingua.visible = vao > 0.05; lingua.scale.set(larg * 0.55, Math.min(0.045, vao * 0.25), 0.04); lingua.position.y = fundo + Math.min(0.03, vao * 0.18);
    vm.opacity = 0.35 * Math.max(0, so - 0.2) + 0.25 * Math.max(0, Math.abs(e.br) - 0.4);
    const abK = e.ab * 0.84 + Math.max(0, e.ab - 0.9) * 0.4;   // pálpebra cobre o topo da íris no repouso (olhar natural, sem susto)
    olhos.forEach((o) => { o.abrir(abK * (1 - (e._pisc || 0))); o.olhar(...(olhar || e.ol)); });
  }
  return { H, rosto };
}

// ===== Pessoa R11 com esqueleto =====
// Hierarquia: root > quadril (y 0.92) > coluna (cintura) > tronco > pescoco > cab ; pernas no quadril ; braços no tronco.
// API: emocao(nome|{...}, olhar), reset(), respira(k), piscar(b), e os ossos (quadril, coluna, pescoco, cab, bracos[i].om/cot/pulso/dedos, pernas[i].q/j/pe).
// Animação pronta (mais abaixo): vida(p, t), andar(p, t), pose(p, nome, k), olharPara(p, alvo, k). Chame p.reset() no começo de cada render(t).
// Expressões: calmo medo panico triste foco alegre surpresa grito dor sono dormindo raiva
const EM = {
  calmo: { br: 0.0, by: 0.31, bo: [1, 0.3], ab: 0.62, ol: [0, 0.05], so: 0.1 },
  medo: { br: -0.3, by: 0.39, bo: [0.85, 1.6], ab: 0.85, ol: [0.1, 0.05], so: -0.25 },
  panico: { br: -0.42, by: 0.43, bo: [1.05, 3.4], ab: 1.12, ol: [0.3, 0.1], so: -0.35 },
  triste: { br: -0.34, by: 0.36, bo: [0.8, 0.4], ab: 0.48, ol: [0, -0.25], so: -0.7 },
  foco: { br: 0.22, by: 0.3, bo: [0.8, 0.2], ab: 0.55, ol: [0, 0], so: 0 },
  alegre: { br: -0.05, by: 0.34, bo: [1.15, 1.3], ab: 0.42, ol: [0, 0.05], so: 1 },
  surpresa: { br: -0.12, by: 0.46, bo: [0.75, 3.2], ab: 1.15, ol: [0, 0.08], so: 0 },
  grito: { br: -0.5, by: 0.42, bo: [1.2, 5], ab: 0.95, ol: [0, 0.12], so: -0.5 },
  dor: { br: -0.55, by: 0.33, bo: [1.25, 2.4], ab: 0.12, ol: [0, 0], so: -0.8 },
  sono: { br: 0.02, by: 0.29, bo: [1, 0.3], ab: 0.2, ol: [0, -0.2], so: 0 },
  dormindo: { br: 0.0, by: 0.3, bo: [1, 0.45], ab: 0.0, ol: [0, -0.2], so: 0.05 },
  raiva: { br: 0.45, by: 0.27, bo: [0.95, 0.9], ab: 0.72, ol: [0, 0], so: -0.5 },
  nojo: { br: 0.3, by: 0.29, bo: [0.9, 0.7], ab: 0.42, ol: [0.2, -0.05], so: -0.6, nj: 1 },
  duvida: { br: 0.1, by: 0.31, bo: [0.85, 0.3], ab: 0.6, ol: [0.25, 0.15], so: -0.2, as: 1 },
  bocejo: { br: -0.15, by: 0.36, bo: [0.8, 4.4], ab: 0.08, ol: [0, 0], so: 0 },
  vergonha: { br: -0.25, by: 0.33, bo: [0.9, 0.35], ab: 0.4, ol: [0.3, -0.35], so: 0.35, ru: 1 },
  choro: { br: -0.55, by: 0.36, bo: [1.15, 1.8], ab: 0.2, ol: [0, -0.1], so: -0.9, la: 0.7 },
  nervoso: { br: -0.3, by: 0.37, bo: [1.05, 0.5], ab: 0.8, ol: [0.2, 0], so: -0.2, su: 0.6, pu: 1.3 },
};
export const EXPRESSOES = Object.keys(EM);
// membro: cilindro com perfil de raio r(t) (t 0 em cima .. 1 embaixo) e frente/trás (zf, zt); pontas planas que se sobrepõem na junta
function geoMembro(h, rx, { zf = (t) => 1, zt = (t) => 1, seg = 8, an = 5 } = {}) {
  const g = new THREE.CylinderGeometry(1, 1, h, seg, an), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = 0.5 - y / h, r = rx(t), z = p.getZ(i); p.setX(i, p.getX(i) * r); p.setZ(i, z * r * (z > 0 ? zf(t) : zt(t)));
    if (Math.abs(p.getX(i)) + Math.abs(z) < 1e-6) p.setY(i, y + Math.sign(y) * r * 0.3); }   // pontas em cúpula (ombro/cotovelo/joelho redondos, sem tampa chata)
  g.computeVertexNormals(); return g;
}
// tronco v6: caixa arredondada (superelipse), ombros largos e caídos, peito, cintura e quadril; fem: cintura fina e quadril largo
const _se = (c, e = 0.72) => Math.sign(c) * Math.abs(c) ** e;
function formaTronco(v, fem = false) {
  v.x = _se(v.x); v.z = _se(v.z, 0.8); v.y *= 1.5;
  const y = v.y;
  v.x *= 1.04 * (1 + (fem ? 0.04 : 0.12) * Math.max(-0.6, Math.min(0.8, y)));                                              // V: ombro > cintura
  v.x *= 1 - (fem ? 0.16 : 0.1) * gauss((y + 0.45) ** 2 * 6, 0.7);                                                         // cintura
  if (fem) v.x *= 1 + 0.12 * gauss((y + 1.1) ** 2 * 6, 0.7);                                                               // quadril
  v.z *= 0.62; v.z += (v.z > 0 ? 1 : 0) * (fem ? 0.1 : 0.07) * gauss((y - 0.35) ** 2 * 5, 0.7);                           // peito
  if (y > 0.7) v.y = 0.7 + (y - 0.7) * 0.45 - 0.22 * Math.abs(v.x) ** 2;                                                  // ombros caídos (trapézio)
  if (y < -0.2) { const k = Math.min(1, (-y - 0.2) / 1.1); v.z *= 1 - 0.18 * k; }
  if (y < -1.15) v.y = -1.15 + (y + 1.15) * 0.25;                                                                        // barra reta (sem bico entre as pernas)
}
function esqueleto(R, { pele, jaqueta, calca, tenis = COR.tenis, seed, simples }) {
  const quadril = new THREE.Group(); quadril.position.y = 0.92; R.add(quadril);
  const coluna = new THREE.Group(); quadril.add(coluna);
  const tronco = new THREE.Group(); tronco.position.y = -0.92; coluna.add(tronco);
  const pescoco = new THREE.Group(); pescoco.position.set(0, simples ? 1.47 : 1.445, 0); tronco.add(pescoco);
  const cab = new THREE.Group(); cab.position.y = 0.18; pescoco.add(cab);
  const seg = simples ? 5 : 10, jm = simples ? mat(jaqueta, 0.7) : matTecido(jaqueta, 0.75), pm = simples ? matPele(pele) : matPeleLiso(pele), ct = (m, k) => (simples ? m : contorno(m, k));
  const bracos = [1, -1].map((s) => {
    const om = new THREE.Group(); om.position.set(s * (simples ? 0.235 : 0.228), simples ? 1.36 : 1.335, 0); tronco.add(om);
    const sup = ct(new THREE.Mesh(simples ? new THREE.CylinderGeometry(0.062, 0.055, 0.32, seg) : geoMembro(0.34, (t) => 0.063 - 0.012 * t + 0.006 * gauss((t - 0.35) ** 2 * 20, 0.7), { seg: FAC() ? 7 : 10, an: 3 }), jm), 0.04); sup.position.y = -0.16; om.add(sup);
    const omb = new THREE.Mesh(simples ? new THREE.IcosahedronGeometry(0.068, 0) : FAC() ? new THREE.IcosahedronGeometry(0.06, 1) : new THREE.SphereGeometry(0.06, 10, 8), jm); omb.scale.set(1.02, 0.8, 1); omb.position.y = -0.026; om.add(omb);
    const cot = new THREE.Group(); cot.position.y = -0.32; om.add(cot);
    const inf = ct(new THREE.Mesh(simples ? new THREE.CylinderGeometry(0.055, 0.048, 0.3, seg) : geoMembro(0.31, (t) => 0.056 - 0.018 * t * t + 0.004 * gauss((t - 0.2) ** 2 * 25, 0.7), { seg: FAC() ? 7 : 10, an: 3 }), jm), 0.04); inf.position.y = -0.15; cot.add(inf);
    const pulso = new THREE.Group(); pulso.position.y = -0.3; cot.add(pulso);
    const mao = ct(new THREE.Mesh(simples ? facetado(1, (v) => { v.y *= 1.3; v.z *= 0.6; }, seed + 50 + s, 0.15) : liso(facetado(2, (v) => { v.y *= 1.15; v.z *= 0.5; if (v.y < 0) v.x *= 1.08; }, seed + 50 + s, 0.01)), pm), 0.05);
    mao.scale.set(simples ? 0.05 : 0.048, simples ? 0.05 : 0.052, simples ? 0.045 : 0.05); mao.position.y = -0.045; pulso.add(mao);
    const dedos = [];
    if (!simples) {
      const fal = (w, h) => { const g = new THREE.CylinderGeometry(w * 0.46, w * 0.55, h, 6, 1), q = g.attributes.position; for (let i = 0; i < q.count; i++) { if (Math.abs(q.getX(i)) + Math.abs(q.getZ(i)) < 1e-6 && q.getY(i) < 0) q.setY(i, q.getY(i) - w * 0.4); q.setZ(i, q.getZ(i) * 0.9); } g.translate(0, -h / 2, 0); g.computeVertexNormals(); return g; };   // falange afilada com ponta redonda
      for (let f = 0; f < 4; f++) { const L = [0.036, 0.042, 0.04, 0.032][f];
        const g = new THREE.Group(); g.position.set((f - 1.5) * 0.021 * s, -0.088, 0.004); g.rotation.z = (f - 1.5) * 0.06; pulso.add(g);
        g.add(new THREE.Mesh(fal(0.017, L), pm));
        const g2 = new THREE.Group(); g2.position.y = -L; g.add(g2); g2.add(new THREE.Mesh(fal(0.015, L * 0.8), pm));
        g.userData.f2 = g2; g.rotation.x = 0.2; g2.rotation.x = 0.25; dedos.push(g); }
      const p1 = new THREE.Group(); p1.position.set(-s * 0.04, -0.035, 0.018); p1.rotation.set(0.3, 0, s * 0.75); pulso.add(p1);
      p1.add(new THREE.Mesh(fal(0.019, 0.034), pm)); const p2 = new THREE.Group(); p2.position.y = -0.034; p2.rotation.z = s * -0.25; p1.add(p2); p2.add(new THREE.Mesh(fal(0.017, 0.028), pm));
    }
    return { om, cot, pulso, mao, dedos, s, manga: [sup, inf] };
  });
  const pernas = [1, -1].map((s) => {
    const q = new THREE.Group(); q.position.set(s * 0.1, -0.02, 0); quadril.add(q);
    const c = ct(new THREE.Mesh(simples ? new THREE.CylinderGeometry(0.085, 0.07, 0.46, seg) : geoMembro(0.5, (t) => 0.113 - 0.04 * t - 0.012 * t * t + 0.006 * gauss((t - 0.3) ** 2 * 15, 0.7), { zf: (t) => 1.08 - 0.1 * t }), matTecido(calca)), 0.03); c.position.y = -0.24; q.add(c);
    const j = new THREE.Group(); j.position.y = -0.46; q.add(j);
    const c2 = ct(new THREE.Mesh(simples ? new THREE.CylinderGeometry(0.07, 0.06, 0.42, seg) : geoMembro(0.44, (t) => 0.064 - 0.024 * t + 0.008 * gauss((t - 0.28) ** 2 * 25, 0.7), { zt: (t) => 1 + 0.3 * gauss((t - 0.28) ** 2 * 20, 0.7) }), matTecido(calca)), 0.03); c2.position.y = -0.21; j.add(c2);
    const pe = new THREE.Group(); pe.position.y = -0.42; j.add(pe);
    const sap = ct(new THREE.Mesh(simples ? T_box(0.11, 0.08, 0.22) : liso(facetado(2, (v) => { v.x *= 0.058 * (v.z > 0 ? 1 : 0.9); v.y *= 0.045; v.z *= 0.12; if (v.y < -0.02) v.y = -0.02 - (v.y + 0.02) * 0.3; if (v.z < -0.03 && v.y > 0.02) v.y += 0.02; }, seed + 99 + s, 0.005)), mat(tenis, 0.6, { flatShading: false })), 0.04); sap.position.set(0, -0.03, 0.045); pe.add(sap);
    if (!simples) { const sola = new THREE.Mesh(T_box(0.118, 0.025, 0.232), mat(0xe8e4dc, 0.6)); sola.position.set(0, -0.065, 0.047); pe.add(sola); }
    return { q, j, pe, s };
  });
  if (!simples) { const pel = ct(new THREE.Mesh(liso(facetado(2, (v) => { v.x = _se(v.x, 0.8) * 0.14; v.y *= 0.09; v.z *= 0.085; if (v.y > 0.05) v.y = 0.05; }, seed + 93, 0.005)), matTecido(calca)), 0.02); pel.position.y = 0.03; quadril.add(pel);
    const cinto = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.025, 10), mat(0x2a2018, 0.5)); cinto.scale.z = 0.72; cinto.position.y = 0.075; quadril.add(cinto); R.userData.cinto = cinto; }
  return { quadril, coluna, tronco, pescoco, cab, bracos, pernas };
}
// pose de descanso de cada osso (reset() volta para ela)
function guardaDescanso(p) {
  const ossos = [p.root, p.quadril, p.coluna, p.pescoco, p.cab, ...p.bracos.flatMap((b) => [b.om, b.cot, b.pulso, ...b.dedos, ...b.dedos.map((d) => d.userData.f2).filter(Boolean)]), ...p.pernas.flatMap((l) => [l.q, l.j, l.pe]), ...(p.abas || []), ...(p.mechas ? [p.mechas] : [])];
  const base = ossos.map((o) => [o.position.clone(), o.rotation.clone()]);
  p.bracos.forEach((b) => b.dedos.forEach((d) => (d.userData.r0 = d.rotation.x)));
  p.reset = () => { ossos.forEach((o, i) => { if (o === p.root) return; o.position.copy(base[i][0]); o.rotation.copy(base[i][1]); }); p.bracos.forEach((b) => (b._fix = false)); p.respira(0); p.piscar(0); };
}
// Opções extras: feminina, idade "crianca|adulto|idoso", roupa "jaqueta|camiseta|jaleco|pijama|casaco|uniforme", oculos, bone, mochila, cachecol.
export function pessoa({ longo, seed = 1, pele = COR.pele, cabelo, jaqueta, camisa = COR.camisa, calca, barba, corpo = true, iris, feminina = false, idade = "adulto", roupa = "jaqueta", oculos = false, bone = false, mochila = false, cachecol = false, cabeloTipo = null } = {}) {
  longo = longo ?? feminina; barba = barba ?? (!feminina && idade !== "crianca");
  cabelo = cabelo ?? (idade === "idoso" ? 0xb8b2aa : COR.cabelo);
  jaqueta = jaqueta ?? { jaleco: 0xeef0f2, pijama: 0x6f8fb8, casaco: 0x7a3a2a, uniforme: 0x2f3f5a }[roupa] ?? COR.jaqueta;
  calca = calca ?? { jaleco: 0x2c3442, pijama: 0x6f8fb8 }[roupa] ?? COR.jeans;
  if (roupa === "jaleco" && camisa === COR.camisa) camisa = 0x8fb0c8;
  const R = new THREE.Group();
  const E = esqueleto(R, { pele, jaqueta, calca, seed, simples: false });
  const { cab, tronco } = E;
  const C = cabecaR11({ seed, pele, cabelo, barba, iris, fem: feminina, cabeloTipo, kid: idade === "crianca" }); C.H.scale.setScalar(0.14); cab.add(C.H);
  let mechas = null;
  if (longo) { const lm = matCabelo(cabelo); mechas = new THREE.Group(); cab.add(mechas);
    const tras = contorno(new THREE.Mesh(liso(facetado(3, (v) => { v.y *= 1.6; v.x *= 1.05; if (v.z > 0.3) v.z = 0.3; if (v.y < -0.8) v.x *= 1 - (-v.y - 0.8) * 0.4; }, seed + 80, 0.015)), lm), 0.02); tras.scale.set(0.15, 0.17, 0.13); tras.position.set(0, -0.06, -0.04); mechas.add(tras);
    for (const s of [1, -1]) { const m = contorno(new THREE.Mesh(liso(facetado(2, (v) => { v.y *= 2.6; v.x *= 0.6; if (v.y < 0) v.x *= 1 + v.y * 0.3; }, seed + 85 + s, 0.02)), lm), 0.03); m.scale.set(0.045, 0.06, 0.035); m.position.set(s * 0.112, -0.035, 0.02); m.rotation.z = s * 0.06; mechas.add(m); } }
  // tronco: camisa + jaqueta aberta com gola (as abas da jaqueta balançam no andar)
  const pesc = new THREE.Mesh(new THREE.CylinderGeometry(feminina ? 0.054 : 0.066, feminina ? 0.07 : 0.085, 0.15, 8), matPele(pele)); pesc.position.y = 1.45; tronco.add(pesc);
  const tor = contorno(new THREE.Mesh(liso(facetado(FAC() ? 2 : 3, (v) => formaTronco(v, feminina), seed + 20, FAC() ? 0.018 : 0.01)), matTecido(camisa)), 0.02);
  tor.scale.set(0.2, 0.245, 0.196); tor.position.set(0, 1.155, -0.004); tronco.add(tor);
  const jm = matTecido(jaqueta, 0.7), abas = [];
  for (const s of [1, -1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.035, 1.38, -0.005); tronco.add(piv);
    const lado = contorno(new THREE.Mesh(liso(facetado(FAC() ? 2 : 3, (v) => { formaTronco(v, feminina); v.x *= 0.97; v.z *= 1.04; if (v.x * s < -0.25) v.x = -0.25 * s; }, seed + 30 + s, 0.01)), jm), 0.02);
    lado.scale.set(0.198, 0.25, 0.178); lado.position.y = -0.235; piv.add(lado); abas.push(piv);
    const gola = contorno(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.17, 4), jm), 0.04);
    gola.position.set(s * 0.08, 1.395, 0.09); gola.rotation.set(0.2, 0, s * 0.6); gola.scale.set(0.85, 0.85, 0.4); tronco.add(gola);
  }
  const capuz = contorno(new THREE.Mesh(liso(facetado(2, (v) => { v.z *= 0.75; v.y *= 0.55; if (v.z > 0.2) v.z = 0.2 + (v.z - 0.2) * 0.2; }, seed + 70, 0.02)), jm), 0.025);
  capuz.scale.set(0.2, 0.16, 0.16); capuz.position.set(0, 1.45, -0.1); capuz.rotation.x = -0.35; tronco.add(capuz);
  const zip = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.45, 0.006), mat(0x9a9aa0, 0.3, { metalness: 0.8 })); zip.position.set(0.0, 1.13, 0.148); zip.rotation.x = 0.05; tronco.add(zip);
  E.bracos.forEach((b) => { b.om.rotation.z = b.s * 0.08; b.cot.rotation.x = -0.18; });
  if (!corpo) E.pernas.forEach((l) => (l.q.visible = false));
  // roupas
  const escondeJaqueta = () => { abas.forEach((a) => (a.visible = false)); tronco.children.forEach((o) => { if (o !== tor && o !== pesc && o !== E.pescoco && !o.isGroup) { if (o.geometry && (o.geometry.type === "ConeGeometry" || o.geometry.type === "BoxGeometry")) o.visible = false; } }); capuz.visible = false; zip.visible = false; };
  if (roupa === "camiseta" || roupa === "pijama") { escondeJaqueta(); E.bracos.forEach((b) => { b.manga[0].material = matTecido(roupa === "pijama" ? jaqueta : camisa); b.om.children.forEach((o) => { if (o.geometry && (o.geometry.type === "IcosahedronGeometry" || o.geometry.type === "SphereGeometry" || o.geometry.type === "PolyhedronGeometry")) o.material = b.manga[0].material; }); b.manga[1].material = matPele(pele); if (roupa === "pijama") b.manga[1].material = matTecido(jaqueta);
      else { b.manga[0].scale.set(1.04, 0.55, 1.04); b.manga[0].position.y = -0.105; const bc = contorno(new THREE.Mesh(geoMembro(0.18, (t) => 0.05 - 0.006 * t, { seg: 7, an: 2 }), matPele(pele)), 0.04); bc.position.y = -0.235; b.om.add(bc); } }); tor.material = matTecido(roupa === "pijama" ? jaqueta : camisa);
    for (const s of [1, -1]) { const tp = contorno(new THREE.Mesh(liso(facetado(FAC() ? 1 : 2, (v) => { v.y -= 0.35 * v.x * v.x; }, seed + 140 + s, 0.01)), tor.material), 0.03); tp.scale.set(0.11, 0.05, 0.085); tp.position.set(s * 0.135, 1.33, -0.01); tp.rotation.z = -s * 0.32; tronco.add(tp); } }   // ponte do ombro: liga o tronco à manga (sem ombro de boneco)
  if (R.userData.cinto && (feminina || roupa === "camiseta" || roupa === "pijama")) R.userData.cinto.visible = false;
  if (roupa === "jaleco") { abas.forEach((a) => { a.scale.y = 1.45; }); capuz.visible = false; zip.visible = false; }
  if (roupa === "uniforme") { zip.visible = false; tor.material = matTecido(jaqueta); abas.forEach((a) => (a.scale.x = 1.15)); }
  if (roupa === "casaco") { abas.forEach((a) => a.scale.set(1.1, 1.15, 1.15)); E.bracos.forEach((b) => b.manga.forEach((m) => m.scale.set(1.2, 1, 1.2))); cachecol = true; }
  // acessórios
  if (oculos) { const om = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.3, metalness: 0.6 });
    for (const s of [1, -1]) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.0045, 4, 14), om); a.position.set(s * 0.045, 0.014, 0.112); cab.add(a);
      const l = new THREE.Mesh(new THREE.CircleGeometry(0.029, 14), new THREE.MeshStandardMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.18, roughness: 0.05 })); l.position.copy(a.position); l.position.z += 0.001; cab.add(l); }
    const ponte = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, 0.005), om); ponte.position.set(0, 0.02, 0.115); cab.add(ponte); }
  if (bone) { const bm = matTecido(typeof bone === "number" ? bone : 0x2a4a7a); const cp = contorno(new THREE.Mesh(new THREE.SphereGeometry(0.128, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), bm), 0.02); cp.position.set(0, 0.05, -0.005); cp.scale.set(1, 0.8, 1.05); cab.add(cp);
    const ab = contorno(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.01, 10, 1, false, -Math.PI / 2, Math.PI), bm), 0.04); ab.position.set(0, 0.055, 0.09); ab.rotation.x = 0.12; ab.scale.set(1, 1, 0.9); cab.add(ab); }
  if (mochila) { const mm = matTecido(typeof mochila === "number" ? mochila : 0x3a5a3a); const mb = contorno(new THREE.Mesh(facetado(1, (v) => { v.y *= 1.3; v.z *= 0.55; }, seed + 90, 0.1), mm), 0.02); mb.scale.set(0.17, 0.2, 0.17); mb.position.set(0, 1.18, -0.2); tronco.add(mb);
    for (const s of [1, -1]) { const al = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.42, 0.02), mm); al.position.set(s * 0.12, 1.2, 0.13); al.rotation.x = 0.12; tronco.add(al); } }
  if (cachecol) { const cc = contorno(new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.04, 6, 12), matTecido(typeof cachecol === "number" ? cachecol : 0xb83a3a)), 0.03); cc.rotation.x = Math.PI / 2; cc.position.y = 1.44; tronco.add(cc);
    const ponta = contorno(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.03), cc.material), 0.04); ponta.position.set(0.05, 1.32, 0.12); ponta.rotation.z = 0.15; tronco.add(ponta); }
  if (feminina) { E.pescoco.position.y -= 0.04; pesc.scale.y = 0.75; pesc.position.y -= 0.02; tor.scale.x *= 0.92; abas.forEach((a) => (a.scale.x *= 0.92)); E.bracos.forEach((b) => (b.om.position.x *= 0.9)); }
  else { E.pescoco.position.y -= 0.02; pesc.scale.y = 0.88; pesc.position.y -= 0.01; }   // pescoço masculino mais curto (no close parecia girafa)
  // idade: criança = corpo menor e cabeça proporcionalmente maior; idoso = costas curvadas
  if (idade === "crianca") { R.scale.setScalar(0.64); E.cab.scale.setScalar(1.32); E.pescoco.position.y -= 0.03; tronco.children.forEach((o) => { if (o.geometry && o.geometry.type === "ConeGeometry") { o.scale.multiplyScalar(0.72); o.position.y -= 0.035; o.position.x *= 0.9; } }); }   // gola menor: não encosta no queixo
  if (idade === "idoso") { E.coluna.rotation.x = 0.13; E.pescoco.rotation.x = 0.12; }
  const p = { root: R, ...E, abas, mechas, peito: tor };
  let atual = EM.calmo, olharAtual = null;
  p.emocao = (nome, olhar = null) => { atual = typeof nome === "object" ? { ...EM.calmo, ...nome } : (EM[nome] || EM.calmo); olharAtual = olhar; C.rosto(atual, olhar); };
  // mistura duas expressões (k 0..1), para transições suaves
  p.emocaoMix = (a, b, k, olhar = null) => { const A = typeof a === "object" ? { ...EM.calmo, ...a } : EM[a], B = typeof b === "object" ? { ...EM.calmo, ...b } : EM[b], L = (x, y) => x + (y - x) * k;
    p.emocao({ br: L(A.br, B.br), by: L(A.by, B.by), bo: [L(A.bo[0], B.bo[0]), L(A.bo[1], B.bo[1])], ab: L(A.ab, B.ab), ol: [L(A.ol[0], B.ol[0]), L(A.ol[1], B.ol[1])], so: L(A.so || 0, B.so || 0), as: L(A.as || 0, B.as || 0), pu: L(A.pu || 1, B.pu || 1), ru: L(A.ru || 0, B.ru || 0), la: L(A.la || 0, B.la || 0), su: L(A.su || 0, B.su || 0), nj: L(A.nj || 0, B.nj || 0) }, olhar); };
  p.piscar = (b) => { C.rosto({ ...atual, _pisc: b }, olharAtual); };
  p.estado = () => atual; p.olharAtual = () => olharAtual;
  p.respira = (k) => { tor.scale.z = 0.196 * (1 + 0.05 * k); tor.scale.x = 0.2 * (1 + 0.015 * k); abas.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * 0.02 * k)); };
  guardaDescanso(p); p.emocao("calmo");
  return p;
}
// figurante: mesmo esqueleto e mesmas animações, ~10x menos triângulos (multidões, planos abertos)
export function figurante({ seed = 1, pele = COR.pele, cabelo = COR.cabelo, roupa = 0x3d5a80, calca = COR.jeans, longo = false } = {}) {
  const R = new THREE.Group();
  const E = esqueleto(R, { pele, jaqueta: roupa, calca, seed, simples: true });
  const { cab, tronco } = E, rr = mulberry32(seed * 31 + 7);
  const cm = matPele(pele);
  const ca = new THREE.Mesh(facetado(1, (v) => { v.x *= 0.82; v.y *= 1.12; if (v.y < -0.2) v.x *= 0.85; }, seed, 0.06), cm); ca.scale.setScalar(0.115); ca.position.y = 0.0; cab.add(ca);
  const cbm = mat(cabelo, 0.85);
  const cap = new THREE.Mesh(facetado(1, (v) => { if (v.y < 0.1 - 0.35 * Math.max(0, -v.z)) v.y = 0.1 - 0.35 * Math.max(0, -v.z) + (v.y - 0.1) * 0.15; v.x *= 0.86; }, seed + 2, 0.15), cbm);
  cap.scale.setScalar(0.125); cap.position.set(0, 0.012, -0.01); cab.add(cap);
  if (longo) { const t = new THREE.Mesh(facetado(1, (v) => { v.y *= 1.8; if (v.z > 0.2) v.z = 0.2; }, seed + 3, 0.2), cbm); t.scale.set(0.12, 0.12, 0.08); t.position.set(0, -0.1, -0.05); cab.add(t); }
  const om = new THREE.MeshBasicMaterial({ color: 0x140a06 });
  const olhos = [1, -1].map((s) => { const o = new THREE.Mesh(new THREE.IcosahedronGeometry(0.014, 0), om); o.position.set(s * 0.038, 0.008, 0.1); o.scale.y = 1.3; cab.add(o); return o; });
  const nz = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 4), cm); nz.rotation.x = -1.2; nz.position.set(0, -0.02, 0.11); cab.add(nz);
  const pesc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 5), cm); pesc.position.y = 1.47; tronco.add(pesc);
  const tor = new THREE.Mesh(facetado(1, (v) => { v.y *= 1.5; v.z *= 0.62; if (v.y > 0.6) v.x *= 1 - (v.y - 0.6) * 0.5; }, seed + 20, 0.08), mat(roupa, 0.75)); tor.scale.set(0.215, 0.25, 0.2); tor.position.set(0, 1.14, 0); tronco.add(tor);
  E.bracos.forEach((b) => { b.om.rotation.z = b.s * 0.08; b.cot.rotation.x = -0.18; });
  R.scale.setScalar(0.94 + rr() * 0.14);
  const p = { root: R, ...E, abas: [], mechas: null, peito: tor };
  p.emocao = (nome) => { const e = typeof nome === "object" ? nome : EM[nome] || EM.calmo; olhos.forEach((o) => (o.scale.y = 0.2 + 1.3 * Math.min(1, e.ab / 0.62))); };
  p.emocaoMix = (a, b, k) => p.emocao(k < 0.5 ? a : b); p.estado = () => EM.calmo; p.olharAtual = () => null;
  p.piscar = (b) => olhos.forEach((o) => (o.scale.y = Math.max(0.15, 1.3 * (1 - b))));
  p.respira = (k) => { tor.scale.z = 0.2 * (1 + 0.05 * k); };
  guardaDescanso(p);
  return p;
}

// ===== animação procedural (determinística: só depende de t e da seed) =====
const L_ = (a, b, k) => a + (b - a) * k;
const sm = (x) => x * x * (3 - 2 * x);
// vida: respiração, balanço do peso, micro-movimentos da cabeça, piscadas e "olhadinhas". Some depois de pose/andar.
export function vida(p, t, { seed = 1, resp = 1, balanco = 1, piscar = true, olhos = true } = {}) {
  const r = mulberry32(seed * 977 + 1), f0 = 0.85 + r() * 0.3, ph = r() * 6.28;
  const br = 0.5 + 0.5 * Math.sin((t * 2 * Math.PI) / (3.6 * f0) + ph);
  p.respira(br * resp);
  p.coluna.rotation.x += 0.012 * br * resp; p.cab.rotation.x -= 0.01 * br * resp;
  p.bracos.forEach((b) => { b.om.rotation.z += b.s * 0.015 * br * resp; });
  p.coluna.rotation.z += 0.018 * balanco * Math.sin(t * 0.55 * f0 + ph);
  p.quadril.rotation.z -= 0.01 * balanco * Math.sin(t * 0.55 * f0 + ph);
  p.cab.rotation.y += 0.04 * balanco * Math.sin(t * 0.37 + ph * 2) + 0.015 * Math.sin(t * 1.3 + ph);
  p.cab.rotation.z += 0.025 * balanco * Math.sin(t * 0.29 + ph);
  // peso: um joelho cede um pouco, alternando devagar; ombros sobem na inspiração
  const pw = Math.sin(t * 0.21 * f0 + ph * 1.7);
  p.pernas.forEach((l, i) => { l.j.rotation.x += 0.035 * balanco * Math.max(0, i ? pw : -pw); l.q.rotation.x -= 0.015 * balanco * Math.max(0, i ? pw : -pw); });
  p.bracos.forEach((b, i) => { b.om.position.y += 0.006 * br * resp;
    // mão relaxada: dedos parados (no descanso) curvam em leque, do indicador ao mínimo
    if (!b._fix) b.dedos.forEach((d, j) => { if (d.userData.r0 !== undefined && Math.abs(d.rotation.x - d.userData.r0) < 1e-3) { const c = 0.18 + 0.07 * j + 0.03 * Math.sin(t * 0.7 + i + j);
      d.rotation.x += c; if (d.userData.f2) d.userData.f2.rotation.x += c * 1.2; } }); });
  if (p.mechas) p.mechas.rotation.x = 0.03 * Math.sin(t * 1.1 + ph);
  let b = 0;
  if (piscar) { // piscadas a cada 2–4,5 s (às vezes dupla), 0,16 s cada
    let tt = 0.4 + r() * 1.5; const rr = mulberry32(seed * 131 + 9);
    while (tt < t + 0.2) { const d = t - tt; if (d > -0.01 && d < 0.16) b = Math.max(b, Math.sin((d / 0.16) * Math.PI)); if (rr() < 0.18) { const d2 = d - 0.24; if (d2 > 0 && d2 < 0.16) b = Math.max(b, Math.sin((d2 / 0.16) * Math.PI)); } tt += 2 + rr() * 2.5; }
  }
  if (olhos && p.estado) { // sacadas: o olhar pula para um ponto próximo e segura 0,6–1,8 s; microexpressões a cada ~4 s
    const rs = mulberry32(seed * 71 + 3); let ts = 0, dx = 0, dy = 0;
    while (ts < t) { const n = ts + 0.6 + rs() * 1.2; if (n > t) break; ts = n; dx = (rs() - 0.5) * 0.22; dy = (rs() - 0.5) * 0.1; }
    const e = p.estado(), o0 = p.olharAtual() || e.ol, ox = p._olho || [0, 0], o = [o0[0] + ox[0], o0[1] + ox[1]], mi = Math.max(0, Math.sin(t * 1.6 + ph * 3) - 0.92) * 12;
    p.emocao({ ...e, br: e.br + 0.06 * mi, by: e.by + 0.01 * mi }, [o[0] + dx, o[1] + dy]);
  }
  p._olho = null;
  if (b > 0) p.piscar(b);
  return b;
}
// andar: ciclo de caminhada (quadril, joelho, pé, braços opostos, sobe e desce, torção). vel 1 = passo normal.
// Devolve a distância percorrida (m) para mover o root: root.position.z = andar(p, t).
export function andar(p, t, { vel = 1, amp = 1, fase = 0 } = {}) {
  const ph = t * vel * 2 * Math.PI * 0.95 + fase;
  p.pernas.forEach((l, i) => {
    const a = ph + (i ? Math.PI : 0), fw = Math.sin(a), sw = Math.max(0, Math.cos(a));
    l.q.rotation.x += -0.42 * amp * fw - 0.12 * amp * sw;
    l.j.rotation.x += amp * (0.06 + 0.85 * sw ** 1.6);
    l.pe.rotation.x += amp * (0.25 * Math.max(0, -Math.cos(a)) * Math.max(0, -fw) - 0.2 * Math.max(0, fw) * (1 - sw));
  });
  p.bracos.forEach((b, i) => { const a = ph + (i ? 0 : Math.PI), fw = Math.sin(a);
    b.om.rotation.x += -0.38 * amp * fw; b.cot.rotation.x += -0.22 * amp * Math.max(0, Math.sin(a - 0.45)) - 0.08 * amp;
    b.pulso.rotation.x += 0.12 * amp * Math.sin(a - 0.9); b.om.rotation.z += b.s * 0.04 * amp; });
  p.quadril.position.y += amp * (0.028 * Math.abs(Math.cos(ph)) - 0.022);
  p.quadril.rotation.y += 0.07 * amp * Math.sin(ph); p.coluna.rotation.y -= 0.12 * amp * Math.sin(ph);
  p.quadril.rotation.z += 0.035 * amp * Math.sin(ph); p.coluna.rotation.x += 0.05 * amp;
  p.cab.rotation.y -= 0.03 * amp * Math.sin(ph); p.cab.rotation.x -= 0.02 * amp * Math.cos(ph * 2) + 0.03 * amp;   // cabeça compensa o tronco (olhar estável)
  p.abas.forEach((a, i) => { a.rotation.x += -0.08 * amp * Math.abs(Math.sin(ph)) - 0.04; a.rotation.z += (i ? 1 : -1) * 0.05 * amp * Math.sin(ph * 2 + 0.6); });
  if (p.mechas) p.mechas.rotation.x += 0.06 * amp * Math.sin(ph * 2 - 0.8);
  return t * vel * 0.72;
}
// poses (ângulos alvo); k 0..1 mistura a partir do estado atual. Lado: "dir" usa o braço 0, "esq" o 1, "ambos" os dois.
const POSES = {
  sentado: { quadril: { y: -0.4 }, coluna: [0.08, 0, 0], pernas: { q: [-1.5, 0, 0], j: [1.45, 0, 0], pe: [0.05, 0, 0] }, bracos: { om: [-0.35, 0, 0.1], cot: [-0.9, 0, 0] } },
  maoRosto: { coluna: [0.08, 0, 0], cab: [0.12, 0, -0.08], bracos: { lado: 0, om: [-0.55, 0, -0.32], cot: [-2.35, 0.35, 0], pulso: [0.3, 0, 0.4] } },
  maosCabeca: { coluna: [0.12, 0, 0], cab: [0.18, 0, 0], bracos: { om: [-2.55, 0, 0.5], cot: [-2.2, 0, 0], pulso: [0.3, 0, 0] } },
  apontar: { coluna: [0, -0.15, 0], bracos: { lado: 0, om: [-1.5, 0, -0.1], cot: [-0.05, 0, 0], dedos: [0, 0, 0] } },
  susto: { coluna: [-0.16, 0, 0], cab: [-0.12, 0, 0], bracos: { om: [-1.15, 0, 0.35], cot: [-1.5, 0, 0], pulso: [-0.6, 0, 0], dedos: [0, 0, 0] } },
  espreguicar: { coluna: [-0.14, 0, 0], cab: [-0.3, 0, 0], bracos: { om: [-2.9, 0, 0.35], cot: [-0.35, 0, 0], dedos: [0, 0, 0] } },
  encolhido: { coluna: [0.22, 0, 0], cab: [0.2, 0, 0], bracos: { om: [-0.6, 0, -0.42], cot: [-1.95, 0, 0], pulso: [0.2, 0, 0] } },
  pensativo: { coluna: [0.05, 0, 0], cab: [0.08, 0.2, 0.1], bracos: { lado: 0, om: [-0.4, 0, -0.25], cot: [-2.55, 0.5, 0], pulso: [0.5, 0, 0.3] } },
  comemorar: { coluna: [-0.08, 0, 0], cab: [-0.2, 0, 0], bracos: { om: [-2.7, 0, 0.6], cot: [-0.5, 0, 0], dedos: [1.4, 0, 0] } },
  deitado: { root: [-Math.PI / 2, 0, 0], rootY: 0.16, bracos: { om: [0.05, 0, 0.12], cot: [-0.1, 0, 0] }, pernas: { q: [0.02, 0, 0], j: [0.05, 0, 0] } },
};
export const POSES_NOMES = Object.keys(POSES);
const _mix = (o, v, k) => { o.rotation.x = L_(o.rotation.x, v[0], k); o.rotation.y = L_(o.rotation.y, v[1], k); o.rotation.z = L_(o.rotation.z, v[2], k); };
export const antecipa = (x) => { const c = 1.6; x = Math.min(1, Math.max(0, x)); return x * x * ((c + 1) * x - c); };   // recua antes de ir
export const passa = (x) => { const c = 1.5; x = Math.min(1, Math.max(0, x)) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };   // passa do ponto e volta
export function pose(p, nome, k = 1, { lado, curva } = {}) {
  const P = POSES[nome]; if (!P || k <= 0) return; k = curva === "mola" ? passa(k) : curva === "antecipa" ? antecipa(k) : sm(Math.min(1, k));
  if (P.root) { _mix(p.root, P.root, k); p.quadril.position.y = L_(p.quadril.position.y, 0.92 + (P.rootY || 0), k); }
  if (P.quadril) p.quadril.position.y = L_(p.quadril.position.y, 0.92 + P.quadril.y, k);
  if (P.coluna) _mix(p.coluna, P.coluna, k);
  if (P.cab) _mix(p.cab, P.cab, k);
  if (P.bracos) { const B = P.bracos, ld = lado ?? B.lado; p.bracos.forEach((b, i) => { if (ld !== undefined && ld !== "ambos" && ld !== i) return; const s = b.s;
    for (const n of ["om", "cot", "pulso"]) if (B[n]) _mix(b[n], [B[n][0], B[n][1] * s, B[n][2] * s], k);
    if (B.dedos) { b._fix = true; b.dedos.forEach((d) => _mix(d, B.dedos, k)); } }); }
  if (P.pernas) p.pernas.forEach((l) => { for (const n of ["q", "j", "pe"]) if (P.pernas[n]) _mix(l[n], P.pernas[n], k); });
}
// mão fechada (k=1) ou aberta (0)
export function punho(p, k = 1, lado = "ambos") { p.bracos.forEach((b, i) => { if (lado !== "ambos" && lado !== i) return; b._fix = true; b.dedos.forEach((d) => { d.rotation.x = L_(d.rotation.x, 1.5, k); if (d.userData.f2) d.userData.f2.rotation.x = L_(d.userData.f2.rotation.x, 1.7, k); }); }); }
// virar cabeça (e um pouco o tronco) para um ponto do mundo
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();
export function olharPara(p, alvo, k = 1) {
  p.root.updateMatrixWorld(true); p.cab.getWorldPosition(_a); _b.copy(alvo).sub(_a);
  p.root.getWorldQuaternion(_q); _b.applyQuaternion(_q.invert());
  const yaw = Math.max(-1.2, Math.min(1.2, Math.atan2(_b.x, _b.z))), pit = Math.max(-0.6, Math.min(0.6, -Math.atan2(_b.y, Math.hypot(_b.x, _b.z))));
  p.cab.rotation.y += yaw * 0.65 * k; p.coluna.rotation.y += yaw * 0.25 * k; p.cab.rotation.x += pit * 0.8 * k;
  // olhos lideram: completam o ângulo que a cabeça ainda não virou (lidos pelo vida(), chame olharPara antes dele)
  const ke = Math.min(1, k * 2.2); p._olho = [Math.max(-0.5, Math.min(0.5, yaw * (0.55 * ke - 0.3 * k))), Math.max(-0.3, Math.min(0.3, -pit * (0.4 * ke - 0.2 * k)))];
}

function T_box(w, h, d) { return new THREE.BoxGeometry(w, h, d, 1, 1, 1); }

// Corvo low-poly: corpo em gota, pescoço grosso, cabeça com testa plana, bico longo, penas em lâminas
export function corvo(seed = 3) {
  const R = new THREE.Group(), preto = mat(0x2a3246, 0.45), azul = mat(0x3c4a6c, 0.38), bm = mat(0x2c2f36, 0.35);
  const corpo = contorno(new THREE.Mesh(facetado(2, (v) => { v.z *= 1.55; v.x *= 0.85; if (v.z < 0) { const k = -v.z / 1.55; v.y *= 1 - 0.45 * k; v.x *= 1 - 0.35 * k; } if (v.y < 0) v.y *= 0.85; }, seed, 0.1), preto), 0.015);
  corpo.scale.setScalar(0.42); corpo.rotation.x = -0.45; R.add(corpo);
  const pes = contorno(new THREE.Mesh(facetado(2, (v) => { v.y *= 1.3; }, seed + 2, 0.15), azul), 0.02); pes.scale.set(0.27, 0.3, 0.28); pes.position.set(0, 0.32, 0.42); pes.rotation.x = 0.5; R.add(pes);
  const cab = new THREE.Group(); cab.position.set(0, 0.58, 0.58); R.add(cab);
  const ca = contorno(new THREE.Mesh(facetado(2, (v) => { v.z *= 1.25; v.x *= 0.82; if (v.y > 0.4) v.y = 0.4 + (v.y - 0.4) * 0.4; if (v.z > 0.5) v.y *= 0.9; }, seed + 1, 0.08), azul), 0.02);
  ca.scale.setScalar(0.24); cab.add(ca);
  // bico: duas pirâmides (superior maior, curva)
  const bs = contorno(new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.42, 4), bm), 0.04); bs.rotation.set(Math.PI / 2 + 0.12, Math.PI / 4, 0); bs.scale.set(1, 1, 0.8); bs.position.set(0, 0.0, 0.42); cab.add(bs);
  const bi = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 4), bm); bi.rotation.set(Math.PI / 2 - 0.1, Math.PI / 4, 0); bi.position.set(0, -0.05, 0.36); cab.add(bi);
  // cerdas do bico
  const cer = new THREE.Mesh(facetado(1, (v) => { v.z *= 1.6; }, seed + 8, 0.3), azul); cer.scale.set(0.1, 0.07, 0.1); cer.position.set(0, 0.03, 0.24); cab.add(cer);
  const olhos = [1, -1].map((s) => { const o = olhoR11(0.068, 0x5a3a12, 0x26304a); o.g.position.set(s * 0.15, 0.06, 0.14); o.g.rotation.y = s * 1.05; o.abrir(0.95); cab.add(o.g); return o; });
  // asas: lâminas de pena sobrepostas
  const asas = [1, -1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * 0.33, 0.12, 0.05); g.rotation.set(0.45, s * 0.12, s * -0.1); R.add(g);
    for (let k = 0; k < 6; k++) { const p = contorno(new THREE.Mesh(facetado(1, (v) => { v.x *= 0.12; v.z *= 2.4; v.y *= 0.5; }, seed + 20 + k, 0.2), k % 2 ? preto : azul), 0.03);
      p.scale.setScalar(0.22 - k * 0.012); p.position.set(s * 0.01 * k, 0.12 - k * 0.07, -0.25 - k * 0.07); p.rotation.x = -0.08 * k; g.add(p); }
    return g;
  });
  for (let k = 0; k < 4; k++) { const c = contorno(new THREE.Mesh(facetado(1, (v) => { v.y *= 0.12; v.z *= 2.6; v.x *= 0.5; }, seed + 40 + k, 0.2), preto), 0.03); c.scale.setScalar(0.22); c.position.set((k - 1.5) * 0.06, -0.12, -0.92); c.rotation.set(-0.55, (k - 1.5) * 0.12, 0); R.add(c); }
  for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.32, 5), mat(0x23252a)); p.position.set(s * 0.12, -0.46, 0.08); R.add(p);
    for (const a of [-0.5, 0, 0.5]) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.14, 4), mat(0x23252a)); d.rotation.set(Math.PI / 2, a, 0); d.position.set(s * 0.12 + Math.sin(a) * 0.05, -0.6, 0.14 + Math.cos(a) * 0.03); R.add(d); } }
  return { root: R, cab, olhos, asas };
}

// molécula do ar: N2 (azul) ou O2 (vermelho), átomos facetados fundidos + nuvem de elétrons aditiva
const halo = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,0.9)"); r.addColorStop(0.35, "rgba(255,255,255,0.25)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
export function molecula(tipo = "N2", seed = 1, nuvem = 0.5) {
  const g = new THREE.Group(), c = tipo === "N2" ? 0x4f86d8 : 0xe0574a;
  const m = mat(c, 0.32, { emissive: c, emissiveIntensity: 0.08 });
  for (const s of [1, -1]) { const a = contorno(new THREE.Mesh(facetado(2, () => {}, seed + s, 0.08), m), 0.03); a.scale.setScalar(0.5); a.position.x = s * 0.36; g.add(a); }
  const lig = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 6), mat(0xdfe6f0, 0.4)); lig.rotation.z = Math.PI / 2; g.add(lig);
  if (nuvem > 0) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.4), transparent: true, opacity: nuvem, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.set(2.6, 1.8, 1); g.add(sp); }
  return g;
}

// palco R11 no renderizador WebGL compartilhado (1 contexto para o vídeo todo). A cena 2D (canvas) recebe a imagem pronta.
// Pós "cinema" (23/11): profundidade de campo com bokeh anamórfico, oclusão de ambiente (sombras de contato), névoa por profundidade,
// raios de luz (god rays) a partir de st.sol(vec3), bloom com halação quente, aberração cromática nas bordas, split-tone
// (sombras frias, luzes quentes), curva S de contraste, vinheta, grão por quadro; corte com dip de 5 quadros.
// st.draw() usa st.T / st.D (o bindSeek do monta-cenas preenche). Para prévia fora do vídeo, passe { webgl: canvasWebGL }.
// Atalhos: luz(st, "noite|por-do-sol|interior|dramatica|dia|frio"), focar(st, vec3), camMao(cam, t), poeira(S, {...}).
export function palco(canvas, { fov = 32, fundo = 0x14100c, foco = 1.5, faixa = 1.2, desfoque = 14, grao = 0.045, sat = 0.92, webgl = null,
  ao = 0.75, nevoa = 0.0, corNevoa = null, ca = 0.6, anamorf = 0.72, bloom = 0.7, contraste = 0.35, split = 0.6, raios = 0, barril = 0.12, flare = 0.6 } = {}) {
  const W = 1080, Hh = 1920;
  const r = webgl ? new THREE.WebGLRenderer({ canvas: webgl, antialias: false, preserveDrawingBuffer: true }) : sharedRenderer();
  if (webgl) { r.setPixelRatio(1); r.setSize(W, Hh, false); r.outputColorSpace = THREE.SRGBColorSpace; }
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const ctx = webgl ? null : canvas.getContext("2d");
  const S = new THREE.Scene(); S.background = new THREE.Color(fundo);
  const cam = new THREE.PerspectiveCamera(fov, W / Hh, 0.01, 400);
  const hemi = new THREE.HemisphereLight(0x9fb4d8, 0x2a1a10, 0.5); S.add(hemi);
  const fria = new THREE.DirectionalLight(0xa9c6ee, 2.6); fria.position.set(-1.2, 4, 1.2); S.add(fria);
  fria.castShadow = true; fria.shadow.mapSize.set(2048, 2048); fria.shadow.bias = -0.0004; fria.shadow.normalBias = 0.01; fria.shadow.radius = 4;
  Object.assign(fria.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.1, far: 20 });
  const quente = new THREE.DirectionalLight(0xffd2aa, 1.7); quente.position.set(1.2, 1.6, 3); S.add(quente);
  const rim = new THREE.DirectionalLight(0x8fb4ff, 2.4); rim.position.set(1.5, 1.5, -3); S.add(rim);
  const rim2 = new THREE.DirectionalLight(0xffa860, 1.2); rim2.position.set(-2, 0.5, -2.5); S.add(rim2);
  const dt = new THREE.DepthTexture(W, Hh); dt.type = THREE.UnsignedIntType;
  const rt = new THREE.WebGLRenderTarget(W, Hh, { samples: 4, type: THREE.HalfFloatType, depthTexture: dt });
  const cN = new THREE.Color(corNevoa ?? fundo);
  const U = { tC: { value: rt.texture }, tD: { value: dt }, near: { value: 0.01 }, far: { value: 400 }, foco: { value: foco }, faixa: { value: faixa },
    desf: { value: desfoque }, res: { value: new THREE.Vector2(W, Hh) }, grao: { value: grao }, sat: { value: sat }, quadro: { value: 0 }, dip: { value: 0 },
    ao: { value: ao }, nevoa: { value: nevoa }, corNevoa: { value: new THREE.Vector3(cN.r, cN.g, cN.b) }, ca: { value: ca }, anamorf: { value: anamorf },
    bloom: { value: bloom }, contraste: { value: contraste }, split: { value: split }, raios: { value: raios }, solUV: { value: new THREE.Vector2(0.5, 0.8) },
    corRaios: { value: new THREE.Vector3(1.0, 0.82, 0.6) }, sombraCor: { value: new THREE.Vector3(0.86, 0.98, 1.1) }, luzCor: { value: new THREE.Vector3(1.08, 1.0, 0.88) }, tinta: { value: new THREE.Vector3(1, 1, 1) }, barril: { value: barril }, flare: { value: flare }, solVis: { value: 0 }, mov: { value: new THREE.Vector2(0, 0) } };
  const pos = new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false,
    vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `uniform sampler2D tC, tD; uniform float near, far, foco, faixa, desf, grao, sat, quadro, dip, ao, nevoa, ca, anamorf, bloom, contraste, split, raios, barril, flare, solVis;
      uniform vec2 res, solUV, mov; uniform vec3 corNevoa, corRaios, sombraCor, luzCor, tinta; varying vec2 vU;
      float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
      float zl(vec2 u){ return lin(texture2D(tD, u).r); }
      float coc(vec2 u){ return clamp(abs(zl(u) - foco) / faixa, 0.0, 1.0); }
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
      void main(){
        vec2 U0 = 0.5 + (vU - 0.5) * (1.0 - barril * dot(vU - 0.5, vU - 0.5));
        float c0 = coc(U0); vec3 acc = texture2D(tC, U0).rgb; float w = 1.0; vec3 blo = vec3(0.0);
        float rot = h(U0 * res) * 6.2831;
        for (int i = 0; i < 48; i++) { float fi = float(i); float rr = sqrt((fi + 0.5) / 48.0); float an = fi * 2.39996 + rot;
          vec2 o = vec2(cos(an) * anamorf, sin(an)) * rr * desf / res;
          vec2 u2 = U0 + o * c0; float ci = coc(u2);
          vec3 s = texture2D(tC, u2).rgb; float wi = mix(0.2, 1.0, ci) * (1.0 + 2.0 * max(luma(s) - 1.0, 0.0) * c0); acc += s * wi; w += wi;
          if (i < 24) { vec3 sb = texture2D(tC, U0 + o * (i < 12 ? 3.0 : 7.0)).rgb; blo += max(sb - vec3(0.75), 0.0) * (i < 12 ? 1.0 : 0.6); } }
        vec3 col = acc / w;
        if (dot(mov, mov) > 0.0) { vec3 mb = col; for (int i = 1; i < 9; i++) { float fi = float(i) / 8.0 - 0.5; mb += texture2D(tC, U0 + mov * fi).rgb; } col = mb / 9.0; }   // desfoque de movimento (câmera rápida)
        // aberração cromática (cresce para as bordas)
        vec2 dc = (U0 - 0.5) * ca * 0.006;
        col.r += (texture2D(tC, U0 + dc).r - texture2D(tC, U0).r) * (1.0 - c0 * 0.6);
        col.b += (texture2D(tC, U0 - dc).b - texture2D(tC, U0).b) * (1.0 - c0 * 0.6);
        // oclusão de ambiente pela profundidade (contato entre objetos, cantos, rosto)
        float z0 = zl(U0);
        if (ao > 0.0 && z0 < 60.0) { float occ = 0.0; float rad = clamp(38.0 / z0, 3.0, 70.0);
          for (int i = 0; i < 12; i++) { float fi = float(i); float an = fi * 2.39996 + rot; float rr = (fi + 1.0) / 12.0;
            vec2 u2 = U0 + vec2(cos(an), sin(an)) * rr * rad / res; float dz = z0 - zl(u2);
            occ += clamp((dz - 0.015 * z0) / (0.25 * z0 + 0.02), 0.0, 1.0) * (1.0 - smoothstep(0.35 * z0, 0.9 * z0 + 0.3, dz)); }
          col *= 1.0 - ao * 0.85 * occ / 12.0; }
        // névoa por profundidade
        if (nevoa > 0.0) { float ceu0 = step(far * 0.5, z0); col = mix(col, corNevoa, (1.0 - exp(-nevoa * clamp(z0 - 0.5, 0.0, 60.0))) * mix(0.92, 0.35, ceu0)); }
        // raios de luz: marcha em direção ao sol somando o que é claro/céu
        if (raios > 0.0) { vec2 d = (solUV - U0) / 32.0; vec2 u = U0; float dec = 1.0, acr = 0.0; float j = h(U0 * res + 3.1);
          for (int i = 0; i < 32; i++) { u += d * (1.0 + 0.15 * j); vec3 s = texture2D(tC, clamp(u, 0.0, 1.0)).rgb; float ceu = step(far * 0.5, zl(clamp(u, 0.0, 1.0)));
            acr += max(luma(s) - 0.85, 0.0) * dec * (0.3 + 0.7 * ceu); dec *= 0.95; }
          col += corRaios * acr * raios * 0.05; }
        col += blo * 0.03 * bloom * vec3(1.0, 0.86, 0.74);
        if (flare > 0.0 && solVis > 0.0) { vec2 ax = vec2(0.5) - solUV; float fl = 0.0; vec3 fc = vec3(0.0);
          for (int i = 0; i < 5; i++) { float fi = float(i); vec2 gp = solUV + ax * (0.45 + fi * 0.38); float rr = 0.018 + 0.02 * fi; float dd = length((U0 - gp) * vec2(1.0, 1.78));
            fc += mix(vec3(1.0, 0.55, 0.3), vec3(0.4, 0.7, 1.0), fi / 4.0) * smoothstep(rr, rr * 0.6, dd) * 0.10; }
          vec2 dv = (U0 - solUV) * vec2(1.0, 1.78); fc += vec3(1.0, 0.7, 0.45) * exp(-abs(dv.y) * 160.0) * exp(-abs(dv.x) * 2.2) * 0.6;
          col += fc * flare * solVis; }
        col *= tinta;
        float l = luma(col); col = mix(vec3(l), col, sat);
        col = mix(col, col * mix(sombraCor, luzCor, smoothstep(0.04, 0.7, l)), split);
        vec2 q = U0 - 0.5; col *= 1.0 - smoothstep(0.32, 0.95, length(q * vec2(1.0, 0.72))) * 0.62;
        col += (h(U0 * res + quadro * 17.31) - 0.5) * grao * (0.6 + 0.8 * (1.0 - smoothstep(0.0, 0.5, l)));
        col *= 1.0 - dip;
        gl_FragColor = vec4(max(col, 0.0), 1.0);
        #include <tonemapping_fragment>
        gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * gl_FragColor.rgb * (3.0 - 2.0 * gl_FragColor.rgb), contraste);
        #include <colorspace_fragment>
      }` });
  pos.toneMapped = true;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pos); quad.frustumCulled = false;
  const S2 = new THREE.Scene(); S2.add(quad); const cam2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const solP = new THREE.Vector3(); let temSol = false;
  const st = { r, renderer: r, S, scene: S, cam, ctx, hemi, fria, key: fria, quente, rim, rim2, U, T: 0, D: 0, exposicao: 1.1,
    warm: { renderer: r, scene: S, camera: cam },
    sol(v, forca = null) { solP.copy(v); temSol = true; if (forca !== null) U.raios.value = forca; },
    draw() {
      if (!st._s) { st._s = 1; S.traverse((o) => { if (o.isMesh && o.material && o.material.type !== "MeshBasicMaterial") { o.castShadow = o.material.side !== THREE.BackSide; o.receiveShadow = true; } }); }
      const T = st.T || 0, D = st.D || 1e9;
      U.near.value = cam.near; U.far.value = cam.far; U.quadro.value = Math.floor(T * 30);
      U.dip.value = Math.min(1, Math.max(1 - T / 0.17, 1 - (D - T) / 0.12, 0)) * 0.85;
      if (temSol) { cam.updateMatrixWorld(); const p = solP.clone().project(cam); U.solUV.value.set(p.x * 0.5 + 0.5, p.y * 0.5 + 0.5); U.solVis.value = p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1 ? 1 : 0; }
      const tm = r.toneMapping, te = r.toneMappingExposure;
      r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = st.exposicao;
      r.setRenderTarget(rt); r.render(S, cam); r.setRenderTarget(null); r.render(S2, cam2);
      r.toneMapping = tm; r.toneMappingExposure = te;
      if (ctx) { ctx.globalCompositeOperation = "copy"; ctx.drawImage(r.domElement, 0, 0); ctx.globalCompositeOperation = "source-over"; }
    } };
  return st;
}
// presets de luz de cinema: muda as 5 luzes, o fundo, a névoa e a gradação de uma vez
const LUZ = {
  noite: { fundo: 0x0b1220, hemi: [0x5a78b0, 0x140c08, 0.35], fria: [0x8fb0ff, 2.2], quente: [0xff9a4a, 1.1], rim: [0x6f9cff, 3.0], rim2: [0xff7a3a, 1.6], nevoa: 0.035, split: 0.7, exp: 1.05 },
  "por-do-sol": { fundo: 0x3a2236, hemi: [0xffb27a, 0x2a1830, 0.45], fria: [0xffa25a, 3.4], quente: [0x7f8cff, 0.9], rim: [0xffc070, 3.6], rim2: [0x7a6cff, 1.0], nevoa: 0.012, split: 0.5, raios: 0.8, exp: 1.05 },
  interior: { fundo: 0x18120e, hemi: [0xd8b898, 0x20160e, 0.35], fria: [0xfff0d8, 3.0], quente: [0xffb070, 0.8], rim: [0xbfd4ff, 1.4], rim2: [0xffa860, 1.0], nevoa: 0.02, split: 0.45, raios: 0.9, exp: 1.1 },
  dramatica: { fundo: 0x080808, hemi: [0x30384a, 0x050403, 0.15], fria: [0xfff1e0, 4.0], quente: [0xff9050, 0.3], rim: [0x9ab8ff, 3.4], rim2: [0xff6a30, 0.6], nevoa: 0.01, split: 0.6, exp: 1.0 },
  dia: { fundo: 0x9fc4e8, hemi: [0xcfe4ff, 0x6a5a48, 0.8], fria: [0xfff4e0, 3.2], quente: [0xffe0c0, 1.0], rim: [0xd8e8ff, 1.6], rim2: [0xffe0b0, 0.6], nevoa: 0.012, split: 0.3, exp: 1.15 },
  frio: { fundo: 0xaec4d8, hemi: [0xdfefff, 0x8a9aa8, 0.9], fria: [0xe8f2ff, 2.6], quente: [0xffd8b0, 0.5], rim: [0xcfe2ff, 2.0], rim2: [0xa8c8ff, 0.8], nevoa: 0.05, split: 0.55, exp: 1.1 },
};
export function luz(st, nome) {
  const L = LUZ[nome]; if (!L) return;
  st.S.background = new THREE.Color(L.fundo); st.hemi.color.setHex(L.hemi[0]); st.hemi.groundColor.setHex(L.hemi[1]); st.hemi.intensity = L.hemi[2];
  for (const k of ["fria", "quente", "rim", "rim2"]) { st[k].color.setHex(L[k][0]); st[k].intensity = L[k][1]; }
  const c = new THREE.Color(L.fundo); st.U.corNevoa.value.set(c.r, c.g, c.b); st.U.nevoa.value = L.nevoa; st.U.split.value = L.split; st.U.raios.value = L.raios || 0; st.exposicao = L.exp;
}
// foco automático na distância da câmera até um ponto (rack focus: chame com pontos diferentes ao longo do tempo)
export function focar(st, alvo, k = 1) { const d = st.cam.position.distanceTo(alvo); st.U.foco.value = st.U.foco.value + (d - st.U.foco.value) * k; }
// câmera na mão: tremor orgânico (soma de senos, determinístico). Chame depois do lookAt.
export function camMao(cam, t, { intens = 1, seed = 1 } = {}) {
  const r = mulberry32(seed * 17 + 5), a = [r() * 6, r() * 6, r() * 6];
  cam.rotation.x += intens * (0.0045 * Math.sin(t * 1.3 + a[0]) + 0.002 * Math.sin(t * 3.7 + a[1]));
  cam.rotation.y += intens * (0.0045 * Math.sin(t * 1.1 + a[1]) + 0.002 * Math.sin(t * 4.1 + a[2]));
  cam.rotation.z += intens * 0.003 * Math.sin(t * 0.9 + a[2]);
}
// poeira no ar: partículas que pegam a luz e flutuam devagar (deixa a luz "visível")
export function poeira(S, { n = 120, centro = [0, 1.4, 0], raio = [2.5, 1.5, 2.5], cor = 0xffe2b8, seed = 4, tam = 0.008 } = {}) {
  const r = mulberry32(seed), g = new THREE.Group(); S.add(g);
  const m = new THREE.SpriteMaterial({ map: halo, color: new THREE.Color(cor).multiplyScalar(2.2), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
  const P = [];
  for (let i = 0; i < n; i++) { const sp = new THREE.Sprite(m); const s = tam * (0.5 + r() * 1.5) * 3; sp.scale.set(s, s, s); g.add(sp);
    P.push({ sp, b: [centro[0] + (r() - 0.5) * 2 * raio[0], centro[1] + (r() - 0.5) * 2 * raio[1], centro[2] + (r() - 0.5) * 2 * raio[2]], f: 0.1 + r() * 0.25, ph: r() * 6.28 }); }
  const up = (t) => P.forEach((p) => p.sp.position.set(p.b[0] + 0.08 * Math.sin(t * p.f + p.ph), p.b[1] + 0.05 * Math.sin(t * p.f * 1.3 + p.ph * 2) + 0.02 * t, p.b[2] + 0.08 * Math.cos(t * p.f * 0.8 + p.ph)));
  up(0); return { g, update: up };
}
function olho(r) { const o = olhoR11(r); o.palp = o.sup.children[0]; return o; }

// luzes de fundo que o foco transforma em bokeh
export function bokeh(S, { n = 40, seed = 2, cores = [0xffb35a, 0x7fb6ff, 0xff6a4a, 0xfff0d0], x = [-6, 6], y = [0, 4], z = [-12, -5] } = {}) {
  const rr = mulberry32(seed), g = new THREE.Group();
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05 + rr() * 0.08, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(cores[i % cores.length]).multiplyScalar(2.5 + rr() * 2) }));
    m.position.set(x[0] + rr() * (x[1] - x[0]), y[0] + rr() * (y[1] - y[0]), z[0] + rr() * (z[1] - z[0])); g.add(m); }
  S.add(g); return g;
}

// polvo low-poly: manto + 8 braços em cadeia afinando, olho com pupila horizontal
export function polvo(seed = 5, cor = 0xc45a3c) {
  const R = new THREE.Group(), m = mat(cor, 0.5), m2 = mat(new THREE.Color(cor).multiplyScalar(0.7).getHex(), 0.5);
  const manto = contorno(new THREE.Mesh(facetado(2, (v) => { v.y *= 1.35; if (v.y < 0) v.y *= 0.6; v.z -= 0.25 * Math.max(0, v.y); }, seed, 0.1), m), 0.015); manto.scale.setScalar(0.4); manto.position.y = 0.5; R.add(manto);
  const olhos = [1, -1].map((s) => { const o = olhoR11(0.09, 0xd8b040, cor); o.g.position.set(s * 0.17, 0.5, 0.3); o.g.rotation.y = s * 0.45; o.abrir(0.75);
    o.globo.children[3].scale.set(1.4, 0.45, 1); R.add(o.g); return o; });
  const bracos = [];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + 0.2; let pai = R; const g0 = new THREE.Group(); g0.position.set(Math.cos(a) * 0.22, 0.25, Math.sin(a) * 0.22); g0.rotation.y = -a + Math.PI / 2; R.add(g0); pai = g0;
    for (let j = 0; j < 9; j++) { const r0 = 0.07 * (1 - j / 9), r1 = 0.07 * (1 - (j + 1) / 9);
      const seg = new THREE.Group(); seg.position.z = j === 0 ? 0 : 0.17; seg.rotation.x = j === 0 ? 1.2 : -0.2 + 0.25 * Math.sin(k * 1.7 + j * 0.9); seg.rotation.y = 0.12 * Math.sin(k * 2.3 + j * 0.8); pai.add(seg);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, 0.18, 5), j % 2 ? m : m2); c.rotation.x = Math.PI / 2; c.position.z = 0.085; seg.add(c); pai = seg; }
    bracos.push(g0);
  }
  return { root: R, olhos, bracos };
}

// etiqueta 2D presa a um ponto 3D, sempre dentro da área segura (x 60–1020, y 640–1000 por padrão: abaixo do HUD, acima da legenda)
const _v = new THREE.Vector3();
export function etiqueta(ctx, txt, pos, cam, a = 1, { y0 = 640, y1 = 1000, tam = 30, cor = "#fff", fundo = "rgba(10,12,18,0.72)" } = {}) {
  if (a <= 0) return;
  _v.copy(pos).project(cam); if (_v.z > 1) return;
  ctx.save(); ctx.font = `600 ${tam}px "Inter", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const w = ctx.measureText(txt).width + 36, h = tam * 1.7;
  const x = Math.min(1020 - w / 2, Math.max(60 + w / 2, (_v.x * 0.5 + 0.5) * 1080)), y = Math.min(y1, Math.max(y0, (-_v.y * 0.5 + 0.5) * 1920));
  ctx.globalAlpha = a; ctx.fillStyle = fundo; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 10); ctx.fill(); ctx.fillStyle = cor; ctx.fillText(txt, x, y);
  ctx.restore();
}

// ===== bichos com o mesmo acabamento R11 =====
// urso (pardo/negro): corpo pesado, cabeça com focinho claro, orelhas redondas, 4 patas. respira(k), dormir(k 0..1 deita a cabeça), olhos fechados no sono.
export function urso({ seed = 7, cor = 0x4a3426, focinho = 0x8a6a4a } = {}) {
  const R = new THREE.Group(), m = mat(cor, 0.9), mf = mat(focinho, 0.85), esc = mat(new THREE.Color(cor).multiplyScalar(0.7).getHex(), 0.9);
  const corpo = contorno(new THREE.Mesh(facetado(2, (v) => { v.z *= 1.45; v.y *= 0.92; if (v.y > 0.2 && v.z < 0.2) v.y += 0.18 * (1 - Math.abs(v.x)); if (v.y < -0.4) v.y = -0.4 + (v.y + 0.4) * 0.5; }, seed, 0.09), m), 0.012);
  corpo.scale.set(0.62, 0.6, 0.62); corpo.position.y = 0.72; R.add(corpo);
  const pesc = new THREE.Group(); pesc.position.set(0, 0.82, 0.7); R.add(pesc);
  const cab = new THREE.Group(); cab.position.set(0, 0.06, 0.18); pesc.add(cab);
  const ca = contorno(new THREE.Mesh(facetado(2, (v) => { v.x *= 0.95; v.y *= 0.88; if (v.z < -0.3) v.z = -0.3 + (v.z + 0.3) * 0.5; }, seed + 1, 0.08), m), 0.02); ca.scale.setScalar(0.3); cab.add(ca);
  const foc = contorno(new THREE.Mesh(facetado(1, (v) => { v.z *= 1.3; v.y *= 0.75; }, seed + 2, 0.1), mf), 0.03); foc.scale.setScalar(0.14); foc.position.set(0, -0.07, 0.27); cab.add(foc);
  const nar = new THREE.Mesh(facetado(1, (v) => { v.y *= 0.7; }, seed + 3, 0.1), mat(0x15100c, 0.3)); nar.scale.set(0.055, 0.04, 0.04); nar.position.set(0, -0.02, 0.44); cab.add(nar);
  for (const s of [1, -1]) { const o = contorno(new THREE.Mesh(facetado(1, (v) => { v.z *= 0.45; }, seed + 4 + s, 0.1), m), 0.04); o.scale.setScalar(0.1); o.position.set(s * 0.21, 0.22, -0.04); cab.add(o);
    const oi = new THREE.Mesh(facetado(1, (v) => { v.z *= 0.3; }, seed + 6 + s, 0.1), esc); oi.scale.setScalar(0.06); oi.position.set(s * 0.21, 0.215, 0.0); cab.add(oi); }
  const olhos = [1, -1].map((s) => { const o = olhoR11(0.045, 0x3a2414, cor); o.g.position.set(s * 0.12, 0.06, 0.24); o.g.rotation.y = s * 0.3; o.abrir(0.7); cab.add(o.g); return o; });
  const patas = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz], i) => { const g = new THREE.Group(); g.position.set(sx * 0.3, 0.6, sz * 0.48); R.add(g);
    const c = contorno(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.62, 6), m), 0.02); c.position.y = -0.27; g.add(c);
    const pe = contorno(new THREE.Mesh(facetado(1, (v) => { v.y *= 0.5; v.z *= 1.3; }, seed + 10 + i, 0.1), esc), 0.03); pe.scale.setScalar(0.14); pe.position.set(0, -0.58, 0.05); g.add(pe); return g; });
  const rabo = new THREE.Mesh(facetado(1, () => {}, seed + 20, 0.2), m); rabo.scale.setScalar(0.08); rabo.position.set(0, 0.85, -0.88); R.add(rabo);
  const o = { root: R, corpo, cab, pesc, olhos, patas,
    respira(k) { corpo.scale.set(0.62 * (1 + 0.03 * k), 0.6 * (1 + 0.04 * k), 0.62); },
    dormir(k) { // deita: patas dobram, corpo desce, cabeça apoiada no chão, olhos fecham
      const e = sm(Math.min(1, k)); R.children.forEach(() => {}); corpo.position.y = 0.72 - 0.38 * e; pesc.position.y = 0.82 - 0.55 * e; pesc.rotation.x = 0.35 * e;
      patas.forEach((g, i) => { g.rotation.x = (i < 2 ? -1.35 : 1.25) * e; g.position.y = 0.6 - 0.36 * e; });
      olhos.forEach((q) => q.abrir(0.7 * (1 - e))); },
    andar(t, vel = 1) { const ph = t * vel * 2 * Math.PI * 0.8; patas.forEach((g, i) => (g.rotation.x = 0.35 * Math.sin(ph + [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5][i])));
      corpo.rotation.z = 0.03 * Math.sin(ph); pesc.rotation.x = 0.06 * Math.sin(ph * 2); return t * vel * 0.9; } };
  return o;
}
// lêmure (primata de Madagascar): corpo cinza esguio, rosto escuro em máscara, olhos enormes alaranjados, cauda longa listrada.
export function lemure({ seed = 11, cor = 0x8d8a86, ventre = 0xd8d0c4, cauda = true } = {}) {
  const R = new THREE.Group(), m = mat(cor, 0.85), mv = mat(ventre, 0.85), md = mat(0x2a2624, 0.8);
  const corpo = contorno(new THREE.Mesh(facetado(2, (v) => { v.y *= 1.45; v.z *= 0.85; if (v.y < -0.6) v.x *= 1.1; }, seed, 0.08), m), 0.015); corpo.scale.set(0.16, 0.18, 0.16); corpo.position.y = 0.28; R.add(corpo);
  const bar = new THREE.Mesh(facetado(1, (v) => { v.y *= 1.4; v.z *= 0.5; }, seed + 1, 0.1), mv); bar.scale.set(0.11, 0.15, 0.08); bar.position.set(0, 0.26, 0.09); R.add(bar);
  const cab = new THREE.Group(); cab.position.set(0, 0.55, 0.03); R.add(cab);
  const ca = contorno(new THREE.Mesh(facetado(2, (v) => { v.x *= 1.05; v.y *= 0.92; }, seed + 2, 0.06), mv), 0.02); ca.scale.setScalar(0.12); cab.add(ca);
  const mascara = new THREE.Mesh(facetado(1, (v) => { v.z *= 1.6; v.y *= 0.8; v.x *= 0.72; }, seed + 3, 0.1), md); mascara.scale.setScalar(0.075); mascara.position.set(0, -0.025, 0.08); cab.add(mascara);
  const nar = new THREE.Mesh(new THREE.IcosahedronGeometry(0.014, 0), mat(0x0e0a08, 0.3)); nar.position.set(0, -0.03, 0.195); cab.add(nar);
  for (const s of [1, -1]) { const o = contorno(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.075, 4), m), 0.05); o.position.set(s * 0.085, 0.09, -0.01); o.rotation.z = -s * 0.5; cab.add(o); }
  const olhos = [1, -1].map((s) => { const o = olhoR11(0.034, 0xe08a22, 0x2a2624); o.g.position.set(s * 0.048, 0.012, 0.1); o.g.rotation.y = s * 0.2; o.abrir(0.95); cab.add(o.g); return o; });
  const membros = [[1, 0.42, 0.05], [-1, 0.42, 0.05], [1, 0.16, 0.02], [-1, 0.16, 0.02]].map(([s, y, z], i) => { const g = new THREE.Group(); g.position.set(s * 0.1, y, z); R.add(g);
    const c = contorno(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.2, 5), m), 0.04); c.position.y = -0.1; g.add(c);
    const mao = new THREE.Mesh(facetado(1, () => {}, seed + 30 + i, 0.15), md); mao.scale.setScalar(0.03); mao.position.y = -0.21; g.add(mao); g.rotation.x = i < 2 ? -0.7 : -1.2; g.rotation.z = s * 0.2; return g; });
  const rabo = new THREE.Group(); rabo.position.set(0, 0.12, -0.12); R.add(rabo);
  const elos = [];
  if (cauda) { let pai = rabo; for (let j = 0; j < 14; j++) { const g = new THREE.Group(); g.position.y = j ? -0.06 : 0; g.rotation.x = j ? 0.09 : 2.6; pai.add(g);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03 - j * 0.0008, 0.03 - (j + 1) * 0.0008, 0.065, 6), j % 2 ? md : mv); c.position.y = -0.03; g.add(c); elos.push(g); pai = g; } }
  return { root: R, cab, olhos, membros, rabo, elos, corpo,
    respira(k) { corpo.scale.set(0.16 * (1 + 0.04 * k), 0.18, 0.16 * (1 + 0.05 * k)); },
    enrolar(k, t = 0) { const e = sm(Math.min(1, k)); // encolhe em bola com a cauda enrolada (sono/hibernação)
      corpo.rotation.x = 0.7 * e; cab.position.set(0, 0.55 - 0.3 * e, 0.03 + 0.12 * e); cab.rotation.x = 0.9 * e; olhos.forEach((q) => q.abrir(0.95 * (1 - e)));
      elos.forEach((g, j) => (g.rotation.x = j ? 0.09 + 0.32 * e + 0.03 * Math.sin(t * 0.8 + j * 0.5) * (1 - e) : 2.6 - 1.2 * e)); },
    cauda(t) { elos.forEach((g, j) => { if (j) g.rotation.z = 0.05 * Math.sin(t * 1.4 - j * 0.45); }); } };
}

// ===== alcançar: IK de 2 ossos. Leva a mão (lado 0 ou 1) até um ponto do mundo, cotovelo apontando para fora/baixo.
// Use depois de pose/andar e antes de vida. Ex.: mão no rosto = alcancar(p, 0, rostoMundo, 1); segurar xícara, tocar a parede, coçar a cabeça.
const _t = new THREE.Vector3(), _o = new THREE.Vector3(), _w = new THREE.Vector3(), _e = new THREE.Vector3(), _pl = new THREE.Vector3(), _qq = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _m4 = new THREE.Matrix4();
export function alcancar(p, lado, alvo, k = 1, { polo = null, maoGira = 0 } = {}) {
  if (k <= 0) return; k = sm(Math.min(1, k));
  const b = p.bracos[lado], om = b.om, L1 = 0.32, L2 = 0.345;
  p.root.updateMatrixWorld(true);
  // alvo no espaço do pai do ombro
  _m4.copy(om.parent.matrixWorld).invert(); _t.copy(alvo).applyMatrix4(_m4).sub(om.position);
  const d = Math.min(_t.length(), (L1 + L2) * 0.995), dn = _t.clone().normalize();
  const cE = (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), dobra = Math.PI - Math.acos(Math.max(-1, Math.min(1, cE)));
  // pulso no espaço do ombro com essa dobra
  _w.set(0, -L1 - L2 * Math.cos(dobra), L2 * Math.sin(dobra));
  _qq.setFromUnitVectors(_w.clone().normalize(), dn);
  // gira em volta do eixo ombro→alvo para o cotovelo ficar do lado do polo
  _e.set(0, -L1, 0).applyQuaternion(_qq);
  _pl.copy(polo || new THREE.Vector3(b.s * 0.55, -1, -0.25)).normalize();
  const proj = (v) => v.clone().sub(dn.clone().multiplyScalar(v.dot(dn))).normalize();
  const a = proj(_e), c = proj(_pl); let ang = Math.acos(Math.max(-1, Math.min(1, a.dot(c)))); if (a.clone().cross(c).dot(dn) < 0) ang = -ang;
  _qp.setFromAxisAngle(dn, ang); _qq.premultiply(_qp);
  const q0 = om.quaternion.clone(); om.quaternion.copy(q0.slerp(_qq, k));
  b.cot.rotation.set(L_(b.cot.rotation.x, -dobra, k), b.cot.rotation.y * (1 - k), b.cot.rotation.z * (1 - k));
  b.pulso.rotation.set(L_(b.pulso.rotation.x, 0.25, k), L_(b.pulso.rotation.y, maoGira, k), b.pulso.rotation.z * (1 - k));
}
// ponto do rosto/cabeça no mundo (para alcancar/olharPara): onde = "boca" | "bochecha" | "testa" | "topo" | "nuca"
export function pontoCabeca(p, onde = "bochecha", lado = 0) {
  const s = p.bracos[lado].s, P = { boca: [0, -0.08, 0.13], bochecha: [s * 0.095, -0.075, 0.075], testa: [0, 0.07, 0.13], topo: [s * 0.05, 0.16, 0.0], nuca: [s * 0.04, 0.02, -0.13] }[onde];
  p.root.updateMatrixWorld(true); return p.cab.localToWorld(new THREE.Vector3(...P));
}
// fala procedural: a boca abre e fecha em sílabas (~5/s) com pausas; some à expressão atual. Use em cenas de diálogo.
export function falar(p, t, { seed = 1, intens = 1 } = {}) {
  const r = mulberry32(seed * 53 + 2); const ph = t * 5.2 * 2 * Math.PI;
  const env = 0.6 + 0.4 * Math.sin(t * 1.7 + r() * 6) ; const pausa = Math.sin(t * 0.9 + r() * 6) > 0.85 ? 0 : 1;
  const fa = Math.max(0, Math.sin(ph) * 0.7 + Math.sin(ph * 1.63 + 1.1) * 0.3) * env * pausa * intens;
  p.emocao({ ...p.estado(), fa }, p.olharAtual());
  p.cab.rotation.x += 0.02 * fa; p.cab.rotation.y += 0.015 * Math.sin(t * 2.3);
}

// boca sincronizada com a narração: palavras = audio/palavras.json ([{text, start, end}]), t0 = início da cena no vídeo.
// Cada sílaba (vogal) abre a boca; "o/u" arredondam (boca estreita), "a/e/i" abrem largo. Pausas fecham.
export function falarPalavras(p, t, palavras, t0 = 0, { intens = 1 } = {}) {
  const T = t + t0; const w = palavras.find((q) => T >= q.start - 0.03 && T <= q.end + 0.03);
  let fa = 0, larg = 1;
  if (w) { const sil = (w.text.toLowerCase().match(/[aeiouáéíóúâêôãõà]+/g) || ["a"]); const n = sil.length, u = Math.min(0.999, Math.max(0, (T - w.start) / Math.max(0.05, w.end - w.start)));
    const k = Math.floor(u * n), f = u * n - k, v = sil[k][0];
    fa = Math.sin(Math.PI * f) ** 0.7 * intens * (/[oóôõuú]/.test(v) ? 0.75 : /[ií]/.test(v) ? 0.55 : 1); larg = /[oóôõuú]/.test(v) ? 0.72 : /[ieíé]/.test(v) ? 1.15 : 1; }
  const e = p.estado(); p.emocao({ ...e, bo: [e.bo[0] * larg, e.bo[1]], fa }, p.olharAtual());
  p.cab.rotation.x += 0.015 * fa;
}

// ===== corpo: mais animações (17–27) =====
// correr: passada longa, fase aérea, braços a 90°, tronco inclinado. Devolve a distância.
export function correr(p, t, { vel = 1, amp = 1, fase = 0 } = {}) {
  const ph = t * vel * 2 * Math.PI * 1.45 + fase;
  p.pernas.forEach((l, i) => { const a = ph + (i ? Math.PI : 0), fw = Math.sin(a), sw = Math.max(0, Math.cos(a));
    l.q.rotation.x += amp * (-0.75 * fw - 0.25 * sw); l.j.rotation.x += amp * (0.15 + 1.5 * sw ** 1.3 + 0.3 * Math.max(0, -fw)); l.pe.rotation.x += amp * 0.3 * Math.max(0, -fw); });
  p.bracos.forEach((b, i) => { const fw = Math.sin(ph + (i ? 0 : Math.PI)); b.om.rotation.x += -0.7 * amp * fw; b.cot.rotation.x += -1.35 * amp - 0.2 * amp * fw; b.om.rotation.z -= b.s * 0.05; });
  p.quadril.position.y += amp * (0.06 * Math.abs(Math.cos(ph)) - 0.05); p.coluna.rotation.x += 0.22 * amp; p.cab.rotation.x -= 0.12 * amp;
  p.quadril.rotation.y += 0.12 * amp * Math.sin(ph); p.coluna.rotation.y -= 0.2 * amp * Math.sin(ph);
  p.abas.forEach((a, i) => { a.rotation.x += -0.25 * amp - 0.1 * Math.abs(Math.sin(ph)); a.rotation.z += (i ? 1 : -1) * 0.1 * Math.sin(ph * 2); });
  if (p.mechas) p.mechas.rotation.x += -0.2 * amp + 0.08 * Math.sin(ph * 2);
  return t * vel * 2.6;
}
// sentar/levantar com antecipação (inclina o tronco à frente no meio do movimento). k 0 = em pé, 1 = sentado.
export function sentar(p, k) { pose(p, "sentado", k); const m = Math.sin(Math.PI * Math.min(1, Math.max(0, k))); p.coluna.rotation.x += 0.45 * m; p.cab.rotation.x -= 0.2 * m; p.bracos.forEach((b) => (b.om.rotation.x -= 0.4 * m)); }
// deitar (0 em pé → 1 deitado de costas); acordar = deitar com k indo de 1 a 0, depois pose "espreguicar".
export function deitar(p, k) { sentar(p, Math.min(1, k * 2)); const e = sm(Math.max(0, Math.min(1, k * 2 - 1))); p.root.rotation.x = -Math.PI / 2 * e; p.quadril.position.y = L_(p.quadril.position.y, 0.92 + 0.16, e); pose(p, "deitado", e); }
// virar no lugar com passinhos: k 0..1 vai do ângulo de → para
export function virar(p, k, de, para) { const e = sm(Math.min(1, Math.max(0, k))); p.root.rotation.y = L_(de, para, e); const st = Math.sin(Math.PI * e);
  p.pernas.forEach((l, i) => { const a = Math.max(0, Math.sin(e * Math.PI * 4 + (i ? Math.PI : 0))) * st; l.q.rotation.x -= 0.35 * a; l.j.rotation.x += 0.6 * a; }); p.cab.rotation.y += (para - de) * 0.25 * Math.sin(Math.PI * Math.min(1, e * 1.6)); }
// mola: oscilação amortecida depois de um evento em t0 (cabeça, cabelo, objeto que para de repente)
export const mola = (t, t0, amp = 1, freq = 2.6, amort = 4) => (t < t0 ? 0 : amp * Math.exp(-amort * (t - t0)) * Math.sin(freq * 2 * Math.PI * (t - t0)));
export function molaCabeca(p, t, t0, amp = 0.25) { const m = mola(t, t0, amp); p.cab.rotation.x += m; p.coluna.rotation.x += m * 0.3; if (p.mechas) p.mechas.rotation.x -= m * 1.5; p.abas.forEach((a) => (a.rotation.x -= m * 0.6)); }
// IK genérico de 2 ossos (usado pelos pés). dobra > 0 dobra para trás (joelho); < 0 para a frente (cotovelo).
const _i1 = new THREE.Vector3(), _i2 = new THREE.Vector3(), _iq = new THREE.Quaternion(), _iq2 = new THREE.Quaternion(), _im = new THREE.Matrix4();
function ik2(o1, o2, L1, L2, alvo, polo, k, sinal) {
  o1.parent.updateMatrixWorld(true); _im.copy(o1.parent.matrixWorld).invert(); _i1.copy(alvo).applyMatrix4(_im).sub(o1.position);
  const d = Math.min(_i1.length(), (L1 + L2) * 0.998), dn = _i1.clone().normalize(), cE = (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), b = Math.PI - Math.acos(Math.max(-1, Math.min(1, cE)));
  _i2.set(0, -L1 - L2 * Math.cos(b), -sinal * L2 * Math.sin(b)); _iq.setFromUnitVectors(_i2.normalize(), dn);
  const e = new THREE.Vector3(0, -L1, 0).applyQuaternion(_iq), pr = (v) => v.clone().sub(dn.clone().multiplyScalar(v.dot(dn))).normalize(), a1 = pr(e), c1 = pr(polo);
  let ang = Math.acos(Math.max(-1, Math.min(1, a1.dot(c1)))); if (a1.clone().cross(c1).dot(dn) < 0) ang = -ang; _iq2.setFromAxisAngle(dn, ang); _iq.premultiply(_iq2);
  o1.quaternion.slerp(_iq, k); o2.rotation.x = L_(o2.rotation.x, sinal * b, k);
}
// pés presos: leva o pé (lado 0/1) até um ponto do chão no mundo (degrau, pedal, chão irregular)
export function pisar(p, lado, alvo, k = 1) { const l = p.pernas[lado]; ik2(l.q, l.j, 0.46, 0.44, alvo, new THREE.Vector3(0, 0.2, 1), sm(Math.min(1, k)), 1); }
// segurar/soltar: o objeto passa a seguir a mão; soltar devolve à cena mantendo a posição
export function segurar(p, lado, obj, { pos = [0, -0.085, 0.035] } = {}) { const b = p.bracos[lado]; b.pulso.add(obj); obj.position.set(...pos); obj.rotation.set(0, 0, 0); punho(p, 0.65, lado); return obj; }
export function soltar(obj, cena) { cena.attach(obj); return obj; }
// cair para a frente: 0–0,3 tropeça (braços à frente), 0,3–1 vai ao chão
export function cair(p, k) { const a = Math.min(1, k / 0.3), b = sm(Math.max(0, (k - 0.3) / 0.7));
  pose(p, "susto", a); p.coluna.rotation.x += 0.5 * a; p.pernas[0].q.rotation.x -= 0.6 * a; p.pernas[1].q.rotation.x += 0.3 * a;
  p.root.rotation.x = 1.45 * b; p.bracos.forEach((x) => { x.om.rotation.x = L_(x.om.rotation.x, -2.4, b); x.cot.rotation.x = L_(x.cot.rotation.x, -0.4, b); }); }
// tremer (frio, medo): vibração rápida pequena
export function tremer(p, t, intens = 1) { const f = t * 2 * Math.PI; const v = (a, b) => intens * a * Math.sin(f * b);
  p.coluna.rotation.z += v(0.012, 9.3); p.coluna.rotation.x += v(0.01, 11.1); p.cab.rotation.y += v(0.02, 7.7); p.cab.rotation.x += v(0.012, 12.3);
  p.bracos.forEach((b, i) => { b.om.rotation.x += v(0.02, 10.4 + i); b.cot.rotation.x += v(0.03, 13.1 + i); }); }
// gestos de fala: mãos sobem e marcam o ritmo (use com falar/falarPalavras). lados: 0, 1 ou "ambos"
export function gesticular(p, t, { seed = 1, intens = 1, lados = "ambos" } = {}) { const r = mulberry32(seed * 19 + 4), f0 = 1.1 + r() * 0.5;
  p.bracos.forEach((b, i) => { if (lados !== "ambos" && lados !== i) return; const ph = t * f0 * 2 * Math.PI + i * 1.9 + r() * 6, bat = Math.max(0, Math.sin(ph)) ** 2, sobe = 0.6 + 0.4 * Math.sin(t * 0.7 + i * 2);
    b.om.rotation.x += intens * (-0.35 * sobe - 0.18 * bat); b.om.rotation.z -= b.s * intens * 0.12 * sobe; b.cot.rotation.x += intens * (-1.15 * sobe - 0.3 * bat);
    b.pulso.rotation.z += b.s * intens * (0.6 * sobe); b.pulso.rotation.x += intens * 0.3 * bat; b.dedos.forEach((d) => (d.rotation.x *= 0.4)); }); }
// abraço entre a e b (k 0..1) e aperto de mão (com o balanço)
export function abracar(a, b, k = 1) { if (k <= 0) return; [[a, b], [b, a]].forEach(([x, y]) => { y.root.updateMatrixWorld(true);
  x.bracos.forEach((br, i) => alcancar(x, i, y.tronco.localToWorld(new THREE.Vector3(br.s * 0.12 * -1, 1.28, -0.16)), k, { polo: new THREE.Vector3(br.s, 0, 0.3) })); olharPara(x, y.cab.getWorldPosition(new THREE.Vector3()), 0.3 * k); }); }
export function apertoMao(a, b, t, k = 1) { if (k <= 0) return; a.root.updateMatrixWorld(true); b.root.updateMatrixWorld(true);
  const pa = a.bracos[0].om.getWorldPosition(new THREE.Vector3()), pb = b.bracos[0].om.getWorldPosition(new THREE.Vector3()), m = pa.clone().add(pb).multiplyScalar(0.5); m.y -= 0.3; m.y += 0.025 * Math.sin(t * 2 * Math.PI * 2.2);
  alcancar(a, 0, m, k, { maoGira: 1.4 }); alcancar(b, 0, m, k, { maoGira: 1.4 }); punho(a, 0.5 * k, 0); punho(b, 0.5 * k, 0); }

// olho R11 avulso (bichos do cinema.js)
export const olhoDe = (r, iris, pele) => olhoR11(r, iris, pele);

// ator: tudo de um personagem num quadro, na ordem certa (reset → pose/andar → olharPara → emoção → fala → vida). Menos código por cena.
// ator(p, t, { seed, pose: "sentado"|[["susto",k],["maoRosto",k2]], andar: {vel}, correr: {vel}, emocao: "medo"|["calmo","alegre",k], olhar: [x,y],
//   olharPara: vec3, fala: [palavras, t0] | true, gestos: true, tremer: 0.5 }) -> distância andada (para mover o root)
export function ator(p, t, o = {}) {
  const seed = o.seed ?? 1; let dist = 0;
  p.reset();
  if (o.pose) (typeof o.pose === "string" ? [[o.pose, 1]] : o.pose).forEach(([n, k, op]) => pose(p, n, k, op));
  if (o.andar) dist = andar(p, t, o.andar === true ? {} : o.andar);
  if (o.correr) dist = correr(p, t, o.correr === true ? {} : o.correr);
  if (o.gestos) gesticular(p, t, { seed, ...(o.gestos === true ? {} : o.gestos) });
  if (o.tremer) tremer(p, t, o.tremer);
  if (o.olharPara) olharPara(p, o.olharPara, o.olharK ?? 1);
  if (Array.isArray(o.emocao)) p.emocaoMix(o.emocao[0], o.emocao[1], o.emocao[2], o.olhar); else p.emocao(o.emocao || "calmo", o.olhar);
  if (o.fala === true) falar(p, t, { seed }); else if (o.fala) falarPalavras(p, t, o.fala[0], o.fala[1] || 0);
  vida(p, t, { seed, ...(o.vida || {}) });
  return dist;
}
