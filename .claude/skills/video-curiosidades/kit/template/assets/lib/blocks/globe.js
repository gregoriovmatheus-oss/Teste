/**
 * globe.js — Terra estilizada (low-poly, nuvens, onda de gelo na atmosfera), de f01/f12.
 *
 *   const g = createGlobe(scene, { destaque: BRASIL, alvo: { lon: -46.6, lat: -23.5 } });
 *   g.update(t)                      anda pelo caminho (opts.caminho) e pela onda (opts.onda)
 *   renderer.render(scene, g.camera)
 *
 * caminho: [{ t, lon, lat, alt, olhar? }, ...]. alt = distância da superfície em raios
 *   (5.6 = Terra inteira, 2.5 = continente, 0.3 = país, 0.06 = cidade). A altitude é
 *   interpolada em escala log: zoom exponencial, em movimento desde o frame 0 (dolly-in ou out).
 *   lon/lat usam ease outCubic. olhar = deslocamento y do ponto de mira (para subir a Terra no quadro).
 *   Abaixo de alt ~0.3 a câmera entra na camada de nuvens (tela branca): corte para a cidade sob um véu
 *   branco nesse ponto, como em f01 (corte em 2,36 s).
 * Orientação: aim(lon, lat) usa ordem XYZ, rotation.y = -lon, rotation.x = +lat. Assim o ponto
 *   (lon, lat) fica de frente para a câmera em +z. Não troque a ordem nem os sinais.
 */
import * as THREE from "../three.module.js";
import { PALETTE, mulberry32, clamp, lerp, ease } from "../kit.js";

const D2R = Math.PI / 180;

// contornos grosseiros [lon, lat]
export const LAND = {
    sam: [[-77,8.5],[-72,12],[-62,10.7],[-57,6],[-51,4],[-50,0],[-44,-2.5],[-35,-5],[-35,-9],[-39,-13],[-39,-18],[-41,-22],[-48,-26],[-53,-34],[-58,-35],[-57,-38],[-62,-39],[-65,-42],[-65,-47],[-69,-51],[-68,-55],[-72,-54],[-75,-48],[-73,-40],[-71,-30],[-70,-18],[-76,-14],[-81,-6],[-80,-1],[-77,4]],
    nam: [[-168,66],[-162,70],[-140,70],[-125,70],[-95,72],[-80,73],[-62,60],[-56,52],[-66,45],[-70,42],[-76,35],[-81,31],[-80,25],[-83,29],[-90,30],[-97,27],[-97,21],[-92,18],[-87,21],[-88,16],[-83,10],[-77,8],[-80,8],[-86,12],[-92,14],[-105,20],[-110,24],[-117,32],[-123,38],[-124,46],[-130,55],[-140,60],[-152,58],[-165,60]],
    grl: [[-55,60],[-45,60],[-20,70],[-20,82],[-60,82],[-73,78],[-55,70]],
    afr: [[-17,21],[-17,14],[-12,7],[-8,4.5],[0,5],[8,4],[9,0],[12,-5],[13,-12],[12,-17],[15,-27],[18,-34],[25,-34],[32,-29],[35,-24],[40,-15],[40,-10],[39,-5],[42,0],[51,11],[43,12],[37,21],[33,31],[20,32],[10,37],[-6,36],[-10,30],[-14,26]],
    mad: [[44,-25],[47,-25],[50,-15],[49,-12],[44,-17]],
    eur: [[-10,36],[-9,43],[-1,46],[-5,48],[2,51],[8,54],[10,57],[5,62],[15,69],[25,71],[40,68],[60,70],[80,73],[105,78],[140,72],[180,68],[180,62],[160,60],[155,52],[140,50],[135,43],[129,35],[122,31],[121,25],[110,20],[108,12],[104,9],[100,13],[98,8],[103,1],[98,17],[94,16],[90,22],[80,15],[77,8],[72,20],[66,25],[57,25],[59,22],[52,16],[43,13],[35,28],[34,31],[36,36],[27,36],[23,38],[19,40],[12,44],[16,38],[10,44],[3,43],[-4,37]],
    uk: [[-5,50],[1,51],[-2,57],[-5,58],[-6,55]],
    aus: [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[150,-37],[141,-38],[131,-31],[116,-35],[114,-26]],
  };
