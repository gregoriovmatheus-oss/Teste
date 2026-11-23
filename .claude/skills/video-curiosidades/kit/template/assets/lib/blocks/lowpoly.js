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
function pintado(m, k = 0.16) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vObj;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvObj = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        { vec3 fn = normalize(cross(dFdx(vObj), dFdy(vObj))); fn *= sign(fn.y + fn.x * 0.37 + fn.z * 0.11 + 1e-4);
          float hz = fract(sin(dot(floor(fn * 9.0 + 0.5), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          diffuseColor.rgb *= 1.0 + (hz - 0.5) * ${k.toFixed(3)}; }`);
  };
  m.customProgramCacheKey = () => "pintado" + k;
  return m;
}
export const mat = (c, rough = 0.78, extra = {}) => pintado(new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, flatShading: true, ...extra }));
const matContorno = new THREE.MeshBasicMaterial({ color: COR.contorno, side: THREE.BackSide });

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

// ===== cabeça R11 (unidades da cabeça: raio ~1, rosto para +z) =====
function geoCranio(seed) {
  return facetado(2, (v) => {
    const { x, y, z } = v;
    v.x *= 0.83; v.y *= 1.16; v.z *= 0.98;
    if (y < -0.1) { const k = Math.min(1, (-y - 0.1) / 0.9); v.x *= 1 - 0.42 * k ** 1.1; if (z < 0.2) v.z *= 1 - 0.45 * k; }
    if (z > 0.55) v.z = 0.55 + (v.z - 0.55) * 0.6;                                           // rosto mais plano
    if (z > 0) {
      v.x += 0.07 * Math.sign(x) * gauss((Math.abs(x) - 0.62) ** 2 * 9 + (y + 0.12) ** 2 * 8, 0.6);   // maçãs
      v.z -= 0.08 * gauss((Math.abs(x) - 0.33) ** 2 * 18 + (y - 0.1) ** 2 * 22, 0.6);                   // órbitas
      v.z += 0.06 * gauss(x * x * 2 + (y - 0.33) ** 2 * 30, 0.6);                                       // testa/sobrancelha
      if (y < -0.75) v.y -= 0.06 * z;                                                                   // queixo
    }
  }, seed, 0.035);
}
function recorte(geo, teste, escala = 1) {
  const p = geo.attributes.position, out = [];
  for (let i = 0; i < p.count; i += 3) {
    const t = [0, 1, 2].map((k) => [p.getX(i + k), p.getY(i + k), p.getZ(i + k)]);
    if (t.every((q) => teste(...q))) for (const q of t) out.push(q[0] * escala, q[1] * escala, q[2] * escala);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3)); g.computeVertexNormals(); return g;
}
function olhoR11(r, cIris = COR.iris, cPele = COR.pele) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), mat(COR.esclera, 0.3)));
  const globo = new THREE.Group(); g.add(globo);
  const iris = new THREE.Mesh(new THREE.CircleGeometry(r * 0.6, 12), mat(cIris, 0.35, { side: THREE.DoubleSide })); iris.position.z = r * 0.97; globo.add(iris);
  const anel = new THREE.Mesh(new THREE.RingGeometry(r * 0.56, r * 0.62, 12), new THREE.MeshBasicMaterial({ color: 0x1a0e06 })); anel.position.z = r * 0.975; globo.add(anel);
  const pup = new THREE.Mesh(new THREE.CircleGeometry(r * 0.28, 12), new THREE.MeshBasicMaterial({ color: COR.pupila })); pup.position.z = r * 0.985; globo.add(pup);
  const bri = new THREE.Mesh(new THREE.CircleGeometry(r * 0.12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); bri.position.set(r * 0.22, r * 0.24, r * 0.995); globo.add(bri);
  // pálpebra de cima: casca de pele + risco escuro dos cílios na borda
  const sup = new THREE.Group(); g.add(sup);
  sup.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(cPele)));
  const cil = new THREE.Mesh(new THREE.TorusGeometry(r * 1.07, r * 0.09, 3, 14, Math.PI), new THREE.MeshBasicMaterial({ color: 0x140a06 }));
  cil.rotation.x = Math.PI / 2; sup.add(cil);
  const inf = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 12, 4, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), mat(cPele)); g.add(inf);
  return { g, globo, sup, olhar(ax, ay) { globo.rotation.set(-ay, ax, 0); }, abrir(k) { sup.rotation.x = k > 0.3 ? -0.25 - 1.15 * k : 0.4 + (-0.595 - 0.4) * (k / 0.3); globo.visible = k > 0.1; } };   // fechado: esconde a íris (o disco sairia pela pálpebra)
}
function cabecaR11({ seed, pele, cabelo, barba, iris = COR.iris }) {
  const H = new THREE.Group(), pm = mat(pele, 0.72);
  const cr = new THREE.Mesh(geoCranio(seed), pm); contorno(cr, 0.012); H.add(cr);
  // nariz: pirâmide com aresta para frente + asas
  const nz = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.6, 4, 1), pm); nz.rotation.set(-0.3, Math.PI / 4, 0); nz.scale.set(0.85, 1, 1.4); nz.position.set(0, -0.1, 0.7); H.add(nz);
  for (const s of [1, -1]) { const a = new THREE.Mesh(facetado(1, () => {}, seed + s, 0.1), pm); a.scale.set(0.09, 0.07, 0.08); a.position.set(s * 0.11, -0.32, 0.74); H.add(a); }
  const narina = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.06), new THREE.MeshBasicMaterial({ color: 0x3a1a10 })); narina.position.set(0, -0.37, 0.76); H.add(narina);
  // orelhas
  for (const s of [1, -1]) { const o = new THREE.Mesh(facetado(1, (v) => { v.x *= 0.35; v.y *= 1.35; v.z *= 0.9; }, seed + 9 + s), pm); contorno(o, 0.04); o.scale.setScalar(0.24); o.position.set(s * 0.83, 0.0, -0.08); o.rotation.y = s * 0.25; H.add(o); }
  // olhos
  const olhos = [1, -1].map((s) => { const o = olhoR11(0.15, iris, pele); o.g.position.set(s * 0.32, 0.1, 0.62); o.g.rotation.y = s * 0.16; H.add(o.g); return o; });
  // sobrancelhas grossas (2 prismas cada)
  const bm = mat(cabelo, 0.95), somb = [1, -1].map((s) => {
    const g = new THREE.Group(); g.position.set(s * 0.33, 0.36, 0.74); H.add(g);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.24, 3), bm); a.rotation.z = Math.PI / 2; a.position.x = -s * 0.07; g.add(a);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.03, 0.22, 3), bm); b.rotation.z = Math.PI / 2 + s * 0.25; b.position.set(s * 0.12, -0.02, -0.02); g.add(b);
    g.children.forEach((m) => contorno(m, 0.06)); return g;
  });
  // boca: lábios em metades (giram para sorrir/franzir), abertura que desce com o maxilar, dentes de cima e de baixo, língua
  const boca = new THREE.Group(); boca.position.set(0, -0.53, 0.72); H.add(boca);
  const lm = mat(0xb8705e, 0.5), labS = [], labI = [];
  for (const s of [1, -1]) {
    const ps = new THREE.Group(); boca.add(ps); const a = new THREE.Mesh(facetado(1, (v) => { v.x = (v.x + 1) * 0.5 * s; }, seed + 3 + s, 0.1), lm); a.scale.set(0.2, 0.042, 0.06); ps.add(a); labS.push(ps);
    const pi = new THREE.Group(); boca.add(pi); const b = new THREE.Mesh(facetado(1, (v) => { v.x = (v.x + 1) * 0.5 * s; }, seed + 6 + s, 0.1), lm); b.scale.set(0.17, 0.05, 0.06); pi.add(b); labI.push(pi);
  }
  const abre = new THREE.Mesh(new THREE.CircleGeometry(1, 10), new THREE.MeshBasicMaterial({ color: 0x1e0806 })); abre.position.z = 0.062; boca.add(abre);
  const lingua = new THREE.Mesh(new THREE.CircleGeometry(1, 8), new THREE.MeshBasicMaterial({ color: 0x7a2c2a })); lingua.position.z = 0.064; boca.add(lingua);
  const dentes = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.02), mat(0xeee6d8, 0.4)); dentes.position.set(0, 0.0, 0.066); boca.add(dentes);
  const dentesI = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.02), mat(0xe2d8c8, 0.4)); dentesI.position.set(0, 0, 0.065); boca.add(dentesI);
  // barba por fazer + bigode
  if (barba) {
    const bc = barba === true ? COR.barba : barba;
    const st = new THREE.Mesh(recorte(geoCranio(seed), (x, y, z) => z > -0.15 && y < -0.28 - 0.25 * Math.max(0, z - 0.3) + 0.0 && !(Math.abs(x) < 0.2 && y > -0.5 && y < -0.38), 1.012), mat(bc, 0.95, { transparent: true, opacity: 0.72 })); H.add(st);
    const big = new THREE.Mesh(facetado(1, (v) => { v.y *= 0.25; }, seed + 5, 0.2), mat(bc, 0.95, { transparent: true, opacity: 0.85 })); big.scale.set(0.24, 0.1, 0.06); big.position.set(0, -0.42, 0.75); H.add(big);
  }
  // cabelo: casca acima da linha do cabelo + mechas facetadas
  const cm = mat(cabelo, 0.85);
  const cap = new THREE.Mesh(recorte(geoCranio(seed), (x, y, z) => y > 0.36 + 0.24 * z - 0.12 * Math.abs(x) || (z < -0.3 && y > -0.45), 1.07), cm); contorno(cap, 0.015); H.add(cap);
  const rr = mulberry32(seed * 7 + 3);
  const claro = new THREE.Color(cabelo).getHSL({}).l > 0.5;
  for (let i = 0; i < (claro ? 12 : 34); i++) {
    const a = rr() * Math.PI * 2, rad = claro ? 0.45 + rr() * 0.35 : 0.12 + rr() * 0.68;
    const m = new THREE.Mesh(facetado(1, (v) => { v.y *= 1.7; v.z *= 0.55; if (v.y > 0) { v.x *= 1 - v.y * 0.35; v.z *= 1 - v.y * 0.35; } }, seed + 60 + i, 0.25), cm); contorno(m, 0.04);
    const px = Math.cos(a) * rad * 0.85, pz = Math.sin(a) * rad * 0.85;
    m.position.set(px, 1.08 - rad * 0.3, pz); m.scale.setScalar(0.23 + rr() * 0.07);
    m.rotation.set(1.25 + pz * 0.25 + rr() * 0.25, Math.atan2(px, pz) * 0.2 + (rr() - 0.5) * 0.5, -px * 0.7 + (rr() - 0.5) * 0.4); H.add(m);
  }
  function rosto(e, olhar) {
    somb.forEach((g, i) => { const s = i ? -1 : 1; g.rotation.z = s * e.br; g.position.y = e.by; });
    // bo = [largura, abertura 0.3 (fechada) .. 5 (grito)], so = sorriso -1..1
    const w = e.bo[0], ab = Math.max(0, e.bo[1] - 0.6), so = e.so || 0, h = 0.036 * ab;
    labS.forEach((p, i) => { const s = i ? -1 : 1; p.scale.x = w; p.rotation.z = s * so * 0.28; p.position.y = h * 0.25 + 0.012; });
    labI.forEach((p, i) => { const s = i ? -1 : 1; p.scale.x = w * (1 + 0.1 * ab); p.rotation.z = s * so * 0.32; p.position.y = -h * 1.38 - 0.02; });
    abre.visible = ab > 0.05; abre.scale.set(0.15 * w * (1 + 0.06 * ab), h * 0.68 + 0.004, 1); abre.position.y = -h * 0.66 + 0.01 * so;
    lingua.visible = ab > 1.2; lingua.scale.set(0.085 * w, h * 0.26, 1); lingua.position.y = -h * 1.02;
    dentes.visible = ab > 0.5 || so > 0.5; dentes.position.y = -0.004; dentes.scale.x = w;
    dentesI.visible = ab > 2.2; dentesI.position.y = -h * 1.18; dentesI.scale.x = w;
    olhos.forEach((o) => { o.abrir(e.ab * (1 - (e._pisc || 0))); o.olhar(...(olhar || e.ol)); });
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
};
export const EXPRESSOES = Object.keys(EM);
function esqueleto(R, { pele, jaqueta, calca, tenis = COR.tenis, seed, simples }) {
  const quadril = new THREE.Group(); quadril.position.y = 0.92; R.add(quadril);
  const coluna = new THREE.Group(); quadril.add(coluna);
  const tronco = new THREE.Group(); tronco.position.y = -0.92; coluna.add(tronco);
  const pescoco = new THREE.Group(); pescoco.position.set(0, 1.47, 0); tronco.add(pescoco);
  const cab = new THREE.Group(); cab.position.y = 0.18; pescoco.add(cab);
  const seg = simples ? 5 : 6, jm = mat(jaqueta, 0.7), pm = mat(pele), ct = (m, k) => (simples ? m : contorno(m, k));
  const bracos = [1, -1].map((s) => {
    const om = new THREE.Group(); om.position.set(s * 0.235, 1.36, 0); tronco.add(om);
    const sup = ct(new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.32, seg), jm), 0.04); sup.position.y = -0.16; om.add(sup);
    const omb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.068, 0), jm); om.add(omb);
    const cot = new THREE.Group(); cot.position.y = -0.32; om.add(cot);
    const inf = ct(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.3, seg), jm), 0.04); inf.position.y = -0.15; cot.add(inf);
    const pulso = new THREE.Group(); pulso.position.y = -0.3; cot.add(pulso);
    const mao = ct(new THREE.Mesh(facetado(1, (v) => { v.y *= 1.3; v.z *= 0.6; }, seed + 50 + s, 0.15), pm), 0.05); mao.scale.set(0.05, 0.05, 0.045); mao.position.y = -0.04; pulso.add(mao);
    const dedos = [];
    if (!simples) {
      for (let f = 0; f < 4; f++) { const g = new THREE.Group(); g.position.set((f - 1.5) * 0.02, -0.075, 0.01); pulso.add(g);
        const d = contorno(new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.07, 0.02), pm), 0.12); d.position.y = -0.03; g.add(d); g.rotation.x = 0.25; dedos.push(g); }
      const pol = contorno(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.055, 0.02), pm), 0.12); pol.position.set(-s * 0.035, -0.04, 0.025); pol.rotation.z = s * 0.6; pulso.add(pol);
    }
    return { om, cot, pulso, mao, dedos, s };
  });
  const pernas = [1, -1].map((s) => {
    const q = new THREE.Group(); q.position.set(s * 0.1, -0.02, 0); quadril.add(q);
    const c = ct(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.46, seg), mat(calca)), 0.03); c.position.y = -0.23; q.add(c);
    const j = new THREE.Group(); j.position.y = -0.46; q.add(j);
    const c2 = ct(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.42, seg), mat(calca)), 0.03); c2.position.y = -0.21; j.add(c2);
    const pe = new THREE.Group(); pe.position.y = -0.42; j.add(pe);
    const sap = ct(new THREE.Mesh(T_box(0.11, 0.08, 0.22), mat(tenis)), 0.04); sap.position.set(0, -0.02, 0.045); pe.add(sap);
    return { q, j, pe, s };
  });
  return { quadril, coluna, tronco, pescoco, cab, bracos, pernas };
}
// pose de descanso de cada osso (reset() volta para ela)
function guardaDescanso(p) {
  const ossos = [p.root, p.quadril, p.coluna, p.pescoco, p.cab, ...p.bracos.flatMap((b) => [b.om, b.cot, b.pulso, ...b.dedos]), ...p.pernas.flatMap((l) => [l.q, l.j, l.pe])];
  const base = ossos.map((o) => [o.position.clone(), o.rotation.clone()]);
  p.reset = () => { ossos.forEach((o, i) => { if (o === p.root) return; o.position.copy(base[i][0]); o.rotation.copy(base[i][1]); }); p.respira(0); p.piscar(0); };
}
export function pessoa({ longo = false, seed = 1, pele = COR.pele, cabelo = COR.cabelo, jaqueta = COR.jaqueta, camisa = COR.camisa, calca = COR.jeans, barba = true, corpo = true, iris } = {}) {
  const R = new THREE.Group();
  const E = esqueleto(R, { pele, jaqueta, calca, seed, simples: false });
  const { cab, tronco } = E;
  const C = cabecaR11({ seed, pele, cabelo, barba, iris }); C.H.scale.setScalar(0.14); cab.add(C.H);
  let mechas = null;
  if (longo) { const lm = mat(cabelo, 0.8); mechas = new THREE.Group(); cab.add(mechas);
    const tras = contorno(new THREE.Mesh(facetado(2, (v) => { v.y *= 1.6; v.x *= 1.05; if (v.z > 0.3) v.z = 0.3; }, seed + 80, 0.12), lm), 0.02); tras.scale.set(0.15, 0.17, 0.13); tras.position.set(0, -0.06, -0.04); mechas.add(tras);
    for (const s of [1, -1]) { const m = contorno(new THREE.Mesh(facetado(1, (v) => { v.y *= 2.6; v.x *= 0.6; }, seed + 85 + s, 0.2), lm), 0.03); m.scale.setScalar(0.06); m.position.set(s * 0.118, -0.03, 0.03); m.rotation.z = s * 0.08; mechas.add(m); } }
  // tronco: camisa + jaqueta aberta com gola (as abas da jaqueta balançam no andar)
  const pesc = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.16, 7), mat(pele)); pesc.position.y = 1.47; tronco.add(pesc);
  const tor = contorno(new THREE.Mesh(facetado(2, (v) => { v.y *= 1.5; v.x *= 1.05; v.z *= 0.62; if (v.y > 0.6) { v.x *= 1 - (v.y - 0.6) * 0.5; } }, seed + 20, 0.08), mat(camisa)), 0.02);
  tor.scale.set(0.2, 0.235, 0.196); tor.position.set(0, 1.15, -0.004); tronco.add(tor);
  const jm = mat(jaqueta, 0.7), abas = [];
  for (const s of [1, -1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.035, 1.38, -0.005); tronco.add(piv);
    const lado = contorno(new THREE.Mesh(facetado(2, (v) => { v.y *= 1.5; v.z *= 0.62; if (v.x * s < -0.25) v.x = -0.25 * s; if (v.y > 0.8) v.y = 0.8 + (v.y - 0.8) * 0.5 - 0.12 * Math.abs(v.x); }, seed + 30 + s, 0.09), jm), 0.02);
    lado.scale.set(0.215, 0.255, 0.2); lado.position.y = -0.24; piv.add(lado); abas.push(piv);
    const gola = contorno(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.17, 4), jm), 0.04);
    gola.position.set(s * 0.085, 1.42, 0.08); gola.rotation.set(0.5, 0, s * 0.45); tronco.add(gola);
  }
  const capuz = contorno(new THREE.Mesh(facetado(2, (v) => { v.z *= 0.75; v.y *= 0.55; if (v.z > 0.2) v.z = 0.2 + (v.z - 0.2) * 0.2; }, seed + 70, 0.12), jm), 0.025);
  capuz.scale.set(0.2, 0.16, 0.16); capuz.position.set(0, 1.45, -0.1); capuz.rotation.x = -0.35; tronco.add(capuz);
  const zip = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.45, 0.006), mat(0x9a9aa0, 0.3, { metalness: 0.8 })); zip.position.set(0.0, 1.13, 0.148); zip.rotation.x = 0.05; tronco.add(zip);
  E.bracos.forEach((b) => { b.om.rotation.z = b.s * 0.08; b.cot.rotation.x = -0.18; });
  if (!corpo) E.pernas.forEach((l) => (l.q.visible = false));
  const p = { root: R, ...E, abas, mechas, peito: tor };
  let atual = EM.calmo, olharAtual = null;
  p.emocao = (nome, olhar = null) => { atual = typeof nome === "object" ? { ...EM.calmo, ...nome } : (EM[nome] || EM.calmo); olharAtual = olhar; C.rosto(atual, olhar); };
  // mistura duas expressões (k 0..1), para transições suaves
  p.emocaoMix = (a, b, k, olhar = null) => { const A = typeof a === "object" ? { ...EM.calmo, ...a } : EM[a], B = typeof b === "object" ? { ...EM.calmo, ...b } : EM[b], L = (x, y) => x + (y - x) * k;
    p.emocao({ br: L(A.br, B.br), by: L(A.by, B.by), bo: [L(A.bo[0], B.bo[0]), L(A.bo[1], B.bo[1])], ab: L(A.ab, B.ab), ol: [L(A.ol[0], B.ol[0]), L(A.ol[1], B.ol[1])], so: L(A.so || 0, B.so || 0) }, olhar); };
  p.piscar = (b) => { C.rosto({ ...atual, _pisc: b }, olharAtual); };
  p.respira = (k) => { tor.scale.z = 0.196 * (1 + 0.05 * k); tor.scale.x = 0.2 * (1 + 0.015 * k); abas.forEach((a, i) => (a.rotation.z = (i ? 1 : -1) * 0.02 * k)); };
  guardaDescanso(p); p.emocao("calmo");
  return p;
}
// figurante: mesmo esqueleto e mesmas animações, ~10x menos triângulos (multidões, planos abertos)
export function figurante({ seed = 1, pele = COR.pele, cabelo = COR.cabelo, roupa = 0x3d5a80, calca = COR.jeans, longo = false } = {}) {
  const R = new THREE.Group();
  const E = esqueleto(R, { pele, jaqueta: roupa, calca, seed, simples: true });
  const { cab, tronco } = E, rr = mulberry32(seed * 31 + 7);
  const cm = mat(pele, 0.72);
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
  p.emocaoMix = (a, b, k) => p.emocao(k < 0.5 ? a : b);
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
  if (p.mechas) p.mechas.rotation.x = 0.03 * Math.sin(t * 1.1 + ph);
  let b = 0;
  if (piscar) { // piscadas a cada 2–4,5 s (às vezes dupla), 0,16 s cada
    let tt = 0.4 + r() * 1.5; const rr = mulberry32(seed * 131 + 9);
    while (tt < t + 0.2) { const d = t - tt; if (d > -0.01 && d < 0.16) b = Math.max(b, Math.sin((d / 0.16) * Math.PI)); if (rr() < 0.18) { const d2 = d - 0.24; if (d2 > 0 && d2 < 0.16) b = Math.max(b, Math.sin((d2 / 0.16) * Math.PI)); } tt += 2 + rr() * 2.5; }
  }
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
    b.om.rotation.x += -0.38 * amp * fw; b.cot.rotation.x += -0.22 * amp * Math.max(0, fw) - 0.08 * amp; });
  p.quadril.position.y += amp * (0.028 * Math.abs(Math.cos(ph)) - 0.022);
  p.quadril.rotation.y += 0.07 * amp * Math.sin(ph); p.coluna.rotation.y -= 0.12 * amp * Math.sin(ph);
  p.quadril.rotation.z += 0.035 * amp * Math.sin(ph); p.coluna.rotation.x += 0.05 * amp;
  p.cab.rotation.y += 0.05 * amp * Math.sin(ph); p.cab.rotation.x += 0.015 * Math.sin(ph * 2);
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
export function pose(p, nome, k = 1, { lado } = {}) {
  const P = POSES[nome]; if (!P || k <= 0) return; k = sm(Math.min(1, k));
  if (P.root) { _mix(p.root, P.root, k); p.quadril.position.y = L_(p.quadril.position.y, 0.92 + (P.rootY || 0), k); }
  if (P.quadril) p.quadril.position.y = L_(p.quadril.position.y, 0.92 + P.quadril.y, k);
  if (P.coluna) _mix(p.coluna, P.coluna, k);
  if (P.cab) _mix(p.cab, P.cab, k);
  if (P.bracos) { const B = P.bracos, ld = lado ?? B.lado; p.bracos.forEach((b, i) => { if (ld !== undefined && ld !== "ambos" && ld !== i) return; const s = b.s;
    for (const n of ["om", "cot", "pulso"]) if (B[n]) _mix(b[n], [B[n][0], B[n][1] * s, B[n][2] * s], k);
    if (B.dedos) b.dedos.forEach((d) => _mix(d, B.dedos, k)); }); }
  if (P.pernas) p.pernas.forEach((l) => { for (const n of ["q", "j", "pe"]) if (P.pernas[n]) _mix(l[n], P.pernas[n], k); });
}
// mão fechada (k=1) ou aberta (0)
export function punho(p, k = 1, lado = "ambos") { p.bracos.forEach((b, i) => { if (lado !== "ambos" && lado !== i) return; b.dedos.forEach((d) => (d.rotation.x = L_(d.rotation.x, 1.9, k))); }); }
// virar cabeça (e um pouco o tronco) para um ponto do mundo
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion();
export function olharPara(p, alvo, k = 1) {
  p.root.updateMatrixWorld(true); p.cab.getWorldPosition(_a); _b.copy(alvo).sub(_a);
  p.root.getWorldQuaternion(_q); _b.applyQuaternion(_q.invert());
  const yaw = Math.max(-1.2, Math.min(1.2, Math.atan2(_b.x, _b.z))), pit = Math.max(-0.6, Math.min(0.6, -Math.atan2(_b.y, Math.hypot(_b.x, _b.z))));
  p.cab.rotation.y += yaw * 0.65 * k; p.coluna.rotation.y += yaw * 0.25 * k; p.cab.rotation.x += pit * 0.8 * k;
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
// Pós: profundidade de campo pela profundidade, bloom leve, grade fria/quente, vinheta, grão por quadro; corte com dip de 5 quadros.
// st.draw() usa st.T / st.D (o bindSeek do monta-cenas preenche). Para prévia fora do vídeo, passe { webgl: canvasWebGL }.
export function palco(canvas, { fov = 32, fundo = 0x14100c, foco = 1.5, faixa = 1.2, desfoque = 14, grao = 0.05, sat = 0.9, webgl = null } = {}) {
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
  const U = { tC: { value: rt.texture }, tD: { value: dt }, near: { value: 0.01 }, far: { value: 400 }, foco: { value: foco }, faixa: { value: faixa },
    desf: { value: desfoque }, res: { value: new THREE.Vector2(W, Hh) }, grao: { value: grao }, sat: { value: sat }, quadro: { value: 0 }, dip: { value: 0 } };
  const pos = new THREE.ShaderMaterial({ uniforms: U, depthTest: false, depthWrite: false,
    vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `uniform sampler2D tC, tD; uniform float near, far, foco, faixa, desf, grao, sat, quadro, dip; uniform vec2 res; varying vec2 vU;
      float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
      float coc(vec2 u){ return clamp(abs(lin(texture2D(tD, u).r) - foco) / faixa, 0.0, 1.0); }
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        float c0 = coc(vU); vec3 acc = texture2D(tC, vU).rgb; float w = 1.0; vec3 blo = vec3(0.0);
        float rot = h(vU * res) * 6.2831;
        for (int i = 0; i < 48; i++) { float fi = float(i); float rr = sqrt((fi + 0.5) / 48.0); float an = fi * 2.39996 + rot;
          vec2 o = vec2(cos(an), sin(an)) * rr * desf / res;
          vec2 u2 = vU + o * c0; float ci = coc(u2);
          vec3 s = texture2D(tC, u2).rgb; float wi = mix(0.2, 1.0, ci); acc += s * wi; w += wi;
          if (i < 16) { vec3 sb = texture2D(tC, vU + o * 2.5).rgb; blo += max(sb - vec3(0.9), 0.0); } }
        vec3 col = acc / w + blo * 0.05;
        float l = dot(col, vec3(0.299, 0.587, 0.114)); col = mix(vec3(l), col, sat);
        col = mix(col * vec3(0.92, 0.98, 1.08), col * vec3(1.06, 1.0, 0.92), smoothstep(0.05, 0.6, l));
        vec2 q = vU - 0.5; col *= 1.0 - smoothstep(0.35, 0.95, length(q * vec2(1.0, 0.75))) * 0.6;
        col += (h(vU * res + quadro * 17.31) - 0.5) * grao;
        col *= 1.0 - dip;
        gl_FragColor = vec4(max(col, 0.0), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  pos.toneMapped = true;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pos); quad.frustumCulled = false;
  const S2 = new THREE.Scene(); S2.add(quad); const cam2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const st = { r, renderer: r, S, scene: S, cam, ctx, hemi, fria, key: fria, quente, rim, rim2, U, T: 0, D: 0, exposicao: 1.1,
    warm: { renderer: r, scene: S, camera: cam },
    draw() {
      if (!st._s) { st._s = 1; S.traverse((o) => { if (o.isMesh && o.material && o.material.type !== "MeshBasicMaterial") { o.castShadow = o.material.side !== THREE.BackSide; o.receiveShadow = true; } }); }
      const T = st.T || 0, D = st.D || 1e9;
      U.near.value = cam.near; U.far.value = cam.far; U.quadro.value = Math.floor(T * 30);
      U.dip.value = Math.min(1, Math.max(1 - T / 0.17, 1 - (D - T) / 0.12, 0)) * 0.85;
      const tm = r.toneMapping, te = r.toneMappingExposure;
      r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = st.exposicao;
      r.setRenderTarget(rt); r.render(S, cam); r.setRenderTarget(null); r.render(S2, cam2);
      r.toneMapping = tm; r.toneMappingExposure = te;
      if (ctx) { ctx.globalCompositeOperation = "copy"; ctx.drawImage(r.domElement, 0, 0); ctx.globalCompositeOperation = "source-over"; }
    } };
  return st;
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
