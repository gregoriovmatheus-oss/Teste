/**
 * pausa.js — peças do vídeo "pausar o tempo" (rua na chuva ao entardecer, mundo congelado, diagramas).
 *
 *   const R = PAUSA.ruaChuva(S, st)            // avenida molhada ao entardecer + multidão + pombos + chuva + protagonista
 *   R.update(t, tm, { idade, estalo })        // t = tempo da cena, tm = "tempo do mundo" (congela com PAUSA.tMundo)
 *   PAUSA.tMundo(t, t0, tau)                  // tempo do mundo que desacelera até parar em t0 (+tau)
 *   PAUSA.tVolta(t, t0, tau, congelado)       // tempo do mundo parado até t0 e acelerando de volta
 *   const ch = PAUSA.chuva(S, { n, caixa })   ch.update(tm, k, cam)   k: 0 = risco caindo, 1 = conta de vidro parada
 *   const a = PAUSA.anel(S)                   a.update(t, t0, [x,y,z])  estalo: anel azul de choque + clarão
 *   const p = PAUSA.pessoa({ cor, cor2, cabelo })   humano leve (esfera de baixa resolução) com setIdade(k)
 *   PAUSA.coracao(), PAUSA.ampulheta(), PAUSA.satelite(), PAUSA.olho(), PAUSA.moleculas(S, {...}), PAUSA.pontos(S, n)
 *   PAUSA.proj(v3, cam) -> [x, y] em px;  PAUSA.tag(ctx, ...), PAUSA.texto(ctx, ...)  rótulos 2D (mono, acento azul/laranja)
 * Tudo determinístico (mulberry32 + t). Acento azul #7cc8ff, laranja #ff8a4c = anomalia (você, o tempo que corre).
 */
import * as THREE from "../three.module.js";
import { M, SPH, mesh, PAL, bando } from "./toy.js";
import { mulberry32, clamp, lerp, ease } from "../kit.js";
import { createAnimal } from "./animals.js";
import * as AV from "./avenida.js";

export const AZUL = "#7cc8ff", LARANJA = "#ff8a4c";
const rg = (t, a, b) => clamp((t - a) / (b - a));
export const SPH_L = new THREE.SphereGeometry(1, 14, 10);
const SPH_XL = new THREE.SphereGeometry(1, 10, 7);
// orçamento de triângulos: troca a esfera padrão (24x16) por uma de baixa resolução em tudo abaixo de root
const _caixas = new Map();
export function aliviar(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.geometry === SPH) o.geometry = SPH_XL;
    else if (o.geometry.type === "ExtrudeGeometry" && !o.isInstancedMesh) { // caixas arredondadas grandes (prédios) viram caixas simples
      const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox, sz = b.getSize(new THREE.Vector3());
      if (Math.max(sz.x, sz.y, sz.z) < 4) return;
      if (!_caixas.has(g)) { const c = b.getCenter(new THREE.Vector3()), bx = new THREE.BoxGeometry(sz.x, sz.y, sz.z); bx.translate(c.x, c.y, c.z); _caixas.set(g, bx); }
      o.geometry = _caixas.get(g);
    }
  });
}
const _o = new THREE.Object3D();

/* ---------- tempo do mundo ---------- */
// desacelera de 1x até parar: tm = t até t0, depois t0 + tau·(1 − e^(−(t−t0)/tau))
export function tMundo(t, t0, tau = 0.35) { return t < t0 ? t : t0 + tau * (1 - Math.exp(-(t - t0) / tau)); }
// parado em `congelado` até t0, depois acelera de volta (rampa suave de duração tau)
export function tVolta(t, t0, tau = 0.5, congelado = 0) {
  if (t < t0) return congelado;
  const u = t - t0;
  return congelado + (u < tau ? (u * u) / (2 * tau) : u - tau / 2);
}

/* ---------- brilho (sprite aditivo) ---------- */
export const glowTex = AV.glowTex, glowMat = AV.glowMat;
export function glow(cor, s = 1, parent = null) {
  const g = new THREE.Sprite(glowMat(cor)); g.scale.setScalar(s); g.material.opacity = 1; if (parent) parent.add(g); return g;
}
let _ringT = null;
function ringTex() {
  if (_ringT) return _ringT;
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.72, "rgba(255,255,255,0)"); gr.addColorStop(0.86, "rgba(255,255,255,1)");
  gr.addColorStop(0.9, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  _ringT = new THREE.CanvasTexture(c); _ringT.colorSpace = THREE.SRGBColorSpace; return _ringT;
}

