/**
 * lua.js — peças do vídeo "E se a Lua desaparecesse por 7 dias?" (R10 cinema realista).
 *
 *   estrelas(scene, {n, r, seed, tam})        -> { pts, mat }  mat.uniforms.uA = brilho (0..2)
 *   viaLactea(scene, {r, seed, normal})        -> { grupo, set(a) }  faixa de estrelas + nebulosidade aditiva
 *   sol(scene, {pos, r})                       -> { grupo, disco, halo, coroa }
 *   luaTex(), terraTex(), nuvensTex()          texturas procedurais (canvas, seed fixa)
 *   luaEsfera(r, {brilho})                     esfera da Lua (brilho > 0: MeshBasic, para o céu noturno)
 *   terra(scene, {r})                          -> { grupo, giro, nuvens, atmo, setSol(vec3) }  Terra PBR com atmosfera
 *   ceuDome(scene, {topo, horiz, base})        -> { mesh, set(topo, horiz, base) } céu em degradê animável
 *   seta(cor, r)                               -> { g, set(de, para) } seta 3D (haste + ponta)
 *   anelTracejado(r, {n, tubo, cor, opac})     anel tracejado no plano xz
 *   proj(v, cam)                               -> [x, y, naFrente] em pixels (1080x1920)
 *   tag(ctx, txt, x, y, {...})                 etiqueta 2D (Montserrat) com fundo; opcional linha até (ax, ay)
 *   pontos(scene, n, {tam, aditivo})           -> { geo, P, C, A, mat, sync() } nuvem de Points com cor/alfa por ponto
 *   besouro(), coral*(), grama(), acacia()      bichos e plantas montados com primitivas
 * Tudo determinístico (mulberry32), sem Math.random/Date.
 */
import * as THREE from "../three.module.js";
import { mulberry32, clamp, lerp } from "../kit.js";
import { LAND } from "./globe.js";
import { M, SPH, mesh } from "./toy.js";

/* ---------- texturas ---------- */
const _glow = new Map();
export function glowTex(cor = "255,255,255", pot = 1, key = "") {
  const k = cor + pot + key;
  if (_glow.has(k)) return _glow.get(k);
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d"), im = g.createImageData(256, 256);
  const [r, gg, b] = cor.split(",").map(Number);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const d = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = Math.max(0, Math.pow(Math.max(0, 1 - d), 2.2 * pot) + 0.35 * Math.exp(-d * d * 30));
    const i = (y * 256 + x) * 4; im.data[i] = r; im.data[i + 1] = gg; im.data[i + 2] = b; im.data[i + 3] = Math.min(255, a * 255);
  }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  _glow.set(k, t); return t;
}
export function sprite(tex, cor = 0xffffff, opac = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: cor, transparent: true, opacity: opac, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  return s;
}

let _luaT = null;
export function luaTex() {
  if (_luaT) return _luaT;
  const W = 1024, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), r = mulberry32(4242);
  g.fillStyle = "#b9b7b1"; g.fillRect(0, 0, W, H);
  // relevo fino
  for (let i = 0; i < 9000; i++) { const v = 150 + r() * 60 | 0; g.fillStyle = `rgba(${v},${v},${v - 4},0.25)`; g.fillRect(r() * W, r() * H, 2 + r() * 4, 2 + r() * 4); }
  // mares (manchas escuras) concentrados na face visível (u 0.25..0.75)
  const mares = [[0.42, 0.33, 70], [0.47, 0.42, 60], [0.55, 0.36, 55], [0.36, 0.45, 80], [0.6, 0.48, 45], [0.52, 0.55, 40], [0.33, 0.33, 50], [0.58, 0.28, 35], [0.45, 0.62, 38]];
  for (const [u, v, s] of mares) for (let k = 0; k < 14; k++) {
    const x = u * W + (r() - 0.5) * s * 1.6, y = v * H + (r() - 0.5) * s * 1.1, rr = s * (0.35 + r() * 0.5);
    const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(92,92,96,0.55)"); gr.addColorStop(1, "rgba(92,92,96,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 6.3); g.fill();
  }
  // crateras
  for (let i = 0; i < 230; i++) {
    const x = r() * W, y = H * (0.08 + r() * 0.84), rr = 1.5 + Math.pow(r(), 3) * 16;
    g.fillStyle = "rgba(90,90,92,0.22)"; g.beginPath(); g.arc(x, y, rr, 0, 6.3); g.fill();
    g.strokeStyle = "rgba(235,233,226,0.35)"; g.lineWidth = Math.max(1, rr * 0.25); g.beginPath(); g.arc(x - rr * 0.15, y - rr * 0.15, rr, 3.4, 5.9); g.stroke();
  }
  // Tycho com raios
  const tx = 0.47 * W, ty = 0.78 * H;
  g.strokeStyle = "rgba(240,238,232,0.18)"; g.lineWidth = 2;
  for (let i = 0; i < 26; i++) { const a = r() * 6.28, l = 40 + r() * 140; g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + Math.cos(a) * l, ty + Math.sin(a) * l * 0.6); g.stroke(); }
  g.fillStyle = "#f2f0ea"; g.beginPath(); g.arc(tx, ty, 6, 0, 6.3); g.fill();
  _luaT = new THREE.CanvasTexture(c); _luaT.colorSpace = THREE.SRGBColorSpace; _luaT.anisotropy = 4;
  return _luaT;
}

