// lowpoly.js: estilo R11. Personagens e objetos 3D low-poly facetados (flatShading),
// contorno fino por casco invertido, olhos grandes expressivos. Determinístico (sem Math.random).
import * as THREE from "./three.module.js";

export const COR = {
  pele: 0xb0785a, peleSombra: 0x8a5a42, cabelo: 0x3a2618, barba: 0x4a3020,
  jaqueta: 0xd9a21e, camisa: 0x2c3442, jeans: 0x23324f, tenis: 0x1c1c22,
  esclera: 0xf2ede4, iris: 0x6b4423, pupila: 0x0d0805, contorno: 0x120c08,
};

export function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export const mat = (c, rough = 0.78, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0, flatShading: true, ...extra });
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

// cabeça humana estilizada: crânio alongado, queixo, nariz, maçãs, arco da sobrancelha
function geoCabeca(seed) {
  return facetado(3, (v) => {
    const { x, y, z } = v;
    v.y *= 1.22; v.x *= 0.86;
    if (y < 0) { const k = 1 - 0.32 * Math.min(1, -y * 1.2); v.x *= k; v.z *= 1 - 0.12 * Math.min(1, -y); }      // mandíbula afina
    if (z < -0.2) v.z *= 1.06;                                                                                  // nuca
    if (z > 0) {
      v.z += 0.36 * gauss(x * x * 7 + (y + 0.12) * (y + 0.12) * 1.6, 0.5) * z;                                  // nariz
      v.z += 0.10 * gauss(x * x * 1.5 + (y - 0.32) * (y - 0.32) * 20, 0.6) * z;                                  // arco da sobrancelha
      v.z -= 0.14 * gauss((Math.abs(x) - 0.36) ** 2 * 14 + (y - 0.15) ** 2 * 16, 0.6) * z;                       // órbitas
      v.x += 0.06 * Math.sign(x) * gauss((Math.abs(x) - 0.6) ** 2 * 8 + (y + 0.05) ** 2 * 10, 0.6);              // maçãs
      v.z += 0.08 * gauss(x * x * 4 + (y + 0.95) ** 2 * 6, 0.6) * z;                                             // queixo
    }
  }, seed, 0.05);
}

