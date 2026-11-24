/**
 * vulcoes.js — peças do vídeo "E se todos os vulcões entrassem em erupção ao mesmo tempo?" (lote 4). Tudo determinístico.
 *
 *   AZUL, LARANJA, await prepara()            fontes doc (Inter / JetBrains Mono) + tipografia doc dos rótulos
 *   proj(v3, cam) -> [x, y, z]   vis(st)      projeção na tela 1080×1920; visibilidade fora do dip
 *   txt(ctx, s, x, y, o)  painel(ctx, x, y, w, h, a)  etq(ctx, s, v3, cam, a, o)   textos 2D (etq fica em y 640–1000, x ≤ 940)
 *   glowTex(tipo) / brilho(cor, tam, tipo, op)  sprite aditivo ("suave" | "raios")
 *   placa(txt, o) -> Mesh                     placa com texto (CanvasTexture)
 *   vulcao(mk, {raio, alt, seed, cor}) -> {g, topo, u}   cone facetado; u.lava 0..1 (lava desce da cratera), u.brilho (cratera)
 *   pluma(S, {n, base, alt, larg, cor, seed, tam, guarda}) -> {pts, u}   coluna de cinza (Points); u.topo (altura atual), u.t
 *   bombas(S, {n, centro, seed, alcance, alt, tam}) -> {update(t, k)}    pedras incandescentes em parábola (InstancedMesh)
 *   cinza(S, {n, area, centro, alt, seed, cor, tam, vel}) -> {pts, update(t)}   cinza/neve caindo (Points)
 *   raios2D(ctx, x, y, a, {n, seed, cor, r0, r1})   feixes de sol na tela (screen)
 *   quarto(S, LP, {manha}) -> {...}           quarto do f01/f13: cama, parede com janela, lá fora vulcões (noite) ou sol (manhã)
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
  if (!document.getElementById("vulc-css")) {
    const s = document.createElement("style"); s.id = "vulc-css";
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
export function placa(txt, { w = 1.6, h = 0.5, fundo = "#f3efe6", cor = "#1b1f2a", tam = 92, borda = null, px = 512, emis = 0 } = {}) {
  const c = document.createElement("canvas"); c.width = px; c.height = Math.round(px * h / w);
  const g = c.getContext("2d"); g.fillStyle = fundo; g.fillRect(0, 0, c.width, c.height);
  if (borda) { g.strokeStyle = borda; g.lineWidth = c.height * 0.06; g.strokeRect(c.height * 0.05, c.height * 0.05, c.width - c.height * 0.1, c.height - c.height * 0.1); }
  g.fillStyle = cor; g.textAlign = "center"; g.textBaseline = "middle";
  const linhas = txt.split("\n"), lh = c.height / (linhas.length + 0.6);
  let t = tam; g.font = `800 ${t}px "Inter", sans-serif`;
  while (linhas.some((l) => g.measureText(l).width > c.width * 0.86) && t > 10) { t -= 2; g.font = `800 ${t}px "Inter", sans-serif`; }
  linhas.forEach((l, i) => g.fillText(l, c.width / 2, c.height / 2 + (i - (linhas.length - 1) / 2) * Math.min(lh, t * 1.1)));
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.8, emissive: emis ? 0xffffff : 0x000000, emissiveMap: emis ? tx : null, emissiveIntensity: emis }));
}

/* ---------- vulcão ---------- */
const hash3 = (x, y, z, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + s * 13.3) * 43758.5453; return v - Math.floor(v); };
export function vulcao(mk, { raio = 6, alt = 3.2, seed = 1, cor = 0x4a3a30, topo = 0.14 } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(raio * topo, raio, alt, 36, 10, true);
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const h = (v.y + alt / 2) / alt, a = Math.atan2(v.z, v.x);
    const n = hash3(+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3), seed) - 0.5;
    const rad = 1 + 0.18 * Math.sin(a * 3 + seed) * (1 - h) + 0.08 * Math.sin(a * 7 + seed * 2) + n * 0.12;
    const rt = raio * topo, rLin = raio + (rt - raio) * h, rDes = rt + (raio - rt) * Math.pow(Math.max(0, 1 - h), 1.7);
    v.x *= rad * rDes / rLin; v.z *= rad * rDes / rLin;
    v.y += n * alt * 0.04 * (1 - h);
    p.setXYZ(i, v.x, v.y + alt / 2, v.z);
  }
  geo.computeVertexNormals();
  const u = { lava: { value: 0 }, brilho: { value: 1 }, alt: { value: alt }, tt: { value: 0 } };
  const m = mk(cor, 0.92);
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    Object.assign(sh.uniforms, { uLava: u.lava, uBri: u.brilho, uAlt: u.alt, uTT: u.tt });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vVp;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvVp = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vVp; uniform float uLava, uBri, uAlt, uTT;")
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        { float h = clamp(vVp.y / uAlt, 0.0, 1.0); float an = atan(vVp.z, vVp.x);
          diffuseColor.rgb *= mix(1.0, 0.55, smoothstep(0.5, 1.0, h));
          float s = an * 5.0 + sin(h * 9.0 + an * 2.0) * 0.5;
          float st = pow(max(0.0, sin(s)), 18.0) + 0.6 * pow(max(0.0, sin(s * 1.7 + 1.3)), 30.0);
          float frente = 1.0 - uLava;
          float m = smoothstep(frente - 0.04, frente + 0.02, h);
          float pulso = 0.8 + 0.2 * sin(uTT * 3.0 + h * 12.0 - an * 2.0);
          totalEmissiveRadiance += vec3(1.0, 0.3, 0.04) * st * m * 2.6 * pulso * step(0.001, uLava);
          totalEmissiveRadiance += vec3(1.0, 0.45, 0.1) * smoothstep(0.9, 1.0, h) * uBri * 1.6; }`);
  };
  m.customProgramCacheKey = () => "vulcao" + seed;
  m.side = THREE.DoubleSide;
  const cone = new THREE.Mesh(geo, m); g.add(cone);
  // boca da cratera (disco incandescente)
  const boca = new THREE.Mesh(new THREE.CircleGeometry(raio * topo * 0.95, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a1a).multiplyScalar(3), toneMapped: false }));
  boca.rotation.x = -Math.PI / 2; boca.position.y = alt * 0.985; g.add(boca);
  return { g, cone, boca, topo: new THREE.Vector3(0, alt, 0), u };
}

/* ---------- coluna de cinza (Points; posição calculada no shader) ---------- */
export function pluma(S, { n = 2600, base = [0, 0, 0], alt = 10, larg = 1.2, cor = 0x5a524c, luz = 0xb8a898, seed = 3, tam = 1.0, guarda = 1.0, vel = 0.12, op = 0.85 } = {}) {
  const r = mulberry32(seed), A = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) A.set([r(), r() * 6.283, Math.sqrt(r()), r()], i * 4);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute("sd", new THREE.BufferAttribute(A, 4));
  const u = { t: { value: 0 }, topo: { value: alt }, alt: { value: alt }, larg: { value: larg }, guarda: { value: guarda }, tam: { value: tam }, vel: { value: vel }, op: { value: op },
    cA: { value: new THREE.Color(cor) }, cB: { value: new THREE.Color(luz) }, base: { value: new THREE.Vector3(...base) }, quente: { value: 0.6 } };
  const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false,
    vertexShader: `attribute vec4 sd; uniform float t, topo, alt, larg, guarda, tam, vel; uniform vec3 base; varying float vA; varying float vH; varying float vL;
      void main(){ float f = fract(sd.x + t * vel); float h = pow(f, 0.85) * topo;
        float hn = h / alt; float r = larg * (0.35 + 0.9 * hn + 0.25 * sin(sd.w * 30.0 + t * 0.6));
        float guardaK = guarda * smoothstep(0.78, 1.0, f) * step(topo, alt * 1.01) * step(alt * 0.9, topo);   // guarda-chuva no topo
        r += guardaK * larg * 4.5 * sd.z;
        float a = sd.y + t * 0.25 + hn * 2.0;
        vec3 p = base + vec3(cos(a) * r * sd.z, h - guardaK * larg * 0.6 * (1.0 - sd.z), sin(a) * r * sd.z);
        p.x += sin(h * 0.7 + t * 0.4 + sd.w * 6.0) * larg * 0.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        float s = tam * (0.6 + 1.2 * hn + 0.6 * sd.w + guardaK);
        gl_PointSize = s * projectionMatrix[1][1] * 960.0 / -mv.z;
        vA = smoothstep(0.0, 0.06, f) * (1.0 - smoothstep(0.85, 1.0, f) * (1.0 - guarda)); vH = hn; vL = 0.5 + 0.5 * cos(a - 0.8) * sd.z; }`,
    fragmentShader: `uniform vec3 cA, cB; uniform float op, quente; varying float vA; varying float vH; varying float vL;
      void main(){ vec2 d = gl_PointCoord - 0.5; float k = exp(-dot(d, d) * 9.0); if (k < 0.03) discard;
        vec3 c = mix(cA, cB, vL * 0.7 + vH * 0.3);
        c += vec3(1.0, 0.35, 0.05) * quente * (1.0 - smoothstep(0.0, 0.12, vH)) * 1.5;
        gl_FragColor = vec4(c, k * vA * op); }` });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; S.add(pts);
  return { pts, u, mat: m };
}

/* ---------- pedras incandescentes ---------- */
export function bombas(S, { n = 40, centro = [0, 3, 0], seed = 7, alcance = 6, alt = 5, tam = 0.12, periodo = 2.2 } = {}) {
  const r = mulberry32(seed), J = [];
  for (let i = 0; i < n; i++) { const a = r() * 6.283, v = 0.4 + r() * 0.6; J.push([Math.cos(a) * v * alcance, Math.sin(a) * v * alcance, alt * (0.6 + r() * 0.6), r(), 0.6 + r() * 0.8]); }
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(tam, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff7a2a).multiplyScalar(2.6), toneMapped: false }), n);
  im.frustumCulled = false; S.add(im);
  const rastro = new THREE.InstancedMesh(new THREE.CylinderGeometry(tam * 0.45, 0.0, 1, 5).translate(0, -0.5, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff9a40).multiplyScalar(1.6), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), n);
  rastro.frustumCulled = false; S.add(rastro);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), dv = new THREE.Vector3();
  function update(t, k = 1) {
    for (let i = 0; i < n; i++) {
      const [vx, vz, vy, ph, sz] = J[i], P = periodo * sz, tau = ((t / P + ph) % 1) * P, gr = 2 * (vy * P + centro[1]) / (P * P);
      p.set(centro[0] + vx * tau / P, centro[1] + vy * tau - 0.5 * gr * tau * tau, centro[2] + vz * tau / P);
      const vis = k > ph * 0.9 && p.y > 0 ? k : 0;
      s.setScalar(sz * vis); q.identity(); m4.compose(p, q, s); im.setMatrixAt(i, m4);
      dv.set(vx / P, vy - gr * tau, vz / P); const L = dv.length() * 0.12; dv.normalize();
      q.setFromUnitVectors(up, dv); s.set(sz * vis, L * vis, sz * vis); m4.compose(p, q, s); rastro.setMatrixAt(i, m4);
    }
    im.instanceMatrix.needsUpdate = true; rastro.instanceMatrix.needsUpdate = true;
  }
  update(0, 0);
  return { im, rastro, update };
}

/* ---------- cinza (ou neve) caindo ---------- */
export function cinza(S, { n = 900, area = [6, 6], centro = [0, 0, -2], alt = 5, seed = 5, cor = 0x9a948c, tam = 0.05, vel = 0.5, op = 0.9, vento = 0.15 } = {}) {
  const r = mulberry32(seed), A = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) A.set([r(), r(), r(), r()], i * 4);
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute("sd", new THREE.BufferAttribute(A, 4));
  const u = { t: { value: 0 }, op: { value: op }, cor: { value: new THREE.Color(cor) } };
  const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false,
    vertexShader: `attribute vec4 sd; uniform float t; varying float vA;
      void main(){ float y = mod(sd.y * ${alt.toFixed(2)} - t * ${vel.toFixed(3)} * (0.6 + 0.8 * sd.w), ${alt.toFixed(2)});
        vec3 p = vec3(${centro[0].toFixed(2)} + (sd.x - 0.5) * ${(area[0] * 2).toFixed(2)} + sin(t * (0.8 + sd.w) + sd.z * 9.0) * 0.12 + ${vento.toFixed(3)} * y,
          ${centro[1].toFixed(2)} + y, ${centro[2].toFixed(2)} + (sd.z - 0.5) * ${(area[1] * 2).toFixed(2)} + cos(t * 0.7 + sd.x * 7.0) * 0.08);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = ${tam.toFixed(3)} * (0.6 + 0.8 * sd.w) * projectionMatrix[1][1] * 960.0 / -mv.z; vA = 0.6 + 0.4 * sd.x; }`,
    fragmentShader: `uniform vec3 cor; uniform float op; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float k = 1.0 - smoothstep(0.2, 0.5, length(d)); if (k < 0.02) discard; gl_FragColor = vec4(cor, k * op * vA); }` });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; S.add(pts);
  return { pts, u, update(t) { u.t.value = t; } };
}

/* ---------- feixes de sol 2D ---------- */
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

/* ---------- título doc desenhado no canvas (visível já no quadro 0) ---------- */
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

/* ---------- quarto (f01 / f13) ---------- */
// Pessoa sentada na cama em (0, 0, 0) olhando para +z. A janela fica na parede da FRENTE (z = 2.3), atrás da câmera:
// a luz de fora bate no rosto e projeta a janela na parede do fundo. Lá fora (z 25–45): morros, vulcões (noite) ou o sol (manhã).
export function quarto(S, LP, { manha = false } = {}) {
  const mk = LP.mat, g = new THREE.Group(); S.add(g);
  const cx = (w, h, d, c, x, y, z, rough = 0.85) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mk(c, rough)); m.position.set(x, y, z); g.add(m); return m; };
  const PAR = manha ? 0x9a8a78 : 0x3a4252, ZF = 2.3, J0 = -0.95, J1 = 0.95, JY0 = 0.85, JY1 = 2.25;
  cx(8, 0.1, 8, 0x4a3426, 0, -0.05, 0.6, 0.6);                                     // piso
  cx(6, 3, 0.1, PAR, 0, 1.5, -1.0);                                                // parede do fundo
  cx(0.1, 3, 4, PAR, -2.2, 1.5, 0.6); cx(0.1, 3, 4, PAR, 2.2, 1.5, 0.6);            // laterais
  cx(6, 0.1, 4, 0x2a2a30, 0, 3.0, 0.6);                                            // teto
  // parede da frente com a janela
  cx(J0 + 3, 3, 0.1, PAR, (J0 - 3) / 2, 1.5, ZF); cx(3 - J1, 3, 0.1, PAR, (J1 + 3) / 2, 1.5, ZF);
  cx(J1 - J0, JY0, 0.1, PAR, 0, JY0 / 2, ZF); cx(J1 - J0, 3 - JY1, 0.1, PAR, 0, (3 + JY1) / 2, ZF);
  const mold = 0xe8e2d8; [J0, J1].forEach((x) => cx(0.06, JY1 - JY0, 0.1, mold, x, (JY0 + JY1) / 2, ZF));
  [JY0, JY1].forEach((y) => cx(J1 - J0, 0.05, 0.1, mold, 0, y, ZF));
  // cama: cabeceira, colchão, edredom, travesseiro
  cx(1.7, 1.0, 0.08, 0x5a3a28, 0.15, 0.5, -0.9, 0.6);
  cx(1.6, 0.34, 2.1, 0x3a3240, 0.15, 0.2, 0.2); cx(1.55, 0.14, 2.0, 0xe8e4f0, 0.15, 0.42, 0.2, 0.95);
  const edr = new THREE.Mesh(LP.facetado(1, (v) => { v.x *= 0.82; v.y *= 0.16; v.z *= 0.72; }, 9, 0.18), LP.matTecido(manha ? 0xc9a06a : 0x4a5e88, 0.9)); edr.position.set(0.15, 0.56, 0.62); g.add(edr);
  const trav = new THREE.Mesh(LP.facetado(1, (v) => { v.x *= 0.4; v.y *= 0.13; v.z *= 0.2; }, 4, 0.12), LP.matTecido(0xf2eef6, 0.95)); trav.position.set(0.15, 0.62, -0.65); trav.rotation.x = -0.5; g.add(trav);
  // criado-mudo, copo d'água, quadro
  cx(0.45, 0.55, 0.4, 0x5a4030, 1.25, 0.27, -0.55);
  const copo = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.11, 10), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, roughness: 0.05, transparent: true, opacity: 0.5 }));
  copo.position.set(1.18, 0.61, -0.48); g.add(copo);
  const quadro = cx(0.5, 0.36, 0.03, 0x22252c, -0.95, 1.65, -0.93, 0.5); const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.28), mk(manha ? 0x7aa0c8 : 0x48607a, 0.9)); tela.position.z = 0.02; quadro.add(tela);
  // lá fora
  const fora = new THREE.Group(); fora.position.z = 18; g.add(fora);
  const ceuM = new THREE.ShaderMaterial({ depthWrite: false, fog: false, uniforms: { a: { value: new THREE.Color(manha ? 0x5a92d0 : 0x0a0b16) }, b: { value: new THREE.Color(manha ? 0xffd9a0 : 0x5a1c0c) } },
    vertexShader: "varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 a, b; varying vec2 vU; void main(){ gl_FragColor = vec4(mix(b, a, smoothstep(0.38, 0.62, vU.y)), 1.0); }" });
  const ceu = new THREE.Mesh(new THREE.PlaneGeometry(160, 70), ceuM); ceu.rotation.y = Math.PI; ceu.position.set(0, 10, 60); fora.add(ceu);
  const morro = (x, z, s, c) => { const m = new THREE.Mesh(LP.facetado(1, (v) => { v.y = Math.max(0, v.y); }, Math.round(x * 3 + 7), 0.25), mk(c, 1)); m.scale.set(s * 2.4, s, s); m.position.set(x, -0.6, z); fora.add(m); return m; };
  for (let i = 0; i < 7; i++) morro(-21 + i * 7, 34 + (i % 2) * 4, 2.6 + (i % 3) * 0.8, manha ? 0x5a7a4a : 0x0c0a0c);
  const vulcs = [], glows = [];
  const POS = [[-2.5, 30, 1.1], [-9, 31, 0.75], [11, 33, 0.65], [-18, 37, 0.6], [19, 39, 0.55], [-3, 42, 0.5]];
  POS.forEach(([x, z, s], i) => {
    const V = vulcao(mk, { raio: 6 * s, alt: 6 * s, seed: 20 + i, cor: manha ? 0x6a5e54 : 0x140e0c }); V.g.position.set(x, -0.6, z); fora.add(V.g); vulcs.push(V);
    const gl = brilho(0xff5a18, 12 * s, "suave", 0.9); gl.position.set(x, -0.6 + 6 * s + 1.2 * s, z - 0.5); fora.add(gl); glows.push(gl);
    V.u.brilho.value = manha ? 0 : 1; V.u.lava.value = manha ? 0 : 0.55;
  });
  let sol = null;
  if (manha) { sol = new THREE.Group(); const disco = new THREE.Mesh(new THREE.CircleGeometry(1.5, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0c8).multiplyScalar(4), toneMapped: false }));
    disco.rotation.y = Math.PI; sol.add(disco, brilho(0xffd08a, 18, "suave", 0.9), brilho(0xffe0b0, 30, "raios", 0.45)); sol.position.set(3.5, 11.5, 50); fora.add(sol); glows.forEach((x) => (x.visible = false)); }
  return { g, fora, vulcs, glows, sol, copo, quadro, edr, ceuM, janela: new THREE.Vector3(0, (JY0 + JY1) / 2, ZF) };
}

/* ---------- avião comercial (primitivas) ---------- */
// frente para +z, rodas no chão (y = 0). Devolve {g, fans: [Mesh], motores: [Vector3 (boca, local)]}
export function aviao(mk, { cor = 0xeef0f2, faixa = 0x2a5a9a, seed = 1, simples = false } = {}) {
  const g = new THREE.Group(), seg = simples ? 10 : 24;
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 16, seg), mk(cor, 0.35)); fus.rotation.x = Math.PI / 2; fus.position.y = 2.2; g.add(fus);
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(1.0, seg, 10, 0, 6.283, 0, Math.PI / 2), mk(cor, 0.35)); nariz.rotation.x = Math.PI / 2; nariz.scale.y = 1.8; nariz.position.set(0, 2.2, 8); g.add(nariz);
  const cauda = new THREE.Mesh(new THREE.ConeGeometry(1.0, 4, seg), mk(cor, 0.35)); cauda.rotation.x = -Math.PI / 2; cauda.position.set(0, 2.5, -10); cauda.scale.set(1, 1, 0.7); g.add(cauda);
  const lista = new THREE.Mesh(new THREE.CylinderGeometry(1.01, 1.01, 15, seg, 1, true, -0.25, 0.5), mk(faixa, 0.4)); lista.rotation.x = Math.PI / 2; lista.rotation.y = Math.PI / 2; lista.position.y = 2.2; g.add(lista);
  if (!simples) { const jan = new THREE.Mesh(new THREE.CylinderGeometry(1.012, 1.012, 12, seg, 1, true, 1.25, 0.12), new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.2 })); jan.rotation.x = Math.PI / 2; jan.position.set(0, 2.45, 0.5); g.add(jan);
    const jan2 = jan.clone(); jan2.scale.x = -1; g.add(jan2); }
  const asa = new THREE.Shape(); asa.moveTo(0, 1.6); asa.lineTo(9, -2.6); asa.lineTo(9, -3.4); asa.lineTo(0, -1.6); asa.closePath();
  const ag = new THREE.ExtrudeGeometry(asa, { depth: 0.18, bevelEnabled: false }); ag.rotateX(Math.PI / 2);
  [1, -1].forEach((s) => { const a = new THREE.Mesh(ag, mk(cor, 0.4)); a.scale.x = s; a.position.set(s * 0.6, 1.7, 0.5); g.add(a); });
  const est = new THREE.Shape(); est.moveTo(0, 0.9); est.lineTo(3.4, -0.8); est.lineTo(3.4, -1.3); est.lineTo(0, -0.7); est.closePath();
  const eg = new THREE.ExtrudeGeometry(est, { depth: 0.12, bevelEnabled: false }); eg.rotateX(Math.PI / 2);
  [1, -1].forEach((s) => { const a = new THREE.Mesh(eg, mk(cor, 0.4)); a.scale.x = s; a.position.set(s * 0.3, 2.7, -9.8); g.add(a); });
  const der = new THREE.Shape(); der.moveTo(0, 0); der.lineTo(-2.6, 3.6); der.lineTo(-3.6, 3.6); der.lineTo(-2.2, 0); der.closePath();
  const dg = new THREE.ExtrudeGeometry(der, { depth: 0.14, bevelEnabled: false }); dg.rotateY(Math.PI / 2); const d = new THREE.Mesh(dg, mk(faixa, 0.4)); d.position.set(-0.07, 2.8, -8.2); g.add(d);
  const fans = [], motores = [];
  [1, -1].forEach((s) => {
    const m = new THREE.Group(); m.position.set(s * 3.4, 0.95, 2.4); g.add(m);
    const nac = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.6, 2.6, seg, 1, true), mk(0xd8dade, 0.3)); nac.material.side = THREE.DoubleSide; nac.rotation.x = Math.PI / 2; m.add(nac);
    const fundo = new THREE.Mesh(new THREE.CircleGeometry(0.66, seg), mk(0x15161a, 0.5)); fundo.position.z = 0.6; m.add(fundo);
    const fan = new THREE.Group(); fan.position.z = 0.75; m.add(fan);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 12), mk(0x2a2c30, 0.3)); cone.rotation.x = Math.PI / 2; cone.position.z = 0.2; fan.add(cone);
    if (!simples) for (let i = 0; i < 18; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.02), mk(0x8a9098, 0.25, { metalness: 0.8 })); b.position.y = 0.36; const pv = new THREE.Group(); pv.rotation.z = (i / 18) * 6.283; b.rotation.y = 0.5; pv.add(b); fan.add(pv); }
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 1.6), mk(cor, 0.4)); pil.position.set(0, 0.75, -0.3); m.add(pil);
    fans.push(fan); motores.push(m.position.clone().add(new THREE.Vector3(0, 0, 1.3)));
  });
  [[0, 6], [2.2, -0.5], [-2.2, -0.5]].forEach(([x, z]) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.25, 10), mk(0x111114, 0.8)); r.rotation.z = Math.PI / 2; r.position.set(x, 0.28, z); g.add(r);
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 0.1), mk(0x8a8a90, 0.4)); h.position.set(x, 0.9, z); g.add(h); });
  return { g, fans, motores };
}

/* ---------- determinismo: p.reset() não volta as abas da jaqueta nem as mechas; andar/correr somam nelas ---------- */
export function guardaAbas(p) {
  const A = (p.abas || []).map((a) => a.rotation.clone()), M = p.mechas ? p.mechas.rotation.clone() : null;
  return () => { (p.abas || []).forEach((a, i) => a.rotation.copy(A[i])); if (M) p.mechas.rotation.copy(M); };
}
