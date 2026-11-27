/**
 * toy.js — palco e mundo em anime cel-shaded (R09: MeshToonMaterial de 3 tons + contorno por casco invertido) para as cenas 3D. Renderer WebGL ÚNICO, compartilhado.
 *
 *   const st = createToyStage(canvas, { ceu: ["#6FB6CC", "#D7EBE6"], nevoa: [60, 260], exposicao: 1.1 });
 *   st.scene, st.cam, st.sol(x, z, tamanho)   // move a luz-chave (e a sombra) para perto do que a câmera vê
 *   st.draw()                                  // renderiza no renderer compartilhado e copia para o canvas 2D da cena
 *   await K.bindSeek(canvas, render, { warm: [st.warm] })
 *
 * Por que um renderer só: 16 cenas = 16 contextos WebGL estoura o limite do Chrome. Aqui cada cena tem um canvas 2D
 * e recebe uma cópia (drawImage) do canvas WebGL único. Só a cena visível desenha a cada quadro.
 *
 * Peças: M(cor, rough), roundBox(w,h,d,r), predio({...}), rua({...}), carro(cor), arvore(s), nuvem(seed),
 * createBurst(scene, {...}) (explosão de bolinhas, determinística), gradTex(topo, base), PAL (paleta R05).
 * Convenção: chão em y = 0; rua ao longo de z; frente dos prédios virada para a rua.
 */
import * as THREE from "../three.module.js";
import { createRenderer, mulberry32, clamp, lerp, ease } from "../kit.js";

export const PAL = {
  pele: 0xf2b48a, amarelo: 0xf2b53a, tijolo: 0xd9583b, ceu: 0x8cc7d8,
  creme: 0xf3e2c4, salmao: 0xe8896b, verde: 0x7dbb5a, verdeEsc: 0x4f8f45, teal: 0x6fafa6,
  rosa: 0xe9a3a0, asfalto: 0x55565a, calcada: 0xaaa49b, tronco: 0x5e4330, branco: 0xf6f1e8,
};
// R10: paleta urbana realista (tijolo, concreto, areia, ardósia) em todas as cenas
PAL.verde = 0x5f8a3c; PAL.verdeEsc = 0x3d6a2c;
const PREDIO_CORES = [0x9c5038, 0xc7b08e, 0xb5afa5, 0x8d8780, 0xae6848, 0xd6c9b0, 0x6c7880, 0xb48748];

let R = null;
export function sharedRenderer() {
  if (!R) {
    const c = document.createElement("canvas");
    c.width = 1080; c.height = 1920;
    R = createRenderer(c);
  }
  return R;
}