// olho grande: esclera + íris + pupila + brilho; olhar(x,y) gira o globo
function olho(r) {
  const g = new THREE.Group();
  const escl = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), mat(COR.esclera, 0.35));
  g.add(escl);
  const globo = new THREE.Group(); g.add(globo);
  const iris = new THREE.Mesh(new THREE.CircleGeometry(r * 0.56, 10), mat(COR.iris, 0.4, { side: THREE.DoubleSide }));
  iris.position.z = r * 0.985; globo.add(iris);
  const pup = new THREE.Mesh(new THREE.CircleGeometry(r * 0.27, 10), new THREE.MeshBasicMaterial({ color: COR.pupila }));
  pup.position.z = r * 0.995; globo.add(pup);
  const bri = new THREE.Mesh(new THREE.CircleGeometry(r * 0.11, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  bri.position.set(r * 0.2, r * 0.22, r * 1.0); globo.add(bri);
  // pálpebra de cima (meia casca de pele) para dar expressão
  const palp = new THREE.Mesh(new THREE.SphereGeometry(r * 1.06, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(COR.pele));
  g.add(palp);
  return { g, globo, palp, olhar(ax, ay) { globo.rotation.set(-ay, ax, 0); }, abrir(k) { palp.rotation.x = -0.35 - 1.1 * k; } };
}

// Pessoa low-poly. emocao(e): "calmo" | "medo" | "panico" | "triste" | "foco"
export function pessoa({ seed = 1, pele = COR.pele, cabelo = COR.cabelo, jaqueta = COR.jaqueta, camisa = COR.camisa, calca = COR.jeans, barba = true, corpo = true } = {}) {
  const R = new THREE.Group();
  const cab = new THREE.Group(); cab.position.y = 1.62; R.add(cab);
  const cabeca = contorno(new THREE.Mesh(geoCabeca(seed), mat(pele)), 0.018); cabeca.scale.setScalar(0.13); cab.add(cabeca);
  // cabelo: tufos facetados no alto e atrás
  const rr = mulberry32(seed * 7 + 3), cm = mat(cabelo, 0.9);
  for (let i = 0; i < 11; i++) {
    const a = -1.2 + (i / 10) * 2.4, tufo = contorno(new THREE.Mesh(facetado(1, (v) => { v.y *= 0.55; v.z *= 1.3; }, seed + i, 0.2), cm), 0.03);
    tufo.scale.setScalar(0.06 + rr() * 0.02);
    tufo.position.set(Math.sin(a) * 0.09, 0.115 + Math.cos(a) * 0.035 + rr() * 0.01, -0.02 + Math.cos(a) * 0.03 - 0.02);
    tufo.rotation.set(-0.5 + rr() * 0.3, a * 0.4, (rr() - 0.5) * 0.6); cab.add(tufo);
  }
  const nuca = new THREE.Mesh(facetado(2, (v) => { v.y *= 1.1; }, seed + 40, 0.1), cm); nuca.scale.set(0.118, 0.13, 0.11); nuca.position.set(0, 0.04, -0.035); cab.add(nuca);
  // orelhas
  for (const s of [1, -1]) { const o = contorno(new THREE.Mesh(facetado(1, (v) => { v.x *= 0.35; v.y *= 1.3; }, seed + 9), mat(pele)), 0.05); o.scale.setScalar(0.035); o.position.set(s * 0.112, 0.0, -0.01); cab.add(o); }
  // barba por fazer: casca escura só na parte de baixo da frente
  if (barba) {
    const bg = geoCabeca(seed).clone(), bp = bg.attributes.position;
    const keep = []; const ix = [];
    for (let i = 0; i < bp.count; i += 3) { let ok = true; for (let k = 0; k < 3; k++) { const y = bp.getY(i + k), z = bp.getZ(i + k); if (!(y < -0.38 * 1.22 && z > -0.1)) ok = false; } if (ok) for (let k = 0; k < 3; k++) keep.push(bp.getX(i + k), bp.getY(i + k), bp.getZ(i + k)); }
    const g2 = new THREE.BufferGeometry(); g2.setAttribute("position", new THREE.Float32BufferAttribute(keep, 3)); g2.computeVertexNormals();
    const b = new THREE.Mesh(g2, mat(barba === true ? COR.barba : barba, 0.95, { transparent: true, opacity: 0.8 })); b.scale.setScalar(0.1318); cab.add(b);
  }
  // olhos, sobrancelhas, boca
  const olhos = [1, -1].map((s) => { const o = olho(0.026); o.g.position.set(s * 0.045, 0.022, 0.098); o.g.rotation.y = s * 0.18; cab.add(o.g); return o; });
  const somb = [1, -1].map((s) => { const b = contorno(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.013, 0.02), mat(cabelo, 0.9)), 0.08); b.position.set(s * 0.047, 0.062, 0.112); cab.add(b); return b; });
  const boca = new THREE.Group(); boca.position.set(0, -0.068, 0.108); cab.add(boca);
  const lab = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x2a0f0a })); lab.scale.set(0.024, 0.006, 0.01); boca.add(lab);
  const dentes = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.006), mat(0xeee6d8, 0.4)); dentes.position.set(0, 0.004, 0.006); boca.add(dentes);
  // tronco: camisa + jaqueta aberta com gola
  const tronco = new THREE.Group(); R.add(tronco);
  const pesc = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.12, 7), mat(pele)); pesc.position.y = 1.48; tronco.add(pesc);
  const tor = contorno(new THREE.Mesh(facetado(2, (v) => { v.y *= 1.5; v.x *= 1.05; v.z *= 0.62; if (v.y > 0.6) { v.x *= 1 - (v.y - 0.6) * 0.5; } }, seed + 20, 0.08), mat(camisa)), 0.02);
  tor.scale.set(0.21, 0.24, 0.2); tor.position.y = 1.15; tronco.add(tor);
  const jm = mat(jaqueta, 0.7);
  for (const s of [1, -1]) {
    const lado = contorno(new THREE.Mesh(facetado(2, (v) => { v.y *= 1.5; v.z *= 0.68; if (v.x * s < -0.25) v.x = -0.25 * s; }, seed + 30 + s, 0.09), jm), 0.02);
    lado.scale.set(0.225, 0.25, 0.215); lado.position.set(s * 0.035, 1.14, -0.005); tronco.add(lado);
    const gola = contorno(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.17, 4), jm), 0.04);
    gola.position.set(s * 0.085, 1.42, 0.08); gola.rotation.set(0.5, 0, s * 0.45); tronco.add(gola);
  }
  // braços e mãos
  const bracos = [1, -1].map((s) => {
    const om = new THREE.Group(); om.position.set(s * 0.235, 1.36, 0); tronco.add(om);
    const sup = contorno(new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.32, 6), jm), 0.04); sup.position.y = -0.16; om.add(sup);
    const cot = new THREE.Group(); cot.position.y = -0.32; om.add(cot);
    const inf = contorno(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.3, 6), jm), 0.04); inf.position.y = -0.15; cot.add(inf);
    const mao = contorno(new THREE.Mesh(facetado(1, (v) => { v.y *= 1.3; v.z *= 0.6; }, seed + 50 + s, 0.15), mat(pele)), 0.05); mao.scale.setScalar(0.055); mao.position.y = -0.34; cot.add(mao);
    return { om, cot, mao };
  });
  // pernas
  const pernas = [1, -1].map((s) => {
    const q = new THREE.Group(); q.position.set(s * 0.1, 0.9, 0); R.add(q);
    const c = contorno(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.46, 6), mat(calca)), 0.03); c.position.y = -0.23; q.add(c);
    const j = new THREE.Group(); j.position.y = -0.46; q.add(j);
    const c2 = contorno(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.42, 6), mat(calca)), 0.03); c2.position.y = -0.21; j.add(c2);
    const pe = contorno(new THREE.Mesh(T_box(0.11, 0.08, 0.22), mat(COR.tenis)), 0.04); pe.position.set(0, -0.44, 0.045); j.add(pe);
    return { q, j };
  });
  if (!corpo) { pernas.forEach((p) => (p.q.visible = false)); }
  const EM = {
    calmo: { br: 0.0, by: 0.062, bo: [1, 0.25], ab: 0.75, ol: [0, 0.1] },
    medo: { br: -0.3, by: 0.07, bo: [0.9, 1.4], ab: 1.0, ol: [0.1, 0.05] },
    panico: { br: -0.45, by: 0.074, bo: [1.15, 2.6], ab: 1.15, ol: [0.35, 0.1] },
    triste: { br: -0.35, by: 0.064, bo: [0.8, 0.4], ab: 0.55, ol: [0, -0.25] },
    foco: { br: 0.25, by: 0.056, bo: [0.8, 0.2], ab: 0.6, ol: [0, 0] },
  };
  function emocao(nome, olhar = null) {
    const e = EM[nome] || EM.calmo;
    somb.forEach((b, i) => { const s = i ? -1 : 1; b.rotation.z = s * e.br; b.position.y = e.by; });
    lab.scale.set(0.024 * e.bo[0], 0.006 * e.bo[1], 0.01); dentes.visible = e.bo[1] > 1.2;
    olhos.forEach((o) => { o.abrir(e.ab); const [ax, ay] = olhar || e.ol; o.olhar(ax, ay); });
  }
  emocao("calmo");
  return { root: R, cab, olhos, bracos, pernas, tronco, emocao };
}
function T_box(w, h, d) { return new THREE.BoxGeometry(w, h, d, 1, 1, 1); }