/* ---------- estalo: anel azul de choque (billboard) + anel no chão + clarão ---------- */
export function anel(S, { cor = 0x7cc8ff, raio = 26 } = {}) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex(), color: cor, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0 }));
  const sp2 = new THREE.Sprite(sp.material.clone());
  const chao = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  chao.rotation.x = -Math.PI / 2;
  const flash = glow(0xcfe9ff, 1); flash.material.opacity = 0;
  S.add(sp, sp2, chao, flash);
  function update(t, t0, p = [0, 1.5, 0]) {
    const u = t - t0, on = u > 0 && u < 1.6;
    sp.visible = sp2.visible = chao.visible = flash.visible = on;
    if (!on) return 0;
    const e = ease.outCubic(rg(u, 0, 1.1));
    sp.position.set(...p); sp2.position.set(...p); flash.position.set(...p);
    sp.scale.setScalar(0.5 + e * raio); sp.material.opacity = 1.2 * (1 - rg(u, 0.25, 1.1));
    const e2 = ease.outCubic(rg(u, 0.08, 1.4));
    sp2.scale.setScalar(0.3 + e2 * raio * 0.6); sp2.material.opacity = 0.7 * (1 - rg(u, 0.3, 1.4));
    chao.position.set(p[0], 0.15, p[2]); chao.scale.setScalar(0.5 + e * raio * 1.2); chao.material.opacity = 0.8 * (1 - rg(u, 0.2, 1.2));
    flash.scale.setScalar(1 + 9 * Math.sin(Math.PI * rg(u, 0, 0.35))); flash.material.opacity = Math.sin(Math.PI * rg(u, 0, 0.45));
    return 1 - rg(u, 0, 0.5); // intensidade do clarão (para o véu 2D)
  }
  return { update };
}

