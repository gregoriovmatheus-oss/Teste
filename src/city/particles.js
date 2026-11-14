import * as THREE from 'three';
import { PARTICLE_FOG } from '../core/heightFog.js';

// Camera-facing billboard particles (instanced quads, no point-size limits).
// Types: 0 soft dust, 1 smoke, 2 spark/glow, 3 droplet

const billVert = /* glsl */ `
attribute vec3 iPos;
attribute vec4 iCol;
attribute vec3 iMisc; // size, rotation, type
varying vec2 vUv;
varying vec4 vCol;
varying float vType;
varying float vSeed;
#include <fog_pars_vertex>
void main(){
  vUv=uv; vCol=iCol; vType=iMisc.z; vSeed=fract(iPos.x*0.37+iPos.z*0.71);
  vec4 mv=viewMatrix*vec4(iPos,1.0);
  float c=cos(iMisc.y), s=sin(iMisc.y);
  vec2 q=(position.xy)*iMisc.x;
  q=vec2(c*q.x-s*q.y, s*q.x+c*q.y);
  mv.xy+=q;
  gl_Position=projectionMatrix*mv;
  vec4 mvPosition=mv;
  #include <fog_vertex>
}`;

const billFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying vec4 vCol;
varying float vType;
varying float vSeed;
#include <fog_pars_fragment>
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
void main(){
  vec2 c=vUv-0.5;
  float r=length(c)*2.0;
  float a;
  if(vType<0.5){ a=smoothstep(1.0,0.0,r); a*=a; }
  else if(vType<1.5){
    float n=vn(vUv*4.0+vSeed*17.0)*0.6+vn(vUv*9.0-vSeed*5.0)*0.4;
    a=smoothstep(1.0,0.2,r+ (n-0.5)*0.7); a*=a;
  } else if(vType<2.5){ a=exp(-r*r*5.0); }
  else { a=smoothstep(1.0,0.75,r); float hl=smoothstep(0.35,0.0,length(c-vec2(-0.12,0.12))); a=a*0.35+hl*0.9; }
  if(a*vCol.a<0.002) discard;
  gl_FragColor=vec4(vCol.rgb*a*vCol.a, a*vCol.a);
  ${PARTICLE_FOG}
}`;

export class Billboards {
  constructor(capacity, { additive = false, renderOrder = 10 } = {}) {
    this.cap = capacity;
    const quad = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = quad.index;
    g.setAttribute('position', quad.attributes.position);
    g.setAttribute('uv', quad.attributes.uv);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.aMisc = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iPos', this.aPos);
    g.setAttribute('iCol', this.aCol);
    g.setAttribute('iMisc', this.aMisc);
    g.instanceCount = 0;
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      fog: true,
      vertexShader: billVert,
      fragmentShader: billFrag,
      transparent: true,
      depthWrite: false,
      // premultiplied output
      blending: additive ? THREE.AdditiveBlending : THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    if (additive) { this.mat.blending = THREE.CustomBlending; this.mat.blendSrc = THREE.OneFactor; this.mat.blendDst = THREE.OneFactor; }
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = renderOrder;
    // particle state
    const n = capacity;
    this.p = new Float32Array(n * 3);
    this.v = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.age = new Float32Array(n).fill(1e9);
    this.s0 = new Float32Array(n);
    this.s1 = new Float32Array(n);
    this.a0 = new Float32Array(n);
    this.drag = new Float32Array(n);
    this.gf = new Float32Array(n);
    this.rot = new Float32Array(n);
    this.rv = new Float32Array(n);
    this.type = new Float32Array(n);
    this.fadeIn = new Float32Array(n);
    this.delay = new Float32Array(n);
    this.cursor = 0;
    this.alive = 0;
  }

  emit(o) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.cap;
    this.p[i * 3] = o.x; this.p[i * 3 + 1] = o.y; this.p[i * 3 + 2] = o.z;
    this.v[i * 3] = o.vx || 0; this.v[i * 3 + 1] = o.vy || 0; this.v[i * 3 + 2] = o.vz || 0;
    this.col[i * 3] = o.r; this.col[i * 3 + 1] = o.g; this.col[i * 3 + 2] = o.b;
    this.life[i] = o.life; this.age[i] = 0;
    this.s0[i] = o.s0; this.s1[i] = o.s1 ?? o.s0;
    this.a0[i] = o.a ?? 1;
    this.drag[i] = o.drag ?? 0.5;
    this.gf[i] = o.gf ?? 1;
    this.rot[i] = o.rot ?? Math.random() * 6.28;
    this.rv[i] = o.rv ?? 0;
    this.type[i] = o.type ?? 0;
    this.fadeIn[i] = o.fadeIn ?? 0.1;
    this.delay[i] = o.delay ?? 0;
  }

  update(dt, g) {
    let k = 0;
    const P = this.aPos.array, C = this.aCol.array, M = this.aMisc.array;
    for (let i = 0; i < this.cap; i++) {
      if (this.age[i] >= this.life[i]) continue;
      if (this.delay[i] > 0) { this.delay[i] -= dt; continue; }
      const a = (this.age[i] += dt);
      const t = a / this.life[i];
      if (t >= 1) continue;
      const i3 = i * 3;
      this.v[i3 + 1] += g * this.gf[i] * dt;
      const d = Math.exp(-this.drag[i] * dt);
      this.v[i3] *= d; this.v[i3 + 1] *= d; this.v[i3 + 2] *= d;
      this.p[i3] += this.v[i3] * dt; this.p[i3 + 1] += this.v[i3 + 1] * dt; this.p[i3 + 2] += this.v[i3 + 2] * dt;
      if (this.p[i3 + 1] < 0.05) { this.p[i3 + 1] = 0.05; this.v[i3 + 1] = Math.abs(this.v[i3 + 1]) * 0.1; }
      this.rot[i] += this.rv[i] * dt;
      const fi = Math.min(1, a / Math.max(1e-3, this.fadeIn[i]));
      const fo = 1 - t * t;
      P[k * 3] = this.p[i3]; P[k * 3 + 1] = this.p[i3 + 1]; P[k * 3 + 2] = this.p[i3 + 2];
      C[k * 4] = this.col[i3]; C[k * 4 + 1] = this.col[i3 + 1]; C[k * 4 + 2] = this.col[i3 + 2];
      C[k * 4 + 3] = this.a0[i] * fi * fo;
      M[k * 3] = this.s0[i] + (this.s1[i] - this.s0[i]) * Math.sqrt(t);
      M[k * 3 + 1] = this.rot[i];
      M[k * 3 + 2] = this.type[i];
      k++;
    }
    this.alive = k;
    this.geo.instanceCount = k;
    this.aPos.needsUpdate = true; this.aCol.needsUpdate = true; this.aMisc.needsUpdate = true;
    this.aPos.updateRanges = []; this.aCol.updateRanges = []; this.aMisc.updateRanges = [];
    this.aPos.addUpdateRange(0, k * 3); this.aCol.addUpdateRange(0, k * 4); this.aMisc.addUpdateRange(0, k * 3);
  }
}

// Expanding ground shock rings ------------------------------------------------
export class ShockRings {
  constructor(capacity = 48) {
    this.cap = capacity;
    const g = new THREE.PlaneGeometry(2, 2);
    g.rotateX(-Math.PI / 2);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute vec4 iData; // x,z, radius, alpha
        varying vec2 vUv; varying float vA;
        void main(){ vUv=uv*2.0-1.0; vA=iData.w;
          vec3 p=position*iData.z+vec3(iData.x,0.06,iData.y);
          gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0); }`,
      fragmentShader: /* glsl */ `
        precision highp float; varying vec2 vUv; varying float vA;
        void main(){ float r=length(vUv); float band=exp(-pow((r-0.92)*16.0,2.0))+exp(-pow((r-0.8)*30.0,2.0))*0.4;
          float a=band*vA*step(r,1.0);
          gl_FragColor=vec4(vec3(1.0,0.85,0.68)*a*0.9, a*0.45); }`,
      transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    const ig = new THREE.InstancedBufferGeometry();
    ig.index = g.index;
    ig.setAttribute('position', g.attributes.position);
    ig.setAttribute('uv', g.attributes.uv);
    this.data = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4).setUsage(THREE.DynamicDrawUsage);
    ig.setAttribute('iData', this.data);
    ig.instanceCount = 0;
    this.geo = ig;
    this.mesh = new THREE.Mesh(ig, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 8;
    this.rings = [];
  }
  add(x, z, maxR, life = 1.4, strength = 1) { this.rings.push({ x, z, maxR, life, age: 0, s: strength }); if (this.rings.length > this.cap) this.rings.shift(); }
  update(dt) {
    const D = this.data.array;
    let k = 0;
    this.rings = this.rings.filter((r) => (r.age += dt) < r.life);
    for (const r of this.rings) {
      const t = r.age / r.life;
      const e = 1 - Math.pow(1 - t, 3);
      D[k * 4] = r.x; D[k * 4 + 1] = r.z; D[k * 4 + 2] = 0.5 + r.maxR * e; D[k * 4 + 3] = (1 - t) * (1 - t) * r.s;
      k++;
    }
    this.geo.instanceCount = k;
    this.data.needsUpdate = true;
  }
}