/* ---------- material toon (3 tons) + contorno ---------- */
export const R09 = { ceuAlto: "#3A7BD5", ceuBaixo: "#FFC88A", contorno: 0x1a1a2e, brilho: 0xfff4d6, destaque: 0xff5a5f };
const _grad = (() => {
  const d = new Uint8Array([70, 70, 70, 255, 165, 165, 165, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
// R10 cinema realista: PBR (MeshStandardMaterial) em todas as cenas. Nome TOON mantido por compatibilidade.
export function TOON(params = {}) {
  const { roughness = 0.75, metalness = 0, ...rest } = params;
  return new THREE.MeshStandardMaterial({ roughness, metalness, envMapIntensity: 0.55, ...rest });
}
const _mats = new Map();
export function M(color, rough = 0.7, extra = null) {
  const key = color + "|" + (extra ? JSON.stringify(extra) : "");
  if (_mats.has(key)) return _mats.get(key);
  const m = TOON({ color, roughness: rough, ...(extra || {}) });
  _mats.set(key, m);
  return m;
}
const LINHA = new THREE.MeshBasicMaterial({ color: R09.contorno, side: THREE.BackSide });
const _bb = new Map();
// casco invertido: cópia da geometria em BackSide, 3% maior (espessura limitada em objetos grandes), centrada no objeto
export function contorno(m, k = 0.03) {
  const g = m.geometry;
  if (!_bb.has(g)) { g.computeBoundingBox(); const b = g.boundingBox; _bb.set(g, [b.getCenter(new THREE.Vector3()), b.getSize(new THREE.Vector3())]); }
  const [c, sz] = _bb.get(g);
  const o = new THREE.Mesh(g, LINHA);
  const ws = new THREE.Vector3(); m.getWorldScale(ws);
  const sx = 1 + Math.min(k, 0.14 / Math.max(1e-3, sz.x * Math.abs(m.scale.x || 1))), sy = 1 + Math.min(k, 0.14 / Math.max(1e-3, sz.y * Math.abs(m.scale.y || 1))), sz2 = 1 + Math.min(k, 0.14 / Math.max(1e-3, sz.z * Math.abs(m.scale.z || 1)));
  o.scale.set(sx, sy, sz2);
  o.position.set(c.x * (1 - sx), c.y * (1 - sy), c.z * (1 - sz2));
  o.userData.contorno = true;
  m.add(o);
  return o;
}

export function gradTex(top, bottom) {
  const c = document.createElement("canvas");
  c.width = 4; c.height = 256;
  const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// mapa de ambiente (céu de fim de tarde) para reflexos e luz indireta realista; um só para todas as cenas
let _env = null;
function envMap(renderer) {
  if (_env) return _env;
  const c = document.createElement("canvas"); c.width = 256; c.height = 128;
  const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#5d8fcf"); gr.addColorStop(0.45, "#cfe0f0"); gr.addColorStop(0.5, "#f6d7ad"); gr.addColorStop(0.56, "#8c7a68"); gr.addColorStop(1, "#4a4038");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  const sun = g.createRadialGradient(70, 52, 0, 70, 52, 30); sun.addColorStop(0, "rgba(255,240,210,1)"); sun.addColorStop(1, "rgba(255,200,140,0)");
  g.fillStyle = sun; g.fillRect(0, 0, 256, 128);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer); _env = pm.fromEquirectangular(t).texture; pm.dispose();
  return _env;
}
// grão de filme: 4 texturas de ruído fixas, sorteadas por quadro (determinístico)
let _grain = null;
function grainTiles() {
  if (_grain) return _grain;
  _grain = [0, 1, 2, 3].map((k) => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d"), im = g.createImageData(256, 256), r = mulberry32(91 + k);
    for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 120; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  });
  return _grain;
}
let _vin = null;
function vinheta(ctx) {
  if (!_vin) { _vin = ctx.createRadialGradient(540, 900, 380, 540, 960, 1250); _vin.addColorStop(0, "rgba(10,8,20,0)"); _vin.addColorStop(1, "rgba(10,8,20,0.55)"); }
  return _vin;
}
export function createToyStage(canvas, { ceu = ["#5E8FCB", "#F2D3A8"], nevoa = [60, 260], corNevoa = null, fov = 40,
  exposicao = 1.0, luz = 1, sombra = 60, nuvens = 14 } = {}) {
  const renderer = sharedRenderer();
  const ctx = canvas.getContext("2d");
  const scene = new THREE.Scene();
  if (Array.isArray(ceu)) scene.background = gradTex(ceu[0], ceu[1]);
  else scene.background = new THREE.Color(ceu);
  const fogC = corNevoa ?? (Array.isArray(ceu) ? ceu[1] : ceu);
  if (nevoa) scene.fog = new THREE.Fog(fogC, nevoa[0], nevoa[1]);
  const cam = new THREE.PerspectiveCamera(fov, 1080 / 1920, 0.05, 2000);
  scene.environment = envMap(renderer);
  const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x6e5a4c, 0.55 * luz);
  const key = new THREE.DirectionalLight(0xffd2a0, 3.2 * luz);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 3;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.04;
  const rim = new THREE.DirectionalLight(0xffa868, 1.1 * luz); // luz de recorte quente de fim de tarde
  scene.add(hemi, key, key.target, rim, rim.target);
  function sol(x = 0, z = 0, size = sombra, y = 0) {
    key.position.set(x - 1.2 * size, y + 0.9 * size, z + 0.6 * size);
    key.target.position.set(x, y, z);
    rim.position.set(x + size, y + 0.6 * size, z - size);
    rim.target.position.set(x, y, z);
    Object.assign(key.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 0.5, far: size * 5 });
    key.shadow.camera.updateProjectionMatrix();
  }
  sol();
  if (nuvens) {
    const r = mulberry32(777);
    for (let i = 0; i < nuvens; i++) {
      const n = nuvem(800 + i, 0xffffff, true);
      const a = (i / nuvens) * Math.PI * 2 + r() * 0.3, d = 330 + r() * 120;
      n.scale.setScalar(9 + r() * 9);
      n.position.set(Math.cos(a) * d, 70 + r() * 110, Math.sin(a) * d);
      scene.add(n);
    }
  }
  // speed lines (2D, determinísticas): st.vel = 0..1 antes do draw; st.velT = tempo para sortear as linhas
  const stg = { vel: 0, velT: 0, velC: [540, 900] };
  function speedLines() {
    if (stg.vel <= 0.01) return;
    const r = mulberry32(1 + Math.floor(stg.velT * 24));
    ctx.save();
    ctx.strokeStyle = "rgba(255,244,214,0.9)";
    ctx.lineCap = "round";
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, r0 = 380 + r() * 300, len = (120 + r() * 380) * stg.vel;
      ctx.globalAlpha = 0.25 + 0.55 * r() * stg.vel;
      ctx.lineWidth = 2 + r() * 5;
      const [cx, cy] = stg.velC;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len)); ctx.stroke();
    }
    ctx.restore();
  }
  // ov = { cor: "#fff", a: 0..1 } pinta um véu por cima (nuvem, escurecer)
  let contornado = false;
  function draw(sc = scene, cm = cam, ov = null) {
    if (!contornado) { contornar(scene); contornado = true; }
    if (sc !== scene && !sc.userData.contornado) { contornar(sc); sc.userData.contornado = true; }
    renderer.toneMappingExposure = exposicao;
    // padrão único de câmera: "na mão" bem leve (ruído suave determinístico), aplicado e desfeito em volta do render
    const T = stg.T || 0, hx = (Math.sin(T * 1.7) + Math.sin(T * 2.9 + 1.3) * 0.5) * 0.0035 * stg.mao, hy = (Math.sin(T * 1.3 + 2.1) + Math.sin(T * 3.7) * 0.4) * 0.003 * stg.mao;
    cm.rotation.x += hy; cm.rotation.y += hx;
    renderer.render(sc, cm);
    cm.rotation.x -= hy; cm.rotation.y -= hx;
    ctx.globalAlpha = 1;
    // gradação de cor única (contraste suave, saturação contida) + desfoque opcional
    const bl = stg.blur + stg.vel * 1.6;
    ctx.filter = (bl > 0.3 ? `blur(${bl.toFixed(1)}px) ` : "") + "contrast(1.06) saturate(0.9)";
    ctx.drawImage(renderer.domElement, 0, 0);
    ctx.filter = "none";
    // bloom 2D (padrão doc): passa-alta do brilho em 1/4 da resolução, desfocado e somado em "screen"
    if (stg.bloom > 0) {
      if (!stg._bc) { stg._bc = document.createElement("canvas"); stg._bc.width = 270; stg._bc.height = 480; stg._bx = stg._bc.getContext("2d"); }
      const bx = stg._bx; bx.globalCompositeOperation = "copy"; bx.filter = "brightness(0.55) contrast(3.2) blur(5px)";
      bx.drawImage(renderer.domElement, 0, 0, 270, 480); bx.filter = "none";
      ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = Math.min(1, stg.bloom); ctx.filter = "blur(10px)";
      ctx.drawImage(stg._bc, 0, 0, 1080, 1920); ctx.filter = "none"; ctx.globalAlpha = Math.min(1, stg.bloom * 0.8); ctx.drawImage(stg._bc, 0, 0, 1080, 1920); ctx.restore();
    }
    // R10: sem linhas de velocidade de desenho; velocidade vira desfoque de movimento leve (acima)
    if (ov && ov.a > 0) { ctx.globalAlpha = Math.min(1, ov.a); ctx.fillStyle = ov.cor; ctx.fillRect(0, 0, 1080, 1920); ctx.globalAlpha = 1; }
    // vinheta + grão de filme
    ctx.fillStyle = vinheta(ctx); ctx.fillRect(0, 0, 1080, 1920);
    const gt = grainTiles(), fr = Math.floor(T * 30);
    ctx.save(); ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = ctx.createPattern(gt[fr % 4], "repeat"); ctx.translate((fr * 37) % 256, (fr * 71) % 256); ctx.fillRect(-256, -256, 1080 + 512, 1920 + 512);
    ctx.restore();
    // corte padrão: entra e sai de cada cena com um "dip" de 5 quadros
    const D = stg.D || 1e9, dip = Math.max(1 - T / 0.17, 1 - (D - T) / 0.12, 0);
    if (dip > 0) { ctx.globalAlpha = Math.min(1, dip) * 0.85; ctx.fillStyle = "#0b0a12"; ctx.fillRect(0, 0, 1080, 1920); ctx.globalAlpha = 1; }
  }
  stg.blur = 0; stg.bloom = 0.35; stg.mao = 1; stg.T = 0; stg.D = 0;
  return Object.assign(stg, { renderer, scene, cam, key, rim, hemi, sol, draw, ctx, warm: { renderer, scene, camera: cam } });
}

