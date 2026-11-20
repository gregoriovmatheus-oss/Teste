/**
 * pele.js — peças do vídeo "E se cada mentira que você contasse aparecesse na sua pele?" (R10 + doc).
 *
 *   peleMat({ cor, esc, brilho })     MeshStandardMaterial de pele com MARCAS de mentira (shader): mancha escura com veios
 *                                     laranja #ff8a4c que brilham. Até 6 focos: m.marca(i, [x,y,z], raio) no espaço do corpo-ref.
 *                                     m.ref(obj) (chame a cada quadro se o corpo anda), m.u.uBri (0..2) brilho, m.u.uT (tempo).
 *   corpo({ cor, cor2, cabelo, pele, mulher, olhos, casaco })  pessoa estilizada (sem rosto realista), pés em y = 0, olha +z.
 *                                     .pose({ passo, t, bracoE:[ombro,cotovelo], bracoD, cabeca:[yaw,pitch], tronco })
 *                                     .pele = material de marcas;   PONTOS = posições úteis (pulso, peito, pescoço…)
 *   bracoClose()                      close do antebraço + mão segurando um presente embrulhado (escala grande, ~1 u = 3 cm)
 *   multidao(S, { pos:[[x,z,ry]], seed, casaco })  pessoas baratas instanciadas; .marca(i, 0..1), .tom(i, cor), .update(t, {anda})
 *   bokeh(S, { n, seed, area, cores })  discos de luz desfocados de fundo (sala à noite, rua)
 *   brilho(cor, tam, tipo, op), glowTex(tipo)   sprites aditivos
 *   proj(v, cam), txt(ctx, ...), pilula(ctx, ...), tag(ctx, ax, ay, bx, by, texto, {cor, a}), fontes()
 * Tudo determinístico (mulberry32 + t). Cores: azul #7cc8ff (diagrama), laranja #ff8a4c (anomalia = marca).
 */
import * as THREE from "../three.module.js";
import { mulberry32, clamp, lerp, ease } from "../kit.js";
import { M, roundBox } from "./toy.js";

export const AZUL = "#7cc8ff", LARANJA = "#ff8a4c";
const PELES = [0xe8b48c, 0xd9a07a, 0xa8714f, 0x7a4e33, 0xf2c49b];

/* ---------- ruído GLSL (valor 3D) + padrão de marca ---------- */
const NOISE = `
float pl_h(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float pl_n(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(pl_h(i), pl_h(i + vec3(1,0,0)), f.x), mix(pl_h(i + vec3(0,1,0)), pl_h(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(pl_h(i + vec3(0,0,1)), pl_h(i + vec3(1,0,1)), f.x), mix(pl_h(i + vec3(0,1,1)), pl_h(i + vec3(1,1,1)), f.x), f.y), f.z); }
float pl_fbm(vec3 p){ return 0.55 * pl_n(p) + 0.3 * pl_n(p * 2.03 + 3.1) + 0.15 * pl_n(p * 4.07 + 7.7); }
// veios: ruído "ridged" em 2 oitavas (linhas finas que se ramificam, tipo tatuagem/fractal)
float pl_veio(vec3 p){ float a = 1.0 - abs(2.0 * pl_n(p) - 1.0); float b = 1.0 - abs(2.0 * pl_n(p * 2.3 + 5.0) - 1.0);
  return pow(a, 16.0) * 0.85 + pow(b, 20.0) * 0.6 * a; }
`;
// aplica a marca: pl_m (0..1) cobre a pele; pl_v = veios; pl_bd = frente de avanço
const APLICA = `
  vec3 pl_q = vRP * uEsc;
  float pl_f = pl_fbm(pl_q * 0.55);
  float pl_v = pl_veio(pl_q) * pl_m;
  vec3 pl_esc = mix(vec3(0.16, 0.06, 0.035), vec3(0.32, 0.12, 0.06), pl_f);
  diffuseColor.rgb = mix(diffuseColor.rgb, pl_esc, pl_m * 0.95);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.6, 0.22, 0.08), pl_v * 0.6);
  float pl_pulso = 0.75 + 0.25 * sin(uT * 2.6 + pl_f * 9.0);
  vec3 pl_emi = vec3(1.0, 0.54, 0.3) * (pl_v * 1.3 * pl_pulso + pl_bd * 0.9) * uBri + vec3(0.5, 0.18, 0.06) * pl_m * 0.04 * uBri;
`;

