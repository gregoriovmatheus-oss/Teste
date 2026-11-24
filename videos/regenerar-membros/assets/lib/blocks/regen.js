/**
 * regen.js — peças do vídeo "E se os humanos pudessem regenerar membros?" (lote 4).
 *
 * 2D:   REGEN.proj(v3, cam) → [x, y, z]; REGEN.txt(ctx, s, x, y, o); REGEN.vis(st); REGEN.quadro(); REGEN.frase(ctx, cam, v3, "TXT", a, o)
 *       REGEN.CSS(id)  título no padrão doc (Inter 300, kicker mono azul, palavra-chave em degradê), escopado na cena
 * Brilho: REGEN.glowSprite(cor, tam, op), REGEN.emiss(cor, k)
 * Crescer: REGEN.cresce(material, { eixo: "x"|"y"|"z", cor, banda }) → material com uniforms u.corte (coordenada do objeto: o que
 *       passa de u.corte some) e u.banda (faixa brilhante na frente de crescimento). Use em fígado, osso, músculo, pele, dente.
 * Bichos/órgãos (PBR, R10):
 *   const ax = REGEN.axolote({ cor });  ax.g (cabeça para +z), ax.patas[4] (grupos no ombro: escale para "regenerar"), ax.nadar(t, amp)
 *   REGEN.figado() → { g, mesh, fantasma, u }  (x de -1.5 a 1.5; o lobo direito, x < -0.5, é o terço que fica)
 *   REGEN.braco() → { g, osso, musculo, nervo, pele, set(k) }  braço vertical (ombro em y 0, ponta dos dedos em y ~2.3); set({osso, musculo, nervo, pele})
 *   REGEN.dente() → { g, u }  coroa + 2 raízes (base das raízes em y 0, coroa até y ~1.6)
 *   REGEN.cerebro() → { g, mats }  dois hemisférios com sulcos
 *   REGEN.celulas(S, n, { raio, rough }) → { m, set(i, x, y, z, s, cor) , fim() }  InstancedMesh de células
 *   REGEN.texMemoria(i) → CanvasTexture de uma "memória" (desenho simples), REGEN.texGuia() → faixa do curativo-guia
 * Tudo determinístico (t e mulberry32).
 */
import * as THREE from "../three.module.js";
import { M, roundBox } from "./toy.js";
import { mulberry32, clamp, lerp, ease } from "../kit.js";

export const AZUL = "#7cc8ff", LARANJA = "#ff8a4c";

