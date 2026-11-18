/**
 * particles.js — campo de partículas instanciado: moléculas (pares de esferas) ou neve. De f03.
 *
 *   const p = createParticles(scene, { tipo: "molecula", n: 340, paraEm: 1.2, caiEm: 2.6 });
 *   p.update(t)
 *
 * molecula: correm em linha reta (com wrap na caixa), param em `paraEm` (freio exponencial),
 *   ganham geada e brilho, e caem com gravidade a partir de `caiEm` (+ atraso aleatório até 0,5 s).
 * neve: flocos caindo sempre, com balanço lateral e brilho; `paraEm` congela no ar (opcional).
 * Câmera sugerida: z 20-34 olhando a origem, fov 35, névoa (14, 52) com fundo 0x121b26.
 */
import * as THREE from "../three.module.js";
import { PALETTE, mulberry32, range, lerp, ease } from "../kit.js";

export function createParticles(scene, {
  tipo = "molecula",
  n = 340,
  seed = 2026,
  caixa = { x: 14, y: 22, z0: -34, z1: 12 },
  paraEm = tipo === "molecula" ? 1.2 : Infinity,
  caiEm = tipo === "molecula" ? 2.6 : -Infinity,
  cores = tipo === "molecula" ? [0xa9bdd2, PALETTE.accent] : [0xf6f9fc, 0xdcebf7],
  fracao2 = 0.22,          // fração com a segunda cor (O₂ no original)
  brilho = true,
  velocidade = tipo === "molecula" ? [7, 14] : [1.5, 3],
} = {}) {
  const mol = tipo === "molecula";
  const rnd = mulberry32(seed);
  const te = (t) => (t < paraEm ? t : paraEm + 0.2 * (1 - Math.exp(-(t - paraEm) / 0.07)));
  const P = [];
  for (let i = 0; i < n; i++) {
    const pf = new THREE.Vector3((rnd() * 2 - 1) * caixa.x, (rnd() * 2 - 1) * caixa.y, lerp(caixa.z0, caixa.z1, rnd()));
    const dir = mol
      ? new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize()
      : new THREE.Vector3((rnd() - 0.5) * 0.3, -1, (rnd() - 0.5) * 0.3).normalize();
    P.push({
      pf, v: dir.multiplyScalar(lerp(velocidade[0], velocidade[1], rnd())), b: rnd() < fracao2,
      ax: new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize(), w: 4 + rnd() * 8, a0: rnd() * 6.28,
      fall0: caiEm + rnd() * 0.5, g: 5 + rnd() * 3, sway: rnd() * 6.28, ph: rnd() * 6.28, fr: 9 + rnd() * 9,
    });
  }
  const R = mol ? 0.42 : 0.16, BOND = mol ? 0.36 : 0;
  const per = mol ? 2 : 1;
  const geo = mol ? new THREE.IcosahedronGeometry(R, 2) : new THREE.IcosahedronGeometry(R, 0);
  const atoms = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.5, flatShading: true }), n * per);
  atoms.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  atoms.frustumCulled = false;
  scene.add(atoms);
  const cA = new THREE.Color(cores[0]), cB = new THREE.Color(cores[1]), frost = new THREE.Color(0xeaf4fb), col = new THREE.Color();
  for (let i = 0; i < n * per; i++) atoms.setColorAt(i, cA);

  // brilho: um ponto aditivo em estrela por partícula
  const gPos = new Float32Array(n * 3), gB = new Float32Array(n);
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute("position", new THREE.BufferAttribute(gPos, 3));
  gGeo.setAttribute("aB", new THREE.BufferAttribute(gB, 1));
  const glitter = new THREE.Points(gGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aB; varying float vB;
      void main(){ vB = aB; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = (14.0 + 70.0 * aB) * (10.0 / max(1.0, -mv.z)); }`,
    fragmentShader: `varying float vB;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d);
        float star = max(0.0, 1.0 - abs(d.x) * 14.0) * max(0.0, 1.0 - abs(d.y) * 2.2) + max(0.0, 1.0 - abs(d.y) * 14.0) * max(0.0, 1.0 - abs(d.x) * 2.2);
        float a = (exp(-r * r * 60.0) + star * 0.8) * vB; if (a < 0.003) discard;
        gl_FragColor = vec4(vec3(0.85, 0.94, 1.0) * a, 1.0); }`,
  }));
  glitter.frustumCulled = false;
  glitter.visible = brilho;
  scene.add(glitter);

  const wrap = (x, a, b) => { const w = b - a; return a + ((((x - a) % w) + w) % w); };
  const pos = new THREE.Vector3(), Q = new THREE.Quaternion(), OFF = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), m4 = new THREE.Matrix4();
  const tmp = new THREE.Vector3();

  function posicao(p, t, out) {
    out.copy(p.pf).addScaledVector(p.v, te(t));
    out.x = wrap(out.x, -caixa.x, caixa.x); out.y = wrap(out.y, -caixa.y, caixa.y); out.z = wrap(out.z, caixa.z0, caixa.z1);
    const f = Math.max(0, t - p.fall0);
    out.y -= 0.5 * p.g * f * f;
    const sw = mol ? 0.35 * Math.min(1, f) : 0.6;
    out.x += Math.sin(p.sway + (mol ? f : t) * 2.2) * sw;
    return out;
  }

  function update(t) {
    const frz = mol ? ease.outCubic(range(t, paraEm + 0.02, paraEm + 0.4)) : 1;
    for (let i = 0; i < n; i++) {
      const p = P[i];
      posicao(p, t, pos);
      const f = Math.max(0, t - p.fall0);
      Q.setFromAxisAngle(p.ax, p.a0 + p.w * te(t) * (mol ? 1 : 0.15) + f * 1.5);
      if (mol) {
        OFF.set(BOND, 0, 0).applyQuaternion(Q);
        m4.compose(tmp.copy(pos).add(OFF), Q, S); atoms.setMatrixAt(2 * i, m4);
        m4.compose(tmp.copy(pos).sub(OFF), Q, S); atoms.setMatrixAt(2 * i + 1, m4);
        col.copy(p.b ? cB : cA).lerp(frost, frz * (p.b ? 0.35 : 0.55));
        atoms.setColorAt(2 * i, col); atoms.setColorAt(2 * i + 1, col);
      } else {
        m4.compose(pos, Q, tmp.set(1, 0.35, 1)); atoms.setMatrixAt(i, m4);
        atoms.setColorAt(i, p.b ? cB : cA);
      }
      gPos[3 * i] = pos.x; gPos[3 * i + 1] = pos.y + R * 0.7; gPos[3 * i + 2] = pos.z + R;
      const tw = Math.pow(Math.max(0, Math.sin(p.ph + t * p.fr)), 14);
      gB[i] = frz * (0.15 + 0.85 * tw);
    }
    atoms.instanceMatrix.needsUpdate = true;
    atoms.instanceColor.needsUpdate = true;
    gGeo.attributes.position.needsUpdate = true;
    gGeo.attributes.aB.needsUpdate = true;
  }

  return { atoms, glitter, posicao: (i, t, out = new THREE.Vector3()) => posicao(P[i], t, out), update };
}
