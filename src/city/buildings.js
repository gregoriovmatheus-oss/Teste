import * as THREE from 'three';
import { RNG } from '../core/rng.js';

// Procedural skyline: one InstancedMesh of boxes. Facades (windows, floors,
// storefronts, glass curtain walls) are generated in the fragment shader from
// each box's local coordinates, so the windows always line up with corners.

export const PITCH = 70;      // street-to-street distance
export const ROAD_HALF = 6.5;
export const WALK_HALF = 10;  // road + sidewalk half width
export const PLAZA = { x0: -60, x1: 60, z0: -60, z1: -10 };

export function inPlaza(x, z, m = 0) {
  return x > PLAZA.x0 - m && x < PLAZA.x1 + m && z > PLAZA.z0 - m && z < PLAZA.z1 + m;
}

export function buildBuildings(scene, envMap) {
  const rng = new RNG(2024);
  const lots = [];
  const R = 17;
  for (let bx = -R; bx < R; bx++) {
    for (let bz = -R; bz < R; bz++) {
      const cx = (bx + 0.5) * PITCH;
      const cz = (bz + 0.5) * PITCH;
      const dist = Math.hypot(cx, cz);
      if (dist > R * PITCH) continue;
      // plaza blocks
      if (inPlaza(cx, cz, 5)) continue;
      const half = PITCH / 2 - WALK_HALF; // 25 → block 50x50
      const centreFactor = Math.exp(-dist / 260);
      const sub = rng.chance(0.55) ? 2 : (rng.chance(0.5) ? 1 : 3);
      const subZ = rng.chance(0.5) ? 2 : 1;
      const lw = (half * 2) / sub, ld = (half * 2) / subZ;
      for (let i = 0; i < sub; i++) {
        for (let j = 0; j < subZ; j++) {
          const gap = 1.2;
          let w = lw - gap, d = ld - gap;
          const x = cx - half + lw * (i + 0.5);
          const z = cz - half + ld * (j + 0.5);
          let h = 12 + rng.float() * 22;
          if (rng.chance(0.25 + centreFactor * 0.6)) h += Math.pow(rng.float(), 1.6) * 190 * centreFactor + 20 * centreFactor;
          if (dist > 700) h *= 0.7;
          const glass = h > 70 ? rng.chance(0.65) : rng.chance(0.12);
          lots.push({ x, z, w, d, h, glass, seed: rng.float() });
          // set-back tower on top of tall podiums
          if (h > 60 && rng.chance(0.5)) {
            const s = rng.float(0.55, 0.8);
            lots.push({ x, z, w: w * s, d: d * s, h: h + rng.float(15, 60), glass, seed: rng.float(), podium: true });
          }
        }
      }
    }
  }

  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  const info = new Float32Array(lots.length * 4);
  const tint = new Float32Array(lots.length * 3);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.0, envMap, envMapIntensity: 1.0 });
  mat.userData.uniforms = { uDamage: { value: 0 }, uTime: { value: 0 } };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 aInfo; attribute vec3 aTint;
        varying vec3 vLocal; varying vec3 vSize; varying vec4 vInfo; varying vec3 vTint; varying vec3 vObjN; varying vec3 vWP;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vLocal=position; vInfo=aInfo; vTint=aTint; vObjN=normal;
        vSize=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
        vWP=(modelMatrix*instanceMatrix*vec4(position,1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uDamage; uniform float uTime;
        varying vec3 vLocal; varying vec3 vSize; varying vec4 vInfo; varying vec3 vTint; varying vec3 vObjN; varying vec3 vWP;
        float bh(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
        float facadeWin; float facadeLit; float facadeFrame; float isRoof; float isGlass; float storefront; float broken;`)
      .replace('#include <map_fragment>', `
        isGlass=vInfo.x;
        isRoof=step(0.5,vObjN.y);
        // facade coordinates in metres from the building corner
        float fu = abs(vObjN.x)>0.5 ? (vLocal.z+0.5)*vSize.z : (vLocal.x+0.5)*vSize.x;
        float fw = abs(vObjN.x)>0.5 ? vSize.z : vSize.x;
        float fv = vLocal.y*vSize.y;
        float floorH = mix(3.4,3.9,vInfo.y);
        float colW = mix(2.6,4.2,fract(vInfo.y*7.31));
        float cols = max(1.0,floor(fw/colW));
        float cu = fu/(fw/cols);
        float cv = fv/floorH;
        vec2 cell=vec2(floor(cu),floor(cv));
        vec2 f=fract(vec2(cu,cv));
        float ww = isGlass>0.5 ? 0.92 : mix(0.45,0.7,fract(vInfo.y*3.7));
        float wh = isGlass>0.5 ? 0.86 : 0.55;
        facadeWin = step(abs(f.x-0.5),ww*0.5)*step(abs(f.y-0.55),wh*0.5);
        storefront = step(fv,4.2)*step(0.7,fv);
        if(storefront>0.5){ facadeWin=step(abs(fract(fu/6.0)-0.5),0.42); }
        // top band / parapet
        float parapet=step(vSize.y-1.2,fv);
        facadeWin*=1.0-parapet; facadeWin*=1.0-isRoof;
        float rnd=bh(cell+vInfo.y*91.0+vObjN.xz*13.0);
        facadeLit = step(rnd, mix(0.05,0.14,vInfo.z)) * facadeWin;
        broken = step(rnd, uDamage*0.22*step(fv,40.0))*facadeWin;
        // anti-alias the procedural facade at distance: fade to the average
        float aa=clamp(max(fwidth(cu),fwidth(cv))*1.6-0.35,0.0,1.0);
        facadeWin=mix(facadeWin,ww*wh*(1.0-parapet)*(1.0-isRoof),aa);
        facadeLit=mix(facadeLit,0.08*facadeWin,aa);
        broken*=1.0-aa;
        facadeFrame=0.0;
        vec3 base=vTint;
        // floor slab lines and subtle weathering
        float slab=smoothstep(0.03,0.0,abs(f.y-0.02))*(1.0-isGlass);
        float grime=0.85+0.15*bh(floor(vec2(fu,fv)*0.5));
        base*=grime*(1.0-slab*0.25);
        float vgrad=0.75+0.25*smoothstep(0.0,30.0,fv);
        base*=vgrad;
        vec3 glassCol = mix(vec3(0.10,0.11,0.12),vec3(0.2,0.22,0.24),bh(cell*1.7));
        vec3 c = mix(base, glassCol, facadeWin);
        c = mix(c, vec3(0.03), broken);
        c = mix(c, vTint*0.55, isRoof);
        diffuseColor.rgb = c;`)
      .replace('#include <roughnessmap_fragment>', `
        float roughnessFactor = mix(0.85, 0.08, facadeWin*(1.0-broken));
        roughnessFactor = mix(roughnessFactor,0.9,isRoof);`)
      .replace('#include <metalnessmap_fragment>', `
        float metalnessFactor = mix(0.0, 0.85, facadeWin*(1.0-broken)*(0.5+0.5*isGlass));`)
      .replace('#include <emissivemap_fragment>', `
        vec3 litCol = mix(vec3(1.0,0.72,0.42), vec3(0.85,0.9,1.0), step(0.8,bh(cell+3.1)));
        totalEmissiveRadiance += litCol * facadeLit * (0.45+storefront*1.2) * (1.0-broken);
        // embers in broken windows after the event
        float fire = broken*step(0.8,bh(cell*2.3))*(0.6+0.4*sin(uTime*9.0+cell.x*3.0+cell.y));
        totalEmissiveRadiance += vec3(3.0,0.9,0.25)*fire*uDamage;`);
  };

  const mesh = new THREE.InstancedMesh(geo, mat, lots.length);
  const m = new THREE.Matrix4();
  const palette = [
    [0.62, 0.58, 0.52], [0.7, 0.65, 0.57], [0.52, 0.49, 0.45], [0.66, 0.54, 0.43],
    [0.46, 0.44, 0.42], [0.74, 0.7, 0.62], [0.58, 0.42, 0.34], [0.40, 0.42, 0.45],
  ];
  lots.forEach((L, i) => {
    m.makeScale(L.w, L.h, L.d);
    m.setPosition(L.x, 0, L.z);
    mesh.setMatrixAt(i, m);
    const p = palette[Math.floor(L.seed * palette.length)];
    const k = L.glass ? 0.6 : 1.0;
    tint.set([p[0] * k, p[1] * k, p[2] * k * (L.glass ? 1.15 : 1)], i * 3);
    info.set([L.glass ? 1 : 0, L.seed, rng.float(), 0], i * 4);
  });
  geo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4));
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);

  // Rooftop clutter near the centre (AC units, water tanks, antennas)
  const roofItems = [];
  const r2 = new RNG(99);
  for (const L of lots) {
    if (Math.hypot(L.x, L.z) > 420) continue;
    const n = r2.int(1, 4);
    for (let k = 0; k < n; k++) {
      const s = r2.float(1.5, 4);
      roofItems.push({ x: L.x + r2.float(-0.35, 0.35) * L.w, z: L.z + r2.float(-0.35, 0.35) * L.d, y: L.h, w: s, h: r2.float(1, 3), d: s * r2.float(0.6, 1.2) });
    }
    if (L.h > 120 && r2.chance(0.6)) roofItems.push({ x: L.x, z: L.z, y: L.h, w: 0.4, h: r2.float(12, 30), d: 0.4 });
  }
  const roofGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5a5856, roughness: 0.8, metalness: 0.3, envMap });
  const roofs = new THREE.InstancedMesh(roofGeo, roofMat, roofItems.length);
  roofItems.forEach((r, i) => { m.makeScale(r.w, r.h, r.d); m.setPosition(r.x, r.y, r.z); roofs.setMatrixAt(i, m); });
  roofs.castShadow = true; roofs.receiveShadow = true; roofs.frustumCulled = false;
  scene.add(roofs);

  // Aircraft warning beacons on the tallest towers
  const beacons = lots.filter((L) => L.h > 140);
  const bGeo = new THREE.SphereGeometry(0.6, 8, 6);
  const bMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(8, 0.4, 0.2) });
  const bm = new THREE.InstancedMesh(bGeo, bMat, Math.max(1, beacons.length));
  beacons.forEach((L, i) => { m.makeTranslation(L.x, L.h + 1, L.z); bm.setMatrixAt(i, m); });
  bm.count = beacons.length;
  scene.add(bm);

  return { mesh, material: mat, lots, beacons: bm };
}