/* ---------- geometria ---------- */
const _rb = new Map();
export function roundBox(w, h, d, r = 0.2) {
  const key = [w, h, d, r].map((v) => v.toFixed(3)).join();
  if (_rb.has(key)) return _rb.get(key);
  r = Math.max(0.005, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01));
  const bs = r * 0.6, bt = r;
  const sw = w - 2 * bs, sd = d - 2 * bs, cr = Math.min(r * 0.6, sw / 2 - 0.001, sd / 2 - 0.001);
  const s = new THREE.Shape();
  const x0 = -sw / 2, y0 = -sd / 2;
  s.moveTo(x0 + cr, y0);
  s.lineTo(x0 + sw - cr, y0); s.quadraticCurveTo(x0 + sw, y0, x0 + sw, y0 + cr);
  s.lineTo(x0 + sw, y0 + sd - cr); s.quadraticCurveTo(x0 + sw, y0 + sd, x0 + sw - cr, y0 + sd);
  s.lineTo(x0 + cr, y0 + sd); s.quadraticCurveTo(x0, y0 + sd, x0, y0 + sd - cr);
  s.lineTo(x0, y0 + cr); s.quadraticCurveTo(x0, y0, x0 + cr, y0);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, h - 2 * bt), bevelEnabled: true, bevelThickness: bt,
    bevelSize: bs, bevelSegments: 3, curveSegments: 4 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bt, 0);
  g.computeVertexNormals();
  _rb.set(key, g);
  return g;
}