export function peleMat({ cor = 0xe8b48c, esc = 7, brilho = 1, rough = 0.55 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: cor, roughness: rough, metalness: 0, envMapIntensity: 0.5 });
  const u = { uRef: { value: new THREE.Matrix4() }, uS: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uEsc: { value: esc }, uBri: { value: brilho }, uT: { value: 0 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform mat4 uRef;\nvarying vec3 vRP;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRP = (uRef * modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform vec4 uS[6];\nuniform float uEsc, uBri, uT;\nvarying vec3 vRP;\n" + NOISE)
      .replace("#include <color_fragment>", `#include <color_fragment>
  float pl_m = 0.0, pl_bd = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 s = uS[i];
    if (s.w > 0.0001) {
      float d = length(vRP - s.xyz);
      float n = pl_fbm(vRP * uEsc * 0.45 + float(i) * 7.3) - 0.5;
      float r = s.w * (1.0 + 0.9 * n);
      float k = smoothstep(r, r - 0.18 * s.w - 0.004, d);
      pl_m = max(pl_m, k);
      pl_bd = max(pl_bd, (1.0 - smoothstep(0.0, 0.12 * s.w + 0.006, abs(d - r))) * 0.8);
    }
  }
  ${APLICA}`)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance += pl_emi;");
  };
  m.customProgramCacheKey = () => "pele-marcas";
  m.u = u;
  m.marca = (i, p, r) => { u.uS.value[i].set(p[0], p[1], p[2], Math.max(0, r)); };
  m.limpa = () => u.uS.value.forEach((v) => v.set(0, 0, 0, 0));
  const inv = new THREE.Matrix4();
  m.ref = (obj) => { obj.updateWorldMatrix(true, true); inv.copy(obj.matrixWorld).invert(); u.uRef.value.copy(inv); };
  return m;
}

/* ---------- pele instanciada (multidão): atributo aMk = (cobertura 0..1, semente) ---------- */
export function peleInstMat({ esc = 9 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0, envMapIntensity: 0.5 });
  const u = { uEsc: { value: esc }, uBri: { value: 1 }, uT: { value: 0 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute vec2 aMk;\nvarying vec3 vRP;\nvarying float vMk;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRP = transformed * 4.0 + vec3(aMk.y * 17.0, aMk.y * 5.0, 0.0);\nvMk = aMk.x;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uEsc, uBri, uT;\nvarying vec3 vRP;\nvarying float vMk;\n" + NOISE)
      .replace("#include <color_fragment>", `#include <color_fragment>
  float pl_c = pl_fbm(vRP * 0.9);
  float pl_m = smoothstep(1.02 - vMk * 1.1, 1.08 - vMk * 1.1, pl_c + 0.25) * step(0.01, vMk);
  float pl_bd = 0.0;
  ${APLICA}`)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  totalEmissiveRadiance += pl_emi;");
  };
  m.customProgramCacheKey = () => "pele-inst";
  m.u = u;
  return m;
}

/* ---------- cromatóforos (pele de lula): discos de pigmento que se expandem; uExp 0..1, onda opcional ---------- */
export function cromoMat({ cs = 0.1, base = 0xf1e4dc, onda = 0 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color: base, roughness: 0.32, metalness: 0, envMapIntensity: 0.7 });
  const u = { uCs: { value: cs }, uExp: { value: 0.15 }, uT: { value: 0 }, uOnda: { value: onda } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vOP;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvOP = position;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uCs, uExp, uT, uOnda;\nvarying vec3 vOP;\n" + NOISE)
      .replace("#include <color_fragment>", `#include <color_fragment>
  vec3 cr_q = vOP / uCs; vec3 cr_i = floor(cr_q);
  float cr_h = pl_h(cr_i + 3.7), cr_h2 = pl_h(cr_i + 11.3);
  vec3 cr_f = fract(cr_q) - 0.5 - (vec3(pl_h(cr_i + 1.1), pl_h(cr_i + 2.2), pl_h(cr_i + 5.5)) - 0.5) * 0.3;
  float cr_w = uExp * (1.0 - uOnda) + uOnda * (0.5 + 0.5 * sin(vOP.x / uCs * 0.35 - uT * 6.0 + cr_h));
  float cr_r = (0.08 + 0.38 * clamp(cr_w, 0.0, 1.0)) * (0.7 + 0.5 * cr_h);
  float cr_m = smoothstep(cr_r, cr_r - 0.06, length(cr_f));
  vec3 cr_c = cr_h2 < 0.45 ? vec3(0.35, 0.12, 0.06) : cr_h2 < 0.8 ? vec3(0.75, 0.22, 0.12) : vec3(0.95, 0.6, 0.18);
  diffuseColor.rgb = mix(diffuseColor.rgb, cr_c, cr_m);`);
  };
  m.customProgramCacheKey = () => "cromo";
  m.u = u;
  return m;
}

