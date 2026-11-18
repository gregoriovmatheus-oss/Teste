/**
 * terra.js: espaço realista no padrão "documentário" (Terra NASA Blue Marble, estrelas, Via Láctea, Lua, Sol).
 * Texturas: assets/img/terra-*.jpg (NASA Visible Earth, domínio público, via three-globe MIT).
 *
 *   const E = await createTerra({ raio: 1 });      // ASSÍNCRONO (carrega texturas): use await no corpo da cena
 *   S.add(E.group);
 *   E.aim(lon, lat)            gira a Terra para que (lon, lat) fique de frente para +z (câmera em +z olhando a origem)
 *   E.sol.set(x, y, z)         direção DE ONDE vem a luz do Sol (mundo; normalizada sozinha). Ex.: (1, 0.2, 0.6)
 *   E.u.luzSol.value = 0..1    1 = dia normal, 0 = Sol apagado (lado dia escurece, só luzes das cidades)
 *   E.u.luzes.value = 0..1.5   brilho das luzes noturnas das cidades (lado escuro)
 *   E.u.seco.value = 0..1      0 = oceano normal, 1 = oceano drenado: fundo marinho exposto (relevo vindo da batimetria)
 *   E.u.nuvens.value = 0..1    opacidade das nuvens.   E.nuv.rotation.y += ... para mover as nuvens
 *   E.u.atmo.value = 0..1.5    brilho da borda da atmosfera
 *
 *   const C = createCeu({ seed: 7, n: 5000, via: 0.5 }); S.add(C);   // estrelas + Via Láctea (esfera r=900, BackSide)
 *   const L = await createLua({ raio: 0.27 }); S.add(L.group); L.sol.set(...); L.u.luz.value = 0..1
 *   const SOL = createSol({ raio: 6, halo: 40 }); S.add(SOL.group); SOL.u.brilho.value = 0..1 (0 = apagado)
 *
 * Escala sugerida: raio da Terra 1; Lua 0.273 a ~60 (real) ou ~8–12 (cinematográfico, diga "fora de escala" num rótulo).
 * Use st.bloom (toy.js) 0.6–0.9 nessas cenas. Fundo: createToyStage(canvas, { ceu: ["#000000", "#02030a"] }) e
 * desligue/abaixe as luzes do palco (st.hemi.intensity = 0.05 etc.): Terra, Lua e Sol têm shader próprio (ignoram luzes).
 * Tudo determinístico (sem Math.random). Os shaders escrevem sRGB direto (sem tone mapping), igual à foto.
 */
import * as THREE from "../three.module.js";
import { mulberry32 } from "../kit.js";

const D2R = Math.PI / 180;
const _tl = new THREE.TextureLoader();
const _cache = new Map();
function tex(nome) {
  if (!_cache.has(nome)) _cache.set(nome, new Promise((ok, err) => _tl.load(`./assets/img/${nome}`, (t) => {
    t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; t.wrapS = THREE.RepeatWrapping; ok(t);
  }, undefined, err)));
  return _cache.get(nome);
}

const VERT = `
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w; }`;

