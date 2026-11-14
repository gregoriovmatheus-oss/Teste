import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { NOISE_GLSL } from '../core/noise.glsl.js';
import { RNG, smooth } from '../core/rng.js';
import { buildBuildings, PITCH, inPlaza } from './buildings.js';
import * as P from './props.js';
import { Body, PhysicsWorld } from './physics.js';
import { Billboards, ShockRings, Cracks, Rubble } from './particles.js';
import { installHeightFog } from '../core/heightFog.js';
import { buildFountain, FountainJets, createWaterBlobMaterial, FOUNTAIN } from './water.js';

export const SHOT_A_SPOT = new THREE.Vector3(-27, 0, -5.4);   // puddle on the avenue curb

export class CityScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 6000);
    this.rng = new RNG(1234);
    // Sun: low golden-hour sun, behind the plaza when looking north
    this.sunDir = new THREE.Vector3(-0.62, 0.16, -0.77).normalize();
    installHeightFog(this.sunDir, new THREE.Color(1.0, 0.72, 0.45));
    this.scene.fog = new THREE.Fog(0x9c8c80, 1.1, 10);

    this._sky();
    this._lights();
    this._ground();
    this.buildings = buildBuildings(this.scene, this.envMap);
    P.createMaterials(this.envMap);
    this.fountain = buildFountain(this.scene, this.envMap);
    this.jets = new FountainJets(this.scene);
    this.physics = new PhysicsWorld();
    this._populate();
    this._fx();
    this.lastStep = null;
    this.acc = 0;
    this.shake = 0;
    this.impactsThisFrame = [];
    this.biggestShock = null;
  }

  // -------------------------------------------------------------------------
  _sky() {
    const sky = new Sky();
    sky.scale.setScalar(5000);
    const u = sky.material.uniforms;
    u.turbidity.value = 7.5;
    u.rayleigh.value = 2.2;
    u.mieCoefficient.value = 0.004;
    u.mieDirectionalG.value = 0.8;
    u.sunPosition.value.copy(this.sunDir).multiplyScalar(1000);
    this.sky = sky;
    this.scene.add(sky);
    // environment for reflections
    const pm = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    const sky2 = new Sky();
    sky2.scale.setScalar(100);
    Object.assign(sky2.material.uniforms.turbidity, { value: 7.5 });
    sky2.material.uniforms.rayleigh.value = 2.2;
    sky2.material.uniforms.mieCoefficient.value = 0.008;
    sky2.material.uniforms.mieDirectionalG.value = 0.86;
    sky2.material.uniforms.sunPosition.value.copy(this.sunDir).multiplyScalar(1000);
    envScene.add(sky2);
    // a dark ground disc so reflections are not lit from below
    const gd = new THREE.Mesh(new THREE.CircleGeometry(90, 32), new THREE.MeshBasicMaterial({ color: 0x0c0b0a }));
    gd.rotation.x = -Math.PI / 2; gd.position.y = -2;
    envScene.add(gd);
    this.envRT = pm.fromScene(envScene, 0.02);
    this.envMap = this.envRT.texture;
    this.scene.environment = this.envMap;
    this.scene.environmentIntensity = 0.8;
    pm.dispose();
  }

  _lights() {
    const sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.74, 0.5), 3.9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    const c = sun.shadow.camera;
    c.left = -130; c.right = 130; c.top = 130; c.bottom = -130; c.near = 1; c.far = 1400;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    this.sun = sun;
    this.scene.add(sun, sun.target);
    const hemi = new THREE.HemisphereLight(new THREE.Color(0.62, 0.64, 0.74), new THREE.Color(0.42, 0.33, 0.24), 1.6);
    this.scene.add(hemi);
    this.hemi = hemi;
  }

  setShadowFocus(target) {
    // snap to shadow texel grid to avoid shimmering
    const texel = 260 / 4096;
    const f = target.clone();
    f.x = Math.round(f.x / texel) * texel; f.z = Math.round(f.z / texel) * texel; f.y = 0;
    this.sun.target.position.copy(f);
    this.sun.position.copy(f).addScaledVector(this.sunDir, 600);
  }

  _ground() {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
    mat.userData.uniforms = { uPuddle: { value: 1 }, uDust: { value: 0 } };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, mat.userData.uniforms);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        uniform float uPuddle; uniform float uDust; varying vec3 vWP;
        ${NOISE_GLSL}
        float gPuddle; float gMark;`)
        .replace('#include <map_fragment>', `
          vec2 w=vWP.xz;
          const float P=${PITCH.toFixed(1)};
          vec2 s=w-floor(w/P+0.5)*P;
          float ax=abs(s.x), az=abs(s.y);
          bool plaza = w.x>-60.0 && w.x<60.0 && w.y>-60.0 && w.y<-10.0;
          float roadX=step(ax,6.5), roadZ=step(az,6.5);
          float walkX=step(ax,10.0), walkZ=step(az,10.0);
          if(plaza){ roadX=0.0; roadZ=0.0; walkX=0.0; walkZ=0.0; }
          float road=max(roadX,roadZ);
          float walk=max(walkX,walkZ)*(1.0-road);
          float n1=snoise(vec3(w*0.15,1.0))*0.5+0.5;
          float n2=snoise(vec3(w*1.7,3.0))*0.5+0.5;
          float n3=snoise(vec3(w*9.0,7.0))*0.5+0.5;
          vec3 asphalt=vec3(0.055,0.055,0.058)*(0.75+0.35*n1)*(0.85+0.3*n3);
          asphalt=mix(asphalt,vec3(0.085,0.083,0.08),smoothstep(0.62,0.66,snoise(vec3(w*0.05,9.0))*0.5+0.5)); // patches
          gMark=0.0;
          // avenue-type markings on streets running along x (roadZ)
          if(roadZ>0.5 && ax>10.0){
            float cy=step(0.1,az)*step(az,0.32);
            float dash=step(abs(az-3.25),0.08)*step(fract(w.x/6.0),0.5);
            gMark=max(gMark,cy*2.0); gMark=max(gMark,dash);
          }
          if(roadX>0.5 && az>10.0){
            float cy=step(0.1,ax)*step(ax,0.32);
            float dash=step(abs(ax-3.25),0.08)*step(fract(w.y/6.0),0.5);
            gMark=max(gMark,cy*2.0); gMark=max(gMark,dash);
          }
          // crosswalks
          if(roadZ>0.5 && ax>6.9 && ax<9.7) gMark=max(gMark,step(fract(az/1.1),0.55));
          if(roadX>0.5 && az>6.9 && az<9.7) gMark=max(gMark,step(fract(ax/1.1),0.55));
          vec3 markCol = gMark>1.5 ? vec3(0.55,0.4,0.08) : vec3(0.62);
          vec3 col=mix(asphalt,markCol*(0.8+0.2*n3),min(gMark,1.0)*road);
          // sidewalk tiles
          vec2 tile=fract(w/1.5);
          float seam=1.0-smoothstep(0.0,0.04,min(min(tile.x,1.0-tile.x),min(tile.y,1.0-tile.y)));
          vec3 side=vec3(0.32,0.31,0.29)*(0.85+0.3*n2)*(1.0-seam*0.35);
          float curb=max(step(abs(ax-6.65),0.2)*(1.0-roadZ),step(abs(az-6.65),0.2)*(1.0-roadX));
          side=mix(side,vec3(0.48,0.47,0.45),curb);
          col=mix(col,side,walk);
          // block interior
          float block=(1.0-walk)*(1.0-road);
          vec3 blockCol=vec3(0.25,0.245,0.24)*(0.8+0.3*n2);
          if(plaza){
            vec2 pc=w-vec2(0.0,-35.0);
            float r=length(pc);
            float a=atan(pc.y,pc.x);
            vec2 rb=vec2(r/0.9, a*r/1.2);
            vec2 bb=vec2(w.x/1.2+floor(w.y/0.6)*0.5, w.y/0.6);
            vec2 q= r<16.0 ? rb : bb;
            vec2 fq=fract(q);
            float pseam=1.0-smoothstep(0.0,0.06,min(min(fq.x,1.0-fq.x),min(fq.y,1.0-fq.y)));
            float pv=fract(sin(dot(floor(q),vec2(12.9898,78.233)))*43758.5453);
            blockCol=mix(vec3(0.42,0.37,0.31),vec3(0.52,0.47,0.4),pv)*(1.0-pseam*0.45)*(0.85+0.2*n2);
            if(r<16.0 && r>15.2) blockCol*=0.6;
          }
          col=mix(col,blockCol,block);
          // puddles
          float pn=snoise(vec3(w*0.21,2.0))*0.5+0.5+snoise(vec3(w*0.9,5.0))*0.06;
          gPuddle=0.0;
          vec2 pd=(w-vec2(${SHOT_A_SPOT.x.toFixed(1)},${SHOT_A_SPOT.z.toFixed(1)}))*vec2(1.0,1.6);
          float hero=smoothstep(1.9,1.5,length(pd)+snoise(vec3(w*1.3,4.0))*0.35);
          gPuddle=max(gPuddle,hero*uPuddle);
          col=mix(col,col*0.35,gPuddle);
          // settled dust after the event
          col=mix(col,vec3(0.42,0.38,0.33)*(0.8+0.4*n2),uDust*0.55*(0.5+0.5*n1));
          diffuseColor.rgb=col;`)
        .replace('#include <roughnessmap_fragment>', `
          float roughnessFactor=mix(0.92,0.3,gPuddle);
          roughnessFactor=mix(roughnessFactor,0.98,uDust*0.6);`);
    };
    this.groundMat = mat;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000, 1, 1), mat);
    g.rotation.x = -Math.PI / 2;
    g.receiveShadow = true;
    this.scene.add(g);
  }

  // ------------------------------------------------------------------------
  _populate() {
    const S = this.scene;
    const rng = this.rng;
    const ph = this.physics;
    const tmpQ = new THREE.Quaternion();
    const Y = new THREE.Vector3(0, 1, 0);
    const colorOf = (h, s, l) => new THREE.Color().setHSL(h, s, l);

    // vehicle definitions
    const defs = {
      sedan: P.sedanParts(), suv: P.suvParts(), bus: P.busParts(),
      person: P.personParts('stand'), personF: P.personParts('float'),
      tree: P.treeParts(3), bench: P.benchParts(), table: P.tableParts(), chair: P.chairParts(),
      umbrella: P.umbrellaParts(), bin: P.binParts(), cone: P.coneParts(), crate: P.crateParts(),
    };
    this.defs = defs;

    // -------- vehicles
    const cars = { sedan: [], suv: [], bus: [] };
    const placeCar = (x, z, heading) => {
      const r = rng.float();
      const type = r < 0.58 ? 'sedan' : 'suv';
      cars[type].push({ x, z, heading });
    };
    const lanes = [-4.8, -1.7, 1.7, 4.8];
    // main avenue (z = 0) — dense traffic
    for (const lz of lanes) {
      let x = -330 + rng.float(0, 8);
      while (x < 330) {
        const near = Math.abs(x) < 160;
        const inter = Math.abs(x - Math.round(x / PITCH) * PITCH) < 11;
        const clear = (lz === -4.8 && x > -46 && x < -12) || (lz === 4.8 && x > -14 && x < 38) || (lz === 1.7 && x > 14 && x < 38);
        if (!inter && !clear && rng.chance(near ? 0.85 : 0.55)) {
          if (near && rng.chance(0.04) && lz * lz > 9) { cars.bus.push({ x, z: lz, heading: lz > 0 ? 0 : Math.PI }); x += 14; continue; }
          placeCar(x + rng.float(-0.3, 0.3), lz + rng.float(-0.25, 0.25), (lz > 0 ? 0 : Math.PI) + rng.float(-0.04, 0.04));
        }
        x += rng.float(6.5, 10);
      }
    }
    // a hero bus near the plaza
    cars.bus.push({ x: -40, z: 1.7, heading: 0 });
    // cross streets & parallel streets
    for (let k = -4; k <= 4; k++) {
      if (k === 0) continue;
      for (const lz of [-3.2, 3.2]) {
        // streets along z at x = k*PITCH
        let z = -280;
        while (z < 280) {
          const inter = Math.abs(z - Math.round(z / PITCH) * PITCH) < 11;
          if (!inter && rng.chance(0.42 * Math.exp(-Math.abs(k) / 4))) placeCar(k * PITCH + lz, z, lz > 0 ? Math.PI / 2 : -Math.PI / 2);
          z += rng.float(7, 12);
        }
        // streets along x at z = k*PITCH
        let x = -280;
        while (x < 280) {
          const inter = Math.abs(x - Math.round(x / PITCH) * PITCH) < 11;
          if (!inter && rng.chance(0.4 * Math.exp(-Math.abs(k) / 4))) placeCar(x, k * PITCH + lz, lz > 0 ? 0 : Math.PI);
          x += rng.float(7, 12);
        }
      }
    }
    // the x=0 street north of the plaza / south of avenue
    for (let z = 14; z < 260; z += rng.float(7, 11)) if (rng.chance(0.6)) placeCar(rng.sign() * 3.2, z, Math.PI / 2);

    const carColors = [
      [0, 0, 0.04], [0, 0, 0.75], [0, 0, 0.5], [0, 0, 0.25], [0.6, 0.5, 0.25], [0.0, 0.7, 0.35], [0.58, 0.3, 0.15],
      [0.12, 0.9, 0.5], [0.08, 0.5, 0.35], [0.55, 0.15, 0.6],
    ];
    this.carBodies = [];
    for (const type of ['sedan', 'suv', 'bus']) {
      const list = cars[type];
      const prop = new P.InstancedProp(defs[type], list.length, S);
      list.forEach((c, i) => {
        const def = defs[type];
        tmpQ.setFromAxisAngle(Y, c.heading);
        const isTaxi = type === 'sedan' && rng.chance(0.12);
        const cc = type === 'bus' ? [0.0, 0.75, 0.42] : (isTaxi ? [0.13, 0.95, 0.5] : rng.pick(carColors));
        prop.setColor(i, colorOf(cc[0], cc[1], cc[2]));
        const dist = Math.hypot(c.x, c.z);
        const b = ph.add(new Body({
          prop, index: i, kind: type,
          p: new THREE.Vector3(c.x, def.half.y, c.z), q: tmpQ, half: def.half,
          release: 1.0 + rng.float(0, 2.2) + dist * 0.002,
          lift: type === 'bus' ? rng.float(0.35, 0.6) : rng.float(0.5, 1.25),
          drift: new THREE.Vector3(rng.float(-0.12, 0.12), 0, rng.float(-0.1, 0.1)),
          spin: new THREE.Vector3(rng.float(-0.08, 0.08), rng.float(-0.06, 0.06), rng.float(-0.12, 0.12)),
          impact: type === 'bus' ? 3 : 1.4, drag: 0.004, bounce: 0.18, seed: rng.float(),
        }));
        this.carBodies.push(b);
      });
    }

    // -------- people (silhouettes) --------------------------------------
    const people = [];
    for (let i = 0; i < 90; i++) {
      const a = rng.float(0, Math.PI * 2), r = rng.float(9, 24);
      const x = FOUNTAIN.x + Math.cos(a) * r * 1.9, z = FOUNTAIN.z + Math.sin(a) * r * 0.85;
      if (inPlaza(x, z, -1)) people.push([x, z]);
    }
    for (let i = 0; i < 140; i++) {
      const side = rng.sign();
      people.push([rng.float(-170, 170), side * rng.float(7.2, 9.6)]);
    }
    for (let i = 0; i < 40; i++) people.push([rng.sign() * rng.float(7.2, 9.6) + rng.pick([-70, 70, 140]), rng.float(-120, 120)]);
    const pStand = new P.InstancedProp(defs.person, people.length, S);
    const pFloat = new P.InstancedProp(defs.personF, people.length, S);
    this.peopleBodies = [];
    people.forEach(([x, z], i) => {
      const c = colorOf(rng.float(0, 1), rng.float(0.05, 0.25), rng.float(0.05, 0.16));
      pStand.setColor(i, c); pFloat.setColor(i, c);
      tmpQ.setFromAxisAngle(Y, rng.float(0, Math.PI * 2));
      const s = rng.float(0.92, 1.08);
      const b = ph.add(new Body({
        prop: pStand, index: i, alt: { prop: pFloat, index: i }, kind: 'person',
        p: new THREE.Vector3(x, defs.person.half.y * s, z), q: tmpQ, half: defs.person.half, scale: s,
        release: 0.4 + rng.float(0, 1.6), lift: rng.float(0.35, 0.9),
        drift: new THREE.Vector3(rng.float(-0.15, 0.15), 0, rng.float(-0.15, 0.15)),
        spin: new THREE.Vector3(rng.float(-0.35, 0.35), rng.float(-0.3, 0.3), rng.float(-0.35, 0.35)),
        impact: 0.25, drag: 0.02, seed: rng.float(),
      }));
      this.peopleBodies.push(b);
    });

    // -------- trees ---------------------------------------------------------
    const trees = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.2; trees.push([FOUNTAIN.x + Math.cos(a) * 19, FOUNTAIN.z + Math.sin(a) * 19 * 0.9]); }
    for (let x = -52; x <= 52; x += 13) { trees.push([x, -56]); }
    for (let z = -50; z <= -16; z += 11) { trees.push([-55, z]); trees.push([55, z]); }
    for (let x = -230; x <= 230; x += 15) {
      if (Math.abs(x - Math.round(x / PITCH) * PITCH) < 13) continue;
      if (!(x > -60 && x < 60)) trees.push([x, -9.0]);
      if (!(x + 7 > -35 && x + 7 < 35)) trees.push([x + 7, 9.0]);
    }
    const treeProp = new P.InstancedProp(defs.tree, trees.length, S);
    this.treeBodies = [];
    trees.forEach(([x, z], i) => {
      treeProp.setColor(i, colorOf(rng.float(0.2, 0.32), rng.float(0.35, 0.6), rng.float(0.12, 0.22)));
      tmpQ.setFromAxisAngle(Y, rng.float(0, 6.28));
      const s = rng.float(0.85, 1.25);
      const b = ph.add(new Body({
        prop: treeProp, index: i, kind: 'tree',
        p: new THREE.Vector3(x, defs.tree.half.y * s, z), q: tmpQ, half: defs.tree.half, scale: s,
        release: 2.2 + rng.float(0, 2.5), lift: rng.float(0.25, 0.6),
        spin: new THREE.Vector3(rng.float(-0.06, 0.06), rng.float(-0.05, 0.05), rng.float(-0.06, 0.06)),
        drift: new THREE.Vector3(rng.float(-0.05, 0.05), 0, rng.float(-0.05, 0.05)),
        impact: 1.0, drag: 0.03, seed: rng.float(),
      }));
      this.treeBodies.push(b);
    });
    this.treePositions = trees;

    // -------- street furniture ------------------------------------------------
    const furniture = (def, list, opts) => {
      const prop = new P.InstancedProp(def, list.length, S);
      list.forEach((it, i) => {
        if (opts.color) prop.setColor(i, opts.color(i));
        tmpQ.setFromAxisAngle(Y, it.r ?? rng.float(0, 6.28));
        ph.add(new Body({
          prop, index: i, kind: opts.kind,
          p: new THREE.Vector3(it.x, def.half.y + (it.y || 0), it.z), q: tmpQ, half: def.half,
          release: opts.release(), lift: opts.lift(),
          drift: new THREE.Vector3(rng.float(-0.2, 0.2), 0, rng.float(-0.2, 0.2)),
          spin: new THREE.Vector3(rng.float(-1, 1), rng.float(-1, 1), rng.float(-1, 1)).multiplyScalar(opts.spin),
          impact: opts.impact, drag: opts.drag ?? 0.05, seed: rng.float(), flutter: opts.flutter ?? 0,
        }));
      });
      return prop;
    };
    const benches = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; benches.push({ x: FOUNTAIN.x + Math.cos(a) * 11, z: FOUNTAIN.z + Math.sin(a) * 11, r: -a + Math.PI / 2 }); }
    for (let x = -150; x < 150; x += 23) benches.push({ x, z: rng.sign() * 9.3, r: 0 });
    furniture(defs.bench, benches, { kind: 'bench', release: () => rng.float(0.8, 2.5), lift: () => rng.float(0.5, 1.1), spin: 0.3, impact: 0.6 });
    // café
    const tables = [], chairs = [], umbrellas = [];
    for (let i = 0; i < 9; i++) {
      const x = 22 + (i % 3) * 7 + rng.float(-1, 1), z = -52 + Math.floor(i / 3) * 6 + rng.float(-1, 1);
      tables.push({ x, z });
      for (let c = 0; c < 4; c++) { const a = c * Math.PI / 2 + rng.float(-0.3, 0.3); chairs.push({ x: x + Math.cos(a) * 0.85, z: z + Math.sin(a) * 0.85, r: -a - Math.PI / 2 }); }
      if (i % 2 === 0) umbrellas.push({ x, z, y: 0.05 });
    }
    const caf = [[0.0, 0.6, 0.45], [0.58, 0.5, 0.4], [0.1, 0.7, 0.55], [0, 0, 0.9]];
    furniture(defs.table, tables, { kind: 'table', release: () => rng.float(0.4, 1.4), lift: () => rng.float(0.8, 1.6), spin: 0.6, impact: 0.3, color: () => colorOf(0, 0, 0.92) });
    furniture(defs.chair, chairs, { kind: 'chair', release: () => rng.float(0.2, 1.2), lift: () => rng.float(0.9, 1.9), spin: 1.0, impact: 0.2, color: () => { const c = rng.pick(caf); return colorOf(c[0], c[1], c[2]); } });
    furniture(defs.umbrella, umbrellas, { kind: 'umbrella', release: () => rng.float(0.3, 1.0), lift: () => rng.float(0.9, 1.5), spin: 0.4, impact: 0.2, drag: 0.4, color: (i) => colorOf(i % 2 ? 0.0 : 0.6, 0.6, 0.45) });
    const bins = [];
    for (let x = -140; x < 140; x += 19) bins.push({ x: x + 4, z: rng.sign() * 9.5 });
    furniture(defs.bin, bins, { kind: 'bin', release: () => rng.float(0.5, 2), lift: () => rng.float(0.6, 1.3), spin: 0.8, impact: 0.4, color: () => colorOf(0.33, 0.4, 0.25) });
    const cones = [];
    for (let i = 0; i < 16; i++) cones.push({ x: -40 + i * 1.6, z: 5.6 + rng.float(-0.3, 0.3) });
    furniture(defs.cone, cones, { kind: 'cone', release: () => rng.float(0.2, 1), lift: () => rng.float(0.9, 1.8), spin: 1.4, impact: 0.15, color: () => colorOf(0.06, 1, 0.5) });
    const crates = [];
    for (let i = 0; i < 20; i++) crates.push({ x: rng.float(-60, 60), z: -9.6 + rng.float(-0.3, 0.3), y: 0 });
    for (let i = 0; i < 6; i++) crates.push({ x: SHOT_A_SPOT.x - 6 + rng.float(-3, 3), z: -8.9 + rng.float(-0.5, 0.3) });
    furniture(defs.crate, crates, { kind: 'crate', release: () => rng.float(0.3, 1.5), lift: () => rng.float(0.8, 1.7), spin: 1.2, impact: 0.3 });

    // -------- lamp posts (anchored) -----------------------------------------------
    const lamps = [];
    for (let x = -280; x <= 280; x += 28) {
      if (Math.abs(x - Math.round(x / PITCH) * PITCH) < 12) continue;
      lamps.push({ x, z: -7.4, r: Math.PI / 2 }, { x: x + 14, z: 7.4, r: -Math.PI / 2 });
    }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.5; lamps.push({ x: FOUNTAIN.x + Math.cos(a) * 26, z: FOUNTAIN.z + Math.sin(a) * 22, r: -a }); }
    const lampProp = new P.InstancedProp(P.lampParts(), lamps.length, S);
    const m = new THREE.Matrix4();
    lamps.forEach((l, i) => { tmpQ.setFromAxisAngle(Y, l.r); m.compose(new THREE.Vector3(l.x, 0, l.z), tmpQ, new THREE.Vector3(1, 1, 1)); lampProp.setMatrix(i, m); });
    lampProp.commit();
    this.lampProp = lampProp;

    // -------- water blobs from the fountain + puddle droplets ----------------------------
    this.blobMat = createWaterBlobMaterial(this.envMap);
    const blobDef = { parts: [{ geo: new THREE.SphereGeometry(1, 40, 24), mat: '__blob' }], half: new THREE.Vector3(1, 1, 1) };
    P.materials.__blob = this.blobMat;
    const blobs = [];
    for (let i = 0; i < 46; i++) {
      const a = rng.float(0, 6.28), r = Math.sqrt(rng.float()) * 5.6;
      blobs.push({ x: FOUNTAIN.x + Math.cos(a) * r, z: FOUNTAIN.z + Math.sin(a) * r, s: Math.pow(rng.float(), 2.2) * 1.15 + 0.12, y: 0.6, kind: 'blob' });
    }
    for (let i = 0; i < 70; i++) {
      const a = rng.float(0, 6.28), r = Math.sqrt(rng.float()) * 1.5;
      blobs.push({ x: SHOT_A_SPOT.x + Math.cos(a) * r, z: SHOT_A_SPOT.z + Math.sin(a) * r * 0.65, s: Math.pow(rng.float(), 2.5) * 0.07 + 0.008, y: 0.0, kind: 'drop' });
    }
    const blobProp = new P.InstancedProp(blobDef, blobs.length, S, { castShadow: false, receiveShadow: false });
    this.blobBodies = [];
    blobs.forEach((bl, i) => {
      const b = ph.add(new Body({
        prop: blobProp, index: i, kind: bl.kind,
        p: new THREE.Vector3(bl.x, bl.y + bl.s * 0.2, bl.z), half: new THREE.Vector3(1, 1, 1), scale: bl.s,
        release: bl.kind === 'blob' ? rng.float(0.3, 4.5) : rng.float(0.05, 1.4),
        lift: bl.kind === 'blob' ? rng.float(0.25, 0.9) / Math.sqrt(bl.s + 0.3) : rng.float(0.12, 0.5),
        drift: new THREE.Vector3(rng.float(-0.12, 0.12), 0, rng.float(-0.12, 0.12)),
        impact: 0, drag: 0.02, settle: false, wobble: bl.kind === 'blob' ? 0.06 : 0.12, seed: rng.float(), visible: 0,
        onLand: (body) => this._splash(body),
      }));
      b.blobStart = bl.y;
      this.blobBodies.push(b);
    });

    // -------- small stuff: pebbles, leaves, papers, cans ------------------------------------
    const smallDefs = {
      pebble: { geo: new THREE.DodecahedronGeometry(1, 0), mat: 'stone' },
      leaf: { geo: (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -1, 0.45, 0, 0, 0, 0, 1, -0.45, 0, 0, 0, 0.06, 0], 3)); g.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4, 0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0]); g.computeVertexNormals(); return g; })(), mat: 'foliage', color: true },
      paper: { geo: new THREE.BoxGeometry(0.3, 0.004, 0.42), mat: 'fabric', color: true },
      can: { geo: new THREE.CylinderGeometry(0.033, 0.033, 0.12, 10), mat: 'chrome', color: false },
    };
    const mkSmall = (key, n, place, o) => {
      const d = smallDefs[key];
      const def = { parts: [{ geo: d.geo, mat: d.mat, color: d.color }], half: new THREE.Vector3() };
      d.geo.computeBoundingBox();
      d.geo.boundingBox.getSize(def.half).multiplyScalar(0.5);
      const prop = new P.InstancedProp(def, n, S, { castShadow: key !== 'leaf' && key !== 'paper', receiveShadow: true });
      for (let i = 0; i < n; i++) {
        const [x, z] = place(i);
        const s = o.size();
        if (d.color) prop.setColor(i, o.color());
        tmpQ.setFromEuler(new THREE.Euler(o.flat ? 0 : rng.float(0, 6), rng.float(0, 6), o.flat ? 0 : rng.float(0, 6)));
        ph.add(new Body({
          prop, index: i, kind: key,
          p: new THREE.Vector3(x, def.half.y * s + 0.002, z), q: tmpQ, half: def.half, scale: s,
          release: o.release(x, z), lift: o.lift(),
          drift: new THREE.Vector3(rng.float(-0.15, 0.15), 0, rng.float(-0.15, 0.15)),
          spin: new THREE.Vector3(rng.float(-1, 1), rng.float(-1, 1), rng.float(-1, 1)).multiplyScalar(o.spin),
          impact: 0, drag: o.drag, flutter: o.flutter ?? 0, seed: rng.float(), bounce: 0.15,
        }));
      }
    };
    const near = (cx, cz, r) => () => { const a = rng.float(0, 6.28), rr = Math.sqrt(rng.float()) * r; return [cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]; };
    const avenueSpot = () => [rng.float(-120, 120), rng.float(-9.8, 9.8)];
    const heroNear = near(SHOT_A_SPOT.x - 2.5, SHOT_A_SPOT.z - 0.6, 5.5);
    mkSmall('pebble', 900, (i) => (i < 420 ? heroNear() : (i < 650 ? avenueSpot() : near(FOUNTAIN.x, FOUNTAIN.z, 24)())), {
      size: () => Math.pow(rng.float(), 2.5) * 0.06 + 0.008, release: (x, z) => rng.float(0, 1.2) + (Math.hypot(x - SHOT_A_SPOT.x, z - SHOT_A_SPOT.z) < 8 ? 0 : 0.6),
      lift: () => rng.float(0.08, 0.55), spin: 2.5, drag: 0.05, color: () => 0,
    });
    const leafCols = [[0.22, 0.6, 0.25], [0.15, 0.7, 0.35], [0.1, 0.75, 0.4], [0.07, 0.6, 0.3], [0.28, 0.5, 0.2]];
    const treeSpot = () => { const t = rng.pick(this.treePositions); const a = rng.float(0, 6.28), r = rng.float(0, 4); return [t[0] + Math.cos(a) * r, t[1] + Math.sin(a) * r]; };
    mkSmall('leaf', 1600, (i) => (i < 300 ? heroNear() : treeSpot()), {
      size: () => rng.float(0.035, 0.07), release: () => rng.float(0, 1.4), lift: () => rng.float(0.15, 0.7), spin: 2.0, drag: 3.0, flutter: 2.5, flat: true,
      color: () => { const c = rng.pick(leafCols); return colorOf(c[0], c[1], c[2]); },
    });
    mkSmall('paper', 260, (i) => (i < 30 ? heroNear() : (i < 140 ? avenueSpot() : near(FOUNTAIN.x, FOUNTAIN.z, 26)())), {
      size: () => rng.float(0.7, 1.2), release: () => rng.float(0, 1.2), lift: () => rng.float(0.3, 1.1), spin: 1.2, drag: 2.0, flutter: 3.0, flat: true,
      color: () => colorOf(0.1, 0.1, rng.float(0.65, 0.88)),
    });
    mkSmall('can', 30, () => heroNear(), { size: () => 1, release: () => rng.float(0.1, 1), lift: () => rng.float(0.2, 0.5), spin: 2, drag: 0.1, color: () => 0 });

    ph.writeAll();
  }

  _fx() {
    this.dust = new Billboards(9000, { renderOrder: 11 });
    this.glow = new Billboards(5000, { additive: true, renderOrder: 12 });
    this.smoke = new Billboards(2500, { renderOrder: 10 });
    this.rings = new ShockRings(64);
    this.cracks = new Cracks(200);
    this.rubble = new Rubble(1400, P.materials.stone);
    this.scene.add(this.dust.mesh, this.glow.mesh, this.smoke.mesh, this.rings.mesh, this.cracks.mesh, this.rubble.mesh);
    this.plumes = [];
    // distant smoke columns that appear after the event (sell the scale of the damage)
    const r = new RNG(66);
    for (let i = 0; i < 9; i++) {
      const a = r.float(0, Math.PI * 2), d = r.float(110, 380);
      this.plumes.push({ x: Math.cos(a) * d - 60, z: Math.sin(a) * d - 120, rate: r.float(4, 9), size: r.float(14, 30), acc: 0, fire: r.chance(0.6), start: r.float(0, 3) });
    }
  }

  _splash(body) {
    const s = body.scale;
    const n = Math.min(30, Math.floor(6 + s * 24));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, sp = Math.random() * 4 + 1;
      this.glow.emit({
        x: body.p.x, y: 0.15, z: body.p.z, vx: Math.cos(a) * sp, vy: Math.random() * 4 + 1, vz: Math.sin(a) * sp,
        r: 0.35, g: 0.42, b: 0.48, a: 0.7, life: 1.2, s0: 0.03 + s * 0.05, s1: 0.02, type: 3, drag: 0.5, gf: 1,
      });
    }
    body.visible = 0;
    body.state = 2;
  }

  _impact(ev) {
    const b = ev.body;
    const k = Math.min(1.8, ev.speed / 14) * b.impact;
    const p = ev.p;
    const big = b.kind === 'bus' || b.kind === 'sedan' || b.kind === 'suv' || b.kind === 'tree';
    // dust ring
    const nd = Math.floor(10 + k * 26);
    for (let i = 0; i < nd; i++) {
      const a = Math.random() * 6.28, sp = (Math.random() * 7 + 2) * (0.5 + k * 0.5);
      const shade = 0.5 + Math.random() * 0.25;
      this.dust.emit({
        x: p.x + Math.cos(a) * 0.8, y: 0.3 + Math.random() * 0.6, z: p.z + Math.sin(a) * 0.8,
        vx: Math.cos(a) * sp, vy: Math.random() * 1.6 * (0.4 + k), vz: Math.sin(a) * sp,
        r: 0.62 * shade, g: 0.56 * shade, b: 0.48 * shade, a: 0.32 + Math.random() * 0.25,
        life: 4 + Math.random() * 5, s0: 0.8 + k, s1: 5 + k * 7 + Math.random() * 4, type: 1, drag: 1.4, gf: -0.02, rv: (Math.random() - 0.5) * 0.4,
      });
    }
    // sparks for vehicles
    if (big && b.kind !== 'tree') {
      for (let i = 0; i < 26 * k; i++) {
        const a = Math.random() * 6.28, sp = Math.random() * 9 + 3;
        this.glow.emit({
          x: p.x, y: 0.3, z: p.z, vx: Math.cos(a) * sp, vy: Math.random() * 6 + 1, vz: Math.sin(a) * sp,
          r: 4, g: 1.6, b: 0.5, a: 1, life: 0.5 + Math.random() * 0.6, s0: 0.07, s1: 0.03, type: 2, drag: 1.2, gf: 1,
        });
      }
      // glass shards / rubble
      for (let i = 0; i < 12 * k; i++) {
        const a = Math.random() * 6.28, sp = Math.random() * 6 + 1.5;
        this.rubble.emit(p.x, 0.5, p.z, Math.cos(a) * sp, Math.random() * 6 + 2, Math.sin(a) * sp, 0.05 + Math.random() * 0.14);
      }
      this.cracks.add(p.x, p.z, 2.5 + k * 2.2, Math.random());
    }
    this.rings.add(p.x, p.z, 6 + k * 12, 1.1 + k * 0.3, Math.min(1.2, 0.4 + k * 0.5));
    // lingering smoke / fire for heavy vehicles
    if ((b.kind === 'bus' || (big && b.kind !== 'tree' && Math.random() < 0.3)) && this.plumes.length < 34) {
      this.plumes.push({ x: p.x, z: p.z, rate: 7, size: b.kind === 'bus' ? 9 : 5, acc: 0, fire: true, start: 0, local: true });
    }
    this.impactsThisFrame.push({ p: p.clone(), k, kind: b.kind });
    if (!this.biggestShock || k > this.biggestShock.k) this.biggestShock = { p: p.clone(), k };
  }

  // ------------------------------------------------------------------------
  /**
   * @param t film time; gravity(t) gives the gravity; tOff/tOn absolute times
   */
  update(t, dt, env) {
    const { gravity, tOff, tOn, camera, pixelScale, damage } = env;
    this.impactsThisFrame = [];
    this.biggestShock = null;
    const STEP = 1 / 60;
    if (this.lastStep === null) this.lastStep = t;
    let n = 0;
    while (this.lastStep + STEP <= t && n < 20000) {
      const tt = this.lastStep + STEP;
      const g = gravity(tt);
      this.physics.step(tt, STEP, g, tOff);
      for (const ev of this.physics.drainEvents()) this._impact(ev);
      this._fxStep(tt, STEP, g, tOff, tOn);
      this.lastStep = tt;
      n++;
    }
    // water blob visibility (emerging from the basin)
    for (const b of this.blobBodies) {
      if (b.state === 1) {
        const age = t - (tOff + b.release);
        b.visible = smooth(0, b.kind === 'blob' ? 1.6 : 0.4, age);
      }
    }
    this.physics.writeAll();
    this.blobMat.userData.uniforms.uTime.value = t;
    this.fountain.waterMat.userData.uniforms.uTime.value = t;
    const lifted = tOff !== null ? smooth(tOff, tOff + 6, t) : 0;
    this.fountain.surface.position.y = 0.62 - lifted * 0.4;
    this.fountain.waterMat.userData.uniforms.uAgit.value = tOff !== null && t > tOff ? 1.0 : 0.25;
    this.groundMat.userData.uniforms.uPuddle.value = 1 - (tOff !== null ? smooth(tOff, tOff + 2.5, t) * 0.85 : 0);
    this.groundMat.userData.uniforms.uDust.value = damage;
    this.buildings.material.userData.uniforms.uDamage.value = damage;
    this.buildings.material.userData.uniforms.uTime.value = t;
    this.jets.update(t, tOff, tOn, pixelScale);
    // flickering street lamps after the impact
    const lampK = tOn !== null && t > tOn ? (Math.sin(t * 37) > 0.2 || Math.sin(t * 13.3) > 0.7 ? 5 : 0.3) : 5;
    P.materials.lampGlow.emissiveIntensity = lampK;
    if (camera) this.setShadowFocus(env.focus || camera.position);
  }

  _fxStep(t, dt, g, tOff, tOn) {
    // zero-g dust motes catching the light
    if (tOff !== null && t >= tOff && t < tOff + 4) {
      const rate = 900; // per second
      const cnt = Math.floor(rate * dt + Math.random());
      for (let i = 0; i < cnt; i++) {
        const area = Math.random();
        let x, z;
        if (area < 0.4) { x = SHOT_A_SPOT.x + (Math.random() - 0.5) * 16; z = SHOT_A_SPOT.z + (Math.random() - 0.5) * 8; }
        else if (area < 0.7) { x = (Math.random() - 0.5) * 140; z = (Math.random() - 0.5) * 20; }
        else { x = FOUNTAIN.x + (Math.random() - 0.5) * 60; z = FOUNTAIN.z + (Math.random() - 0.5) * 40; }
        this.glow.emit({
          x, y: Math.random() * 0.3, z, vx: (Math.random() - 0.5) * 0.15, vy: 0.05 + Math.random() * 0.45, vz: (Math.random() - 0.5) * 0.15,
          r: 1.0, g: 0.75, b: 0.5, a: 0.25 + Math.random() * 0.35, life: 34, s0: 0.006 + Math.random() * 0.018, type: 2, drag: 0.02, gf: 0.06, fadeIn: 1.5,
        });
        if (Math.random() < 0.18) {
          const sh = 0.5 + Math.random() * 0.2;
          this.dust.emit({
            x, y: Math.random() * 0.5, z, vx: (Math.random() - 0.5) * 0.2, vy: 0.08 + Math.random() * 0.3, vz: (Math.random() - 0.5) * 0.2,
            r: 0.6 * sh, g: 0.55 * sh, b: 0.48 * sh, a: 0.1, life: 30, s0: 0.5, s1: 3.5, type: 1, drag: 0.05, gf: 0.02, fadeIn: 3,
          });
        }
      }
    }
    // smoke plumes after the return
    if (tOn !== null && t > tOn) {
      for (const pl of this.plumes) {
        if (t < tOn + pl.start + (pl.local ? 0.3 : 1.5)) continue;
        pl.acc += pl.rate * dt;
        while (pl.acc > 1) {
          pl.acc -= 1;
          const sh = 0.16 + Math.random() * 0.12;
          this.smoke.emit({
            x: pl.x + (Math.random() - 0.5) * pl.size * 0.2, y: 1 + Math.random(), z: pl.z + (Math.random() - 0.5) * pl.size * 0.2,
            vx: 0.8 + Math.random() * 0.6, vy: 2.5 + Math.random() * 2.5, vz: 0.4 + (Math.random() - 0.5) * 0.6,
            r: sh * 1.05, g: sh, b: sh * 0.95, a: 0.55, life: 9 + Math.random() * 5, s0: pl.size * 0.35, s1: pl.size * 2.2,
            type: 1, drag: 0.1, gf: 0, rv: (Math.random() - 0.5) * 0.3, fadeIn: 0.8,
          });
          if (pl.fire && Math.random() < 0.8) {
            this.glow.emit({
              x: pl.x + (Math.random() - 0.5) * pl.size * 0.25, y: 0.5 + Math.random() * 1.0, z: pl.z + (Math.random() - 0.5) * pl.size * 0.25,
              vx: 0, vy: 1.5 + Math.random() * 2, vz: 0, r: 3.5, g: 1.2, b: 0.3, a: 0.9, life: 0.8 + Math.random() * 0.6,
              s0: pl.size * 0.25, s1: pl.size * 0.05, type: 2, drag: 0.5, gf: 0,
            });
          }
        }
      }
    }
    this.dust.update(dt, g);
    this.glow.update(dt, g);
    this.smoke.update(dt, 0);
    this.rings.update(dt);
    this.rubble.update(dt, g < -0.5 ? g : -9.81);
  }
}