export function mesh(geo, color, parent, rough = 0.7, linha = true) {
  const m = new THREE.Mesh(geo, typeof color === "object" ? color : M(color, rough));
  m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  if (linha && !geo.isPlaneGeometry && !(geo.type === "PlaneGeometry")) m.userData.querLinha = true;
  return m;
}
// adiciona os contornos depois que as escalas foram definidas (chame uma vez no fim da montagem da cena)
export const USA_CONTORNO = false; // R10: sem contorno de desenho
export function contornar(root) {
  if (!USA_CONTORNO) return;
  const lst = [];
  root.traverse((o) => { if (o.isMesh && o.userData.querLinha && !o.userData.temLinha) lst.push(o); });
  for (const o of lst) { o.userData.temLinha = true; contorno(o); }
}
export const SPH = new THREE.SphereGeometry(1, 24, 16);

/* ---------- prédio ---------- */
// frente virada para +z. janelas: material próprio (win) para acender/apagar (emissiveIntensity).
export function predio({ w = 8, d = 8, h = 16, cor = PAL.tijolo, seed = 1, janelas = true, telhado = true } = {}) {
  const g = new THREE.Group();
  mesh(roundBox(w, h, d, 0.45), cor, g, 0.8);
  const rc = new THREE.Color(cor).multiplyScalar(0.8);
  if (telhado) { const t = mesh(roundBox(w + 0.5, 0.7, d + 0.5, 0.3), rc.getHex(), g, 0.8); t.position.y = h - 0.2; }
  const win = TOON({ color: 0x4a5e70, roughness: 0.08, metalness: 0.7, envMapIntensity: 1.2, emissive: 0xffc56a, emissiveIntensity: 0 });
  g.userData.win = win;
  if (janelas) {
    const geo = roundBox(1.0, 1.3, 0.3, 0.12);
    const cols = Math.max(1, Math.floor((w - 1.2) / 1.9)), cols2 = Math.max(1, Math.floor((d - 1.2) / 1.9));
    const rows = Math.max(1, Math.floor((h - 2.2) / 2.4));
    const n = rows * (cols + cols2) * 2;
    const inst = new THREE.InstancedMesh(geo, win, n);
    const o = new THREE.Object3D();
    let k = 0;
    for (let r = 0; r < rows; r++) {
      const y = 1.6 + r * 2.4;
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * 1.9;
        for (const sz of [1, -1]) { o.position.set(x, y, sz * (d / 2 + 0.02)); o.rotation.set(0, 0, 0); o.updateMatrix(); inst.setMatrixAt(k++, o.matrix); }
      }
      for (let c = 0; c < cols2; c++) {
        const z = (c - (cols2 - 1) / 2) * 1.9;
        for (const sx of [1, -1]) { o.position.set(sx * (w / 2 + 0.02), y, z); o.rotation.set(0, Math.PI / 2, 0); o.updateMatrix(); inst.setMatrixAt(k++, o.matrix); }
      }
    }
    inst.count = k;
    inst.receiveShadow = true;
    g.add(inst);
  }
  g.userData.h = h;
  return g;
}

