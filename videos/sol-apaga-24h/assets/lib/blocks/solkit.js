/**
 * solkit.js — peças do vídeo "E se o Sol apagasse por 24 horas?" (estilo R10, usa toy.js e globe.js).
 *
 *   espaco(st)                         prepara um palco toy para o espaço (fundo preto, sem névoa/env, luz-chave = Sol)
 *   estrelas(scene, {n, r, seed, tam}) Points com seed; .mat.uniforms.uA (alpha), uT (tempo)
 *   criaSol(scene, {r, pos})          núcleo + coroa + halo aditivos; .set(L) 0 = apagado (contorno escuro), 1 = brilhando
 *   criaTerra(scene, st, {...})       Terra de globe.js, normais suaves, atmosfera sensível ao Sol, luzes de cidades.
 *                                      .set({ sol: Vector3 direção, luz: 0..1, cidades: 0..1, rotY })
 *   criaFeixe(scene)                  feixe de luz quente entre dois pontos (luz ainda a caminho)
 *   criaSeta(cor)                     seta 3D; .apontar(a, b, raio)
 *   brilho(cor, tam, tipo, op)        sprite aditivo ("suave", "raios", "disco")
 *   proj(v, cam) -> [x, y, z]         posição na tela (px)
 *   txt(ctx, s, x, y, {...})          texto 2D com sombra (Anton/Montserrat)
 *   cronometro(ctx, x, y, seg, titulo, a)   painel "LUZ CHEGA EM 8:20"
 *   ceuDin(st, dia, noite)            céu em gradiente que escurece: .set(k)
 *   poste(alt)                        poste com lâmpada, halo e poça de luz: .set(k)
 *   coruja(), morcego()               bichos noturnos (primitivas arredondadas)
 *   fontes()                          await antes do 1º quadro (Anton/Montserrat no canvas)
 * Tudo determinístico (mulberry32 + t).
 */
import * as THREE from "../three.module.js";
import { mulberry32, clamp, lerp, ease } from "../kit.js";
import { createGlobe, LAND, ll } from "./globe.js";
import { M, SPH, mesh } from "./toy.js";
import { createTerra, createCeu, createLua } from "./terra.js";

/* ---------- padrão documentário: Terra NASA e céu de terra.js ---------- */
// E.set({ sol: Vector3 (de onde vem a luz), luz: 0..1, cidades: 0..1.5, rotY, incl, nuvens })
export async function terraDoc(S, { raio = 1, seg = 96, pos = null } = {}) {
  const E = await createTerra({ raio, seg });
  if (pos) E.group.position.set(...pos);
  S.add(E.group);
  E.set = ({ sol, luz, cidades, rotY, incl, nuvens } = {}) => {
    if (sol) E.sol.copy(sol).normalize();
    if (luz !== undefined) E.u.luzSol.value = luz;
    if (cidades !== undefined) E.u.luzes.value = cidades;
    if (rotY !== undefined && rotY !== null) E.earth.rotation.y = rotY;
    if (incl !== undefined && incl !== null) E.group.rotation.z = incl;
    if (nuvens !== undefined) E.u.nuvens.value = nuvens;
  };
  return E;
}
export function ceuDoc(S, o = {}) {
  const C = createCeu({ seed: 7, n: 5000, via: 0.5, ...o }); S.add(C);
  return { C, set: (a) => { C.userData.brilho.value = a; } };
}
export { createLua };

// padrão documentário: rótulos técnicos em mono, acento azul nos diagramas e laranja no que é anomalia
export const AZUL = "#7cc8ff", LARANJA = "#ff8a4c";
export async function fontes() {
  try { await Promise.all(['500 40px "JetBrains Mono"', '300 40px "Inter"', '800 40px "Inter"', '100px "Anton"'].map((f) => document.fonts.load(f))); } catch (e) { /* segue com fallback */ }
}

