import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

// Cinematic post pipeline:
// scene(HDR, MSAA, depth) → god rays (½ res) → height fog + rays composite →
// bloom → depth of field → camera motion blur, lens FX, ACES, grade, grain.

const quadVert = /* glsl */ `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`;

const DEPTH_FN = /* glsl */ `
uniform float uNear; uniform float uFar;
float viewZ(float d){ return (uNear*uFar)/((uFar-uNear)*d-uFar); } // negative
float linDepth(float d){ return -viewZ(d); }
`;

const godFrag = /* glsl */ `
precision highp float;
uniform sampler2D tDepth;
uniform vec2 uSun;       // sun uv
uniform float uSunFront; // 0..1 sun in front of camera
uniform float uAspect;
varying vec2 vUv;
void main(){
  vec2 d=(uSun-vUv);
  const int N=48;
  vec2 stepv=d/float(N);
  float dither=fract(sin(dot(vUv*1000.0,vec2(12.9898,78.233)))*43758.5453);
  vec2 p=vUv+stepv*dither;
  float acc=0.0; float w=1.0;
  for(int i=0;i<N;i++){
    float z=texture2D(tDepth,p).r;
    float sky=step(0.99995,z);
    vec2 q=(p-uSun); q.x*=uAspect;
    float prox=exp(-dot(q,q)*9.0);
    acc+=sky*prox*w;
    w*=0.985;
    p+=stepv;
  }
  acc/=float(N);
  // occlusion-at-sun for the flare system
  vec2 q=(vUv-uSun); q.x*=uAspect;
  gl_FragColor=vec4(acc*uSunFront, 0.0, 0.0, 1.0);
}`;

const compFrag = /* glsl */ `
precision highp float;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tGod;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uFogFalloff;
uniform float uFogBase;
uniform float uSkyDist;
uniform float uGodStrength;
uniform vec3 uGodColor;
uniform float uClampHDR;
${DEPTH_FN}
varying vec2 vUv;
void main(){
  vec3 col=texture2D(tColor,vUv).rgb;
  float d=texture2D(tDepth,vUv).r;
  vec4 ndc=vec4(vUv*2.0-1.0,d*2.0-1.0,1.0);
  vec4 vp=uInvProj*ndc; vp/=vp.w;
  vec3 wp=(uCamWorld*vec4(vp.xyz,1.0)).xyz;
  vec3 rd=normalize(wp-uCamPos);
  float dist=length(wp-uCamPos);
  bool sky=d>=0.99995;
  if(sky) dist=uSkyDist;
  if(uFogDensity>0.0 && sky){
    float b=uFogFalloff;
    float ry=rd.y; if(abs(ry)<1e-3) ry=1e-3*sign(ry+1e-6);
    float fog=(uFogDensity/b)*exp(-(uCamPos.y-uFogBase)*b)*(1.0-exp(-dist*ry*b))/ry;
    float f=1.0-exp(-max(fog,0.0));
    float sunAmt=pow(max(dot(rd,normalize(uSunDir)),0.0),6.0);
    vec3 fc=mix(uFogColor,uSunColor,sunAmt*0.8);
    col=mix(col,fc,clamp(f,0.0,1.0)*(sky?0.85:1.0));
  }
  float g=texture2D(tGod,vUv).r;
  col+=uGodColor*g*uGodStrength;
  // soft clamp of extreme HDR values (sun disk) so bloom stays controlled
  float lum=max(max(col.r,col.g),col.b);
  col*=min(1.0,uClampHDR/max(lum,1e-4));
  gl_FragColor=vec4(col,1.0);
}`;