/* ---------- geometrias ---------- */
const _cap = new Map();
export function capGeo(r, len, cs = 4, rs = 12) {
  const k = [r, len, cs, rs].map((v) => v.toFixed(3)).join("/");
  if (!_cap.has(k)) { const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), cs, rs); g.translate(0, -len / 2, 0); _cap.set(k, g); }
  return _cap.get(k);
}
const SPH = new THREE.SphereGeometry(1, 20, 14);
function msh(geo, mat, parent, pos = [0, 0, 0], sc = null) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.position.set(...pos);
  if (sc) m.scale.set(...sc); parent.add(m); return m;
}
function piv(parent, pos) { const g = new THREE.Group(); g.position.set(...pos); parent.add(g); return g; }

/* ---------- corpo: pessoa estilizada, regata e bermuda (muita pele à mostra), pés em y = 0, frente +z ---------- */
export function corpo({ cor = 0x2f5c8a, cor2 = 0x2c3550, cabelo = 0x3a2a20, pele = 0xe0a87e, mulher = false, olhos = true, casaco = null, esc = 7 } = {}) {
  const g = new THREE.Group(), root = piv(g, [0, 0, 0]);
  const P = peleMat({ cor: pele, esc });
  const mC = M(cor, 0.85), mB = M(cor2, 0.9), mH = M(cabelo, 0.6), mS = M(0x2a2622, 0.7);
  const hip = piv(root, [0, 0.95, 0]);
  msh(SPH, mB, hip, [0, 0.02, 0], [0.175, 0.12, 0.12]);
  const legs = [1, -1].map((s) => {
    const th = piv(hip, [s * 0.1, -0.02, 0]);
    msh(capGeo(0.078, 0.44), mB, th);
    const kn = piv(th, [0, -0.44, 0]);
    msh(capGeo(0.065, 0.46), P, kn);
    msh(SPH, mS, kn, [0, -0.47, 0.05], [0.07, 0.045, 0.12]);
    return { th, kn };
  });
  const chest = piv(hip, [0, 0.05, 0]);
  msh(capGeo(0.16, 0.58, 5, 14), mC, chest, [0, 0.6, 0], [1.05, 1, 0.68]);
  if (mulher) msh(SPH, mC, chest, [0, 0.4, 0.06], [0.17, 0.08, 0.1]);
  msh(capGeo(0.05, 0.2), P, chest, [0, 0.76, 0]);
  const head = piv(chest, [0, 0.72, 0]);
  msh(SPH, P, head, [0, 0.1, 0.01], [0.1, 0.125, 0.11]);
  msh(SPH, mH, head, [0, 0.15, -0.015], [0.106, 0.1, 0.112]);
  if (mulher) msh(SPH, mH, head, [0, 0.03, -0.06], [0.1, 0.13, 0.07]);
  if (olhos) for (const s of [1, -1]) msh(SPH, M(0x1a1310, 0.15), head, [s * 0.036, 0.11, 0.105], [0.012, 0.014, 0.008]);
  const arms = [1, -1].map((s) => {
    const sh = piv(chest, [s * 0.215, 0.53, 0]);
    msh(SPH, mC, sh, [0, -0.02, 0], [0.062, 0.07, 0.062]);
    msh(capGeo(0.05, 0.3), P, sh);
    const el = piv(sh, [0, -0.29, 0]);
    msh(capGeo(0.043, 0.28), P, el);
    msh(SPH, P, el, [0, -0.31, 0.01], [0.04, 0.06, 0.03]);
    return { sh, el, s };
  });
  // casaco longo com capuz (cena "se cobrir")
  let coat = null;
  if (casaco != null) {
    const mK = M(casaco, 0.92);
    coat = new THREE.Group(); chest.add(coat);
    const lath = new THREE.LatheGeometry([[0.001, -0.62], [0.27, -0.6], [0.24, -0.1], [0.21, 0.3], [0.24, 0.54], [0.1, 0.68], [0.001, 0.7]].map(([x, y]) => new THREE.Vector2(x, y)), 18);
    msh(lath, mK, coat, [0, 0, 0], [1, 1, 0.78]);
    msh(SPH, mK, head, [0, 0.11, -0.01], [0.135, 0.15, 0.14]).userData.capuz = true;
    for (const a of arms) { msh(capGeo(0.07, 0.31), mK, a.sh); msh(capGeo(0.062, 0.25), mK, a.el); }
  }
  const PONTOS = { pulsoE: [0.27, 0.97, 0.03], pulsoD: [-0.27, 0.97, 0.03], peito: [0, 1.4, 0.12], pescoco: [0, 1.66, 0.05],
    rosto: [0.05, 1.85, 0.1], bracoE: [0.24, 1.3, 0.03], bracoD: [-0.24, 1.3, 0.03], perna: [0.1, 0.5, 0.06], maoE: [0.28, 0.88, 0.03], maoD: [-0.28, 0.88, 0.03] };
  function pose(t = 0, { passo = 0, fase = 0, bracoE = null, bracoD = null, cabeca = [0, 0], tronco = 0 } = {}) {
    const ph = t * passo * Math.PI * 2 + fase * 6.28, sw = passo ? Math.sin(ph) * 0.45 : 0;
    legs[0].th.rotation.x = sw; legs[1].th.rotation.x = -sw;
    legs[0].kn.rotation.x = passo ? Math.max(0, -Math.sin(ph)) * 0.7 : 0; legs[1].kn.rotation.x = passo ? Math.max(0, Math.sin(ph)) * 0.7 : 0;
    hip.position.y = 0.95 + (passo ? Math.abs(Math.cos(ph)) * 0.03 : Math.sin(t * 1.4 + fase * 5) * 0.004);
    const br = [bracoE, bracoD];
    arms.forEach((a, i) => {
      const p = br[i];
      if (p) { a.sh.rotation.set(-p[0], 0, a.s * (p[2] ?? 0.08)); a.el.rotation.set(-p[1], 0, 0); }
      else { a.sh.rotation.set(passo ? (i ? sw : -sw) * 0.8 : Math.sin(t * 1.1 + fase * 4 + i) * 0.03, 0, a.s * 0.09); a.el.rotation.set(passo ? -0.35 : -0.08, 0, 0); }
    });
    head.rotation.set(-cabeca[1], cabeca[0], 0);
    chest.rotation.y = tronco;
    P.u.uT.value = t;
    P.ref(g);
  }
  pose(0);
  return { group: g, pele: P, pose, head, arms, legs, chest, PONTOS, coat };
}