/* ---------- 2D ---------- */
const _pv = new THREE.Vector3();
export function proj(v, cam) { cam.updateMatrixWorld(); _pv.copy(v).project(cam); return [(_pv.x + 1) * 540, (1 - _pv.y) * 960, _pv.z]; }
const FAM = { mono: '"JetBrains Mono", ui-monospace, monospace', inter: '"Inter", sans-serif' };
export function txt(ctx, s, x, y, { tam = 40, cor = "#fff", fonte = "mono", peso = 600, al = "center", a = 1, esp = 0.06, sombra = true } = {}) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a);
  ctx.font = `${peso} ${tam}px ${FAM[fonte] || FAM.mono}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = (fonte === "mono" ? esp * tam : 0) + "px";
  ctx.textAlign = al; ctx.textBaseline = "middle";
  if (sombra) { ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = tam * 0.4; ctx.shadowOffsetY = tam * 0.05; }
  ctx.fillStyle = cor; ctx.fillText(s, x, y); ctx.restore();
}
const _pos = [];
export function quadro() { _pos.length = 0; }
// pílula escura com borda colorida e fio fino até o ponto 3D; fica entre ymin e ymax (padrão: faixa dos rótulos)
export function frase(ctx, cam, v3, s, a, { cor = AZUL, tam = 30, dy = -40, dx = 0, ymin = 640, ymax = 1000, linha = true } = {}) {
  if (a <= 0.01) return;
  const [px, py, pz] = proj(v3, cam);
  if (pz > 1 || pz < -1) return;
  ctx.save(); ctx.font = `600 ${tam}px ${FAM.mono}`; if ("letterSpacing" in ctx) ctx.letterSpacing = tam * 0.06 + "px";
  const w = ctx.measureText(s).width + tam * 1.1, h = tam * 1.75;
  let x = clamp(px + dx, w / 2 + 40, 950 - w / 2), y = clamp(py + dy - h / 2, ymin + h / 2, ymax - h / 2);
  for (let k = 0; k < 6; k++) {
    const hit = _pos.find((r) => Math.abs(r[0] - x) < (r[2] + w) / 2 + 6 && Math.abs(r[1] - y) < (r[3] + h) / 2 + 6);
    if (!hit) break;
    y = hit[1] + (y >= hit[1] ? 1 : -1) * ((hit[3] + h) / 2 + 8);
    if (y > ymax - h / 2 || y < ymin + h / 2) { y = clamp(y, ymin + h / 2, ymax - h / 2); x = clamp(hit[0] + (x >= hit[0] ? 1 : -1) * ((hit[2] + w) / 2 + 10), w / 2 + 40, 950 - w / 2); }
  }
  _pos.push([x, y, w, h]);
  const A = Math.min(1, a);
  if (linha) { ctx.globalAlpha = A * 0.7; ctx.strokeStyle = cor; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y + (py > y ? h / 2 : -h / 2)); ctx.stroke();
    ctx.globalAlpha = A; ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.283); ctx.fill(); }
  ctx.globalAlpha = A;
  ctx.translate(x, y); ctx.scale(0.85 + 0.15 * A, 0.85 + 0.15 * A);
  ctx.fillStyle = "rgba(6,9,18,0.74)"; ctx.shadowColor = cor; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h * 0.3); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = cor; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s, 0, 2);
  ctx.restore();
}
export function vis(st) { const T = st.T || 0, D = st.D || 1e9; return 1 - Math.min(1, Math.max(1 - T / 0.17, 1 - (D - T) / 0.12, 0)) * 0.85; }
export function CSS(id) {
  const s = `[data-composition-id="${id}"]`;
  return `    ${s} .rot-t { font-family: "Inter", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; text-transform: none; letter-spacing: -0.01em; -webkit-text-stroke: 0; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); }
    ${s} .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }
    ${s} .rot-t .r { font-weight: 800; color: #ff8a4c; }
    ${s} .rot-t .k { font-family: "JetBrains Mono", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; text-shadow: 0 2px 12px rgba(0,0,0,0.8); }
    ${s} .rot-t .n { font-family: "JetBrains Mono", monospace; font-weight: 600; color: #7cc8ff; }
`;
}

/* ---------- brilho ---------- */
let _glow = null;
export function glowTex() {
  if (_glow) return _glow;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  _glow = new THREE.CanvasTexture(c); _glow.colorSpace = THREE.SRGBColorSpace; return _glow;
}
export function glowSprite(cor, tam, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: cor, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: op }));
  s.scale.setScalar(tam); return s;
}
export const emiss = (cor, k = 1.5) => new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(k), toneMapped: false, fog: false });

/* ---------- material que "cresce" (corte por coordenada do objeto + frente brilhante) ---------- */
let _cid = 0;
export function cresce(m, { eixo = "y", cor = 0x7cc8ff, banda = 0.12, forca = 2.2 } = {}) {
  const u = { corte: { value: 1e3 }, banda: { value: banda }, corB: { value: new THREE.Color(cor) }, forca: { value: forca } };
  const id = ++_cid;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uCorte: u.corte, uBanda: u.banda, uCorB: u.corB, uForca: u.forca });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vEixo;").replace("#include <begin_vertex>", `#include <begin_vertex>\nvEixo = position.${eixo};`);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vEixo; uniform float uCorte, uBanda, uForca; uniform vec3 uCorB;")
      .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\n if (vEixo > uCorte) discard;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n { float b = smoothstep(uCorte - uBanda, uCorte, vEixo); totalEmissiveRadiance += uCorB * b * b * uForca; }");
  };
  m.customProgramCacheKey = () => "cresce" + eixo + id;
  m.side = THREE.DoubleSide;
  m.userData.u = u;
  return m;
}
const pbr = (cor, rough = 0.5, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: rough, metalness: 0, envMapIntensity: 0.7, ...extra });

