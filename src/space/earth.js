import * as THREE from 'three';
import { NOISE_GLSL } from '../core/noise.glsl.js';
import { RNG } from '../core/rng.js';

// ---------------------------------------------------------------------------
// Procedural planet. Surface maps are baked once on the GPU (equirectangular),
// then sampled by the realtime shaders. Everything is generated — no textures.
// ---------------------------------------------------------------------------

const BAKE_W = 4096;
const BAKE_H = 2048;

const UV_TO_DIR = /* glsl */ `
vec3 uvToDir(vec2 uv){
  float theta=(1.0-uv.y)*3.14159265;
  float phi=uv.x*6.2831853;
  return vec3(-cos(phi)*sin(theta), cos(theta), sin(phi)*sin(theta));
}`;

const PLANET_FIELDS = /* glsl */ `
// returns continental elevation (approx -1..1, 0 = sea level)
float elevation(vec3 d){
  vec3 p=d*0.95+vec3(3.1,-1.2,0.7);
  vec3 q=vec3(fbm3(p*1.2,3), fbm3(p*1.2+vec3(5.2,1.3,2.8),3), fbm3(p*1.2+vec3(1.7,9.2,4.4),3));
  float c=fbm3(p+q*0.75,6);
  c+=0.05*fbm3(d*5.0+q,4);
  return c+0.1;
}
`;

const bakeVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`;

const bakeSurfaceFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
${NOISE_GLSL}
${UV_TO_DIR}
${PLANET_FIELDS}
void main(){
  vec3 d=uvToDir(vUv);
  float e=elevation(d);
  float lat=abs(d.y);
  float m=ridged(d*2.2+vec3(2.0),5);
  float landMask=smoothstep(0.0,0.012,e);
  float mountains=m*smoothstep(0.03,0.22,e);
  float moist=fbm3(d*2.4+vec3(8.1,3.3,1.0),5)*0.5+0.5;
  moist=mix(moist, moist*0.55, smoothstep(0.12,0.32,lat)*smoothstep(0.5,0.32,lat)); // subtropical deserts
  moist+= smoothstep(0.25,0.0,lat)*0.25; // tropical moisture
  float temp=1.0-pow(lat,1.4)*1.15-mountains*0.55+fbm3(d*5.0,3)*0.12;

  vec3 desert=vec3(0.50,0.36,0.20);
  vec3 savanna=vec3(0.27,0.24,0.10);
  vec3 grass=vec3(0.10,0.16,0.05);
  vec3 forest=vec3(0.03,0.085,0.025);
  vec3 tundra=vec3(0.22,0.20,0.16);
  vec3 rock=vec3(0.24,0.20,0.17);
  vec3 snow=vec3(0.86,0.89,0.94);

  vec3 land=mix(desert,savanna,smoothstep(0.30,0.48,moist));
  land=mix(land,grass,smoothstep(0.46,0.6,moist));
  land=mix(land,forest,smoothstep(0.58,0.75,moist)*smoothstep(0.2,0.6,temp));
  land=mix(land,tundra,smoothstep(0.45,0.25,temp));
  land=mix(land,rock,smoothstep(0.25,0.6,mountains));
  land*=0.8+0.4*fbm3(d*24.0,4);
  land=mix(land,snow,smoothstep(0.18,0.06,temp));

  float depth=clamp(-e*6.0,0.0,1.0);
  vec3 shallow=vec3(0.015,0.11,0.16);
  vec3 deep=vec3(0.003,0.018,0.055);
  vec3 ocean=mix(shallow,deep,smoothstep(0.0,0.5,depth));
  ocean=mix(ocean,vec3(0.75,0.8,0.86),smoothstep(0.86,0.97,lat)); // polar sea ice

  vec3 col=mix(ocean,land,landMask);
  float h=clamp(0.5+e*0.5+mountains*0.12*landMask,0.0,1.0);
  gl_FragColor=vec4(col,h);
}`;

const bakeDetailFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
${NOISE_GLSL}
${UV_TO_DIR}
${PLANET_FIELDS}
void main(){
  vec3 d=uvToDir(vUv);
  float e=elevation(d);
  float lat=abs(d.y);
  // clouds: domain warped bands + cyclonic swirls
  vec3 p=d*vec3(1.6,3.2,1.6);
  vec3 w=vec3(fbm3(p*0.9+vec3(1.0),4),fbm3(p*0.9+vec3(7.0),4),fbm3(p*0.9+vec3(3.0),4));
  float c=fbm3(p+w*1.6,7);
  float bands=0.5+0.5*cos(lat*12.0+w.x*4.0);
  c=c*0.9+0.16*bands-0.06;
  c+=0.10*fbm3(d*vec3(9.0,18.0,9.0)+w*2.0,4);
  float itcz=smoothstep(0.12,0.0,abs(d.y-0.05))*0.15;
  float cloud=smoothstep(-0.12,0.62,c+itcz);
  // city lights
  float land=smoothstep(0.0,0.02,e);
  float coast=smoothstep(0.18,0.0,e)*land;
  float clusters=pow(max(fbm3(d*14.0,5)*0.5+0.5,0.0),7.0)*2.5;
  float fine=pow(max(snoise(d*160.0),0.0),3.0);
  float temp=1.0-pow(lat,1.4)*1.15;
  float lights=land*smoothstep(0.15,0.4,temp)*(clusters*(0.4+coast*1.6))*(0.4+fine*2.0);
  float shore=1.0-smoothstep(0.0,0.03,abs(e));
  gl_FragColor=vec4(cloud,clamp(lights,0.0,1.0),shore,1.0);
}`;

const earthVert = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vObjN;
void main(){
  vUv=uv;
  vObjN=normalize(position);
  vec4 wp=modelMatrix*vec4(position,1.0);
  vPosW=wp.xyz;
  vNormalW=normalize(mat3(modelMatrix)*normal);
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;

const earthFrag = /* glsl */ `
precision highp float;
uniform sampler2D tSurface;
uniform sampler2D tDetail;
uniform vec3 uSunDir;
uniform float uCloudOffset;
uniform float uTime;
uniform float uLift;      // ocean disturbance 0..1
uniform float uPulse;     // gravity shock wave front (radians from city) <0 = none
uniform vec3 uPulseCenter;
uniform float uPulseColor;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vObjN;
${NOISE_GLSL}
void main(){
  vec4 s=texture2D(tSurface,vUv);
  vec4 det=texture2D(tDetail,vUv);
  vec3 albedo=s.rgb;
  // crisper coastlines up close: re-derive the land/ocean split from the height channel
  {
    float hc=s.a+fbm3(vObjN*140.0,3)*0.006;
    float lm=smoothstep(0.497,0.509,hc);
    vec3 sea=mix(vec3(0.015,0.11,0.16),vec3(0.003,0.018,0.055),smoothstep(0.5,0.42,hc));
    albedo=mix(sea, albedo, mix(lm, 1.0, step(0.53,s.a)));
    albedo=mix(albedo, s.rgb, step(0.86,abs(vObjN.y))); // keep polar ice from the bake
  }
  float camD=length(cameraPosition-vPosW);
  float fine=fbm3(vObjN*260.0,3);
  albedo*=1.0+fine*0.35*smoothstep(0.6,0.05,camD);
  float h=s.a;
  float coastN=fbm3(vObjN*140.0,3)*0.006;
  float land=smoothstep(0.497,0.509,h+coastN);
  // bump from height field
  vec2 du=vec2(1.0/${BAKE_W}.0,0.0), dv=vec2(0.0,1.0/${BAKE_H}.0);
  float hx=texture2D(tSurface,vUv+du).a-texture2D(tSurface,vUv-du).a;
  float hy=texture2D(tSurface,vUv+dv).a-texture2D(tSurface,vUv-dv).a;
  vec3 N=normalize(vNormalW);
  vec3 T=normalize(cross(vec3(0.0,1.0,0.0),N)+1e-5);
  vec3 B=cross(N,T);
  vec3 Nb=normalize(N - (T*hx*-1.0 + B*hy)*7.0*land);
  vec3 L=normalize(uSunDir);
  vec3 V=normalize(cameraPosition-vPosW);
  float ndl=dot(Nb,L);
  float ndlS=dot(N,L);
  float day=smoothstep(-0.12,0.25,ndlS);
  float diff=max(ndl,0.0);
  // cloud shadow
  float cs=texture2D(tDetail,vUv+vec2(uCloudOffset-0.002,0.0)).r;
  float shadow=1.0-cs*0.6;
  // ocean
  float ocean=1.0-land;
  vec3 H=normalize(L+V);
  float rough=mix(0.06,0.25,uLift);
  vec3 Nw=N;
  // wind ripples on the ocean, intensified by the lift
  float rip=snoise(vObjN*120.0+vec3(uTime*0.4))*0.5+snoise(vObjN*400.0-vec3(uTime))*0.5;
  Nw=normalize(N+(T*rip+B*snoise(vObjN*130.0+7.0))*mix(0.02,0.25,uLift));
  float spec=pow(max(dot(Nw,H),0.0),mix(1400.0,90.0,uLift))*mix(3.0,1.2,uLift)+pow(max(dot(N,H),0.0),60.0)*0.12;
  float fres=pow(1.0-max(dot(N,V),0.0),5.0);
  vec3 sunCol=vec3(1.0,0.96,0.9);
  // terminator reddening
  vec3 termCol=mix(vec3(1.0,0.45,0.2),sunCol,smoothstep(0.0,0.35,ndlS));
  vec3 col=albedo*diff*smoothstep(-0.04,0.12,ndlS)*termCol*2.4*shadow;
  col+=ocean*spec*termCol*day*shadow*4.0;
  col+=ocean*fres*vec3(0.2,0.35,0.6)*day*0.6;
  // foam / spray when water starts detaching
  float fn=fbm3(vObjN*vec3(18.0,40.0,18.0)+vec3(0.0,uTime*0.05,0.0),4)*0.5+0.5;
  float foam=smoothstep(0.55,0.85,fn+uLift*0.2)*uLift*ocean*0.7;
  col+=foam*vec3(0.7,0.8,0.9)*(0.05+diff*0.9)*day;
  // night lights
  float night=1.0-smoothstep(-0.18,0.08,ndlS);
  float li=det.g;
  float flick=0.85+0.15*sin(uTime*3.0+vUv.x*900.0);
  col+=vec3(1.0,0.62,0.28)*li*night*1.3*flick;
  // gravity shock pulse ring travelling across the globe
  if(uPulse>0.0){
    float ang=acos(clamp(dot(normalize(vObjN),normalize(uPulseCenter)),-1.0,1.0));
    float ring=exp(-pow((ang-uPulse)*14.0,2.0));
    vec3 pc=mix(vec3(0.35,0.75,1.0),vec3(1.0,0.45,0.2),uPulseColor);
    col+=pc*ring*2.5*(1.0-smoothstep(2.6,3.14,uPulse));
  }
  gl_FragColor=vec4(col,1.0);
}`;

const cloudFrag = /* glsl */ `
precision highp float;
uniform sampler2D tDetail;
uniform vec3 uSunDir;
uniform float uTime;
uniform float uOpacity;
uniform float uTear; // clouds torn apart by escaping spray
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vObjN;
${NOISE_GLSL}
void main(){
  vec2 uv=vUv;
  float warp=snoise(vObjN*6.0+vec3(uTime*0.02))*0.004;
  float c=texture2D(tDetail,uv+vec2(warp,warp*0.5)).r;
  float c2=texture2D(tDetail,uv*vec2(1.0,1.0)+vec2(0.37+uTime*0.0015,0.0)).r;
  c=max(c,c2*0.35);
  c*=1.0-uTear*0.45*(0.5+0.5*snoise(vObjN*9.0));
  vec3 N=normalize(vNormalW);
  vec3 L=normalize(uSunDir);
  float ndl=dot(N,L);
  float day=smoothstep(-0.15,0.3,ndl);
  // fake self shadowing: sample towards the sun
  vec3 V=normalize(cameraPosition-vPosW);
  float lit=0.35+0.65*max(ndl*0.6+0.4,0.0);
  vec3 sunset=mix(vec3(1.0,0.5,0.25),vec3(1.0,0.97,0.94),smoothstep(0.0,0.3,ndl));
  vec3 col=vec3(1.0)*sunset*lit*day*1.05 + vec3(0.01,0.015,0.025);
  float detail=snoise(vObjN*38.0+vec3(uTime*0.01))*0.5+snoise(vObjN*90.0)*0.25;
  c=c+detail*0.18*(1.0-c);
  float a=smoothstep(0.32,0.95,c)*uOpacity;
  float rim=pow(1.0-max(dot(N,V),0.0),3.0);
  a*=1.0-rim*0.5;
  gl_FragColor=vec4(col,a);
}`;

const atmoVert = /* glsl */ `
varying vec3 vPosW;
void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vPosW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp; }`;

const atmoFrag = /* glsl */ `
precision highp float;
uniform vec3 uCenter;
uniform float uR;      // planet radius
uniform float uRa;     // atmosphere radius
uniform vec3 uSunDir;
uniform float uIntensity;
uniform float uSpray;  // spray haze (water droplets lifted)
varying vec3 vPosW;
void main(){
  vec3 ro=cameraPosition;
  vec3 rd=normalize(vPosW-ro);
  vec3 oc=ro-uCenter;
  float b=dot(oc,rd);
  float c=dot(oc,oc)-uRa*uRa;
  float disc=b*b-c;
  if(disc<0.0) discard;
  float sq=sqrt(disc);
  float t0=max(-b-sq,0.0);
  float t1=-b+sq;
  // planet hit
  float cp=dot(oc,oc)-uR*uR;
  float dp=b*b-cp;
  if(dp>0.0){ float tp=-b-sqrt(dp); if(tp>0.0) t1=min(t1,tp); }
  if(t1<=t0) discard;
  // integrate a few samples (cheap single scattering approximation)
  vec3 L=normalize(uSunDir);
  float H=(uRa-uR)*0.28;
  vec3 ray=vec3(0.0); float mie=0.0; float tot=0.0;
  const int STEPS=10;
  float ds=(t1-t0)/float(STEPS);
  for(int i=0;i<STEPS;i++){
    vec3 p=ro+rd*(t0+ds*(float(i)+0.5))-uCenter;
    float hgt=length(p)-uR;
    float dens=exp(-max(hgt,0.0)/H)*ds;
    vec3 n=normalize(p);
    float sunAmt=smoothstep(-0.25,0.35,dot(n,L));
    float sunLow=smoothstep(-0.25,0.05,dot(n,L))*(1.0-smoothstep(0.05,0.4,dot(n,L)));
    tot+=dens;
    ray+=dens*sunAmt*mix(vec3(0.18,0.42,1.0),vec3(1.0,0.4,0.15),sunLow*0.85);
    mie+=dens*sunAmt;
  }
  float mu=dot(rd,L);
  float phaseR=0.75*(1.0+mu*mu);
  float g=0.76;
  float phaseM=(1.0-g*g)/pow(1.0+g*g-2.0*g*mu,1.5)*0.08;
  vec3 col=ray*phaseR*uIntensity*5.0 + vec3(1.0,0.9,0.75)*mie*phaseM*uIntensity*5.0;
  col+=vec3(0.7,0.82,0.95)*uSpray*(mie*1.5+mie*phaseM*20.0);
  gl_FragColor=vec4(col,1.0);
}`;

// Field lines visualising gravity -------------------------------------------
const fieldVert = /* glsl */ `
attribute float aT;     // 0 at surface .. 1 at outer end
attribute vec3 aRand;
uniform float uTime;
uniform float uBreak;   // 0..1 shatter
uniform float uSnap;    // 0..1 return
varying float vT;
varying float vFlow;
varying float vRand;
void main(){
  vec3 dir=normalize(position);
  float r=length(position);
  vT=aT; vRand=aRand.x;
  // dashes flowing inward
  vFlow=fract(aT*3.0+uTime*0.9+aRand.y);
  vec3 p=position;
  // shatter: fragments flung outward, tumbling
  float b=uBreak;
  vec3 side=normalize(cross(dir,vec3(0.0,1.0,0.0))+aRand*0.3);
  p+=dir*b*(0.6+aRand.z*1.6)*(0.3+aT)+side*b*b*(aRand.x-0.5)*0.8;
  // return: lines collapse back onto the planet
  p=mix(p,dir*mix(1.02,r,1.0-uSnap*0.0),0.0);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
}`;

const fieldFrag = /* glsl */ `
precision highp float;
uniform float uOpacity;
uniform float uBreak;
uniform vec3 uColor;
varying float vT;
varying float vFlow;
varying float vRand;
void main(){
  float dash=smoothstep(0.0,0.15,vFlow)*smoothstep(0.55,0.2,vFlow);
  float fadeEnd=smoothstep(1.0,0.6,vT)*smoothstep(0.0,0.08,vT);
  float a=(0.18+dash*0.9)*fadeEnd*uOpacity;
  a*=1.0-smoothstep(0.0,0.9,uBreak+vRand*0.3*uBreak);
  gl_FragColor=vec4(uColor*a,a);
}`;

const gridFrag = /* glsl */ `
precision highp float;
uniform float uOpacity;
uniform float uBreak;
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vObjN;
${NOISE_GLSL}
void main(){
  vec2 g=vec2(vUv.x*48.0,vUv.y*24.0);
  vec2 f=abs(fract(g)-0.5);
  vec2 w=fwidth(g)*1.2;
  float line=max(smoothstep(0.5-w.x*1.5,0.5,f.x),smoothstep(0.5-w.y*1.5,0.5,f.y));
  vec3 V=normalize(cameraPosition-vPosW);
  float rim=pow(1.0-abs(dot(normalize(vNormalW),V)),2.0);
  float n=snoise(vObjN*5.0+uTime*0.2)*0.5+0.5;
  float br=step(n,1.0-uBreak*1.3);
  float a=(line*0.5+rim*0.08)*uOpacity*br;
  gl_FragColor=vec4(uColor*a,a);
}`;

const shellFrag = /* glsl */ `
precision highp float;
uniform float uOpacity;
uniform vec3 uColor;
varying vec3 vNormalW;
varying vec3 vPosW;
void main(){
  vec3 V=normalize(cameraPosition-vPosW);
  float rim=pow(1.0-abs(dot(normalize(vNormalW),V)),3.0);
  float a=rim*uOpacity;
  gl_FragColor=vec4(uColor*a,a);
}`;

// Ocean spray particles -------------------------------------------------------
const sprayVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uLift;      // 0..1 progress of the detachment
uniform float uTime;
uniform float uPixel;
uniform float uFall;      // 0..1 water returning
uniform vec3 uSunDir;
varying float vAlpha;
varying float vLand;
void main(){
  vec3 d=normalize(position);
  float delay=aSeed.x*0.55;
  float k=clamp((uLift-delay)/(1.0-delay+1e-4),0.0,1.0);
  float hgt=k*k*(0.006+aSeed.y*aSeed.y*0.09);
  hgt*=1.0-uFall;
  // lag behind the rotating surface (tangential drift, westward)
  vec3 east=normalize(cross(vec3(0.0,1.0,0.0),d)+1e-5);
  vec3 p=d*(1.003+hgt)-east*hgt*0.35*aSeed.z;
  vec4 mv=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*mv;
  float size=(0.6+aSeed.w*1.8)*uPixel/(-mv.z);
  gl_PointSize=clamp(size,1.0,6.0);
  vec3 nW=normalize(mat3(modelMatrix)*d);
  float lit=smoothstep(-0.12,0.25,dot(nW,normalize(uSunDir)));
  vec3 wpos=(modelMatrix*vec4(p,1.0)).xyz;
  float fwd=pow(max(dot(normalize(wpos-cameraPosition),normalize(uSunDir)),0.0),8.0);
  vAlpha=smoothstep(0.0,0.08,k)*(1.0-uFall)*(0.35+0.65*aSeed.w)*lit*(0.35+fwd*1.5);
  vLand=aSeed.z;
}`;