export const BRASIL = [[-60,5],[-51,4],[-50,0],[-44,-2.5],[-35,-5],[-35,-9],[-39,-13],[-39,-18],[-41,-22],[-48,-26],[-53,-33.7],[-57,-30],[-54,-26],[-58,-22],[-58,-16],[-60,-14],[-65,-10],[-73,-9],[-70,-4],[-69,1],[-64,2]];
export const ll = (lon, lat, r = 1) =>
  new THREE.Vector3(r * Math.cos(lat * D2R) * Math.sin(lon * D2R), r * Math.sin(lat * D2R), r * Math.cos(lat * D2R) * Math.cos(lon * D2R));

function inPoly(x, y, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// caminho piecewise: alt em escala log, lon/lat com ease
export function trilha(keys, t) {
  if (t <= keys[0].t) return { ...keys[0], olhar: keys[0].olhar ?? 0 };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t > b.t) continue;
    const p = clamp((t - a.t) / (b.t - a.t));
    const q = (ease[b.curva] || ease.outCubic)(p);
    return {
      lon: lerp(a.lon, b.lon, q),
      lat: lerp(a.lat, b.lat, q),
      alt: Math.exp(lerp(Math.log(a.alt), Math.log(b.alt), p)),
      olhar: lerp(a.olhar ?? 0, b.olhar ?? 0, ease.inOutSine(p)),
    };
  }
  const z = keys[keys.length - 1];
  return { ...z, olhar: z.olhar ?? 0 };
}