/* ---------- close: antebraço + mão segurando um presente (escala: 1 u ~ 3 cm; antebraço ao longo de +x) ---------- */
export function bracoClose({ pele = 0xd9a07a, manga = 0x5a6b7d, papel = 0x7d1f2b, fita = 0xd8b25a } = {}) {
  const g = new THREE.Group();
  const P = peleMat({ cor: pele, esc: 1.9, rough: 0.5 });
  // antebraço ao longo de +x: pulso em x ~ -1.2, cotovelo em x ~ 8.4 (afunila no pulso)
  const prof = [];
  for (let i = 0; i <= 24; i++) { const k = i / 24, y = lerp(-1.4, 8.6, k); prof.push(new THREE.Vector2(lerp(0.98, 1.45, Math.pow(k, 1.2)) + 0.05 * Math.sin(k * 3.1), y)); }
  const fore = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), P); fore.rotation.z = -Math.PI / 2; fore.scale.set(1, 1, 0.82);
  fore.castShadow = fore.receiveShadow = true; g.add(fore);
  // mão de palma para cima, dedos para -x; o presente fica apoiado na palma
  const hand = piv(g, [-1.6, 0, 0]);
  msh(SPH, P, hand, [-0.2, -0.05, 0], [1.05, 0.95, 0.85]);
  msh(SPH, P, hand, [-1.9, -0.2, 0], [1.7, 0.7, 1.15]);
  const dedos = [];
  for (let i = 0; i < 4; i++) {
    const f = piv(hand, [-3.3, -0.15, 0.75 - i * 0.5]);
    f.rotation.z = -Math.PI / 2 + 0.12;
    msh(capGeo(0.24, 1.3, 6, 14), P, f);
    const f2 = piv(f, [0, -1.2, 0]); f2.rotation.z = 0.5;
    msh(capGeo(0.22, 1.0, 6, 14), P, f2);
    dedos.push(f);
  }
  const pol = piv(hand, [-1.2, 0.05, 1.05]); pol.rotation.set(-0.5, 0, -Math.PI / 2 + 0.4); msh(capGeo(0.28, 1.6, 6, 14), P, pol);
  // manga de malha no cotovelo
  const sl = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.62, 4.2, 36, 1, true), M(manga, 0.95));
  sl.rotation.z = Math.PI / 2; sl.position.x = 9.6; sl.castShadow = sl.receiveShadow = true; g.add(sl);
  const pun = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.24, 10, 36), M(manga, 0.95)); pun.rotation.y = Math.PI / 2; pun.position.x = 7.55; g.add(pun);
  // presente apoiado na palma: caixa embrulhada, fita em cruz e laço
  const gift = piv(g, [-4.0, 0.55, 0]);
  gift.rotation.y = 0.18;
  const W = 5.0, H = 4.0;
  msh(roundBox(W, H, W, 0.14), M(papel, 0.62), gift, [0, 0, 0]);
  const mF = M(fita, 0.28, { metalness: 0.65 });
  msh(new THREE.BoxGeometry(W + 0.08, H + 0.06, 0.6), mF, gift, [0, H / 2, 0]);
  msh(new THREE.BoxGeometry(0.6, H + 0.06, W + 0.08), mF, gift, [0, H / 2, 0]);
  const laco = piv(gift, [0, H + 0.05, 0]);
  for (const s of [1, -1]) { const l = msh(new THREE.TorusGeometry(0.85, 0.22, 10, 24), mF, laco, [s * 0.8, 0.45, 0], [1, 0.75, 1]); l.rotation.set(0, s * 0.35, s * 0.5); }
  msh(SPH, mF, laco, [0, 0.12, 0], [0.38, 0.3, 0.38]);
  return { group: g, pele: P, hand, gift, fore, dedos, manga: sl,
    PULSO: [0.4, 1.0, 0.2], update(t) { P.u.uT.value = t; P.ref(g); } };
}

