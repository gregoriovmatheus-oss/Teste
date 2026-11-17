import * as THREE from 'three';
import { clamp, lerp, smooth, easeInOut, easeOut, easeIn, smoother } from './core/rng.js';
import { SHOT_A_SPOT } from './city/cityScene.js';
import { FOUNTAIN } from './city/water.js';

// ---------------------------------------------------------------------------
// Timeline (film seconds)
// ---------------------------------------------------------------------------
export const T = {
  FIELD_IN: 9.4,
  OFF: 12.0,          // gravity switches off (planet view)
  DIVE: 14.2,
  CITY_IN: 16.6,
  CITY_OFF: 16.8,     // release in the city
  B: 21.2,
  C: 26.0,
  D: 30.2,
  SPACE2: 33.2,
  ON: 39.7,           // gravity returns (planet view)
  CITY_BACK: 40.4,
  CITY_ON: 40.55,
  F: 46.0,
  END: 51.5,
};
const SLOWMO = (T.ON - T.OFF) / 5; // film seconds per real second

export const CHAPTERS = [
  { t: 0.0, n: '01', name: 'O PLANETA' },
  { t: T.OFF, n: '02', name: 'O DESAPARECIMENTO' },
  { t: T.B, n: '03', name: 'O CAOS' },
  { t: T.SPACE2, n: '04', name: 'O PLANETA EM COLAPSO' },
  { t: T.ON, n: '05', name: 'O RETORNO' },
];

export const CAPTIONS = [
  { a: 6.6, b: 9.3, text: 'Terra · 5,97 × 10<sup>24</sup> kg. Uma força invisível mantém tudo no lugar.' },
  { a: 9.6, b: 11.8, text: 'Campo gravitacional na superfície: <b>9,81 m/s²</b>.' },
  { a: 12.1, b: 14.6, text: '<b>T + 0,00 s</b> — a gravidade desaparece.' },
  { a: 17.6, b: 21.0, text: 'Sem peso, nada pressiona os objetos contra o chão. O solo comprimido se alivia — e tudo se solta.' },
  { a: 21.6, b: 25.6, text: 'Carros, pessoas, árvores: o que os prendia ao asfalto era apenas o próprio peso.' },
  { a: 26.4, b: 29.9, text: 'A água não cai mais. A tensão superficial a molda em esferas.' },
  { a: 30.5, b: 32.9, text: 'Sem peso não há atrito. Nada segura nada.' },
  { a: 33.7, b: 36.6, text: 'A Terra continua girando — até 465 m/s no equador. O que se solta segue pela tangente.' },
  { a: 36.8, b: 39.5, text: 'Oceanos e atmosfera não somem: apenas deixam de ser puxados. <i>Em 5 s reais, subiriam poucos metros — a escala aqui é exagerada.</i>' },
  { a: 39.8, b: 41.4, text: '<b>T + 5,00 s</b> — a gravidade retorna.' },
  { a: 41.8, b: 45.6, text: 'Tudo o que subiu, cai. De 10 metros, um carro atinge o solo a ~50 km/h.' },
  { a: 46.6, b: 50.6, text: 'Cinco segundos. A força que nunca notamos é a que mantém o mundo inteiro.' },
];

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }

export class Director {
  constructor(space, city, audio) {
    this.space = space;
    this.city = city;
    this.audio = audio;
    this.fired = new Set();
    this.shake = 0;
    this.shock = null;
    this.earthState = {
      spin: 0, oceanLift: 0, oceanFall: 0, pulse: -1, pulseColor: 0, spray: 0,
      field: 0, fieldBreak: 0, fieldColor: new THREE.Color(), shell: 0, shellR: 1,
    };
    this.post = {
      sunDir: new THREE.Vector3(), sunColor: new THREE.Color(), fogColor: new THREE.Color(), fogDensity: 0, fogFalloff: 0.02,
      skyDist: 3000, god: 0, godColor: new THREE.Color(), bloom: 0.7, bloomRadius: 0.5, bloomThreshold: 0.9, focus: 10, dof: 0,
      exposure: 1, motion: 0.5, shockUv: new THREE.Vector2(), shockR: 0, shockAmp: 0, ca: 1, vignette: 0.45, grain: 0.03,
      letterbox: 0.1, fadeColor: new THREE.Color(0, 0, 0), fade: 0, flash: 0, flare: 1, saturation: 1, contrast: 1.05,
      tint: new THREE.Color(1, 1, 1), desat: 0, cut: false,
    };
    this._prevScene = null;
    this._prevShot = null;
    this._setupCity();
  }

