import * as THREE from 'three';
import { NOISE_GLSL } from '../core/noise.glsl.js';
import { RNG } from '../core/rng.js';

// Stars at several depths, a faint galactic band, the Sun, and distant debris.
export class Starfield {
  constructor(sunDir) {
    this.group = new THREE.Group();
    this.sunDir = sunDir;
    this._stars();
    this._galaxy();
    this._sun();
  }

  _stars() {
    const rng = new RNG(9);
    const layers = [
      { n: 9000, r: 400, size: 1.1 },
      { n: 3500, r: 300, size: 1.8 },
      { n: 500, r: 220, size: 3.2 },
    ];
    this.starMats = [];
    for (const L of layers) {
      const pos = new Float32Array(L.n * 3);
      const col = new Float32Array(L.n * 3);
      const rnd = new Float32Array(L.n);
      const c = new THREE.Color();
      for (let i = 0; i < L.n; i++) {
        // concentrate some stars along the galactic plane
        let x = rng.gauss(), y = rng.gauss(), z = rng.gauss();
        if (rng.chance(0.4)) y *= 0.18;
        const l = Math.hypot(x, y, z) || 1;
        // tilt galactic plane
        const yy = y * 0.8 + x * 0.6, xx = x * 0.8 - y * 0.6;
        pos[i * 3] = (xx / l) * L.r; pos[i * 3 + 1] = (yy / l) * L.r; pos[i * 3 + 2] = (z / l) * L.r;
        const temp = rng.float();
        if (temp < 0.15) c.setRGB(0.65, 0.75, 1.0);
        else if (temp < 0.7) c.setRGB(1.0, 0.97, 0.92);
        else if (temp < 0.9) c.setRGB(1.0, 0.85, 0.6);
        else c.setRGB(1.0, 0.65, 0.45);
        const m = Math.pow(rng.float(), 3.0) * 2.5 + 0.25;
        col[i * 3] = c.r * m; col[i * 3 + 1] = c.g * m; col[i * 3 + 2] = c.b * m;
        rnd[i] = rng.float();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uSize: { value: L.size }, uScale: { value: 1 }, uFade: { value: 1 } },
        vertexShader: /* glsl */ `
          attribute float aRnd; attribute vec3 color;
          uniform float uTime; uniform float uSize; uniform float uScale;
          varying vec3 vCol; varying float vTw;
          void main(){
            vCol=color;
            vTw=0.75+0.25*sin(uTime*(1.5+aRnd*4.0)+aRnd*40.0);
            vec4 mv=modelViewMatrix*vec4(position,1.0);
            gl_Position=projectionMatrix*mv;
            gl_PointSize=uSize*uScale*(0.6+aRnd*0.8);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uFade; varying vec3 vCol; varying float vTw;
          void main(){
            vec2 c=gl_PointCoord-0.5; float d=length(c);
            float a=smoothstep(0.5,0.0,d); a*=a;
            gl_FragColor=vec4(vCol*a*vTw*uFade,1.0);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this.starMats.push(mat);
      const pts = new THREE.Points(g, mat);
      pts.frustumCulled = false;
      pts.renderOrder = -10;
      this.group.add(pts);
    }
  }

  _galaxy() {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uFade: { value: 1 } },
      vertexShader: `varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: /* glsl */ `
        uniform float uFade; varying vec3 vDir;
        ${NOISE_GLSL}
        void main(){
          vec3 d=normalize(vDir);
          // galactic plane tilted like the star distribution
          vec3 n=normalize(vec3(-0.6,0.8,0.0));
          float b=dot(d,n);
          float band=exp(-b*b*28.0);
          float dust=fbm3(d*6.0,6)*0.5+0.5;
          float neb=fbm3(d*2.5+vec3(4.0),5)*0.5+0.5;
          float lanes=smoothstep(0.45,0.75,fbm3(d*9.0+vec3(2.0),5)*0.5+0.5);
          vec3 col=vec3(0.30,0.32,0.45)*band*dust*(1.0-lanes*0.8)*0.35;
          col+=vec3(0.35,0.16,0.28)*pow(neb,4.0)*0.12*band;
          col+=vec3(0.08,0.12,0.25)*pow(neb,3.0)*0.06;
          gl_FragColor=vec4(col*uFade,1.0);
        }`,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.galaxyMat = mat;
    const m = new THREE.Mesh(new THREE.SphereGeometry(450, 64, 32), mat);
    m.renderOrder = -20;
    m.frustumCulled = false;
    this.group.add(m);
  }

  _sun() {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uIntensity: { value: 1 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv*2.0-1.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: /* glsl */ `
        uniform float uIntensity; varying vec2 vUv;
        void main(){
          float r=length(vUv);
          float core=smoothstep(0.075,0.06,r)*40.0;
          float glow=exp(-r*9.0)*6.0+exp(-r*3.0)*0.6;
          float streak=exp(-abs(vUv.y)*180.0)*exp(-abs(vUv.x)*2.2)*2.5;
          float rays=pow(max(cos(atan(vUv.y,vUv.x)*6.0),0.0),30.0)*exp(-r*5.0)*0.8;
          vec3 col=vec3(1.0,0.93,0.82)*(core+glow+rays)+vec3(0.55,0.75,1.0)*streak;
          gl_FragColor=vec4(col*uIntensity,1.0);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sunMat = mat;
    this.sun = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), mat);
    this.sun.renderOrder = -5;
    this.sun.position.copy(this.sunDir).multiplyScalar(350);
    this.group.add(this.sun);
  }

  _moon() {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uSunDir: { value: this.sunDir } },
      vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(normal); vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunDir; varying vec3 vN; varying vec3 vP;
        ${NOISE_GLSL}
        void main(){
          vec3 n=normalize(vN);
          float m=fbm3(n*3.0,5)*0.5+0.5;
          float cr=ridged(n*9.0,4);
          vec3 alb=mix(vec3(0.32),vec3(0.55),smoothstep(0.35,0.65,m))*(0.8+cr*0.3);
          float d=max(dot(n,normalize(uSunDir)),0.0);
          gl_FragColor=vec4(alb*d*1.6,1.0);
        }`,
    });
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(4.5, 64, 32), mat);
    this.moon.position.set(-90, 25, -150);
    this.group.add(this.moon);
  }

  update(t, camera, fade = 1) {
    // stars follow the camera so they are effectively at infinity
    this.group.position.copy(camera.position);
    this.sun.quaternion.copy(camera.quaternion);
    for (const m of this.starMats) { m.uniforms.uTime.value = t; m.uniforms.uFade.value = fade; }
    this.galaxyMat.uniforms.uFade.value = fade;
  }
}