const FRAG_TERRA = `
uniform sampler2D dia, noite, agua, relevo; uniform vec3 sol; uniform float luzSol, luzes, seco, atmo;
varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){
  vec3 N = normalize(vN); vec3 L = normalize(sol); vec3 V = normalize(cameraPosition - vW);
  float nl = dot(N, L);
  float lam = smoothstep(-0.12, 0.35, nl) * luzSol;
  vec3 d = texture2D(dia, vUv).rgb;
  float w = texture2D(agua, vUv).r;            // 1 = água
  // oceano drenado: profundidade pelo azul da batimetria (plataformas claras, abismo escuro) + sombreamento de relevo
  vec2 e = vec2(1.0 / 4096.0, 1.0 / 2048.0) * 2.0;
  float b0 = texture2D(dia, vUv).b, bx = texture2D(dia, vUv + vec2(e.x, 0.0)).b, by = texture2D(dia, vUv + vec2(0.0, e.y)).b;
  float raso = smoothstep(0.16, 0.42, b0);
  vec3 fundo = mix(vec3(0.17, 0.13, 0.11), vec3(0.66, 0.56, 0.43), raso);
  fundo *= 1.0 + clamp(((b0 - bx) + (b0 - by)) * 9.0, -0.45, 0.45);
  fundo = mix(fundo, fundo * vec3(1.08, 0.98, 0.9), fract(sin(dot(floor(vUv * 1400.0), vec2(12.9898, 78.233))) * 43758.5453) * 0.25);
  vec3 base = mix(d, fundo, w * seco);
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 40.0) * w * (1.0 - seco) * 0.55 * luzSol;
  vec3 col = base * (0.03 + lam * 1.05) + spec * vec3(1.0, 0.92, 0.78) * step(0.0, nl);
  // luzes das cidades no lado escuro
  float esc = 1.0 - smoothstep(-0.05, 0.25, nl * luzSol + (1.0 - luzSol) * -1.0);
  vec3 nt = texture2D(noite, vUv).rgb; float nlum = max(max(nt.r, nt.g) - 0.2, 0.0) * 2.4; nt = vec3(nlum);
  col += nt * vec3(1.0, 0.78, 0.45) * esc * luzes;
  // véu de atmosfera na borda (lado iluminado mais azul, terminador alaranjado)
  float fr = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  vec3 ac = mix(vec3(0.30, 0.55, 1.0), vec3(1.0, 0.55, 0.3), smoothstep(0.35, -0.05, nl) * smoothstep(-0.25, 0.0, nl));
  col += ac * fr * atmo * (0.08 + 0.9 * smoothstep(-0.25, 0.4, nl) * luzSol);
  gl_FragColor = vec4(col, 1.0);
}`;

const FRAG_NUV = `
uniform sampler2D nuv; uniform vec3 sol; uniform float luzSol, nuvens; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){ vec3 N = normalize(vN); float nl = dot(N, normalize(sol));
  float a = texture2D(nuv, vUv).r; a = smoothstep(0.08, 0.85, a) * nuvens;
  float lam = smoothstep(-0.1, 0.4, nl) * luzSol; vec3 c = vec3(1.0, 0.98, 0.95) * (0.02 + lam);
  c = mix(c, c * vec3(1.0, 0.7, 0.5), smoothstep(0.3, 0.0, nl) * smoothstep(-0.2, 0.05, nl));
  gl_FragColor = vec4(c, a * (0.25 + 0.75 * max(lam, 0.05))); }`;

const FRAG_ATMO = `
uniform vec3 sol; uniform float luzSol, atmo; varying vec3 vN; varying vec3 vW;
void main(){ vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vW);
  float r = 1.0 - abs(dot(N, V)); float g = pow(r, 3.0) * 1.3 + pow(r, 10.0) * 1.6;
  float nl = dot(N, normalize(sol));
  float lit = smoothstep(-0.35, 0.35, nl) * luzSol;
  vec3 c = mix(vec3(0.28, 0.55, 1.0), vec3(1.0, 0.6, 0.35), exp(-nl * nl * 30.0) * 0.8);
  gl_FragColor = vec4(c * g * atmo * (0.004 + lit), 1.0); }`;

export async function createTerra({ raio = 1, seg = 96 } = {}) {
  const [dia, noite, agua, relevo, nuv] = await Promise.all(["terra-dia.jpg", "terra-noite.jpg", "terra-agua.jpg", "terra-relevo.jpg", "terra-nuvens.jpg"].map(tex));
  const sol = new THREE.Vector3(1, 0.25, 0.7);
  const u = { dia: { value: dia }, noite: { value: noite }, agua: { value: agua }, relevo: { value: relevo }, nuv: { value: nuv },
    sol: { value: sol }, luzSol: { value: 1 }, luzes: { value: 0.9 }, seco: { value: 0 }, atmo: { value: 1 }, nuvens: { value: 0.9 } };
  const group = new THREE.Group();
  const earth = new THREE.Group(); earth.rotation.order = "XYZ"; group.add(earth);
  const geo = new THREE.SphereGeometry(raio, seg, seg / 2);
  const terra = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG_TERRA }));
  earth.add(terra);
  const nuvM = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.008, seg, seg / 2),
    new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG_NUV, transparent: true, depthWrite: false }));
  earth.add(nuvM);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.045, 64, 32),
    new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG_ATMO, side: THREE.BackSide, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(atm);
  // aim: (lon, lat) de frente para +z. Equiretangular do three: lon 0 em +x antes de girar.
  const aim = (lon, lat) => { earth.rotation.y = -(lon + 90) * D2R; earth.rotation.x = lat * D2R; };
  // ponto (lon, lat) em coordenadas locais de `earth` (para pôr marcadores como filhos de E.earth)
  const ponto = (lon, lat, r = raio) => new THREE.Vector3(r * Math.cos(lat * D2R) * Math.cos(lon * D2R), r * Math.sin(lat * D2R), -r * Math.cos(lat * D2R) * Math.sin(lon * D2R));
  return { group, earth, terra, nuv: nuvM, atm, u, sol, aim, ponto, raio };
}