/* ---------- axolote estilizado (cabeça larga, brânquias rosadas em leque, cauda com barbatana) ---------- */
export function axolote({ cor = 0xf0b8b4, branquia = 0xe8507a, seed = 3 } = {}) {
  const g = new THREE.Group(), r = mulberry32(seed);
  const pele = pbr(cor, 0.32, { emissive: new THREE.Color(cor), emissiveIntensity: 0.08 });
  const corpo = new THREE.Group(); g.add(corpo);
  const tronco = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.5, 8, 16), pele); tronco.rotation.x = Math.PI / 2; tronco.scale.set(1.05, 1, 0.82); tronco.position.set(0, 0, 0.02); corpo.add(tronco);
  // cabeça: larga e achatada, um pouco mais larga que o corpo
  const cab = new THREE.Group(); cab.position.set(0, 0.02, 0.42); corpo.add(cab);
  const cr = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), pele); cr.scale.set(0.27, 0.15, 0.22); cab.add(cr);
  const fo = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), pele); fo.scale.set(0.22, 0.1, 0.12); fo.position.set(0, -0.02, 0.13); cab.add(fo);
  // boca: sorriso fino
  const boca = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.007, 6, 30, Math.PI * 0.62), pbr(0x7a3a40, 0.5)); boca.rotation.set(Math.PI / 2 + 0.25, 0, Math.PI + Math.PI * 0.19); boca.position.set(0, -0.045, 0.06); boca.scale.set(1, 1, 0.5); cab.add(boca);
  // olhos pequenos e escuros nas laterais de cima
  const om = new THREE.MeshStandardMaterial({ color: 0x0c0a0c, roughness: 0.08, metalness: 0.2 });
  for (const s of [1, -1]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), om); o.position.set(s * 0.17, 0.07, 0.1); cab.add(o);
    const br = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), emiss(0xffffff, 1.2)); br.position.set(s * 0.18, 0.085, 0.124); cab.add(br); }
  // brânquias: 3 hastes de cada lado, em leque, com franjas
  const bm = pbr(branquia, 0.45, { emissive: new THREE.Color(branquia), emissiveIntensity: 0.25 });
  const branquias = [];
  for (const s of [1, -1]) for (let i = 0; i < 3; i++) {
    const h = new THREE.Group(); h.position.set(s * 0.21, 0.04 + (1 - i) * 0.035, -0.06 - i * 0.015); h.rotation.set(-0.5 - i * 0.12 + 0.2, s * (0.5 + i * 0.3), s * (-0.9 + i * 0.55)); cab.add(h);
    const L = 0.2 - Math.abs(i - 1) * 0.03;
    const has = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.018, L, 6), bm); has.position.y = L / 2; h.add(has);
    for (let k = 0; k < 7; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 4), bm); const u = (k + 1) / 8;
      f.scale.set(0.007, 0.038 * (1 - u * 0.4), 0.007); f.position.set(0, u * L, 0); f.rotation.z = (k % 2 ? 1 : -1) * 0.9; f.position.x = (k % 2 ? 1 : -1) * 0.022; h.add(f);
      const f2 = f.clone(); f2.rotation.z = -f.rotation.z; f2.position.x = -f.position.x; f2.rotation.x = 0.6; h.add(f2); }
    branquias.push({ h, rz: h.rotation.z, s, i });
  }
  // cauda: 4 segmentos que ondulam, com barbatana dorsal/ventral
  const cauda = []; let pai = corpo; let z0 = -0.3;
  for (let i = 0; i < 4; i++) {
    const sg = new THREE.Group(); sg.position.set(0, 0, i === 0 ? z0 : -0.17); pai.add(sg);
    const rr = 0.12 * (1 - i * 0.22);
    const c = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), pele); c.scale.set(rr * 0.75, rr * 0.95, 0.13); c.position.z = -0.08; sg.add(c);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), pbr(cor, 0.35, { transparent: true, opacity: 0.85, emissive: new THREE.Color(cor), emissiveIntensity: 0.1 }));
    fin.scale.set(0.012, rr * 2.1 + 0.04, 0.12); fin.position.set(0, 0, -0.09); sg.add(fin);
    cauda.push(sg); pai = sg;
  }
  // patas: 4, cada uma com braço, antebraço e 4 dedos finos
  const patas = [];
  for (const [s, z] of [[1, 0.24], [-1, 0.24], [1, -0.2], [-1, -0.2]]) {
    const om = new THREE.Group(); om.position.set(s * 0.13, -0.06, z); corpo.add(om);
    const b1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.1, 4, 8), pele); b1.rotation.z = s * Math.PI / 2; b1.position.x = s * 0.06; om.add(b1);
    const cot = new THREE.Group(); cot.position.set(s * 0.12, 0, 0); om.add(cot);
    const b2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.08, 4, 8), pele); b2.position.y = -0.05; cot.add(b2);
    const mao = new THREE.Group(); mao.position.y = -0.1; cot.add(mao);
    for (let d = 0; d < 4; d++) { const dd = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.04, 3, 6), pele); dd.position.set(s * (d - 1.5) * 0.013, -0.015, 0.02 * (d - 1.5)); dd.rotation.set(0.3 * (d - 1.5), 0, s * (0.9 + (d - 1.5) * 0.25)); mao.add(dd); }
    om.rotation.set(0, s * (z > 0 ? 0.5 : -0.5), s * -0.35);
    patas.push({ g: om, cot, mao, s, rz: om.rotation.z });
  }
  function nadar(t, amp = 1) {
    cauda.forEach((sg, i) => (sg.rotation.y = amp * 0.32 * Math.sin(t * 3.2 - i * 0.9)));
    corpo.rotation.y = -amp * 0.06 * Math.sin(t * 3.2 + 0.8);
    branquias.forEach((b) => (b.h.rotation.z = b.rz + 0.12 * Math.sin(t * 2.4 + b.i * 0.8)));
    patas.forEach((p, i) => (p.g.rotation.z = p.rz + 0.18 * Math.sin(t * 2.0 + i * 1.6)));
    corpo.position.y = 0.02 * Math.sin(t * 1.4);
  }
  nadar(0);
  return { g, corpo, cab, patas, branquias, cauda, nadar, pele };
}

