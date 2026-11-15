/**
 * kit.js — shared Three.js kit for "mundo-congela-5s" (1080x1920, 30 fps).
 *
 * HOW TO USE IN A SCENE (compositions/fNN.html, inside <template>):
 *
 *   <canvas id="fNN-canvas" width="1080" height="1920"></canvas>
 *   <script>
 *     // classic script: register buildReady synchronously so the first seek waits for it
 *     window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
 *     window.__hf.buildReady["fNN"] = import("./assets/lib/kit.js").then(async (K) => {
 *       const { THREE } = K;
 *       const stage = K.createStage({ canvas: document.getElementById("fNN-canvas") });
 *       const city = K.buildCityGrid({ seed: 7 });
 *       stage.scene.add(city.group);
 *       function render(t) {            // t = seconds LOCAL to the scene
 *         stage.camera.position.set(0, 120 - t * 10, 60);
 *         stage.camera.lookAt(0, 0, 0);
 *         K.setFrost(city.group, K.range(t, 3, 4));
 *         stage.render();
 *       }
 *       await K.bindSeek(document.getElementById("fNN-canvas"), render, { warm: [stage] });
 *     });
 *   </script>
 *
 * API
 *   THREE                                    re-export of ./three.module.js (r170)
 *   W, H, FPS                                1080, 1920, 30
 *   PALETTE                                  hex numbers: coldGrey frost ice amber accent night ground road
 *   CSS                                      same palette as "#rrggbb" strings
 *   mulberry32(seed) -> () => [0,1)          seeded PRNG
 *   clamp(x,a=0,b=1), lerp(a,b,t), range(t,a,b) (0..1 ramp of t between a and b), smoothstep(a,b,x)
 *   ease.{linear,inQuad,outQuad,inOutQuad,inCubic,outCubic,inOutCubic,outExpo,inOutExpo,inOutSine,outBack}
 *   createRenderer(canvas) -> THREE.WebGLRenderer   1080x1920, pixelRatio 1, preserveDrawingBuffer,
 *                                            ACES tone mapping, sRGB, soft (PCFSoft) shadows
 *   addMaqueteLights(scene, {intensity=1, target=[0,0,0], shadowSize=200})
 *                                         -> { key, rim, hemi }  warm key (shadows) + cool rim + hemisphere
 *   maqueteMaterial(color, {roughness=0.8, metalness=0}) -> MeshStandardMaterial (matte, stores baseColor)
 *   createStage({canvas, fov=35, near=0.1, far=5000, background=PALETTE.night, fog=null, lights=true})
 *                                         -> { renderer, scene, camera, lights, render() }
 *   buildCityGrid({seed=1, cols=7, rows=9, block=26, street=10, lots=2, minH=4, maxH=34,
 *                  accent=true, trees=true, cars=true})
 *                                         -> { group, ground, buildings[], cars[], trees[], size:{w,d} }
 *                                            centred on the origin, y up, ground at y=0
 *   setFrost(object3d, amount 0..1, {tint=PALETTE.frost}) lerps every maqueteMaterial toward frost/ice
 *                                            (per material cap: material.userData.frostMax, default 0.85)
 *   bindSeek(el, render, {warm=[]}) -> Promise   wires window "hf-seek" to render(localTime);
 *                                            localTime = global time - the scene host's data-start.
 *                                            warm: stages to compileAsync before the first frame.
 *   sceneStart(el) -> seconds                start of the host that contains el (sum of ancestor data-start)
 *
 * Rules: no requestAnimationFrame, no Date.now, no Math.random. render(t) must be a pure function of t.
 */
import * as THREE from "./three.module.js";
export { THREE };

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const PALETTE = {
  coldGrey: 0x8d96a2,
  frost: 0xeef2f6,
  ice: 0x8fcbf2,
  amber: 0xe8b24a,
  accent: 0xd8432f,
  night: 0x0b1018, // space / dark background
  ground: 0x6f7782, // blocks base
  road: 0x4a5059,
};
export const CSS = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [k, "#" + v.toString(16).padStart(6, "0")]),
);