/* ---------- céu: estrelas + Via Láctea ---------- */
function noise2(seed) {
  const r = mulberry32(seed), P = new Float32Array(256 * 256); for (let i = 0; i < P.length; i++) P[i] = r();
  const g = (x, y) => P[((y & 255) << 8) | (x & 255)];
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
    const a = g(xi, yi) + (g(xi + 1, yi) - g(xi, yi)) * sx, b = g(xi, yi + 1) + (g(xi + 1, yi + 1) - g(xi, yi + 1)) * sx; return a + (b - a) * sy; };
}
export function createCeu({ seed = 7, n = 5000, via = 0.55, raio = 900 } = {}) {
  const g = new THREE.Group();
  // Via Láctea: faixa com fbm, gerada uma vez (1024x512)
  const W = 1024, H = 512, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const cx = cv.getContext("2d"), img = cx.createImageData(W, H), nz = noise2(seed);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = (y / H - 0.5) * 2 + Math.sin(x / W * Math.PI * 2) * 0.35;           // faixa inclinada/ondulada
    let f = 0, a = 0.5, fr = 6; for (let o = 0; o < 5; o++) { f += a * nz(x / W * fr * 4, y / H * fr * 2); a *= 0.5; fr *= 2; }
    const band = Math.exp(-v * v * 9) * via, dust = Math.max(0, f - 0.45) * 2.2;
    const lum = band * (0.25 + f * 0.9) * (1 - Math.min(1, dust * band * 1.4) * 0.6);
    const i = (y * W + x) * 4; const q = Math.pow(Math.max(0, lum), 1.6); img.data[i] = Math.min(255, q * 40); img.data[i + 1] = Math.min(255, q * 37); img.data[i + 2] = Math.min(255, q * 48); img.data[i + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace;
  const bg = new THREE.Mesh(new THREE.SphereGeometry(raio, 48, 24), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, depthWrite: false, toneMapped: false }));
  bg.rotation.set(0.5, 0.2, 0.9); g.add(bg);
  // estrelas
  const r = mulberry32(seed + 1), pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), R = raio * 0.95;
    pos.set([R * s * Math.cos(th), R * u, R * s * Math.sin(th)], i * 3);
    const k = r(), c = k < 0.15 ? [1, 0.82, 0.62] : k < 0.35 ? [0.75, 0.85, 1] : [1, 1, 1];
    const b = 0.35 + Math.pow(r(), 3) * 0.65; col.set(c.map((x) => x * b), i * 3);
    sz[i] = 1.2 + Math.pow(r(), 6) * 4.5;
  }
  const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  gg.setAttribute("color", new THREE.BufferAttribute(col, 3)); gg.setAttribute("size", new THREE.BufferAttribute(sz, 1));
  const pm = new THREE.ShaderMaterial({ uniforms: { brilho: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; void main(){ vC = color; gl_PointSize = size; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float brilho; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC * a * brilho, 1.0); }` });
  g.add(new THREE.Points(gg, pm));
  g.userData.brilho = pm.uniforms.brilho;   // C.userData.brilho.value = 0..1
  return g;
}

/* ---------- Lua com crateras ---------- */
export async function createLua({ raio = 0.273, seed = 11 } = {}) {
  const W = 1024, H = 512, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const cx = cv.getContext("2d"), nz = noise2(seed), img = cx.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let f = 0, a = 0.5, fr = 3; for (let o = 0; o < 6; o++) { f += a * nz(x / W * fr * 2, y / H * fr); a *= 0.5; fr *= 2; }
    const mar = Math.max(0, Math.min(1, (nz(x / W * 5 + 40, y / H * 2.5 + 40) - 0.52) * 5));   // "mares" escuros
    const v = (0.62 + (f - 0.5) * 0.35) * (1 - mar * 0.38);
    const i = (y * W + x) * 4; img.data[i] = v * 238; img.data[i + 1] = v * 232; img.data[i + 2] = v * 222; img.data[i + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  const r = mulberry32(seed);
  for (let k = 0; k < 260; k++) {   // crateras: borda clara + fundo escuro
    const x = r() * W, y = H * (0.08 + r() * 0.84), rr = 2 + Math.pow(r(), 3) * 26;
    cx.strokeStyle = "rgba(255,250,240,0.22)"; cx.lineWidth = rr * 0.25; cx.beginPath(); cx.ellipse(x, y, rr, rr, 0, 0, Math.PI * 2); cx.stroke();
    cx.fillStyle = "rgba(40,36,32,0.18)"; cx.beginPath(); cx.ellipse(x + rr * 0.15, y + rr * 0.1, rr * 0.8, rr * 0.8, 0, 0, Math.PI * 2); cx.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace;
  const sol = new THREE.Vector3(1, 0.2, 0.6);
  const u = { mapa: { value: t }, sol: { value: sol }, luz: { value: 1 }, terra: { value: 0.03 } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(raio, 64, 32), new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT,
    fragmentShader: `uniform sampler2D mapa; uniform vec3 sol; uniform float luz, terra; varying vec2 vUv; varying vec3 vN;
      void main(){ float nl = dot(normalize(vN), normalize(sol)); float lam = smoothstep(-0.03, 0.25, nl) * luz;
        vec3 c = texture2D(mapa, vUv).rgb; gl_FragColor = vec4(c * (lam * 1.1 + terra), 1.0); }` }));
  const group = new THREE.Group(); group.add(m);
  // halo suave (luar)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, "rgba(220,230,255,0.35)"], [0.35, "rgba(200,215,255,0.08)"], [1, "rgba(0,0,0,0)"]]),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.setScalar(raio * 7); group.add(halo);
  return { group, mesh: m, halo, u, sol };
}

/* ---------- Sol ---------- */
function radial(stops, n = 256) {
  const c = document.createElement("canvas"); c.width = c.height = n; const x = c.getContext("2d");
  const g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(([o, s]) => g.addColorStop(o, s));
  x.fillStyle = g; x.fillRect(0, 0, n, n); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function createSol({ raio = 6, halo = 40 } = {}) {
  const group = new THREE.Group();
  const u = { brilho: { value: 1 } };
  const core = new THREE.Mesh(new THREE.SphereGeometry(raio, 48, 24), new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT,
    fragmentShader: `uniform float brilho; varying vec3 vN; varying vec3 vW; void main(){ vec3 V = normalize(cameraPosition - vW);
      float mu = max(dot(normalize(vN), V), 0.0); vec3 c = vec3(1.0, 0.93, 0.78) * (0.55 + 0.45 * pow(mu, 0.5));
      vec3 off = vec3(0.05, 0.035, 0.03) * (1.0 - mu); gl_FragColor = vec4(mix(off, c, brilho), 1.0); }` }));
  group.add(core);
  const mk = (stops, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial(stops), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
    sp.scale.setScalar(s); group.add(sp); return sp; };
  const h1 = mk([[0, "rgba(255,240,210,1)"], [0.18, "rgba(255,200,120,0.55)"], [0.5, "rgba(255,140,60,0.12)"], [1, "rgba(0,0,0,0)"]], raio * 6);
  const h2 = mk([[0, "rgba(255,220,170,0.35)"], [0.4, "rgba(255,160,90,0.06)"], [1, "rgba(0,0,0,0)"]], halo);
  const set = (b) => { u.brilho.value = b; h1.material.opacity = b; h2.material.opacity = b; };
  return { group, core, u, set };   // SOL.set(0..1) apaga/acende núcleo e halos juntos
}