/* ---------- chuva: pontos (0 triângulos). Caindo = risco fino; parada = conta de vidro com reflexo ---------- */
export function chuva(S, { n = 6000, seed = 41, caixa = [-12, 12, 0, 16, -30, 48], vel = [9, 13], tam = 1 } = {}) {
  const r = mulberry32(seed);
  const [x0, x1, y0, y1, z0, z1] = caixa;
  const P = new Float32Array(n * 3), A = new Float32Array(n), base = [];
  for (let i = 0; i < n; i++) { base.push([lerp(x0, x1, r()), r() * (y1 - y0), lerp(z0, z1, r()), lerp(vel[0], vel[1], r())]); A[i] = 0.6 + r() * 0.8; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(P, 3)); geo.setAttribute("aS", new THREE.BufferAttribute(A, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uK: { value: 0 }, uA: { value: 1 }, uTam: { value: tam }, uCor: { value: new THREE.Color(0xcfe4ff) } },
    vertexShader: `attribute float aS; uniform float uK, uTam; varying float vS, vD;
      void main(){ vS = aS; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; vD = -mv.z;
        gl_PointSize = clamp(uTam * aS * mix(150.0, 72.0, uK) / max(0.4, -mv.z), 1.5, 220.0); }`,
    fragmentShader: `uniform float uK, uA; uniform vec3 uCor; varying float vS, vD;
      void main(){ vec2 d = gl_PointCoord - 0.5;
        float w = mix(0.035, 0.30, uK), h = mix(0.5, 0.30, uK);
        float e = (d.x * d.x) / (w * w) + (d.y * d.y) / (h * h);
        if (e > 1.0) discard;
        float corpo = mix(0.55, 0.18, uK) * smoothstep(1.0, 0.2, e);
        float aro = uK * smoothstep(0.55, 0.95, e) * smoothstep(1.0, 0.92, e) * 0.9;
        float esp = uK * exp(-dot(d - vec2(-0.08, -0.1), d - vec2(-0.08, -0.1)) * 900.0) * 1.6;
        float a = (corpo + aro + esp) * uA * smoothstep(90.0, 30.0, vD);
        gl_FragColor = vec4(uCor * a, 1.0); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; S.add(pts);
  const H = y1 - y0;
  // tm = tempo do mundo; k = 0 risco, 1 conta parada
  function update(tm, k = 0) {
    for (let i = 0; i < n; i++) {
      const b = base[i]; let y = b[1] - b[3] * tm; y = ((y % H) + H) % H;
      P[i * 3] = b[0]; P[i * 3 + 1] = y0 + y; P[i * 3 + 2] = b[2];
    }
    geo.attributes.position.needsUpdate = true; mat.uniforms.uK.value = k;
  }
  return { pts, mat, update };
}

/* ---------- pessoa leve (humano de animals.js com esferas de baixa resolução) + envelhecer ---------- */
export function pessoa({ cor = 0x2b3a4a, cor2 = 0x2a2c30, cabelo = 0x3a2a20, mulher = false, fase = 0 } = {}) {
  const a = createAnimal("humano", { cor, cor2, cabelo, mulher, fase });
  a.group.traverse((o) => { if (o.isMesh && o.geometry === SPH) o.geometry = SPH_L; });
  const hair = a.head.children.filter((o) => o.isMesh).slice(1, mulher ? 3 : 2);
  const hm = hair[0].material.clone(); hm.userData.c0 = hm.color.clone(); hair.forEach((h) => (h.material = hm));
  const cinza = new THREE.Color(0xc9c6c0);
  // idade 0..1: cabelo grisalho, costas curvadas, cabeça baixa
  a.setIdade = (k) => { hm.color.copy(hm.userData.c0).lerp(cinza, k); hm.roughness = 0.7 + 0.2 * k; a.idade = k; };
  a.idade = 0;
  a.pose = (t, o = {}) => {
    a.update(t, { passo: o.passo ?? 0, cabeca: (o.cabeca ?? 0) - 0.25 * a.idade });
    a.body.rotation.z = -0.13 * a.idade + (o.inclina ?? 0);
    a.body.scale.y *= 1 - 0.035 * a.idade;
    if (o.braco != null) { a.arms[0].rotation.z = o.braco; a.arms[0].rotation.x = o.abre ?? -0.25; }
    if (o.braco2 != null) { a.arms[1].rotation.z = o.braco2; }
    if (o.respira) a.body.scale.x = a.body.scale.z = 1 + 0.03 * o.respira;
  };
  return a;
}

/* ---------- rua na chuva ao entardecer (base de f01, f02, f06, f09, f10, f13) ---------- */
// protagonista no meio da faixa de pedestres (z ≈ 24), de costas para a câmera, olhando −z
export const PROTA = [0.6, 0, 25.5];
export function ruaChuva(S, st, { n = 110, chuvaN = 6000, caixa = [-13, 13, 0, 15, -20, 46], prota = true, pombos = true } = {}) {
  const av = AV.avenida(S);
  // asfalto molhado: reflexo e escuro
  if (av.road) { av.road.color.set(0x2a2c30); av.road.userData.c0 = av.road.color.clone(); av.road.roughness = 0.16; av.road.metalness = 0.35; av.road.envMapIntensity = 1.4; }
  if (av.chao) { av.chao.color.set(0x55524c); av.chao.userData.c0 = av.chao.color.clone(); av.chao.roughness = 0.3; }
  for (const m of av.calcadas) { m.color.set(0x77736c); m.userData.c0 = m.color.clone(); m.roughness = 0.32; m.metalness = 0.15; }
  const povo = AV.gente(S, { n, seed: 51, zona: [-45, 40], rua: 0.12 });
  const faixa = AV.gente(S, { n: 18, seed: 52, zona: [17, 20], rua: 1 });
  faixa.P.forEach((p, i) => { p.dx = i % 2 ? 1 : -1; p.dz = 0; p.x0 = p.x0 * 0.9 - p.dx * 3; });
  // corredor livre para a câmera (x de -3 a 4, z > 14): quem estava ali vai para a calçada
  povo.P.forEach((p) => { if (p.x0 > -3 && p.x0 < 4 && p.z0 > 14) { p.x0 = p.x0 < 0.5 ? -10 - (p.ph % 1.5) : 10 + (p.ph % 1.5); p.dx = 0; p.dz = p.ph > 3 ? 1 : -1; } });
  const aves = pombos ? bando(S, { n: 16, seed: 53, cor: 0x4a4d52 }) : null;
  const ch = chuva(S, { n: chuvaN, caixa });
  const ch2 = chuva(S, { n: 2600, seed: 42, caixa: [-4, 5, 0, 4.5, 6, 38] }); // camada densa no caminho da câmera
  av.carrosAndando(100, 0); // trânsito parado no sinal vermelho, faróis acesos
  av.carros.forEach((c) => { if (c.userData.estac || c.position.z < -25) c.visible = false; });
  // poças (discos espelhados) no asfalto
  const poca = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.04, metalness: 0.9, envMapIntensity: 1.8 });
  const rp = mulberry32(54);
  for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 20), poca); m.rotation.x = -Math.PI / 2; m.scale.set(1 + rp() * 2.2, 0.7 + rp() * 1.4, 1); m.position.set((rp() - 0.5) * 15, 0.135, -10 + rp() * 50); S.add(m); }
  // guarda-chuvas em parte da multidão (cúpulas instanciadas presas a cada pessoa)
  const UMB = new THREE.SphereGeometry(1, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2);
  const nU = Math.floor(n * 0.35) + 6;
  const umb = new THREE.InstancedMesh(UMB, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, side: THREE.DoubleSide }), nU); S.add(umb);
  const UC = [0x1d2230, 0x6d2430, 0x23394f, 0x2f2f2f, 0x8a6d2a, 0x3c5a48];
  for (let i = 0; i < nU; i++) umb.setColorAt(i, new THREE.Color(UC[i % UC.length]));
  let p = null;
  if (prota) {
    p = pessoa({ cor: 0x3a2a22, cor2: 0x1e2228, cabelo: 0x2b1d16, fase: 0.2 });
    // casaco com faixa laranja (a "anomalia" que ainda se move)
    const jaq = mesh(SPH_L, M(0xff8a4c, 0.5, { emissive: 0xff6a2c, emissiveIntensity: 0.25 }), p.body); jaq.scale.set(0.205, 0.05, 0.275); jaq.position.set(0, 1.32, 0);
    p.group.position.set(...PROTA); p.group.rotation.y = Math.PI / 2; S.add(p.group);
  }
  aliviar(S);
  st.key.castShadow = false; // céu encoberto de chuva: luz difusa, sem sombra dura (e metade dos triângulos)
  st.sol(0, 10, 60);
  st.key.color.set(0xffb98a); st.key.intensity = 1.2; st.hemi.color.set(0x8aa2c8); st.hemi.groundColor.set(0x2a2622); st.hemi.intensity = 0.7;
  st.rim.color.set(0x9fc6ff); st.rim.intensity = 0.9;
  const R = { av, povo, faixa, aves, ch, ch2, p, umb };
  // t: tempo da cena; tm: tempo do mundo; k: 0 chuva caindo, 1 contas paradas
  R.update = (t, tm, { k = 0, gente = true } = {}) => {
    av.set({ farois: 0.9, sinal: 1, janelas: 0.85, luzRua: 1, sujeira: 0.15 }, tm);
    povo.update(tm, { anda: true }); faixa.update(tm, { anda: true });
    // guarda-chuvas sobre as primeiras pessoas da multidão
    for (let i = 0; i < nU; i++) {
      const q = i < 6 ? faixa.P[i * 3 % faixa.P.length] : povo.P[((i - 6) * 2) % povo.P.length];
      const x = q.x0 + q.dx * q.v * tm, z = q.z0 + q.dz * q.v * tm;
      _o.position.set(x, 2.25 * q.h, z); _o.rotation.set(0.12, q.ph, 0); _o.scale.set(0.95, 0.42, 0.95); _o.updateMatrix(); umb.setMatrixAt(i, _o.matrix);
    }
    umb.instanceMatrix.needsUpdate = true; if (umb.instanceColor) umb.instanceColor.needsUpdate = true;
    if (aves) aves.update(tm, [-6 + tm * 4, 15 + tm * 0.6, -14 - tm * 2], [7, 2, 5], -0.5, 0.38);
    ch.update(tm, k); ch2.update(tm, k);
  };
  return R;
}

/* ---------- coração (anatômico estilizado, PBR úmido) ---------- */
export function coracao() {
  const g = new THREE.Group(), batida = new THREE.Group(); g.add(batida);
  const mus = new THREE.MeshStandardMaterial({ color: 0x8e1b22, roughness: 0.32, metalness: 0.05, emissive: 0x3a0508, emissiveIntensity: 0.4 });
  const gord = new THREE.MeshStandardMaterial({ color: 0xd8b26a, roughness: 0.45 });
  const vaso = new THREE.MeshStandardMaterial({ color: 0xb2343a, roughness: 0.35 });
  const azul = new THREE.MeshStandardMaterial({ color: 0x3c4f8e, roughness: 0.38 });
  const b = (m, s, p, r = [0, 0, 0]) => { const x = new THREE.Mesh(SPH_L, m); x.scale.set(...s); x.position.set(...p); x.rotation.set(...r); batida.add(x); return x; };
  b(mus, [0.95, 1.15, 0.85], [0.12, -0.15, 0], [0, 0, 0.35]);   // ventrículo esquerdo
  b(mus, [0.85, 1.0, 0.8], [-0.35, -0.05, 0.12], [0, 0, -0.2]); // ventrículo direito
  b(mus, [0.55, 0.45, 0.5], [0.45, 0.8, -0.1]);                 // átrio esquerdo
  b(mus, [0.5, 0.45, 0.5], [-0.55, 0.75, 0.05]);                // átrio direito
  b(mus, [0.3, 0.3, 0.3], [0.15, -1.15, 0.05], [0, 0, 0.3]);    // ponta
  b(gord, [0.4, 0.12, 0.5], [-0.05, 0.42, 0.55], [0.3, 0, 0.2]);
  const tubo = (pts, r, m) => { const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))); const x = new THREE.Mesh(new THREE.TubeGeometry(c, 24, r, 10), m); batida.add(x); return x; };
  tubo([[0.05, 0.6, 0], [0.1, 1.5, 0], [0.5, 1.9, 0], [0.95, 1.6, -0.1], [1.0, 0.9, -0.3]], 0.22, vaso); // arco da aorta
  tubo([[-0.25, 0.7, 0.2], [-0.35, 1.45, 0.25], [-0.75, 1.7, 0.1]], 0.2, azul);                         // tronco pulmonar
  tubo([[-0.75, 0.8, 0], [-0.8, 1.8, -0.1]], 0.17, azul);                                                // veia cava
  for (const [x, z] of [[0.3, -0.05], [0.55, 0.05], [0.8, -0.1]]) tubo([[x, 1.8, z], [x + 0.05, 2.3, z]], 0.06, vaso);
  // coronárias
  tubo([[0.3, 0.6, 0.62], [0.05, 0.1, 0.83], [-0.05, -0.6, 0.72], [0.0, -1.1, 0.35]], 0.04, vaso);
  tubo([[0.6, 0.5, 0.45], [0.9, -0.1, 0.4], [0.75, -0.8, 0.3]], 0.035, vaso);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // batida dupla ("tum-tum") a f batidas/s
  g.bate = (t, f = 1.16) => {
    const ph = (t * f) % 1;
    const p = Math.exp(-((ph - 0.08) ** 2) / 0.002) + 0.6 * Math.exp(-((ph - 0.28) ** 2) / 0.003);
    batida.scale.set(1 + 0.06 * p, 1 - 0.05 * p + 0.0, 1 + 0.06 * p);
    mus.emissiveIntensity = 0.4 + 0.5 * p;
    return p;
  };
  return g;
}

/* ---------- ampulheta (vidro, moldura de madeira, areia escorrendo) ---------- */
export function ampulheta({ seed = 61 } = {}) {
  const g = new THREE.Group();
  const prof = [];
  for (let i = 0; i <= 24; i++) { const y = -1 + (i / 24) * 2; const r = 0.08 + 0.72 * Math.pow(Math.abs(y), 0.75) * (1 - 0.15 * Math.abs(y) ** 6); prof.push(new THREE.Vector2(r, y)); }
  const vidro = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), new THREE.MeshStandardMaterial({ color: 0xd8ecff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false }));
  vidro.renderOrder = 2; g.add(vidro);
  const mad = M(0x4a2c1a, 0.5);
  for (const y of [1.08, -1.08]) { const d = mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 32), mad, g); d.position.y = y; }
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const c = mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.1, 10), mad, g); c.position.set(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85); }
  const areiaM = new THREE.MeshStandardMaterial({ color: 0xffb070, roughness: 0.8, emissive: 0xff7a30, emissiveIntensity: 0.25 });
  const coneG = new THREE.ConeGeometry(1, 1, 32, 1, false); // ponta para +y
  const topo = new THREE.Mesh(coneG, areiaM); topo.rotation.x = Math.PI; g.add(topo);
  const fundo = new THREE.Mesh(coneG, areiaM); g.add(fundo);
  const fio = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 8), new THREE.MeshBasicMaterial({ color: 0xffc27a })); g.add(fio);
  // grãos caindo (pontos)
  const r = mulberry32(seed), N = 160, PG = new Float32Array(N * 3), base = Array.from({ length: N }, () => [r(), (r() - 0.5) * 0.03, (r() - 0.5) * 0.03]);
  const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(PG, 3));
  const grao = new THREE.Points(gg, new THREE.PointsMaterial({ color: 0xffc890, size: 0.035, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); g.add(grao);
  const brilho = glow(0xff9a50, 1.4, g); brilho.position.y = -0.85; brilho.material.opacity = 0.5;
  // k = fração já escorrida (0..1); t = tempo para animar os grãos
  g.set = (k, t, fluxo = 1) => {
    const ht = 0.85 * Math.sqrt(1 - k) + 0.001, hb = 0.8 * Math.sqrt(k) + 0.001;
    topo.scale.set(0.72 * Math.sqrt(1 - k) + 0.01, ht, 0.72 * Math.sqrt(1 - k) + 0.01); topo.position.y = 0.06 + ht / 2;
    fundo.scale.set(0.74 * Math.pow(k, 0.4) + 0.01, hb, 0.74 * Math.pow(k, 0.4) + 0.01); fundo.position.y = -1.0 + hb / 2;
    const yTop = 0.06, yBot = -1.0 + hb; fio.visible = fluxo > 0.05 && k < 0.999; fio.scale.y = Math.max(0.001, yTop - yBot); fio.position.y = (yTop + yBot) / 2;
    base.forEach((b, i) => { const ph = (b[0] + t * 1.4) % 1; PG[i * 3] = b[1] * (1 + ph * 3); PG[i * 3 + 1] = lerp(yTop, yBot, ph); PG[i * 3 + 2] = b[2] * (1 + ph * 3); });
    gg.attributes.position.needsUpdate = true; grao.visible = fio.visible;
  };
  g.set(0.3, 0);
  return g;
}

/* ---------- satélite GPS (corpo dourado, painéis solares, antenas) ---------- */
export function satelite() {
  const g = new THREE.Group();
  const ouro = new THREE.MeshStandardMaterial({ color: 0xd2a446, roughness: 0.28, metalness: 0.95, envMapIntensity: 1.5 });
  const corpo = mesh(new THREE.BoxGeometry(1, 1.2, 1), ouro, g);
  const c = document.createElement("canvas"); c.width = 128; c.height = 256; const x = c.getContext("2d");
  x.fillStyle = "#0d1a3a"; x.fillRect(0, 0, 128, 256); x.strokeStyle = "#6f8fc8"; x.lineWidth = 2;
  for (let i = 0; i <= 128; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); }
  for (let j = 0; j <= 256; j += 16) { x.beginPath(); x.moveTo(0, j); x.lineTo(128, j); x.stroke(); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.2, metalness: 0.6, envMapIntensity: 1.6 });
  for (const s of [1, -1]) {
    const braco = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), M(0xaaaaaa, 0.3, { metalness: 0.9 }), g); braco.rotation.z = Math.PI / 2; braco.position.x = s * 0.95;
    const p = mesh(new THREE.BoxGeometry(2.6, 0.04, 1.2), pm, g); p.position.x = s * 2.7;
  }
  const disco = mesh(new THREE.SphereGeometry(0.45, 20, 8, 0, Math.PI * 2, 0, 1.0), M(0xe8e8e8, 0.3, { side: THREE.DoubleSide }), g); disco.rotation.x = Math.PI; disco.position.y = -0.95;
  for (let i = 0; i < 4; i++) { const h = mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.35, 8), M(0xdedede, 0.4), g); h.position.set((i % 2 - 0.5) * 0.5, -0.75, (Math.floor(i / 2) - 0.5) * 0.5); }
  const luz = glow(0x7cc8ff, 0.8, g); luz.position.set(0, 0.7, 0.55); g.luz = luz;
  return g;
}

/* ---------- olho (diagrama da luz) ---------- */
export function olho() {
  const g = new THREE.Group();
  const escl = mesh(new THREE.SphereGeometry(1, 40, 28), M(0xeee8e0, 0.35), g);
  const iris = mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, 0.5), new THREE.MeshStandardMaterial({ color: 0x3a6f9a, roughness: 0.3, emissive: 0x0c2236, emissiveIntensity: 0.6 }), g);
  iris.rotation.x = Math.PI / 2; iris.scale.setScalar(1.005);
  const pup = mesh(new THREE.SphereGeometry(1, 30, 12, 0, Math.PI * 2, 0, 0.22), M(0x050505, 0.1), g); pup.rotation.x = Math.PI / 2; pup.scale.setScalar(1.01);
  const cor = new THREE.Mesh(new THREE.SphereGeometry(0.62, 30, 16, 0, Math.PI * 2, 0, 1.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.02, transparent: true, opacity: 0.18, envMapIntensity: 2.5 }));
  cor.rotation.x = Math.PI / 2; cor.position.z = 0.48; g.add(cor);
  g.pupila = pup; g.iris = iris; // olha para +z
  return g;
}

/* ---------- moléculas de ar (N₂/O₂: pares de esferas) com rastro de velocidade ---------- */
export function moleculas(S, { n = 160, seed = 71, caixa = [-8, 8, -6, 10, -14, 6], cores = [0x9fb6cf, 0x7cc8ff], o2 = 0.22, vel = [5, 9] } = {}) {
  const r = mulberry32(seed), [x0, x1, y0, y1, z0, z1] = caixa;
  const geo = new THREE.IcosahedronGeometry(0.26, 1);
  const at = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1, envMapIntensity: 1.2 }), n * 2);
  at.instanceMatrix.setUsage(THREE.DynamicDrawUsage); at.frustumCulled = false; S.add(at);
  const P = [];
  for (let i = 0; i < n; i++) {
    const d = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
    P.push({ p: new THREE.Vector3(lerp(x0, x1, r()), lerp(y0, y1, r()), lerp(z0, z1, r())), v: d.multiplyScalar(lerp(vel[0], vel[1], r())),
      ax: new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize(), w: 3 + r() * 6, a0: r() * 6.28, b: r() < o2 });
    const c = new THREE.Color(P[i].b ? cores[1] : cores[0]); at.setColorAt(i * 2, c); at.setColorAt(i * 2 + 1, c);
  }
  const LP = new Float32Array(n * 6), lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.BufferAttribute(LP, 3));
  const lm = new THREE.LineBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const linhas = new THREE.LineSegments(lg, lm); linhas.frustumCulled = false; S.add(linhas);
  const wrap = (x, a, b) => { const w = b - a; return a + ((((x - a) % w) + w) % w); };
  const q = new THREE.Quaternion(), off = new THREE.Vector3(), pos = new THREE.Vector3(), m4 = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1);
  // te = tempo efetivo (para no congelamento); vk = 0..1 velocidade atual (para o rastro)
  function update(te, vk = 1) {
    P.forEach((m, i) => {
      pos.copy(m.p).addScaledVector(m.v, te);
      pos.set(wrap(pos.x, x0, x1), wrap(pos.y, y0, y1), wrap(pos.z, z0, z1));
      m.pos = m.pos || new THREE.Vector3(); m.pos.copy(pos);
      q.setFromAxisAngle(m.ax, m.a0 + te * m.w);
      for (const s of [1, -1]) { off.set(0, 0.2 * s, 0).applyQuaternion(q).add(pos); m4.compose(off, q, one); at.setMatrixAt(i * 2 + (s > 0 ? 0 : 1), m4); }
      LP.set([pos.x, pos.y, pos.z, pos.x - m.v.x * 0.09 * vk, pos.y - m.v.y * 0.09 * vk, pos.z - m.v.z * 0.09 * vk], i * 6);
    });
    at.instanceMatrix.needsUpdate = true; lg.attributes.position.needsUpdate = true; lm.opacity = 0.55 * vk; linhas.visible = vk > 0.02;
  }
  return { at, P, update, linhas };
}

/* ---------- nuvem de pontos genérica com cor/tamanho/alpha por ponto (shader com disco suave) ---------- */
export function pontos(S, N, { tam = 1, atenua = 300, aditivo = true, forma = 0 } = {}) {
  const P = new Float32Array(N * 3), C = new Float32Array(N * 3).fill(1), Z = new Float32Array(N).fill(1), A = new Float32Array(N).fill(1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(P, 3)); geo.setAttribute("aC", new THREE.BufferAttribute(C, 3));
  geo.setAttribute("aZ", new THREE.BufferAttribute(Z, 1)); geo.setAttribute("aA", new THREE.BufferAttribute(A, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uT: { value: tam }, uAt: { value: atenua }, uF: { value: forma } },
    vertexShader: `attribute vec3 aC; attribute float aZ, aA; uniform float uT, uAt; varying vec3 vC; varying float vA;
      void main(){ vC = aC; vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uT * aZ * uAt / max(0.3, -mv.z), 1.0, 256.0); }`,
    fragmentShader: `uniform float uF; varying vec3 vC; varying float vA;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard;
        float a;
        if (uF < 0.5) a = exp(-r * r * 22.0) + 0.35 * exp(-r * r * 4.0);
        else { float mem = smoothstep(0.5, 0.42, r) * (0.35 + 0.65 * smoothstep(0.3, 0.46, r)); float nuc = exp(-dot(d - vec2(0.05, -0.04), d - vec2(0.05, -0.04)) * 140.0); a = mem * 0.8 + nuc * 0.9; }
        gl_FragColor = vec4(vC * a * vA, 1.0); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; S.add(pts);
  return { pts, P, C, Z, A, mat, sync() { for (const k of ["position", "aC", "aZ", "aA"]) geo.attributes[k].needsUpdate = true; } };
}