const sprayFrag = /* glsl */ `
precision highp float;
uniform vec3 uSunDir;
uniform vec3 uColor;
varying float vAlpha;
void main(){
  vec2 c=gl_PointCoord-0.5;
  float d=dot(c,c);
  if(d>0.25) discard;
  float a=smoothstep(0.25,0.0,d)*vAlpha;
  gl_FragColor=vec4(uColor*a,a);
}`;

export class Earth {
  constructor(renderer) {
    this.renderer = renderer;
    this.group = new THREE.Group();      // world placement (tilt)
    this.spin = new THREE.Group();       // daily rotation
    this.group.add(this.spin);
    this.group.rotation.z = THREE.MathUtils.degToRad(23.4);
    this.radius = 1;
    this.sunDir = new THREE.Vector3(1, 0.18, 0.55).normalize();

    this._bake();
    this._buildSurface();
    this._buildClouds();
    this._buildAtmosphere();
    this._buildField();
    this._buildSpray();

    // City location (lat/lon) — chosen near the terminator, on the day side.
    this.cityLocal = new THREE.Vector3();
    this.setCityLatLon(-23.5, 0); // placeholder, aimed later
  }

  _bake() {
    const r = this.renderer;
    const mk = () => new THREE.WebGLRenderTarget(BAKE_W, BAKE_H, {
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearMipmapLinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: true,
      wrapS: THREE.RepeatWrapping,
      anisotropy: 8,
    });
    this.surfaceRT = mk();
    this.detailRT = mk();
    this.surfaceRT.texture.wrapS = THREE.RepeatWrapping;
    this.detailRT.texture.wrapS = THREE.RepeatWrapping;
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    const scene = new THREE.Scene();
    scene.add(quad);
    const prevTarget = r.getRenderTarget();
    quad.material = new THREE.ShaderMaterial({ vertexShader: bakeVert, fragmentShader: bakeSurfaceFrag });
    r.setRenderTarget(this.surfaceRT); r.render(scene, cam);
    quad.material.dispose();
    quad.material = new THREE.ShaderMaterial({ vertexShader: bakeVert, fragmentShader: bakeDetailFrag });
    r.setRenderTarget(this.detailRT); r.render(scene, cam);
    quad.material.dispose();

    // Low-res readback of the land mask for CPU-side particle placement.
    const mw = 256, mh = 128;
    const small = new THREE.WebGLRenderTarget(mw, mh);
    const copy = new THREE.ShaderMaterial({
      uniforms: { t: { value: this.surfaceRT.texture } },
      vertexShader: bakeVert,
      fragmentShader: `uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor=texture2D(t,vUv); }`,
    });
    quad.material = copy;
    r.setRenderTarget(small); r.render(scene, cam);
    const px = new Uint8Array(mw * mh * 4);
    r.readRenderTargetPixels(small, 0, 0, mw, mh, px);
    r.setRenderTarget(prevTarget);
    this.mask = { w: mw, h: mh, px };
    small.dispose(); copy.dispose(); quad.geometry.dispose();
  }