/* ---------- fígado (x de -1.5 a 1.5; lobo direito grosso em x < 0, lobo esquerdo afinando para +x) ---------- */
export function figado() {
  const geo = new THREE.SphereGeometry(1, 64, 40), p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const x = v.x * 1.5, u = (x + 1.5) / 3;                  // 0 no lobo direito, 1 na ponta esquerda
    const esp = lerp(1.0, 0.28, Math.pow(u, 1.25));            // espessura cai para a esquerda
    let y = v.y * 0.62 * esp, z = v.z * lerp(0.95, 0.55, u);
    if (y < 0) y *= 0.45;                                       // face de baixo achatada
    y += 0.12 * Math.sin(u * 3.0) * esp;                        // cúpula
    if (v.z > 0.55 && Math.abs(x - 0.1) < 0.18) z -= 0.12;      // incisura do ligamento
    p.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  const m = cresce(pbr(0x6e2420, 0.28, { emissive: new THREE.Color(0x3a0806), emissiveIntensity: 0.35 }), { eixo: "x", banda: 0.35, forca: 2.6 });
  const mesh = new THREE.Mesh(geo, m);
  const fantasma = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x7cc8ff, wireframe: true, transparent: true, opacity: 0.16, depthWrite: false, fog: false }));
  fantasma.scale.setScalar(1.004);
  const g = new THREE.Group(); g.add(mesh, fantasma);
  return { g, mesh, fantasma, u: m.userData.u };
}