function inPoly(x, y, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
let _terraT = null;
export function terraTex() {
  if (_terraT) return _terraT;
  const W = 1024, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), im = g.createImageData(W, H), r = mulberry32(77);
  const polys = Object.values(LAND);
  // ruído de valor barato (grade 64x32 interpolada)
  const N = []; for (let i = 0; i < 65 * 33; i++) N.push(r());
  const nz = (u, v) => { const x = u * 64, y = v * 32, i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const a = N[j * 65 + i], b = N[j * 65 + i + 1], cc = N[(j + 1) * 65 + i], d = N[(j + 1) * 65 + i + 1];
    return lerp(lerp(a, b, fx), lerp(cc, d, fx), fy); };
  for (let y = 0; y < H; y++) {
    const lat = 90 - (y + 0.5) / H * 180;
    for (let x = 0; x < W; x++) {
      const lon = (x + 0.5) / W * 360 - 180, u = x / W, v = y / H;
      const n = nz(u, v) * 0.6 + nz((u * 3) % 1, (v * 3) % 1) * 0.4;
      let R, G, B;
      const terra = polys.some((p) => inPoly(lon, lat, p));
      if (lat < -66 || (lat > 72 && terra) || (inPoly(lon, lat, LAND.grl))) { const k = 225 + n * 25; R = k; G = k + 2; B = k + 6; }
      else if (terra) {
        const al = Math.abs(lat);
        const deserto = (al > 15 && al < 33) ? 1 : 0;
        if (al > 55) { R = 108 + n * 30; G = 104 + n * 25; B = 84; }
        else if (deserto) { R = 178 + n * 40; G = 150 + n * 30; B = 100 + n * 20; }
        else if (al < 15) { R = 52 + n * 30; G = 92 + n * 30; B = 40 + n * 15; }
        else { R = 86 + n * 35; G = 108 + n * 30; B = 60 + n * 20; }
      } else {
        const raso = 1 - Math.min(1, Math.abs(lat) / 70);
        R = 10 + n * 10; G = 42 + n * 18 + raso * 10; B = 92 + n * 25 + raso * 18;
      }
      const i = (y * W + x) * 4; im.data[i] = R; im.data[i + 1] = G; im.data[i + 2] = B; im.data[i + 3] = 255;
    }
  }
  g.putImageData(im, 0, 0);
  _terraT = new THREE.CanvasTexture(c); _terraT.colorSpace = THREE.SRGBColorSpace; _terraT.anisotropy = 4;
  return _terraT;
}
let _nuvT = null;
export function nuvensTex() {
  if (_nuvT) return _nuvT;
  const W = 1024, H = 512, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), r = mulberry32(99);
  for (let i = 0; i < 650; i++) {
    const lat = (r() - 0.5) * 2 * (r() < 0.5 ? 70 : 35), y = (90 - lat) / 180 * H, x = r() * W;
    const s = 3 + Math.pow(r(), 2) * 20, a = 0.08 + r() * 0.22;
    const gr = g.createRadialGradient(x, y, 0, x, y, s * 1.8); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(1.8 + r() * 1.5, 1); g.translate(-x, -y); g.beginPath(); g.arc(x, y, s * 1.8, 0, 6.3); g.fill(); g.restore();
  }
  _nuvT = new THREE.CanvasTexture(c); _nuvT.colorSpace = THREE.SRGBColorSpace;
  return _nuvT;
}