// Corvo low-poly com olho brilhante
export function corvo(seed = 3) {
  const R = new THREE.Group(), pm = mat(0x1d2230, 0.6), pm2 = mat(0x2b3346, 0.55);
  const corpo = contorno(new THREE.Mesh(facetado(2, (v) => { v.z *= 1.7; v.y *= 0.95; if (v.z < 0) v.y *= 1 - 0.3 * -v.z; }, seed, 0.12), pm), 0.02); corpo.scale.setScalar(0.5); R.add(corpo);
  const cab = new THREE.Group(); cab.position.set(0, 0.42, 0.62); R.add(cab);
  const ca = contorno(new THREE.Mesh(facetado(2, (v) => { v.z *= 1.15; }, seed + 1, 0.12), pm2), 0.025); ca.scale.setScalar(0.3); cab.add(ca);
  const bico = contorno(new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.48, 5), mat(0x3a3f4a, 0.4)), 0.04); bico.rotation.x = Math.PI / 2; bico.position.set(0, -0.04, 0.48); cab.add(bico);
  const olhos = [1, -1].map((s) => { const o = olho(0.085); o.g.position.set(s * 0.19, 0.06, 0.15); o.g.rotation.y = s * 1.1; o.palp.material = mat(0x2b3346, 0.55); o.globo.children[0].material = mat(0x9a7a2a, 0.3, { side: THREE.DoubleSide }); cab.add(o.g); return o; });
  const asas = [1, -1].map((s) => { const a = contorno(new THREE.Mesh(facetado(1, (v) => { v.x *= 0.25; v.z *= 1.8; v.y *= 0.8; }, seed + 5 + s, 0.25), pm2), 0.03); a.scale.setScalar(0.42); a.position.set(s * 0.42, 0.08, -0.12); a.rotation.set(0.15, 0, s * -0.15); R.add(a); return a; });
  const cauda = contorno(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 4), pm), 0.04); cauda.rotation.x = -Math.PI / 2 + 0.35; cauda.position.set(0, -0.12, -0.95); R.add(cauda);
  for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 5), mat(0x2a2a2a)); p.position.set(s * 0.14, -0.62, 0.05); R.add(p); }
  return { root: R, cab, olhos, asas };
}