/* ---------- braço em camadas (vertical: ombro em y 0, ponta dos dedos em y ~ -2.25, crescendo para baixo) ---------- */
// "corte" do material cresce em -y: usamos y invertido (geometria construída para +y, grupo girado 180° em x)
export function braco({ seed = 5 } = {}) {
  const g = new THREE.Group(), r = mulberry32(seed);
  const camada = (cor, rough, extra, eixo = "y") => cresce(pbr(cor, rough, extra), { eixo, banda: 0.18, forca: 2.4 });
  const mO = camada(0xeae2cc, 0.45), mM = camada(0xb83a34, 0.38, { emissive: new THREE.Color(0x3a0806), emissiveIntensity: 0.4 }),
    mN = camada(0x2a4a66, 0.35, { emissive: new THREE.Color(0x7cc8ff), emissiveIntensity: 0.9 }),
    mP = camada(0xd49a78, 0.55, { transparent: true, opacity: 0.0, depthWrite: false });
  const osso = new THREE.Group(), musc = new THREE.Group(), nerv = new THREE.Group(), pele = new THREE.Group(); g.add(osso, musc, nerv, pele);
  // ossos: úmero, rádio + ulna, metacarpos e falanges (lathe com epífises)
  const ossoLongo = (L, R) => { const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; const w = R * (0.75 + 0.9 * Math.pow(Math.abs(u - 0.5) * 2, 4)); pts.push(new THREE.Vector2(w, u * L)); } pts[0].x = 0.001; pts[16].x = 0.001; return new THREE.LatheGeometry(pts, 12); };
  const pos = (geo, x, y, z, rz = 0) => { const m = geo.clone(); m.rotateZ(rz); m.translate(x, y, z); return m; };
  const add = (grp, geo, mat) => { const m = new THREE.Mesh(geo, mat); grp.add(m); return m; };
  add(osso, pos(ossoLongo(0.95, 0.055), 0, 0.02, 0), mO);
  add(osso, pos(ossoLongo(0.85, 0.038), 0.04, 1.0, 0), mO);
  add(osso, pos(ossoLongo(0.88, 0.035), -0.045, 0.99, 0), mO);
  const dx = [-0.09, -0.035, 0.02, 0.075];
  dx.forEach((x, i) => { add(osso, pos(ossoLongo(0.26, 0.016), x * 0.8, 1.92, 0, -x * 0.25), mO);
    let y = 2.2; [0.17, 0.11, 0.08].forEach((L, j) => { add(osso, pos(ossoLongo(L - 0.01, 0.012 - j * 0.002), x * (1.0 + j * 0.1), y, 0, -x * 0.3), mO); y += L; }); });
  add(osso, pos(ossoLongo(0.2, 0.017), 0.12, 1.9, 0, -0.6), mO); add(osso, pos(ossoLongo(0.14, 0.014), 0.22, 2.06, 0, -0.45), mO);
  // músculos: fusos em volta dos ossos (bíceps, tríceps, antebraço)
  const fuso = (L, R, x, y, z) => { const geo = new THREE.SphereGeometry(1, 16, 12); geo.scale(R, L / 2, R * 0.85); geo.translate(x, y + L / 2, z); return geo; };
  [[0.8, 0.085, 0.0, 0.08, 0.05], [0.78, 0.08, -0.02, 0.1, -0.06], [0.5, 0.06, 0.07, 0.05, 0.0], [0.75, 0.06, 0.04, 1.02, 0.035], [0.72, 0.055, -0.04, 1.04, -0.03], [0.6, 0.045, 0.0, 1.1, 0.0], [0.22, 0.05, 0.0, 1.9, 0.01]].forEach(([L, R, x, y, z]) => add(musc, fuso(L, R, x, y, z), mM));
  // nervos: tubos que descem pelo braço e se ramificam nos dedos
  const tubo = (pts, R) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 40, R, 5);
  add(nerv, tubo([[0.06, 0, 0.09], [0.08, 0.5, 0.1], [0.06, 1.0, 0.06], [0.05, 1.5, 0.06], [0.03, 1.9, 0.04]], 0.009), mN);
  add(nerv, tubo([[-0.05, 0, 0.08], [-0.08, 0.6, 0.09], [-0.06, 1.1, 0.05], [-0.05, 1.6, 0.05], [-0.04, 1.92, 0.03]], 0.008), mN);
  dx.forEach((x) => add(nerv, tubo([[x * 0.4, 1.9, 0.035], [x * 0.85, 2.15, 0.03], [x * 1.05, 2.45, 0.025], [x * 1.15, 2.62, 0.02]], 0.0045), mN));
  // pele: envelope do braço (lathe) + mão achatada + dedos
  const env = []; for (let i = 0; i <= 24; i++) { const u = i / 24, y = u * 1.95; const w = u < 0.47 ? lerp(0.13, 0.1, u / 0.47) + 0.02 * Math.sin(u / 0.47 * Math.PI) : lerp(0.1, 0.075, (u - 0.47) / 0.53) + 0.015 * Math.sin((u - 0.47) / 0.53 * Math.PI); env.push(new THREE.Vector2(w, y)); }
  env[0].x = 0.12; add(pele, new THREE.LatheGeometry(env, 18), mP).scale.z = 0.85;
  const palma = new THREE.SphereGeometry(1, 16, 12); palma.scale(0.12, 0.16, 0.045); palma.translate(0, 2.1, 0.0); add(pele, palma, mP);
  dx.forEach((x) => { const d = new THREE.CapsuleGeometry(0.022, 0.32, 4, 8); d.rotateZ(-x * 0.3); d.translate(x * 1.1, 2.45, 0.0); add(pele, d, mP); });
  const pol = new THREE.CapsuleGeometry(0.025, 0.2, 4, 8); pol.rotateZ(-0.6); pol.translate(0.17, 2.05, 0.01); add(pele, pol, mP);
  g.rotation.x = Math.PI;   // cresce do ombro (em cima) para a ponta dos dedos (embaixo)
  const U = { osso: mO.userData.u, musculo: mM.userData.u, nervo: mN.userData.u, pele: mP.userData.u };
  function set({ osso: o = 0, musculo: mu = 0, nervo: n = 0, pele: pl = 0, peleOp = 0.42 } = {}) {
    U.osso.corte.value = o * 2.8 - 0.05; U.musculo.corte.value = mu * 2.8 - 0.05; U.nervo.corte.value = n * 2.8 - 0.05; U.pele.corte.value = pl * 2.8 - 0.05;
    musc.visible = mu > 0; nerv.visible = n > 0; pele.visible = pl > 0; osso.visible = o > 0;
    mP.opacity = peleOp; mP.transparent = peleOp < 0.99; mP.depthWrite = peleOp > 0.99;
  }
  set();
  return { g, osso, musculo: musc, nervo: nerv, pele, set, mats: { mO, mM, mN, mP } };
}