/* ---------- multidão instanciada (barata): torso, pernas, cabeça e braços com pele de marcas ---------- */
const _o = new THREE.Object3D();
export function multidao(S, { pos, seed = 5, casaco = false, escala = 1 } = {}) {
  const n = pos.length, R = mulberry32(seed);
  const gT = casaco ? new THREE.LatheGeometry([[0.001, -0.6], [0.27, -0.58], [0.23, -0.1], [0.21, 0.28], [0.22, 0.42], [0.001, 0.48]].map(([x, y]) => new THREE.Vector2(x, y)), 10)
    : new THREE.CapsuleGeometry(0.19, 0.4, 2, 8);
  const gP = capGeo(0.075, 0.86, 2, 6), gC = new THREE.SphereGeometry(0.12, 10, 8), gB = (() => { const g = new THREE.CapsuleGeometry(0.05, 0.52, 2, 6); g.translate(0, -0.31, 0); return g; })(), gH = new THREE.SphereGeometry(0.125, 10, 8, 0, Math.PI * 2, 0, 1.7);
  const mPele = peleInstMat();
  const mk = (geo, mat, k) => { const m = new THREE.InstancedMesh(geo, mat, k); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; S.add(m); return m; };
  const iT = mk(gT, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 }), n);
  const iP = mk(gP, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), n * 2);
  const iC = mk(gC, mPele, n);
  const iB = mk(gB, casaco ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }) : mPele, n * 2);
  const iH = mk(gH, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: casaco ? 0.92 : 0.6 }), n);
  const aC = new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2), aB = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 2);
  gC.setAttribute("aMk", aC);
  gB.setAttribute("aMk", aB);
  const camisas = casaco ? [0x2b2d31, 0x3a3f46, 0x4a3b30, 0x23262c, 0x51473d, 0x2e3a44] : [0xb83a2e, 0x2f5c8a, 0xe8e2d4, 0x2b2d31, 0xd9a23a, 0x3f6e4a, 0x8a5aa0, 0xe07a5f, 0x5f8fb0, 0xf2f0ea];
  const calcas = [0x2c3550, 0x3a3a3e, 0x6b5a48, 0x1e2230, 0x55606e];
  const cabelos = [0x2a1d16, 0x4a3226, 0x111111, 0x6b4a2e, 0x8a8076];
  const P = pos.map((p, i) => {
    const o = { x: p[0], z: p[1], ry: p[2] ?? 0, h: (0.92 + R() * 0.16) * escala, ph: R() * 6.28, v: 1 + R() * 0.4, mk: 0, s: R() };
    const ct = new THREE.Color(camisas[Math.floor(R() * camisas.length)]);
    iT.setColorAt(i, ct);
    const cp = new THREE.Color(calcas[Math.floor(R() * calcas.length)]); iP.setColorAt(i * 2, cp); iP.setColorAt(i * 2 + 1, cp);
    const pl = new THREE.Color(PELES[Math.floor(R() * PELES.length)]); iC.setColorAt(i, pl);
    iB.setColorAt(i * 2, casaco ? ct : pl); iB.setColorAt(i * 2 + 1, casaco ? ct : pl);
    iH.setColorAt(i, casaco ? ct : new THREE.Color(cabelos[Math.floor(R() * cabelos.length)]));
    aC.setXY(i, 0, o.s); aB.setXY(i * 2, 0, o.s + 0.3); aB.setXY(i * 2 + 1, 0, o.s + 0.6);
    return o;
  });
  const marca = (i, v) => { P[i].mk = v; aC.setX(i, v); aB.setX(i * 2, v); aB.setX(i * 2 + 1, v); };
  const tom = (i, c) => { iT.setColorAt(i, new THREE.Color(c)); };
  function update(t, { anda = 0, olha = null } = {}) {
    P.forEach((p, i) => {
      const x = p.x + Math.sin(p.ry) * anda * p.v * t, z = p.z + Math.cos(p.ry) * anda * p.v * t;
      let ry = p.ry; if (olha) ry = Math.atan2(olha[0] - x, olha[1] - z);
      const ph = t * p.v * 2.2 + p.ph, sw = anda ? Math.sin(ph) * 0.45 : Math.sin(t * 1.3 + p.ph) * 0.02, bob = anda ? Math.abs(Math.sin(ph)) * 0.04 : 0, h = p.h;
      const set = (m, k, px, py, pz, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { _o.position.set(px, py, pz); _o.rotation.set(0, ry, 0); _o.rotateX(rx); _o.rotateZ(rz); _o.scale.set(sx * h, sy * h, sz * h); _o.updateMatrix(); m.setMatrixAt(k, _o.matrix); };
      set(iT, i, x, (casaco ? 1.02 : 1.2 + bob) * h, z, 0, 0, 1, 1, 0.75);
      set(iC, i, x, (1.72 + bob) * h, z);
      set(iH, i, x, (1.75 + bob) * h, z - 0.012 * h, -0.25);
      const c = Math.cos(ry), s = Math.sin(ry);
      for (const sd of [0, 1]) {
        const lx = sd ? 0.1 : -0.1;
        set(iP, i * 2 + sd, x + c * lx * h, (0.88 + bob) * h, z - s * lx * h, sd ? sw : -sw);
        const ax = sd ? 0.24 : -0.24;
        set(iB, i * 2 + sd, x + c * ax * h, (1.48 + bob) * h, z - s * ax * h, sd ? -sw * 0.8 : sw * 0.8, sd ? 0.08 : -0.08);
      }
    });
    mPele.u.uT.value = t;
    for (const m of [iT, iP, iC, iB, iH]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    aC.needsUpdate = true; aB.needsUpdate = true;
  }
  update(0);
  return { P, update, marca, tom, pele: mPele, meshes: [iT, iP, iC, iB, iH] };
}

/* ---------- estúdio escuro: piso com anel azul e fundo em degradê ---------- */
export function estudio(S, { raio = 3, cor = 0x15171c } = {}) {
  const g = new THREE.Group(); S.add(g);
  const piso = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.35, metalness: 0.2 }));
  piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; g.add(piso);
  const anel = new THREE.Mesh(new THREE.RingGeometry(raio, raio + 0.04, 96), new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0.55, toneMapped: false }));
  anel.rotation.x = -Math.PI / 2; anel.position.y = 0.005; g.add(anel);
  const poca = brilho(0xffd9b0, raio * 2.6, "suave", 0.18); poca.position.y = 0.02; g.add(poca);
  return { group: g, piso, anel, poca };
}