/* ---------- carro / árvore / nuvem ---------- */
export function carro(cor = PAL.tijolo) {
  const g = new THREE.Group();
  const b = mesh(roundBox(2.2, 0.95, 4.2, 0.38), cor, g, 0.55); b.position.y = 0.35;
  const c = mesh(roundBox(1.85, 0.85, 2.2, 0.32), 0xbfe3ee, g, 0.3); c.position.set(0, 1.15, -0.2);
  const roof = mesh(roundBox(1.9, 0.2, 2.0, 0.08), cor, g, 0.55); roof.position.set(0, 1.85, -0.2);
  const wg = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 16); wg.rotateZ(Math.PI / 2);
  for (const [x, z] of [[1, 1.3], [-1, 1.3], [1, -1.3], [-1, -1.3]]) { const w = mesh(wg, 0x2d2f36, g, 0.8); w.position.set(x, 0.42, z); }
  for (const x of [0.65, -0.65]) { const l = mesh(SPH, M(0xfff2c0, 0.4, { emissive: 0xfff0b0, emissiveIntensity: 0.4 }), g); l.scale.set(0.2, 0.14, 0.08); l.position.set(x, 0.85, 2.1); }
  return g;
}

export function arvore(s = 1, cor = PAL.verde, seed = 1) {
  const r = mulberry32(seed);
  const g = new THREE.Group();
  const t = mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.2, 10), PAL.tronco, g, 0.9); t.position.y = 1.1;
  const n = 3;
  for (let i = 0; i < n; i++) {
    const c = mesh(SPH, i === 0 ? cor : new THREE.Color(cor).multiplyScalar(0.88 + r() * 0.2).getHex(), g, 0.85);
    const sc = 1.1 + r() * 0.5;
    c.scale.set(sc, sc * 0.95, sc);
    c.position.set((r() - 0.5) * 1.1, 2.7 + i * 0.55 + r() * 0.3, (r() - 0.5) * 1.1);
  }
  g.scale.setScalar(s);
  return g;
}

export function nuvem(seed = 1, cor = 0xffffff, ceu = false) {
  const r = mulberry32(seed);
  const g = new THREE.Group();
  const m = ceu ? TOON({ color: cor, emissive: 0xffd9b0, emissiveIntensity: 0.35, fog: false }) : M(cor, 0.95, { emissive: 0xffe6cc, emissiveIntensity: 0.25 });
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Mesh(SPH, m);
    if (!ceu) c.userData.querLinha = true;
    const s = 1 + r() * 1.3;
    c.scale.set(s, s * 0.8, s);
    c.position.set((i - 2.5) * 1.3 + r() * 0.5, r() * 0.8, (r() - 0.5) * 1.5);
    g.add(c);
  }
  return g;
}