// molécula do ar: N2 (azul) ou O2 (vermelho), átomos facetados fundidos
export function molecula(tipo = "N2", seed = 1) {
  const g = new THREE.Group(), c = tipo === "N2" ? 0x5a8fd6 : 0xe0574a;
  const m = mat(c, 0.35, { emissive: c, emissiveIntensity: 0.12 });
  for (const s of [1, -1]) { const a = contorno(new THREE.Mesh(facetado(2, () => {}, seed + s, 0.06), m), 0.03); a.scale.setScalar(0.5); a.position.x = s * 0.33; g.add(a); }
  return g;
}

// palco R11: fundo escuro, luz fria de cima, quente na frente, recorte
export function palco(canvas, { fov = 32, fundo = 0x14100c, nevoa = null } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(1080, 1920, false); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace;
  const S = new THREE.Scene(); S.background = new THREE.Color(fundo); if (nevoa) S.fog = new THREE.Fog(fundo, nevoa[0], nevoa[1]);
  const cam = new THREE.PerspectiveCamera(fov, 1080 / 1920, 0.01, 400);
  const hemi = new THREE.HemisphereLight(0x8fa8d0, 0x2a1a10, 0.55); S.add(hemi);
  const fria = new THREE.DirectionalLight(0x9fbfe8, 2.2); fria.position.set(-1, 4, 1.5); S.add(fria);
  const quente = new THREE.DirectionalLight(0xffb07a, 1.5); quente.position.set(1.5, 0.3, 3); S.add(quente);
  const rim = new THREE.DirectionalLight(0x7fa8ff, 1.6); rim.position.set(0, 1, -3); S.add(rim);
  return { r, S, cam, hemi, fria, quente, rim, draw() { r.render(S, cam); } };
}