/* ---------- brilhos / bokeh ---------- */
const _tex = {};
export function glowTex(tipo = "suave") {
  if (_tex[tipo]) return _tex[tipo];
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (tipo === "disco") { gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.78, "rgba(255,255,255,0.75)"); gr.addColorStop(0.9, "rgba(255,255,255,0.95)"); gr.addColorStop(1, "rgba(255,255,255,0)"); }
  else { gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.15, "rgba(255,255,255,0.6)"); gr.addColorStop(0.4, "rgba(255,255,255,0.15)"); gr.addColorStop(1, "rgba(255,255,255,0)"); }
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (_tex[tipo] = t);
}
export function brilho(cor, tam, tipo = "suave", op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(tipo), color: cor, transparent: true, opacity: op,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  s.scale.setScalar(tam);
  return s;
}
export function bokeh(S, { n = 26, seed = 3, centro = [0, 0, -40], area = [40, 30, 10], cores = [0xffb36b, 0xffd49a, 0xff8a4c, 0x9fc8ff], tam = [3, 8], op = 0.35 } = {}) {
  const R = mulberry32(seed), L = [];
  for (let i = 0; i < n; i++) {
    const b = brilho(cores[Math.floor(R() * cores.length)], lerp(tam[0], tam[1], R()), "disco", op * (0.5 + R() * 0.5));
    b.position.set(centro[0] + (R() - 0.5) * area[0], centro[1] + (R() - 0.5) * area[1], centro[2] + (R() - 0.5) * area[2]);
    S.add(b); L.push(b);
  }
  return L;
}