  spin(t) { return 2.1 + t * 0.022; }

  // choose where on the globe the city is, so it sits near the terminator
  _setupCity() {
    const e = this.space.earth;
    const camPos = this._spaceApproachPos(T.DIVE, new THREE.Vector3());
    const camDir = camPos.clone().normalize();
    const sun = e.sunDir.clone();
    // rotate camDir away from the sun by ~12° (towards the terminator)
    const axis = new THREE.Vector3().crossVectors(sun, camDir).normalize();
    const cityW = camDir.clone().applyAxisAngle(axis, THREE.MathUtils.degToRad(14)).normalize();
    e.spin.rotation.y = this.spin(15.4);
    e.group.updateMatrixWorld(true);
    const inv = e.spin.matrixWorld.clone().invert();
    e.cityLocal.copy(cityW).applyMatrix4(inv).normalize();
  }

  _spaceApproachPos(t, out) {
    const sun = this.space.earth.sunDir;
    const sunAz = Math.atan2(sun.x, sun.z);
    const u = easeInOut(seg(t, 0, T.DIVE));
    const dist = lerp(8.5, 2.35, Math.pow(u, 0.85));
    const az = sunAz - THREE.MathUtils.degToRad(lerp(48, 72, u));
    const el = THREE.MathUtils.degToRad(lerp(14, 6, u));
    return out.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist);
  }

  sceneAt(t) {
    if (t < T.CITY_IN) return 'space';
    if (t < T.SPACE2) return 'city';
    if (t < T.CITY_BACK) return 'space';
    return 'city';
  }

  gravityCity = (t) => {
    if (t < T.CITY_OFF) return -9.81;
    if (t < T.CITY_ON) return 0;
    return -9.81 * smooth(T.CITY_ON, T.CITY_ON + 0.25, t);
  };

  hud(t) {
    let g = 9.81;
    if (t >= T.OFF) g = 9.81 * (1 - easeOut(seg(t, T.OFF, T.OFF + 0.7)));
    if (t >= T.ON) g = 9.81 * easeIn(seg(t, T.ON, T.ON + 0.5));
    let sim = 0;
    if (t >= T.OFF) sim = Math.min(5, (t - T.OFF) / SLOWMO);
    const zero = t >= T.OFF && t < T.ON + 0.5;
    return { g, sim, zero, slowmo: SLOWMO, chapter: [...CHAPTERS].reverse().find((c) => t >= c.t) };
  }

  // -------------------------------------------------------------------------
  update(t, dt) {
    const sceneKey = this.sceneAt(t);
    const p = this.post;
    const es = this.earthState;
    p.cut = false;
    p.flash = 0; p.fade = 0; p.desat = 0; p.shockAmp = 0;

    // events (audio etc.) ----------------------------------------------------
    const once = (key, at, fn) => { if (t >= at && !this.fired.has(key)) { this.fired.add(key); if (t - at < 0.5) fn(); } };
    once('riser', T.OFF - 2.2, () => this.audio.whoosh(2.2, true, 0.35));
    once('off', T.OFF, () => { this.audio.boom(0.9, 45, 4); this.audio.ping(1975, 0.12, 6); this.audio.ping(2637, 0.06, 7); });
    once('dive', T.DIVE, () => this.audio.whoosh(2.4, true, 0.55));
    once('cityin', T.CITY_IN, () => this.audio.ping(1318, 0.06, 5));
    once('up', T.D + 1.2, () => this.audio.whoosh(1.8, true, 0.4));
    once('onriser', T.ON - 1.8, () => this.audio.whoosh(1.8, false, 0.5));
    once('on', T.ON, () => this.audio.boom(1.0, 38, 3.5));
    once('slam', T.CITY_BACK, () => this.audio.boom(0.7, 60, 2.5));

    // earth state -------------------------------------------------------------
    es.spin = this.spin(t);
    es.field = smooth(T.FIELD_IN, T.FIELD_IN + 1.4, t) * (1 - smooth(T.OFF + 0.6, T.OFF + 2.0, t))
      + smooth(T.ON - 0.5, T.ON, t) * (1 - smooth(T.ON + 0.5, T.CITY_BACK, t));
    es.fieldBreak = t < T.ON - 0.6 ? smooth(T.OFF, T.OFF + 1.6, t) : 1 - smooth(T.ON - 0.6, T.ON, t);
    es.fieldColor.setRGB(0.42, 0.78, 1.0);
    if (t > T.ON - 1) es.fieldColor.setRGB(1.0, 0.5, 0.22);
    // expanding (off) / collapsing (on) shell
    if (t >= T.OFF && t < T.OFF + 1.5) { const u = seg(t, T.OFF, T.OFF + 1.5); es.shell = (1 - u) * 0.7; es.shellR = 1.0 + easeOut(u) * 2.8; }
    else if (t >= T.ON - 0.7 && t < T.ON + 0.2) { const u = seg(t, T.ON - 0.7, T.ON + 0.2); es.shell = Math.sin(u * Math.PI) * 0.6; es.shellR = 3.6 - easeIn(u) * 2.6; }
    else es.shell = 0;
    if (t >= T.OFF && t < T.OFF + 2.4) { es.pulse = easeOut(seg(t, T.OFF, T.OFF + 2.4)) * 3.14; es.pulseColor = 0; }
    else if (t >= T.ON && t < T.ON + 1.6) { es.pulse = easeOut(seg(t, T.ON, T.ON + 1.6)) * 3.14; es.pulseColor = 1; }
    else es.pulse = -1;
    es.oceanLift = smooth(T.SPACE2 - 0.5, T.ON, t);
    es.oceanFall = smooth(T.ON + 0.1, T.CITY_BACK + 0.4, t);
    es.spray = es.oceanLift * (1 - es.oceanFall) * 0.35;

    let shot;
    if (sceneKey === 'space') shot = this._space(t, p);
    else shot = this._city(t, dt, p);

    if (shot !== this._prevShot) { p.cut = true; this._prevShot = shot; }
    this._prevScene = sceneKey;
    return { sceneKey, shot };
  }

  // -------------------------------------------------------------------------
  _space(t, p) {
    const S = this.space;
    const cam = S.camera;
    const e = S.earth;
    p.sunDir.copy(e.sunDir);
    p.sunColor.setRGB(1, 0.9, 0.8);
    p.fogDensity = 0;
    p.god = 0.5; p.godColor.setRGB(1.0, 0.85, 0.7);
    p.bloom = 0.5; p.bloomRadius = 0.45; p.bloomThreshold = 1.0; p.clampHDR = 40;
    p.exposure = 1.0; p.flare = 1.0; p.saturation = 1.08; p.contrast = 1.06; p.tint.setRGB(1, 1, 1);
    p.vignette = 0.5; p.grain = 0.03; p.ca = 1.2;
    p.motion = 0.5;
    let shot;
    let fov = 35;
    const cityW = e.cityWorld(new THREE.Vector3());

    if (t < T.DIVE) {
      shot = 'approach';
      this._spaceApproachPos(t, cam.position);
      // slight lateral framing: earth slightly right of centre early on
      const u = easeInOut(seg(t, 0, T.DIVE));
      _a.set(0, 0, 0);
      const side = new THREE.Vector3().crossVectors(cam.position, new THREE.Vector3(0, 1, 0)).normalize();
      _a.addScaledVector(side, lerp(0.9, 0.1, u));
      // late in the approach, drift the aim towards the city
      _a.lerp(cityW, smooth(T.FIELD_IN, T.DIVE, t) * 0.35);
      cam.up.set(0, 1, 0);
      cam.lookAt(_a);
      p.focus = cam.position.length() - 1;
      p.dof = 0;
      if (t < 1.6) { p.fade = 1 - easeInOut(seg(t, 0, 1.6)); p.fadeColor.setRGB(0, 0, 0); }
      // gravity-off flash
      p.flash = Math.exp(-Math.max(0, t - T.OFF) * 10) * (t >= T.OFF ? 0.4 : 0);
      p.desat = (t >= T.OFF ? Math.exp(-(t - T.OFF) * 1.5) * 0.6 : 0);
      if (t >= T.OFF && t < T.OFF + 1.2) {
        const u2 = seg(t, T.OFF, T.OFF + 1.2);
        _a.copy(cityW).project(cam);
        p.shockUv.set(0.5, 0.5); p.shockR = easeOut(u2) * 1.2; p.shockAmp = (1 - u2) * 0.03;
      }
      if (t > T.OFF) { this.shake = Math.max(this.shake, 0); }
    } else if (t < T.CITY_IN) {
      shot = 'dive';
      const u = seg(t, T.DIVE, T.CITY_IN);
      const start = this._spaceApproachPos(T.DIVE, new THREE.Vector3());
      const end = cityW.clone().multiplyScalar(1.004);
      const k = easeIn(u) * 0.75 + u * 0.25;
      // curve the path a little for a nicer arc
      cam.position.copy(start).lerp(end, k);
      const bow = new THREE.Vector3().crossVectors(start, end).normalize().multiplyScalar(Math.sin(u * Math.PI) * 0.12);
      cam.position.add(bow);
      _a.set(0, 0, 0).lerp(cityW, 0.35 + 0.65 * smooth(0, 0.6, u));
      cam.lookAt(_a);
      fov = lerp(35, 62, easeIn(u));
      p.motion = 1.2;
      p.fade = smooth(0.82, 1.0, u); p.fadeColor.setRGB(0.92, 0.95, 1.0);
      p.dof = 0;
      p.flash = 0;
    } else if (t < T.CITY_BACK) {
      shot = 'collapse';
      const u = seg(t, T.SPACE2, T.ON + 0.3);
      // start just above the city, looking along the horizon, then pull out to the night side
      const sun = e.sunDir;
      const endDir = sun.clone().negate();
      const axis = new THREE.Vector3(0, 1, 0);
      endDir.applyAxisAngle(axis, THREE.MathUtils.degToRad(19)).normalize();
      endDir.y += 0.08; endDir.normalize();
      const k = easeInOut(u);
      const dir = new THREE.Vector3().copy(cityW).normalize();
      dir.lerp(endDir, smoother(seg(u, 0.05, 1.0))).normalize();
      const dist = lerp(1.05, 3.7, Math.pow(k, 1.4));
      cam.position.copy(dir).multiplyScalar(dist);
      // aim: horizon early → planet centre late
      const tangent = new THREE.Vector3().crossVectors(cityW, new THREE.Vector3(0, 1, 0)).normalize().negate();
      const hor = cityW.clone().multiplyScalar(0.98).addScaledVector(tangent, 0.45);
      _a.copy(hor).lerp(new THREE.Vector3(0, 0, 0), smooth(0.0, 0.7, u));
      cam.up.set(0, 1, 0);
      cam.lookAt(_a);
      fov = lerp(50, 33, smooth(0, 0.6, u));
      p.focus = cam.position.distanceTo(_a.set(0, 0, 0)) - 1;
      p.dof = 0;
      // foreground debris for the first seconds
      if (!this._debrisAnchor || t < T.SPACE2 + 0.05) {
        this._debrisAnchor = new THREE.Matrix4();
        const c0 = new THREE.PerspectiveCamera();
        const cityW0 = e.cityWorld(new THREE.Vector3());
        c0.position.copy(cityW0).multiplyScalar(1.05);
        const tangent0 = new THREE.Vector3().crossVectors(cityW0, new THREE.Vector3(0, 1, 0)).normalize().negate();
        c0.lookAt(cityW0.clone().multiplyScalar(0.98).addScaledVector(tangent0, 0.45));
        c0.updateMatrixWorld();
        this._debrisAnchor.copy(c0.matrixWorld);
      }
      S.updateDebris(t - T.SPACE2, this._debrisAnchor, 1 - smooth(T.SPACE2 + 3.5, T.SPACE2 + 5, t));
      p.fade = 1 - smooth(T.SPACE2, T.SPACE2 + 0.7, t); p.fadeColor.setRGB(0.92, 0.95, 1.0);
      p.flash = t >= T.ON ? Math.exp(-(t - T.ON) * 14) * 0.3 : 0;
      p.desat = t >= T.ON ? Math.exp(-(t - T.ON) * 2) * 0.4 : 0;
      if (t >= T.ON && t < T.ON + 1.0) { const u2 = seg(t, T.ON, T.ON + 1.0); p.shockUv.set(0.5, 0.5); p.shockR = 1.2 - easeOut(u2) * 1.2; p.shockAmp = (1 - u2) * 0.035; }
      p.motion = 0.6;
      this.shake = t >= T.ON ? Math.max(this.shake, 0.6 * Math.exp(-(t - T.ON) * 3)) : 0;
      if (t > T.CITY_BACK - 0.25) { p.fade = smooth(T.CITY_BACK - 0.25, T.CITY_BACK, t); p.fadeColor.setRGB(1, 0.92, 0.85); }
    }
    if (shot !== 'collapse') S.updateDebris(0, new THREE.Matrix4(), 0);
    this._applyShake(cam, t, 0.004);
    cam.fov = fov;
    cam.updateProjectionMatrix();
    p.letterbox = 0.0;
    // audio mix
    const zero = t >= T.OFF && t < T.ON;
    this.audio.mix({
      drone: zero ? 0.12 : 0.32, droneCutoff: zero ? 300 : 700, wind: shot === 'dive' ? 0.35 * seg(t, T.DIVE, T.CITY_IN) : 0.04,
      windFreq: shot === 'dive' ? 600 + seg(t, T.DIVE, T.CITY_IN) * 2500 : 400, pad: zero ? 0.5 : 0.0, city: 0, sub: zero ? 0.0 : 0.05,
    });
    return shot;
  }

  // -------------------------------------------------------------------------
  _city(t, dt, p) {
    const C = this.city;
    const cam = C.camera;
    p.sunDir.copy(C.sunDir);
    p.sunColor.setRGB(1.0, 0.72, 0.45);
    p.god = 0.3; p.godColor.setRGB(1.0, 0.72, 0.45);
    p.fogColor.setRGB(0.62, 0.55, 0.5);
    p.fogDensity = 0.0011; p.fogFalloff = 0.01; p.skyDist = 1600;
    p.bloom = 0.45; p.bloomRadius = 0.5; p.bloomThreshold = 2.2; p.clampHDR = 12;
    p.exposure = 0.7; p.flare = 0.6; p.saturation = 1.02; p.contrast = 1.08; p.tint.setRGB(1.0, 0.98, 0.95);
    p.vignette = 0.5; p.grain = 0.035; p.ca = 1.0; p.motion = 0.6;
    let shot, fov = 40, focus = 20, dof = 0.35;
    const pos = cam.position;
    const look = _b;

    if (t < T.B) {
      shot = 'A-macro';
      const u = seg(t, T.CITY_IN, T.B);
      const k = easeInOut(u);
      pos.copy(v3(-19.2, 0.16, -4.3)).lerp(v3(-21.2, 0.95, -3.9), k);
      look.copy(v3(-27, 0.12, -6.0)).lerp(v3(-28.5, 1.3, -6.4), k);
      fov = 36;
      focus = lerp(7.0, 8.2, k);
      if (t > T.B - 1.6) focus = lerp(focus, 26, easeInOut(seg(t, T.B - 1.6, T.B - 0.5)));
      dof = 0.85;
      p.fade = 1 - smooth(T.CITY_IN, T.CITY_IN + 0.9, t); p.fadeColor.setRGB(0.92, 0.95, 1.0);
      p.flash = 0;
    } else if (t < T.C) {
      shot = 'B-street';
      const u = seg(t, T.B, T.C);
      const k = easeInOut(u);
      pos.copy(v3(14, 1.8, 6.4)).lerp(v3(-10, 3.6, 6.2), k);
      look.copy(v3(-30, 2.2, -2.5)).lerp(v3(-48, 6.0, -3.5), k);
      fov = 42; focus = lerp(16, 20, k); dof = 0.4;
    } else if (t < T.D) {
      shot = 'C-fountain';
      const u = seg(t, T.C, T.D);
      const k = easeInOut(u);
      const a = lerp(0.35, 1.15, k);
      const r = lerp(15.5, 13.5, k);
      pos.set(FOUNTAIN.x + Math.cos(a) * r, lerp(2.4, 5.2, k), FOUNTAIN.z + Math.sin(a) * r);
      look.set(FOUNTAIN.x, lerp(3.2, 6.5, k), FOUNTAIN.z);
      fov = 44; focus = r; dof = 0.45;
    } else if (t < T.SPACE2) {
      shot = 'D-aerial';
      const u = seg(t, T.D, T.SPACE2);
      const up = easeOut(u), lat = easeIn(u);
      pos.set(18 + 120 * lat, 9 + 150 * up, -22 + 40 * lat);
      look.copy(v3(0, 5, -35)).lerp(v3(-120, 10, -150), easeInOut(u));
      fov = lerp(46, 54, u); focus = pos.distanceTo(look); dof = 0.12;
      p.fade = smooth(T.SPACE2 - 0.55, T.SPACE2, t); p.fadeColor.setRGB(0.92, 0.95, 1.0);
      p.motion = 0.8;
    } else if (t < T.F) {
      shot = 'E-return';
      const u = seg(t, T.CITY_BACK, T.F);
      const k = easeOut(u);
      pos.copy(v3(31, 10.5, 5.5)).lerp(v3(23, 7.5, 2.5), k);
      look.copy(v3(-14, 5.5, -26)).lerp(v3(-12, 2.0, -28), easeInOut(u));
      fov = 46; focus = 34; dof = 0.3;
      p.flash = Math.exp(-(t - T.CITY_BACK) * 6) * 0.35;
      p.fade = 0;
    } else {
      shot = 'F-aftermath';
      const u = seg(t, T.F, T.END);
      const k = easeInOut(u);
      pos.copy(v3(104, 52, 1.5)).lerp(v3(74, 38, -1.5), k);
      look.copy(v3(-4, 4, -28)).lerp(v3(-10, 2, -34), k);
      fov = 44; focus = pos.distanceTo(look); dof = 0.2;
      p.fade = smooth(T.END - 1.4, T.END, t); p.fadeColor.setRGB(0, 0, 0);
    }

    // aftermath atmosphere: dust in the air thickens, light dims
    const dmg = smooth(T.CITY_ON + 0.8, T.CITY_ON + 5, t);
    p.fogDensity = lerp(p.fogDensity, 0.0045, dmg);
    p.fogFalloff = lerp(p.fogFalloff, 0.035, dmg);
    p.fogColor.lerp(new THREE.Color(0.55, 0.45, 0.36), dmg);
    p.saturation = lerp(p.saturation, 0.88, dmg);
    C.scene.fog.color.copy(p.fogColor);
    C.scene.fog.near = p.fogDensity * 1000;
    C.scene.fog.far = p.fogFalloff * 1000;
    p.god = lerp(p.god, 0.6, dmg);

    // zero-g grade: slightly cooler, dreamier
    const zg = t >= T.CITY_OFF && t < T.CITY_ON ? smooth(T.CITY_OFF, T.CITY_OFF + 3, t) : 0;
    p.tint.lerp(new THREE.Color(0.96, 0.99, 1.04), zg * 0.6);

    cam.up.set(0, 1, 0);
    cam.lookAt(look);
    p.focus = focus;
    p.dof = dof;

    // impacts → shake, shock distortion, sound
    for (const im of C.impactsThisFrame) {
      const d = im.p.distanceTo(pos);
      this.shake = Math.min(1.2, this.shake + im.k * 0.35 * Math.min(1, 25 / (d + 5)));
      this.audio.impact(im.k, d);
    }
    if (C.biggestShock && C.biggestShock.k > 0.9) {
      const sp = C.biggestShock.p.clone().project(cam);
      if (Math.abs(sp.x) < 1.2 && Math.abs(sp.y) < 1.2 && sp.z < 1) {
        this.shock = { uv: new THREE.Vector2(sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5), t0: t, amp: Math.min(0.025, 0.01 * C.biggestShock.k) };
      }
    }
    if (this.shock) {
      const a = t - this.shock.t0;
      if (a < 0.8 && a >= 0) { p.shockUv.copy(this.shock.uv); p.shockR = easeOut(a / 0.8) * 0.6; p.shockAmp = this.shock.amp * (1 - a / 0.8); }
      else this.shock = null;
    }
    if (t >= T.CITY_ON && t < T.CITY_ON + 0.3) this.shake = Math.max(this.shake, 0.5);
    this._applyShake(cam, t, 0.05);
    cam.fov = fov;
    cam.updateProjectionMatrix();
    p.letterbox = 0.0;

    const zero = t >= T.CITY_OFF && t < T.CITY_ON;
    this.audio.mix({
      drone: zero ? 0.1 : 0.22, droneCutoff: zero ? 260 : 500, wind: zero ? 0.05 : 0.12, windFreq: 300,
      pad: zero ? 0.55 : 0.0, city: zero ? 0.02 : (t > T.CITY_ON ? 0.25 : 0.12), sub: 0,
    });
    return shot;
  }

  _applyShake(cam, t, scale) {
    if (this.shake > 0.001) {
      const s = this.shake * scale;
      cam.position.x += (Math.sin(t * 61.3) + Math.sin(t * 23.1)) * s * 0.5;
      cam.position.y += (Math.sin(t * 57.7) + Math.cos(t * 31.9)) * s * 0.5;
      cam.rotateZ(Math.sin(t * 43.1) * s * 0.15 / Math.max(scale, 1e-4) * 0.01);
    }
    this.shake *= Math.exp(-3.5 * (1 / 60));
  }
}