const dofFrag = /* glsl */ `
precision highp float;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uRes;
uniform float uFocus;
uniform float uBlur;     // 0..1 amount
uniform float uMaxR;     // px
${DEPTH_FN}
varying vec2 vUv;
float coc(float z){ return clamp(abs(1.0-uFocus/z)*uBlur,0.0,1.0)*uMaxR; }
void main(){
  float zc=linDepth(texture2D(tDepth,vUv).r);
  float cc=coc(zc);
  vec3 center=texture2D(tColor,vUv).rgb;
  if(uBlur<0.001 || uMaxR<0.5){ gl_FragColor=vec4(center,1.0); return; }
  vec3 acc=center; float wsum=1.0;
  const int N=36;
  const float GA=2.39996323;
  for(int i=1;i<N;i++){
    float fi=float(i);
    float r=sqrt(fi/float(N))*uMaxR;
    float a=fi*GA;
    vec2 o=vec2(cos(a),sin(a))*r/uRes;
    vec2 uv=vUv+o;
    float zs=linDepth(texture2D(tDepth,uv).r);
    float cs=coc(zs);
    float w=clamp(cs-r+1.0,0.0,1.0);
    if(zs>zc) w*=clamp(cc-r+1.0,0.0,1.0);
    vec3 c=texture2D(tColor,uv).rgb;
    acc+=c*w; wsum+=w;
  }
  gl_FragColor=vec4(acc/wsum,1.0);
}`;