/* ---------- texturas de brilho ---------- */
const _tex = {};
export function glowTex(tipo = "suave") {
  if (_tex[tipo]) return _tex[tipo];
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  if (tipo === "raios") {
    const r = mulberry32(31);
    g.translate(128, 128);
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

/* ---------- palco do espaço ---------- */
export function espaco(st) {
  const S = st.scene;
  S.background = new THREE.Color(0x020308);
  S.fog = null;
  S.environment = null;
  st.hemi.intensity = 0.02;
  st.rim.intensity = 0;
  st.key.castShadow = false;
  st.key.intensity = 3.4;
  st.key.color.setHex(0xfff1dc);
  st.key.target.position.set(0, 0, 0);
  return S;
}

/* ---------- estrelas ---------- */
export function estrelas(scene, { n = 2600, r = 600, seed = 7, tam = 3.2, alvo = null } = {}) {
  const rnd = mulberry32(seed);
  const pos = new Float32Array(n * 3), aS = new Float32Array(n), aC = new Float32Array(n), aP = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
    const b = Math.pow(rnd(), 3.2);
    aS[i] = tam * (0.6 + b * 2.6); aC[i] = rnd(); aP[i] = rnd();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aS", new THREE.BufferAttribute(aS, 1));
  geo.setAttribute("aC", new THREE.BufferAttribute(aC, 1));
  geo.setAttribute("aP", new THREE.BufferAttribute(aP, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uA: { value: 1 }, uT: { value: 0 } },
    vertexShader: `attribute float aS; attribute float aC; attribute float aP; uniform float uT; varying float vC; varying float vTw;
      void main(){ vC = aC; vTw = 0.78 + 0.22 * sin(uT * (2.0 + aP * 5.0) + aP * 40.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aS; }`,
    fragmentShader: `uniform float uA; varying float vC; varying float vTw;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r2 = dot(d, d);
        float a = exp(-r2 * 30.0) * vTw * uA; if (a < 0.004) discard;
        vec3 c = mix(vec3(0.70, 0.80, 1.0), vec3(1.0, 0.88, 0.72), vC);
        gl_FragColor = vec4(c * a, 1.0); }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = -1;
  (alvo || scene).add(pts);
  return { pts, mat, set: (a, t) => { mat.uniforms.uA.value = a; mat.uniforms.uT.value = t; } };
}

/* ---------- Sol ---------- */
export function criaSol(scene, { r = 1, pos = [0, 0, 0], halo = 9 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uL: { value: 1 }, uT: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uL; uniform float uT; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ float mu = clamp(dot(vN, vV), 0.0, 1.0);
        float gr = sin(vP.x * 23.0 + uT * 0.7) * sin(vP.y * 27.0 - uT * 0.5) * sin(vP.z * 25.0 + uT * 0.6);
        vec3 hot = mix(vec3(1.0, 0.50, 0.12), vec3(1.0, 0.97, 0.86), pow(mu, 0.45)) * (1.25 + gr * 0.1);
        vec3 ember = vec3(0.85, 0.16, 0.03) * (0.25 + 0.75 * pow(mu, 1.2)) * (0.9 + gr * 0.25);
        vec3 dark = vec3(0.012, 0.012, 0.016) + vec3(0.30, 0.38, 0.55) * pow(1.0 - mu, 4.0) * 0.55;
        vec3 c = uL > 0.22 ? mix(ember, hot, (uL - 0.22) / 0.78) : mix(dark, ember, uL / 0.22);
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), mat);
  g.add(core);
  const corona = brilho(0xffe6b8, r * 3.4), haloS = brilho(0xffc77a, r * halo), raios = brilho(0xfff0d0, r * halo * 1.4, "raios", 0.55);
  g.add(haloS, raios, corona);
  scene.add(g);
  function set(L, t = 0) {
    mat.uniforms.uL.value = L; mat.uniforms.uT.value = t;
    const h = clamp((L - 0.2) / 0.8);
    corona.material.opacity = h; haloS.material.opacity = h * 0.95; raios.material.opacity = h * 0.5;
    corona.scale.setScalar(r * 3.4 * (0.7 + 0.3 * h));
    haloS.scale.setScalar(r * halo * (0.35 + 0.65 * h));
    raios.scale.setScalar(r * halo * 1.4 * (0.4 + 0.6 * h));
    raios.material.rotation = t * 0.03;
  }
  set(1);
  return { group: g, core, mat, corona, halo: haloS, raios, set };
}

/* ---------- Terra ---------- */
function inPoly(x, y, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const CIDADES = [[-46.6,-23.5,3],[-43.2,-22.9,2],[-58.4,-34.6,2],[-77,-12,1],[-74,4.6,1],[-99,19.4,3],[-74,40.7,3],[-87.6,41.9,2],[-118,34,3],[-95,29.8,2],
  [-79,43.7,1.5],[0,51.5,3],[2.3,48.9,2.5],[-3.7,40.4,1.5],[13.4,52.5,1.5],[12.5,41.9,1.2],[37.6,55.8,2],[29,41,1.5],[31.2,30,2.5],[3.4,6.5,1.5],
  [28,-26.2,1.5],[36.8,-1.3,0.8],[77.2,28.6,3],[72.8,19,2.5],[90.4,23.8,2.5],[116.4,39.9,3],[121.5,31.2,3],[139.7,35.7,3.5],[127,37.5,2.5],[106.8,-6.2,2.5],
  [151.2,-33.9,1.2],[121,14.6,2],[100.5,13.8,2],[51.4,35.7,1.5],[46.7,24.7,1],[-34.9,-8,1],[-38.5,-13,1],[-43.9,-19.9,1.2],[-47.9,-15.8,0.8],[-51.2,-30,1],
  [-70.6,-33.4,1],[-80.2,25.8,1.5],[-122.4,37.8,1.5],[-122.3,47.6,1],[-96.8,32.8,1.5],[-84.4,33.7,1.2],[-77,38.9,1.5],[-73.6,45.5,1],[15.3,-4.3,1],[67,24.9,2],
  [88.4,22.6,2.5],[80.3,13.1,1.5],[114.2,22.3,2.5],[135.5,34.7,2],[30.5,50.5,1],[21,52.2,1],[18,59.3,0.6],[9.2,45.5,1.5],[2.2,41.4,1],[-9.1,38.7,0.8],
  [-7.6,33.6,1],[3,36.7,0.8],[38.7,9,1],[39.3,-6.8,0.8],[115.9,-32,0.6],[145,-37.8,1],[104,30.7,2],[114.3,30.6,2],[113.3,23.1,3],[-90,15,0.6],[-66,10,1],[8,50,2],[4.5,51,2]];

const lonX = (lon, W) => ((((lon + 90) / 360) % 1) + 1) % 1 * W;
let _tt = null, _nt = null;
export function terraTex() {
  if (_tt) return _tt;
  const W = 2048, H = 1024, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), r = mulberry32(41);
  const oc = g.createLinearGradient(0, 0, 0, H); oc.addColorStop(0, "#14365c"); oc.addColorStop(0.5, "#1c4f86"); oc.addColorStop(1, "#14365c");
  g.fillStyle = oc; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${20 + r() * 30},${70 + r() * 50},${120 + r() * 50},0.12)`; g.beginPath(); g.arc(r() * W, r() * H, 10 + r() * 60, 0, 6.3); g.fill(); }
  const path = (poly, dx) => { g.beginPath(); poly.forEach(([lo, la], i) => { let x = ((lo + 90) / 360) * W + dx; const y = ((90 - la) / 180) * H; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
  for (const poly of Object.values(LAND)) for (const dx of [-W, 0, W]) {
    path(poly, dx); g.fillStyle = "#4f6e34"; g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 700; i++) {
      const x = r() * W * 1.0 + dx - W * 0, y = r() * H, la = 90 - (y / H) * 180;
      const seco = Math.abs(la) > 12 && Math.abs(la) < 34 ? 0.75 : 0.15;
      const cc = r() < seco ? [170 + r() * 40, 140 + r() * 30, 90 + r() * 20] : [45 + r() * 40, 85 + r() * 40, 30 + r() * 20].map(Math.round);
      const rr = 10 + r() * 34, gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, `rgba(${cc.map(Math.round).join(",")},0.5)`); gr.addColorStop(1, `rgba(${cc.map(Math.round).join(",")},0)`);
      g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    g.restore();
    g.strokeStyle = "rgba(210,200,160,0.35)"; g.lineWidth = 2; g.stroke();
  }
  g.fillStyle = "#e9eef3"; g.fillRect(0, 0, W, H * 0.045); g.fillRect(0, H * 0.925, W, H * 0.075);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (_tt = t);
}
export function nuvemTex() {
  if (_nt) return _nt;
  const W = 1024, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), r = mulberry32(57);
  for (let i = 0; i < 300; i++) {
    const y = H * (0.5 + (r() - 0.5) * 0.85 * (r() < 0.5 ? 1 : 0.6)), x = r() * W, R = 6 + r() * 26, n = 3 + Math.floor(r() * 6);
    for (let k = 0; k < n; k++) {
      const gx = x + (r() - 0.5) * R * 4, gy = y + (r() - 0.5) * R * 1.2, rr = R * (0.5 + r());
      const gr = g.createRadialGradient(gx, gy, 0, gx, gy, rr); gr.addColorStop(0, "rgba(255,255,255,0.26)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; for (const dx of [-W, 0, W]) { g.save(); g.translate(dx, 0); g.fillRect(gx - rr, gy - rr, rr * 2, rr * 2); g.restore(); }
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (_nt = t);
}

export function criaTerra(scene, st, { detalhe = 32, nuvens = 110, luzes = 2600, seed = 3, tamLuz = 7 } = {}) {
  const antes = new Set(scene.children);
  const bg = scene.background;
  const G = createGlobe(scene, { detalhe, destaque: null, marcador: false, nuvens, nuvensAlvo: 0, estrelas: 0, onda: null });
  scene.background = bg;
  for (const o of [...scene.children]) if (!antes.has(o) && o.isLight) scene.remove(o);
  // normais suaves (cores continuam por face)
  let earthMesh = null, cloudMat = null;
  G.earth.traverse((o) => {
    if (!o.isMesh) return;
    if (o.material.vertexColors) earthMesh = o;
    else if (o.material.emissive) cloudMat = o.material;
  });
  // R10: troca o icosaedro facetado por esfera lisa com textura pintada a partir dos contornos LAND de globe.js
  earthMesh.geometry = new THREE.SphereGeometry(1, 96, 64);
  earthMesh.material = new THREE.MeshStandardMaterial({ map: terraTex(), roughness: 0.8, metalness: 0 });
  G.earth.traverse((o) => { if (o.isMesh && o !== earthMesh) o.visible = false; });
  const nuv = new THREE.Mesh(new THREE.SphereGeometry(1.012, 72, 48), new THREE.MeshStandardMaterial({ map: nuvemTex(), transparent: true, depthWrite: false, roughness: 1 }));
  G.earth.add(nuv);
  cloudMat = nuv.material;
  // atmosfera que depende do lado do Sol
  const atmoMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uSun: { value: new THREE.Vector3(1, 0, 0) }, uL: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ vW = normalize((modelMatrix * vec4(position, 1.0)).xyz); vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uSun; uniform float uL; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ float fr = pow(clamp(1.0 - dot(vN, vV), 0.0, 1.0), 2.4);
        float day = smoothstep(-0.3, 0.45, dot(vW, uSun));
        vec3 c = mix(vec3(1.0, 0.55, 0.3), vec3(0.35, 0.62, 1.0), smoothstep(-0.1, 0.4, dot(vW, uSun))) * fr * day * 1.3 * uL;
        gl_FragColor = vec4(c, 1.0); }`,
  });
  G.atmo.material = atmoMat;
  // luzes das cidades: núcleos em volta de cidades reais + pontos esparsos em terra
  const rnd = mulberry32(seed), polys = Object.values(LAND);
  const pos = [], tam = [], tot = CIDADES.reduce((s, c) => s + c[2], 0);
  const emTerra = (lon, lat) => polys.some((p) => inPoly(lon, lat, p));
  for (const [lon, lat, w] of CIDADES) {
    const k = Math.round(luzes * 0.7 * w / tot);
    for (let i = 0; i < k; i++) {
      const a = rnd() * 6.283, d = Math.pow(rnd(), 1.6) * (0.8 + w * 0.7);
      const lo = lon + Math.cos(a) * d / Math.max(0.3, Math.cos(lat * Math.PI / 180)), la = lat + Math.sin(a) * d;
      const v = ll(lo, la, 1.006); pos.push(v.x, v.y, v.z); tam.push(tamLuz * (0.5 + rnd() * (d < 0.4 ? 1.6 : 0.8)));
    }
  }
  let tries = 0;
  while (pos.length / 3 < luzes && tries++ < luzes * 30) {
    const lon = rnd() * 360 - 180, lat = Math.asin(rnd() * 2 - 1) * 180 / Math.PI;
    if (lat > 62 || lat < -45 || !emTerra(lon, lat)) continue;
    const v = ll(lon, lat, 1.006); pos.push(v.x, v.y, v.z); tam.push(tamLuz * (0.3 + rnd() * 0.5));
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  lg.setAttribute("aS", new THREE.Float32BufferAttribute(tam, 1));
  const luzMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uSun: { value: new THREE.Vector3(1, 0, 0) }, uSol: { value: 1 }, uA: { value: 0 } },
    vertexShader: `attribute float aS; uniform vec3 uSun; uniform float uSol; varying float vK;
      void main(){ vec3 w = normalize((modelMatrix * vec4(position, 1.0)).xyz);
        vK = mix(1.0, smoothstep(0.12, -0.2, dot(w, uSun)), uSol);
        vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = aS * 3.0 / max(0.2, -mv.z); }`,
    fragmentShader: `uniform float uA; varying float vK;
      void main(){ vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d, d) * 26.0) * vK * uA; if (a < 0.004) discard;
        gl_FragColor = vec4(vec3(1.0, 0.72, 0.36) * a, 1.0); }`,
  });
  const luzesP = new THREE.Points(lg, luzMat); luzesP.frustumCulled = false;
  G.earth.add(luzesP);
  const sunDir = new THREE.Vector3(1, 0, 0);
  G.earth.rotation.order = "ZYX";
  function set({ sol = sunDir, luz = 1, cidades = 0, rotY = null, incl = null } = {}) {
    if (incl !== null) G.earth.rotation.z = incl;
    sunDir.copy(sol).normalize();
    st.key.position.copy(sunDir).multiplyScalar(60);
    st.key.target.position.set(0, 0, 0);
    st.key.intensity = 3.4 * luz;
    atmoMat.uniforms.uSun.value.copy(sunDir); atmoMat.uniforms.uL.value = luz;
    luzMat.uniforms.uSun.value.copy(sunDir); luzMat.uniforms.uSol.value = luz; luzMat.uniforms.uA.value = cidades;
    if (rotY !== null) G.earth.rotation.y = rotY;
  }
  return { ...G, earthMesh, cloudMat, luzes: luzesP, luzMat, set };
}

/* ---------- feixe de luz (região ainda iluminada) ---------- */
export function criaFeixe(scene, { cor = 0xffd9a0, raio = 1 } = {}) {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 32, 1, true); geo.rotateZ(-Math.PI / 2); geo.translate(0.5, 0, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: new THREE.Color(cor) }, uA: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vX;
      void main(){ vX = position.x; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uC; uniform float uA; varying vec3 vN; varying vec3 vV; varying float vX;
      void main(){ float f = pow(abs(dot(vN, vV)), 1.5); float e = smoothstep(0.0, 0.04, vX);
        gl_FragColor = vec4(uC * f * 0.35 * e * uA, 1.0); }`,
  });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false;
  scene.add(m);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), d = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);
  function de(p, q, r = raio, alpha = 1) {
    a.copy(p); b.copy(q); d.subVectors(b, a); const L = d.length();
    m.visible = L > 1e-3 && alpha > 0.002;
    m.position.copy(a); m.quaternion.setFromUnitVectors(X, d.normalize()); m.scale.set(Math.max(1e-3, L), r, r);
    mat.uniforms.uA.value = alpha;
  }
  return { mesh: m, mat, de };
}