/* ---------- rua com prédios ---------- */
// rua ao longo de z, de -len/2 a len/2. lados: prédios em x = ±(larg/2 + calc + d/2).
export function rua({ len = 160, larg = 16, calc = 4, seed = 3, predios = true, arvores = true, hMin = 9, hMax = 30,
  cores = PREDIO_CORES, chao = 0xcdbf9f } = {}) {
  const r = mulberry32(seed);
  const g = new THREE.Group();
  const ground = mesh(new THREE.PlaneGeometry(len * 4, len * 4), chao, g, 0.95);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.castShadow = false;
  const road = mesh(roundBox(larg, 0.12, len, 0.05), PAL.asfalto, g, 0.9); road.castShadow = false;
  const dash = new THREE.InstancedMesh(roundBox(0.35, 0.05, 2.4, 0.02), M(0xf3ead3, 0.8), Math.ceil(len / 6));
  const o = new THREE.Object3D();
  let k = 0;
  for (let z = -len / 2 + 3; z < len / 2; z += 6) { o.position.set(0, 0.12, z); o.updateMatrix(); dash.setMatrixAt(k++, o.matrix); }
  dash.count = k; dash.receiveShadow = true; g.add(dash);
  for (const s of [1, -1]) {
    const sw = mesh(roundBox(calc, 0.4, len, 0.12), PAL.calcada, g, 0.85);
    sw.position.x = s * (larg / 2 + calc / 2);
  }
  const buildings = [], trees = [];
  if (predios) {
    for (const s of [1, -1]) {
      let z = -len / 2;
      while (z < len / 2) {
        const w = 7 + r() * 6, d = 8 + r() * 5, h = hMin + (hMax - hMin) * Math.pow(r(), 1.3);
        const b = predio({ w, d, h, cor: cores[Math.floor(r() * cores.length)], seed: Math.floor(r() * 1e6) });
        b.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
        b.position.set(s * (larg / 2 + calc + d / 2 + 0.3), 0, z + w / 2);
        g.add(b); buildings.push(b);
        z += w + 0.6 + r() * 1.2;
      }
    }
  }
  if (arvores) {
    for (const s of [1, -1]) {
      for (let z = -len / 2 + 6 + r() * 4; z < len / 2; z += 12 + r() * 6) {
        const t = arvore(0.75 + r() * 0.35, PAL.verde, Math.floor(r() * 1e6));
        t.position.set(s * (larg / 2 + calc / 2), 0.35, z);
        g.add(t); trees.push(t);
      }
    }
  }
  return { group: g, buildings, trees, larg, calc, len };
}

/* ---------- cidade em grade (vista aérea) ---------- */
export function cidade({ n = 5, seed = 5, bloco = 26, rua: ruaW = 10, hMin = 6, hMax = 34, cores = PREDIO_CORES, chao = PAL.asfalto, verde = 0.12 } = {}) {
  const r = mulberry32(seed);
  const g = new THREE.Group();
  const pitch = bloco + ruaW, W = n * pitch;
  const gr = mesh(new THREE.PlaneGeometry(W * 4, W * 4), chao, g, 0.95); gr.rotation.x = -Math.PI / 2; gr.castShadow = false;
  const buildings = [], trees = [], lots = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const cx = (i - (n - 1) / 2) * pitch, cz = (j - (n - 1) / 2) * pitch;
    const base = mesh(roundBox(bloco, 0.5, bloco, 0.2), PAL.calcada, g, 0.85); base.position.set(cx, 0, cz);
    if (r() < verde) {
      const pk = mesh(roundBox(bloco - 2, 0.3, bloco - 2, 0.2), PAL.verde, g, 0.9); pk.position.set(cx, 0.4, cz);
      for (let k = 0; k < 5; k++) { const t = arvore(1 + r() * 0.6, PAL.verde, Math.floor(r() * 1e6)); t.position.set(cx + (r() - 0.5) * (bloco - 6), 0.6, cz + (r() - 0.5) * (bloco - 6)); g.add(t); trees.push(t); }
      continue;
    }
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const w = bloco / 2 - 1.5 - r() * 2, d = bloco / 2 - 1.5 - r() * 2, h = hMin + (hMax - hMin) * Math.pow(r(), 1.5);
      const bd = predio({ w, d, h, cor: cores[Math.floor(r() * cores.length)], seed: Math.floor(r() * 1e6) });
      bd.position.set(cx + a * bloco / 4, 0.5, cz + b * bloco / 4);
      g.add(bd); buildings.push(bd); lots.push([cx + a * bloco / 4, cz + b * bloco / 4]);
    }
  }
  return { group: g, buildings, trees, pitch, size: W };
}