const finalFrag = /* glsl */ `
precision highp float;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tGod;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform mat4 uPrevViewProj;
uniform vec2 uRes;
uniform float uTime;
uniform float uExposure;
uniform float uMotion;       // motion blur amount
uniform vec2 uShockUv;
uniform float uShockR;
uniform float uShockAmp;
uniform float uCA;
uniform float uVignette;
uniform float uGrain;
uniform float uLetterbox;
uniform vec3 uFadeColor;
uniform float uFade;
uniform float uFlash;
uniform vec2 uSun;
uniform float uSunFront;
uniform float uFlare;
uniform float uSaturation;
uniform float uContrast;
uniform vec3 uTint;
uniform float uDesat;        // 'gravity off' desaturation pulse
uniform float uAspect;
${DEPTH_FN}
varying vec2 vUv;

vec3 aces(vec3 x){
  const mat3 m1=mat3(0.59719,0.07600,0.02840,0.35458,0.90834,0.13383,0.04823,0.01566,0.83777);
  const mat3 m2=mat3(1.60475,-0.10208,-0.00327,-0.53108,1.10813,-0.07276,-0.07367,-0.00605,1.07602);
  vec3 v=m1*x; vec3 a=v*(v+0.0245786)-0.000090537; vec3 b=v*(0.983729*v+0.4329510)+0.238081;
  return clamp(m2*(a/b),0.0,1.0);
}
vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c,vec3(1.0/2.4))-0.055, step(0.0031308,c)); }
float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }

void main(){
  vec2 uv=vUv;
  // letterbox
  if(uv.y<uLetterbox || uv.y>1.0-uLetterbox){ gl_FragColor=vec4(0.0,0.0,0.0,1.0); return; }
  // shockwave lens distortion
  if(uShockAmp>0.0){
    vec2 dv=uv-uShockUv; dv.x*=uAspect;
    float r=length(dv);
    float ring=exp(-pow((r-uShockR)*12.0,2.0));
    uv-=normalize(dv+1e-5)*ring*uShockAmp*vec2(1.0/uAspect,1.0);
  }
  // camera motion blur via depth reprojection
  float d=texture2D(tDepth,uv).r;
  vec4 ndc=vec4(uv*2.0-1.0,d*2.0-1.0,1.0);
  vec4 vp=uInvProj*ndc; vp/=vp.w;
  if(d>=0.99995) vp.xyz=normalize(vp.xyz)*1e5;
  vec4 wp=uCamWorld*vec4(vp.xyz,1.0);
  vec4 prev=uPrevViewProj*wp;
  vec2 puv=prev.xy/prev.w*0.5+0.5;
  vec2 vel=(uv-puv)*uMotion;
  float vl=length(vel*uRes);
  float maxPx=40.0;
  if(vl>maxPx) vel*=maxPx/vl;
  vec3 col=vec3(0.0);
  const int MB=10;
  float j=hash(uv*uRes+uTime)-0.5;
  for(int i=0;i<MB;i++){
    float t=(float(i)+j)/float(MB-1)-0.5;
    vec2 suv=uv+vel*t;
    // chromatic aberration grows towards the edges
    vec2 ce=(suv-0.5);
    float ca=uCA*dot(ce,ce)*0.02;
    col.r+=texture2D(tColor,suv+ce*ca).r;
    col.g+=texture2D(tColor,suv).g;
    col.b+=texture2D(tColor,suv-ce*ca).b;
  }
  col/=float(MB);

  // lens flare ghosts + anamorphic streak from the sun
  if(uFlare>0.0 && uSunFront>0.0){
    float vis=clamp(texture2D(tGod,uSun).r*6.0,0.0,1.0)*uSunFront;
    vec2 axis=vec2(0.5)-uSun;
    vec3 fl=vec3(0.0);
    for(int i=0;i<5;i++){
      float k=float(i);
      float f=0.35+k*0.32;
      vec2 gp=uSun+axis*f*2.0;
      vec2 dd=uv-gp; dd.x*=uAspect;
      float rad=0.025+0.025*fract(k*0.618);
      float disc=smoothstep(rad,rad*0.75,length(dd));
      vec3 tint=mix(vec3(0.35,0.6,1.0),vec3(1.0,0.55,0.25),fract(k*0.37));
      fl+=tint*disc*0.08;
    }
    vec2 sd=uv-uSun; sd.x*=uAspect;
    float streak=exp(-abs(sd.y)*260.0)*exp(-abs(sd.x)*2.8);
    fl+=vec3(0.45,0.6,1.0)*streak*0.9;
    float halo=smoothstep(0.03,0.0,abs(length(sd)-0.32))*0.05;
    fl+=vec3(0.6,0.7,1.0)*halo;
    col+=fl*vis*uFlare;
  }

  col*=uExposure;
  col+=uFlash*vec3(1.0,0.97,0.92)*2.5;
  col=aces(col);
  // grade
  float l=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(l),col,uSaturation*(1.0-uDesat));
  col=(col-0.5)*uContrast+0.5;
  // split toning: teal shadows, warm highlights
  col+=(vec3(-0.02,0.01,0.035))*(1.0-smoothstep(0.0,0.45,l));
  col+=(vec3(0.03,0.012,-0.02))*smoothstep(0.45,1.0,l);
  col*=uTint;
  col=clamp(col,0.0,1.0);
  // vignette
  vec2 vc=vUv-0.5; vc.x*=uAspect*0.75;
  col*=1.0-uVignette*smoothstep(0.25,0.95,length(vc));
  col=toSRGB(col);
  // fades
  col=mix(col,uFadeColor,uFade);
  // grain
  float gr=hash(vUv*uRes+fract(uTime*7.13)*100.0)-0.5;
  col+=gr*uGrain;
  gl_FragColor=vec4(col,1.0);
}`;

export class PostFX {
  constructor(renderer) {
    this.renderer = renderer;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    this.size = size;
    const opts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true };
    this.sceneRT = new THREE.WebGLRenderTarget(size.x, size.y, { ...opts, samples: 4 });
    this.sceneRT.depthTexture = new THREE.DepthTexture(size.x, size.y, THREE.FloatType);
    this.compRT = new THREE.WebGLRenderTarget(size.x, size.y, { ...opts, depthBuffer: false });
    this.dofRT = new THREE.WebGLRenderTarget(size.x, size.y, { ...opts, depthBuffer: false });
    this.godRT = new THREE.WebGLRenderTarget(size.x >> 1, size.y >> 1, { type: THREE.HalfFloatType, depthBuffer: false });

