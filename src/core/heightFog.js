import * as THREE from 'three';

// Exponential height fog for every built-in material (replaces three's fog
// chunks). Encoded in a THREE.Fog: near = density × 1000, far = falloff × 1000.
// Sun in-scattering uses a fixed direction/colour (the city sun never moves).

export function installHeightFog(sunDir, sunColor) {
  const S = `vec3(${sunDir.x.toFixed(4)},${sunDir.y.toFixed(4)},${sunDir.z.toFixed(4)})`;
  const C = `vec3(${sunColor.r.toFixed(3)},${sunColor.g.toFixed(3)},${sunColor.b.toFixed(3)})`;
  THREE.ShaderChunk.fog_pars_vertex = `#ifdef USE_FOG\n varying vec3 vFogWorldPos;\n#endif`;
  THREE.ShaderChunk.fog_vertex = `#ifdef USE_FOG\n vFogWorldPos = transpose(mat3(viewMatrix)) * (mvPosition.xyz - viewMatrix[3].xyz);\n#endif`;
  THREE.ShaderChunk.fog_pars_fragment = `#ifdef USE_FOG
 uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
 varying vec3 vFogWorldPos;
 vec4 heightFog(vec3 wp){
   vec3 rd=wp-cameraPosition; float dist=length(rd); rd/=max(dist,1e-4);
   float a=fogNear*0.001, b=max(fogFar*0.001,1e-5);
   float ry=rd.y; if(abs(ry)<1e-3) ry=1e-3;
   float fg=(a/b)*exp(-cameraPosition.y*b)*(1.0-exp(-dist*ry*b))/ry;
   float f=clamp(1.0-exp(-max(fg,0.0)),0.0,1.0);
   vec3 fc=mix(fogColor,${C},pow(max(dot(rd,${S}),0.0),6.0)*0.8);
   return vec4(fc,f);
 }
#endif`;
  THREE.ShaderChunk.fog_fragment = `#ifdef USE_FOG
 vec4 hf=heightFog(vFogWorldPos);
 gl_FragColor.rgb=mix(gl_FragColor.rgb,hf.rgb,hf.a);
#endif`;
}

// For premultiplied-alpha particle shaders (they include the pars chunk).
export const PARTICLE_FOG = `#ifdef USE_FOG
 vec4 hf=heightFog(vFogWorldPos);
 gl_FragColor.rgb=mix(gl_FragColor.rgb,hf.rgb*gl_FragColor.a,hf.a);
#endif`;