/* ---------- mancha 2D (para texturas de canvas): núcleo escuro irregular + veios laranja ---------- */
const _manchas = new Map();
export function mancha2D(seed = 1, tam = 128) {
  const k = seed + "/" + tam; if (_manchas.has(k)) return _manchas.get(k);
  const c = document.createElement("canvas"); c.width = c.height = tam;
  const g = c.getContext("2d"), R = mulberry32(seed), h = tam / 2;
  for (let i = 0; i < 9; i++) {
    const a = R() * 6.283, d = R() * h * 0.35, r = h * (0.22 + R() * 0.25), x = h + Math.cos(a) * d, y = h + Math.sin(a) * d;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(46,18,10,0.95)"); gr.addColorStop(0.7, "rgba(60,24,12,0.8)"); gr.addColorStop(1, "rgba(60,24,12,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
  }
  g.strokeStyle = "rgba(255,138,76,0.95)"; g.lineCap = "round"; g.shadowColor = "#ff8a4c"; g.shadowBlur = tam * 0.05;
  const ramo = (x, y, a, L, w, n) => {
    if (n <= 0 || L < 2) return;
    const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
    g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + (R() - 0.5) * L * 0.5, (y + y2) / 2 + (R() - 0.5) * L * 0.5, x2, y2); g.stroke();
    ramo(x2, y2, a + 0.5 + R() * 0.3, L * 0.62, w * 0.7, n - 1); ramo(x2, y2, a - 0.5 - R() * 0.3, L * 0.62, w * 0.7, n - 1);
  };
  for (let i = 0; i < 5; i++) ramo(h, h, R() * 6.283, h * 0.3, tam * 0.025, 3);
  _manchas.set(k, c); return c;
}