    const depthU = () => ({ uNear: { value: 0.1 }, uFar: { value: 1000 } });
    this.godMat = new THREE.ShaderMaterial({
      uniforms: { tDepth: { value: this.sceneRT.depthTexture }, uSun: { value: new THREE.Vector2() }, uSunFront: { value: 0 }, uAspect: { value: 1 } },
      vertexShader: quadVert, fragmentShader: godFrag, depthTest: false, depthWrite: false,
    });
    this.compMat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.sceneRT.texture }, tDepth: { value: this.sceneRT.depthTexture }, tGod: { value: this.godRT.texture },
        uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() },
        uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color(1, 0.8, 0.6) },
        uFogColor: { value: new THREE.Color(0.6, 0.6, 0.65) }, uFogDensity: { value: 0 }, uFogFalloff: { value: 0.02 }, uFogBase: { value: 0 },
        uSkyDist: { value: 3000 }, uClampHDR: { value: 16 }, uGodStrength: { value: 0 }, uGodColor: { value: new THREE.Color(1, 0.8, 0.6) },
        ...depthU(),
      },
      vertexShader: quadVert, fragmentShader: compFrag, depthTest: false, depthWrite: false,
    });
    this.dofMat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.compRT.texture }, tDepth: { value: this.sceneRT.depthTexture }, uRes: { value: new THREE.Vector2() },
        uFocus: { value: 10 }, uBlur: { value: 0 }, uMaxR: { value: 10 }, ...depthU(),
      },
      vertexShader: quadVert, fragmentShader: dofFrag, depthTest: false, depthWrite: false,
    });
    this.finalMat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.dofRT.texture }, tDepth: { value: this.sceneRT.depthTexture }, tGod: { value: this.godRT.texture },
        uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uPrevViewProj: { value: new THREE.Matrix4() },
        uRes: { value: new THREE.Vector2() }, uTime: { value: 0 }, uExposure: { value: 1 }, uMotion: { value: 0.6 },
        uShockUv: { value: new THREE.Vector2(0.5, 0.5) }, uShockR: { value: 0 }, uShockAmp: { value: 0 },
        uCA: { value: 1 }, uVignette: { value: 0.45 }, uGrain: { value: 0.035 }, uLetterbox: { value: 0.1 },
        uFadeColor: { value: new THREE.Color(0, 0, 0) }, uFade: { value: 0 }, uFlash: { value: 0 },
        uSun: { value: new THREE.Vector2() }, uSunFront: { value: 0 }, uFlare: { value: 1 },
        uSaturation: { value: 1 }, uContrast: { value: 1.05 }, uTint: { value: new THREE.Color(1, 1, 1) }, uDesat: { value: 0 },
        uAspect: { value: 1 }, ...depthU(),
      },
      vertexShader: quadVert, fragmentShader: finalFrag, depthTest: false, depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.godMat);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.6, 0.55, 0.85);
    this.prevViewProj = new THREE.Matrix4();
    this.hasPrev = false;
    this._v = new THREE.Vector3();
    this.params = {};
  }

  setSize(w, h) {
    this.size.set(w, h);
    this.sceneRT.setSize(w, h);
    this.sceneRT.depthTexture.image.width = w; this.sceneRT.depthTexture.image.height = h;
    this.compRT.setSize(w, h);
    this.dofRT.setSize(w, h);
    this.godRT.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1));
    this.bloom.setSize(w, h);
  }

  resetHistory() { this.hasPrev = false; }

  render(scene, camera, p, time) {
    const r = this.renderer;
    const { x: w, y: h } = this.size;
    camera.updateMatrixWorld();
    // 1. scene
    r.setRenderTarget(this.sceneRT);
    r.clear();
    r.render(scene, camera);

    const near = camera.near, far = camera.far;
    for (const m of [this.compMat, this.dofMat, this.finalMat]) { m.uniforms.uNear.value = near; m.uniforms.uFar.value = far; }

    // sun screen position
    const sp = this._v.copy(p.sunDir).multiplyScalar(far * 0.5).add(camera.position).project(camera);
    const camDir = new THREE.Vector3(); camera.getWorldDirection(camDir);
    const front = THREE.MathUtils.smoothstep(camDir.dot(p.sunDir), 0.0, 0.35);
    const sunUv = new THREE.Vector2(sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5);
    const aspect = w / h;

    // 2. god rays
    this.godMat.uniforms.uSun.value.copy(sunUv);
    this.godMat.uniforms.uSunFront.value = front;
    this.godMat.uniforms.uAspect.value = aspect;
    this.quad.material = this.godMat;
    r.setRenderTarget(this.godRT);
    this.quad.render(r);

    // 3. fog + rays composite
    const cu = this.compMat.uniforms;
    cu.uInvProj.value.copy(camera.projectionMatrixInverse);
    cu.uCamWorld.value.copy(camera.matrixWorld);
    cu.uCamPos.value.copy(camera.position);
    cu.uSunDir.value.copy(p.sunDir);
    cu.uSunColor.value.copy(p.sunColor);
    cu.uFogColor.value.copy(p.fogColor);
    cu.uFogDensity.value = p.fogDensity;
    cu.uFogFalloff.value = p.fogFalloff;
    cu.uSkyDist.value = p.skyDist ?? 3000;
    cu.uGodStrength.value = p.god;
    cu.uClampHDR.value = p.clampHDR ?? 16;
    cu.uGodColor.value.copy(p.godColor);
    this.quad.material = this.compMat;
    r.setRenderTarget(this.compRT);
    this.quad.render(r);

    // 4. bloom (additively into compRT)
    this.bloom.strength = p.bloom;
    this.bloom.radius = p.bloomRadius ?? 0.55;
    this.bloom.threshold = p.bloomThreshold ?? 0.9;
    if (p.bloom > 0) this.bloom.render(r, null, this.compRT, 0, false);

    // 5. depth of field
    const du = this.dofMat.uniforms;
    du.uRes.value.set(w, h);
    du.uFocus.value = p.focus;
    du.uBlur.value = p.dof;
    du.uMaxR.value = Math.min(16, h / 1080 * 13);
    this.quad.material = this.dofMat;
    r.setRenderTarget(this.dofRT);
    this.quad.render(r);

    // 6. final
    const fu = this.finalMat.uniforms;
    fu.uInvProj.value.copy(camera.projectionMatrixInverse);
    fu.uCamWorld.value.copy(camera.matrixWorld);
    const vpNow = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    fu.uPrevViewProj.value.copy(this.hasPrev && !p.cut ? this.prevViewProj : vpNow);
    this.prevViewProj.copy(vpNow);
    this.hasPrev = true;
    fu.uRes.value.set(w, h);
    fu.uTime.value = time;
    fu.uExposure.value = p.exposure;
    fu.uMotion.value = p.motion;
    fu.uShockUv.value.copy(p.shockUv);
    fu.uShockR.value = p.shockR;
    fu.uShockAmp.value = p.shockAmp;
    fu.uCA.value = p.ca;
    fu.uVignette.value = p.vignette;
    fu.uGrain.value = p.grain;
    fu.uLetterbox.value = p.letterbox;
    fu.uFadeColor.value.copy(p.fadeColor);
    fu.uFade.value = p.fade;
    fu.uFlash.value = p.flash;
    fu.uSun.value.copy(sunUv);
    fu.uSunFront.value = front;
    fu.uFlare.value = p.flare;
    fu.uSaturation.value = p.saturation;
    fu.uContrast.value = p.contrast;
    fu.uTint.value.copy(p.tint);
    fu.uDesat.value = p.desat;
    fu.uAspect.value = aspect;
    this.quad.material = this.finalMat;
    r.setRenderTarget(null);
    this.quad.render(r);
  }
}