// Cracked asphalt decals ------------------------------------------------------
export class Cracks {
  constructor(capacity = 160) {
    this.cap = capacity;
    const g = new THREE.PlaneGeometry(2, 2);
    g.rotateX(-Math.PI / 2);
    this.mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute vec4 iData; // x,z,size,seed
        uniform float uTime;
        varying vec2 vUv; varying float vSeed;
        void main(){ vUv=uv*2.0-1.0; vSeed=iData.w;
          float c=cos(vSeed*40.0), s=sin(vSeed*40.0);
          vec3 p=position; p.xz=mat2(c,-s,s,c)*p.xz;
          p=p*iData.z+vec3(iData.x,0.03,iData.y);
          gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0); }`,
      fragmentShader: /* glsl */ `
        precision highp float; varying vec2 vUv; varying float vSeed;
        float h(float n){ return fract(sin(n)*43758.5453); }
        void main(){
          float r=length(vUv); float ang=atan(vUv.y,vUv.x);
          float cracks=0.0;
          for(int i=0;i<9;i++){
            float fi=float(i);
            float a0=h(fi*7.1+vSeed*13.0)*6.2831;
            float jag=sin(r*28.0+fi*3.0)*0.07+sin(r*61.0+fi)*0.03;
            float d=abs(sin(ang-a0+jag));
            float w=0.012*(1.2-r);
            cracks=max(cracks,smoothstep(w,0.0,d*r)*step(r,0.35+0.65*h(fi+vSeed)));
          }
          float ring=smoothstep(0.03,0.0,abs(r-0.28-0.05*sin(ang*7.0+vSeed*9.0)))*0.8;
          float crater=smoothstep(0.38,0.0,r);
          float a=max(max(cracks,ring),crater*0.55)*smoothstep(1.0,0.75,r);
          gl_FragColor=vec4(vec3(0.0),a*0.85);
        }`,
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    const ig = new THREE.InstancedBufferGeometry();
    ig.index = g.index;
    ig.setAttribute('position', g.attributes.position);
    ig.setAttribute('uv', g.attributes.uv);
    this.data = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4);
    ig.setAttribute('iData', this.data);
    ig.instanceCount = 0;
    this.geo = ig;
    this.mesh = new THREE.Mesh(ig, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.n = 0;
  }
  add(x, z, size, seed) {
    if (this.n >= this.cap) return;
    this.data.array.set([x, z, size, seed], this.n * 4);
    this.n++;
    this.geo.instanceCount = this.n;
    this.data.needsUpdate = true;
  }
}

// Small ballistic rubble chunks ----------------------------------------------
export class Rubble {
  constructor(capacity, material) {
    this.cap = capacity;
    const geo = new THREE.DodecahedronGeometry(1, 0);
    this.mesh = new THREE.InstancedMesh(geo, material, capacity);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.p = new Float32Array(capacity * 3);
    this.v = new Float32Array(capacity * 3);
    this.s = new Float32Array(capacity);
    this.r = new Float32Array(capacity * 3);
    this.rv = new Float32Array(capacity * 3);
    this.rest = new Uint8Array(capacity);
    this.used = new Uint8Array(capacity);
    this.cursor = 0;
    this._m = new THREE.Matrix4();
    this._e = new THREE.Euler();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3();
    const z = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < capacity; i++) this.mesh.setMatrixAt(i, z);
  }
  emit(x, y, z, vx, vy, vz, s) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % this.cap;
    this.p.set([x, y, z], i * 3); this.v.set([vx, vy, vz], i * 3);
    this.s[i] = s; this.used[i] = 1; this.rest[i] = 0;
    this.r.set([Math.random() * 6, Math.random() * 6, Math.random() * 6], i * 3);
    this.rv.set([(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12], i * 3);
  }
  update(dt, g) {
    for (let i = 0; i < this.cap; i++) {
      if (!this.used[i] || this.rest[i]) continue;
      const i3 = i * 3;
      this.v[i3 + 1] += g * dt;
      this.p[i3] += this.v[i3] * dt; this.p[i3 + 1] += this.v[i3 + 1] * dt; this.p[i3 + 2] += this.v[i3 + 2] * dt;
      this.r[i3] += this.rv[i3] * dt; this.r[i3 + 1] += this.rv[i3 + 1] * dt; this.r[i3 + 2] += this.rv[i3 + 2] * dt;
      if (this.p[i3 + 1] < this.s[i] * 0.6) {
        this.p[i3 + 1] = this.s[i] * 0.6;
        if (Math.abs(this.v[i3 + 1]) < 1.2) { this.rest[i] = 1; }
        this.v[i3 + 1] = Math.abs(this.v[i3 + 1]) * 0.3; this.v[i3] *= 0.5; this.v[i3 + 2] *= 0.5;
        this.rv[i3] *= 0.4; this.rv[i3 + 1] *= 0.4; this.rv[i3 + 2] *= 0.4;
      }
      this._e.set(this.r[i3], this.r[i3 + 1], this.r[i3 + 2]);
      this._q.setFromEuler(this._e);
      this._v.set(this.p[i3], this.p[i3 + 1], this.p[i3 + 2]);
      this._s.set(this.s[i], this.s[i] * 0.7, this.s[i] * 0.9);
      this._m.compose(this._v, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
