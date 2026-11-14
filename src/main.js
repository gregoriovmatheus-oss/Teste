import * as THREE from 'three';
import './style.css';
import { PostFX } from './core/post.js';
import { AudioEngine } from './core/audio.js';
import { SpaceScene } from './space/spaceScene.js';
import { CityScene } from './city/cityScene.js';
import { Director, T, CAPTIONS } from './director.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('gl');
const ui = {
  start: document.getElementById('start'),
  startBtn: document.getElementById('startBtn'),
  loading: document.getElementById('loading'),
  caption: document.getElementById('caption'),
  title: document.getElementById('title'),
  chapter: document.getElementById('chapter'),
  chapterN: document.getElementById('chapterN'),
  chapterName: document.getElementById('chapterName'),
  gVal: document.getElementById('gVal'),
  gBar: document.getElementById('gBar'),
  sim: document.getElementById('simVal'),
  simBar: document.getElementById('simBar'),
  slow: document.getElementById('slowmo'),
  hud: document.getElementById('hud'),
  end: document.getElementById('end'),
  replay: document.getElementById('replay'),
  progress: document.getElementById('progressBar'),
  loc: document.getElementById('loc'),
  status: document.getElementById('status'),
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
renderer.setClearColor(0x000000, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; // the final pass does ACES + sRGB itself
renderer.autoClear = true;
if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = 0.5;

const maxDPR = Math.min(window.devicePixelRatio || 1, params.has('hq') ? 2 : 1.5);
let quality = params.has('q') ? parseFloat(params.get('q')) : maxDPR;

let space, city, director, post;
const audio = new AudioEngine();

function setSize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(quality);
  renderer.setSize(w, h, false);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const b = renderer.getDrawingBufferSize(new THREE.Vector2());
  post?.setSize(b.x, b.y);
  for (const c of [space?.camera, city?.camera]) if (c) { c.aspect = w / h; c.updateProjectionMatrix(); }
  // cinematic letterbox (≈2.2:1) sized in CSS so captions can live in the bars
  const target = 2.2;
  const bar = w / h < target ? Math.max(0, (h - w / target) / 2) : 0;
  document.documentElement.style.setProperty('--bar', Math.min(bar, h * 0.14) + 'px');
}

async function init() {
  ui.loading.textContent = 'Gerando o planeta…';
  await frame();
  space = new SpaceScene(renderer);
  ui.loading.textContent = 'Construindo a cidade…';
  await frame();
  city = new CityScene(renderer);
  post = new PostFX(renderer);
  director = new Director(space, city, audio);
  setSize();
  ui.loading.textContent = 'Compilando shaders…';
  await frame();
  // warm up both scenes so there is no hitch at the cuts
  for (const tt of [0.5, 13, 18, 22, 27, 31, 36, 42, 47]) {
    director.update(tt, 1 / 60);
    const sc = director.sceneAt(tt) === 'space' ? space : city;
    renderer.compile(sc.scene, sc.camera);
  }
  director.fired.clear();
  // reset city simulation to t=0
  city.lastStep = null;
  ui.loading.textContent = '';
  ui.startBtn.disabled = false;
  ui.start.classList.add('ready');
}

const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

let t = 0;
let playing = false;
let last = performance.now();
let fpsAcc = 0, fpsN = 0, fpsTimer = 0;
const seekTo = params.has('t') ? parseFloat(params.get('t')) : 0;
const freeze = params.has('freeze');

function seek(target) {
  // deterministic fast-forward of the simulation
  t = 0;
  const step = 1 / 30;
  while (t + step < target) {
    t += step;
    director.update(t, step);
    if (t >= T.CITY_IN - 0.5) city.update(t, step, cityEnv(t));
    space.update(t, { earth: director.earthState });
  }
  t = target;
  director.fired.clear();
  for (const key of ['riser', 'off', 'dive', 'cityin', 'up', 'onriser', 'on', 'slam']) director.fired.add(key);
}

function cityEnv(tt) {
  const c = city.camera;
  const h = renderer.getDrawingBufferSize(new THREE.Vector2()).y;
  return {
    gravity: director.gravityCity,
    tOff: T.CITY_OFF,
    tOn: tt >= T.CITY_ON ? T.CITY_ON : null,
    camera: c,
    focus: new THREE.Vector3().copy(c.position).add(c.getWorldDirection(new THREE.Vector3()).multiplyScalar(40)),
    pixelScale: h / (2 * Math.tan(THREE.MathUtils.degToRad(c.fov) / 2)),
    damage: Math.min(1, Math.max(0, (tt - T.CITY_ON - 0.5) / 4)),
  };
}

let lastCaption = -1;
let lastChapter = '';
function updateUI(tt) {
  const hud = director.hud(tt);
  ui.gVal.textContent = hud.g.toFixed(2);
  ui.gBar.style.transform = `scaleX(${hud.g / 9.81})`;
  ui.hud.classList.toggle('zero', hud.zero);
  ui.sim.textContent = hud.sim.toFixed(2);
  ui.simBar.style.transform = `scaleX(${hud.sim / 5})`;
  ui.slow.textContent = hud.zero ? `CÂMERA LENTA · ${hud.slowmo.toFixed(1)}×` : 'TEMPO REAL';
  ui.hud.classList.toggle('show', tt > 7 && tt < T.END - 3);
  ui.title.classList.toggle('show', tt > 0.9 && tt < 6.2);
  const ci = CAPTIONS.findIndex((c) => tt >= c.a && tt < c.b);
  if (ci !== lastCaption) {
    lastCaption = ci;
    if (ci >= 0) { ui.caption.innerHTML = CAPTIONS[ci].text; ui.caption.classList.add('show'); }
    else ui.caption.classList.remove('show');
  }
  const ch = hud.chapter;
  const key = ch ? ch.n : '';
  if (key !== lastChapter && tt > 0.5) {
    lastChapter = key;
    ui.chapterN.textContent = ch.n;
    ui.chapterName.textContent = ch.name;
    ui.chapter.classList.remove('show');
    void ui.chapter.offsetWidth;
    ui.chapter.classList.add('show');
  }
  const inCity = director.sceneAt(tt) === 'city';
  ui.loc.textContent = inCity ? 'CIDADE · 18:42 · NÍVEL DA RUA' : (tt < T.DIVE ? 'ÓRBITA · 36.000 km' : 'ÓRBITA BAIXA');
  ui.progress.style.transform = `scaleX(${Math.min(1, tt / T.END)})`;
  ui.end.classList.toggle('show', tt >= T.END - 0.3);
}

let stillDone = false;
function render(now) {
  if (params.has('still') && stillDone) return;
  requestAnimationFrame(render);
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!director) return;
  if (playing && !freeze) t += dt; else dt = 0;
  if (t > T.END + 0.5) { t = T.END + 0.5; }

  const { sceneKey } = director.update(t, dt || 1 / 60);
  if (t >= T.CITY_IN - 0.5) city.update(t, dt, cityEnv(t));
  space.update(t, { earth: director.earthState });
  const sc = sceneKey === 'space' ? space : city;
  if (sceneKey === 'space') space.earth.setPixelScale(post.size.y, space.camera.fov);
  if (t <= T.END + 0.4) post.render(sc.scene, sc.camera, director.post, t);
  updateUI(t);

  // adaptive resolution
  if (playing && !params.has('q')) {
    fpsAcc += dt; fpsN++; fpsTimer += dt;
    if (fpsTimer > 2.0) {
      const fps = fpsN / fpsAcc;
      if (fps < 40 && quality > 0.6) { quality = Math.max(0.6, quality - 0.15); setSize(); }
      else if (fps > 58 && quality < maxDPR) { quality = Math.min(maxDPR, quality + 0.1); setSize(); }
      fpsAcc = 0; fpsN = 0; fpsTimer = 0;
    }
  }
  if (params.has('still') && director) { const t1 = performance.now(); renderer.getContext().finish(); stillDone = true; window.__zg.frameMs = t1 - now; }
  if (params.has('debug')) ui.status.textContent = `t=${t.toFixed(2)} ${sceneKey} q=${quality.toFixed(2)} calls=${renderer.info.render.calls}`;
}

function begin() {
  ui.start.classList.add('hidden');
  audio.start();
  playing = true;
  last = performance.now();
}

ui.startBtn.addEventListener('click', begin);
ui.replay.addEventListener('click', () => location.reload());
window.addEventListener('resize', setSize);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { playing = !playing; playing ? audio.resume() : audio.suspend(); e.preventDefault(); }
  if (e.code === 'KeyH') document.body.classList.toggle('nohud');
  if (e.code === 'KeyR') location.reload();
});

init().then(() => {
  for (const k of (params.get('hide') || '').split(',').filter(Boolean)) { const o = city[k]?.mesh || city[k]; if (o) o.visible = false; }
  if (params.has('nopost')) director.post.__nopost = true;
  if (seekTo > 0) seek(seekTo);
  if (params.has('autoplay') || seekTo > 0) begin();
  requestAnimationFrame(render);
  window.__zg = { get t() { return t; }, set t(v) { t = v; }, renderer, director, city, space, ready: true };
}).catch((err) => {
  console.error(err);
  ui.loading.textContent = 'Erro ao iniciar WebGL: ' + err.message;
});