/* ---------- dente (molar): raízes em y 0, coroa até ~1.6 ---------- */
export function dente() {
  const m = cresce(pbr(0xf4efe4, 0.22, { emissive: new THREE.Color(0x2a2a30), emissiveIntensity: 0.15 }), { eixo: "y", banda: 0.25, forca: 2.0 });
  const g = new THREE.Group();
  const coroa = new THREE.SphereGeometry(1, 28, 20), p = coroa.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); let y = v.y;
    if (y > 0.2) y = 0.2 + (y - 0.2) * 0.35 - 0.12 * Math.cos(v.x * 5.5) * Math.cos(v.z * 5.5) * Math.max(0, y);   // cúspides
    if (y < -0.3) y = -0.3 + (y + 0.3) * 0.5;
    p.setXYZ(i, v.x * 0.62, y * 0.62 + 1.12, v.z * 0.58); }
  coroa.computeVertexNormals(); g.add(new THREE.Mesh(coroa, m));
  for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(new THREE.Vector2(0.001 + 0.2 * Math.pow(u, 0.6), u * 1.0)); }
    const rz = new THREE.LatheGeometry(pts, 10); rz.rotateZ(s * 0.12); rz.translate(s * 0.22, 0, 0); g.add(new THREE.Mesh(rz, m)); }
  return { g, u: m.userData.u };
}

