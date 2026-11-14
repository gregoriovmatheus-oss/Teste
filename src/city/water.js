import * as THREE from 'three';
import { RNG } from '../core/rng.js';
import { PARTICLE_FOG } from '../core/heightFog.js';

export const FOUNTAIN = new THREE.Vector3(0, 0, -35);

// Stone fountain (static) --------------------------------------------------------
export function buildFountain(scene, envMap) {
  const stone = new THREE.MeshStandardMaterial({ color: 0x9a9084, roughness: 0.75, envMap });
  const g = new THREE.Group();
  const lathe = (pts, seg = 64) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
  const basin = new THREE.Mesh(lathe([[6.3, 0], [7.4, 0], [7.5, 0.75], [7.2, 0.85], [6.6, 0.85], [6.4, 0.75], [6.3, 0.1], [0.01, 0.1]]), stone);
  const ped = new THREE.Mesh(lathe([[0.01, 0], [1.2, 0], [1.0, 0.4], [0.6, 0.6], [0.55, 1.6], [2.6, 1.7], [2.8, 1.95], [2.5, 2.05], [0.45, 2.0], [0.4, 3.2], [1.3, 3.3], [1.45, 3.5], [1.2, 3.55], [0.3, 3.55], [0.25, 4.4], [0.4, 4.6], [0.01, 4.7]]), stone);
  basin.castShadow = basin.receiveShadow = true;
  ped.castShadow = ped.receiveShadow = true;
  g.add(basin, ped);
  // water surfaces
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d2a30, roughness: 0.28, metalness: 0.0, envMap, envMapIntensity: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.1,
    transparent: true, opacity: 0.92,
  });
  waterMat.userData.uniforms = { uTime: { value: 0 }, uAgit: { value: 0.2 } };
  waterMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, waterMat.userData.uniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPw;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPw=(modelMatrix*vec4(position,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uAgit; varying vec3 vWPw;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec2 wq=vWPw.xz;
        float r=length(wq-vec2(0.0,-35.0));
        vec2 n2=vec2(sin(r*5.0-uTime*6.0)+sin(wq.x*3.1+uTime*2.0)*0.5, cos(r*4.3-uTime*5.0)+cos(wq.y*2.7-uTime*1.7)*0.5)*0.06*uAgit;
        normal=normalize(normal+vec3(n2.x,0.0,n2.y));`);
  };
  const surf = new THREE.Mesh(new THREE.CircleGeometry(6.35, 64), waterMat);
  surf.rotation.x = -Math.PI / 2;
  surf.position.y = 0.62;
  const bowl1 = new THREE.Mesh(new THREE.CircleGeometry(2.5, 48), waterMat);
  bowl1.rotation.x = -Math.PI / 2; bowl1.position.y = 1.9;
  const bowl2 = new THREE.Mesh(new THREE.CircleGeometry(1.25, 32), waterMat);
  bowl2.rotation.x = -Math.PI / 2; bowl2.position.y = 3.45;
  surf.receiveShadow = true;
  g.add(surf, bowl1, bowl2);
  g.position.copy(FOUNTAIN);
  scene.add(g);
  return { group: g, surface: surf, bowls: [bowl1, bowl2], waterMat };
}

// Analytic fountain jets (points). Before release they arc; after release each
// droplet keeps the velocity it had and drifts; when gravity returns they fall.
export class FountainJets {
  constructor(scene) {
    const rng = new RNG(5);
    const jets = [];
    // central plume
    jets.push({ o: [0, 4.7, 0], v: [0, 7.5, 0], spread: 0.35, w: 3 });
    // ring of arcs from the basin rim towards the centre
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      jets.push({ o: [Math.cos(a) * 6.2, 0.8, Math.sin(a) * 6.2], v: [-Math.cos(a) * 2.6, 5.2, -Math.sin(a) * 2.6], spread: 0.12, w: 1 });
    }
    // bowl overflow sheets
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      jets.push({ o: [Math.cos(a) * 2.75, 1.95, Math.sin(a) * 2.75], v: [Math.cos(a) * 0.5, 0.1, Math.sin(a) * 0.5], spread: 0.05, w: 0.5 });
    }
    const totalW = jets.reduce((s, j) => s + j.w, 0);
    const N = 9000;
    const o = new Float32Array(N * 3), v = new Float32Array(N * 3), ph = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      let r = rng.float() * totalW, j = jets[0];
      for (const jj of jets) { r -= jj.w; if (r <= 0) { j = jj; break; } }
      o.set(j.o, i * 3);
      v.set([j.v[0] + rng.gauss(0, j.spread), j.v[1] + rng.gauss(0, j.spread), j.v[2] + rng.gauss(0, j.spread)], i * 3);
      ph.set([rng.float(), rng.float()], i * 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(o, 3));
    g.setAttribute('aVel', new THREE.BufferAttribute(v, 3));
    g.setAttribute('aPh', new THREE.BufferAttribute(ph, 2));
    this.mat = new THREE.ShaderMaterial({
      fog: true,
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        uT: { value: 0 }, uOff: { value: 1e6 }, uOn: { value: 1e6 }, uScale: { value: 500 }, uOrigin: { value: FOUNTAIN.clone() },
        uSun: { value: new THREE.Vector3(0, 1, 0) },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aVel; attribute vec2 aPh;
        uniform float uT, uOff, uOn, uScale; uniform vec3 uOrigin;
        varying float vA;
        #include <fog_pars_vertex>
        const float G=-9.81; const float LIFE=1.6;
        vec3 arc(float a){ return position+aVel*a+vec3(0.0,0.5*G*a*a,0.0); }
        vec3 arcV(float a){ return aVel+vec3(0.0,G*a,0.0); }
        void main(){
          float rate=1.0/LIFE;
          vec3 p; float alpha=1.0;
          if(uT<uOff){
            float a=fract(uT*rate+aPh.x)*LIFE;
            p=arc(a);
            alpha=step(0.62,p.y)*smoothstep(0.0,0.1,a);
          } else {
            float a0=fract(uOff*rate+aPh.x)*LIFE;
            vec3 p0=arc(a0); vec3 v0=arcV(a0);
            if(p0.y<0.62){ p0.y=0.62+aPh.y*0.3; v0=vec3(v0.x*0.2,0.15+aPh.y*0.5,v0.z*0.2); }
            float tf=min(uT,uOn)-uOff;
            float k=0.35;
            p=p0+v0*(1.0-exp(-k*tf))/k;
            vec3 vEnd=v0*exp(-k*tf);
            if(uT>uOn){ float tr=uT-uOn; p+=vEnd*tr+vec3(0.0,0.5*G*tr*tr,0.0); alpha=step(0.6,p.y); }
          }
          vec4 mv=modelViewMatrix*vec4(p+uOrigin,1.0);
          gl_Position=projectionMatrix*mv;
          vec4 mvPosition=mv;
          #include <fog_vertex>
          gl_PointSize=clamp((0.05+aPh.y*0.06)*uScale/(-mv.z),1.0,40.0);
          vA=alpha;
        }`,
      fragmentShader: /* glsl */ `
        precision highp float; varying float vA;
        #include <fog_pars_fragment>
        void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); if(d>0.5||vA<0.01) discard;
          float a=smoothstep(0.5,0.1,d)*vA;
          float hl=smoothstep(0.25,0.0,length(c-vec2(-0.12,-0.12)));
          gl_FragColor=vec4(vec3(0.75,0.88,0.95)*(0.22+hl*0.9)*a*0.6, a*0.5);
          ${PARTICLE_FOG}
        }`,
      transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 9;
    scene.add(this.points);
  }
  update(t, tOff, tOn, pixelScale) {
    const u = this.mat.uniforms;
    u.uT.value = t; u.uOff.value = tOff ?? 1e6; u.uOn.value = tOn ?? 1e6; u.uScale.value = pixelScale;
  }
}

// Wobbling water spheres (transmissive) ---------------------------------------
export function createWaterBlobMaterial(envMap) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xeaf8ff, roughness: 0.02, metalness: 0, transmission: 1, thickness: 1.2, ior: 1.33,
    attenuationColor: new THREE.Color(0.55, 0.85, 0.9), attenuationDistance: 2.5,
    envMap, envMapIntensity: 1.5, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.0,
  });
  m.userData.uniforms = { uTime: { value: 0 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, m.userData.uniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
      uniform float uTime;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      float ph = instanceMatrix[3].x*0.37+instanceMatrix[3].z*0.71;
      float wob = sin(position.x*3.0+uTime*3.1+ph)*sin(position.y*2.6+uTime*2.3+ph*1.3)*0.08
                + sin(position.z*4.0-uTime*2.7+ph*2.1)*0.05;
      transformed += normal*wob;`);
  };
  return m;
}