export function createGlobe(scene, {
  detalhe = 96,                 // subdivisões do icosaedro (96 = visual original; 48 é bem mais leve)
  destaque = BRASIL,            // polígono pintado em cor de destaque, ou null
  corDestaque = 0xd8c48e,
  alvo = { lon: -46.6, lat: -23.5 },
  marcador = true,
  nuvens = 260,
  nuvensAlvo = 60,              // camada fina de nuvens sobre o alvo, para mergulhar através dela
  estrelas = 1500,
  onda = { t0: 0, t1: 1.5 },    // onda azul-gelo na atmosfera; null desliga
  caminho = [{ t: 0, lon: alvo.lon + 14, lat: -12, alt: 5.6 }, { t: 2.3, lon: alvo.lon, lat: alvo.lat, alt: 0.3 }],
  fundo = PALETTE.night,
} = {}) {
  scene.background = new THREE.Color(fundo);
  const camera = new THREE.PerspectiveCamera(35, 1080 / 1920, 0.001, 200);
  scene.add(new THREE.HemisphereLight(0xcfe0f0, 0x101820, 0.35));
  const sun = new THREE.DirectionalLight(0xffe4c4, 3.0);
  sun.position.set(-4, 3, 5);
  const rim = new THREE.DirectionalLight(0x8fcbf2, 1.6);
  rim.position.set(5, 1, -3);
  scene.add(sun, rim);

  /* planeta: faces coloridas por terra/mar/gelo/destaque */
  const geo = new THREE.IcosahedronGeometry(1, detalhe);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const cOcean = [new THREE.Color(0x2b4a66), new THREE.Color(0x325574)];
  const cLand = [new THREE.Color(0x6f8578), new THREE.Color(0x768b7e)];
  const cDest = new THREE.Color(corDestaque), cIce = new THREE.Color(PALETTE.frost);
  const polys = Object.values(LAND);
  const rnd = mulberry32(11);
  const v = new THREE.Vector3(), cen = new THREE.Vector3();
  for (let f = 0; f < pos.count; f += 3) {
    cen.set(0, 0, 0);
    for (let k = 0; k < 3; k++) cen.add(v.fromBufferAttribute(pos, f + k));
    cen.normalize();
    const lat = Math.asin(cen.y) / D2R, lon = Math.atan2(cen.x, cen.z) / D2R;
    const j = rnd() < 0.5 ? 0 : 1;
    let col = cOcean[j], h = 1;
    if (lat < -68 || lat > 80) { col = cIce; h = 1.001; }
    else if (destaque && inPoly(lon, lat, destaque)) { col = cDest; h = 1.0015; }
    else if (polys.some((p) => inPoly(lon, lat, p))) { col = cLand[j]; h = 1.0012; }
    for (let k = 0; k < 3; k++) {
      v.fromBufferAttribute(pos, f + k).multiplyScalar(h);
      pos.setXYZ(f + k, v.x, v.y, v.z);
      cols.set([col.r, col.g, col.b], (f + k) * 3);
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const earth = new THREE.Group();
  earth.rotation.order = "XYZ";
  earth.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 })));
  scene.add(earth);

  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 8), new THREE.MeshBasicMaterial({ color: PALETTE.accent }));
  marker.position.copy(ll(alvo.lon, alvo.lat, 1.002));
  marker.visible = marcador;
  earth.add(marker);

  /* nuvens low-poly */
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xf6f9fc, emissive: 0xc8d4e0, emissiveIntensity: 0.55, roughness: 0.95, flatShading: true });
  const puff = new THREE.IcosahedronGeometry(1, 1);
  const rc = mulberry32(23);
  const addPuff = (lon, lat, r, s) => {
    const m = new THREE.Mesh(puff, cloudMat);
    const p = ll(lon, lat, r);
    m.position.copy(p);
    m.lookAt(p.clone().multiplyScalar(2));
    m.scale.set(s * (1 + rc()), s * (0.7 + rc() * 0.6), s * 0.35);
    earth.add(m);
  };
  for (let i = 0; i < nuvens; i++) addPuff(rc() * 360 - 180, (rc() * 2 - 1) * 70, 1.018 + rc() * 0.006, 0.006 + rc() * 0.016);
  for (let i = 0; i < nuvensAlvo; i++) {
    const a = rc() * Math.PI * 2, d = 0.15 + Math.sqrt(rc()) * 3.0;
    addPuff(alvo.lon + Math.cos(a) * d, alvo.lat + Math.sin(a) * d, 1.06 + rc() * 0.08, 0.004 + rc() * 0.01);
  }

  /* atmosfera (fresnel) + onda de gelo */
  const atmoMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uWave: { value: -3 }, uDir: { value: new THREE.Vector3(0.6, 0.75, 0.25).normalize() }, uFade: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uWave; uniform vec3 uDir; uniform float uFade; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){ float fr = pow(clamp(1.0 - dot(vN, vV), 0.0, 1.0), 2.6);
        float d = dot(normalize(vP), uDir) - uWave; float band = exp(-d*d/0.012);
        vec3 ice = vec3(0.56, 0.80, 0.95);
        vec3 col = ice * (fr * 0.85 + band * (0.35 + 1.2 * fr));
        gl_FragColor = vec4(col * uFade, 1.0); }`,
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.045, 96, 64), atmoMat);
  scene.add(atmo);

  if (estrelas) {
    const rs = mulberry32(5);
    const sp = new Float32Array(estrelas * 3);
    for (let i = 0; i < estrelas; i++) {
      const u = rs() * 2 - 1, th = rs() * Math.PI * 2, r = 60;
      sp.set([r * Math.sqrt(1 - u * u) * Math.cos(th), r * u, r * Math.sqrt(1 - u * u) * Math.sin(th)], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xc9d6e4, size: 1.6, sizeAttenuation: false })));
  }

  const aim = (lon, lat) => { earth.rotation.y = -lon * D2R; earth.rotation.x = lat * D2R; };
  const setAlt = (alt, olhar = 0) => {
    camera.position.set(0, 0, 1 + alt);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, olhar, 0);
  };

  function update(t) {
    const k = trilha(caminho, t);
    aim(k.lon, k.lat);
    setAlt(k.alt, k.olhar);
    marker.visible = marcador && k.alt > 0.3;
    if (onda) {
      atmoMat.uniforms.uWave.value = lerp(-0.75, 1.3, ease.outQuad(clamp((t - onda.t0) / (onda.t1 - onda.t0))));
    }
    // a atmosfera some quando a câmera chega perto (senão vira véu azul)
    atmoMat.uniforms.uFade.value = clamp((k.alt - 0.12) / 0.25);
    return k;
  }

  return { camera, earth, atmo, atmoMat, marker, aim, setAlt, update };
}