/* ---------- céu ---------- */
const PTS_VS = `attribute float aS; attribute vec3 aC; varying vec3 vC; uniform float uA; uniform float uAt;
  void main(){ vC = aC * uA; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
    gl_PointSize = aS * mix(1.0, 40.0 / max(1.0, -mv.z), uAt); }`;
const PTS_FS = `varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d,d); float a = exp(-r * 22.0); if (a < 0.01) discard; gl_FragColor = vec4(vC * a, 1.0); }`;
export function estrelas(scene, { n = 2600, r = 900, seed = 5, tam = 2.4, so = null } = {}) {
  const rs = mulberry32(seed), P = new Float32Array(n * 3), S = new Float32Array(n), C = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let u = rs() * 2 - 1, th = rs() * 6.283;
    if (so === "cima") u = Math.abs(u) * 0.97 + 0.03;
    const q = Math.sqrt(1 - u * u);
    P.set([r * q * Math.cos(th), r * u, r * q * Math.sin(th)], i * 3);
    const b = Math.pow(rs(), 3);
    S[i] = tam * (0.6 + b * 2.2);
    const tint = rs();
    const k = 0.35 + b * 0.9;
    C.set(tint < 0.2 ? [k * 0.8, k * 0.88, k] : tint > 0.85 ? [k, k * 0.9, k * 0.75] : [k, k, k], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
  geo.setAttribute("aS", new THREE.BufferAttribute(S, 1));
  geo.setAttribute("aC", new THREE.BufferAttribute(C, 3));
  const mat = new THREE.ShaderMaterial({ uniforms: { uA: { value: 1 }, uAt: { value: 0 } }, vertexShader: PTS_VS, fragmentShader: PTS_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = -5;
  scene.add(pts);
  return { pts, mat };
}
// Via Láctea: faixa em torno do grande círculo perpendicular a `normal`
export function viaLactea(scene, { r = 850, seed = 31, normal = new THREE.Vector3(0.55, 0.35, 0.76).normalize(), n = 5000 } = {}) {
  const grupo = new THREE.Group(); scene.add(grupo);
  const rs = mulberry32(seed);
  const a = new THREE.Vector3(0, 1, 0).cross(normal).normalize(), b = normal.clone().cross(a).normalize();
  const P = new Float32Array(n * 3), S = new Float32Array(n), C = new Float32Array(n * 3), v = new THREE.Vector3();
  const gauss = () => (rs() + rs() + rs() - 1.5) / 1.5;
  for (let i = 0; i < n; i++) {
    const th = rs() * 6.283, off = gauss() * 0.16 * (1 + 0.6 * Math.sin(th * 2));
    v.copy(a).multiplyScalar(Math.cos(th)).addScaledVector(b, Math.sin(th)).addScaledVector(normal, off).normalize().multiplyScalar(r);
    P.set([v.x, v.y, v.z], i * 3);
    const br = Math.pow(rs(), 2.5);
    S[i] = 1.4 + br * 3.2;
    const k = 0.4 + br * 0.9, w = rs();
    C.set([k, k * (0.92 + w * 0.05), k * (0.8 + w * 0.25)], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
  geo.setAttribute("aS", new THREE.BufferAttribute(S, 1));
  geo.setAttribute("aC", new THREE.BufferAttribute(C, 3));
  const mat = new THREE.ShaderMaterial({ uniforms: { uA: { value: 1 }, uAt: { value: 0 } }, vertexShader: PTS_VS, fragmentShader: PTS_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = -4; grupo.add(pts);
  // nebulosidade: sprites aditivos ao longo da faixa (núcleo mais quente), com "poeira" escura entre eles
  const spr = [];
  for (let i = 0; i < 120; i++) {
    const th = (i / 120) * 6.283 + rs() * 0.05, off = gauss() * 0.07;
    v.copy(a).multiplyScalar(Math.cos(th)).addScaledVector(b, Math.sin(th)).addScaledVector(normal, off).normalize().multiplyScalar(r * 0.98);
    const nucleo = Math.exp(-Math.pow(((th + 0.6) % 6.283) - 3.14, 2) * 0.8);
    const s = sprite(glowTex(nucleo > 0.4 ? "255,226,190" : "200,214,255", 1.2), 0xffffff, 0.09 + nucleo * 0.14);
    s.position.copy(v); s.scale.setScalar(r * (0.24 + rs() * 0.12 + nucleo * 0.14)); s.renderOrder = -6; s.userData.o = s.material.opacity;
    grupo.add(s); spr.push(s);
  }
  function set(k) { mat.uniforms.uA.value = k; spr.forEach((s) => { s.material.opacity = s.userData.o * k; }); }
  return { grupo, set, mat };
}
export function sol(scene, { pos = new THREE.Vector3(-60, 30, -80), r = 2.2, coroa = 1 } = {}) {
  const grupo = new THREE.Group(); grupo.position.copy(pos); scene.add(grupo);
  const disco = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d8).multiplyScalar(3), fog: false }));
  grupo.add(disco);
  const halo = sprite(glowTex("255,214,160", 1.6), 0xffffff, 0.9 * coroa); halo.scale.setScalar(r * 10); grupo.add(halo);
  const brilho = sprite(glowTex("255,248,235", 3), 0xffffff, 1); brilho.scale.setScalar(r * 3.4); grupo.add(brilho);
  return { grupo, disco, halo, brilho };
}
export function ceuDome(scene, { topo = "#0b1830", horiz = "#24395c", base = "#05070c", r = 1500, exp = 0.6 } = {}) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uT: { value: new THREE.Color(topo) }, uH: { value: new THREE.Color(horiz) }, uB: { value: new THREE.Color(base) }, uE: { value: exp } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uT; uniform vec3 uH; uniform vec3 uB; uniform float uE; varying vec3 vP;
      void main(){ float y = vP.y; vec3 c = y > 0.0 ? mix(uH, uT, pow(clamp(y,0.0,1.0), uE)) : mix(uH, uB, clamp(-y*6.0,0.0,1.0)); gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), mat); m.renderOrder = -10; m.frustumCulled = false;
  scene.add(m);
  const tmp = new THREE.Color();
  function set(topo, horiz, base) { if (topo) mat.uniforms.uT.value.set(topo); if (horiz) mat.uniforms.uH.value.set(horiz); if (base) mat.uniforms.uB.value.set(base); }
  function mix(a, b, k) { for (const u of ["uT", "uH", "uB"]) mat.uniforms[u].value.copy(tmp.set(a[u])).lerp(new THREE.Color(b[u]), k); }
  return { mesh: m, mat, set, mix };
}

/* ---------- corpos ---------- */
export function luaEsfera(r = 1, { brilho = 0, seg = 48 } = {}) {
  const mat = brilho
    ? new THREE.MeshBasicMaterial({ map: luaTex(), color: new THREE.Color(0xfffaf0).multiplyScalar(brilho), fog: false, transparent: true })
    : new THREE.MeshStandardMaterial({ map: luaTex(), roughness: 1, metalness: 0, envMapIntensity: 0 });
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.66)), mat);
  m.rotation.y = -Math.PI / 2; // face visível (mares) para +z
  return m;
}
export function terra(scene, { r = 1, seg = 72 } = {}) {
  const grupo = new THREE.Group(); scene.add(grupo);
  const giro = new THREE.Group(); grupo.add(giro);
  const solo = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)),
    new THREE.MeshStandardMaterial({ map: terraTex(), roughness: 0.75, metalness: 0, envMapIntensity: 0 }));
  giro.add(solo);
  const nuvens = new THREE.Mesh(new THREE.SphereGeometry(r * 1.012, seg, Math.round(seg * 0.7)),
    new THREE.MeshStandardMaterial({ map: nuvensTex(), transparent: true, depthWrite: false, roughness: 1, envMapIntensity: 0 }));
  giro.add(nuvens);
  const uSol = { value: new THREE.Vector3(-1, 0.3, 0.5).normalize() };
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 64, 40), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uSol, uA: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uSol; uniform float uA; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 V = normalize(cameraPosition - vW); float fr = pow(clamp(1.0 - dot(vN, V), 0.0, 1.0), 2.4);
        float dia = clamp(dot(vN, uSol) * 1.4 + 0.35, 0.0, 1.0);
        vec3 c = vec3(0.32, 0.58, 1.0) * fr * (0.08 + 1.3 * dia) * uA; gl_FragColor = vec4(c, 1.0); }`,
  }));
  grupo.add(atmo);
  function setSol(dir) { uSol.value.copy(dir).normalize(); }
  return { grupo, giro, solo, nuvens, atmo, setSol };
}

/* ---------- diagramas ---------- */
const _cil = new THREE.CylinderGeometry(1, 1, 1, 12); _cil.translate(0, 0.5, 0);
const _cone = new THREE.ConeGeometry(1, 1, 16); _cone.translate(0, 0.5, 0);
const _Y = new THREE.Vector3(0, 1, 0);
export function seta(cor = 0x7cc8ff, r = 0.035, cab = 5) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: cor, fog: false, transparent: true, depthTest: false });
  const haste = new THREE.Mesh(_cil, mat), ponta = new THREE.Mesh(_cone, mat);
  g.add(haste, ponta); haste.renderOrder = ponta.renderOrder = 20;
  const d = new THREE.Vector3();
  function set(de, para, k = 1) {
    d.subVectors(para, de); const L = d.length() * k;
    g.visible = L > 1e-3; if (!g.visible) return;
    g.position.copy(de); g.quaternion.setFromUnitVectors(_Y, d.normalize());
    const hl = Math.min(L * 0.45, r * cab * 1.6);
    haste.scale.set(r, Math.max(0.001, L - hl), r);
    ponta.scale.set(r * 2.6, hl, r * 2.6); ponta.position.y = L - hl;
  }
  return { g, set, mat };
}
export function anelTracejado(r = 4, { n = 72, tubo = 0.02, cor = 0xffffff, opac = 0.6, cheio = 0.55 } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.TorusGeometry(r, tubo, 4, 6, (6.283 / n) * cheio);
  const mat = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: opac, fog: false, depthWrite: false });
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); m.rotation.z = (i / n) * 6.283; g.add(m); }
  g.rotation.x = -Math.PI / 2;
  g.userData.mat = mat;
  return g;
}
export function anel(r = 4, { tubo = 0.02, cor = 0xffffff, opac = 0.6, arco = 6.2832 } = {}) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tubo, 6, 160, arco), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: opac, fog: false, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}
const _v = new THREE.Vector3();
export function proj(v, cam) {
  _v.copy(v).project(cam);
  return [(_v.x + 1) * 540, (1 - _v.y) * 960, _v.z < 1];
}
export function tag(ctx, txt, x, y, { a = 1, tam = 34, cor = "#ffffff", fundo = "rgba(8,10,20,0.55)", align = "center", ax = null, ay = null, borda = null } = {}) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a);
  ctx.font = `600 ${tam}px Montserrat, sans-serif`; ctx.textBaseline = "middle";
  const w = ctx.measureText(txt).width, px = tam * 0.55, h = tam * 1.55;
  let x0 = align === "center" ? x - w / 2 - px : align === "right" ? x - w - 2 * px : x;
  x0 = Math.max(24, Math.min(1080 - 230 - w - 2 * px, x0));
  if (ax !== null) {
    ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(Math.max(x0, Math.min(x0 + w + 2 * px, ax)), y + (ay > y ? h / 2 : -h / 2)); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ax, ay, 6, 0, 6.3); ctx.fill();
  }
  ctx.fillStyle = fundo;
  const rr = h / 2;
  ctx.beginPath(); ctx.moveTo(x0 + rr, y - h / 2); ctx.arcTo(x0 + w + 2 * px, y - h / 2, x0 + w + 2 * px, y + h / 2, rr); ctx.arcTo(x0 + w + 2 * px, y + h / 2, x0, y + h / 2, rr);
  ctx.arcTo(x0, y + h / 2, x0, y - h / 2, rr); ctx.arcTo(x0, y - h / 2, x0 + w + 2 * px, y - h / 2, rr); ctx.closePath(); ctx.fill();
  if (borda) { ctx.strokeStyle = borda; ctx.lineWidth = 3; ctx.stroke(); }
  ctx.fillStyle = cor; ctx.fillText(txt, x0 + px, y + 1);
  ctx.restore();
}
export const borda = (t, D, a = 0.3, b = 0.25) => clamp(t / a) * clamp((D - t) / b);

/* ---------- nuvem de pontos com cor e alfa por ponto ---------- */
export function pontos(scene, n, { tam = 1, aditivo = true, atenua = 30 } = {}) {
  const P = new Float32Array(n * 3), C = new Float32Array(n * 3), A = new Float32Array(n), S = new Float32Array(n).fill(tam);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
  geo.setAttribute("aC", new THREE.BufferAttribute(C, 3));
  geo.setAttribute("aA", new THREE.BufferAttribute(A, 1));
  geo.setAttribute("aS", new THREE.BufferAttribute(S, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uK: { value: atenua }, uA: { value: 1 } }, transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `attribute vec3 aC; attribute float aA; attribute float aS; uniform float uK; varying vec3 vC; varying float vA;
      void main(){ vC = aC; vA = aA; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aS * uK / max(0.3, -mv.z); }`,
    fragmentShader: `uniform float uA; varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d,d) * 16.0) * vA * uA; if (a < 0.01) discard; gl_FragColor = vec4(vC * a, a); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
  function sync() { geo.attributes.position.needsUpdate = true; geo.attributes.aA.needsUpdate = true; geo.attributes.aC.needsUpdate = true; geo.attributes.aS.needsUpdate = true; }
  return { pts, geo, P, C, A, S, mat, sync };
}