/* ---------- 2D por cima do canvas ---------- */
const _pv = new THREE.Vector3();
export function proj(v, cam) {
  cam.updateMatrixWorld(); _pv.set(v[0] ?? v.x, v[1] ?? v.y, v[2] ?? v.z).project(cam);
  return [(_pv.x + 1) * 540, (1 - _pv.y) * 960, _pv.z];
}
const FAM = { mono: '"JetBrains Mono", ui-monospace, monospace', inter: '"Inter", sans-serif' };
export function txt(ctx, s, x, y, { tam = 34, cor = "#fff", fonte = "mono", peso = 600, al = "center", a = 1, base = "middle", esp = 0.12, italico = false } = {}) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, a);
  ctx.font = `${italico ? "italic " : ""}${peso} ${tam}px ${FAM[fonte] || FAM.mono}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = (fonte === "mono" ? esp * tam : 0) + "px";
  ctx.textAlign = al; ctx.textBaseline = base;
  ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = tam * 0.4; ctx.shadowOffsetY = tam * 0.05;
  ctx.fillStyle = cor; ctx.fillText(s, x, y);
  ctx.restore();
}
export function pilula(ctx, x, y, w, h, a = 1, borda = "rgba(124,200,255,0.45)") {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = "rgba(8,10,20,0.62)";
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, Math.min(18, h * 0.3)); ctx.fill();
  ctx.strokeStyle = borda; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
// rótulo técnico: ponto no alvo (ax, ay), linha fina até (bx, by) e texto mono
export function tag(ctx, ax, ay, bx, by, s, { cor = AZUL, a = 1, tam = 28, al = null } = {}) {
  if (a <= 0.003) return;
  const k = ease.outCubic(clamp(a * 1.6));
  ctx.save(); ctx.globalAlpha = Math.min(1, a);
  ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ax, ay, 7, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.arc(ax, ay, 15 + 10 * (1 - k), 0, 6.283); ctx.globalAlpha = Math.min(1, a) * 0.5; ctx.stroke(); ctx.globalAlpha = Math.min(1, a);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lerp(ax, bx, k), lerp(ay, by, k)); ctx.stroke();
  ctx.restore();
  const left = al ? al === "left" : bx >= ax;
  txt(ctx, s, bx + (left ? 14 : -14), by, { tam, cor, al: left ? "left" : "right", a: a * k });
}
export async function fontes() {
  try { await Promise.all(['600 40px "JetBrains Mono"', '300 40px "Inter"', '800 40px "Inter"', 'italic 300 40px "Inter"'].map((f) => document.fonts.load(f))); } catch (e) { /* fallback */ }
}
// véu escuro atrás dos rótulos centrais (legibilidade sobre fundos claros)
export function veu(ctx, a = 0.5, y = 840, rx = 520, ry = 230) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.translate(540, y); ctx.scale(1, ry / rx);
  const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, "rgba(6,8,14,0.75)"); gr.addColorStop(0.6, "rgba(6,8,14,0.45)"); gr.addColorStop(1, "rgba(6,8,14,0)");
  ctx.fillStyle = gr; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
}
export const fade = (t, a, b, f = 0.3) => clamp(Math.min((t - a) / f, (b - t) / f));