  heightAt(u, v) {
    const { w, h, px } = this.mask;
    const x = Math.min(w - 1, Math.max(0, Math.floor(u * w)));
    const y = Math.min(h - 1, Math.max(0, Math.floor(v * h)));
    return px[(y * w + x) * 4 + 3] / 255;
  }

  static uvToDir(u, v, out = new THREE.Vector3()) {
    const theta = (1 - v) * Math.PI;
    const phi = u * Math.PI * 2;
    return out.set(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
  }

  _buildSurface() {
    const geo = new THREE.SphereGeometry(1, 256, 128);
    this.surfaceMat = new THREE.ShaderMaterial({
      uniforms: {
        tSurface: { value: this.surfaceRT.texture },
        tDetail: { value: this.detailRT.texture },
        uSunDir: { value: this.sunDir },
        uCloudOffset: { value: 0 },
        uTime: { value: 0 },
        uLift: { value: 0 },
        uPulse: { value: -1 },
        uPulseCenter: { value: new THREE.Vector3(0, 0, 1) },
        uPulseColor: { value: 0 },
      },
      vertexShader: earthVert,
      fragmentShader: earthFrag,
    });
    this.surface = new THREE.Mesh(geo, this.surfaceMat);
    this.spin.add(this.surface);
  }

  _buildClouds() {
    const geo = new THREE.SphereGeometry(1.012, 192, 96);
    this.cloudMat = new THREE.ShaderMaterial({
      uniforms: {
        tDetail: { value: this.detailRT.texture },
        uSunDir: { value: this.sunDir },
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uTear: { value: 0 },
      },
      vertexShader: earthVert,
      fragmentShader: cloudFrag,
      transparent: true,
      depthWrite: false,
    });
    this.clouds = new THREE.Mesh(geo, this.cloudMat);
    this.clouds.renderOrder = 2;
    this.group.add(this.clouds); // rotates independently (slightly faster)
  }

  _buildAtmosphere() {
    const geo = new THREE.SphereGeometry(1.075, 96, 48);
    this.atmoMat = new THREE.ShaderMaterial({
      uniforms: {
        uCenter: { value: new THREE.Vector3() },
        uR: { value: 1.0 },
        uRa: { value: 1.075 },
        uSunDir: { value: this.sunDir },
        uIntensity: { value: 1 },
        uSpray: { value: 0 },
      },
      vertexShader: atmoVert,
      fragmentShader: atmoFrag,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    this.atmosphere = new THREE.Mesh(geo, this.atmoMat);
    this.atmosphere.renderOrder = 5;
    this.atmosphere.frustumCulled = false;
    this.group.add(this.atmosphere);
  }

  _buildField() {
    const rng = new RNG(77);
    const lines = 900, segs = 14;
    const pos = [], aT = [], aRand = [];
    const d = new THREE.Vector3();
    for (let i = 0; i < lines; i++) {
      // fibonacci sphere
      const y = 1 - (i + 0.5) / lines * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      d.set(Math.cos(th) * rr, y, Math.sin(th) * rr);
      const len = 0.35 + rng.float() * 0.5;
      const r1 = rng.float(), r2 = rng.float(), r3 = rng.float();
      for (let s = 0; s < segs; s++) {
        const t0 = s / segs, t1 = (s + 1) / segs;
        const a = 1.025 + t0 * len, b = 1.025 + t1 * len;
        pos.push(d.x * a, d.y * a, d.z * a, d.x * b, d.y * b, d.z * b);
        aT.push(t0, t1);
        aRand.push(r1, r2, r3, r1, r2, r3);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1));
    geo.setAttribute('aRand', new THREE.Float32BufferAttribute(aRand, 3));
    this.fieldMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uBreak: { value: 0 }, uSnap: { value: 0 },
        uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0.45, 0.8, 1.0) },
      },
      vertexShader: fieldVert,
      fragmentShader: fieldFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.field = new THREE.LineSegments(geo, this.fieldMat);
    this.field.renderOrder = 6;
    this.group.add(this.field);

    this.gridMat = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0 }, uBreak: { value: 0 }, uTime: { value: 0 },
        uColor: { value: new THREE.Color(0.4, 0.75, 1.0) },
      },
      vertexShader: earthVert,
      fragmentShader: gridFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.grid = new THREE.Mesh(new THREE.SphereGeometry(1.32, 96, 48), this.gridMat);
    this.grid.renderOrder = 6;
    this.group.add(this.grid);

    this.shellMat = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0.6, 0.85, 1.0) } },
      vertexShader: earthVert,
      fragmentShader: shellFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shell = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), this.shellMat);
    this.shell.renderOrder = 7;
    this.shell.visible = false;
    this.group.add(this.shell);
  }

  _buildSpray() {
    const rng = new RNG(4242);
    const count = 60000;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    const d = new THREE.Vector3();
    let n = 0, guard = 0;
    while (n < count && guard < count * 8) {
      guard++;
      const u = rng.float();
      const v = Math.acos(1 - 2 * rng.float()) / Math.PI; // uniform on sphere
      const vv = 1 - v;
      const h = this.heightAt(u, vv);
      const ocean = h < 0.5;
      if (!ocean && rng.float() > 0.08) continue; // a little dust from land too
      Earth.uvToDir(u, vv, d);
      pos[n * 3] = d.x; pos[n * 3 + 1] = d.y; pos[n * 3 + 2] = d.z;
      seed[n * 4] = rng.float(); seed[n * 4 + 1] = rng.float(); seed[n * 4 + 2] = rng.float(); seed[n * 4 + 3] = rng.float();
      n++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, n * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed.subarray(0, n * 4), 4));
    this.sprayMat = new THREE.ShaderMaterial({
      uniforms: {
        uLift: { value: 0 }, uTime: { value: 0 }, uPixel: { value: 800 }, uFall: { value: 0 },
        uSunDir: { value: this.sunDir }, uColor: { value: new THREE.Color(0.75, 0.88, 1.0) },
      },
      vertexShader: sprayVert,
      fragmentShader: sprayFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.spray = new THREE.Points(geo, this.sprayMat);
    this.spray.renderOrder = 3;
    this.spray.frustumCulled = false;
    this.spin.add(this.spray);
  }

  setCityLatLon(latDeg, lonDeg) {
    const lat = THREE.MathUtils.degToRad(latDeg);
    const lon = THREE.MathUtils.degToRad(lonDeg);
    this.cityLocal.set(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
  }

  /** world-space position of the city on the surface */
  cityWorld(out = new THREE.Vector3(), r = 1) {
    out.copy(this.cityLocal).multiplyScalar(r);
    this.spin.updateWorldMatrix(true, false);
    return out.applyMatrix4(this.spin.matrixWorld);
  }

  update(t, s) {
    // s: state object from the director
    this.spin.rotation.y = s.spin;
    this.clouds.rotation.y = s.spin * 1.04 + 0.2;
    const cloudOffset = -((s.spin * 0.04 + 0.2) / (Math.PI * 2));
    this.surfaceMat.uniforms.uCloudOffset.value = cloudOffset;
    this.surfaceMat.uniforms.uTime.value = t;
    this.surfaceMat.uniforms.uLift.value = s.oceanLift;
    this.surfaceMat.uniforms.uPulse.value = s.pulse;
    this.surfaceMat.uniforms.uPulseColor.value = s.pulseColor;
    this.surfaceMat.uniforms.uPulseCenter.value.copy(this.cityLocal);
    this.cloudMat.uniforms.uTime.value = t;
    this.cloudMat.uniforms.uTear.value = s.oceanLift;
    this.atmoMat.uniforms.uSpray.value = s.spray;
    this.group.updateWorldMatrix(true, false);
    this.atmoMat.uniforms.uCenter.value.setFromMatrixPosition(this.group.matrixWorld);

    this.fieldMat.uniforms.uTime.value = t;
    this.fieldMat.uniforms.uOpacity.value = s.field;
    this.fieldMat.uniforms.uBreak.value = s.fieldBreak;
    this.fieldMat.uniforms.uColor.value.copy(s.fieldColor);
    this.gridMat.uniforms.uOpacity.value = s.field * 0.6;
    this.gridMat.uniforms.uBreak.value = s.fieldBreak;
    this.gridMat.uniforms.uTime.value = t;
    this.gridMat.uniforms.uColor.value.copy(s.fieldColor);
    this.field.visible = s.field > 0.001;
    this.grid.visible = s.field > 0.001;
    this.field.rotation.y = s.spin;
    this.grid.rotation.y = s.spin;

    this.shell.visible = s.shell > 0.001;
    if (this.shell.visible) {
      this.shell.scale.setScalar(s.shellR);
      this.shellMat.uniforms.uOpacity.value = s.shell;
      this.shellMat.uniforms.uColor.value.copy(s.fieldColor);
    }

    this.spray.visible = s.oceanLift > 0.001;
    this.sprayMat.uniforms.uLift.value = s.oceanLift;
    this.sprayMat.uniforms.uFall.value = s.oceanFall;
    this.sprayMat.uniforms.uTime.value = t;
  }

  setPixelScale(h, fovDeg) {
    this.sprayMat.uniforms.uPixel.value = h / (2 * Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2)) * 0.0025;
  }
}