/* ---------- cérebro: dois hemisférios com sulcos ---------- */
export function cerebro({ cor = 0xd98a92 } = {}) {
  const g = new THREE.Group(), mats = [];
  for (const s of [1, -1]) {
    const geo = new THREE.SphereGeometry(1, 72, 52), p = geo.attributes.position, v = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); n.copy(v);
      const sulco = Math.abs(Math.sin(v.x * 9 + Math.sin(v.y * 6) * 1.6) * Math.sin(v.z * 8 + Math.cos(v.y * 7) * 1.4));
      const d = 1 - 0.07 * Math.pow(1 - sulco, 3);
      v.multiplyScalar(d); v.x *= 0.5; v.y *= 0.62; v.z *= 0.85; if (v.y < -0.2) v.y = -0.2 + (v.y + 0.2) * 0.6; if (v.x * s < -0.42) v.x = -0.42 * s;
      p.setXYZ(i, v.x + s * 0.43, v.y, v.z); }
    geo.computeVertexNormals();
    const m = pbr(cor, 0.42, { emissive: new THREE.Color(0x5a1a2a), emissiveIntensity: 0.25, transparent: true, opacity: 1 }); mats.push(m);
    g.add(new THREE.Mesh(geo, m));
  }
  return { g, mats };
}

/* ---------- células em InstancedMesh ---------- */
export function celulas(S, n, { raio = 0.06, rough = 0.35, det = 1 } = {}) {
  const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(raio, det), new THREE.MeshStandardMaterial({ roughness: rough, metalness: 0, envMapIntensity: 0.7, emissive: 0xffffff, emissiveIntensity: 0.0 }), n);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); S.add(m);
  const o = new THREE.Object3D(), c = new THREE.Color();
  for (let i = 0; i < n; i++) { o.scale.setScalar(1e-4); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, c.set(0xffffff)); }
  return { m, set(i, x, y, z, s, cor) { o.position.set(x, y, z); o.rotation.set(i * 0.7, i * 1.3, 0); o.scale.setScalar(Math.max(1e-4, s)); o.updateMatrix(); m.setMatrixAt(i, o.matrix); m.setColorAt(i, c.set(cor)); },
    fim() { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } };
}