/* ---------- bando de pássaros instanciado (barato) ---------- */
export function bando(scene, { n = 120, seed = 4, cor = 0x3d4a5c } = {}) {
  const r = mulberry32(seed);
  const body = new THREE.InstancedMesh(SPH, M(cor, 0.7), n), wing = new THREE.InstancedMesh(SPH, M(cor, 0.7), n * 2);
  scene.add(body, wing);
  const d = Array.from({ length: n }, () => [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1, r() * 6.28, 0.8 + r() * 0.5]);
  const o = new THREE.Object3D(), w = new THREE.Object3D();
  // update(t, centro [x,y,z], espalhar [sx,sy,sz], direção (rad no plano xz), escala)
  function update(t, c, sp, dir = 0, s = 1) {
    d.forEach(([a, b, e, ph, k], i) => {
      o.position.set(c[0] + a * sp[0] + Math.sin(t * 0.7 + ph) * 1.5, c[1] + b * sp[1] + Math.sin(t * 1.3 + ph) * 0.8, c[2] + e * sp[2]);
      o.rotation.set(0, dir, 0); o.scale.set(0.5 * s * k, 0.3 * s * k, 0.3 * s * k); o.updateMatrix(); body.setMatrixAt(i, o.matrix);
      const fl = Math.sin(t * 9 * k + ph) * 0.8;
      for (const sd of [1, -1]) {
        w.position.copy(o.position); w.rotation.set(sd * fl, dir, 0, "YXZ");
        w.updateMatrix();
        const m = new THREE.Matrix4().makeTranslation(0, 0, sd * 0.55 * s * k).premultiply(new THREE.Matrix4().makeRotationX(0));
        const sc = new THREE.Matrix4().makeScale(0.35 * s * k, 0.06 * s * k, 0.6 * s * k);
        w.matrix.multiply(m).multiply(sc);
        wing.setMatrixAt(i * 2 + (sd > 0 ? 0 : 1), w.matrix);
      }
    });
    body.instanceMatrix.needsUpdate = true; wing.instanceMatrix.needsUpdate = true;
  }
  return { update, body, wing };
}

/* ---------- explosão de bolinhas (transformação) ---------- */
export function createBurst(scene, { n = 26, seed = 9, cores = [PAL.amarelo, 0xffffff, PAL.pele, PAL.tijolo], raio = 1.6, tam = 0.13 } = {}) {
  const r = mulberry32(seed);
  const meshes = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(SPH, M(cores[i % cores.length], 0.5, { emissive: cores[i % cores.length], emissiveIntensity: 0.35 }));
    const u = r() * 2 - 1, th = r() * Math.PI * 2;
    m.userData.v = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(th), Math.abs(u) * 0.9 + 0.3, Math.sqrt(1 - u * u) * Math.sin(th)).multiplyScalar(raio * (0.6 + r() * 0.6));
    m.userData.s = tam * (0.6 + r() * 0.8);
    m.visible = false;
    scene.add(m); meshes.push(m);
  }
  // at(t, t0, x, y, z, dur): bolinhas saem de (x,y,z) em t0 e somem em dur
  function at(t, t0, x, y, z, dur = 0.9) {
    const k = (t - t0) / dur;
    for (const m of meshes) {
      m.visible = k > 0 && k < 1;
      if (!m.visible) continue;
      const e = ease.outCubic(k);
      m.position.set(x + m.userData.v.x * e, y + m.userData.v.y * e - 0.6 * k * k, z + m.userData.v.z * e);
      m.scale.setScalar(m.userData.s * (1 - k) * (k < 0.15 ? k / 0.15 : 1));
    }
  }
  return { meshes, at };
}

/* ---------- utilidades de movimento ---------- */
export const sway = (t, f = 0.3, a = 1, ph = 0) => Math.sin(t * f * Math.PI * 2 + ph) * a;
export function shaker(seed = 1) {
  const r = mulberry32(seed);
  const ph = Array.from({ length: 6 }, () => r() * 10);
  return (t, amp = 0.2) => [
    (Math.sin(t * 37 + ph[0]) + Math.sin(t * 23 + ph[1])) * 0.5 * amp,
    (Math.sin(t * 41 + ph[2]) + Math.sin(t * 29 + ph[3])) * 0.5 * amp,
    (Math.sin(t * 31 + ph[4]) + Math.sin(t * 19 + ph[5])) * 0.5 * amp,
  ];
}
export { THREE, clamp, lerp, ease, mulberry32 };