/* ---------- math ---------- */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (t, a, b) => clamp((t - a) / (b - a));
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
};

/* ---------- renderer / look ---------- */
export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function addMaqueteLights(scene, { intensity = 1, target = [0, 0, 0], shadowSize = 200 } = {}) {
  const hemi = new THREE.HemisphereLight(0xdfe8f2, 0x3a3f47, 0.9 * intensity);
  const key = new THREE.DirectionalLight(0xffe2bf, 2.6 * intensity); // warm key
  key.position.set(target[0] - 120, target[1] + 220, target[2] + 90);
  key.target.position.set(...target);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.6;
  key.shadow.radius = 4;
  const s = shadowSize;
  Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 800 });
  const rim = new THREE.DirectionalLight(0x9fcfff, 1.4 * intensity); // cool rim
  rim.position.set(target[0] + 160, target[1] + 90, target[2] - 200);
  rim.target.position.set(...target);
  scene.add(hemi, key, key.target, rim, rim.target);
  return { key, rim, hemi };
}

export function maqueteMaterial(color, { roughness = 0.8, metalness = 0 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: Math.max(0.5, roughness), metalness });
  m.userData.baseColor = new THREE.Color(color);
  m.userData.baseRough = m.roughness;
  m.userData.maquete = true;
  return m;
}

export function createStage({
  canvas,
  fov = 35,
  near = 0.1,
  far = 5000,
  background = PALETTE.night,
  fog = null,
  lights = true,
} = {}) {
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  scene.background = background == null ? null : new THREE.Color(background);
  if (fog) scene.fog = new THREE.Fog(fog.color ?? PALETTE.coldGrey, fog.near ?? 200, fog.far ?? 900);
  const camera = new THREE.PerspectiveCamera(fov, W / H, near, far);
  const l = lights ? addMaqueteLights(scene) : null;
  return { renderer, scene, camera, lights: l, render: () => renderer.render(scene, camera) };
}

/* ---------- city ---------- */
const CITY_TONES = [0xd9dde2, 0xc7ccd3, 0xb6bdc6, 0xe6e3dc, 0xa9b1bb, 0xcfd3d8];