/* ---------- texturas ---------- */
// "memórias": cartões com desenhos simples (praia, aniversário, rosto, casa, cachorro, formatura)
export function texMemoria(i) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 200; const g = c.getContext("2d");
  const fundos = [["#7fc4ff", "#ffd59a"], ["#2a2440", "#ff9a6a"], ["#d8e8f0", "#9ab8d8"], ["#9fd6a0", "#e8f0c0"], ["#ffcf8a", "#ff8a6a"], ["#3a5a8a", "#a8c8e8"]][i % 6];
  const gr = g.createLinearGradient(0, 0, 0, 200); gr.addColorStop(0, fundos[0]); gr.addColorStop(1, fundos[1]); g.fillStyle = gr; g.fillRect(0, 0, 256, 200);
  g.fillStyle = "rgba(0,0,0,0.55)";
  const k = i % 6;
  if (k === 0) { g.fillStyle = "#ffe27a"; g.beginPath(); g.arc(190, 50, 24, 0, 6.28); g.fill(); g.fillStyle = "#3a7ab8"; g.fillRect(0, 130, 256, 70); g.fillStyle = "#f2d8a0"; g.fillRect(0, 165, 256, 35); }
  if (k === 1) { g.fillStyle = "#f4e8e0"; g.fillRect(78, 110, 100, 60); g.fillStyle = "#e86a8a"; g.fillRect(78, 110, 100, 12); g.fillStyle = "#fff"; for (let j = 0; j < 4; j++) g.fillRect(95 + j * 22, 82, 6, 28); g.fillStyle = "#ffd060"; for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(98 + j * 22, 76, 6, 0, 6.28); g.fill(); } }
  if (k === 2) { g.fillStyle = "#c58f6c"; g.beginPath(); g.arc(128, 95, 48, 0, 6.28); g.fill(); g.fillStyle = "#3a2418"; g.beginPath(); g.arc(128, 75, 50, Math.PI, 0); g.fill(); g.fillStyle = "#1a1010"; g.beginPath(); g.arc(110, 98, 6, 0, 6.28); g.arc(146, 98, 6, 0, 6.28); g.fill(); g.strokeStyle = "#5a2a20"; g.lineWidth = 5; g.beginPath(); g.arc(128, 112, 18, 0.3, 2.8); g.stroke(); g.fillStyle = "#4a6a9a"; g.fillRect(70, 150, 116, 50); }
  if (k === 3) { g.fillStyle = "#e8d8c0"; g.fillRect(70, 90, 116, 80); g.fillStyle = "#b8483a"; g.beginPath(); g.moveTo(60, 92); g.lineTo(128, 40); g.lineTo(196, 92); g.fill(); g.fillStyle = "#5a3a2a"; g.fillRect(115, 125, 26, 45); g.fillStyle = "#7fb0e0"; g.fillRect(82, 105, 24, 20); g.fillRect(150, 105, 24, 20); g.fillStyle = "#5a9a4a"; g.fillRect(0, 170, 256, 30); }
  if (k === 4) { g.fillStyle = "#b07a40"; g.beginPath(); g.ellipse(128, 130, 60, 32, 0, 0, 6.28); g.fill(); g.beginPath(); g.arc(78, 100, 28, 0, 6.28); g.fill(); g.fillStyle = "#6a4420"; g.beginPath(); g.ellipse(62, 82, 10, 20, -0.4, 0, 6.28); g.fill(); g.fillStyle = "#1a1010"; g.beginPath(); g.arc(70, 96, 4, 0, 6.28); g.fill(); }
  if (k === 5) { g.fillStyle = "#1a1a24"; g.beginPath(); g.moveTo(78, 70); g.lineTo(128, 50); g.lineTo(178, 70); g.lineTo(128, 90); g.fill(); g.fillRect(124, 70, 8, 40); g.fillStyle = "#c58f6c"; g.beginPath(); g.arc(128, 115, 30, 0, 6.28); g.fill(); g.fillStyle = "#1a1a24"; g.fillRect(80, 150, 96, 50); }
  g.strokeStyle = "#ffffff"; g.lineWidth = 10; g.strokeRect(5, 5, 246, 190);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// faixa do curativo-guia: gaze clara com trama e linhas-guia azuis que brilham (use como map + emissiveMap)
export function texGuia() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 256; const g = c.getContext("2d");
  g.fillStyle = "#ecebe6"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(150,145,135,0.35)"; g.lineWidth = 1;
  for (let i = 0; i < 256; i += 6) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const e = document.createElement("canvas"); e.width = 256; e.height = 256; const h = e.getContext("2d");
  h.fillStyle = "#000"; h.fillRect(0, 0, 256, 256); h.strokeStyle = "#7cc8ff"; h.lineWidth = 5;
  for (let i = 0; i < 4; i++) { h.beginPath(); h.moveTo(i * 64 + 32, 0); h.lineTo(i * 64 + 32, 256); h.stroke(); }
  h.lineWidth = 2.5; for (let i = 0; i < 8; i++) { h.beginPath(); h.moveTo(0, i * 32 + 16); h.lineTo(256, i * 32 + 16); h.stroke(); }
  const te = new THREE.CanvasTexture(e); te.colorSpace = THREE.SRGBColorSpace; te.wrapS = te.wrapT = THREE.RepeatWrapping;
  return { map: t, emissiveMap: te };
}
// faixa simples (atadura) para a mão enfaixada de f01/f13: trama clara
export function texAtadura() {
  const c = document.createElement("canvas"); c.width = 128; c.height = 128; const g = c.getContext("2d");
  g.fillStyle = "#efece4"; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(140,130,118,0.5)"; g.lineWidth = 2;
  for (let i = -128; i < 256; i += 26) { g.lineWidth = 4; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 60, 128); g.stroke(); }
  g.strokeStyle = "rgba(160,150,140,0.25)"; g.lineWidth = 1; for (let i = 0; i < 128; i += 4) { g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export { clamp, lerp, ease, mulberry32 };