/* ---------- poste de rua com lâmpada brilhante (diagrama da luz) ---------- */
export function poste() {
  const g = new THREE.Group(), ferro = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.45, metalness: 0.7 });
  const p = mesh(new THREE.CylinderGeometry(0.12, 0.18, 8, 12), ferro, g); p.position.y = 4;
  const b = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 8), ferro, g); b.rotation.z = Math.PI / 2; b.position.set(0.85, 7.9, 0);
  const cup = mesh(new THREE.ConeGeometry(0.55, 0.45, 20, 1, true), ferro, g); cup.position.set(1.75, 7.75, 0);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 10), new THREE.MeshBasicMaterial({ color: 0xfff1d0 })); lamp.position.set(1.75, 7.55, 0); g.add(lamp);
  const gl = glow(0xffd59a, 6, g); gl.position.copy(lamp.position); g.lamp = lamp; g.halo = gl;
  return g;
}

/* ---------- 2D: projeção e rótulos no canvas ---------- */
const _v = new THREE.Vector3();
export function proj(v, cam) { _v.copy(v).project(cam); return [(_v.x * 0.5 + 0.5) * 1080, (-_v.y * 0.5 + 0.5) * 1920, _v.z < 1]; }
// texto mono/inter no canvas. o = { a, cor, tam, peso, fam, alinha, sombra }
export function texto(c, s, x, y, { a = 1, cor = "#fff", tam = 34, peso = 600, fam = "JetBrains Mono", alinha = "left", esp = 0.12 } = {}) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha = Math.min(1, a); c.font = `${peso} ${tam}px "${fam}", monospace`; c.textAlign = alinha; c.textBaseline = "middle";
  if ("letterSpacing" in c) c.letterSpacing = `${esp * tam}px`;
  c.shadowColor = "rgba(0,0,0,0.75)"; c.shadowBlur = 18; c.fillStyle = cor; c.fillText(s, x, y); c.restore();
}
// etiqueta com linha-guia: ponto âncora (ax, ay) -> caixa em (x, y). linhas = [[texto, cor], ...] (1ª = kicker pequeno)
export function tag(c, ax, ay, x, y, linhas, { a = 1, cor = AZUL, tam = 40, larg = null } = {}) {
  if (a <= 0.01) return;
  // fora do HUD (topo) e da faixa da legenda (1045–1215)
  y = Math.max(520, Math.min(1700, y)); if (y > 960 && y < 1290) y = y < 1125 ? 960 : 1290;
  c.save(); c.globalAlpha = Math.min(1, a);
  c.strokeStyle = cor; c.lineWidth = 3; c.beginPath(); c.moveTo(ax, ay); c.lineTo(x, y); c.stroke();
  c.fillStyle = cor; c.beginPath(); c.arc(ax, ay, 7, 0, 6.283); c.fill();
  c.globalAlpha = Math.min(1, a) * 0.35; c.beginPath(); c.arc(ax, ay, 16 + 6 * Math.sin(a * 3), 0, 6.283); c.stroke();
  c.restore();
  const dir = x >= ax ? 1 : -1, al = dir > 0 ? "left" : "right";
  linhas.forEach(([s, cl], i) => texto(c, s, x + dir * 14, y + (i === 0 ? -22 : 22 + (i - 1) * tam * 1.15), { a, cor: cl || (i ? "#fff" : cor), tam: i === 0 ? 22 : tam, peso: i === 0 ? 600 : 600, alinha: al, esp: i === 0 ? 0.25 : 0.02 }));
}
// painel de leitura (rótulo pequeno + valor grande), usado para contadores sincronizados com a fala
export function painel(c, x, y, rot, val, { a = 1, cor = AZUL, tam = 76, alinha = "center", sub = null } = {}) {
  if (a <= 0.01) return;
  texto(c, rot, x, y - tam * 0.75, { a, cor, tam: 24, alinha, esp: 0.3 });
  texto(c, val, x, y, { a, cor: "#fff", tam, peso: 600, alinha, esp: 0 });
  if (sub) texto(c, sub, x, y + tam * 0.7, { a: a * 0.85, cor: "#cfe3f5", tam: 26, alinha, esp: 0.15 });
}
// entra/sai suave de um elemento 2D: de a até b, rampa r
export function vis(t, a, b, r = 0.25) { return rg(t, a, a + r) * (1 - rg(t, b - r, b)); }
export const fmt = (n) => Math.round(n).toLocaleString("pt-BR");