export function buildCityGrid({
  seed = 1,
  cols = 7,
  rows = 9,
  block = 26,
  street = 10,
  lots = 2,
  minH = 4,
  maxH = 34,
  accent = true,
  trees = true,
  cars = true,
} = {}) {
  const rnd = mulberry32(seed);
  const group = new THREE.Group();
  const pitch = block + street;
  const w = cols * pitch + street;
  const d = rows * pitch + street;

  const mats = CITY_TONES.map((c) => maqueteMaterial(c, { roughness: 0.85 }));
  const roadMat = maqueteMaterial(PALETTE.road, { roughness: 0.95 });
  roadMat.userData.frostMax = 0.4; // roads frost less, so the frame keeps contrast
  const baseMat = maqueteMaterial(0x9aa2ac, { roughness: 0.9 });
  const accentMat = maqueteMaterial(PALETTE.accent, { roughness: 0.7 });
  const treeMat = maqueteMaterial(0x7f9488, { roughness: 0.9 });
  const carMats = [0xeef2f6, 0x3d4450, 0x8d96a2, 0xb8c0ca].map((c) => maqueteMaterial(c, { roughness: 0.6 }));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(w * 3, d * 3), roadMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const box = new THREE.BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  const buildings = [];
  const treeList = [];
  const carList = [];
  const treeGeo = new THREE.IcosahedronGeometry(1, 0);
  const accentIdx = accent ? Math.floor(rnd() * cols * rows) : -1;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x0 = -w / 2 + street + i * pitch;
      const z0 = -d / 2 + street + j * pitch;
      const base = new THREE.Mesh(box, baseMat); // sidewalk slab
      base.scale.set(block, 0.6, block);
      base.position.set(x0 + block / 2, 0, z0 + block / 2);
      base.receiveShadow = true;
      group.add(base);
      const park = rnd() < 0.08;
      const lot = block / lots;
      for (let a = 0; a < lots; a++) {
        for (let b = 0; b < lots; b++) {
          const cx = x0 + lot * (a + 0.5);
          const cz = z0 + lot * (b + 0.5);
          if (park || rnd() < 0.12) {
            if (trees) {
              const tr = new THREE.Mesh(treeGeo, treeMat);
              const s = 2 + rnd() * 1.5;
              tr.scale.set(s, s * 1.3, s);
              tr.position.set(cx + (rnd() - 0.5) * 4, 0.6 + s, cz + (rnd() - 0.5) * 4);
              tr.castShadow = tr.receiveShadow = true;
              group.add(tr);
              treeList.push(tr);
            }
            continue;
          }
          const tall = rnd();
          const h = minH + (maxH - minH) * tall * tall * (0.6 + 0.4 * rnd());
          const fw = lot * (0.62 + rnd() * 0.25);
          const fd = lot * (0.62 + rnd() * 0.25);
          const isAccent = accentIdx === i * rows + j && a === 0 && b === 0;
          const m = new THREE.Mesh(box, isAccent ? accentMat : mats[Math.floor(rnd() * mats.length)]);
          m.scale.set(fw, h, fd);
          m.position.set(cx, 0.6, cz);
          m.castShadow = m.receiveShadow = true;
          group.add(m);
          buildings.push(m);
          if (h > maxH * 0.55 && rnd() < 0.5) {
            // rooftop box
            const r = new THREE.Mesh(box, m.material);
            r.scale.set(fw * 0.4, 2.2, fd * 0.4);
            r.position.set(cx, 0.6 + h, cz);
            r.castShadow = true;
            group.add(r);
          }
        }
      }
    }
  }
  if (cars) {
    const carGeo = new THREE.BoxGeometry(2.2, 1.4, 4.4);
    carGeo.translate(0, 0.7, 0);
    for (let i = 0; i <= cols; i++) {
      const x = -w / 2 + street / 2 + i * pitch;
      const n = 2 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) {
        const c = new THREE.Mesh(carGeo, carMats[Math.floor(rnd() * carMats.length)]);
        const lane = rnd() < 0.5 ? -1 : 1;
        c.position.set(x + lane * 2.2, 0, -d / 2 + rnd() * d);
        c.userData.dir = lane;
        c.castShadow = true;
        group.add(c);
        carList.push(c);
      }
    }
  }
  return { group, ground, buildings, cars: carList, trees: treeList, size: { w, d } };
}

const _frostA = new THREE.Color();
const _frostB = new THREE.Color();
export function setFrost(object3d, amount, { tint = PALETTE.frost } = {}) {
  const a = clamp(amount);
  _frostB.set(tint);
  const ice = new THREE.Color(PALETTE.ice);
  object3d.traverse((o) => {
    const m = o.material;
    if (!m || !m.userData || !m.userData.maquete) return;
    _frostA.copy(m.userData.baseColor).lerp(_frostB, a * (m.userData.frostMax ?? 0.85));
    m.color.copy(_frostA);
    if (m.emissive) m.emissive.copy(ice).multiplyScalar(0.12 * a);
    m.roughness = lerp(m.userData.baseRough, 0.55, a);
  });
}

/* ---------- seek ---------- */
export function sceneStart(el) {
  let s = 0;
  for (let n = el; n; n = n.parentElement) {
    if (n.hasAttribute && n.hasAttribute("data-composition-src") && n.hasAttribute("data-start")) {
      s += parseFloat(n.getAttribute("data-start")) || 0;
    }
  }
  return s;
}

export async function bindSeek(el, render, { warm = [] } = {}) {
  for (const st of warm) {
    if (st.renderer.compileAsync) await st.renderer.compileAsync(st.scene, st.camera);
  }
  let last = null;
  const draw = (globalT) => {
    const t = Math.max(0, globalT - sceneStart(el));
    if (t === last) return;
    last = t;
    render(t);
  };
  window.addEventListener("hf-seek", (e) => draw(e.detail.time));
  draw(0);
  // read one pixel back so the first (slow) GPU frame finishes inside setup
  for (const st of warm) {
    const gl = st.renderer.getContext();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  }
}