/* ---------- seta 3D ---------- */
const _cyl = new THREE.CylinderGeometry(1, 1, 1, 14); _cyl.translate(0, 0.5, 0);
const _cone = new THREE.ConeGeometry(1, 1, 20); _cone.translate(0, 0.5, 0);
export function criaSeta(cor, { emis = 0.6 } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: cor, emissive: cor, emissiveIntensity: emis, roughness: 0.4 });
  const s = new THREE.Mesh(_cyl, mat), h = new THREE.Mesh(_cone, mat);
  g.add(s, h);
  const Y = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3();
  function apontar(a, b, r = 0.05) {
    d.subVectors(b, a); const L = d.length();
    g.visible = L > 1e-3;
    if (!g.visible) return;
    g.position.copy(a); g.quaternion.setFromUnitVectors(Y, d.normalize());
    const hl = Math.min(L * 0.45, r * 5);
    s.scale.set(r, Math.max(1e-3, L - hl), r);
    h.position.y = L - hl; h.scale.set(r * 2.6, hl, r * 2.6);
  }
  return { group: g, mat, apontar };
}

/* ---------- 2D ---------- */
const _pv = new THREE.Vector3();
export function proj(v, cam) {
  cam.updateMatrixWorld(); _pv.copy(v).project(cam);
  return [(_pv.x + 1) * 540, (1 - _pv.y) * 960, _pv.z];
}
const FAM = { mono: '"JetBrains Mono", ui-monospace, "DejaVu Sans Mono", monospace', inter: '"Inter", "Montserrat", sans-serif', Anton: '"Anton", sans-serif', Montserrat: '"Montserrat", sans-serif' };
export function txt(ctx, s, x, y, { tam = 40, cor = "#fff", fonte = "mono", peso = 500, al = "center", a = 1, base = "middle", borda = 0, esp = 0.08 } = {}) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, a);
  ctx.font = `${fonte === "Anton" ? "" : peso + " "}${tam}px ${FAM[fonte] || FAM.mono}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = (fonte === "mono" ? esp * tam : 0) + "px";
  ctx.textAlign = al; ctx.textBaseline = base;
  ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = tam * 0.35; ctx.shadowOffsetY = tam * 0.06;
  if (borda) { ctx.lineWidth = borda; ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.strokeText(s, x, y); }
  ctx.fillStyle = cor; ctx.fillText(s, x, y);
  ctx.restore();
}
export function pilula(ctx, x, y, w, h, a = 1, cor = "rgba(8,10,20,0.62)") {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = cor;
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h * 0.22); ctx.fill();
  ctx.strokeStyle = "rgba(124,200,255,0.45)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
export const mmss = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
export function cronometro(ctx, x, y, seg, titulo = "A LUZ CHEGA EM", a = 1, pulso = 0) {
  if (a <= 0.003) return;
  const k = 1 + pulso * 0.08;
  pilula(ctx, x, y, 500 * k, 210 * k, a);
  txt(ctx, titulo, x, y - 62 * k, { tam: 28 * k, cor: AZUL, a });
  txt(ctx, mmss(seg), x, y + 30 * k, { tam: 104 * k, fonte: "mono", peso: 600, esp: 0.02, a });
}

/* ---------- céu que escurece ---------- */
export function ceuDin(st, dia = ["#4D8FD6", "#CFE3F0"], noite = ["#03050c", "#0d1830"]) {
  const c = document.createElement("canvas"); c.width = 4; c.height = 256;
  const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  st.scene.background = tex;
  const D = dia.map((h) => new THREE.Color(h)), N = noite.map((h) => new THREE.Color(h)), a = new THREE.Color(), b = new THREE.Color();
  let ult = -1;
  function set(k) {
    k = clamp(k);
    if (Math.abs(k - ult) < 1e-4) return;
    ult = k;
    a.lerpColors(D[0], N[0], k); b.lerpColors(D[1], N[1], k);
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#" + a.getHexString()); gr.addColorStop(1, "#" + b.getHexString());
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256); tex.needsUpdate = true;
    if (st.scene.fog) st.scene.fog.color.copy(b);
  }
  set(0);
  return { tex, set };
}

/* ---------- poste ---------- */
const _pole = new THREE.CylinderGeometry(0.12, 0.16, 1, 10);
const _disc = new THREE.CircleGeometry(1, 32);
const _luzCone = new THREE.ConeGeometry(1, 1, 24, 1, true);
export function poste(alt = 7, lado = 1) {
  const g = new THREE.Group();
  const p = mesh(_pole, 0x3a3d44, g, 0.5); p.scale.y = alt; p.position.y = alt / 2;
  const arm = mesh(_pole, 0x3a3d44, g, 0.5); arm.scale.set(0.6, 1.8, 0.6); arm.rotation.z = lado * Math.PI / 2; arm.position.set(-lado * 0.9, alt - 0.05, 0);
  const cab = mesh(SPH, 0x2c2f35, g, 0.4); cab.scale.set(0.55, 0.18, 0.3); cab.position.set(-lado * 1.75, alt - 0.1, 0);
  const lmat = new THREE.MeshBasicMaterial({ color: 0x55504a, toneMapped: false });
  const lamp = new THREE.Mesh(SPH, lmat); lamp.scale.set(0.38, 0.1, 0.22); lamp.position.set(-lado * 1.75, alt - 0.25, 0); g.add(lamp);
  const halo = brilho(0xffb760, 5.5, "suave", 0); halo.position.copy(lamp.position); g.add(halo);
  const poolMat = new THREE.MeshBasicMaterial({ map: glowTex("disco"), color: 0xffa64d, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const pool = new THREE.Mesh(_disc, poolMat); pool.rotation.x = -Math.PI / 2; pool.scale.setScalar(4.2); pool.position.set(-lado * 1.75, -0.25, 0); g.add(pool);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xffb35c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const cone = new THREE.Mesh(_luzCone, coneMat); cone.scale.set(3.2, alt - 0.3, 3.2); cone.position.set(-lado * 1.75, (alt - 0.3) / 2, 0); g.add(cone);
  const off = new THREE.Color(0x55504a), on = new THREE.Color(0xfff0c8);
  function set(k) {
    // acende com um pequeno tremor (lâmpada de vapor de sódio esquentando)
    lmat.color.lerpColors(off, on, k);
    halo.material.opacity = k; poolMat.opacity = 0.75 * k; coneMat.opacity = 0.07 * k;
  }
  set(0);
  return { group: g, set, lamp };
}

/* ---------- bichos noturnos ---------- */
export function coruja() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const C = 0x8a6a4a, C2 = 0xc9b28c;
  const b = mesh(SPH, C, body, 0.85); b.scale.set(0.42, 0.55, 0.4); b.position.y = 0.55;
  const peito = mesh(SPH, C2, body, 0.9); peito.scale.set(0.3, 0.42, 0.3); peito.position.set(0.16, 0.5, 0);
  const head = new THREE.Group(); head.position.y = 1.12; body.add(head);
  const h = mesh(SPH, C, head, 0.85); h.scale.set(0.36, 0.32, 0.38);
  const disco = mesh(SPH, C2, head, 0.9); disco.scale.set(0.12, 0.26, 0.32); disco.position.set(0.27, -0.02, 0);
  const olhoM = new THREE.MeshStandardMaterial({ color: 0xffb21a, emissive: 0xffa000, emissiveIntensity: 1.4, roughness: 0.2 });
  for (const s of [1, -1]) {
    const o = new THREE.Mesh(SPH, olhoM); o.scale.setScalar(0.1); o.position.set(0.36, 0.02, s * 0.13); head.add(o);
    const p = mesh(SPH, 0x0d0a08, head, 0.1, false); p.scale.setScalar(0.055); p.position.set(0.44, 0.02, s * 0.13);
    const tufo = mesh(SPH, C, head, 0.85); tufo.scale.set(0.06, 0.16, 0.05); tufo.position.set(0.05, 0.3, s * 0.2); tufo.rotation.x = s * -0.4;
  }
  const bico = mesh(SPH, 0x3a3128, head, 0.4); bico.scale.set(0.07, 0.08, 0.05); bico.position.set(0.39, -0.1, 0);
  const wings = [1, -1].map((s) => {
    const w = new THREE.Group(); w.position.set(-0.02, 0.85, s * 0.34); body.add(w);
    const m = mesh(SPH, 0x6e5238, w, 0.85); m.scale.set(0.36, 0.06, 0.62); m.position.z = s * 0.5;
    return w;
  });
  for (const s of [1, -1]) { const p = mesh(SPH, 0xd9a441, body, 0.6); p.scale.set(0.09, 0.05, 0.06); p.position.set(0.1, 0.04, s * 0.12); }
  function update(t, voa = 0) {
    wings.forEach((w, i) => { const s = i ? -1 : 1; w.rotation.x = voa ? s * Math.sin(t * voa * 6.283) * 0.8 : s * -1.25; });
    head.rotation.y = Math.sin(t * 0.9) * 0.5;
  }
  update(0);
  return { group: g, update, head };
}
export function morcego(seed = 1) {
  const g = new THREE.Group();
  const C = 0x2a2226;
  const b = mesh(SPH, C, g, 0.8); b.scale.set(0.32, 0.14, 0.14);
  const h = mesh(SPH, C, g, 0.8); h.scale.set(0.12, 0.12, 0.12); h.position.x = 0.3;
  for (const s of [1, -1]) { const e = mesh(SPH, C, g, 0.8); e.scale.set(0.03, 0.08, 0.03); e.position.set(0.3, 0.13, s * 0.06); }
  const wings = [1, -1].map((s) => {
    const w = new THREE.Group(); g.add(w);
    const m1 = mesh(SPH, 0x3a2f33, w, 0.9); m1.scale.set(0.3, 0.02, 0.45); m1.position.z = s * 0.42;
    const m2 = mesh(SPH, 0x3a2f33, w, 0.9); m2.scale.set(0.2, 0.02, 0.3); m2.position.set(-0.12, 0, s * 0.78);
    return w;
  });
  const ph = mulberry32(seed)() * 6.28;
  function update(t, voa = 7) { wings.forEach((w, i) => { w.rotation.x = (i ? -1 : 1) * Math.sin(t * voa * 6.283 + ph) * 0.9; }); }
  return { group: g, update };
}

/* ---------- desempenho: janelas dos prédios com caixa simples (12 triângulos em vez do roundBox chanfrado) ---------- */
const _jan = new THREE.BoxGeometry(1.0, 1.3, 0.3);
export function aliviar(root) {
  root.traverse((o) => { if (o.isInstancedMesh && o.material && o.material.emissive && o.geometry.type === "ExtrudeGeometry" && o.count > 4) o.geometry = _jan; });
  return root;
}
/* ---------- terminador 2D: lado escuro de uma linha no chão (x = xe), com borda suave ---------- */
export function terminador(ctx, cam, xe, a = 0.8, borda = 140) {
  const p1 = proj(new THREE.Vector3(xe, 0, -400), cam), p2 = proj(new THREE.Vector3(xe, 0, 400), cam);
  const q = proj(new THREE.Vector3(xe - 50, 0, 0), cam);   // um ponto do lado escuro
  let dx = p2[0] - p1[0], dy = p2[1] - p1[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
  let nx = -dy, ny = dx; if ((q[0] - p1[0]) * nx + (q[1] - p1[1]) * ny < 0) { nx = -nx; ny = -ny; }
  const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
  ctx.save(); ctx.translate(mx, my); ctx.rotate(Math.atan2(ny, nx));
  const g = ctx.createLinearGradient(-borda / 2, 0, borda / 2, 0);
  g.addColorStop(0, "rgba(255,170,90,0)"); g.addColorStop(0.35, `rgba(255,150,80,${0.35 * a})`); g.addColorStop(0.5, `rgba(3,5,14,${a * 0.6})`); g.addColorStop(1, `rgba(3,5,14,${a})`);
  ctx.fillStyle = g; ctx.fillRect(-borda / 2, -4000, borda, 8000);
  ctx.fillStyle = `rgba(3,5,14,${a})`; ctx.fillRect(borda / 2, -4000, 6000, 8000);
  ctx.restore();
}