/* ---------- natureza ---------- */
// grama instanciada (lâminas em cone aberto), com balanço de vento
export function grama(scene, { n = 1600, area = [-30, 30, -40, 10], seed = 3, cor = 0x6b7d3a, alt = [0.4, 1.0], h: hf = null } = {}) {
  const geo = new THREE.ConeGeometry(0.03, 1, 3, 1, true); geo.translate(0, 0.5, 0);
  const im = new THREE.InstancedMesh(geo, M(cor, 0.9, { side: THREE.DoubleSide }), n);
  im.receiveShadow = true;
  const r = mulberry32(seed), d = [];
  for (let i = 0; i < n; i++) d.push([lerp(area[0], area[1], r()), lerp(area[2], area[3], r()), lerp(alt[0], alt[1], r()), r() * 6.28, r() * 6.28]);
  const o = new THREE.Object3D(), c = new THREE.Color(), base = new THREE.Color(cor);
  d.forEach((q, i) => { c.copy(base).multiplyScalar(0.7 + 0.5 * ((q[3] * 7) % 1)); im.setColorAt(i, c); });
  scene.add(im);
  function update(t, vento = 1) {
    d.forEach(([x, z, h, ry, ph], i) => { o.position.set(x, hf ? hf(x, z) - 0.05 : 0, z); o.rotation.set(Math.sin(t * 1.6 + ph + x * 0.2) * 0.12 * vento, ry, 0.15 * Math.sin(ph)); o.scale.set(1, h, 1); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { im, update };
}
export function acacia(s = 1, seed = 1, cor = 0x3b4a26) {
  const g = new THREE.Group(), r = mulberry32(seed);
  const tr = mesh(_cil, 0x4a3a2a, g); tr.scale.set(0.18 * s, 3.2 * s, 0.18 * s); tr.rotation.z = (r() - 0.5) * 0.3;
  for (let i = 0; i < 2; i++) { const b = mesh(_cil, 0x4a3a2a, g); b.scale.set(0.1 * s, 1.6 * s, 0.1 * s); b.position.y = 2.6 * s; b.rotation.z = (i ? 0.7 : -0.7); }
  for (let i = 0; i < 5; i++) { const c = mesh(SPH, cor, g, 0.9); c.scale.set((1.6 + r()) * s, 0.35 * s, (1.4 + r()) * s); c.position.set((r() - 0.5) * 2.4 * s, (3.6 + r() * 0.4) * s, (r() - 0.5) * 1.6 * s); }
  return g;
}
// besouro rola-bosta (olha para +x; pernas traseiras para trás, empurrando de costas)
export function besouro() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const preto = M(0x17140f, 0.28, { metalness: 0.35 }), perna = M(0x221d16, 0.5);
  const tor = mesh(SPH, preto, body); tor.scale.set(0.55, 0.32, 0.42); tor.position.set(-0.1, 0.42, 0);
  const pro = mesh(SPH, preto, body); pro.scale.set(0.26, 0.26, 0.36); pro.position.set(0.38, 0.4, 0);
  const cab = mesh(SPH, preto, body); cab.scale.set(0.2, 0.1, 0.32); cab.position.set(0.62, 0.32, 0);
  const linha = mesh(_cil, M(0x0a0806, 0.4), body); linha.scale.set(0.01, 1.05, 0.01); linha.rotation.z = Math.PI / 2; linha.position.set(0.42, 0.72, 0);
  const legs = [];
  const P = [[0.45, 0.32, 0.9, 1.0, -0.3], [0.05, 0.3, 0.75, -0.2, 0], [-0.35, 0.28, 0.9, -0.9, 0.4]];
  for (const [x, z, len, rz, ry] of P) for (const s of [1, -1]) {
    const piv = new THREE.Group(); piv.position.set(x, 0.35, s * z); body.add(piv);
    const a = mesh(_cil, perna, piv); a.scale.set(0.035, len * 0.5, 0.035); a.rotation.x = s * 1.1;
    const j = new THREE.Group(); j.position.set(0, Math.cos(1.1) * len * 0.5, s * Math.sin(1.1) * len * 0.5); piv.add(j);
    const b = mesh(_cil, perna, j); b.scale.set(0.028, len * 0.62, 0.028); b.rotation.x = s * 2.6;
    piv.rotation.z = rz; piv.rotation.y = s * ry; piv.userData = { rz, s };
    legs.push(piv);
  }
  function update(t, passo = 2) {
    legs.forEach((L, i) => { const ph = t * passo * 6.283 + (i % 2 ? Math.PI : 0) + Math.floor(i / 2) * 2.1; L.rotation.z = L.userData.rz + Math.sin(ph) * 0.35; L.rotation.x = Math.max(0, Math.cos(ph)) * 0.2 * L.userData.s; });
    body.position.y = Math.abs(Math.sin(t * passo * 6.283)) * 0.02;
  }
  update(0);
  return { group: g, body, update };
}
// corais: ramificado, cérebro e mesa (esferas leves: o render é WebGL por software)
export const SPH_L = new THREE.SphereGeometry(1, 10, 7);
export function coralRamo(seed = 1, cor = 0xd08a6a) {
  const g = new THREE.Group(), r = mulberry32(seed);
  const add = (p, x, y, z, rz, rx, len, rad, k) => {
    const piv = new THREE.Group(); piv.position.set(x, y, z); piv.rotation.set(rx, 0, rz); p.add(piv);
    const c = mesh(_cil, cor, piv, 0.85); c.scale.set(rad, len, rad);
    const tip = mesh(SPH_L, cor, piv, 0.8); tip.scale.setScalar(rad * 1.25); tip.position.y = len;
    if (k > 0) for (let i = 0; i < 2 + (r() < 0.5 ? 1 : 0); i++) add(piv, 0, len * (0.55 + r() * 0.4), 0, (r() - 0.5) * 1.4, (r() - 0.5) * 1.4, len * 0.7, rad * 0.75, k - 1);
  };
  for (let i = 0; i < 3; i++) add(g, (r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4, (r() - 0.5) * 0.8, (r() - 0.5) * 0.8, 0.9, 0.12, 1 + (i === 0 ? 1 : 0));
  return g;
}
const _cer = (() => { const geo = new THREE.SphereGeometry(1, 40, 24, 0, 6.283, 0, Math.PI / 2); const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + 0.045 * Math.sin(v.x * 22 + Math.sin(v.z * 18) * 2) ; p.setXYZ(i, v.x * k, v.y * k, v.z * k); } geo.computeVertexNormals(); return geo; })();
export function coralCerebro(cor = 0xb9a46a) { const g = new THREE.Group(); const m = mesh(_cer, cor, g, 0.9); m.scale.set(1, 0.7, 1); return g; }
export function coralMesa(seed = 1, cor = 0x8fa38a) {
  const g = new THREE.Group(), r = mulberry32(seed);
  const pe = mesh(_cil, cor, g, 0.85); pe.scale.set(0.12, 0.7, 0.12);
  const t = mesh(SPH_L, cor, g, 0.85); t.scale.set(1.2 + r() * 0.4, 0.09, 1.1 + r() * 0.4); t.position.y = 0.75;
  return g;
}

// terreno: plano subdividido deslocado por h(x, z)
export function terreno(scene, h, { w = 400, d = 400, seg = 90, cor = 0x2f4a2a, rough = 0.95, cx = 0, cz = 0 } = {}) {
  const geo = new THREE.PlaneGeometry(w, d, seg, seg); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + cx, z = p.getZ(i) + cz; p.setXYZ(i, x, h(x, z), z); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, M(cor, rough)); m.receiveShadow = true; scene.add(m);
  return m;
}
